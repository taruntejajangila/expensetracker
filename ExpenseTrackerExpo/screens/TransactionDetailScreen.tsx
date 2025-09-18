import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect, CommonActions } from '@react-navigation/native';
import TransactionService, { Transaction } from '../services/transactionService';

type TransactionDetailRouteProp = RouteProp<{
  TransactionDetail: { transactionId: string };
}, 'TransactionDetail'>;

const TransactionDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<TransactionDetailRouteProp>();
  const { transactionId } = route.params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      await TransactionService.backfillAccountIds();
      loadTransactionDetail();
    })();
  }, [transactionId]);

  // Reload data when screen comes into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      loadTransactionDetail();
    }, [transactionId])
  );

  const loadTransactionDetail = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const allTransactions = await TransactionService.getTransactions();
      const foundTransaction = allTransactions.find(t => t.id === transactionId);
      setTransaction(foundTransaction || null);
      
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading transaction detail:', error);
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    loadTransactionDetail(true);
  };

  const handleEdit = () => {
    if (transaction) {
          // Navigating to edit transaction
      // Navigate to edit screen (AddTransactionScreen with edit mode)
      
      // Since TransactionDetail is in Stack Navigator and AddTransaction is in DrawerNavigator,
      // we need to navigate to the DrawerNavigator first, then to AddTransaction
      navigation.navigate('DrawerNavigator' as never, {
        screen: 'AddTransaction',
        params: { transaction, isEdit: true }
      } as never);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      if (transaction) {
        await TransactionService.deleteTransaction(transaction.id);
        Alert.alert(
          'Success',
          'Transaction deleted successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRelativeDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (transactionDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const diffTime = today.getTime() - transactionDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        return formatDate(date);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorText: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    
    // Transaction Details
    transactionHeader: {
      alignItems: 'center',
      marginBottom: 30,
      paddingVertical: 20,
    },
    categoryIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    transactionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    transactionAmount: {
      fontSize: 32,
      fontWeight: '800',
      marginBottom: 4,
    },
    transactionType: {
      fontSize: 14,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // Details Section
    detailsSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#F0F0F0',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F8F8F8',
    },
    detailRowLast: {
      borderBottomWidth: 0,
    },
    detailLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '600',
      flex: 1,
      textAlign: 'right',
    },
    detailSubValue: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '400',
      textAlign: 'right',
      marginTop: 2,
    },
    categoryValue: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
    },
    categoryName: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '600',
      marginLeft: 8,
      textTransform: 'capitalize',
    },
    noteValue: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '400',
      flex: 1,
      textAlign: 'right',
      fontStyle: 'italic',
    },

    // Action Buttons
    actionButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    editButton: {
      backgroundColor: '#007AFF',
    },
    deleteButton: {
      backgroundColor: '#FF3B30',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  // Set up header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Transaction Details',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText} allowFontScaling={false}>Loading transaction details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#CCCCCC" />
          <Text style={styles.errorText} allowFontScaling={false}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Transaction Header */}
        <View style={styles.transactionHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: transaction.color }]}>
            <Ionicons name={transaction.icon as any} size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.transactionTitle} allowFontScaling={false}>{transaction.title}</Text>
          <Text style={[
            styles.transactionAmount,
            { color: transaction.type === 'expense' ? '#FF3B30' : '#34C759' }
          ]} allowFontScaling={false}>
            ₹{transaction.amount.toFixed(2)}
          </Text>
          <Text style={[
            styles.transactionType,
            { color: transaction.type === 'expense' ? '#FF3B30' : '#34C759' }
          ]} allowFontScaling={false}>
            {transaction.type}
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel} allowFontScaling={false}>Category</Text>
            <View style={styles.categoryValue}>
              <View style={[
                { width: 20, height: 20, borderRadius: 10, backgroundColor: transaction.color }
              ]} />
              <Text style={styles.categoryName} allowFontScaling={false}>{transaction.category}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel} allowFontScaling={false}>Date</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.detailValue} allowFontScaling={false}>{getRelativeDate(transaction.date)}</Text>
              <Text style={styles.detailSubValue} allowFontScaling={false}>{formatDate(transaction.date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel} allowFontScaling={false}>Time</Text>
            <Text style={styles.detailValue} allowFontScaling={false}>{formatTime(transaction.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel} allowFontScaling={false}>Amount</Text>
            <Text style={[
              styles.detailValue,
              { color: transaction.type === 'expense' ? '#FF3B30' : '#34C759' }
            ]} allowFontScaling={false}>
              ₹{transaction.amount.toFixed(2)}
            </Text>
          </View>

          {transaction.note && (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Note</Text>
              <Text style={styles.noteValue} allowFontScaling={false}>{transaction.note}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText} allowFontScaling={false}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText} allowFontScaling={false}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionDetailScreen;
