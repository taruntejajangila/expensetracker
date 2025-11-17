#!/bin/bash

# Script to build APK completely offline
# Make sure you've run setup-offline-build.sh first while online

set -e

echo "🔒 Building APK in OFFLINE mode..."

cd "$(dirname "$0")/.."

# Navigate to android directory
cd android

# Build with --offline flag (no network access)
echo "🏗️  Building release APK..."
./gradlew assembleRelease --offline

echo ""
echo "✅ Build complete!"
echo ""
echo "APK location:"
echo "  $(pwd)/app/build/outputs/apk/release/app-release.apk"
echo ""
ls -lh app/build/outputs/apk/release/app-release.apk 2>/dev/null || echo "⚠️  APK not found - check build output above"

