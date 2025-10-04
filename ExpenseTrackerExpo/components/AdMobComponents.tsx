import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
// Note: react-native-google-mobile-ads requires development build
// import { BannerAd as GoogleBannerAd, InterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';



// Mock Banner Ad Component for Expo Go compatibility
export const BannerAd: React.FC<{
  size?: 'banner' | 'fullBanner' | 'largeBanner' | 'mediumRectangle' | 'leaderboard' | 'smartBannerPortrait' | 'smartBannerLandscape';
  position?: 'top' | 'bottom' | 'inline';
  onAdLoaded?: () => void;
  onAdFailed?: (error: any) => void;
  unitId?: string;
}> = ({ 
  size = 'smartBannerPortrait',
  position = 'bottom',
  onAdLoaded,
  onAdFailed,
  unitId = 'test-banner-id' // Mock test ID
}) => {
  // Call onAdLoaded callback to simulate successful ad load
  React.useEffect(() => {
    if (onAdLoaded) {
      onAdLoaded();
    }
  }, [onAdLoaded]);

  const { width, height } = getAdDimensions(size);
  
  // Mock banner ad display with exact Google AdMob dimensions
  return (
    <View style={[styles.mockBanner, { width, height }]}>
      <View style={styles.adContent}>
        <View style={styles.adImageContainer}>
          <View style={styles.adImagePlaceholder}>
            <Text style={styles.adImageText} allowFontScaling={false}>📱</Text>
          </View>
        </View>
        <View style={styles.adTextContainer}>
          <Text style={styles.adTitle} numberOfLines={1} allowFontScaling={false}>Premium Finance App</Text>
          <Text style={styles.adDescription} numberOfLines={2} allowFontScaling={false}>Track expenses smarter with AI insights and analytics</Text>
          <Text style={styles.adSponsored} allowFontScaling={false}>Sponsored</Text>
        </View>
        <TouchableOpacity style={styles.adButton}>
          <Text style={styles.adButtonText} allowFontScaling={false}>Install</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText} allowFontScaling={false}>Ad</Text>
      </View>
    </View>
  );
};

// Helper function to get exact Google AdMob dimensions
const getAdDimensions = (size: string): { width: number, height: number } => {
  const screenWidth = Dimensions.get('window').width;
  
  switch (size) {
    case 'banner':
      return { width: 320, height: 50 };
    case 'fullBanner':
      return { width: 468, height: 60 };
    case 'largeBanner':
      return { width: 320, height: 100 };
    case 'mediumRectangle':
      return { width: 300, height: 250 };
    case 'leaderboard':
      return { width: 728, height: 90 };
    case 'smartBannerPortrait':
      return { width: screenWidth, height: 50 };
    case 'smartBannerLandscape':
      return { width: screenWidth, height: 32 };
    default:
      return { width: screenWidth, height: 50 };
  }
};

const styles = StyleSheet.create({
  mockBanner: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 2,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    alignSelf: 'center',
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: '100%',
  },
  adImageContainer: {
    marginRight: 8,
  },
  adImagePlaceholder: {
    width: 32,
    height: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  adImageText: {
    fontSize: 16,
  },
  adTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  adTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 1,
  },
  adDescription: {
    fontSize: 10,
    color: '#5f6368',
    marginBottom: 1,
  },
  adSponsored: {
    fontSize: 8,
    color: '#9aa0a6',
    fontStyle: 'italic',
  },
  adButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    minWidth: 50,
    alignItems: 'center',
  },
  adButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  adBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  adBadgeText: {
    fontSize: 8,
    color: '#5f6368',
    fontWeight: '600',
  },
});

// Mock Interstitial Ad utility functions for Expo Go
export const createInterstitialAd = (unitId: string = 'test-interstitial-id') => {
  console.log('Mock: Creating interstitial ad with unit ID:', unitId);
  return {
    load: async () => {
      console.log('Mock: Interstitial ad loaded');
      return Promise.resolve();
    },
    show: async () => {
      console.log('Mock: Interstitial ad shown');
      return Promise.resolve();
    }
  };
};

export const showInterstitialAd = async (unitId: string = 'test-interstitial-id') => {
  try {
    console.log('Mock: Showing interstitial ad with unit ID:', unitId);
    
    // Simulate ad loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Mock: Interstitial ad shown successfully');
    return true;
  } catch (error) {
    console.log('Mock: Failed to show interstitial ad:', error);
    return false;
  }
};

