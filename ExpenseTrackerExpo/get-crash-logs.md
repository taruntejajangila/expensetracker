# Get Crash Logs for APK

Run these commands in your WSL terminal to get the crash logs:

```bash
# Make sure your device is connected
adb devices

# Clear previous logs (optional)
adb logcat -c

# Stream logs and filter for errors
adb logcat *:E

# OR get the last crash log specifically for your app
adb logcat -d | grep -A 50 -i "com.taruntejajangila.mobileapp"
```

## Alternative: Check device logs directly

```bash
# Filter for your app's package name
adb logcat | grep -i "mobileapp\|taruntejajangila"

# Get crash stack trace
adb logcat | grep -i "AndroidRuntime\|FATAL EXCEPTION"
```

## Common issues to check:

1. **API endpoint issues** - The app might be crashing trying to connect to the backend
2. **Missing environment variables** - Check if API_URL is set correctly
3. **Native module issues** - Some expo modules might not be properly linked
4. **Async storage issues** - Could be failing to initialize

