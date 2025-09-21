// Import font fix first - must be before any other imports
import './globalFontFix';

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import all your existing screens
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
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

// Import auth screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Import custom drawer
import CustomDrawer from './components/common/CustomDrawer';

// Import contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScrollProvider } from './context/ScrollContext';
import { NotificationProvider } from './context/NotificationContext';

// Import daily reminder service
import DailyReminderService from './services/DailyReminderService';

// Import AdMob components
import { SplashScreenAd } from './components/SplashScreenAd';
// Note: react-native-google-mobile-ads requires development build
// import mobileAds from 'react-native-google-mobile-ads';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          allowFontScaling: false,
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
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

// Drawer Navigator
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="MainApp" component={MainStackNavigator} />
    </Drawer.Navigator>
  );
}

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
  const { user, isLoading } = useAuth();
  const [showSplashAd, setShowSplashAd] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  const [adMobInitialized, setAdMobInitialized] = useState(false);

  // Mock AdMob initialization for Expo Go
  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        console.log('Mock: AdMob initialization skipped (requires development build)');
        setAdMobInitialized(true);
      } catch (error) {
        console.log('Mock: AdMob initialization failed:', error);
        setAdMobInitialized(true);
      }
    };

    initializeAdMob();
  }, []);

  useEffect(() => {
    // Show splash ad when app starts (only for authenticated users and after AdMob is initialized)
    if (!isLoading && user && !appInitialized && adMobInitialized) {
      const shouldShowAd = Math.random() > 0.3; // 70% chance to show ad
      if (shouldShowAd) {
        setShowSplashAd(true);
      }
      setAppInitialized(true);
    }
  }, [isLoading, user, appInitialized, adMobInitialized]);

  // Initialize daily reminders when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      const initializeDailyReminders = async () => {
        try {
          await DailyReminderService.getInstance().initialize();
        } catch (error) {
          console.error('Failed to initialize daily reminders:', error);
        }
      };
      
      initializeDailyReminders();
    }
  }, [user, isLoading]);

  // Handle notification responses (when user taps on notifications)
  useEffect(() => {
    if (user && !isLoading) {
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('🔔 User tapped notification - showing splash ad for monetization');
        
        // Handle the notification response in the service
        DailyReminderService.getInstance().handleNotificationResponse(response);
        
        // Show splash ad when user comes through notification (monetization opportunity)
        setShowSplashAd(true);
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

  const handleSplashAdClose = () => {
    console.log('📱 Splash ad closed - user continued to app without ad engagement');
    setShowSplashAd(false);
  };

  const handleSplashAdClick = () => {
    // Handle ad click - track monetization metrics
    console.log('💰 Splash screen ad clicked - monetization event triggered');
    console.log('📊 User came through notification and engaged with ad');
    
    // Track this as a successful monetization event
    // This could be sent to analytics service for revenue tracking
    const monetizationEvent = {
      type: 'notification_driven_ad_click',
      timestamp: new Date().toISOString(),
      source: 'splash_ad_from_notification',
      revenue_potential: true
    };
    
    console.log('💵 Monetization Event:', monetizationEvent);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {user ? <DrawerNavigator /> : <AuthStackNavigator />}
      
      {/* Splash Screen Ad */}
      <SplashScreenAd
        visible={showSplashAd}
        onClose={handleSplashAdClose}
        onAdClicked={handleSplashAdClick}
        onAdClosed={() => console.log('Splash ad closed')}
      />
    </NavigationContainer>
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
      <AuthProvider>
        <ThemeProvider>
          <ScrollProvider>
            <NotificationProvider>
              <AppNavigator />
            </NotificationProvider>
          </ScrollProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}