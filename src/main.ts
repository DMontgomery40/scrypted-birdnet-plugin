import {
    ScryptedDeviceBase,
    DeviceProvider,
    DeviceCreator,
    Device,
    ScryptedInterface,
    Setting,
    Settings,
    MediaManager,
    DeviceManager,
    ScryptedDeviceType,
    ScryptedNativeId,
    DeviceCreatorSettings,
    SettingValue,
    sdk
} from '@scrypted/sdk';
import { StorageSettings } from "@scrypted/sdk/storage-settings";
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { PassThrough } from 'stream';
import { join } from 'path';
import { readFileSync } from 'fs';
import http from 'http';
import crypto from 'crypto';

const { deviceManager } = sdk;

class BirdNETDevice extends ScryptedDeviceBase implements Settings {
    storageSettings = new StorageSettings(this, {
        mode: {
            title: 'Operation Mode',
            description: 'Choose between self-contained (uses bundled model) or external (connects to existing BirdNET instance)',
            value: this.storage.getItem('mode') || 'self-contained',
            choices: ['self-contained', 'external'],
        },
        audioSource: {
            title: 'Audio Source',
            description: 'Select audio input source',
            value: this.storage.getItem('audioSource') || 'mic',
            choices: ['mic', 'rtsp'],
        },
        rtspAudioURL: {
            title: 'RTSP Audio URL',
            description: 'URL for RTSP audio stream (only used if Audio Source is set to rtsp)',
            value: this.storage.getItem('rtspAudioURL'),
            placeholder: 'rtsp://camera.example.com/audio',
        },
        birdnetUIURL: {
            title: 'External BirdNET URL',
            description: 'URL of external BirdNET instance (only used in external mode)',
            value: this.storage.getItem('birdnetUIURL') || 'http://birdnet.local:8080',
            placeholder: 'http://birdnet.local:8080',
        },
        birdnetThreshold: {
            title: 'Detection Threshold',
            description: 'Minimum confidence threshold for bird detection (0.0 to 1.0)',
            type: 'number',
            value: parseFloat(this.storage.getItem('birdnetThreshold') || '0.7'),
            placeholder: '0.7',
        }
    });

    // Process references for managing child processes
    birdnetProcess: ChildProcessWithoutNullStreams | null = null;
    audioStream: PassThrough | null = null;
    ffmpegAudioProcess: ChildProcessWithoutNullStreams | null = null;

    // TTY output storage
    ttyOutput: string = "";

    constructor(nativeId: string) {
        super(nativeId);
        this.startBirdNET();
    }

