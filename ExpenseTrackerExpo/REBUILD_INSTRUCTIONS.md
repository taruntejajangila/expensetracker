# How to Rebuild APK with New Version

## Quick Rebuild Steps

In your WSL terminal, run:

```bash
# Navigate to project
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"

# Rebuild with new version (1.0.1)
eas build -p android --profile preview --local
```

This will create a new APK that can **update** over the old app.

---

## After Rebuild

The new APK will be in:
- `ExpenseTrackerExpo/build-[TIMESTAMP].apk`

Transfer to your device and install. This time it should **update** the existing app instead of conflicting.

---

## What Changed

- Version: 1.0.0 → 1.0.1
- versionCode: Added (2)

This tells Android this is a newer version and can update the existing app.

