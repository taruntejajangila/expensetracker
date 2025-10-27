# WSL2 Setup & Local APK Build Guide

This guide will help you set up Linux (WSL2) on Windows and build APKs locally for your Expo app.

## 📋 Prerequisites

- Windows 10 (Build 19041+) or Windows 11
- At least 16GB of RAM (recommended)
- Administrator access

---

## Part 1: Installing WSL2 (Windows Subsystem for Linux)

### Step 1: Enable WSL and Virtual Machine Platform

Open PowerShell **as Administrator** and run:

```powershell
# Enable WSL
wsl --install

# Restart your computer when prompted
```

If the above command doesn't work, enable features manually:

```powershell
# Enable required Windows features
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /enable-feature /online /featurename:VirtualMachinePlatform /all /norestart

# Restart your computer
Restart-Computer
```

### Step 2: Set WSL2 as Default Version

After restart, open PowerShell **as Administrator**:

```powershell
# Set WSL2 as default
wsl --set-default-version 2

# Verify installation
wsl --status
```

### Step 3: Install Ubuntu Linux

```powershell
# Install Ubuntu (LTS version)
wsl --install -d Ubuntu-22.04
```

After installation, Ubuntu will launch. You'll need to:
1. Create a username (e.g., `yourname`)
2. Set a password

**Important:** Remember your password!

### Step 4: Update Ubuntu

Open WSL (Ubuntu) and run:

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Part 2: Installing Build Tools in WSL2

### Step 1: Install Node.js and NPM

```bash
# Install Node.js 20.x (recommended for Expo)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Install Required Build Tools

```bash
# Install essential build tools
sudo apt install -y build-essential git curl wget

# Install Java Development Kit (required for Android builds)
sudo apt install -y default-jdk openjdk-17-jdk

# Verify Java installation
java -version
```

### Step 3: Install Android Command Line Tools

```bash
# Create Android directory
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools

# Download Android SDK command line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip

# Unzip and organize
unzip commandlinetools-linux-11076708_latest.zip
mv cmdline-tools latest

# Go back home
cd ~
```

### Step 4: Install Android SDK Components

Add to your `~/.bashrc`:

```bash
nano ~/.bashrc
```

Add these lines at the end:

```bash
# Android SDK
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Save and reload:

```bash
source ~/.bashrc
```

Install required Android SDK components:

```bash
# Accept licenses
yes | sdkmanager --licenses

# Install Android SDK
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Step 5: Install EAS CLI

```bash
npm install -g eas-cli

# Verify installation
eas --version
```

---

## Part 3: Setting Up Your Project

### Step 1: Access Your Project from WSL

```bash
# Navigate to Windows drives from WSL
cd /mnt/e/expensetracker\ new/ExpenseTrackerExpo

# Install project dependencies
npm install
```

### Step 2: Login to Expo

```bash
eas login
```

If you don't have an Expo account:
1. Go to https://expo.dev
2. Create an account
3. Run `eas login` again

---

## Part 4: Building APK Locally

### Option A: Using EAS Build (Cloud - Recommended for First Build)

This builds in Expo's cloud infrastructure (easiest):

```bash
# Make sure you're in the ExpenseTrackerExpo directory
cd /mnt/e/expensetracker\ new/ExpenseTrackerExpo

# Build APK
eas build -p android --profile preview --local
```

The `--local` flag builds on your machine but uses EAS tools.

### Option B: Pure Local Build with gradlew

For a completely local build without cloud services:

```bash
# Navigate to android directory
cd /mnt/e/expensetracker\ new/ExpenseTrackerExpo/android

# Give gradlew execute permissions
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug

# The APK will be in:
# android/app/build/outputs/apk/debug/app-debug.apk
```

For release APK:

```bash
# Build release APK (requires signing)
./gradlew assembleRelease

# The APK will be in:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Part 5: Troubleshooting

### Issue: "SDK location not found"

Add this to `android/local.properties`:

```bash
cd /mnt/e/expensetracker\ new/ExpenseTrackerExpo/android

# Create local.properties
nano local.properties
```

Add:
```
sdk.dir=/home/YOUR_USERNAME/android-sdk
```
(Replace YOUR_USERNAME with your WSL username)

### Issue: "Java version mismatch"

```bash
# Check Java version
java -version

# If wrong version, set Java 17 as default
sudo update-alternatives --config java
# Select Java 17 (usually option 2 or 3)
```

### Issue: "Out of memory" during build

Increase WSL memory allocation. Create/edit `%UserProfile%\.wslconfig` on Windows:

```powershell
notepad %UserProfile%\.wslconfig
```

Add:
```
[wsl2]
memory=8GB
processors=4
```

Restart WSL:
```powershell
wsl --shutdown
```

### Issue: "Module not found" errors

```bash
# Clean build
cd /mnt/e/expensetracker\ new/ExpenseTrackerExpo

# Remove old build artifacts
rm -rf android/.gradle
rm -rf android/app/build
rm -rf node_modules

# Reinstall dependencies
npm install

# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

### Issue: "Command not found" after installing tools

```bash
# Reload environment
source ~/.bashrc

# Or restart WSL
exit
# Then reopen WSL
```

---

## Part 6: Alternative - Build on Windows Directly (Without WSL)

If you prefer not to use WSL, you can build directly on Windows:

### Install Prerequisites on Windows:

1. **Node.js** - Download from https://nodejs.org
2. **Android Studio** - Download from https://developer.android.com/studio
3. **Java JDK 17** - Download from https://adoptium.net/

### Set Environment Variables:

Add to your Windows PATH:
- `C:\Program Files\nodejs\`
- `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`
- `C:\Users\YourName\AppData\Local\Android\Sdk\tools`

### Build APK:

Open PowerShell in your project directory:

```powershell
cd "E:\expensetracker new\ExpenseTrackerExpo"

# Install dependencies
npm install

# Build APK
npx expo run:android --variant release
```

Or use gradlew:

```powershell
cd android
.\gradlew.bat assembleDebug
```

---

## Part 7: Quick Start Commands

Once everything is set up:

```bash
# Open WSL
wsl

# Navigate to project
cd /mnt/e/expensetracker\ new/ExpenseTrackerExpo

# Install dependencies (first time only)
npm install

# Build APK
eas build -p android --profile preview --local
```

Or for pure local build:

```bash
cd android
./gradlew assembleDebug

# Find your APK
ls app/build/outputs/apk/debug/
```

---

## 📱 Testing Your APK

1. Transfer the APK to your Android device
2. Enable "Unknown Sources" in device settings
3. Install and test the app

---

## 🎯 Recommended Approach

For your first build, I recommend:
1. **EAS Build with `--local`** - Easiest and most reliable
2. **Pure local build** - Once you're comfortable with the setup

Choose based on your needs:
- **Cloud build (`eas build` without `--local`)**: Requires internet, builds in Expo's cloud
- **Local EAS build (`eas build --local`)**: Uses your machine, more control
- **Pure local (`gradlew`)**: Full local control, no Expo services needed

---

## Next Steps

1. Install WSL2 (Part 1)
2. Install build tools (Part 2)
3. Set up your project (Part 3)
4. Build your first APK (Part 4)
5. Test on a real device!

If you encounter any issues, check Part 5 (Troubleshooting) or let me know what error you're seeing.


