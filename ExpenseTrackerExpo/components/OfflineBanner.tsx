import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNetwork } from '../context/NetworkContext';

interface OfflineBannerProps {
  isVisible: boolean;
  onRetry?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isVisible, onRetry }) => {
  const { theme } = useTheme();
  const { checkConnection, isReconnecting } = useNetwork();
  const insets = useSafeAreaInsets();

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      await checkConnection();
    }
  };

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.error,
      paddingTop: insets.top + 8,
      paddingBottom: 8
    }]}>
      <View style={styles.content}>
        <Ionicons name="wifi-outline" size={16} color="#FFFFFF" />
        <Text style={styles.text} allowFontScaling={false}>
          {isReconnecting ? 'Reconnecting...' : 'You\'re offline. Some features may not work.'}
        </Text>
        {!isReconnecting && (
          <Text style={styles.retryText} allowFontScaling={false} onPress={handleRetry}>
            Retry
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default OfflineBanner;
