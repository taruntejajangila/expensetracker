// Import font fix first - must be before any other imports
import './globalFontFix';

// Import display size normalizer EARLY - before any Dimensions usage
import { normalizeDisplaySize } from './utils/DisplaySizeNormalizer';

// Normalize display size IMMEDIATELY on module load (before React imports)
// This ensures Dimensions are locked before any component uses them
if (typeof normalizeDisplaySize === 'function') {
  normalizeDisplaySize();
}

// Import network error handler to override global fetch
import './utils/NetworkErrorHandler';

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SimpleDrawer } from './components/SimpleDrawer';
import { DrawerProvider, useDrawer } from './context/DrawerContext';
import SplashScreen from './components/SplashScreen';

// Import all your existing screens
import HomeScreen from './screens/HomeScreen';
import OfflineIndicator from './components/common/OfflineIndicator';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationScreen from './screens/NotificationScreen';
import SpentInMonthScreen from './screens/SpentInMonthScreen';
import AllTransactionScreen from './screens/AllTransactionScreen';
import AccountsScreen from './screens/AccountsScreen';
import CreditCardScreen from './screens/CreditCardScreen';
import LoansScreen from './screens/LoansScreen';
import BudgetPlanningScreen from './screens/BudgetPlanningScreen';
import SavingsGoalsScreen from './screens/SavingsGoalsScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import AddAccountScreen from './screens/AddAccountScreen';
import AddCreditCardScreen from './screens/AddCreditCardScreen';
import AddLoanScreen from './screens/AddLoanScreen';
import AddGoalScreen from './screens/AddGoalScreen';
import EditCreditCardScreen from './screens/EditCreditCardScreen';
import EditLoanScreen from './screens/EditLoanScreen';
import EditGoalScreen from './screens/EditGoalScreen';
import BankAccountDetailScreen from './screens/BankAccountDetailScreen';
import CreditCardDetailsScreen from './screens/CreditCardDetailsScreen';
import LoanAccountScreen from './screens/LoanAccountScreen';
import LoanAmortizationScreen from './screens/LoanAmortizationScreen';
import LoanCalculatorScreen from './screens/LoanCalculatorScreen';
import DebtPlansScreen from './screens/DebtPlansScreen';
import BudgetScreen from './screens/BudgetScreen';
import ExpensesScreen from './screens/ExpensesScreen';
import IncomeScreen from './screens/IncomeScreen';
import RemindersScreen from './screens/RemindersScreen';
import NotificationDetailScreen from './screens/NotificationDetailScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import AboutScreen from './screens/AboutScreen';
import CreateTicketScreen from './screens/CreateTicketScreen';
import MyTicketsScreen from './screens/MyTicketsScreen';
import TicketDetailScreen from './screens/TicketDetailScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsConditionsScreen from './screens/TermsConditionsScreen';

// Import auth screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Import onboarding screen
import OnboardingScreen from './screens/OnboardingScreen';


// Import contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScrollProvider } from './context/ScrollContext';
import { NotificationProvider } from './context/NotificationContext';
import { SimpleTicketProvider as TicketProvider } from './contexts/SimpleTicketContext';
import { NetworkProvider } from './context/NetworkContext';

// Import daily reminder service
import DailyReminderService from './services/DailyReminderService';
import NotificationNavigationService from './services/NotificationNavigationService';

