import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import Constants from 'expo-constants';
// Removed quick stats (circular graphs)
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';

// Fixed density to prevent scaling with display size changes
// Match the native density lock (2.5f) - don't use PixelRatio.get() as it can change
const LOCKED_DENSITY = 2.5; // Match native density lock

interface SimpleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleDrawer: React.FC<SimpleDrawerProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-280)).current; // Start off-screen
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Animate drawer when isOpen changes
  useEffect(() => {
    if (isOpen) {
      // Open animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -280,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  // No looping animation for first design

  // Quick stats removed


  // Grouped menu sections
  const navItems = [
    { icon: 'home-outline', label: 'Dashboard', screen: 'MainTabs' },
    { icon: 'calendar-outline', label: 'Monthly View', screen: 'SpentInMonth' },
    { icon: 'list-outline', label: 'All Transactions', screen: 'AllTransaction' },
  ];
  const moneyItems = [
    { icon: 'wallet-outline', label: 'Accounts', screen: 'Accounts' },
    { icon: 'cash-outline', label: 'Loans', screen: 'Loans' },
    { icon: 'ribbon-outline', label: 'Saving Goals', screen: 'SavingsGoals' },
    { icon: 'stats-chart-outline', label: 'Budget Planning', screen: 'BudgetPlanning' },
  ];
  const toolsItems = [
    { icon: 'alarm-outline', label: 'Reminders', screen: 'Reminders' },
    { icon: 'analytics-outline', label: 'Debt Plans', screen: 'DebtPlans' },
    { icon: 'calculator-outline', label: 'Loan Calculator', screen: 'LoanCalculator' },
  ];
  const supportItems = [
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'HelpSupport' },
    { icon: 'person-outline', label: 'Profile', screen: 'Profile' },
  ];

  const handleNavigation = (screen: string) => {
    onClose();
    // Route Dashboard to the Home tab explicitly
    if (screen === 'MainTabs') {
      // @ts-ignore
      navigation.navigate('MainTabs', { screen: 'Home' });
      return;
    }
    // Navigate to stack screens directly
    // @ts-ignore
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <>
      {/* Overlay */}
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
          !isOpen && { pointerEvents: 'none' },
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </Animated.View>
      
      {/* Drawer */}
      <Animated.View 
        style={[
          styles.drawer, 
          { 
            backgroundColor: theme.colors.background,
            transform: [{ translateX: slideAnim }],
          },
          !isOpen && { pointerEvents: 'none' },
        ]}
      >
        {/* Header */}
        <LinearGradient colors={["#0EA5E9", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.drawerHeaderGradient}>
          {/* First design: subtle wave + translucent circles */}
          <View pointerEvents="none" style={styles.headerGraphicContainer}>
            <Svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
              <Path
                d="M0,80 C40,60 60,110 100,90 C140,70 160,100 200,85 C240,70 260,95 300,80 L300,0 L0,0 Z"
                fill="rgba(255,255,255,0.10)"
              />
            </Svg>
            <Svg 
              width={80 / LOCKED_DENSITY} 
              height={80 / LOCKED_DENSITY} 
              viewBox={`0 0 ${80 / LOCKED_DENSITY} ${80 / LOCKED_DENSITY}`}
              preserveAspectRatio="xMidYMid meet"
              style={styles.headerCircleA}
            >
              <Circle cx={40 / LOCKED_DENSITY} cy={40 / LOCKED_DENSITY} r={38 / LOCKED_DENSITY} fill="rgba(255,255,255,0.06)" />
            </Svg>
            <Svg 
              width={48 / LOCKED_DENSITY} 
              height={48 / LOCKED_DENSITY} 
              viewBox={`0 0 ${48 / LOCKED_DENSITY} ${48 / LOCKED_DENSITY}`}
              preserveAspectRatio="xMidYMid meet"
              style={styles.headerCircleB}
            >
              <Circle cx={24 / LOCKED_DENSITY} cy={24 / LOCKED_DENSITY} r={22 / LOCKED_DENSITY} fill="rgba(255,255,255,0.10)" />
            </Svg>
          </View>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.userNameBright} numberOfLines={1} allowFontScaling={false}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail} numberOfLines={1} allowFontScaling={false}>{user?.email || ''}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* User Info removed (header already shows user) */}

        {/* Quick Stats removed */}

        {/* Menu Items */}
        <ScrollView style={styles.menuItems}>
          {/* Navigation */}
          {navItems.map((item, index) => (
            <TouchableOpacity key={`nav-${index}`} activeOpacity={0.85} style={[styles.menuItem, index === 0 && styles.firstMenuItem]} onPress={() => handleNavigation(item.screen)}>
              <Ionicons name={item.icon as any} size={18} color={theme.colors.text} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]} allowFontScaling={false}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.sectionDivider} />
          {/* Money */}
          {moneyItems.map((item, index) => (
            <TouchableOpacity key={`money-${index}`} activeOpacity={0.85} style={styles.menuItem} onPress={() => handleNavigation(item.screen)}>
              <Ionicons name={item.icon as any} size={18} color={theme.colors.text} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]} allowFontScaling={false}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.sectionDivider} />
          {/* Tools */}
          {toolsItems.map((item, index) => (
            <TouchableOpacity key={`tools-${index}`} activeOpacity={0.85} style={styles.menuItem} onPress={() => handleNavigation(item.screen)}>
              <Ionicons name={item.icon as any} size={18} color={theme.colors.text} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]} allowFontScaling={false}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.sectionDivider} />
          {/* Support */}
          {supportItems.map((item, index) => (
            <TouchableOpacity key={`support-${index}`} activeOpacity={0.85} style={styles.menuItem} onPress={() => handleNavigation(item.screen)}>
              <Ionicons name={item.icon as any} size={18} color={theme.colors.text} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]} allowFontScaling={false}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText} allowFontScaling={false}>
            Version {
              (Constants?.expoConfig as any)?.version ||
              (Constants as any)?.manifest?.version ||
              '—'
            }
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF4444" />
            <Text style={styles.logoutText} allowFontScaling={false}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  drawerHeaderGradient: {
    paddingTop: 88,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  headerGraphicContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  headerCircleA: {
    position: 'absolute',
    right: -10,
    top: 8,
  },
  headerCircleB: {
    position: 'absolute',
    right: 42,
    top: 24,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    marginRight: 10,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  drawerTitleGradient: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameBright: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  // userName (duplicate display) removed
  // quick stats styles removed
  menuItems: {
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  // menuIconPill removed (icons shown directly)
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  versionText: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 11,
    color: '#777777',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 20,
  },
  firstMenuItem: {
    marginTop: 12,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4444',
  },
});

