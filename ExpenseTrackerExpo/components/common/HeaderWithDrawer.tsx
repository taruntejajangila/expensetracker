import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useScroll } from '../../context/ScrollContext';

interface HeaderWithDrawerProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
}

const HeaderWithDrawer: React.FC<HeaderWithDrawerProps> = ({
  title,
  showBackButton = false,
  rightComponent,
  backgroundColor = '#FFFFFF',
  titleColor = '#000000',
}) => {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { scrollY } = useScroll();

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleNotificationPress = () => {
    // Handle notification press - can be implemented later
    // Notifications pressed
  };

  // Calculate header transform based on scroll
  const headerHeight = 56 + top;
  const headerTranslateY = scrollY ? scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  }) : 0;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          paddingTop: top, 
          backgroundColor,
          transform: [{ translateY: headerTranslateY }],
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }
      ]}
    >
      <View style={styles.header}>
        {/* Left Side - Menu/Back Button + Greeting */}
        <View style={
          (showBackButton && title !== 'Monthly View' && title !== 'Dashboard') 
            ? styles.leftContainerBalanced 
            : styles.leftContainer
        }>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          {title === 'Dashboard' && (
            <Text style={[styles.greeting, { color: titleColor }]} numberOfLines={1} allowFontScaling={false}>
              Hi, {user?.name || 'User'}
            </Text>
          )}
        </View>

        {/* Center - Title (for non-Dashboard screens) */}
        <View style={
          (showBackButton && title !== 'Monthly View' && title !== 'Dashboard') 
            ? styles.centerContainerBalanced 
            : styles.centerContainer
        }>
          {title !== 'Dashboard' && title !== 'Monthly View' && (
            <Text style={[styles.title, { color: titleColor }]} numberOfLines={1} allowFontScaling={false}>
              {title}
            </Text>
          )}
        </View>

        {/* Right Side - Notification Icon */}
        <View style={
          (showBackButton && title !== 'Monthly View' && title !== 'Dashboard') 
            ? styles.rightContainerBalanced 
            : styles.rightContainer
        }>
          {rightComponent || (
            // Hide notification icon for screens that don't need it
                        title !== 'Monthly View' && title !== 'Add Transaction' && title !== 'Accounts' && title !== 'Credit Cards' && title !== 'Loans' && title !== 'Budget Planning' && title !== 'Savings Goals' && title !== 'Loan Calculator' && title !== 'Debt Plans' &&
            title !== 'Account Details' && title !== 'Card Details' && title !== 'Loan Details' && title !== 'Amortization Schedule' && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={22} color="#007AFF" />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No shadow or border - completely clean header
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  // Balanced containers for screens with back button and no notification
  leftContainerBalanced: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainerBalanced: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightContainerBalanced: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  title: {


  },
  greeting: {

    color: '#333333',
    marginLeft: 12,
  },
});

export default HeaderWithDrawer;

