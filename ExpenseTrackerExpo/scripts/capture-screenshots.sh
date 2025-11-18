#!/bin/bash

# Script to capture screenshots from connected Android device
# Usage: ./scripts/capture-screenshots.sh [screenshot-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/play-store-assets/screenshots/phone"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Get connected device
DEVICE=$(adb devices | grep -v "List" | grep "device" | cut -f1 | head -1)

if [ -z "$DEVICE" ]; then
    echo "❌ No Android device found!"
    echo ""
    echo "Please:"
    echo "1. Connect your Android device via USB"
    echo "2. Enable USB debugging on your device"
    echo "3. Run 'adb devices' to verify connection"
    exit 1
fi

echo "✅ Device found: $DEVICE"
echo ""

# Generate filename
if [ -z "$1" ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    FILENAME="screenshot-$TIMESTAMP.png"
else
    FILENAME="$1.png"
fi

OUTPUT_PATH="$OUTPUT_DIR/$FILENAME"

echo "📸 Taking screenshot..."
echo ""

# Take screenshot on device
adb -s "$DEVICE" shell screencap -p /sdcard/temp_screenshot.png

# Pull screenshot to computer
adb -s "$DEVICE" pull /sdcard/temp_screenshot.png "$OUTPUT_PATH"

# Clean up device
adb -s "$DEVICE" shell rm /sdcard/temp_screenshot.png

# Get image dimensions
if command -v identify &> /dev/null; then
    DIMENSIONS=$(identify -format "%wx%h" "$OUTPUT_PATH")
    echo "📐 Image dimensions: $DIMENSIONS"
elif command -v file &> /dev/null; then
    file "$OUTPUT_PATH" | grep -o '[0-9]* x [0-9]*' || true
fi

echo ""
echo "✅ Screenshot saved!"
echo "📁 Location: $OUTPUT_PATH"
echo ""
echo "💡 Tip: Rename the file to something descriptive like:"
echo "   mv '$OUTPUT_PATH' '$OUTPUT_DIR/01-home-screen.png'"
echo ""


