import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, logout, clearAllUserData } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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
      'This will remove all your local data. This action cannot be undone.',
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    gradientHeader: {
      paddingBottom: 0,
      position: 'relative',
      minHeight: 350,
    },
    safeAreaContainer: {
      flex: 1,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 2,
      height: 35,
      zIndex: 2,
    },
    navButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    profilePictureContainer: {
      alignItems: 'center',
      paddingTop: 30,
      paddingBottom: 60,
      paddingHorizontal: 20,
      zIndex: 2,
    },
    userNameInHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 15,
      marginBottom: 5,
      textAlign: 'center',
    },
    memberSinceText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginBottom: 10,
    },
    profilePictureWrapper: {
      width: 120,
      height: 120,
      borderRadius: 60,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 12,
      overflow: 'hidden',
    },
    profilePicture: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      overflow: 'hidden',
    },
    profilePictureText: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    curvedSeparator: {
      height: 30,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      overflow: 'hidden',
    },
    curve: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    content: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingTop: 20,
      marginTop: 0,
    },
    infoCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    infoIcon: {
      marginRight: 15,
      width: 24,
      alignItems: 'center',
    },
    infoTextContainer: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: '#999999',
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 14,
      color: '#333333',
      fontWeight: '400',
    },
    separator: {
      height: 1,
      backgroundColor: '#E5E5E5',
      marginLeft: 59,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333',
      marginBottom: 15,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 15,
      width: 24,
      alignItems: 'center',
    },
    settingTextContainer: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 12,
      color: '#999999',
      marginBottom: 4,
    },
    settingText: {
      fontSize: 14,
      color: '#333333',
      fontWeight: '400',
    },
    versionContainer: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 10,
    },
    versionText: {
      fontSize: 12,
      color: '#999999',
      fontWeight: '400',
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    // Decorative circle graphics
    decorativeCircle1: {
      position: 'absolute',
      top: 50,
      right: 30,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      zIndex: 1,
    },
    decorativeCircle2: {
      position: 'absolute',
      top: 120,
      right: 10,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      zIndex: 1,
    },
    decorativeCircle3: {
      position: 'absolute',
      top: 80,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      zIndex: 1,
    },
    decorativeCircle4: {
      position: 'absolute',
      top: 150,
      left: 40,
      width: 25,
      height: 25,
      borderRadius: 12.5,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      zIndex: 1,
    },
  });

  return (
    <View style={styles.container}>
      {/* Blue Gradient Header with Circle Graphics - Full Safe Area */}
      <LinearGradient
        colors={['#007AFF', '#4A90E2', '#7BB3F0']}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeAreaContainer}>
        {/* Decorative Circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        <View style={styles.decorativeCircle4} />
        
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle} allowFontScaling={false}>PROFILE</Text>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePictureWrapper}>
            <View style={styles.profilePicture}>
              <Text style={styles.profilePictureText} allowFontScaling={false}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          
          {/* Username below profile picture */}
          <Text style={styles.userNameInHeader} allowFontScaling={false}>{user?.name || 'User'}</Text>
          <Text style={styles.memberSinceText} allowFontScaling={false}>
            Member Since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
          </Text>
        </View>

        </SafeAreaView>

        {/* Curved Separator */}
        <View style={styles.curvedSeparator}>
          <View style={styles.curve} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Account Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={20} color="#666666" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel} allowFontScaling={false}>Full Name</Text>
              <Text style={styles.infoValue} allowFontScaling={false}>{user?.name || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={20} color="#666666" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel} allowFontScaling={false}>Email</Text>
              <Text style={styles.infoValue} allowFontScaling={false}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-outline" size={20} color="#666666" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel} allowFontScaling={false}>Account Type</Text>
              <Text style={styles.infoValue} allowFontScaling={false}>
                {user?.isAdmin ? 'Administrator' : 'Standard User'}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color="#666666" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel} allowFontScaling={false}>Member Since</Text>
              <Text style={styles.infoValue} allowFontScaling={false}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="settings-outline" size={20} color="#666666" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel} allowFontScaling={false}>Preferences</Text>
              <Text style={styles.infoValue} allowFontScaling={false}>Default Settings</Text>
            </View>
          </View>
        </View>

        {/* Data Management Card */}
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="trash-outline" size={20} color="#666666" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel} allowFontScaling={false}>Data Management</Text>
                <Text style={styles.settingText} allowFontScaling={false}>Clear All Data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText} allowFontScaling={false}>Version 1.0.0</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText} allowFontScaling={false}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen; 