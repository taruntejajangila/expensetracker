import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AboutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const openWebsite = () => {
    Linking.openURL('https://www.mypaisa.com');
  };

  const openPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy' as never);
  };

  const openTermsOfService = () => {
    navigation.navigate('TermsConditions' as never);
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@mypaisa.com');
  };

  const openRateApp = () => {
    Alert.alert(
      'Rate PaysaGo Finance Manager',
      'Thank you for using PaysaGo Finance Manager! Would you like to rate us on the App Store?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Rate App', onPress: () => {
          // In a real app, you would open the app store rating
          Alert.alert('Thank you!', 'Your rating helps us improve the app.');
        }}
      ]
    );
  };

  const shareApp = () => {
    Alert.alert(
      'Share PaysaGo Finance Manager',
      'Help your friends manage their finances better!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => {
          // In a real app, you would use the Share API
          Alert.alert('Thank you!', 'Thank you for sharing PaysaGo Finance Manager with your friends!');
        }}
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    // Header styles to match other screens
    headerContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    backButton: {
      padding: 4,
    },
    titleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 4,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '400',
      opacity: 0.8,
      textAlign: 'center',
    },
    // App info section
    appInfoSection: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    appIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    appIconText: {
      fontSize: 32,
      color: '#FFFFFF',
    },
    appName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    appTagline: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    appVersion: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    // Description section
    descriptionSection: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    descriptionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    // Features section
    featuresSection: {
      marginBottom: theme.spacing.xl,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    featureIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
    },
    featureText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    // Action buttons section
    actionSection: {
      marginBottom: theme.spacing.xl,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionIcon: {
      marginRight: theme.spacing.md,
    },
    actionText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    actionArrow: {
      marginLeft: theme.spacing.sm,
    },
    // Company info section
    companySection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    companyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    companyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    companyIcon: {
      marginRight: theme.spacing.sm,
    },
    companyText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    companyValue: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    // Footer section
    footerSection: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    footerText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    copyrightText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    }
  });

  // Header Component
  const AboutHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              About
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              PaysaGo Finance Manager
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AboutHeader theme={theme} insets={insets} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info Section */}
        <View style={styles.appInfoSection}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconText} allowFontScaling={false}>💰</Text>
          </View>
          <Text style={styles.appName} allowFontScaling={false}>PaysaGo Finance Manager</Text>
          <Text style={styles.appTagline} allowFontScaling={false}>
            Your Personal Finance Companion
          </Text>
          <Text style={styles.appVersion} allowFontScaling={false}>Version 1.0.0</Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>About PaysaGo Finance Manager</Text>
          <Text style={styles.descriptionText} allowFontScaling={false}>
            PaysaGo Finance Manager is a comprehensive personal finance management app designed to help you take control of your money. 
            Track expenses, manage budgets, set savings goals, and make informed financial decisions.
          </Text>
          <Text style={styles.descriptionText} allowFontScaling={false}>
            Built with modern technology and user-friendly design, PaysaGo Finance Manager makes financial management simple, 
            secure, and accessible to everyone.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Key Features</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="wallet" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>Expense Tracking</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="pie-chart" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>Budget Management</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flag" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>Savings Goals</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="card" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>Account Management</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="analytics" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>Financial Insights</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>Secure & Private</Text>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={openWebsite}>
            <Ionicons name="globe" size={20} color={theme.colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText} allowFontScaling={false}>Visit Website</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={styles.actionArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={openSupport}>
            <Ionicons name="mail" size={20} color={theme.colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText} allowFontScaling={false}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={styles.actionArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={openRateApp}>
            <Ionicons name="star" size={20} color={theme.colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText} allowFontScaling={false}>Rate App</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={styles.actionArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={shareApp}>
            <Ionicons name="share" size={20} color={theme.colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText} allowFontScaling={false}>Share App</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={styles.actionArrow} />
          </TouchableOpacity>
        </View>

        {/* Company Info Section */}
        <View style={styles.companySection}>
          <Text style={styles.companyTitle} allowFontScaling={false}>Company Information</Text>
          
          <View style={styles.companyInfo}>
            <Ionicons name="business" size={16} color={theme.colors.primary} style={styles.companyIcon} />
            <Text style={styles.companyText} allowFontScaling={false}>Company</Text>
            <Text style={styles.companyValue} allowFontScaling={false}>PaysaGo Technologies</Text>
          </View>
          
          <View style={styles.companyInfo}>
            <Ionicons name="location" size={16} color={theme.colors.primary} style={styles.companyIcon} />
            <Text style={styles.companyText} allowFontScaling={false}>Location</Text>
            <Text style={styles.companyValue} allowFontScaling={false}>India</Text>
          </View>
          
          <View style={styles.companyInfo}>
            <Ionicons name="calendar" size={16} color={theme.colors.primary} style={styles.companyIcon} />
            <Text style={styles.companyText} allowFontScaling={false}>Founded</Text>
            <Text style={styles.companyValue} allowFontScaling={false}>2024</Text>
          </View>
          
          <View style={styles.companyInfo}>
            <Ionicons name="code-slash" size={16} color={theme.colors.primary} style={styles.companyIcon} />
            <Text style={styles.companyText} allowFontScaling={false}>Technology</Text>
            <Text style={styles.companyValue} allowFontScaling={false}>React Native</Text>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Legal</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={openPrivacyPolicy}>
            <Ionicons name="shield" size={20} color={theme.colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText} allowFontScaling={false}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={styles.actionArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={openTermsOfService}>
            <Ionicons name="document-text" size={20} color={theme.colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText} allowFontScaling={false}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={styles.actionArrow} />
          </TouchableOpacity>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText} allowFontScaling={false}>
            Made with ❤️ in India
          </Text>
          <Text style={styles.copyrightText} allowFontScaling={false}>
            © 2024 PaysaGo Technologies. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AboutScreen;
