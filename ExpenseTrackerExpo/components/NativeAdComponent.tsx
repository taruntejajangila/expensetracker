import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

// Detect environment
const isProduction = Constants.executionEnvironment === 'storeClient';
const isExpoGo = !Constants.executionEnvironment || Constants.executionEnvironment === 'storeClient';

// Your real Native Ad Unit ID
const NATIVE_AD_UNIT_ID = Platform.OS === 'android'
  ? 'ca-app-pub-4113490348002307/4380988938' // MyPaisa Native Ad
  : 'ca-app-pub-3940256099942544/1047700117'; // Test ID for iOS (replace when you get iOS ID)

interface NativeAdComponentProps {
  refreshKey?: number; // Auto-refresh support
}

export const NativeAdComponent: React.FC<NativeAdComponentProps> = ({ refreshKey = 0 }) => {
  const [mockAdContent, setMockAdContent] = useState({
    title: 'Track Your Expenses Better',
    subtitle: 'Advanced budget analytics',
    description: 'Get insights into your spending patterns',
    action: 'Learn More',
  });
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);

  // Auto-refresh every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setInternalRefreshKey(prev => prev + 1);
      console.log('🔄 Native ad auto-refreshed');
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Mock ad content variation
    const variants = [
      { title: 'Save Money Smartly', subtitle: 'Smart budgeting tips', description: 'Discover personalized savings insights', action: 'Explore' },
      { title: 'Track Your Expenses Better', subtitle: 'Advanced budget analytics', description: 'Get insights into your spending patterns', action: 'Learn More' },
      { title: 'Financial Freedom', subtitle: 'Investment insights', description: 'Build wealth with smart decisions', action: 'Start Now' },
    ];
    setMockAdContent(variants[Math.floor(Math.random() * variants.length)]);
  }, [refreshKey, internalRefreshKey]);

  // If in production and NativeAdView is available, use real ads
  if (isProduction && !isExpoGo) {
    try {
      const { NativeAdView, NativeAd } = require('react-native-google-mobile-ads');
      
      // Create native ad
      const nativeAd = NativeAd.createForAdRequest(NATIVE_AD_UNIT_ID);
      
      // Real Native Ad Implementation
      return (
        <View style={styles.container}>
          <NativeAdView
            nativeAd={nativeAd}
            style={styles.adContainer}
          >
            {/* AdMob SDK will render the native ad here */}
          </NativeAdView>
        </View>
      );
    } catch (error) {
      console.log('NativeAdView not available, showing mock');
      // Fall through to mock
    }
  }

  // Mock Native Ad for Expo Go
  const combinedRefreshKey = refreshKey + internalRefreshKey;
  
  return (
    <View style={styles.container} key={combinedRefreshKey}>
      <View style={styles.adContainer}>
        {/* Sponsored Label */}
        <View style={styles.sponsoredLabel}>
          <Text style={styles.sponsoredText}>Sponsored</Text>
        </View>

        {/* Ad Content */}
        <View style={styles.contentRow}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>💳</Text>
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.adTitle} numberOfLines={1}>
              {mockAdContent.title}
            </Text>
            <Text style={styles.adSubtitle} numberOfLines={1}>
              {mockAdContent.subtitle}
            </Text>
            <Text style={styles.adDescription} numberOfLines={2}>
              {mockAdContent.description}
            </Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => console.log('Native ad clicked (mock)')}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{mockAdContent.action}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  adContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sponsoredLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  sponsoredText: {
    fontSize: 10,
    color: '#757575',
    fontWeight: '500',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  adTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  adSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 11,
    color: '#9E9E9E',
    lineHeight: 14,
  },
  ctaButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

