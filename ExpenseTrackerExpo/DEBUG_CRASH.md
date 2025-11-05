# Debug App Crash

## Current Status
- ✅ APK built successfully without Reanimated
- ✅ Hermes engine enabled
- ✅ SimpleDrawer temporarily disabled to test
- ❓ App crashes after installation (need crash logs)

## Crash Details Needed

Please provide:
1. **When does it crash?**
   - Immediately on launch?
   - After login?
   - When navigating to a specific screen?

2. **What error message do you see?**
   - A specific error popup?
   - Just closes immediately?

3. **Try this to get crash logs:**
   - Open Developer Options on your phone
   - Enable "USB Debugging" 
   - Connect to PC via USB
   - Look for a popup saying "Allow USB Debugging" - click ALLOW
   - Then run: `wsl bash -c "adb logcat -d | grep -i error"`

## Current Working APK
**File:** `build-1761588429532.apk`

## What We Changed
1. Removed `@react-navigation/drawer` (was causing Reanimated dependency issues)
2. Created custom SimpleDrawer component (now disabled)
3. Set ANDROID_HOME in eas.json
4. Disabled drawer to test if it was causing the crash

## Next Steps
1. Get crash logs using ADB or
2. Provide details about the crash so we can fix it

