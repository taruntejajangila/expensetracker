#!/bin/bash

# Script to prepare for offline builds
# Run this ONCE while online to download all dependencies

set -e

echo "🔧 Setting up offline build environment..."

cd "$(dirname "$0")/.."

# 1. Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# 2. Run patch script
echo "🔨 Running patch script..."
node scripts/patch-async-storage-lint.js || true

# 3. Pre-download all Gradle dependencies (online build)
echo "📥 Pre-downloading Gradle dependencies..."
cd android

# Build once online to cache everything
echo "🏗️  Running online build to cache dependencies..."
./gradlew clean assembleRelease --refresh-dependencies

echo ""
echo "✅ Offline build setup complete!"
echo ""
echo "Now you can build offline using:"
echo "  cd android && ./gradlew assembleRelease --offline"
echo ""
echo "Or use the offline-build.sh script:"
echo "  ./scripts/offline-build.sh"

