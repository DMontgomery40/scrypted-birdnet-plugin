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
    sdk
} from '@scrypted/sdk';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { PassThrough } from 'stream';
import { join } from 'path';
import { readFileSync } from 'fs';
import http from 'http';

class BirdNETPlugin extends ScryptedDeviceBase implements DeviceProvider, DeviceCreator {
    devices: Map<string, any> = new Map();
    mediaManager: MediaManager;
    deviceManager: DeviceManager;

    // Process references for managing child processes
    birdnetProcess: ChildProcessWithoutNullStreams | null = null;
    audioStream: PassThrough | null = null;
    ffmpegAudioProcess: ChildProcessWithoutNullStreams | null = null;

    // Plugin settings
    settings: { [key: string]: any } = {};

    // TTY output storage
    ttyOutput: string = "";

    constructor(nativeId?: string) {
        super(nativeId);
        this.mediaManager = sdk.mediaManager;
        this.deviceManager = sdk.deviceManager;
        
        this.loadSettings();
        this.startBirdNET();
    }

    loadSettings() {
        this.settings.mode = this.storage.getItem('mode') || 'self-contained';
        this.settings.birdnetUIURL = this.storage.getItem('birdnetUIURL') || 'http://birdnet.local:8080';
        this.settings.audioSource = this.storage.getItem('audioSource') || 'mic';
        this.settings.rtspAudioURL = this.storage.getItem('rtspAudioURL') || '';
        this.settings.birdnetThreshold = parseFloat(this.storage.getItem('birdnetThreshold') || '0.7');
    }

    async startBirdNET() {
        try {
            if (this.settings.mode === 'external') {
                if (this.settings.audioSource === 'rtsp') {
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
                    '--threshold', this.settings.birdnetThreshold.toString(),
                    '--locale', 'en',
                    ...(this.settings.audioSource === 'rtsp' ? ['--audio-stdin'] : [])
                ]);
                if (this.settings.audioSource === 'rtsp' && this.audioStream) {
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
            } else if (this.settings.mode === 'self-contained') {
                this.console.log('Initializing self-contained BirdNET analysis');
                if (this.settings.audioSource === 'rtsp') {
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
            http.get(this.settings.birdnetUIURL, (res) => {
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
        process.stdout.write(`Mode: ${this.settings.mode}\n`);
        if (this.settings.mode === 'external') {
            process.stdout.write(`Source: ${this.settings.birdnetUIURL}\n`);
        } else {
            process.stdout.write(`Audio: ${this.settings.audioSource}\n`);
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
        if (this.settings.audioSource === 'rtsp') {
            this.ffmpegAudioProcess = spawn('ffmpeg', [
                '-i', this.settings.rtspAudioURL,
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

    async getDevice(nativeId: string): Promise<Device> {
        const device = {
            name: "BirdNET Audio Detector",
            type: ScryptedDeviceType.Sensor,
            nativeId: nativeId,
            interfaces: [ScryptedInterface.Settings],
        };
        return device;
    }

    async createDevice(settings: DeviceCreatorSettings): Promise<string> {
        return settings.nativeId.toString();
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'mode',
                title: 'Operation Mode',
                description: 'Choose between self-contained (uses bundled model) or external (connects to existing BirdNET instance)',
                type: 'string',
                choices: ['self-contained', 'external'],
                value: this.settings.mode
            },
            {
                key: 'audioSource',
                title: 'Audio Source',
                description: 'Select audio input source',
                type: 'string',
                choices: ['mic', 'rtsp'],
                value: this.settings.audioSource
            },
            {
                key: 'rtspAudioURL',
                title: 'RTSP Audio URL',
                description: 'URL for RTSP audio stream (only used if Audio Source is set to rtsp)',
                type: 'string',
                value: this.settings.rtspAudioURL,
                placeholder: 'rtsp://camera.example.com/audio'
            },
            {
                key: 'birdnetUIURL',
                title: 'External BirdNET URL',
                description: 'URL of external BirdNET instance (only used in external mode)',
                type: 'string',
                value: this.settings.birdnetUIURL,
                placeholder: 'http://birdnet.local:8080'
            },
            {
                key: 'birdnetThreshold',
                title: 'Detection Threshold',
                description: 'Minimum confidence threshold for bird detection (0.0 to 1.0)',
                type: 'number',
                value: this.settings.birdnetThreshold,
                placeholder: '0.7'
            }
        ];
    }

    async putSetting(key: string, value: string | number): Promise<void> {
        this.storage.setItem(key, value.toString());
        this.settings[key] = value;
        // Restart the service when settings change
        await this.startBirdNET();
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

    async getCreateDeviceSettings(): Promise<Setting[]> {
        return [
            {
                key: 'name',
                title: 'Device Name',
                type: 'string',
            }
        ];
    }

    async releaseDevice(id: string, nativeId: ScryptedNativeId): Promise<void> {
        // Cleanup logic when device is removed
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
        return `<html><head><title>BirdNET TTY UI</title></head><body><pre>${this.ttyOutput}</pre></body></html>`;
    }
}

export default BirdNETPlugin;
  