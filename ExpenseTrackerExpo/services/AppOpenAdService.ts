import { Platform } from 'react-native';
import Constants from 'expo-constants';

const disableAds = (process.env.EXPO_PUBLIC_DISABLE_ADS === '1') || (Constants.appOwnership === 'expo');

let appOpenAdLoaded = false;
let appOpenAdShown = false;
let appOpenAd: any = null;

// Interstitial ad instance
let interstitialAd: any = null;
let interstitialAdLoaded = false;

// Initialize App Open Ad
export const initializeAppOpenAd = async () => {
  if (disableAds) {
    return;
  }
  try {
    const { AppOpenAd: RNAppOpenAd, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = Platform.OS === 'android'
      ? 'ca-app-pub-4113490348002307/8975566416' // MyPaisa App Open Ad
      : 'ca-app-pub-3940256099942544/3419835294'; // Test ID for iOS
    
    appOpenAd = RNAppOpenAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    
    appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ App Open Ad loaded');
      appOpenAdLoaded = true;
    });
    
    appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('📱 App Open Ad closed');
      appOpenAdLoaded = false;
      appOpenAdShown = false;
      // Load next ad
      appOpenAd.load();
    });
    
    await loadAppOpenAd();
    console.log('✅ App Open Ad initialized');
  } catch (error) {
    console.log('❌ App Open Ad initialization error:', error);
  }
};

// Load App Open Ad
export const loadAppOpenAd = async () => {
  if (disableAds) return;
  if (!appOpenAd) {
    console.log('⚠️ App Open Ad not initialized');
    return;
  }

  try {
    await appOpenAd.load();
    console.log('✅ App Open Ad load requested');
  } catch (error) {
    console.error('❌ App Open Ad load error:', error);
  }
};

// Show App Open Ad (call this when app opens or comes to foreground)
export const showAppOpenAd = async () => {
  if (disableAds) return;
  // Only show once per app session
  if (appOpenAdShown) {
    console.log('⚠️ App Open Ad already shown this session');
    return;
  }

  try {
    if (appOpenAdLoaded && appOpenAd) {
      await appOpenAd.show();
      appOpenAdShown = true;
      console.log('📱 Showing App Open Ad');
    } else {
      console.log('⚠️ App Open Ad not loaded yet');
    }
  } catch (error) {
    console.error('❌ App Open Ad show error:', error);
  }
};

// Initialize Interstitial Ad
export const initializeInterstitial = async () => {
  if (disableAds) {
    return;
  }
  try {
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = Platform.OS === 'android'
      ? 'ca-app-pub-4113490348002307/7222774699' // MyPaisa Interstitial Ad
      : 'ca-app-pub-3940256099942544/4411468910'; // Test ID for iOS
    
    interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    
    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ Interstitial ad loaded');
      interstitialAdLoaded = true;
    });
    
    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('📱 Interstitial ad closed');
      interstitialAdLoaded = false;
      // Load next ad
      interstitialAd.load();
    });
    
    // Load the first ad
    await interstitialAd.load();
    console.log('✅ Interstitial ad initialized');
  } catch (error) {
    console.log('❌ Interstitial ad initialization error:', error);
  }
};

// Show Interstitial Ad
export const showInterstitial = async () => {
  if (disableAds) return;
  try {
    if (interstitialAdLoaded && interstitialAd) {
      const isLoaded = await interstitialAd.loaded;
      if (isLoaded) {
        await interstitialAd.show();
        console.log('📱 Showing Interstitial ad');
      } else {
        console.log('⚠️ Interstitial ad not loaded yet');
        await interstitialAd.load();
      }
    } else {
      console.log('⚠️ Interstitial ad not initialized');
    }
  } catch (error) {
    console.error('❌ Interstitial ad show error:', error);
  }
};

export default {
  initializeAppOpenAd,
  loadAppOpenAd,
  showAppOpenAd,
  initializeInterstitial,
  showInterstitial,
};

