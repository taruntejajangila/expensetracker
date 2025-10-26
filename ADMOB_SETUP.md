# AdMob Setup Guide

⚠️ **IMPORTANT**: AdMob ads **DO NOT work in Expo Go**. They only work in:
- Development builds (`npx expo run:android` or `npx expo run:ios`)
- Production builds (`eas build`)

## Current Setup

For now, the app uses **mock ads** that won't crash in Expo Go. Real ads will work when you create a development or production build.

## Why Mock Ads?

The app is currently configured with mock AdMob components that:
- ✅ Don't crash in Expo Go
- ✅ Show placeholder text where ads will appear
- ✅ Allow you to test the app in Expo Go
- ❌ Won't display real ads in Expo Go

## How to Get Real Ads Working

### Option 1: Development Build (Recommended for Testing)

Create a development build to test ads:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

### Option 2: Production Build (For Release)

Create a production build:

```bash
# Build for Android
eas build --profile production --platform android

# Build for iOS
eas build --profile production --platform ios
```

## Setting Up Real AdMob (For Production)

### 1. Get Your AdMob Account Ready
1. Go to https://apps.admob.com
2. Create an AdMob account (if you don't have one)
3. Add your app:
   - App name: "Expense Tracker"
   - Platform: Android & iOS
   - Package name: `com.taruntejajangila.mobileapp`

### 2. Install a Working AdMob Package

Since `expo-ads-admob` is deprecated, we need to use `react-native-google-mobile-ads`:

```bash
cd ExpenseTrackerExpo
npm uninstall expo-ads-admob
npm install react-native-google-mobile-ads
```

### 3. Configure app.json

Add the AdMob plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "YOUR-ANDROID-APP-ID",
          "iosAppId": "YOUR-IOS-APP-ID"
        }
      ]
    ]
  }
}
```

### 4. Update AdMobService.ts

Replace the mock implementation with real AdMob code using `react-native-google-mobile-ads`.

### 5. Create Ad Units

1. In AdMob console, go to "Ad units"
2. Create ad units:
   - **Banner Ad**: For bottom of screens
   - **Interstitial Ad**: Full screen ads
3. Copy the ad unit IDs

### 6. Update Ad Unit IDs

Replace test IDs in `AdMobService.ts`:

```typescript
const AD_UNIT_IDS = {
  interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};
```

## Current Status

✅ Mock implementation working in Expo Go  
❌ Real ads not working in Expo Go (requires development/production build)  
⏳ Ready to implement real ads when you create a build

## Next Steps

1. Keep using mock ads for Expo Go development
2. When ready to test real ads, create a development build
3. When ready to release, set up real AdMob account and create production build

## Important Notes

- Mock ads are placeholders and won't generate revenue
- Real ads only work in development/production builds
- Need to rebuild app after adding AdMob package
- AdMob account needs approval before ads will show