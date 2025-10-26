import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';

// Detect environment
const isProduction = Constants.executionEnvironment === 'storeClient';

// Import real banner if available
let BannerAd: any = null;
try {
  if (isProduction) {
    BannerAd = require('react-native-google-mobile-ads').BannerAd;
  }
} catch (error) {
  console.log('BannerAd not available');
}

interface BannerAdComponentProps {
  bannerSize?: any;
}

// Google AdMob Banner Component
export const BannerAdComponent: React.FC<BannerAdComponentProps> = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Auto-refresh every 45 seconds
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      console.log('🔄 Banner ad auto-refreshed');
    }, 45000); // 45 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // If in production and BannerAd is available, use real ads
  if (isProduction && BannerAd) {
    return (
      <View style={styles.container} key={refreshKey}>
        <BannerAd
          unitId={Platform.OS === 'ios' 
            ? 'ca-app-pub-3940256099942544/2934735716'
            : 'ca-app-pub-3940256099942544/6300978111'}
          size={'fullBanner'}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={() => console.log('✅ Real banner ad loaded')}
          onAdFailedToLoad={(error) => console.error('❌ Banner ad failed to load:', error)}
        />
      </View>
    );
  }

  // Otherwise, show mock banner (Expo Go)
  return (
    <View style={styles.container} key={refreshKey}>
      <View style={styles.innerContainer}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📱</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Expense Tracker Pro</Text>
          <Text style={styles.rating}>4.5 ⭐ (2.3K reviews)</Text>
        </View>

        {/* Install Button */}
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Install</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 80,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
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
