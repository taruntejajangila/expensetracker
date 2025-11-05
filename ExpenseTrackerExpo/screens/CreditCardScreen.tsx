import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useScroll } from '../context/ScrollContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import CreditCardService from '../services/CreditCardService';
import CreditCard from '../components/CreditCard';
import { formatCurrency } from '../utils/currencyFormatter';

interface CreditCard {
  id: string;
  name: string;
  cardNumber: string;
  bankName: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  color: string;
  icon: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const CreditCardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalCreditLimit, setTotalCreditLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Credit cards data will be loaded from API

  useEffect(() => {
    loadCreditCards();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCreditCards();
    }, [])
  );

  const loadCreditCards = async () => {
    try {
      setIsLoading(true);
      const cards = await CreditCardService.getCreditCards();
      setCreditCards(cards);
      
      const debt = cards.reduce((sum: number, card: CreditCard) => sum + (card.currentBalance || 0), 0);
      const limit = cards.reduce((sum: number, card: CreditCard) => sum + (card.creditLimit || 0), 0);
      
      setTotalDebt(debt);
      setTotalCreditLimit(limit);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      // Keep empty state if API fails
      setCreditCards([]);
      setTotalDebt(0);
      setTotalCreditLimit(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Using centralized currency formatter - formatCurrency imported from utils

  const getUtilizationPercentage = (balance: number, limit: number) => {
    return Math.round((balance / limit) * 100);
  };

  // Card icon function removed - now using CreditCard component

  // Header Component
  const ScreenHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
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
              Credit Cards
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Manage your credit cards
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                (navigation as any).navigate('AddCreditCard');
              }}
            >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme, insets);

  return (
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Credit Summary Card */}
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
                      <View style={styles.summaryHeader}>
              <Text style={styles.summaryIcon} allowFontScaling={false}>💳</Text>
              <Text style={styles.summaryTitle} allowFontScaling={false}>ALL CARDS OVERVIEW</Text>
            </View>
          
          <Text style={styles.totalDebtAmount} allowFontScaling={false}>
            {formatCurrency(totalDebt)}
          </Text>
          <Text style={styles.totalDebtLabel} allowFontScaling={false}>Current Outstanding</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue} allowFontScaling={false}>{formatCurrency(totalCreditLimit - totalDebt)}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Remaining Limit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue} allowFontScaling={false}>{formatCurrency(totalCreditLimit)}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Total Credit Limit</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Credit Cards Carousel */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Your Cards</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText} allowFontScaling={false}>Loading credit cards...</Text>
            </View>
          ) : creditCards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyStateGradient}
              >
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="card" size={64} color="#FFFFFF" />
                </View>
                <Text style={styles.emptyStateTitle} allowFontScaling={false}>No Credit Cards Yet</Text>
                <Text style={styles.emptyStateSubtitle} allowFontScaling={false}>Start building your credit profile and track your spending</Text>
                <TouchableOpacity 
                  style={styles.addCardButton}
                  onPress={() => (navigation as any).navigate('AddCreditCard')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addCardButtonText} allowFontScaling={false}>Add Credit Card</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={Dimensions.get('window').width - 48} // Card width + margins
              snapToAlignment="start"
              contentContainerStyle={styles.cardsCarousel}
              style={styles.cardsScrollView}
            >
              {creditCards.map((card, index) => (
                <TouchableOpacity 
                  key={card.id}
                  style={styles.cardContainer}
                  onPress={() => {
                    (navigation as any).navigate('CreditCardDetails', { creditCardId: card.id });
                  }}
                  activeOpacity={0.8}
                >
                  <CreditCard 
                    cardNumber={card.cardNumber}
                    cardHolderName={card.name}
                    expiryMonth="12"
                    expiryYear="25"
                    cardType={card.type}
                    issuer={card.bankName}
                    creditLimit={card.creditLimit}
                    currentBalance={card.currentBalance}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Spending Breakdown */}
        <View style={styles.spendingSection}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.spendingCard}
          >
            <View style={styles.spendingHeader}>
              <View style={styles.spendingIconContainer}>
                <Ionicons name="analytics" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.spendingHeaderText}>
                <Text style={styles.spendingTitle} allowFontScaling={false}>Spending Analytics</Text>
                <Text style={styles.spendingSubtitle} allowFontScaling={false}>This month's breakdown</Text>
              </View>
            </View>
            
            <View style={styles.spendingGrid}>
              <View style={styles.spendingRow}>
                <View style={styles.categoryContainer}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#FF6B6B' }]}>
                    <Ionicons name="basket" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.modernCategoryName} allowFontScaling={false}>Groceries</Text>
                    <Text style={styles.categoryAmount} allowFontScaling={false}>₹486</Text>
                  </View>
                  <View style={styles.percentageContainer}>
                    <Text style={styles.modernPercentage} allowFontScaling={false}>20%</Text>
                  </View>
                </View>
                <View style={styles.modernProgressContainer}>
                  <View style={[styles.modernProgressBar, { width: '20%', backgroundColor: '#FF6B6B' }]} />
                </View>
              </View>

              <View style={styles.spendingRow}>
                <View style={styles.categoryContainer}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#4ECDC4' }]}>
                    <Ionicons name="restaurant" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.modernCategoryName} allowFontScaling={false}>Dining</Text>
                    <Text style={styles.categoryAmount} allowFontScaling={false}>₹729</Text>
                  </View>
                  <View style={styles.percentageContainer}>
                    <Text style={styles.modernPercentage} allowFontScaling={false}>30%</Text>
                  </View>
                </View>
                <View style={styles.modernProgressContainer}>
                  <View style={[styles.modernProgressBar, { width: '30%', backgroundColor: '#4ECDC4' }]} />
                </View>
              </View>

              <View style={styles.spendingRow}>
                <View style={styles.categoryContainer}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#45B7D1' }]}>
                    <Ionicons name="airplane" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.modernCategoryName} allowFontScaling={false}>Travel</Text>
                    <Text style={styles.categoryAmount} allowFontScaling={false}>₹607</Text>
                  </View>
                  <View style={styles.percentageContainer}>
                    <Text style={styles.modernPercentage} allowFontScaling={false}>25%</Text>
                  </View>
                </View>
                <View style={styles.modernProgressContainer}>
                  <View style={[styles.modernProgressBar, { width: '25%', backgroundColor: '#45B7D1' }]} />
                </View>
              </View>

              <View style={styles.spendingRow}>
                <View style={styles.categoryContainer}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#F7B731' }]}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.modernCategoryName} allowFontScaling={false}>Others</Text>
                    <Text style={styles.categoryAmount} allowFontScaling={false}>₹607</Text>
                  </View>
                  <View style={styles.percentageContainer}>
                    <Text style={styles.modernPercentage} allowFontScaling={false}>25%</Text>
                  </View>
                </View>
                <View style={styles.modernProgressContainer}>
                  <View style={[styles.modernProgressBar, { width: '25%', backgroundColor: '#F7B731' }]} />
                </View>
              </View>
            </View>

            <View style={styles.totalSpendingContainer}>
              <Text style={styles.totalSpendingLabel} allowFontScaling={false}>Total Spending</Text>
              <Text style={styles.totalSpendingAmount} allowFontScaling={false}>₹2,429</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.transactionsCard}
          >
            <View style={styles.modernTransactionsHeader}>
              <View style={styles.transactionIconContainer}>
                <Ionicons name="card" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.transactionHeaderText}>
                <Text style={styles.modernTransactionsTitle} allowFontScaling={false}>Recent Activity</Text>
                <Text style={styles.transactionsSubtitle} allowFontScaling={false}>Latest credit card transactions</Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modernTransactionsList}>
              <TouchableOpacity style={styles.modernTransactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.merchantIcon, { backgroundColor: '#00C851' }]}>
                    <Ionicons name="cafe" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.modernMerchantName} allowFontScaling={false}>Starbucks</Text>
                    <Text style={styles.modernTransactionDate} allowFontScaling={false}>Today • 2:30 PM</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.modernTransactionAmount} allowFontScaling={false}>-₹12.50</Text>
                  <View style={styles.transactionCategory}>
                    <Text style={styles.categoryText} allowFontScaling={false}>Dining</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modernTransactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.merchantIcon, { backgroundColor: '#000000' }]}>
                    <Ionicons name="car" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.modernMerchantName} allowFontScaling={false}>Uber</Text>
                    <Text style={styles.modernTransactionDate} allowFontScaling={false}>Yesterday • 6:45 PM</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.modernTransactionAmount} allowFontScaling={false}>-₹22.00</Text>
                  <View style={styles.transactionCategory}>
                    <Text style={styles.categoryText} allowFontScaling={false}>Transport</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modernTransactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.merchantIcon, { backgroundColor: '#FF8800' }]}>
                    <Ionicons name="bag" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.modernMerchantName} allowFontScaling={false}>Amazon</Text>
                    <Text style={styles.modernTransactionDate} allowFontScaling={false}>Aug 6 • 11:20 AM</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.modernTransactionAmount} allowFontScaling={false}>-₹89.99</Text>
                  <View style={styles.transactionCategory}>
                    <Text style={styles.categoryText} allowFontScaling={false}>Shopping</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modernTransactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.merchantIcon, { backgroundColor: '#003366' }]}>
                    <Ionicons name="airplane" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.modernMerchantName} allowFontScaling={false}>Delta Airlines</Text>
                    <Text style={styles.modernTransactionDate} allowFontScaling={false}>Aug 5 • 9:15 AM</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.modernTransactionAmount} allowFontScaling={false}>-₹320.00</Text>
                  <View style={styles.transactionCategory}>
                    <Text style={styles.categoryText} allowFontScaling={false}>Travel</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.modernViewAllButton}>
              <Text style={styles.modernViewAllText} allowFontScaling={false}>View All Transactions</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header Styles
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
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
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  totalDebtAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  totalDebtLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  cardsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  cardsScrollView: {
    marginHorizontal: -16, // Offset parent padding
  },
  cardsCarousel: {
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: Dimensions.get('window').width - 48, // Screen width minus margins
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card styles removed - now using CreditCard component
  spendingSection: {
    marginBottom: 24,
  },
  spendingCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 15,
  },
  spendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  spendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  spendingHeaderText: {
    flex: 1,
  },
  spendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  spendingSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  spendingGrid: {
    marginBottom: 20,
  },
  spendingRow: {
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  modernCategoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  percentageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modernPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  modernProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  totalSpendingContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSpendingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  totalSpendingAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionsCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 15,
  },
  modernTransactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionHeaderText: {
    flex: 1,
  },
  modernTransactionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  transactionsSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernTransactionsList: {
    marginBottom: 20,
  },
  modernTransactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  merchantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  modernMerchantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  modernTransactionDate: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  modernTransactionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionCategory: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernViewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginHorizontal: 16,
  },
  emptyStateGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyStateIcon: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    padding: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addCardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default CreditCardScreen;
