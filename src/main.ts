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
    MediaObject,
    RequestMediaStreamOptions,
    FFmpegInput,
    VideoCamera,
    ResponseMediaStreamOptions,
    sdk
} from '@scrypted/sdk';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { PassThrough } from 'stream';
import { loadModelAndLabels, createSpectrogram, predict } from './birdnet-analyzer';
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

    // Add model property
    private model: any = null;
    private labels: any;

    // Plugin settings
    settings: { [key: string]: any } = {};

    constructor(nativeId?: string) {
        super(nativeId);
        this.mediaManager = sdk.mediaManager;
        this.deviceManager = sdk.deviceManager;
        
        this.loadSettings();
        if (this.settings.mode === 'self-contained') {
            this.initializeModel();
        }
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
            if (this.settings.mode === 'self-contained') {
                // Initialize audio stream for self-contained mode
                this.audioStream = new PassThrough();
                if (this.settings.audioSource === 'rtsp') {
                    this.startAudioCapture();
                }

                try {
                    this.console.log('Starting BirdNET-Go...');
                    
                    // Check if BirdNET-Go is installed
                    try {
                        await new Promise((resolve, reject) => {
                            const proc = spawn('which', ['birdnet-go']);
                            proc.on('exit', (code) => code === 0 ? resolve(null) : reject());
                        });
                    } catch (e) {
                        throw new Error('BirdNET-Go not found. Please install BirdNET-Go first.');
                    }
                    
                    // Start BirdNET-Go with appropriate flags
                    this.birdnetProcess = spawn('birdnet-go', [
                        'realtime',
                        '--threshold', this.settings.birdnetThreshold.toString(),
                        '--locale', 'en',
                        ...(this.settings.audioSource === 'rtsp' ? ['--audio-stdin'] : [])
                    ]);

                    if (this.settings.audioSource === 'rtsp') {
                        this.audioStream.pipe(this.birdnetProcess.stdin);
                    }

                    // Handle BirdNET-Go output in TTY
                    this.birdnetProcess.stdout.on('data', (data) => {
                        const text = data.toString();
                        const match = text.match(/Detected\s+(.+?)\s+\((0\.\d+)\)/);
                        if (match) {
                            const [_, species, confidence] = match;
                            const confidencePct = (parseFloat(confidence) * 100).toFixed(1);
                            this.updateTTYDisplay([{
                                species,
                                confidence: parseFloat(confidence)
                            }]);
                        }
                    });

                } catch (err: unknown) {
                    if (err instanceof Error) {
                        this.console.error('Failed to start BirdNET-Go:', err.message);
                        process.stdout.write(`\x1b[31mError: ${err.message}\x1b[0m\n`);
                    }
                    throw err;
                }
            } else {
                // External mode - poll the external BirdNET instance
                this.pollExternalBirdNET();
            }
        } catch (err: any) {
            this.console.error('Error starting BirdNET:', err.message);
            process.stdout.write(`\x1b[31mError: ${err.message}\x1b[0m\n`);
            throw err;
        }
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

    async getDevice(nativeId: string) {
        if (!this.devices.has(nativeId)) {
            const device = new BirdNETCameraDevice(nativeId);
            this.devices.set(nativeId, device);
        }
        return this.devices.get(nativeId);
    }

    async createDevice(device: {
        nativeId: string;
        name: string;
        type: ScryptedDeviceType;
        interfaces: string[];
    }): Promise<string> {
        // For a single device, we simply return the nativeId.
        return device.nativeId;
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'mode',
                title: 'Operation Mode',
                description: 'Select "self-contained" or "external" mode',
                type: 'string',
                value: this.settings.mode || 'self-contained'
            },
            {
                key: 'birdnetUIURL',
                title: 'BirdNET UI URL',
                description: 'URL for BirdNET UI when in external mode',
                type: 'string',
                value: this.settings.birdnetUIURL || 'http://birdnet.local:8080'
            },
            {
                key: 'audioSource',
                title: 'Audio Source',
                description: 'Choose "mic" for local microphone or "rtsp" for RTSP audio feed',
                type: 'string',
                value: this.settings.audioSource || 'mic'
            },
            {
                key: 'rtspAudioURL',
                title: 'RTSP Audio URL',
                description: 'RTSP URL for audio capture if using RTSP audio',
                type: 'string',
                value: this.settings.rtspAudioURL || ''
            },
            {
                key: 'birdnetThreshold',
                title: 'BirdNET Confidence Threshold',
                description: 'Confidence threshold for bird detection (e.g., 0.7)',
                type: 'number',
                value: this.settings.birdnetThreshold || 0.7
            }
        ];
    }

    async putSetting(key: string, value: string | number): Promise<void> {
        // Save the setting and update internal settings.
        this.storage.setItem(key, value.toString());
        this.settings[key] = value;
        // In this basic example, changes require a plugin restart to take effect.
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
            },
            // Add other settings as needed
        ];
    }

    async releaseDevice(id: string, nativeId: ScryptedNativeId): Promise<void> {
        // Cleanup logic when device is removed
    }

    async initializeModel() {
        try {
            // Load bundled model and labels
            const { model, labels } = await loadModelAndLabels();
            this.model = model;
            this.labels = labels;
            this.console.log('BirdNET model and labels loaded successfully');
        } catch (err) {
            this.console.error('Failed to initialize BirdNET model:', err);
        }
    }

    // Update analyzeAudioChunk
    async analyzeAudioChunk(samples: Float32Array) {
        try {
            if (!this.model) {
                throw new Error('Model not loaded');
            }

            // Create spectrogram
            const spectrogram = await createSpectrogram(samples);
            
            // Run inference
            const predictions = await predict(this.model, spectrogram);
            
            // Process results
            const results = this.postprocessResults(predictions);
            
            // Log detections
            for (const result of results) {
                if (result.confidence >= this.settings.birdnetThreshold) {
                    this.console.log(
                        `BirdNET Detection: ${result.species} (${(result.confidence * 100).toFixed(1)}% confidence)`
                    );
                }
            }

            // Clean up
            spectrogram.dispose();
            
        } catch (err) {
            this.console.error('Audio analysis error:', err);
        }
    }

    // Implement Web interface
    async getResource(requestBody: string): Promise<string> {
        if (this.settings.mode === 'external') {
            return this.settings.birdnetUIURL;
        }
        return 'http://localhost:8080';
    }

    postprocessResults(predictions: any) {
        // Implement BirdNET's post-processing
        // Convert raw model output to species predictions
        try {
            // Get the label mapping from BirdNET-Analyzer
            const labelMap = require('./labels.json');
            
            // Convert predictions to species confidence scores
            const results = [];
            for (let i = 0; i < predictions.length; i++) {
                if (predictions[i] > this.settings.birdnetThreshold) {
                    results.push({
                        species: labelMap[i],
                        confidence: predictions[i]
                    });
                }
            }

            // Sort by confidence
            results.sort((a, b) => b.confidence - a.confidence);

            return results;

        } catch (err) {
            this.console.error('Results post-processing error:', err);
            throw err;
        }
    }
}

