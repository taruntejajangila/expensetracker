# Install New APK Guide

## Latest APK
**File:** `build-1761588429532.apk` (114.9 MB)
**Location:** `E:\expensetracker new\ExpenseTrackerExpo\build-1761588429532.apk`

## Installation Methods

### Method 1: Direct Install via USB (Recommended)

1. **Connect your Android phone to PC via USB**
2. **Enable USB Debugging** on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. **Transfer the APK to your phone:**
   - Copy `build-1761588429532.apk` to your phone's internal storage

4. **Install on your phone:**
   - Open File Manager on your phone
   - Find the APK file
   - Tap it to install
   - Allow "Install from Unknown Sources" if prompted

### Method 2: Install via ADB (If you have ADB installed)

```bash
# Navigate to the ExpenseTrackerExpo folder
cd "E:\expensetracker new\ExpenseTrackerExpo"

# Install the APK
adb install build-1761588429532.apk
```

### Method 3: Install via Wireless ADB (If phone is connected wirelessly)

```bash
# Connect via wireless ADB (port 5555)
adb connect <YOUR_PHONE_IP>:5555

# Install the APK
adb install build-1761588429532.apk
```

## What's New in This Build
- ✅ Fixed drawer menu (custom drawer, no Reanimated)
- ✅ Hermes engine enabled (better performance)
- ✅ AdMob integration enabled
- ✅ No more Reanimated build errors

## Uninstall Previous Version (Optional)
If you had a previous version installed:
```bash
adb uninstall com.taruntejajangila.mobileapp
```

## Testing the App
1. Open the app after installation
2. Test the drawer menu by tapping the menu icon (top-left)
3. Verify that real AdMob ads are showing
4. Test all navigation features