    async getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        await this.storageSettings.putSetting(key, value);
        await this.startBirdNET();
    }

    async startBirdNET() {
        try {
            // Stop any existing processes
            this.dispose();

            const settings = this.storageSettings.values;
            
            if (settings.mode === 'external') {
                if (settings.audioSource === 'rtsp') {
                    this.audioStream = new PassThrough();
                    this.startAudioCapture();
                }
                this.console.log('Starting external BirdNET-Go...');
                try {
                    await new Promise((resolve, reject) => {
                        const proc = spawn('which', ['birdnet-go']);
                        proc.on('exit', (code) => code === 0 ? resolve(null) : reject());
                    });
                } catch (e) {
                    throw new Error('BirdNET-Go not found. Please install BirdNET-Go first.');
                }
                this.birdnetProcess = spawn('birdnet-go', [
                    'realtime',
                    '--threshold', settings.birdnetThreshold.toString(),
                    '--locale', 'en',
                    ...(settings.audioSource === 'rtsp' ? ['--audio-stdin'] : [])
                ]);
                if (settings.audioSource === 'rtsp' && this.audioStream) {
                    this.audioStream.pipe(this.birdnetProcess.stdin);
                }
                this.birdnetProcess.stdout.on('data', (data) => {
                    const text = data.toString();
                    this.updateTTYDisplayFromExternal(text);
                });
                this.birdnetProcess.stderr.on('data', (data) => {
                    this.console.error(data.toString());
                });
                this.birdnetProcess.on('exit', (code) => {
                    this.console.log(`BirdNET-Go exited with code ${code}`);
                });
            } else if (settings.mode === 'self-contained') {
                this.console.log('Initializing self-contained BirdNET analysis');
                if (settings.audioSource === 'rtsp') {
                    this.audioStream = new PassThrough();
                    this.startAudioCapture();
                }
                this.processSelfContainedAudio();
            }
        } catch (err) {
            this.console.error('Error in startBirdNET:', err);
        }
    }

    processSelfContainedAudio() {
        const bufferChunks: Buffer[] = [];
        if (this.audioStream) {
            this.audioStream.on('data', async (chunk: Buffer) => {
                bufferChunks.push(chunk);
                // Assuming mono 16-bit PCM at 48000 Hz, 1 second ~ 48000 samples * 2 bytes/sample
                const THRESHOLD = 48000 * 2;
                const totalLength = bufferChunks.reduce((sum, buf) => sum + buf.length, 0);
                if (totalLength >= THRESHOLD) {
                    const buffer = Buffer.concat(bufferChunks);
                    bufferChunks.length = 0;
                    const samples = new Float32Array(buffer.length / 2);
                    for (let i = 0; i < samples.length; i++) {
                        samples[i] = buffer.readInt16LE(i * 2) / 32768;
                    }
                    try {
                        const predictions = await this.analyzeAudioChunk(samples);
                        this.console.log('Self-contained predictions:', predictions);
                        this.updateTTYDisplayFromSelfContained(predictions);
                    } catch (err) {
                        this.console.error('Error analyzing audio chunk:', err);
                    }
                }
            });
        }
    }

    updateTTYDisplayFromExternal(text: string) {
        this.console.log('External UI Output:', text);
        this.ttyOutput += text + "\n";
    }

    updateTTYDisplayFromSelfContained(predictions: any) {
        const predictionText = JSON.stringify(predictions, null, 2);
        this.console.log('Self-contained Analysis UI:', predictionText);
        this.ttyOutput += predictionText + "\n";
    }

    private pollExternalBirdNET() {
        const pollInterval = 1000; // Poll every second
        setInterval(() => {
            http.get(this.storageSettings.values.birdnetUIURL, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const detections = JSON.parse(data);
                        if (Array.isArray(detections)) {
                            this.updateTTYDisplay(detections);
                        }
                    } catch (e) {
                        process.stdout.write(`\x1b[31mError parsing external BirdNET data\x1b[0m\n`);
                    }
                });
            }).on('error', (err) => {
                process.stdout.write(`\x1b[31mError connecting to external BirdNET: ${err.message}\x1b[0m\n`);
            });
        }, pollInterval);
    }

    private updateTTYDisplay(detections: Array<{species: string, confidence: number}>) {
        // Clear screen and move cursor home
        process.stdout.write('\x1Bc\x1b[H');
        
        // Header
        process.stdout.write('\x1b[1m=== BirdNET Detections ===\x1b[0m\n\n');
        
        // Mode indicator
        process.stdout.write(`Mode: ${this.storageSettings.values.mode}\n`);
        if (this.storageSettings.values.mode === 'external') {
            process.stdout.write(`Source: ${this.storageSettings.values.birdnetUIURL}\n`);
        } else {
            process.stdout.write(`Audio: ${this.storageSettings.values.audioSource}\n`);
        }
        process.stdout.write('\n');

        // Detections
        if (detections.length === 0) {
            process.stdout.write('No birds detected\n');
        } else {
            detections.forEach(({species, confidence}) => {
                const confidencePct = (confidence * 100).toFixed(1);
                process.stdout.write(`\x1b[1m${species}\x1b[0m (${confidencePct}%)\n`);
            });
        }

        // Footer
        process.stdout.write('\n\x1b[2mPress Ctrl+C to exit\x1b[0m\n');
    }

    startAudioCapture() {
        if (this.storageSettings.values.audioSource === 'rtsp') {
            this.ffmpegAudioProcess = spawn('ffmpeg', [
                '-i', this.storageSettings.values.rtspAudioURL,
                '-vn',
                '-acodec', 'pcm_s16le',
                '-ar', '48000',
                '-ac', '1',
                '-f', 'wav',
                'pipe:1'
            ]);

            this.ffmpegAudioProcess.stdout.pipe(this.audioStream!);
            
            this.ffmpegAudioProcess.on('error', (err) => {
                this.console.error('FFmpeg audio capture error:', err);
            });
        }
    }

    async analyzeAudioChunk(samples: Float32Array) {
        try {
            // Create WAV buffer from samples
            const wavBuffer = this.createWavBuffer(samples);
            // Write temporary WAV file
            const os = require('os');
            const fs = require('fs');
            const path = require('path');
            const tmpDir = os.tmpdir();
            const tmpFile = path.join(tmpDir, `birdnet-${Date.now()}.wav`);
            fs.writeFileSync(tmpFile, wavBuffer);

            return new Promise((resolve, reject) => {
                const pythonScript = path.join(process.env.SCRYPTED_PLUGIN_PATH || '', 'python/birdnet_analysis.py');
                const pythonProcess = spawn('python3', [
                    pythonScript,
                    '--model', path.join(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/BirdNET_GLOBAL_6K_V2.4_Model_FP16.tflite'),
                    '--labels', path.join(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/labels_nm.txt'),
                    '--wav', tmpFile
                ]);
                let stdoutData = '';
                let stderrData = '';
                pythonProcess.stdout.on('data', data => { stdoutData += data.toString(); });
                pythonProcess.stderr.on('data', data => { stderrData += data.toString(); });
                pythonProcess.on('close', code => {
                    fs.unlinkSync(tmpFile);
                    if (code === 0) {
                        try {
                            const detections = JSON.parse(stdoutData);
                            resolve(detections);
                        } catch(err) {
                            reject(new Error('Error parsing Python output: ' + err.message));
                        }
                    } else {
                        reject(new Error('Python process exited with code ' + code + ': ' + stderrData));
                    }
                });
            });
        } catch (err) {
            this.console.error('Audio analysis error:', err);
            throw err;
        }
    }

    private createWavBuffer(samples: Float32Array): Buffer {
        const numChannels = 1;
        const sampleRate = 48000;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * bitsPerSample / 8;
        const blockAlign = numChannels * bitsPerSample / 8;
        const dataLength = samples.length * 2; // 2 bytes per sample
        const buffer = Buffer.alloc(44 + dataLength);
        // RIFF header
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(36 + dataLength, 4);
        buffer.write('WAVE', 8);
        // fmt subchunk
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16);
        buffer.writeUInt16LE(1, 20); // PCM
        buffer.writeUInt16LE(numChannels, 22);
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE(byteRate, 28);
        buffer.writeUInt16LE(blockAlign, 32);
        buffer.writeUInt16LE(bitsPerSample, 34);
        // data subchunk
        buffer.write('data', 36);
        buffer.writeUInt32LE(dataLength, 40);
        
        for (let i = 0; i < samples.length; i++) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            let intSample = Math.round(s * 32767);
            buffer.writeInt16LE(intSample, 44 + i * 2);
        }
        return buffer;
    }

    // Implement Web interface
    async getResource(requestBody: string): Promise<string> {
        // Create a more structured and styled HTML page
        return `
<!DOCTYPE html>
<html>
<head>
    <title>BirdNET Detection Results</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="10">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: monospace;
        }
        .status {
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 4px;
        }
        .status.running {
            background-color: #d4edda;
            color: #155724;
        }
        .status.stopped {
            background-color: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>BirdNET Detection Results</h1>
        <div class="status ${this.birdnetProcess ? 'running' : 'stopped'}">
            Status: ${this.birdnetProcess ? 'Running' : 'Stopped'}
        </div>
        <pre>${this.ttyOutput || 'No detections yet...'}</pre>
    </div>
    <script>
        // Auto-scroll to bottom
        window.onload = function() {
            window.scrollTo(0, document.body.scrollHeight);
        };
    </script>
</body>
</html>`;
    }

    dispose() {
        if (this.birdnetProcess) {
            this.birdnetProcess.kill();
            this.birdnetProcess = null;
        }
        
        if (this.ffmpegAudioProcess) {
            this.ffmpegAudioProcess.kill();
            this.ffmpegAudioProcess = null;
        }
        if (this.audioStream) {
            this.audioStream.destroy();
            this.audioStream = null;
        }
    }
}

