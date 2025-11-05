# Install ADB on Windows (For USB Debugging)

## Quick Install

### Option 1: Download Platform Tools (Recommended)

1. **Download ADB:**
   - Go to: https://developer.android.com/studio/releases/platform-tools
   - Download: `platform-tools-latest-windows.zip`
   - Extract to: `C:\platform-tools\`

2. **Add to PATH:**
   - Press `Win + R`, type `sysdm.cpl` and press Enter
   - Click **Environment Variables**
   - Under **System variables**, find **Path**, click **Edit**
   - Click **New**, add: `C:\platform-tools`
   - Click **OK** on all windows

3. **Test:**
   ```powershell
   # Open new PowerShell as Administrator
   adb version
   adb devices
   ```

### Option 2: Install via Scoop (If you have Scoop)

```powershell
scoop install adb
```

### Option 3: Install via Chocolatey (If you have Chocolatey)

```powershell
choco install adb
```

## After Installing ADB

**Test connection:**
```powershell
# As Administrator
adb devices
```

**Install APK:**
```powershell
adb install app-release.apk
```

**Get crash logs:**
```powershell
adb logcat *:E > crash-logs.txt
# Then open the app on your phone
# Press Ctrl+C to stop logging
```

