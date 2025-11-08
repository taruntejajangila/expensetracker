import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppOpenAdService from '../services/AppOpenAdService';

const { width, height } = Dimensions.get('window');
// Fixed density to prevent scaling with display size changes
// Match the native density lock (2.5f) - don't use PixelRatio.get() as it can change
const LOCKED_DENSITY = 2.5; // Match native density lock

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const fadeOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(8)).current;
  const dotScales = [
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.6)).current,
  ];
  const isCompleted = useRef(false);

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Title/subtitle fade-in and lift
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 650,
        delay: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslate, {
        toValue: 0,
        duration: 650,
        delay: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Bouncing dots loader
    const makeBounce = (val: Animated.Value, delay: number) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: 320, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.6, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]).start(() => loop());
      };
      loop();
    };
    makeBounce(dotScales[0], 0);
    makeBounce(dotScales[1], 100);
    makeBounce(dotScales[2], 200);


    // Safety timeout - always complete after max 4 seconds even if ad fails
    const safetyTimeout = setTimeout(() => {
      if (!isCompleted.current) {
        console.log('⚠️ Splash screen safety timeout - completing');
        isCompleted.current = true;
        onComplete();
      }
    }, 4000); // Maximum 4 seconds

    // Check if this is a first-time user to skip ad on first launch
    const checkAndComplete = async () => {
      if (!isCompleted.current) {
        try {
          // Check if user has launched app before
          const hasLaunchedBefore = await AsyncStorage.getItem('app_launched_before');
          
          isCompleted.current = true;
          onComplete();
          
          // Mark that app has been launched
          if (!hasLaunchedBefore) {
            await AsyncStorage.setItem('app_launched_before', 'true');
            console.log('📱 First launch detected - skipping ad to prevent initialization issues');
            return; // Skip ad for first-time users
          }
          
          // For returning users, try to show ad after longer delay
          // This ensures AdMob is initialized
          setTimeout(() => {
            try {
              AppOpenAdService.showAppOpenAd()
                .then(() => {
                  console.log('✅ App Open Ad shown from splash');
                })
                .catch((error) => {
                  console.error('❌ App Open Ad failed from splash:', error);
                  // Silently fail - don't crash the app
                });
            } catch (error) {
              console.error('❌ Error calling App Open Ad:', error);
              // Silently fail - don't crash the app
            }
          }, 2000); // Longer delay to ensure AdMob is fully initialized
        } catch (error) {
          console.error('❌ Error checking launch status:', error);
          // If check fails, just complete without ad
          isCompleted.current = true;
          onComplete();
        }
      }
    };

    const timer = setTimeout(() => {
      checkAndComplete();
    }, 2000); // Show splash for 2 seconds

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimeout);
    };
  }, [onComplete, fadeOpacity]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOpacity }]}>
      {/* Background gradient layer */}
      <LinearGradient
        colors={["#F5FAFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative background accents */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg 
          width={width} 
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Soft bubbles - normalized for density */}
          <Circle cx={width * 0.15} cy={height * 0.2} r={66 / LOCKED_DENSITY} fill="rgba(10,102,255,0.06)" />
          <Circle cx={width * 0.86} cy={height * 0.24} r={46 / LOCKED_DENSITY} fill="rgba(10,102,255,0.05)" />
          <Circle cx={width * 0.22} cy={height * 0.76} r={56 / LOCKED_DENSITY} fill="rgba(10,102,255,0.04)" />

          {/* Diagonal accent at top-right */}
          <Path
            d={`M ${width} 0 L ${width} ${height * 0.18} L ${width * 0.62} 0 Z`}
            fill="rgba(10,102,255,0.06)"
          />
          {/* Wave accent at bottom */}
          <Path
            d={`M 0 ${height * 0.86} C ${width * 0.25} ${height * 0.92}, ${width * 0.5} ${height * 0.8}, ${width * 0.75} ${height * 0.88} C ${width * 0.9} ${height * 0.92}, ${width} ${height * 0.9}, ${width} ${height} L 0 ${height} Z`}
            fill="rgba(10,102,255,0.05)"
          />

          {/* Subtle dotted grid - normalized for density */}
          {Array.from({ length: 5 }).map((_, r) => (
            Array.from({ length: 10 }).map((__, c) => (
              <Circle
                key={`g-${r}-${c}`}
                cx={width * 0.1 + c * 18}
                cy={height * 0.1 + r * 16}
                r={1.1 / LOCKED_DENSITY}
                fill="rgba(17,24,39,0.08)"
              />
            ))
          ))}
        </Svg>
      </View>
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoWrap}>
          <Image source={require('../assets/splash-icon.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Animated.Text
          style={[
            styles.simpleTitle,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
          ]}
          allowFontScaling={false}
        >
          PaysaGo
        </Animated.Text>
        <Animated.View
          style={[
            styles.subtitleBadge,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
          ]}
        >
          <Text style={styles.subtitleBadgeText} allowFontScaling={false}>Finance Manager</Text>
        </Animated.View>
      </View>

      {/* Loading Indicator - Bouncing dots */}
      <View style={styles.loadingContainer}>
        <View style={styles.dotsRow}>
          {dotScales.map((s, i) => (
            <Animated.View key={i} style={[styles.dotItem, { transform: [{ scale: s }] }]} />
          ))}
        </View>
      </View>

      {/* Made in India */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText} allowFontScaling={false}>Made with ❤️ in INDIA</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 160,
    height: 160,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  simpleTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  simpleSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  subtitleBadge: {
    backgroundColor: '#F1F5FF',
    borderWidth: 0,
    borderColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  subtitleBadgeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  brandLeft: {
    fontSize: 28,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.4,
  },
  brandRight: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A66FF',
    letterSpacing: 0.6,
    marginLeft: 6,
  },
  brandUnderline: {
    width: 64,
    height: 3,
    backgroundColor: '#0A66FF',
    borderRadius: 2,
    marginBottom: 10,
  },
  appTagline: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  taglineChip: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    marginBottom: 6,
  },
  taglineChipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dotItem: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A66FF',
    marginHorizontal: 6,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default SplashScreen;
