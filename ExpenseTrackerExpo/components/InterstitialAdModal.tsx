import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InterstitialAdModalProps {
  visible: boolean;
  onClose: () => void;
  onAdClicked?: () => void;
}

const { width, height } = Dimensions.get('window');

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  visible,
  onClose,
  onAdClicked,
}) => {
  const handleAdClick = () => {
    if (onAdClicked) {
      onAdClicked();
    }
    // Simulate ad click behavior
    // Ad clicked - simulating app store redirect
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.adContainer}>
          {/* Ad Header */}
          <View style={styles.adHeader}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText} allowFontScaling={false}>Ad</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Ad Content */}
          <View style={styles.adContent}>
            {/* App Icon */}
            <View style={styles.appIconContainer}>
              <View style={styles.appIcon}>
                <Ionicons name="phone-portrait" size={40} color="#007AFF" />
              </View>
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appName} allowFontScaling={false}>Premium Finance Tracker</Text>
              <Text style={styles.appDeveloper} allowFontScaling={false}>by Finance Apps Inc.</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={16} color="#FFD700" />
                  ))}
                </View>
                <Text style={styles.ratingText} allowFontScaling={false}>4.8 • 2.1M downloads</Text>
              </View>
            </View>

            {/* App Screenshots */}
            <View style={styles.screenshotsContainer}>
              <View style={styles.screenshot}>
                <View style={styles.screenshotPlaceholder}>
                  <Ionicons name="trending-up" size={24} color="#4CAF50" />
                </View>
              </View>
              <View style={styles.screenshot}>
                <View style={styles.screenshotPlaceholder}>
                  <Ionicons name="pie-chart" size={24} color="#FF9800" />
                </View>
              </View>
              <View style={styles.screenshot}>
                <View style={styles.screenshotPlaceholder}>
                  <Ionicons name="wallet" size={24} color="#2196F3" />
                </View>
              </View>
            </View>

            {/* App Description */}
            <Text style={styles.appDescription} allowFontScaling={false}>
              Track expenses, manage budgets, and achieve your financial goals with our powerful finance tracker. 
              Get insights into your spending patterns and save money smarter.
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.installButton} onPress={handleAdClick}>
                <Text style={styles.installButtonText} allowFontScaling={false}>Install</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreInfoButton} onPress={handleAdClick}>
                <Text style={styles.moreInfoButtonText} allowFontScaling={false}>More Info</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Notice */}
            <Text style={styles.privacyNotice} allowFontScaling={false}>
              By tapping Install, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  adBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  adContent: {
    padding: 20,
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    color: '#333',
    marginBottom: 4,
  },
  appDeveloper: {
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    color: '#666',
  },
  screenshotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenshot: {
    flex: 1,
    marginHorizontal: 4,
  },
  screenshotPlaceholder: {
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  appDescription: {
    color: '#666',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  installButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  installButtonText: {
    color: '#FFFFFF',
  },
  moreInfoButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  moreInfoButtonText: {
    color: '#666',
  },
  privacyNotice: {
    color: '#999',
  },
});

