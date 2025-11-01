import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';

// NOTE: Do not import react-native-google-mobile-ads at module top-level.
// We'll require it dynamically inside the component when ads are enabled.

interface BannerAdComponentProps {
  bannerSize?: any;
}

// Google AdMob Banner Component
export const BannerAdComponent: React.FC<BannerAdComponentProps> = () => {
  const disableAds = (process.env.EXPO_PUBLIC_DISABLE_ADS === '1') || (Constants.appOwnership === 'expo');
  const [refreshKey, setRefreshKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Auto-refresh every 60 seconds (increased from 45 to reduce request frequency)
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setRetryCount(0); // Reset retry count on refresh
      console.log('🔄 Banner ad auto-refreshed');
    }, 60000); // 60 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Retry logic for failed ad loads
  useEffect(() => {
    if (!disableAds && retryCount > 0 && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
      const retryTimer = setTimeout(() => {
        console.log(`🔄 Retrying banner ad load (attempt ${retryCount + 1})`);
        setRefreshKey(prev => prev + 1);
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
  }, [retryCount, disableAds]);

  if (disableAds) {
    return (
      <View style={styles.container}>
        <View style={[styles.placeholder, { height: 50 }]}> 
          <Text style={styles.placeholderText}>Ads disabled in Expo Go</Text>
        </View>
      </View>
    );
  }

  // Use real banner ads when enabled
  return (
    <View style={styles.container} key={refreshKey}>
      {(() => {
        const { BannerAd, BannerAdSize, AdEventType } = require('react-native-google-mobile-ads');
        return (
          <BannerAd
            unitId={Platform.OS === 'ios' 
              ? 'ca-app-pub-3940256099942544/2934735716' // iOS test ID (update when ready)
              : 'ca-app-pub-4113490348002307/5694070602'} // Android REAL Banner Ad
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={() => {
              console.log('✅ Banner ad loaded');
              setRetryCount(0); // Reset retry count on successful load
            }}
            onAdFailedToLoad={(error) => {
              console.error('❌ Banner ad failed to load:', error);
              if (retryCount < 3) {
                // Retry with exponential backoff
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);
                console.log(`⚠️ Banner ad retry scheduled (attempt ${newRetryCount})`);
              } else {
                console.log('❌ Banner ad failed after 3 retries, will retry on next refresh');
                setRetryCount(0); // Reset for next refresh cycle
              }
            }}
            onAdOpened={() => {
              console.log('📱 Banner ad opened');
            }}
            onAdClosed={() => {
              console.log('📱 Banner ad closed');
            }}
          />
        );
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  placeholder: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#777',
    fontSize: 12,
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: '#757575',
  },
  buttonContainer: {
    marginLeft: 12,
  },
  button: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
