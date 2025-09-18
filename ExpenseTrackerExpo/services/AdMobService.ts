// Mock AdMobService for testing
export const interstitialAd = {
  load: () => {
    console.log('Loading interstitial ad');
    return Promise.resolve();
  },
  show: () => {
    console.log('Showing interstitial ad');
    return Promise.resolve();
  },
  isLoaded: () => {
    return true;
  },
  setShowAdCallback: (callback: () => void) => {
    console.log('Setting show ad callback');
    // Store the callback for later use if needed
    (interstitialAd as any).showCallback = callback;
  }
};

export const bannerAd = {
  load: () => {
    console.log('Loading banner ad');
    return Promise.resolve();
  },
  show: () => {
    console.log('Showing banner ad');
    return Promise.resolve();
  },
  hide: () => {
    console.log('Hiding banner ad');
    return Promise.resolve();
  }
};

export default {
  interstitialAd,
  bannerAd,
  initialize: () => {
    console.log('Initializing AdMob service');
    return Promise.resolve();
  }
};

