import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Constants from 'expo-constants';

// NOTE: Do not import react-native-google-mobile-ads at module top-level.
// We'll require it dynamically inside the component when ads are enabled.

interface BannerAdComponentProps {
  bannerSize?: any;
}

// Google AdMob Banner Component
export const BannerAdComponent: React.FC<BannerAdComponentProps> = () => {
  const disableAds = (process.env.EXPO_PUBLIC_DISABLE_ADS === '1') || (Constants.appOwnership === 'expo');
  const [retryCount, setRetryCount] = useState(0);
  const [adLibraryLoaded, setAdLibraryLoaded] = useState(false);
  const [bannerSize, setBannerSize] = useState<any>(null);

  // Note: Removed auto-refresh interval and retry remounting to prevent layout shifts/shaking
  // BannerAd from react-native-google-mobile-ads handles refresh internally
  // Remounting causes visual "shake" as layout recalculates

  // Load ad library asynchronously to prevent blocking
  useEffect(() => {
    if (!disableAds) {
      try {
        const adLibrary = require('react-native-google-mobile-ads');
        const { BannerAdSize } = adLibrary;
        setAdLibraryLoaded(true);
        
        // Calculate banner size - use actual screen width but prevent overflow
        // Get actual window dimensions (these are already normalized by DisplaySizeNormalizer)
        const windowDims = Dimensions.get('window');
        const actualScreenWidth = windowDims.width; // This is already normalized by our DisplaySizeNormalizer
        
        // Use ANCHORED_ADAPTIVE_BANNER which is Google's recommended format
        // It will adapt to the container width, and our container uses full width
        // The DisplaySizeNormalizer ensures Dimensions.get() returns normalized values
        const calculatedSize = BannerAdSize.ANCHORED_ADAPTIVE_BANNER || BannerAdSize.ADAPTIVE_BANNER || BannerAdSize.BANNER;
        
        // Don't constrain width - let the banner use full container width
        // The container itself is already constrained by normalized dimensions
        const maxWidth = undefined; // Let banner use full width of container
        
        setBannerSize(calculatedSize);
        
        console.log('📱 Banner ad size calculated:', {
          actualScreenWidth: actualScreenWidth,
          windowWidth: windowDims.width,
          windowHeight: windowDims.height,
          pixelRatio: windowDims.scale,
          bannerSize: calculatedSize,
          strategy: 'ANCHORED_ADAPTIVE_BANNER with full-width container',
        });
      } catch (error) {
        console.warn('⚠️ BannerAd library failed to load:', error);
        setAdLibraryLoaded(false);
      }
    }
  }, [disableAds]);

  if (disableAds || !adLibraryLoaded) {
    return (
      <View style={styles.container}>
        <View style={[styles.placeholder, { height: 50 }]}> 
          <Text style={styles.placeholderText}>
            {disableAds ? 'Ads disabled in Expo Go' : 'Loading ad...'}
          </Text>
        </View>
      </View>
    );
  }

  // Use real banner ads when enabled
  // Note: Removed auto-refresh and key prop to prevent layout shifts/shaking
  // BannerAd handles its own refresh cycle internally without remounting
  const { BannerAd, BannerAdSize, AdEventType } = require('react-native-google-mobile-ads');
  
  // Use calculated adaptive size if available, otherwise fallback to standard banner
  // This ensures ads are responsive to screen size, not display size setting
  const adSize = bannerSize || BannerAdSize.BANNER; // Fallback to standard 320x50 if not calculated yet
  
  return (
    <View style={styles.container}>
      <View style={styles.bannerWrapper}>
        <BannerAd
          unitId={Platform.OS === 'ios' 
            ? 'ca-app-pub-3940256099942544/2934735716' // Test Banner Ad (iOS) - Keep test ID for now
            : 'ca-app-pub-4113490348002307/5694070602'} // Real Banner Ad (Android) - MyPaisa
          size={adSize}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
            onAdLoaded={() => {
              console.log('✅ Banner ad loaded');
              setRetryCount(0); // Reset retry count on successful load
            }}
            onAdFailedToLoad={(error) => {
          const errorCode = error?.code || '';
          const errorMessage = error?.message || '';
          
          // Check if it's an invalid request error (non-recoverable)
          if (errorCode === 'error-code-invalid-request' || errorMessage.includes('invalid')) {
            // Only log once per refresh cycle to reduce noise
            if (retryCount === 0) {
              console.warn('⚠️ Banner ad unit ID may be invalid or not configured in AdMob. Check ad unit ID: ' + (Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/2934735716' : 'ca-app-pub-4113490348002307/5694070602'));
            }
            // Don't retry for invalid requests - they won't succeed
            setRetryCount(0);
            return;
          }
          
          // For other errors (like no-fill), retry with exponential backoff
          if (errorCode === 'error-code-no-fill') {
            // No-fill is normal in dev/test - just log silently
            if (retryCount === 0) {
              console.log('ℹ️ No ad inventory available (normal in development)');
            }
            setRetryCount(0);
            return;
          }
          
          // For other recoverable errors, retry
              console.error('❌ Banner ad failed to load:', error);
              if (retryCount < 3) {
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);
                console.log(`⚠️ Banner ad retry scheduled (attempt ${newRetryCount})`);
              } else {
                console.log('❌ Banner ad failed after 3 retries, will retry on next refresh');
            setRetryCount(0);
              }
            }}
            onAdOpened={() => {
              console.log('📱 Banner ad opened');
            }}
            onAdClosed={() => {
              console.log('📱 Banner ad closed');
            }}
          />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%', // Ensure container doesn't exceed screen width
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    minHeight: 50, // Prevent layout shift when ad loads/unloads
    // Constrain ad to normalized dimensions - prevents ads from growing with display size
    alignItems: 'center', // Center the banner ad horizontally
    justifyContent: 'center', // Center the banner ad vertically
  },
  bannerWrapper: {
    width: '100%',
    alignItems: 'center', // Center the banner ad within wrapper
    justifyContent: 'center', // Center the banner ad within wrapper
    maxWidth: '100%', // Ensure wrapper doesn't exceed container
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