class BirdNETPlugin extends ScryptedDeviceBase implements DeviceCreator, DeviceProvider {
    devices = new Map<string, BirdNETDevice>();

    constructor(nativeId?: string) {
        super(nativeId);
    }

    async getCreateDeviceSettings(): Promise<Setting[]> {
        return [
            {
                key: 'name',
                title: 'Name',
                description: 'Name for the BirdNET detector',
            }
        ];
    }

    async createDevice(settings: DeviceCreatorSettings): Promise<string> {
        const nativeId = crypto.randomUUID();
        const name = settings.name?.toString() || 'BirdNET Detector';
        
        await deviceManager.onDeviceDiscovered({
            nativeId,
            name,
            type: ScryptedDeviceType.Sensor,
            interfaces: [
                ScryptedInterface.Settings
            ],
        });

        await this.getDevice(nativeId);
        return nativeId;
    }

    async getDevice(nativeId: string) {
        let device = this.devices.get(nativeId);
        if (!device) {
            device = new BirdNETDevice(nativeId);
            this.devices.set(nativeId, device);
        }
        return device;
    }

    async releaseDevice(id: string, nativeId: string): Promise<void> {
        const device = this.devices.get(nativeId);
        if (device) {
            device.dispose();
            this.devices.delete(nativeId);
        }
    }
}

export default BirdNETPlugin;
  