import { Alert, Platform } from 'react-native';

// Mock AdMob Service - Realistic mock ads for Expo Go

export const initialize = async () => {
  console.log('✅ AdMob service initialized (mock for Expo Go)');
};

export const loadInterstitial = async () => {
  console.log('✅ Interstitial loaded (mock)');
};

export const showInterstitial = async () => {
  console.log('📱 Showing mock interstitial ad');
  
  // Show a realistic mock ad alert
  Alert.alert(
    'Advertisement',
    'This is a mock ad placeholder. In production builds, you will see real Google AdMob interstitial ads here.\n\nThese ads help support the app and keep it free to use.',
    [
      {
        text: 'Got it',
        style: 'default',
      },
    ],
    { cancelable: true }
  );
};

export const isInterstitialLoaded = async () => {
  return true;
};

export const getBannerAdUnitId = () => {
  return 'ca-app-pub-3940256099942544/6300978111'; // Google test ad ID
};

// Create mock interstitialAd object with setShowAdCallback
export const interstitialAd = {
  setShowAdCallback: (callback: () => void) => {
    // Mock: Store callback but don't do anything
    console.log('🔧 Interstitial ad callback set (mock)');
  },
  show: () => {
    console.log('📱 Showing interstitial ad');
  },
};

export default {
  initialize,
  loadInterstitial,
  showInterstitial,
  isInterstitialLoaded,
  getBannerAdUnitId,
  interstitialAd,
};

