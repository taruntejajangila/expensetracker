# Quick Debug with Expo - Easiest Method!

## ✅ This is the FASTEST way to see errors

### Step 1: Install Expo Go on Phone
- Open **Play Store** on your Android phone
- Search for **"Expo Go"**
- Install it

---

### Step 2: Start Expo in WSL

In your WSL terminal, run:

```bash
cd "/mnt/e/expensetracker new/ExpenseTrackerExpo"
npm start
```

You'll see:
```
Metro waiting on exp://192.168.x.x:8081
Scan the QR code above with Expo Go (Android) or Camera app (iOS)
```

---

### Step 3: Connect Your Phone

**Option A: Same WiFi (Recommended)**
1. Make sure phone and computer are on **same WiFi**
2. In Expo Go app, tap **"Scan QR code"**
3. Scan the QR code in the terminal
4. App will load!

**Option B: USB Cable**
1. Enable **"USB Debugging"** in Developer Options on phone
2. In the terminal, press **`t`** for tunnel mode
3. Scan the tunnel QR code with Expo Go

---

### Step 4: Watch the Errors!

When the app opens, **errors will appear in the terminal** immediately!

You'll see something like:
```
ERROR  Network request failed
ERROR  Unable to connect to backend
ERROR  Invalid API URL
```

**Copy those errors and we'll fix them!**

---

## Why This Works

- ✅ **No build needed** - runs instantly
- ✅ **Real-time errors** - see crashes immediately
- ✅ **No USB cables** - works over WiFi
- ✅ **Easy to restart** - just shake phone and reload

---

## Troubleshooting

### "Unable to connect"
- Make sure phone and computer are on **same WiFi network**
- Try tunnel mode: Press `t` in terminal

### "Socket hang up"
- Press `r` to reload
- Or press `shift+r` for full reload

### "Can't find Expo CLI"
```bash
npm install -g expo-cli
```

---

**Just run `npm start` and scan QR code - that's it!** 🚀

