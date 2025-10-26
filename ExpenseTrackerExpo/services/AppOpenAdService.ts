import Constants from 'expo-constants';
import { Alert } from 'react-native';

// Detect environment
const isProduction = Constants.executionEnvironment === 'storeClient';
const isExpoGo = !Constants.executionEnvironment || Constants.executionEnvironment === 'storeClient';

let AppOpenAd: any = null;
let appOpenAdLoaded = false;
let appOpenAdShown = false;

// Initialize App Open Ad
export const initializeAppOpenAd = async () => {
  if (isExpoGo || !isProduction) {
    console.log('🎭 App Open Ad initialized (mock)');
    return;
  }

  try {
    // Import real AppOpenAd only in production
    const mobileAds = require('react-native-google-mobile-ads');
    AppOpenAd = mobileAds.AppOpenAd;
    
    await loadAppOpenAd();
    console.log('✅ App Open Ad initialized (real)');
  } catch (error) {
    console.log('⚠️ Real App Open Ad not available, using mock');
  }
};

// Load App Open Ad
export const loadAppOpenAd = async () => {
  if (!AppOpenAd) {
    console.log('🎭 Loading mock App Open Ad');
    appOpenAdLoaded = true;
    return;
  }

  try {
    // Create App Open Ad (use test ID for now)
    const adUnitId = __DEV__
      ? 'ca-app-pub-3940256099942544/3419835294' // Test Ad ID
      : 'YOUR_APP_OPEN_AD_UNIT_ID'; // Replace with your real ID
    
    appOpenAdLoaded = true;
    console.log('✅ App Open Ad loaded');
  } catch (error) {
    console.error('❌ App Open Ad load error:', error);
  }
};

// Show App Open Ad (call this when app opens or comes to foreground)
export const showAppOpenAd = async () => {
  // Only show once per app session
  if (appOpenAdShown) {
    console.log('⚠️ App Open Ad already shown this session');
    return;
  }

  if (isExpoGo || !isProduction) {
    // Mock: Show an alert
    Alert.alert(
      'Advertisement',
      'App Open Ad (Mock)\n\nIn production, you will see a real Google AdMob App Open Ad when the app launches.',
      [
        {
          text: 'Got it',
          style: 'default',
        },
      ],
      { cancelable: true }
    );
    appOpenAdShown = true;
    console.log('📱 Showing mock App Open Ad');
    return;
  }

  try {
    if (appOpenAdLoaded && AppOpenAd) {
      await AppOpenAd.show();
      appOpenAdShown = true;
      console.log('📱 Showing real App Open Ad');
      
      // Listen for ad closed event and reload for next time
      AppOpenAd.addEventListener('closed', () => {
        console.log('📱 App Open Ad closed');
        appOpenAdLoaded = false;
        appOpenAdShown = false;
        loadAppOpenAd(); // Load next ad
      });
    } else {
      console.log('⚠️ App Open Ad not loaded yet');
    }
  } catch (error) {
    console.error('❌ App Open Ad show error:', error);
  }
};

export default {
  initializeAppOpenAd,
  loadAppOpenAd,
  showAppOpenAd,
};

