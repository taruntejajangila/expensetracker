# How to Debug App Crashes

## Quick Fix: Check if Backend is Reachable

Your app is trying to connect to:
- **Production Backend**: `https://expensetracker-production-eb9c.up.railway.app/api`

## Check Backend Status

Open this URL in your phone's browser:
```
https://expensetracker-production-eb9c.up.railway.app/api/health
```

If it says "Cannot connect" or times out → **Backend is down or not accessible**

---

## Enable Logcat to See Crashes

### Method 1: Using WSL (Most Reliable)

```bash
# In WSL terminal
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

# Connect your phone via USB
# Then run:
adb logcat *:E ReactNativeJS:* ReactNative:* -c && adb logcat | grep -i "error\|exception\|crash"
```

### Method 2: Using Windows CMD

```powershell
# Open CMD as Administrator
cd "E:\expensetracker new\ExpenseTrackerExpo"

# Run logcat
adb logcat *:E ReactNativeJS:* ReactNative:* -c
adb logcat
```

Look for errors like:
- `Network request failed`
- `ECONNREFUSED`
- `Unable to connect to server`

---

## Possible Causes & Fixes

### 1. Backend Not Reachable from Device

**Symptoms:**
- Error: "Network request failed"
- Cannot connect to API

**Fix:** Check if backend is running and accessible.

### 2. Certificate/SSL Issues

**Symptoms:**
- Error: "CERT" or "SSL"
- Network error

**Fix:** The backend URL uses HTTPS - make sure certificates are valid.

### 3. AdMob Initialization Failing

**Symptoms:**
- Error related to AdMob
- Google Mobile Ads errors

**Fix:** AdMob might be failing in production. Let's disable it temporarily.

### 4. AsyncStorage Issues

**Symptoms:**
- Error: "AsyncStorage"
- Data access errors

**Fix:** Clear app data and reinstall.

---

## Quick Test: Disable AdMob

Let's create a version without AdMob to test:

```bash
# In WSL
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

# Comment out AdMob initialization in App.js
nano App.js
```

Find this section and comment it out:
```javascript
// Initialize AdMob
useEffect(() => {
  const initializeAdMob = async () => {
    // ... comment this whole section
  };
  initializeAdMob();
}, []);
```

Then rebuild:
```bash
eas build -p android --profile preview --local
```

---

## Best Solution: Add Error Boundary

Let's add better error handling to prevent crashes.

