import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TermsConditionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    backButton: {
      padding: 4,
      zIndex: 1,
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
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    lastUpdated: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      fontStyle: 'italic',
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    sectionText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'justify',
    },
    bulletPoint: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      paddingLeft: theme.spacing.md,
    },
    highlightBox: {
      backgroundColor: '#FF950015',
      borderLeftWidth: 4,
      borderLeftColor: '#FF9500',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      marginVertical: theme.spacing.md,
    },
    highlightText: {
      fontSize: 13,
      color: theme.colors.text,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    contactSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    contactTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    contactText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
      textDecorationLine: 'underline',
    },
  });

  const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;

  const TermsHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Terms & Conditions
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Please read carefully
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TermsHeader theme={theme} insets={insets} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated} allowFontScaling={false}>
          Last Updated: October 1, 2025
        </Text>

        {/* Agreement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Agreement to Terms</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            By accessing and using MyPaisa Finance Manager, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms & Conditions, please do not use our application.
          </Text>
        </View>

        {/* Use License */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Use License</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            Permission is granted to download and use MyPaisa Finance Manager for personal, non-commercial use only. This license shall automatically terminate if you violate any of these restrictions.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText} allowFontScaling={false}>
              You may not modify, copy, distribute, transmit, display, perform, reproduce, publish, license, or create derivative works from this application without express written permission.
            </Text>
          </View>
        </View>

        {/* User Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>User Account & Responsibilities</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            When you create an account with us, you are responsible for:
          </Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Maintaining the confidentiality of your account credentials</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• All activities that occur under your account</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Ensuring the accuracy of the information you provide</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Notifying us immediately of any unauthorized use</Text>
        </View>

        {/* Data Accuracy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Data Accuracy & Disclaimer</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            While we strive to provide accurate calculations and financial insights, MyPaisa Finance Manager is a tool to help you manage your finances. You are solely responsible for verifying all financial data and making financial decisions.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText} allowFontScaling={false}>
              We are not financial advisors. This app does not constitute financial, investment, or legal advice. Always consult with qualified professionals for specific financial decisions.
            </Text>
          </View>
        </View>

        {/* Prohibited Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Prohibited Activities</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            You agree not to:
          </Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Use the app for any illegal purpose</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Attempt to gain unauthorized access to the system</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Interfere with or disrupt the app's functionality</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Transmit viruses or malicious code</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Reverse engineer or decompile the application</Text>
        </View>

        {/* Subscription & Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Subscription & Payments</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            Some features of MyPaisa Finance Manager may require a paid subscription. By purchasing a subscription, you agree to pay all applicable fees as described at the time of purchase.
          </Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            Subscription fees are non-refundable except as required by law. You may cancel your subscription at any time, which will take effect at the end of the current billing period.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Limitation of Liability</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            To the maximum extent permitted by law, MyPaisa Finance Manager shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the application.
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Termination</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            We reserve the right to terminate or suspend your account and access to the application immediately, without prior notice, for conduct that we believe violates these Terms & Conditions or is harmful to other users, us, or third parties.
          </Text>
        </View>

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Governing Law</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            These Terms & Conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </Text>
        </View>

        {/* Contact */}
        <View style={[styles.section, styles.contactSection]}>
          <Text style={styles.contactTitle} allowFontScaling={false}>Questions About Terms?</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            If you have any questions about these Terms & Conditions, please contact us:
          </Text>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:legal@mypaisa.com')}
          >
            <Ionicons name="mail" size={18} color={theme.colors.primary} />
            <Text style={styles.contactText} allowFontScaling={false}>legal@mypaisa.com</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => navigation.navigate('HelpSupport' as never)}
          >
            <Ionicons name="chatbubbles" size={18} color={theme.colors.primary} />
            <Text style={styles.contactText} allowFontScaling={false}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default TermsConditionsScreen;

