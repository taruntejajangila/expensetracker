#!/bin/bash

# Fix build corruption by cleaning all caches and reinstalling dependencies
# This script fixes the corrupted SerialExecutor.java file issue

set -e

echo "🧹 Starting build corruption fix..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

echo "📦 Step 1: Removing node_modules..."
rm -rf node_modules
echo "✅ node_modules removed"
echo ""

echo "🗑️  Step 2: Clearing npm cache..."
npm cache clean --force
echo "✅ npm cache cleared"
echo ""

echo "🧹 Step 3: Cleaning Android build artifacts..."
if [ -d "android" ]; then
    cd android
    ./gradlew clean 2>/dev/null || echo "⚠️  Gradle clean failed (this is okay if gradlew doesn't exist)"
    rm -rf .gradle
    rm -rf app/build
    rm -rf build
    cd ..
    echo "✅ Android build artifacts cleaned"
else
    echo "⚠️  Android directory not found, skipping..."
fi
echo ""

echo "📦 Step 4: Removing package-lock.json..."
rm -f package-lock.json
echo "✅ package-lock.json removed"
echo ""

echo "📥 Step 5: Reinstalling dependencies..."
npm install
echo "✅ Dependencies reinstalled"
echo ""

echo "🔍 Step 6: Verifying @react-native-async-storage/async-storage installation..."
if [ -f "node_modules/@react-native-async-storage/async-storage/android/src/main/java/com/reactnativecommunity/asyncstorage/SerialExecutor.java" ]; then
    # Check if file contains valid Java code (not JavaScript)
    if grep -q "class SerialExecutor" "node_modules/@react-native-async-storage/async-storage/android/src/main/java/com/reactnativecommunity/asyncstorage/SerialExecutor.java" 2>/dev/null; then
        echo "✅ SerialExecutor.java is valid Java code"
    else
        echo "❌ SerialExecutor.java still appears corrupted!"
        echo "   Attempting to reinstall async-storage package..."
        npm uninstall @react-native-async-storage/async-storage
        npm install @react-native-async-storage/async-storage@2.2.0
        echo "✅ async-storage package reinstalled"
    fi
else
    echo "⚠️  SerialExecutor.java not found (may need to run prebuild)"
fi
echo ""

echo "🎉 Build corruption fix complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx expo prebuild --clean (if using bare workflow)"
echo "2. Try building again: npx eas-cli build --platform android --profile preview --local"
