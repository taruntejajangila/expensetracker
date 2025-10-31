import Constants from 'expo-constants';

const disableAds = (process.env.EXPO_PUBLIC_DISABLE_ADS === '1') || (Constants.appOwnership === 'expo');

let AdMobService: any;

if (disableAds) {
  // Minimal no-op implementation for Expo Go / disabled ads
  console.log('🚫 Ads disabled (Expo Go mode or env flag)');
  AdMobService = {
    initialize: async () => {},
    getBannerUnitId: () => '',
    getInterstitialUnitId: () => '',
  };
} else {
  // Real AdMob for dev client / APK
  AdMobService = require('./AdMobServiceReal').default;
  console.log('📱 Using REAL AdMob implementation');
}

export default AdMobService;
