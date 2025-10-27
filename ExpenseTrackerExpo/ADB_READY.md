# ✅ ADB is Installed and Ready!

## Quick Steps to Get Logs

### 1. Enable USB Debugging on Phone

**Settings → About Phone → Tap "Build Number" 7 times**

Then:
- **Settings → Developer Options**
- **Enable "USB Debugging"**
- **Connect phone via USB**
- **Select "File Transfer" mode**

---

### 2. Check Connection

```bash
adb devices
```

**Expected output:**
```
List of devices attached
ABC123XYZ    device
```

If you see "unauthorized":
- Check phone for popup
- Tap "Allow"

---

### 3. Watch Logs

```bash
# Clear and watch
adb logcat -c && adb logcat *:E ReactNativeJS:* ReactNative:* | cat
```

---

### 4. Open App on Phone

Now open your Expense Tracker app on your phone!

**Errors will appear in the terminal immediately!**

Look for:
- `ERROR Network request failed`
- `ERROR ECONNREFUSED`
- `ERROR Unable to connect to server`
- Any other ERROR messages

---

### 5. Copy the Error

When you see the error, **copy the entire error message** and share it here.

Example of what we're looking for:
```
ERROR  Network request failed
       at App.js:123
       at AuthContext.tsx:56
```

---

## Troubleshooting

### Still no device?
- Unplug and replug USB
- Try different USB cable
- Try different USB port
- Make sure USB is in "File Transfer" mode

### Device shows "unauthorized"
- Check phone screen for popup
- Enable "Always allow from this computer"

---

## Alternative: Use Expo (Even Easier!)

If ADB is too complicated:

```bash
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"
npm start
```

Then scan QR with Expo Go app - no USB needed!

---

**Go ahead and run `adb logcat` then open the app!** 🚀

