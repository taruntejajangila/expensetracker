# Fix APK Crash - Step by Step

## Current Status

✅ **App works in Expo Go**
✅ **Code is correct**  
✅ **Backend connection works**  
✅ **Permissions added to app.json**  
❌ **APK crashes immediately**

---

## Quick Fix: Build Development APK First

Instead of EAS build, let's try a **development build** first (easier to debug):

```bash
# In WSL terminal
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

# Build and install development APK
npx expo run:android
```

This will:
- Build the app
- Install on your connected phone
- Show real-time logs

**If this works, we know the issue is with EAS build configuration.**

---

## Then: Build EAS APK

Once development build works:

```bash
# Build EAS APK with fixes
eas build -p android --profile preview --local
```

---

## What We Fixed

Added permissions to `app.json`:
- ✅ INTERNET
- ✅ ACCESS_NETWORK_STATE
- ✅ WRITE_EXTERNAL_STORAGE
- ✅ READ_EXTERNAL_STORAGE
- ✅ RECEIVE_BOOT_COMPLETED

---

## Try This Now

Run this command in WSL:

```bash
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"
npx expo run:android
```

**Connect your phone via USB** and run the command - it will auto-install!

If you see any errors, share them here.