class BirdNETCameraDevice extends ScryptedDeviceBase implements VideoCamera {
    mediaManager: MediaManager;
    x11Camera: any;

    constructor(nativeId: string) {
        super(nativeId);
        this.mediaManager = sdk.mediaManager;
    }

    async getVideoStreamOptions(): Promise<ResponseMediaStreamOptions[]> {
        return [{
            id: 'default',
            name: 'Default',
            video: {
                width: 1280,
                height: 720,
                fps: 15,
            },
            container: 'rtsp',
        }];
    }

    async getVideoStream(options?: RequestMediaStreamOptions): Promise<MediaObject> {
        // Get the x11-camera plugin instance
        const x11Plugin = await sdk.systemManager.getDeviceByName('@scrypted/x11-camera') as unknown as DeviceCreator;
        if (!x11Plugin) {
            throw new Error('Please install the x11-camera plugin from the Scrypted plugin store');
        }

        // Create a new x11 camera device through the plugin
        const deviceId = await x11Plugin.createDevice({
            name: 'BirdNET Display',
            type: ScryptedDeviceType.Camera,
            nativeId: this.nativeId + '_x11',
            interfaces: [ScryptedInterface.VideoCamera]
        });

        // Get the device instance
        const x11Device = await sdk.systemManager.getDeviceById(deviceId) as unknown as VideoCamera;

        // Get the stream from the x11 camera device
        return x11Device.getVideoStream(options);
    }
}

// Export the plugin instance.
export default BirdNETPlugin;
  