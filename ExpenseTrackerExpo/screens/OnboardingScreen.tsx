import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string[];
  features: string[];
  mockup?: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    title: 'Welcome!',
    subtitle: 'Your personal finance manager for a better financial future',
    description: '',
    icon: 'home',
    gradient: ['#FFFFFF', '#FFFFFF'],
    features: []
  },
  {
    id: 2,
    title: 'Track Your Money',
    subtitle: 'Monitor all your income, expenses, and transactions in one secure place',
    description: '',
    icon: 'analytics',
    gradient: ['#FFFFFF', '#FFFFFF'],
    features: []
  },
  {
    id: 3,
    title: 'Plan & Budget',
    subtitle: 'Create smart budgets, set financial goals, and achieve your dreams',
    description: '',
    icon: 'pie-chart',
    gradient: ['#FFFFFF', '#FFFFFF'],
    features: []
  },
  {
    id: 4,
    title: 'Start Your Financial Journey',
    subtitle: 'Take control of your money with MyPaisa Finance Manager',
    description: '',
    icon: 'rocket',
    gradient: ['#FFFFFF', '#FFFFFF'],
    features: []
  }
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  
  // Fallback theme in case useTheme fails
  const theme = {
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    }
  };
  
  // Fallback insets in case useSafeAreaInsets fails
  const insets = {
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  };
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const contentScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Auto-slide timers
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);
  const userInactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const [isUserActive, setIsUserActive] = useState(false);

  const handleNext = () => {
    // Mark user as active
    handleUserActivity();
    
    if (currentSlide < slides.length - 1) {
      handleSlideChange(currentSlide + 1);
    } else {
      // On last slide, complete onboarding instead of looping
      handleComplete();
    }
  };

  const handlePrevious = () => {
    // Mark user as active
    handleUserActivity();
    
    if (currentSlide > 0) {
      handleSlideChange(currentSlide - 1);
    } else {
      // On first slide, go to last slide (loop back)
      handleSlideChange(slides.length - 1);
    }
  };


  const handleSlideChange = (newSlideIndex: number) => {
    // Clear existing timers
    clearTimers();
    
    // Fade out and scale down content
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentScaleAnim, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentSlide(newSlideIndex);
      scrollViewRef.current?.scrollTo({
        x: newSlideIndex * width,
        animated: false,
      });
      // Reset scale for new content
      contentScaleAnim.setValue(1.05);
      // Small delay before fade in for smoother transition
      setTimeout(() => {
        // Fade in and scale up content
        Animated.parallel([
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(contentScaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          })
        ]).start(() => {
          // Start auto-slide after slide change
          startAutoSlide();
        });
      }, 50);
    });
  };

  const handleUserActivity = () => {
    setIsUserActive(true);
    clearTimers();
    
    // Start 5-second inactivity timer
    userInactivityTimer.current = setTimeout(() => {
      setIsUserActive(false);
      startAutoSlide();
    }, 5000);
  };

  const startAutoSlide = () => {
    // Auto-slide disabled - users must navigate manually
    // if (!isUserActive) {
    //   // First slide holds for 5 seconds, rest for 3 seconds
    //   const slideDelay = currentSlide === 0 ? 5000 : 3000;
    //   
    //   autoSlideTimer.current = setTimeout(() => {
    //     // Loop back to first slide if at last slide, otherwise go to next slide
    //     const nextSlide = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
    //     handleSlideChange(nextSlide);
    //   }, slideDelay);
    // }
  };

  const clearTimers = () => {
    if (autoSlideTimer.current) {
      clearTimeout(autoSlideTimer.current);
      autoSlideTimer.current = null;
    }
    if (userInactivityTimer.current) {
      clearTimeout(userInactivityTimer.current);
      userInactivityTimer.current = null;
    }
  };

  // Initialize auto-slide on component mount
  useEffect(() => {
    // Start 5-second inactivity timer on mount
    userInactivityTimer.current = setTimeout(() => {
      setIsUserActive(false);
      startAutoSlide();
    }, 5000);

    // Cleanup timers on unmount
    return () => {
      clearTimers();
    };
  }, []);

  // Update auto-slide when currentSlide changes
  useEffect(() => {
    if (!isUserActive) {
      startAutoSlide();
    }
  }, [currentSlide, isUserActive]);

  const handleComplete = () => {
    // Clear all timers when completing
    clearTimers();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };


  const renderSlide = (slide: SlideData, index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <LinearGradient
        colors={slide.gradient as [string, string]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >

        {/* Content */}
        <Animated.View style={[styles.content, { 
          opacity: contentFadeAnim,
          transform: [{ scale: contentScaleAnim }]
        }]}>
          {/* Logo for first slide, Icon for others */}
          <View style={styles.iconContainer}>
            {index === 0 ? (
              <Image 
                source={require('../assets/images/logo.png')} // Replace with your logo path
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={slide.icon as any} size={120} color="#0c2851" />
            )}
          </View>

          {/* App Name for first slide */}
          {index === 0 && (
            <Text style={styles.appName}>MyPaisa Finance Manager</Text>
          )}

          {/* Title */}
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

        </Animated.View>

        {/* Navigation */}
        <View style={[styles.navigation, { bottom: insets.bottom + 40 }]}>
          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            {slides.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: dotIndex === index ? '#0c2851' : '#666666',
                    width: dotIndex === index ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {index > 0 && (
              <TouchableOpacity
                style={styles.previousButton}
                onPress={handlePrevious}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {index === slides.length - 1 ? (
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      onTouchStart={handleUserActivity}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        decelerationRate="fast"
        style={styles.scrollView}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    position: 'relative',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
    marginBottom: 20,
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 0,
    paddingHorizontal: 20,
    lineHeight: 22,
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    color: 'rgba(102,102,102,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 280,
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 10,
    fontWeight: '500',
    lineHeight: 20,
  },
  navigation: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0c2851',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextText: {
    display: 'none',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0c2851',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButton: {
    backgroundColor: '#0c2851',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
