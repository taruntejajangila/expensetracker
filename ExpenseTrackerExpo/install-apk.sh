#!/bin/bash
# Script to uninstall existing app and install new APK

ADB_PATH="/home/tarun/Android/Sdk/platform-tools/adb"
APK_PATH="/mnt/e/expensetracker new/ExpenseTrackerExpo/android/app/build/outputs/apk/release/app-release.apk"
PACKAGE_NAME="com.taruntejajangila.mobileapp"

echo "🔍 Checking for connected devices..."
$ADB_PATH devices

echo ""
echo "📱 Uninstalling existing app (package: $PACKAGE_NAME)..."
$ADB_PATH uninstall $PACKAGE_NAME

if [ $? -eq 0 ]; then
    echo "✅ App uninstalled successfully!"
else
    echo "⚠️  App may not have been installed, or uninstall failed (this is okay)"
fi

echo ""
echo "📦 Installing new APK..."
$ADB_PATH install "$APK_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK installed successfully!"
    echo "🎉 You can now open the app on your device!"
else
    echo ""
    echo "❌ Installation failed. Please check the error message above."
    exit 1
fi
