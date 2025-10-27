# How to Install ADB in WSL

## Quick Install

In your **WSL terminal**, run:

```bash
sudo apt update
sudo apt install android-tools-adb android-tools-fastboot
```

---

## Verify Installation

```bash
adb --version
```

You should see:
```
Android Debug Bridge version 1.0.XX
```

---

## Install ADB on Windows (Alternative)

If you prefer to use Windows PowerShell instead of WSL:

### Option 1: Via Chocolatey (Recommended)

Open **PowerShell as Administrator**:

```powershell
# Install Chocolatey first (if you don't have it)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install ADB
choco install adb
```

### Option 2: Manual Install

1. Download **Platform Tools** from:
   https://developer.android.com/tools/releases/platform-tools

2. Extract to a folder (e.g., `C:\adb`)

3. Add to PATH:
   - Right-click **This PC** → **Properties** → **Advanced System Settings**
   - **Environment Variables** → **Path** → **Edit** → **New**
   - Add: `C:\adb`
   - Click **OK**

4. Open new PowerShell and run:
   ```powershell
   adb --version
   ```

---

## Check Device Connection

After installation, run:

```bash
# In WSL
adb devices
```

Or in Windows PowerShell:
```powershell
adb devices
```

---

## Enable USB Debugging on Phone

1. **Settings** → **About Phone**
2. **Tap "Build Number" 7 times**
3. **Go back** to Settings
4. **Developer Options** → **Enable "USB Debugging"**

---

## Test Connection

1. **Connect phone** via USB
2. **Select "File Transfer"** mode
3. **Allow USB debugging** popup on phone
4. Run:
   ```bash
   adb devices
   ```

Should show:
```
List of devices attached
ABC123XYZ    device  ← Success!
```

---

## Watch Logs

Once connected, run:

```bash
# Clear old logs
adb logcat -c

# Watch for React Native errors
adb logcat *:E ReactNativeJS:* ReactNative:*
```

Then open your app on phone - you'll see real-time errors!

---

## Troubleshooting

### "ADB not found"
- Make sure you installed in the right environment (WSL vs Windows)
- Restart terminal after installing

### "Device unauthorized"
- Check phone for popup
- Enable "USB Debugging" in Developer Options

### "No devices"
- Change USB cable
- Try different USB port
- Check phone USB connection mode

---

## Alternative: Use Expo Instead

**Actually, using Expo is MUCH easier:**

```bash
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"
npm start
```

No USB needed! Just scan QR code with Expo Go app.

Your call - ADB for deep debugging, or Expo for quick testing? 🚀

