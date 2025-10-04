import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNetwork } from '../context/NetworkContext';

interface OfflineScreenProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
}

const { width, height } = Dimensions.get('window');

const OfflineScreen: React.FC<OfflineScreenProps> = ({ 
  onRetry, 
  title = "Oops! Your internet took a coffee break ☕",
  message = "Don't worry, your data is safe in the cloud! Tap the button below to reconnect."
}) => {
  const { theme } = useTheme();
  const { checkConnection, isOfflineMode, isReconnecting, forceOfflineCheck } = useNetwork();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isRetrying, setIsRetrying] = React.useState(false);

  // Fun animations
  useEffect(() => {
    // Bounce animation for the main container
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation for the retry button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation for the wifi icon
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    bounceAnimation.start();
    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      bounceAnimation.stop();
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const handleRetry = async () => {
    if (isRetrying) return; // Prevent multiple simultaneous retries
    
    setIsRetrying(true);
    
    try {
      // Force an immediate network check
      await forceOfflineCheck();
      
      // Add a small delay to let the state update
      setTimeout(() => {
        if (onRetry) {
          onRetry();
        }
        setIsRetrying(false);
      }, 1000);
    } catch (error) {
      console.log('🌐 Retry failed:', error);
      setIsRetrying(false);
    }
  };

  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const rotateTransform = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isOfflineMode) return null;

  // Show subtle reconnecting indication
  const isReconnectingState = isReconnecting;
  const displayTitle = title; // Keep original title
  const displayMessage = isReconnectingState 
    ? "Great! Your internet is back. Loading fresh data from the cloud..." 
    : message;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Animated Wifi Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            { 
              backgroundColor: isReconnectingState ? theme.colors.primary : theme.colors.error,
              transform: [
                { translateY: bounceTransform },
                { rotate: rotateTransform }
              ]
            }
          ]}
        >
          <Ionicons 
            name={isReconnectingState ? "cloud-download-outline" : "wifi-outline"} 
            size={60} 
            color="#FFFFFF" 
          />
        </Animated.View>

        {/* Subtle reconnecting indicator */}
        {isReconnectingState && (
          <View style={styles.reconnectingIndicator}>
            <Animated.View style={{ transform: [{ rotate: rotateTransform }] }}>
              <Ionicons name="refresh" size={16} color={theme.colors.primary} />
            </Animated.View>
            <Text style={[styles.reconnectingText, { color: theme.colors.primary }]} allowFontScaling={false}>
              Syncing...
            </Text>
          </View>
        )}

        {/* Fun Title */}
        <Text style={[styles.title, { color: theme.colors.text }]} allowFontScaling={false}>
          {displayTitle}
        </Text>

        {/* Friendly Message */}
        <Text style={[styles.message, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
          {displayMessage}
        </Text>

        {/* Fun Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="cloud-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Data Safe
            </Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Secure
            </Text>
          </View>
        </View>

        {/* Animated Retry Button - Hide during reconnecting */}
        {!isReconnectingState && (
          <Animated.View style={{ transform: [{ scale: isRetrying ? 1 : pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.retryButton, 
                { 
                  backgroundColor: isRetrying ? theme.colors.textSecondary : theme.colors.primary,
                  opacity: isRetrying ? 0.7 : 1
                }
              ]}
              onPress={handleRetry}
              activeOpacity={0.8}
              disabled={isRetrying}
            >
              <Ionicons 
                name={isRetrying ? "hourglass-outline" : "refresh"} 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.retryButtonText} allowFontScaling={false}>
                {isRetrying ? 'Checking...' : 'Wake Up Internet'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Fun Footer */}
        <Text style={[styles.footer, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
          💡 Tip: Check your WiFi or mobile data connection
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: width * 0.9,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
  reconnectingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 20,
    gap: 8,
  },
  reconnectingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineScreen;