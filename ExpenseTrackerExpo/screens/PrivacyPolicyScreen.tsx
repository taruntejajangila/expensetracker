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

const PrivacyPolicyScreen: React.FC = () => {
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

  const PrivacyHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
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
              Privacy Policy
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              How we protect your data
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PrivacyHeader theme={theme} insets={insets} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated} allowFontScaling={false}>
          Last Updated: October 1, 2025
        </Text>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Introduction</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            PaysaGo Finance Manager ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Information We Collect</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            We collect information that you provide directly to us when you:
          </Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Create an account and profile</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Add financial transactions and records</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Set budgets, goals, and reminders</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Contact our support team</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Provide feedback or complete surveys</Text>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>How We Use Your Information</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            We use the information we collect to:
          </Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Provide, maintain, and improve our services</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Process and complete transactions</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Send you technical notices and support messages</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Respond to your comments and questions</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Protect against fraudulent or illegal activity</Text>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Data Security</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            We implement appropriate technical and organizational security measures to protect your personal information. All financial data is encrypted both in transit and at rest using industry-standard encryption protocols.
          </Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Your Privacy Rights</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Access your personal data</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Correct inaccurate data</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Request deletion of your data</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Object to data processing</Text>
          <Text style={styles.bulletPoint} allowFontScaling={false}>• Export your data</Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Data Retention</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
          </Text>
        </View>

        {/* Third-Party Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Third-Party Services</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Children's Privacy</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            Our service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
          </Text>
        </View>

        {/* Changes to Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Changes to This Policy</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={[styles.section, styles.contactSection]}>
          <Text style={styles.contactTitle} allowFontScaling={false}>Contact Us About Privacy</Text>
          <Text style={styles.sectionText} allowFontScaling={false}>
            If you have questions about this Privacy Policy, please contact us:
          </Text>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:privacy@mypaisa.com')}
          >
            <Ionicons name="mail" size={18} color={theme.colors.primary} />
            <Text style={styles.contactText} allowFontScaling={false}>privacy@mypaisa.com</Text>
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

export default PrivacyPolicyScreen;

