#!/bin/bash

# Navigate to project directory
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

# Set Android environment variables
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo "Building APK without AdMob for testing..."
echo "Current directory: $(pwd)"
echo "ANDROID_HOME: $ANDROID_HOME"

# Run EAS build
eas build --platform android --profile preview --local

