#!/bin/bash

# Build APK
echo "🔨 Building APK..."
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"
eas build --platform android --profile preview --local

# After build completes, find and install APK
echo ""
echo "📱 Build complete! Finding APK..."
APK_PATH=$(find /tmp -name "app-release.apk" 2>/dev/null | head -1)

if [ -n "$APK_PATH" ]; then
    echo "✅ Found APK: $APK_PATH"
    echo "📥 Installing on device..."
    adb install -r "$APK_PATH"
else
    echo "❌ APK not found. Check build output for location."
    echo "Look in: /tmp/taruntejajangila/eas-build-local-nodejs/"
fi

