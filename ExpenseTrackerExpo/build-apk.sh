#!/bin/bash
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

cd /mnt/e/expensetracker\ new/ExpenseTrackerExpo

echo "ANDROID_HOME: $ANDROID_HOME"
echo "Current directory: $(pwd)"

# Run the EAS build
eas build --platform android --profile preview --local

