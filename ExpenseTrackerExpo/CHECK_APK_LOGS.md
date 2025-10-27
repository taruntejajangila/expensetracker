# How to Check Logs from Installed APK

## Step 1: Enable USB Debugging on Android

### On Your Phone:

1. **Go to Settings** → **About Phone**
2. **Tap "Build Number" 7 times** (you'll see "You are now a developer!")
3. **Go back** to Settings
4. **Open "Developer Options"** (or Settings → System → Developer Options)
5. **Enable "USB Debugging"**
6. **Enable "Install via USB"** (optional but recommended)

### What You'll See:

```
Developer Options
✓ USB Debugging
✓ Install via USB
```

---

## Step 2: Connect Phone via USB

1. **Connect your phone** to your computer via USB cable
2. **Allow USB Debugging** popup on phone (tap "Allow")
3. **Select "File Transfer" mode** on phone when prompted

---

## Step 3: Check if Phone is Detected

In **WSL terminal**, run:

```bash
adb devices
```

You should see something like:
```
List of devices attached
ABCD1234    device
```

If you see "unauthorized", tap "Allow" on your phone's popup.

---

## Step 4: Watch Logs in Real-Time

### Option A: Filter for Errors Only

```bash
# Clear old logs and watch for React Native errors
adb logcat -c && adb logcat *:E ReactNativeJS:* ReactNative:* | cat
```

This shows only **errors** and React Native messages.

---

### Option B: Watch All Logs

```bash
# Show all logs
adb logcat | grep -i "error\|exception\|crash\|reactnative"
```

---

### Option C: Save to File

```bash
# Save logs to file
adb logcat > app-crash-log.txt

# Then open the app on your phone and let it crash
# Press Ctrl+C to stop recording
# Check app-crash-log.txt for errors
```

---

## Step 5: Test the App

1. **Open the app** on your phone
2. **Watch the terminal** for error messages
3. **Look for errors** like:
   - `Network request failed`
   - `ECONNREFUSED`
   - `Unable to connect to server`
   - `Module not found`
   - `Red box error`

---

## Common Errors You Might See

### 1. Network Error
```
Error: Network request failed
TypeError: fetch failed
```
**Fix:** Backend is not reachable - check if Railway backend is running

### 2. AdMob Error
```
ERROR  Invalid admob app id
ERROR  Failed to initialize Google Mobile Ads
```
**Fix:** AdMob initialization failing

### 3. AsyncStorage Error
```
ERROR  Unable to access AsyncStorage
```
**Fix:** Permission issue

### 4. Module Not Found
```
ERROR  Unable to resolve module './transactionService'
```
**Fix:** Import path issue

---

## Step 6: Capture Specific Error

If you see a specific error, share it here and I can fix it!

Example of what to copy:
```
ERROR  [Error: Network request failed]
       at App.js:123
       at AuthContext.tsx:56
```

---

## Alternative: Use Expo Instead

If ADB is too complicated, just run Expo:

```bash
# In WSL
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"
npm start
```

Then scan QR with **Expo Go** app - you'll see errors in the terminal immediately.

---

## Troubleshooting

### ADB not found
```bash
# Install ADB in WSL
sudo apt install android-tools-adb
```

### Device not showing
1. Unplug and replug USB
2. Change USB cable
3. Try different USB port
4. Select "File Transfer" mode on phone

### Can't see logs
```bash
# Start fresh
adb kill-server
adb start-server
adb devices
```

---

## What We're Looking For

The main things we want to see:

✅ **App starts successfully**  
❌ **What error appears**  
❌ **Where in the code it crashes**  
❌ **Network connectivity issues**  
❌ **Permission problems**

Once we have the error message, fixing it takes minutes!

