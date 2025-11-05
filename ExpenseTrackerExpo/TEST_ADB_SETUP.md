# Test and Setup ADB for Android Device Connection

## Step 1: Check if ADB is Available in WSL

Run in your WSL terminal:
```bash
which adb
adb --version
```

If `adb` is not found, install it:
```bash
sudo apt update
sudo apt install android-tools-adb android-tools-fastboot
```

## Step 2: Check Device Connection (Windows)

On your **Windows PowerShell** (as Administrator), run:
```powershell
# Install ADB if not installed
# Download from: https://developer.android.com/studio/releases/platform-tools
# Or if already installed, test with:
adb devices
```

## Step 3: Enable USB Debugging on Your Phone

1. **Go to Settings** → **About Phone**
2. **Tap "Build Number" 7 times** until you see "You are now a developer"
3. **Go back** → **Developer Options**
4. **Enable "USB Debugging"**
5. **Enable "Install via USB"** (if available)

## Step 4: Connect Your Phone and Test

### On Windows (Recommended):
```powershell
# Open PowerShell as Administrator
cd "E:\expensetracker new\ExpenseTrackerExpo"

# Check connected devices
adb devices

# You should see your device listed
# If it says "unauthorized", check your phone - approve the USB debugging prompt
```

### On WSL (Alternative):
```bash
# In WSL terminal
which adb

# If ADB is installed in WSL
adb devices
```

## Step 5: Install APK to Device

Once device is connected:
```bash
# In WSL or Windows PowerShell
adb install <path-to-apk-file>

# Or copy APK to device
adb push app-debug.apk /sdcard/
# Then install from phone storage

# Or simpler - use ADB to install
adb install -r app-debug.apk
```

## Common Issues:

### 1. "adb: command not found"
**Solution:** Install ADB
- Windows: Download from https://developer.android.com/studio/releases/platform-tools
- WSL: `sudo apt install android-tools-adb`

### 2. "device unauthorized"
**Solution:** 
- Check your phone for USB debugging prompt
- Click "Allow" or "OK"
- Try `adb devices` again

### 3. "no devices found"
**Solutions:**
- Make sure USB debugging is enabled on phone
- Try different USB cable
- Try different USB port
- Restart adb: `adb kill-server && adb start-server`
- On Windows, check if phone drivers are installed

### 4. "command not found" in WSL
**Solution:** 
ADB might be in Windows PATH, not WSL. Use it from Windows PowerShell instead, or install it in WSL.

## Quick Test Command:

```bash
# See all connected devices
adb devices

# If device shows up as "device" (not "unauthorized" or "offline"), you're good!
```

## Find Your APK File:

After building, your APK will be in:
```
/tmp/taruntejajangila/eas-build-local-nodejs/[build-id]/build/ExpenseTrackerExpo/android/app/build/outputs/apk/release/
```

Or on Windows:
```
E:\expensetracker new\ExpenseTrackerExpo\android\app\build\outputs\apk\release\
```

Look for `app-release.apk` or similar file.

