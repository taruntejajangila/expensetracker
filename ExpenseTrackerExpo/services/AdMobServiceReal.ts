import mobileAds, { InterstitialAd, AdEventType, BannerAd } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// Test Ad Unit IDs (Google's test ads)
// Replace these with YOUR actual ad unit IDs from https://apps.admob.com
const AD_UNIT_IDS = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716', // Test banner
    interstitial: 'ca-app-pub-3940256099942544/4411468910', // Test interstitial
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111', // Test banner
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial
  },
};

// Get the appropriate ad unit ID for current platform
const getInterstitialId = () => {
  return Platform.OS === 'ios' 
    ? AD_UNIT_IDS.ios.interstitial 
    : AD_UNIT_IDS.android.interstitial;
};

const getBannerId = () => {
  return Platform.OS === 'ios' 
    ? AD_UNIT_IDS.ios.banner 
    : AD_UNIT_IDS.android.banner;
};

let interstitialAd: InterstitialAd | null = null;
let showAdCallback: (() => void) | null = null;
let isInitialized = false;

// Initialize AdMob
export const initialize = async () => {
  if (isInitialized) return;
  
  try {
    await mobileAds().initialize();
    console.log('✅ Real AdMob initialized successfully');
    
    // Create interstitial ad
    interstitialAd = InterstitialAd.createForAdRequest(getInterstitialId());
    
    // Load the first ad
    await loadInterstitial();
    
    isInitialized = true;
  } catch (error) {
    console.error('❌ AdMob initialization error:', error);
  }
};

// Load interstitial ad
export const loadInterstitial = async () => {
  if (!interstitialAd) {
    interstitialAd = InterstitialAd.createForAdRequest(getInterstitialId());
  }
  
  try {
    await interstitialAd.load();
    console.log('✅ Real interstitial loaded');
  } catch (error) {
    console.error('❌ Interstitial load error:', error);
  }
};

// Show interstitial ad
export const showInterstitial = async () => {
  if (!interstitialAd) {
    console.log('⚠️ Interstitial ad not loaded');
    return;
  }
  
  try {
    const loaded = await interstitialAd.loaded;
    if (loaded) {
      await interstitialAd.show();
      console.log('📱 Showing real interstitial ad');
    } else {
      console.log('⚠️ Ad not loaded yet, loading...');
      await loadInterstitial();
    }
  } catch (error) {
    console.error('❌ Interstitial show error:', error);
  }
};

// Check if interstitial is loaded
export const isInterstitialLoaded = async () => {
  if (!interstitialAd) return false;
  try {
    return await interstitialAd.loaded;
  } catch (error) {
    return false;
  }
};

// Get banner ad unit ID
export const getBannerAdUnitId = () => {
  return getBannerId();
};

// Create interstitialAd object compatible with existing code
export const interstitialAdObject = {
  setShowAdCallback: (callback: () => void) => {
    showAdCallback = callback;
    
    if (interstitialAd) {
      // Listen for ad events
      interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ Interstitial ad loaded');
      });
      
      interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('❌ Interstitial ad error:', error);
      });
      
      // When ad is closed, trigger callback
      interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📱 Interstitial ad closed');
        if (showAdCallback) {
          showAdCallback();
        }
        // Reload for next time
        loadInterstitial();
      });
    }
  },
  show: async () => {
    await showInterstitial();
  },
  load: async () => {
    await loadInterstitial();
  },
};

export default {
  initialize,
  loadInterstitial,
  showInterstitial,
  isInterstitialLoaded,
  getBannerAdUnitId,
  interstitialAd: interstitialAdObject,
};

