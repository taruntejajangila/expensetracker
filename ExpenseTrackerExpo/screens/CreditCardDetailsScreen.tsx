import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScroll } from '../context/ScrollContext';
import CreditCard from '../components/CreditCard';
import SpendingAnalytics from '../components/SpendingAnalytics';
import RecentActivity from '../components/RecentActivity';
import CreditCardService from '../services/CreditCardService';
import TransactionService, { Transaction } from '../services/transactionService';
import { formatCurrency } from '../utils/currencyFormatter';

interface CreditCardDetails {
  id: number;
  cardName: string;
  cardType: string;
  issuer: string;
  lastFourDigits: string;
  creditLimit: number;
  currentBalance: number;
  statementDay: number;
  dueDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RouteParams {
  creditCardId: number;
  creditCardData?: CreditCardDetails;
  refresh?: boolean;
}

const CreditCardDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const { creditCardId, creditCardData: passedCreditCardData, refresh } = route.params as RouteParams;
  const scrollViewRef = useRef<ScrollView>(null);
  const recentActivityRef = useRef<View>(null);
  
  const [creditCard, setCreditCard] = useState<CreditCardDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingData, setSpendingData] = useState<any>(null);
  const [isHistoryHighlighted, setIsHistoryHighlighted] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Define all functions first before using them in useEffect
  const loadCreditCardDetails = async () => {
    try {
      setIsLoading(true);
      
      let cardData: CreditCardDetails;
      
      // First try to use the passed data
      if (passedCreditCardData) {
        cardData = passedCreditCardData;
        setCreditCard(cardData);
      } else {
        // Fallback: try to get from the API or use mock data for demo
        try {
          const response = await CreditCardService.getCreditCardById(creditCardId.toString());
          cardData = response.data;
          setCreditCard(cardData);
        } catch (apiError) {
          console.error('API Error fetching credit card:', apiError);
          // Use mock data as fallback for demo purposes
          const mockCreditCard: CreditCardDetails = {
            id: creditCardId,
            cardName: 'Demo Credit Card',
            cardType: 'Visa',
            issuer: 'Demo Bank',
            lastFourDigits: '1234',
            creditLimit: 50000,
            currentBalance: 12500,
            statementDay: 15,
            dueDay: 10,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          cardData = mockCreditCard;
          setCreditCard(cardData);
        }
      }
      
      // Load transactions for this credit card
      await loadTransactions();
    } catch (error) {
      console.error('Error loading credit card details:', error);
      Alert.alert('Error', 'Failed to load credit card details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const allTransactions = await TransactionService.getTransactions();
      
      // Filter transactions for this specific credit card
      const cardTransactions = allTransactions.filter(transaction => {
        // Check if transaction note contains the last 4 digits
        if (transaction.note && creditCard?.lastFourDigits) {
          return transaction.note.includes(creditCard.lastFourDigits);
        }
        // Fallback: check for credit card related keywords
        if (transaction.note) {
          const note = transaction.note.toLowerCase();
          return note.includes('credit') || note.includes('card') || note.includes('cc');
        }
        return false;
      });

      if (cardTransactions.length > 0) {
        setTransactions(cardTransactions);
        calculateSpendingData(cardTransactions);
      } else {
        // Simulate some transactions for demo purposes with the actual card name
        const simulatedTransactions = [
          {
            id: '1',
            title: 'Coffee Shop',
            amount: 250,
            category: 'food',
            date: new Date(),
            color: '#FF6B6B',
            icon: 'cafe',
            note: `${creditCard?.cardName || 'Credit Card'} ${creditCard?.lastFourDigits || 'XXXX'}`,
            type: 'expense' as const,
            accountId: '1'
          },
          {
            id: '2',
            title: 'Grocery Store',
            amount: 1200,
            category: 'shopping',
            date: new Date(Date.now() - 86400000),
            color: '#4ECDC4',
            icon: 'basket',
            note: `${creditCard?.cardName || 'Credit Card'} ${creditCard?.lastFourDigits || 'XXXX'}`,
            type: 'expense' as const,
            accountId: '1'
          },
          {
            id: '3',
            title: 'Gas Station',
            amount: 800,
            category: 'transport',
            date: new Date(Date.now() - 172800000),
            color: '#45B7D1',
            icon: 'car',
            note: `${creditCard?.cardName || 'Credit Card'} ${creditCard?.lastFourDigits || 'XXXX'}`,
            type: 'expense' as const,
            accountId: '1'
          }
        ];
        setTransactions(simulatedTransactions);
        calculateSpendingData(simulatedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Set empty arrays if there's an error
      setTransactions([]);
      setSpendingData(null);
    }
  };

  const handleHistoryPress = () => {
    // Scroll to the RecentActivity section
    if (scrollViewRef.current && recentActivityRef.current) {
      // Measure the position of the RecentActivity section
      recentActivityRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (scrollViewRef.current) {
          // Scroll to the RecentActivity section with some offset for better visibility
          scrollViewRef.current.scrollTo({ y: Math.max(0, pageY - 100), animated: true });
          
          // Highlight the RecentActivity section
          setIsHistoryHighlighted(true);
          
          // Remove highlight after 2 seconds
          setTimeout(() => {
            setIsHistoryHighlighted(false);
          }, 2000);
        }
      });
    }
  };

  const handlePayPress = () => {
    Alert.alert('Pay', 'Pay functionality coming soon!');
  };

  // Using centralized currency formatter - formatCurrency imported from utils

  const getUtilizationPercentage = (balance: number, limit: number) => {
    if (!limit || limit === 0) return 0;
    if (!balance || balance === 0) return 0;
    return (balance / limit) * 100;
  };

  const getDaysUntilDue = () => {
    if (!creditCard) return 0;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Calculate next due date
    let dueDate = new Date(currentYear, currentMonth, creditCard.dueDay);
    
    // If due date has passed this month, calculate for next month
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, creditCard.dueDay);
    }
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const calculateSpendingData = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) {
      setSpendingData(null);
      return;
    }

    const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Group transactions by category
    const categoryBreakdown = transactions.reduce((acc, transaction) => {
      const category = transaction.category || 'other';
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as { [key: string]: number });

    // Get top 5 categories by amount
    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        color: getCategoryColor(category),
        icon: getCategoryIcon(category)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
    
    // Spending data calculated
    
    setSpendingData({
      totalSpent,
      categoryBreakdown,
      topCategories
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      food: '#FF6B6B',
      dining: '#FF6B6B',
      transport: '#4ECDC4',
      shopping: '#45B7D1',
      groceries: '#4ECDC4',
      entertainment: '#96CEB4',
      healthcare: '#FFEAA7',
      education: '#DDA0DD',
      utilities: '#FFD93D',
      housing: '#FF8A80',
      travel: '#BB8FCE',
      insurance: '#85C1E9',
      gifts: '#F8C471',
      other: '#BDC3C7',
      cafe: '#FF6B6B',
      restaurant: '#FF6B6B',
      gas: '#4ECDC4',
      fuel: '#4ECDC4',
      online: '#45B7D1',
      amazon: '#45B7D1',
      uber: '#4ECDC4',
      taxi: '#4ECDC4'
    };
    return colors[category.toLowerCase()] || '#BDC3C7';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      food: 'restaurant',
      dining: 'restaurant',
      transport: 'car',
      shopping: 'bag',
      groceries: 'basket',
      entertainment: 'game-controller',
      healthcare: 'medical',
      education: 'school',
      utilities: 'flash',
      housing: 'home',
      travel: 'airplane',
      insurance: 'shield',
      gifts: 'gift',
      other: 'ellipsis-horizontal',
      cafe: 'cafe',
      restaurant: 'restaurant',
      gas: 'car',
      fuel: 'car',
      online: 'globe',
      amazon: 'bag',
      uber: 'car',
      taxi: 'car'
    };
    return icons[category.toLowerCase()] || 'ellipsis-horizontal';
  };

  // Now use the functions in useEffect hooks
  useFocusEffect(
    React.useCallback(() => {
      loadCreditCardDetails();
    }, [creditCardId])
  );

  // Animate progress bar when loading
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      progressAnimation.setValue(0);
    }
  }, [isLoading, progressAnimation]);

  // Reload transactions when credit card data is available
  useEffect(() => {
    if (creditCard) {
      loadTransactions();
    }
  }, [creditCard]);

  // Handle immediate refresh when coming from edit screen
  useEffect(() => {
    if (refresh && passedCreditCardData) {
      setCreditCard(passedCreditCardData);
      // Clear the refresh flag to prevent infinite loops
      (navigation as any).setParams({ refresh: false });
    }
  }, [refresh, passedCreditCardData, navigation]);

  // Early return for loading state - must be before any other logic
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Loading Overlay for Initial Load */}
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <Ionicons name="sync" size={32} color="#3B82F6" />
            </View>
            <Text style={styles.loadingText} allowFontScaling={false}>Loading credit card details...</Text>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Early return for missing credit card data
  if (!creditCard) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="card-outline" size={48} color="#9CA3AF" />
          <Text style={styles.errorTitle} allowFontScaling={false}>Card Not Found</Text>
          <Text style={styles.errorSubtitle} allowFontScaling={false}>The requested credit card could not be found</Text>
        </View>
      </View>
    );
  }

  const availableCredit = (creditCard.creditLimit || 0) - (creditCard.currentBalance || 0);
  const utilization = getUtilizationPercentage(creditCard.currentBalance || 0, creditCard.creditLimit || 1);
  const daysUntilDue = getDaysUntilDue();

  // Header Component
  const ScreenHeader: React.FC<{ theme: any; insets: any; creditCard: CreditCardDetails }> = ({ theme, insets, creditCard }) => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              {creditCard.cardName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              {creditCard.issuer}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                (navigation as any).navigate('EditCreditCard', { 
                  creditCardId: creditCard.id,
                  creditCardData: creditCard 
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  'Delete Card',
                  'Are you sure you want to delete this credit card?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => {
                      handleDeleteCard();
                    }}
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleDeleteCard = async () => {
    try {
      await CreditCardService.deleteCreditCard(creditCard.id.toString());
      Alert.alert('Success', 'Credit card deleted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete credit card. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} creditCard={creditCard} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Credit Card Preview */}
        <View style={styles.cardPreviewContainer}>
          <CreditCard 
            cardNumber={`XXXX XXXX XXXX ${creditCard.lastFourDigits}`}
            cardHolderName={creditCard.cardName}
            expiryMonth={creditCard.statementDay.toString()}
            expiryYear={creditCard.dueDay.toString()}
            cardType={creditCard.cardType}
            issuer={creditCard.issuer}
            creditLimit={creditCard.creditLimit}
            currentBalance={creditCard.currentBalance}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.historyButton]} onPress={handleHistoryPress} activeOpacity={0.8}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText} allowFontScaling={false}>History</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.payButton]} onPress={handlePayPress} activeOpacity={0.8}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText} allowFontScaling={false}>Pay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Financial Summary */}
        {creditCard ? (
          <View style={styles.section}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.financialCard}
            >
              <View style={styles.financialHeader}>
                <View style={styles.financialIconContainer}>
                  <Ionicons name="wallet" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.financialHeaderText}>
                  <Text style={styles.financialTitle} allowFontScaling={false}>Financial Summary</Text>
                  <Text style={styles.financialSubtitle} allowFontScaling={false}>Credit card overview</Text>
                </View>
              </View>
              
              <View style={styles.financialGrid}>
                <View style={styles.financialRow}>
                  <View style={styles.financialItem}>
                    <View style={[styles.financialIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                      <Ionicons name="card" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.financialDetails}>
                      <Text style={styles.financialLabel} allowFontScaling={false}>Credit Limit</Text>
                      <Text style={styles.financialValue} allowFontScaling={false}>
                        {formatCurrency(creditCard.creditLimit || 0)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.financialItem}>
                    <View style={[styles.financialIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.financialDetails}>
                      <Text style={styles.financialLabel} allowFontScaling={false}>Available Credit</Text>
                      <Text style={styles.financialValue} allowFontScaling={false}>
                        {formatCurrency(!isNaN(availableCredit) ? availableCredit : 0)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.financialRow}>
                  <View style={styles.financialItem}>
                    <View style={[styles.financialIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                      <Ionicons name="trending-down" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.financialDetails}>
                      <Text style={styles.financialLabel} allowFontScaling={false}>Current Balance</Text>
                      <Text style={styles.financialValue} allowFontScaling={false}>
                        {formatCurrency(creditCard.currentBalance || 0)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.financialItem}>
                    <View style={[styles.financialIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                      <Ionicons name="analytics" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.financialDetails}>
                      <Text style={styles.financialLabel} allowFontScaling={false}>Utilization</Text>
                      <Text style={styles.financialValue} allowFontScaling={false}>
                        {utilization && !isNaN(utilization) ? `${utilization.toFixed(1)}%` : '0%'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText} allowFontScaling={false}>Loading financial summary...</Text>
            </View>
          </View>
        )}

        {/* Spending Analytics */}
        <SpendingAnalytics spendingData={spendingData} />

        {/* Recent Activity */}
        <View
          ref={recentActivityRef}
          id="recent-activity"
          style={[
            styles.section,
            isHistoryHighlighted && styles.highlightedSection
          ]}
        >
          <RecentActivity
            transactions={transactions}
            onTransactionPress={(transaction) => {
              // Transaction pressed
            }}
          />
        </View>

        {/* Billing Information */}
        <View style={styles.section}>
          <View style={styles.billingCard}>
            <View style={styles.billingHeader}>
              <View style={styles.billingIconContainer}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.billingHeaderText}>
                <Text style={styles.billingTitle} allowFontScaling={false}>Billing Information</Text>
                <Text style={styles.billingSubtitle} allowFontScaling={false}>Payment and statement details</Text>
              </View>
            </View>
            
            <View style={styles.billingGrid}>
              <View style={styles.billingRow}>
                <View style={styles.billingItem}>
                  <Text style={styles.billingLabel} allowFontScaling={false}>Statement Day</Text>
                  <Text style={styles.billingValue} allowFontScaling={false}>{creditCard.statementDay || 'N/A'}</Text>
                </View>
                
                <View style={styles.billingItem}>
                  <Text style={styles.billingLabel} allowFontScaling={false}>Payment Due Day</Text>
                  <Text style={styles.billingValue} allowFontScaling={false}>{creditCard.dueDay || 'N/A'}</Text>
                </View>
              </View>
              
              <View style={styles.billingRow}>
                <View style={styles.billingItem}>
                  <Text style={styles.billingLabel} allowFontScaling={false}>Days Until Due</Text>
                  <Text style={styles.billingValue} allowFontScaling={false}>{daysUntilDue || 'N/A'}</Text>
                </View>
                
                <View style={styles.billingItem}>
                  <Text style={styles.billingLabel} allowFontScaling={false}>Card Type</Text>
                  <Text style={styles.billingValue} allowFontScaling={false}>{creditCard.cardType || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Card Information */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.infoHeaderText}>
                <Text style={styles.infoTitle} allowFontScaling={false}>Card Information</Text>
                <Text style={styles.infoSubtitle} allowFontScaling={false}>Card details and metadata</Text>
              </View>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel} allowFontScaling={false}>Card Holder</Text>
                  <Text style={styles.infoValue} allowFontScaling={false}>{creditCard.cardName || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel} allowFontScaling={false}>Issuer/Bank</Text>
                  <Text style={styles.infoValue} allowFontScaling={false}>{creditCard.issuer || 'N/A'}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel} allowFontScaling={false}>Last 4 Digits</Text>
                  <Text style={styles.infoValue} allowFontScaling={false}>{creditCard.lastFourDigits || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel} allowFontScaling={false}>Created On</Text>
                  <Text style={styles.infoValue} allowFontScaling={false}>{creditCard.createdAt ? new Date(creditCard.createdAt).toLocaleDateString() : 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Warnings and Reminders */}
        {utilization > 80 && (
          <View style={styles.section}>
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={24} color="#EF4444" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle} allowFontScaling={false}>High Credit Utilization</Text>
                <Text style={styles.warningSubtitle} allowFontScaling={false}>
                  Your credit utilization is {utilization && !isNaN(utilization) ? utilization.toFixed(1) : '0'}%, which is above the recommended 30%. Consider paying down your balance to improve your credit score.
                </Text>
              </View>
            </View>
          </View>
        )}

        {daysUntilDue <= 7 && daysUntilDue > 0 && (
          <View style={styles.section}>
            <View style={styles.reminderContainer}>
              <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderTitle} allowFontScaling={false}>Payment Due Soon</Text>
                <Text style={styles.reminderSubtitle} allowFontScaling={false}>
                  Your payment of {formatCurrency(creditCard.currentBalance || 0)} is due in {daysUntilDue} day{daysUntilDue === 1 ? '' : 's'}. Make sure to pay on time to avoid late fees.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    width: '60%',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  cardPreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    minWidth: 120,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  historyButton: {
    // Styles handled by LinearGradient
  },
  editButton: {
    // Styles handled by LinearGradient
  },
  payButton: {
    // Styles handled by LinearGradient
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  financialCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  financialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  financialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  financialHeaderText: {
    flex: 1,
  },
  financialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  financialSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  financialGrid: {
    gap: 16,
  },
  financialRow: {
    flexDirection: 'row',
    gap: 16,
  },
  financialItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  financialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  financialDetails: {
    flex: 1,
  },
  financialLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  billingCard: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  billingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  billingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  billingHeaderText: {
    flex: 1,
  },
  billingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  billingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  billingGrid: {
    gap: 16,
  },
  billingRow: {
    flexDirection: 'row',
    gap: 16,
  },
  billingItem: {
    flex: 1,
    paddingVertical: 8,
  },
  billingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  billingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoHeaderText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoGrid: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  reminderContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  reminderTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  reminderSubtitle: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  loadingCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  highlightedSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
  },
});

export default CreditCardDetailsScreen;
