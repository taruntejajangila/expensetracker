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
      : 'ca-app-pub-4113490348002307/8975566416'; // MyPaisa App Open Ad (using Android ID for now)
    
    appOpenAd = RNAppOpenAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    
    appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ App Open Ad loaded');
      appOpenAdLoaded = true;
    });
    
    appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('❌ App Open Ad error:', error);
      appOpenAdLoaded = false;
      // Retry loading with delay
      setTimeout(() => {
        if (appOpenAd) {
          try {
            const loadPromise = appOpenAd.load();
            if (loadPromise && typeof loadPromise.catch === 'function') {
              loadPromise.catch((err) => {
                console.error('❌ App Open Ad retry failed:', err);
              });
            }
          } catch (err) {
            console.error('❌ Error calling appOpenAd.load():', err);
          }
        }
      }, 2000);
    });
    
    appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('📱 App Open Ad closed');
      appOpenAdLoaded = false;
      appOpenAdShown = false;
      // Load next ad with delay
      setTimeout(() => {
        if (appOpenAd) {
          try {
            const loadPromise = appOpenAd.load();
            if (loadPromise && typeof loadPromise.catch === 'function') {
              loadPromise.catch((error) => {
                console.error('❌ Failed to load next App Open Ad:', error);
              });
            }
          } catch (err) {
            console.error('❌ Error calling appOpenAd.load():', err);
          }
        }
      }, 1000);
    });
    
    await loadAppOpenAd();
    console.log('✅ App Open Ad initialized');
  } catch (error) {
    console.log('❌ App Open Ad initialization error:', error);
  }
};

// Load App Open Ad
export const loadAppOpenAd = async (): Promise<void> => {
  if (disableAds) {
    return Promise.resolve();
  }
  if (!appOpenAd) {
    console.log('⚠️ App Open Ad not initialized');
    return Promise.resolve();
  }

  try {
    const loadPromise = appOpenAd.load();
    if (loadPromise && typeof loadPromise.then === 'function') {
      await loadPromise;
      console.log('✅ App Open Ad load requested');
      return Promise.resolve();
    } else {
      console.log('⚠️ App Open Ad load() did not return a promise');
      return Promise.resolve();
    }
  } catch (error) {
    console.error('❌ App Open Ad load error:', error);
    return Promise.reject(error);
  }
};

// Show App Open Ad (call this when app opens or comes to foreground)
export const showAppOpenAd = async (): Promise<void> => {
  if (disableAds) {
    return Promise.resolve();
  }
  // Only show once per app session
  if (appOpenAdShown) {
    console.log('⚠️ App Open Ad already shown this session');
    return Promise.resolve();
  }

  try {
    if (appOpenAdLoaded && appOpenAd) {
      await appOpenAd.show();
      appOpenAdShown = true;
      console.log('📱 Showing App Open Ad');
      return Promise.resolve();
    } else {
      console.log('⚠️ App Open Ad not loaded yet');
      return Promise.resolve();
    }
  } catch (error) {
    console.error('❌ App Open Ad show error:', error);
    return Promise.reject(error);
  }
};

// Initialize Interstitial Ad
let interstitialRetryCount = 0;
let interstitialRetryTimer: NodeJS.Timeout | null = null;

