import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { logout, clearAllUserData, user } = useAuth();
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all your local data including accounts, transactions, budgets, and other information. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllUserData();
              Alert.alert('Success', 'All data has been cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleNuclearClear = () => {
    Alert.alert(
      'Nuclear Clear - Clear ALL Data',
      '⚠️ WARNING: This will clear ALL AsyncStorage data, including any system data. This is a last resort option. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear EVERYTHING', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all keys and clear everything
              const allKeys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(allKeys);
              Alert.alert('Success', `All ${allKeys.length} storage keys have been cleared.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear all data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: theme.spacing.md,
      width: 24,
      alignItems: 'center',
    },
    settingText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      flex: 1,
    },
    settingValue: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    userInfo: {
      backgroundColor: theme.colors.primary + '20',
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    userName: {
      fontSize: theme.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    dangerSection: {
      marginTop: theme.spacing.xl,
    },
    dangerButton: {
      backgroundColor: '#FF3B30',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    dangerButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userInfo}>
          <Text style={styles.userName} allowFontScaling={false}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail} allowFontScaling={false}>{user?.email}</Text>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>General</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.settingText} allowFontScaling={false}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="moon-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.settingText} allowFontScaling={false}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={darkModeEnabled ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>

        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="trash-outline" size={24} color="#FF9500" />
              </View>
              <Text style={styles.settingText} allowFontScaling={false}>Clear All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleNuclearClear}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="nuclear-outline" size={24} color="#FF3B30" />
              </View>
              <Text style={styles.settingText} allowFontScaling={false}>Nuclear Clear (Last Resort)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Account</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Text style={styles.dangerButtonText} allowFontScaling={false}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen; 