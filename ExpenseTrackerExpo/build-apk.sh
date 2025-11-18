#!/bin/bash
cd "$(dirname "$0")"
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

echo "Building APK..."
echo "ANDROID_HOME: $ANDROID_HOME"
echo "Current directory: $(pwd)"

# Prebuild if android folder doesn't exist
if [ ! -d "android" ]; then
  echo "Running prebuild..."
  npx expo prebuild --platform android
fi

# Build APK using Gradle
cd android
echo "Building release APK with Gradle..."
./gradlew assembleRelease

echo ""
echo "APK build complete!"
echo "APK location: android/app/build/outputs/apk/release/app-release.apk"
