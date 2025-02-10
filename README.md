# BirdNET Scrypted Plugin

This Scrypted plugin integrates BirdNET for bird sound recognition, creating a virtual camera that displays real-time bird detection results.

## Features

- Creates a virtual camera device in Scrypted that displays BirdNET detection results
- Uses Xvfb to create a virtual display
- Supports audio input from either USB microphone or RTSP camera feed
- Integrates with BirdNET-Go for real-time bird sound detection
- Displays results through a web UI captured as a virtual camera feed

## Prerequisites

The following system packages are required:

```bash
# Install Xvfb and X11 utilities
sudo apt-get update
sudo apt-get install -y xvfb x11-xserver-utils xfonts-base

# Install Chromium browser
sudo apt-get install -y chromium-browser

# Install FFmpeg
sudo apt-get install -y ffmpeg

# Install BirdNET-Go
# Download or build the BirdNET-Go binary and make sure it's in your system's PATH
```

## Installation

1. Install the plugin in Scrypted:
   - Open Scrypted web interface
   - Go to Plugins
   - Click "Install Plugin"
   - Choose "npm" and enter "@scrypted/birdnet"

2. Configure the plugin settings:
   - **Operation Mode**: Choose between 'self-contained' (runs BirdNET-Go internally) or 'external' (connects to external BirdNET service)
   - **BirdNET UI URL**: URL for BirdNET UI (default: http://localhost:8080)
   - **Audio Source**: Choose 'mic' for local microphone or 'rtsp' for RTSP audio feed
   - **RTSP Audio URL**: URL for RTSP audio source (if using RTSP)
   - **BirdNET Confidence Threshold**: Detection confidence threshold (0.0-1.0)

## Usage

1. After installation, a new device "BirdNET Virtual Camera" will appear in your Scrypted dashboard.

2. The camera feed will display the BirdNET UI showing:
   - Real-time audio spectrogram
   - List of detected bird species
   - Confidence scores for detections

3. Detection events are logged in Scrypted's console with format:
   ```
   BirdNET Detection: <Species> (<Confidence>% confidence)
   ```

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/scrypted-birdnet.git
   cd scrypted-birdnet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Deploy to Scrypted:
   ```bash
   npm run scrypted-deploy
   ```

## Troubleshooting

1. If the camera feed is black:
   - Check if Xvfb is running properly
   - Verify the BirdNET UI is accessible at the configured URL
   - Check Chromium browser process is running

2. If no detections are showing:
   - Verify audio input is working (check system audio settings)
   - Test microphone or RTSP stream separately
   - Check BirdNET-Go process is running and receiving audio

3. Common issues:
   - Permission denied: Run Scrypted with appropriate permissions for audio devices
   - Missing dependencies: Ensure all required system packages are installed
   - Port conflicts: Check if port 8080 is available for BirdNET UI

## License

MIT License
