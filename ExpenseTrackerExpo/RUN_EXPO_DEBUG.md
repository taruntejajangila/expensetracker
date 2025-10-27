# Running App in Expo for Debugging

## Method 1: Expo Go (Easiest - No Build Needed)

### On Your Computer (WSL):

```bash
# Navigate to project
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

# Start Expo
npm start
# or
npx expo start
```

### On Your Phone:

1. **Install Expo Go** from Play Store
2. **Scan the QR code** that appears in terminal
3. App will open in Expo Go

**Note:** Expo Go won't have AdMob ads (will use mock ads)

---

## Method 2: Development Build (Full Features)

If you need to test AdMob:

```bash
# In WSL
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

# Install on connected device or emulator
npx expo run:android
```

This will:
- Build the app locally
- Install on your connected device
- Show **real-time error logs** in terminal

---

## Method 3: Check Logs from APK

If you want to see logs from the installed APK:

### Connect Device via USB

Then in WSL:
```bash
# Watch logs in real-time
adb logcat | grep -i "reactnative\|expo\|error"

# Or save to file
adb logcat > crash-log.txt
```

Then open the app and let it crash. You'll see the error messages.

