#!/bin/bash
set -e

# setup_local_piper.sh
# This script downloads the native Piper binary for macOS and the required voice models.

echo "========================================================="
echo " Setting up Local Piper TTS for macOS"
echo "========================================================="

# 1. Detect Architecture
ARCH=$(uname -m)
echo "Detected system architecture: $ARCH"

# Create directories
mkdir -p ./piper
mkdir -p ./voices

TEMP_TAR="piper_bundle.tar.gz"

if [ "$ARCH" = "arm64" ]; then
    echo "Downloading native Apple Silicon (arm64) Piper bundle..."
    DOWNLOAD_URL="https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_macos_aarch64.tar.gz"
elif [ "$ARCH" = "x86_64" ]; then
    echo "Downloading Intel (x64) Piper bundle..."
    DOWNLOAD_URL="https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_macos_x64.tar.gz"
else
    echo "Error: Unsupported architecture $ARCH"
    exit 1
fi

# Download bundle
echo "Fetching: $DOWNLOAD_URL"
curl -L -o "$TEMP_TAR" "$DOWNLOAD_URL"

# Extract bundle
echo "Extracting bundle..."
# Extract to a temporary folder to check structure
mkdir -p ./temp_extract
tar -xzf "$TEMP_TAR" -C ./temp_extract

# Determine structure and copy to ./piper
if [ -d "./temp_extract/piper" ]; then
    echo "Detected nested 'piper' directory inside tarball."
    cp -R ./temp_extract/piper/* ./piper/
else
    echo "Detected flat structure inside tarball."
    cp -R ./temp_extract/* ./piper/
fi

# Clean up temp files
rm -rf ./temp_extract
rm -f "$TEMP_TAR"

echo "Piper binary installed at: ./piper/piper"
chmod +x ./piper/piper

# 2. Download Voice Models
echo "---------------------------------------------------------"
echo " Downloading Voice Models (Amy, Ryan, Joe, Lessac)..."
echo "---------------------------------------------------------"

VOICES=(
    "en_US-amy-medium:en/en_US/amy/medium"
    "en_US-ryan-medium:en/en_US/ryan/medium"
    "en_US-joe-medium:en/en_US/joe/medium"
    "en_US-lessac-medium:en/en_US/lessac/medium"
)

HF_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main"

for item in "${VOICES[@]}"; do
    voice="${item%%:*}"
    path="${item#*:}"
    onnx_file="${voice}.onnx"
    json_file="${voice}.onnx.json"
    
    echo "Checking voice model: $voice..."
    
    if [ ! -f "./voices/$onnx_file" ]; then
        echo "  Downloading $onnx_file..."
        curl -L -o "./voices/$onnx_file" "$HF_BASE/$path/$onnx_file"
    else
        echo "  $onnx_file already exists, skipping."
    fi

    if [ ! -f "./voices/$json_file" ]; then
        echo "  Downloading $json_file..."
        curl -L -o "./voices/$json_file" "$HF_BASE/$path/$json_file"
    else
        echo "  $json_file already exists, skipping."
    fi
done

# 3. Test the binary
echo "---------------------------------------------------------"
echo " Testing Piper binary..."
echo "---------------------------------------------------------"
if ./piper/piper --help > /dev/null 2>&1 || [ $? -eq 0 ]; then
    echo "Success! Piper binary is working."
else
    # Check if macOS Gatekeeper is blocking it
    echo "Checking if executable runs..."
    ./piper/piper -h
fi

echo "========================================================="
echo " Setup Completed Successfully!"
echo "========================================================="
echo "To run the local Piper TTS server:"
echo "  python3 piper_server.py"
echo ""
echo "To route app requests locally, update your .env.local file:"
echo "  PIPER_TTS_URL=http://localhost:5000/api/tts"
echo "  TTS_PROVIDER=piper"
echo "========================================================="
