#!/bin/bash

# Install APK via ADB
echo "Checking for connected devices..."
adb devices

echo ""
echo "Installing APK..."
adb install build-1761588429532.apk

echo ""
echo "Done! Check your phone for the app."

