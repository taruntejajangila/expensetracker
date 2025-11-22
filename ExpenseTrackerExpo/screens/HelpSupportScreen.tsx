import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { API_BASE_URL } from '../config/api.config';

const Tab = createMaterialTopTabNavigator();

const HelpSupportScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  // Contact information state
  const [contactInfo, setContactInfo] = useState({
    email: 'support@mypaisa.com',
    phone: '+91 98765 43210',
    hours: 'Mon-Fri 9AM-6PM',
  });
  const [isLoadingContact, setIsLoadingContact] = useState(false);

  // FAQ Data
  const faqData = [
    {
      id: 1,
      category: 'Getting Started',
      questions: [
        {
          id: 1,
          question: 'How do I add my first transaction?',
          answer: 'Tap the "+" button on the home screen, select transaction type (income/expense), enter amount, choose category, and save.'
        },
        {
          id: 2,
          question: 'How do I create an account?',
          answer: 'Go to the account section, tap "Add Account", enter account details like name, bank, and balance.'
        },
        {
          id: 3,
          question: 'How do I set up a budget?',
          answer: 'Navigate to Budget Planning, tap "Create Budget", select category, set amount, and choose period.'
        }
      ]
    },
    {
      id: 2,
      category: 'Transactions',
      questions: [
        {
          id: 4,
          question: 'Can I edit or delete transactions?',
          answer: 'Yes! Tap on any transaction to view details, then use the edit or delete options.'
        },
        {
          id: 5,
          question: 'How do I categorize transactions?',
          answer: 'When adding a transaction, select from predefined categories or create custom ones in settings.'
        },
        {
          id: 6,
          question: 'Can I add recurring transactions?',
          answer: 'Currently, you need to add each transaction manually. Recurring transactions are planned for future updates.'
        }
      ]
    },
    {
      id: 3,
      category: 'Accounts & Balance',
      questions: [
        {
          id: 7,
          question: 'How do I update my account balance?',
          answer: 'Go to Accounts section, select your account, tap edit, and update the balance.'
        },
        {
          id: 8,
          question: 'Can I have multiple accounts?',
          answer: 'Yes! You can add multiple bank accounts, credit cards, and cash accounts.'
        },
        {
          id: 9,
          question: 'How is my total balance calculated?',
          answer: 'Total balance is the sum of all your account balances minus any outstanding debts.'
        }
      ]
    },
    {
      id: 4,
      category: 'Data & Privacy',
      questions: [
        {
          id: 10,
          question: 'Is my financial data secure?',
          answer: 'Yes! All data is encrypted and stored securely. We never share your personal information.'
        },
        {
          id: 11,
          question: 'Can I export my data?',
          answer: 'Yes, you can export your transactions and account data from the settings section.'
        },
        {
          id: 12,
          question: 'What happens if I delete the app?',
          answer: 'Your data is safely stored on our servers. Reinstall and login to restore all your information.'
        }
      ]
    }
  ];

  // Fetch contact information from API
  useEffect(() => {
    const fetchContactInfo = async () => {
      setIsLoadingContact(true);
      try {
        const response = await fetch(`${API_BASE_URL}/app-settings/contact`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setContactInfo({
              email: data.data.email || 'support@mypaisa.com',
              phone: data.data.phone || '+91 98765 43210',
              hours: data.data.hours || 'Mon-Fri 9AM-6PM',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching contact information:', error);
        // Keep default values on error
      } finally {
        setIsLoadingContact(false);
      }
    };

    fetchContactInfo();
  }, []);

  const supportOptions = [
    {
      id: 1,
      title: 'My Support Tickets',
      description: 'Create or view your support requests',
      icon: 'chatbubbles-outline',
      onPress: () => navigation.navigate('MyTickets' as never),
      color: '#007AFF'
    },
    {
      id: 2,
      title: 'Report a Bug',
      description: 'Let us know about any issues',
      icon: 'bug-outline',
      onPress: () => reportBug(),
      color: '#FF9500'
    },
    {
      id: 3,
      title: 'Feature Request',
      description: 'Suggest new features',
      icon: 'bulb-outline',
      onPress: () => requestFeature(),
      color: '#AF52DE'
    },
    {
      id: 4,
      title: 'User Guide',
      description: 'Learn how to use the app',
      icon: 'book-outline',
      onPress: () => openUserGuide(),
      color: '#FF2D92'
    },
    {
      id: 5,
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: 'play-circle-outline',
      onPress: () => openVideoTutorials(),
      color: '#FF3B30'
    }
  ];

  const contactSupport = () => {
    // Navigate to My Tickets where users can create or view tickets
    navigation.navigate('MyTickets' as never);
  };

  const reportBug = () => {
    // Directly navigate to create ticket with bug report pre-fill
    navigation.navigate('CreateTicket' as never, { 
      prefillCategory: 'technical',
      prefillSubject: 'Bug Report: '
    } as never);
  };

  const requestFeature = () => {
    // Directly navigate to create ticket with feature request pre-fill
    navigation.navigate('CreateTicket' as never, { 
      prefillCategory: 'feature',
      prefillSubject: 'Feature Request: '
    } as never);
  };

  const openUserGuide = () => {
    Alert.alert(
      'User Guide',
      'The user guide is coming soon! For now, please contact our support team for detailed help.',
      [
        {
          text: 'Contact Support',
          onPress: () => contactSupport()
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  const openVideoTutorials = () => {
    Alert.alert(
      'Video Tutorials',
      'Video tutorials are coming soon! Stay tuned for step-by-step video guides.',
      [
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  const openLiveChat = () => {
    Alert.alert(
      'Live Chat',
      'Live chat support is coming soon! For now, please use email or phone support.',
      [
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@mypaisa.com?subject=Live Chat Request')
        },
        {
          text: 'OK',
          style: 'cancel'
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      padding: 4,
      width: 32, // Fixed width to match the right spacer
    },
    titleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRight: {
      flex: 1,
      width: 32, // Fixed width to match the back button
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
    section: {
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    supportGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    supportCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    supportIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    supportTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    supportDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    quickHelpSection: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
    },
    quickHelpTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    quickHelpText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    quickHelpButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickHelpButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: theme.spacing.sm,
    },
    contactInfo: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    contactInfoTitle: {
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
    contactIcon: {
      marginRight: theme.spacing.sm,
    },
    contactText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    contactValue: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    // FAQ styles
    faqCategory: {
      marginBottom: theme.spacing.lg,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    faqItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      overflow: 'hidden',
    },
    faqQuestion: {
      padding: theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    faqQuestionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    faqAnswer: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    faqAnswerText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    }
  });

  // Header Component
  const HelpHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
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
              Help & Support
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              We're here to help you
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // FAQ Component
  const FAQComponent: React.FC = () => {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const toggleExpanded = (questionId: number) => {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(questionId)) {
        newExpanded.delete(questionId);
      } else {
        newExpanded.add(questionId);
      }
      setExpandedItems(newExpanded);
    };

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {faqData.map((category, index) => (
          <View key={category.id} style={index === 0 ? styles.section : styles.faqCategory}>
            <Text style={styles.categoryTitle} allowFontScaling={false}>
              {category.category}
            </Text>
            {category.questions.map((question) => (
              <View key={question.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleExpanded(question.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText} allowFontScaling={false}>
                    {question.question}
                  </Text>
                  <Ionicons
                    name={expandedItems.has(question.id) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                {expandedItems.has(question.id) && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText} allowFontScaling={false}>
                      {question.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  // Support Component (existing content)
  const SupportComponent: React.FC = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Support Options Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} allowFontScaling={false}>Get Help</Text>
        <View style={styles.supportGrid}>
          {supportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.supportCard}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.supportIcon, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon as any} size={24} color={option.color} />
              </View>
              <Text style={styles.supportTitle} allowFontScaling={false}>
                {option.title}
              </Text>
              <Text style={styles.supportDescription} allowFontScaling={false}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Help Section */}
      <View style={styles.quickHelpSection}>
        <Text style={styles.quickHelpTitle} allowFontScaling={false}>
          Need Quick Help?
        </Text>
        <Text style={styles.quickHelpText} allowFontScaling={false}>
          Check out our comprehensive FAQ section for instant answers to common questions.
        </Text>
        <TouchableOpacity
          style={styles.quickHelpButton}
          onPress={() => {
            // Navigate to FAQ tab
            Alert.alert('FAQ', 'Switch to FAQ tab to view frequently asked questions.');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle" size={16} color="#FFFFFF" />
          <Text style={styles.quickHelpButtonText} allowFontScaling={false}>
            View FAQ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contact Information */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactInfoTitle} allowFontScaling={false}>
          Contact Information
        </Text>
        <TouchableOpacity
          style={styles.contactItem}
          activeOpacity={0.7}
          onPress={() => Linking.openURL(`mailto:${contactInfo.email}`)}
          onLongPress={async () => {
            Clipboard.setString(contactInfo.email);
            Alert.alert('Copied', 'Email address copied to clipboard.');
          }}
        >
          <Ionicons name="mail" size={16} color={theme.colors.primary} style={styles.contactIcon} />
          <Text style={styles.contactText} allowFontScaling={false}>Email</Text>
          <Text style={styles.contactValue} allowFontScaling={false}>{contactInfo.email}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactItem}
          activeOpacity={0.7}
          onPress={() => Linking.openURL(`tel:${contactInfo.phone.replace(/\s/g, '')}`)}
          onLongPress={async () => {
            Clipboard.setString(contactInfo.phone);
            Alert.alert('Copied', 'Phone number copied to clipboard.');
          }}
        >
          <Ionicons name="call" size={16} color={theme.colors.primary} style={styles.contactIcon} />
          <Text style={styles.contactText} allowFontScaling={false}>Phone</Text>
          <Text style={styles.contactValue} allowFontScaling={false}>{contactInfo.phone}</Text>
        </TouchableOpacity>
        <View style={styles.contactItem}>
          <Ionicons name="time" size={16} color={theme.colors.primary} style={styles.contactIcon} />
          <Text style={styles.contactText} allowFontScaling={false}>Hours</Text>
          <Text style={styles.contactValue} allowFontScaling={false}>{contactInfo.hours}</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <HelpHeader theme={theme} insets={insets} />

      {/* Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.primary,
            height: 2,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
        }}
      >
        <Tab.Screen 
          name="Support" 
          options={{ title: 'Support' }}
        >
          {() => <SupportComponent />}
        </Tab.Screen>
        <Tab.Screen 
          name="FAQ" 
          options={{ title: 'FAQ' }}
        >
          {() => <FAQComponent />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
};

export default HelpSupportScreen;
