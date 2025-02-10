#!/usr/bin/env python3
"""
birdnet_analysis.py

Adapted from Nachtzuster/BirdNET-Pi (https://github.com/Nachtzuster/BirdNET-Pi)
This script performs realtime acoustic bird classification using a TFLite model.
Proper attribution is given to the original repository. Please check the repository LICENSE for details.
"""

import sys
import json
import argparse
try:
    import tflite_runtime.interpreter as tflite  # type: ignore
except ImportError:
    import tensorflow.lite as tflite  # type: ignore

import numpy as np  # type: ignore
import wave



def load_model_and_labels(model_path, labels_path):
    # Load the TFLite model and allocate tensors
    interpreter = tflite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    
    # Load labels from the labels file
    with open(labels_path, 'r') as f:
        labels = [line.strip() for line in f if line.strip()]
    return interpreter, labels


def process_audio(interpreter, audio_data):
    # Get model input and output details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Prepare input: assume audio_data is a flat array of floats
    input_data = np.array(audio_data, dtype=np.float32)
    input_data = np.expand_dims(input_data, axis=0)  # model expects shape [1, N]

    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]['index'])
    return output_data.tolist()[0]


def main():
    parser = argparse.ArgumentParser(description="BirdNET Analysis Script")
    parser.add_argument('--model', type=str, required=True, help="Path to TFLite model")
    parser.add_argument('--labels', type=str, required=True, help="Path to labels file")
    parser.add_argument('--wav', type=str, help="Path to WAV file for processing (if not provided, reads from STDIN)")
    args = parser.parse_args()
    
    interpreter, labels = load_model_and_labels(args.model, args.labels)
    
    # Read audio data
    if args.wav:
        with wave.open(args.wav, 'rb') as wf:
            n_frames = wf.getnframes()
            audio_bytes = wf.readframes(n_frames)
            # Convert bytes to numpy array (assumes 16-bit PCM)
            audio_data = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    else:
        audio_bytes = sys.stdin.buffer.read()
        audio_data = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    
    # Process the audio data through the model
    output = process_audio(interpreter, audio_data)

    # Postprocess output: map scores to species labels where score exceeds threshold
    detections = []
    threshold = 0.7  # example threshold; can be adjusted as needed
    for i, score in enumerate(output):
        if score >= threshold:
            species = labels[i] if i < len(labels) else f"Species {i}"
            detections.append({"species": species, "confidence": score})
    
    # Sort results by descending confidence
    detections.sort(key=lambda x: x["confidence"], reverse=True)

    # Print detections as JSON
    print(json.dumps(detections))


if __name__ == "__main__":
    main() 