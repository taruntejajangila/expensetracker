# How to Create Development Build for Android - Complete Guide

## 🎯 Goal
Create a development build that allows you to test real AdMob ads in your Android app.

## ✅ What You Need
1. EAS account (free, already logged in)
2. Android device (recommended) or emulator
3. Internet connection
4. About 10-15 minutes

## 🚀 Step-by-Step Guide

### Step 1: Build the APK in Cloud
```bash
# Navigate to your project
cd ExpenseTrackerExpo

# Create development build
eas build --platform android --profile development
```

**What happens:**
- Uploads your code to EAS servers
- Builds the app in the cloud
- Takes about 10-15 minutes
- Creates an APK file

### Step 2: Download the APK
After build completes:
1. EAS will give you a download link
2. Open link on your phone/computer
3. Download the APK file

### Step 3: Install on Android Device

**Option A: Install from Phone**
1. Open the download link on your phone
2. Download the APK
3. Tap on "Install" when prompted
4. Allow "Install from Unknown Sources" if asked

**Option B: Install via USB**
1. Enable USB debugging on your phone
2. Connect phone to computer via USB
3. Run: `adb install path/to/your-app.apk`

### Step 4: Run Your App
1. Find the app on your phone
2. Tap to open
3. **Real ads will now show!**

## 📱 Alternative: Install on Emulator
If you have an Android emulator:
```bash
# Start emulator first
adb devices

# Install APK
adb install path/to/your-app.apk
```

## 🎮 What You'll See After Installation

**Development Build:**
- ✅ Real Google test ads (banner + interstitial)
- ✅ All your app features
- ✅ Live reload capability
- ✅ Debug mode enabled

**Ads will look like:**
- Banner: Real Google ads at bottom
- Interstitial: Full-screen Google ads

## 🔧 Building Multiple Times

You can rebuild whenever you want:
```bash
# Just run this command again
eas build --platform android --profile development
```

New version will:
- Include your latest code changes
- Replace old version when installed
- Keep all your data

## ⚠️ Important Notes

### Test Ads in Development Build
- Google provides test ad IDs automatically
- Won't generate revenue (safe for testing)
- Won't violate AdMob policies
- Perfect for development

### Production Ads Later
When ready to release:
```bash
# Create production build
eas build --platform android --profile production

# This will use your real ad unit IDs
# And generate actual revenue
```

## 🆘 Troubleshooting

### Build Fails?
- Check your code compiles
- Make sure app.json is valid
- Check if dependencies are installed

### Can't Install APK?
- Enable "Install from Unknown Sources"
- Settings → Security → Unknown Sources
- Then try installing again

### No Ads Showing?
- Make sure you're using the dev build (not Expo Go)
- Check internet connection
- Test ads may take a few seconds to load

## 📊 Build Status

Check your build status:
```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]
```

## 🎯 Summary

**To test ads in Android:**
1. Run: `eas build --platform android --profile development`
2. Wait 10-15 minutes
3. Download APK
4. Install on phone
5. Open app
6. See real ads! 🎉

**Advantages of dev build:**
- ✅ Real AdMob ads (Google test ads)
- ✅ Full native features
- ✅ Faster performance
- ✅ Production-like environment
- ✅ Live reload still works

## 💡 Pro Tips

1. **Keep the APK** - Don't need to rebuild every time
2. **Same app** - Will replace your Expo Go app (different icon)
3. **Test thoroughly** - Ads work, payments, notifications, etc.
4. **Production ready** - Same process for release

Ready to build? Just run that one command! 🚀
