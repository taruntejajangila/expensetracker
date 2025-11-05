# Capture Crash Logs

Run this in PowerShell to capture crash logs while you open the app:

## Step 1: Clear old logs and start capturing

```powershell
# Clear logs
C:\platform-tools\adb.exe logcat -c

# Capture logs
C:\platform-tools\adb.exe logcat > crash-logs.txt
```

## Step 2: Open the app on your phone

- Tap the app icon to open it
- Let it crash (it will happen quickly)
- Wait 3 seconds

## Step 3: Stop capturing

Press `Ctrl+C` in PowerShell

## Step 4: View the crash logs

```powershell
type crash-logs.txt
```

Or open `crash-logs.txt` to see the error messages.

