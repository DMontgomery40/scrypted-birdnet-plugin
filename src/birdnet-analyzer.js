"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModelAndLabels = loadModelAndLabels;
exports.createSpectrogram = createSpectrogram;
exports.predict = predict;
const sdk_1 = __importDefault(require("@scrypted/sdk"));
const fft_js_1 = __importDefault(require("fft.js"));
const fs_1 = require("fs");
const path_1 = require("path");
const { systemManager } = sdk_1.default;
// Instead of top-level await, we'll initialize in a function
let tflite;
async function initTFLite() {
    if (!tflite) {
        tflite = await systemManager.getComponent('tensorflow-lite');
    }
    return tflite;
}
// Constants from BirdNET-Analyzer
const SAMPLE_RATE = 48000;
const SPEC_LENGTH = 384;
const MEL_BANDS = 128;
const WINDOW_SIZE = 2048;
const HOP_LENGTH = 1024;
// Use absolute paths from plugin root
const MODEL_PATH = (0, path_1.join)(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/BirdNET_GLOBAL_6K_V2.4_Model_FP16.tflite');
const LABELS_PATH = (0, path_1.join)(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/labels_en.txt');
async function loadModelAndLabels() {
    try {
        // Initialize TFLite first
        tflite = await initTFLite();
        // Read the model file
        const modelBuffer = (0, fs_1.readFileSync)(MODEL_PATH);
        // Read and parse the English labels file
        const labelsText = (0, fs_1.readFileSync)(LABELS_PATH, 'utf8');
        const labels = labelsText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        // Load model using Scrypted's TFLite
        const model = await tflite.loadModel(modelBuffer);
        return { model, labels };
    }
    catch (err) {
        console.error('Error loading model/labels:', err);
        throw err;
    }
}
async function createSpectrogram(samples) {
    try {
        // Create overlapping windows
        const frames = [];
        for (let i = 0; i < samples.length - WINDOW_SIZE; i += HOP_LENGTH) {
            const frame = samples.slice(i, i + WINDOW_SIZE);
            frames.push(frame);
        }
        // Apply FFT to each frame
        const fft = new fft_js_1.default(WINDOW_SIZE);
        const spectrogramFrames = frames.map(frame => {
            // Apply Hann window
            const windowedFrame = frame.map((x, i) => x * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (WINDOW_SIZE - 1))));
            // Compute FFT
            const fftResult = fft.createComplexArray();
            fft.realTransform(fftResult, windowedFrame);
            // Get magnitude
            const magnitudes = new Float32Array(WINDOW_SIZE / 2 + 1);
            for (let i = 0; i < magnitudes.length; i++) {
                const real = fftResult[2 * i];
                const imag = fftResult[2 * i + 1];
                magnitudes[i] = Math.sqrt(real * real + imag * imag);
            }
            return magnitudes;
        });
        // Convert to mel scale
        const melBasis = createMelFilterbank(WINDOW_SIZE / 2 + 1, SAMPLE_RATE, MEL_BANDS);
        const melSpectrogram = spectrogramFrames.map(frame => {
            return applyMelFilterbank(frame, melBasis);
        });
        // Convert to dB scale and normalize
        const spec = new Float32Array(melSpectrogram.flat());
        const tensor = await tflite.createTensor(spec, [1, melSpectrogram.length, MEL_BANDS, 1]);
        return tensor;
    }
    catch (err) {
        console.error('Error creating spectrogram:', err);
        throw err;
    }
}
function createMelFilterbank(nFft, sampleRate, nMels) {
    // Create mel scale points
    const melMax = freqToMel(sampleRate / 2);
    const melMin = freqToMel(0);
    const melStep = (melMax - melMin) / (nMels + 1);
    const melFreqs = Array.from({ length: nMels + 2 }, (_, i) => melMin + melStep * i);
    const freqPoints = melFreqs.map(mel => melToFreq(mel));
    // Create filterbank matrix
    const filterbank = new Array(nMels).fill(0).map(() => new Float32Array(nFft));
    for (let i = 0; i < nMels; i++) {
        const f_left = freqPoints[i];
        const f_center = freqPoints[i + 1];
        const f_right = freqPoints[i + 2];
        for (let j = 0; j < nFft; j++) {
            const freq = (j * sampleRate) / (2 * nFft);
            if (freq >= f_left && freq <= f_right) {
                if (freq <= f_center) {
                    filterbank[i][j] = (freq - f_left) / (f_center - f_left);
                }
                else {
                    filterbank[i][j] = (f_right - freq) / (f_right - f_center);
                }
            }
        }
    }
    return filterbank;
}
function freqToMel(freq) {
    return 2595 * Math.log10(1 + freq / 700);
}
function melToFreq(mel) {
    return 700 * (Math.pow(10, mel / 2595) - 1);
}
function applyMelFilterbank(spectrum, filterbank) {
    return filterbank.map(filter => {
        let sum = 0;
        for (let i = 0; i < spectrum.length; i++) {
            sum += spectrum[i] * filter[i];
        }
        return sum;
    });
}
async function predict(model, spectrogram) {
    try {
        // Run inference using TFLite
        const predictions = await model.predict(spectrogram);
        return predictions;
    }
    catch (err) {
        console.error('Error during prediction:', err);
        throw err;
    }
}
//# sourceMappingURL=birdnet-analyzer.js.map