const retryInterstitialLoad = async () => {
  if (disableAds || !interstitialAd) return;
  
  if (interstitialRetryCount < 3) {
    const retryDelay = Math.min(1000 * Math.pow(2, interstitialRetryCount), 5000); // Exponential backoff, max 5s
    interstitialRetryTimer = setTimeout(async () => {
      interstitialRetryCount++;
      console.log(`🔄 Retrying interstitial ad load (attempt ${interstitialRetryCount})`);
      try {
        if (interstitialAd) {
          const loadPromise = interstitialAd.load();
          if (loadPromise && typeof loadPromise.catch === 'function') {
            loadPromise.catch((error) => {
              console.error(`❌ Interstitial ad retry ${interstitialRetryCount} failed:`, error);
              if (interstitialRetryCount < 3) {
                retryInterstitialLoad();
              } else {
                console.log('❌ Interstitial ad failed after 3 retries');
                interstitialRetryCount = 0; // Reset for next cycle
              }
            });
          } else {
            // If load() doesn't return a promise, try again
            if (interstitialRetryCount < 3) {
              retryInterstitialLoad();
            } else {
              console.log('❌ Interstitial ad failed after 3 retries');
              interstitialRetryCount = 0;
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error in retry function:`, error);
        if (interstitialRetryCount < 3) {
          retryInterstitialLoad();
        } else {
          interstitialRetryCount = 0;
        }
      }
    }, retryDelay);
  } else {
    interstitialRetryCount = 0; // Reset for next cycle
  }
};

export const initializeInterstitial = async () => {
  if (disableAds) {
    return;
  }
  try {
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = Platform.OS === 'android'
      ? 'ca-app-pub-4113490348002307/7222774699' // MyPaisa Interstitial Ad
      : 'ca-app-pub-4113490348002307/7222774699'; // MyPaisa Interstitial Ad (using Android ID for now)
    
    interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    
    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ Interstitial ad loaded');
      interstitialAdLoaded = true;
      interstitialRetryCount = 0; // Reset retry count on successful load
    });
    
    interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('❌ Interstitial ad error:', error);
      interstitialAdLoaded = false;
      // Retry loading the ad
      retryInterstitialLoad();
    });
    
    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('📱 Interstitial ad closed');
      interstitialAdLoaded = false;
      interstitialRetryCount = 0; // Reset retry count
      
      // Set a flag to prevent app open ad from showing immediately after interstitial closes
      // This prevents the app from treating interstitial close as app open
      const interstitialCloseTime = Date.now();
      if (typeof global !== 'undefined') {
        (global as any).__lastInterstitialCloseTime = interstitialCloseTime;
      }
      console.log('⚠️ Interstitial ad closed - preventing app open ad for 5 seconds');
      
      // Load next ad with retry logic
      setTimeout(() => {
        if (interstitialAd) {
          try {
            const loadPromise = interstitialAd.load();
            if (loadPromise && typeof loadPromise.catch === 'function') {
              loadPromise.catch((error) => {
                console.error('❌ Failed to load next interstitial after close:', error);
                retryInterstitialLoad();
              });
            } else {
              // If load doesn't return a promise, use retry function
              retryInterstitialLoad();
            }
          } catch (err) {
            console.error('❌ Error calling interstitialAd.load():', err);
            retryInterstitialLoad();
          }
        }
      }, 1000); // Small delay before loading next ad
    });
    
    // Load the first ad
    try {
      const loadPromise = interstitialAd.load();
      if (loadPromise && typeof loadPromise.then === 'function') {
        await loadPromise;
      }
    } catch (error) {
      console.error('❌ Error loading initial interstitial:', error);
    }
    console.log('✅ Interstitial ad initialized');
  } catch (error) {
    console.log('❌ Interstitial ad initialization error:', error);
    // Retry initialization
    setTimeout(() => {
      initializeInterstitial();
    }, 2000);
  }
};

// Show Interstitial Ad
export const showInterstitial = async (): Promise<void> => {
  if (disableAds) {
    return Promise.resolve();
  }
  try {
    if (interstitialAdLoaded && interstitialAd) {
      const isLoaded = await interstitialAd.loaded;
      if (isLoaded) {
        await interstitialAd.show();
        console.log('📱 Showing Interstitial ad');
        return Promise.resolve();
      } else {
        console.log('⚠️ Interstitial ad not loaded yet');
        await interstitialAd.load();
        return Promise.resolve();
      }
    } else {
      console.log('⚠️ Interstitial ad not initialized');
      return Promise.resolve();
    }
  } catch (error) {
    console.error('❌ Interstitial ad show error:', error);
    return Promise.reject(error);
  }
};

export default {
  initializeAppOpenAd,
  loadAppOpenAd,
  showAppOpenAd,
  initializeInterstitial,
  showInterstitial,
};

