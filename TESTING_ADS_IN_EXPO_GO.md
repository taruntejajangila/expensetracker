# Testing Ads in Expo Go

## ✅ What You'll See Now

When you open the app in Expo Go, you'll see:

### 1. **Banner Ad at Bottom** 📱
- A styled placeholder that says "Advertisement"
- Shows where real ads will appear
- Dashed border with blue color
- Height: 60px

### 2. **Interstitial Ad on App Load** 🎬
- When app starts, shows a mock interstitial
- Shows alert: "📱 Ad Placeholder"
- This is where real full-screen ads will show

## 📱 Current Setup

### Mock Implementation:
- ✅ No crashes in Expo Go
- ✅ Shows placeholder UI where ads will be
- ✅ Allows you to see ad placement
- ✅ Clean, professional look

### Real Ads:
- ❌ Won't work in Expo Go (native module limitation)
- ✅ Will work in development builds
- ✅ Will work in production builds

## 🚀 How to See REAL Ads

To see actual Google AdMob ads, you need to:

### Option 1: Development Build (Recommended)
```bash
# Build in cloud (works on Windows)
eas build --platform android --profile development

# Then download and install on your device
# Will show real Google test ads!
```

### Option 2: Production Build (When Ready)
```bash
# After setting up AdMob account
eas build --platform android --profile production

# Will show your real ads
```

## 🎨 What the Mock Ads Look Like

**Banner Ad:**
```
┌─────────────────────────────┐
│  📱 Advertisement           │
│  Real ads will show here     │
└─────────────────────────────┘
```

**Interstitial Ad:**
- Shows alert popup when app loads
- Will be full-screen in real version

## 📍 Where Ads Are Located

1. **HomeScreen.tsx (Line ~2048)**
   - Banner ad at the bottom
   - After scrolling content

2. **App.js (Splash Screen)**
   - Interstitial ad when app loads
   - Full-screen modal

## ⚠️ Important Note

This is a **mock implementation** for Expo Go. Real ads require:
- Development build OR
- Production build

The mock helps you see:
- ✅ Where ads will appear
- ✅ How the layout looks
- ✅ User experience

## 🔧 Switching to Real Ads

When you're ready to build with real ads:

1. Revert to real implementation
2. Create development/production build
3. Real Google ads will show!

The real implementation is ready in the code - just needs a native build!