// Import AdMob components
import AppOpenAdService from './services/AppOpenAdService';
// Note: react-native-google-mobile-ads requires development build
// import mobileAds from 'react-native-google-mobile-ads';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator
function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AllTransactions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          // Settings removed from bottom tab bar
          // else if (route.name === 'Settings') {
          //   iconName = focused ? 'settings' : 'settings-outline';
          // }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          allowFontScaling: false,
          marginTop: 2,
          fontWeight: '500',
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 10,
          paddingHorizontal: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AllTransactions" component={AllTransactionScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {/* Settings hidden as screen is empty */}
      {/* <Tab.Screen name="Settings" component={SettingsScreen} /> */}
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="SpentInMonth" component={SpentInMonthScreen} />
      <Stack.Screen name="AllTransaction" component={AllTransactionScreen} />
      <Stack.Screen name="Accounts" component={AccountsScreen} />
      {/* Credit Cards feature hidden for v1 release */}
      {/* <Stack.Screen name="CreditCards" component={CreditCardScreen} /> */}
      <Stack.Screen name="Loans" component={LoansScreen} />
      <Stack.Screen name="BudgetPlanning" component={BudgetPlanningScreen} />
      <Stack.Screen name="SavingsGoals" component={SavingsGoalsScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="AddAccount" component={AddAccountScreen} />
      {/* Credit Cards feature hidden for v1 release */}
      {/* <Stack.Screen name="AddCreditCard" component={AddCreditCardScreen} /> */}
      <Stack.Screen name="AddLoan" component={AddLoanScreen} />
      <Stack.Screen name="AddGoal" component={AddGoalScreen} />
      {/* Credit Cards feature hidden for v1 release */}
      {/* <Stack.Screen name="EditCreditCard" component={EditCreditCardScreen} /> */}
      <Stack.Screen name="EditLoan" component={EditLoanScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
      <Stack.Screen name="BankAccountDetail" component={BankAccountDetailScreen} />
      {/* Credit Cards feature hidden for v1 release */}
      {/* <Stack.Screen name="CreditCardDetails" component={CreditCardDetailsScreen} /> */}
      <Stack.Screen name="LoanAccount" component={LoanAccountScreen} />
      <Stack.Screen name="LoanAmortization" component={LoanAmortizationScreen} />
      <Stack.Screen name="LoanCalculator" component={LoanCalculatorScreen} />
      <Stack.Screen name="DebtPlans" component={DebtPlansScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="Income" component={IncomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
      <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
}

// Auth Stack Navigator
function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Drawer removed - using stack navigation instead

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

  // App Navigator Component
function AppNavigator() {
  const { user, isLoading, isOfflineMode } = useAuth();
  const { drawerOpen, closeDrawer } = useDrawer();
  const [appInitialized, setAppInitialized] = useState(false);
  const [adMobInitialized, setAdMobInitialized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [forceStopLoading, setForceStopLoading] = useState(false);

  // Normalize display size on app start to prevent Android display size scaling
  useEffect(() => {
    normalizeDisplaySize();
  }, []);
  
  // FOR TESTING: Force show onboarding (remove this in production)
  const FORCE_SHOW_ONBOARDING = false; // Set to false for production
  const navigationRef = React.useRef(null);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading || checkingOnboarding) {
        console.log('⚠️ Loading timeout - forcing app to continue');
        setForceStopLoading(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading, checkingOnboarding]);

  // Check onboarding status on app start
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem('onboarding_completed');
        
        // Show onboarding only for new users (no onboarding_completed flag) AND not logged in
        // Never show onboarding for logged-in users
        if (FORCE_SHOW_ONBOARDING) {
          // Force show for testing only
          setShowOnboarding(true);
          setOnboardingCompleted(false);
        } else if (hasCompletedOnboarding === null && !user) {
          // First time user and not logged in - show onboarding
          setShowOnboarding(true);
          setOnboardingCompleted(false);
        } else {
          // Returning user or logged in user - skip onboarding
          setOnboardingCompleted(true);
          setShowOnboarding(false);
        }
        setCheckingOnboarding(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setCheckingOnboarding(false);
        setOnboardingCompleted(true); // Default to completed on error
        setShowOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]); // Add user dependency

  // Initialize AdMob - Wait for app to be ready
  useEffect(() => {
    const initializeAdMob = async () => {
      // Wait for app to fully load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        console.log('🚀 Starting AdMob initialization...');
        
        // Import AdMob service
        const AdMobService = require('./services/AdMobService').default;
        
        // Initialize AdMob
        await AdMobService.initialize();
        console.log('✅ AdMob initialized successfully');
        
        setAdMobInitialized(true);
        
        // Initialize other ad types with delays
        setTimeout(async () => {
          try {
            await AppOpenAdService.initializeAppOpenAd();
            console.log('✅ App Open Ad ready');
          } catch (error) {
            console.error('⚠️ App Open Ad initialization failed:', error);
          }
        }, 1000);
        
        setTimeout(async () => {
          try {
            await AppOpenAdService.initializeInterstitial();
            console.log('✅ Interstitial Ad ready');
          } catch (error) {
            console.error('⚠️ Interstitial Ad initialization failed:', error);
          }
        }, 2000);
        
      } catch (error) {
        console.error('❌ AdMob initialization failed completely:', error);
        setAdMobInitialized(true); // Continue app anyway
      }
    };

    initializeAdMob();
  }, []);

  // Don't auto-show App Open Ad - it should only show when returning from background
  // Show App Open Ad when app returns from background (not on fresh launch)
  useEffect(() => {
    let appState = AppState.currentState;
    let lastBackgroundTime = null;
    
    const handleAppStateChange = (nextAppState) => {
      // Track previous state to detect true background->foreground transitions
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App is returning from background
        const timeSinceBackground = lastBackgroundTime ? Date.now() - lastBackgroundTime : Infinity;
        
        // Check if an interstitial ad was just closed (within last 5 seconds)
        const lastInterstitialCloseTime = global.__lastInterstitialCloseTime || 0;
        const timeSinceInterstitialClose = Date.now() - lastInterstitialCloseTime;
        const wasInterstitialJustClosed = timeSinceInterstitialClose < 5000; // 5 seconds threshold
        
        // Only show app open ad if:
        // 1. User is logged in
        // 2. AdMob is initialized
        // 3. Not on splash screen
        // 4. App was in background for at least 1 second (to avoid false positives from ad closes)
        // 5. No interstitial ad was just closed (wait at least 5 seconds)
        if (user && adMobInitialized && !showSplash && timeSinceBackground > 1000 && !wasInterstitialJustClosed) {
          AppOpenAdService.showAppOpenAd()
            .catch((error) => {
              console.error('❌ App Open Ad failed on app state change:', error);
              // Silently fail - don't crash the app
            });
        } else if (wasInterstitialJustClosed) {
          console.log('⚠️ Skipping app open ad - interstitial ad was just closed');
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background - record the time
        lastBackgroundTime = Date.now();
      }
      
      appState = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, adMobInitialized, showSplash]);

  useEffect(() => {
    // Mark app as initialized when user is ready (don't wait for AdMob)
    if (!isLoading && !appInitialized) {
      setAppInitialized(true);
    }
  }, [isLoading, appInitialized]);

  // Initialize daily reminders and notification navigation when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      const initializeServices = async () => {
        try {
          // Initialize daily reminders
          await DailyReminderService.getInstance().initialize();
          
          // Set up notification navigation service
          NotificationNavigationService.getInstance().setNavigationRef(navigationRef.current);
          
          // Check for any pending notifications
          await NotificationNavigationService.getInstance().checkPendingNotification();
          
        } catch (error) {
          console.error('Failed to initialize services:', error);
        }
      };
      
      initializeServices();
    }
  }, [user, isLoading]);

  // Handle notification responses (when user taps on notifications)
  useEffect(() => {
    if (user && !isLoading) {
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('🔔 User tapped notification:', response.notification.request.content);
        
        // Use the notification navigation service to handle the response
        NotificationNavigationService.getInstance().handleNotificationResponse(response);
      });

      return () => {
        responseListener.remove();
      };
    }
  }, [user, isLoading]);

  // Check for pending budget reminders when app starts or comes to foreground
  useEffect(() => {
    if (user && !isLoading) {
      const checkBudgetReminder = async () => {
        try {
          const pendingReminder = await DailyReminderService.getInstance().checkPendingBudgetReminder();
          if (pendingReminder) {
            // Navigate to budget planning screen after a short delay
            setTimeout(() => {
              // This would be handled by navigation in the actual app
              console.log('🚀 Should navigate to Budget Planning screen due to notification tap');
            }, 1000);
          }
        } catch (error) {
          console.error('Error checking pending budget reminder:', error);
        }
      };

      checkBudgetReminder();
    }
  }, [user, isLoading]);


  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setOnboardingCompleted(true);
      setShowOnboarding(false);
      console.log('✅ Onboarding completed successfully');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      setOnboardingCompleted(true);
      setShowOnboarding(false);
    }
  };


  // Stop loading after timeout or when all checks complete
  const shouldShowLoading = (isLoading || checkingOnboarding) && !forceStopLoading;
  
  // Show splash screen first
  if (showSplash) {
    return (
      <SplashScreen 
        onComplete={() => {
          setShowSplash(false);
        }} 
      />
    );
  }
  
  if (shouldShowLoading) {
    return <LoadingScreen />;
  }

  // Show onboarding only for first-time users who are not logged in
  // Never show onboarding for logged-in users
  if (showOnboarding && !onboardingCompleted && !user) {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <OfflineIndicator />
        {(user || isOfflineMode) ? <MainStackNavigator /> : <AuthStackNavigator />}
        {user && <SimpleDrawer isOpen={drawerOpen} onClose={closeDrawer} />}
        {/* Left edge swipe opener */}
        
      </NavigationContainer>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <ThemeProvider>
            <DrawerProvider>
              <ScrollProvider>
                <NotificationProvider>
                  <TicketProvider>
                    <AppNavigator />
                  </TicketProvider>
                </NotificationProvider>
              </ScrollProvider>
            </DrawerProvider>
          </ThemeProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}