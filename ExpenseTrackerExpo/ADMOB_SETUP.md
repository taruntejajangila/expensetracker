# AdMob Setup Guide

## 🎯 Current Status

✅ **Conditional AdMob Implementation Ready**
- Expo Go: Uses mock ads
- Production: Uses real Google AdMob ads

## 📋 Setup Checklist for Production

### 1. Get Ad Unit IDs from Google AdMob
- Create account at https://apps.admob.com
- Add your app (Android/iOS)
- Create banner and interstitial ad units
- Copy your ad unit IDs

### 2. Update Real Ad IDs

**File:** `ExpenseTrackerExpo/services/AdMobServiceReal.ts`

Replace test IDs with your real IDs:
```typescript
const AD_UNIT_IDS = {
  ios: {
    banner: 'YOUR_IOS_BANNER_ID',
    interstitial: 'YOUR_IOS_INTERSTITIAL_ID',
  },
  android: {
    banner: 'YOUR_ANDROID_BANNER_ID',
    interstitial: 'YOUR_ANDROID_INTERSTITIAL_ID',
  },
};
```

**File:** `ExpenseTrackerExpo/components/AdMobComponents.tsx`

Update BannerAd unitId:
```typescript
unitId={Platform.OS === 'ios' 
  ? 'YOUR_IOS_BANNER_ID'
  : 'YOUR_ANDROID_BANNER_ID'}
```

### 3. Update app.json

Update the Android and iOS app IDs:
```json
{
  "plugins": [
    ["react-native-google-mobile-ads", {
      "androidAppId": "YOUR_ANDROID_APP_ID",
      "iosAppId": "YOUR_IOS_APP_ID"
    }]
  ]
}
```

### 4. Build Production App

```bash
eas build --platform android --profile production
```

## 🧪 Testing

- **Expo Go**: Shows mock ads ✅
- **Development Build**: Will use real ads
- **Production Build**: Will use real ads after AdMob approval

## 📊 Revenue Potential

With 1000 daily users:
- 5,000 ad impressions/day
- Estimated $10-50/day revenue
- Banner ads: $1-5 per 1000 impressions
- Interstitial ads: $5-20 per 1000 impressions

## 📍 Ad Placements

Ads are currently in:
- Home screen
- Add transaction screen
- All transactions screen
- Account screens
- Loan screens
- Budget & goals screens
- And more...

## ⚠️ Important Notes

1. AdMob account approval takes 24-48 hours
2. Test with Google's test IDs first
3. Monitor ad performance in AdMob console
4. Respect AdMob policies to avoid account issues

