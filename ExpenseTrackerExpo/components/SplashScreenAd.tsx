import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SplashScreenAdProps {
  visible: boolean;
  onClose: () => void;
  onAdClicked?: () => void;
  onAdClosed?: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreenAd: React.FC<SplashScreenAdProps> = ({
  visible,
  onClose,
  onAdClicked,
  onAdClosed,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setCountdown(5);
    }
  }, [visible]);

  const handleAdClick = () => {
    if (onAdClicked) {
      onAdClicked();
    }
    // Simulate ad click behavior
  };

  const handleClose = () => {
    if (onAdClosed) {
      onAdClosed();
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={[styles.overlay, { 
        paddingTop: Platform.OS === 'ios' ? insets.top : 0,
        paddingBottom: 0,
      }]}>
        {/* Floating Skip Button */}
        <Animated.View 
          style={[
            styles.floatingSkipContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              top: Platform.OS === 'ios' ? insets.top + 20 : 40,
            },
          ]}
        >
          <TouchableOpacity 
            style={[styles.floatingSkipButton, { opacity: countdown === 0 ? 1 : 0.5 }]} 
            onPress={handleClose}
            disabled={countdown > 0}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text style={styles.floatingSkipText} allowFontScaling={false}>
              {countdown > 0 ? `${countdown}s` : 'Continue to the app'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          style={[
            styles.adContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginBottom: Platform.OS === 'ios' ? -insets.bottom : 0,
            },
          ]}
        >
          {/* Ad Header */}
          <View style={styles.adHeader}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText} allowFontScaling={false}>Sponsored</Text>
            </View>
          </View>

          {/* Ad Content */}
          <View style={styles.adContent}>
            {/* App Icon */}
            <View style={styles.appIconContainer}>
              <View style={styles.appIcon}>
                <Ionicons name="trending-up" size={50} color="#007AFF" />
              </View>
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appName} allowFontScaling={false}>Smart Finance Pro</Text>
              <Text style={styles.appDeveloper} allowFontScaling={false}>by Finance Solutions</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={18} color="#FFD700" />
                  ))}
                </View>
                <Text style={styles.ratingText} allowFontScaling={false}>4.9 • 5.2M downloads</Text>
              </View>
            </View>

            {/* App Screenshots */}
            <View style={styles.screenshotsContainer}>
              <View style={styles.screenshot}>
                <View style={styles.screenshotPlaceholder}>
                  <Ionicons name="analytics" size={28} color="#4CAF50" />
                  <Text style={styles.screenshotLabel} allowFontScaling={false}>Analytics</Text>
                </View>
              </View>
              <View style={styles.screenshot}>
                <View style={styles.screenshotPlaceholder}>
                  <Ionicons name="wallet" size={28} color="#FF9800" />
                  <Text style={styles.screenshotLabel} allowFontScaling={false}>Budget</Text>
                </View>
              </View>
              <View style={styles.screenshot}>
                <View style={styles.screenshotPlaceholder}>
                  <Ionicons name="pie-chart" size={28} color="#2196F3" />
                  <Text style={styles.screenshotLabel} allowFontScaling={false}>Reports</Text>
                </View>
              </View>
            </View>

            {/* App Description */}
            <Text style={styles.appDescription} allowFontScaling={false}>
              Take control of your finances with AI-powered insights, smart budgeting, and real-time expense tracking. 
              Join millions of users who've transformed their financial health.
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.featureText} allowFontScaling={false}>Bank-level Security</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="sync" size={16} color="#2196F3" />
                <Text style={styles.featureText} allowFontScaling={false}>Auto Sync</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="cloud" size={16} color="#FF9800" />
                <Text style={styles.featureText} allowFontScaling={false}>Cloud Backup</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.installButton} onPress={handleAdClick}>
                <Text style={styles.installButtonText} allowFontScaling={false}>Install Now</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Notice */}
            <Text style={styles.privacyNotice} allowFontScaling={false}>
              By tapping Install, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  adContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: width,
    height: height * 0.9,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  floatingSkipContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  floatingSkipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingSkipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  adBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  adBadgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
  adContent: {
    padding: 24,
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 100,
    height: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  appDeveloper: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 10,
  },
  ratingText: {
    color: '#666',
    fontSize: 12,
  },
  screenshotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  screenshot: {
    flex: 1,
    marginHorizontal: 6,
  },
  screenshotPlaceholder: {
    height: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingVertical: 8,
  },
  screenshotLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  appDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    color: '#333',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtons: {
    marginBottom: 16,
  },
  installButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyNotice: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
