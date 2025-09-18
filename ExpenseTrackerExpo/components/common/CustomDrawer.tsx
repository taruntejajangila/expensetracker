import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DrawerItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  isActive?: boolean;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon, label, onPress, isActive = false }) => {
  return (
    <TouchableOpacity
      style={[styles.drawerItem, isActive && styles.activeDrawerItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon as any} 
        size={22} 
        color={isActive ? '#007AFF' : '#666666'} 
        style={styles.drawerIcon} 
      />
      <Text style={[styles.drawerLabel, isActive && styles.activeDrawerLabel]} allowFontScaling={false}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const CustomDrawer: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation, state } = props;
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const getCurrentRouteName = () => {
    const route = state.routes[state.index];
    if (route.state) {
      // Handle nested navigators
      const nestedRoute = route.state.routes[route.state.index];
      return nestedRoute.name;
    }
    return route.name;
  };

  const currentRoute = getCurrentRouteName();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.closeDrawer();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity 
        style={[styles.header, { paddingTop: insets.top + 18 }]}
        onPress={() => {
          navigation.closeDrawer();
          navigation.dispatch(
            CommonActions.navigate({
              name: 'MainApp',
              params: {
                screen: 'MainTabs',
                params: {
                  screen: 'Profile',
                },
              },
            })
          );
        }}
        activeOpacity={0.8}
      >
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} allowFontScaling={false}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail} allowFontScaling={false}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>
      </TouchableOpacity>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {/* Decorative elements for menu section */}
          <View style={styles.menuDecorativeCircle1} />
          <View style={styles.menuDecorativeCircle2} />
          <View style={styles.menuDecorativeCircle3} />
          <DrawerItem
            icon="home-outline"
            label="Dashboard"
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('MainTabs', { screen: 'Home' });
            }}
            isActive={currentRoute === 'Home'}
          />
          
          <DrawerItem
            icon="calendar-outline"
            label="Monthly View"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'SpentInMonth',
                  },
                })
              );
            }}
            isActive={currentRoute === 'SpentInMonth'}
          />
          
          <DrawerItem
            icon="list-outline"
            label="All Transactions"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'AllTransaction',
                  },
                })
              );
            }}
            isActive={currentRoute === 'AllTransaction'}
          />
          
          <DrawerItem
            icon="wallet-outline"
            label="Accounts"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'Accounts',
                  },
                })
              );
            }}
            isActive={currentRoute === 'Accounts'}
          />
          
          <DrawerItem
            icon="card-outline"
            label="Credit Cards"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'CreditCards',
                  },
                })
              );
            }}
            isActive={currentRoute === 'CreditCards'}
          />
          
          <DrawerItem
            icon="document-text-outline"
            label="Loans"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'Loans',
                  },
                })
              );
            }}
            isActive={currentRoute === 'Loans'}
          />
          
          <DrawerItem
            icon="calculator-outline"
            label="Budget Planning"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'BudgetPlanning',
                  },
                })
              );
            }}
            isActive={currentRoute === 'BudgetPlanning'}
          />
          
          <DrawerItem
            icon="flag-outline"
            label="Savings Goals"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'SavingsGoals',
                  },
                })
              );
            }}
            isActive={currentRoute === 'SavingsGoals'}
          />
          
          <DrawerItem
            icon="calculator"
            label="Loan Calculator"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'LoanCalculator',
                  },
                })
              );
            }}
            isActive={currentRoute === 'LoanCalculator'}
          />
          
          <DrawerItem
            icon="trending-down"
            label="Debt Plans"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'DebtPlans',
                  },
                })
              );
            }}
            isActive={currentRoute === 'DebtPlans'}
          />
          
          <DrawerItem
            icon="add-circle-outline"
            label="Add Transaction"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'AddTransaction',
                  },
                })
              );
            }}
            isActive={currentRoute === 'AddTransaction'}
          />
          
          <DrawerItem
            icon="person-outline"
            label="Profile"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'MainTabs',
                    params: {
                      screen: 'Profile',
                    },
                  },
                })
              );
            }}
            isActive={currentRoute === 'Profile'}
          />
          
          <DrawerItem
            icon="settings-outline"
            label="Settings"
            onPress={() => {
              navigation.closeDrawer();
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'MainApp',
                  params: {
                    screen: 'Settings',
                  },
                })
              );
            }}
            isActive={currentRoute === 'Settings'}
          />

          {/* Divider */}
          <View style={styles.divider} />
          
          <DrawerItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {
              // Add help navigation or modal
              // Help pressed
            }}
          />
          
          <DrawerItem
            icon="information-circle-outline"
            label="About"
            onPress={() => {
              // Add about navigation or modal
              // About pressed
            }}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={styles.logoutText} allowFontScaling={false}>Logout</Text>
          </TouchableOpacity>
          
          <View style={styles.versionInfo}>
            <Text style={styles.versionText} allowFontScaling={false}>Version 1.0.0</Text>
          </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingBottom: 28,
    paddingHorizontal: 20,
    position: 'relative',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 18,
    position: 'relative',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
    marginVertical: 2,
    zIndex: 2,
    position: 'relative',
  },
  activeDrawerItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  drawerIcon: {
    marginRight: 13,
    width: 22,
  },
  drawerLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  activeDrawerLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 13,
    marginHorizontal: 20,
  },
  footer: {
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 13,
  },
  versionInfo: {
    alignItems: 'center',
    paddingTop: 8,
  },
  versionText: {
    fontSize: 10,
    color: '#999999',
  },
  // Decorative elements
  decorativeCircle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 100,
    right: 40,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 1,
  },
  // Menu section decorative elements
  menuDecorativeCircle1: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    zIndex: 1,
  },
  menuDecorativeCircle2: {
    position: 'absolute',
    top: 200,
    right: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.06)',
    zIndex: 1,
  },
  menuDecorativeCircle3: {
    position: 'absolute',
    top: 350,
    right: 30,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    zIndex: 1,
  },
});

export default CustomDrawer;
