import React from 'react';
import {  View, Text, StyleSheet, TouchableOpacity  } from 'react-native';


import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Transaction } from '../services/transactionService';

interface RecentActivityProps {
  transactions: Transaction[];
  onViewAllPress?: () => void;
  onTransactionPress?: (transaction: Transaction) => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ 
  transactions, 
  onViewAllPress,
  onTransactionPress 
}) => {
  return (
    <View style={styles.section}>
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF']}
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
            <Text style={styles.transactionsSubtitle} allowFontScaling={false}>Latest account transactions</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.modernTransactionsList}>
          {transactions.slice(0, 4).map((transaction, index) => (
            <TouchableOpacity 
              key={transaction.id} 
              style={styles.modernTransactionItem}
              onPress={() => onTransactionPress?.(transaction)}
            >
              <View style={styles.transactionLeft}>
                <View style={[styles.merchantIcon, { backgroundColor: transaction.color || '#6B7280' }]}>
                  <Ionicons name={transaction.icon as any} size={16} color="#FFFFFF" />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.modernMerchantName} allowFontScaling={false}>{transaction.title}</Text>
                  <Text style={styles.modernTransactionDate} allowFontScaling={false}>
                    {new Date(transaction.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })} • {new Date(transaction.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.modernTransactionAmount} allowFontScaling={false}>
                  {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                </Text>
                <View style={styles.transactionCategory}>
                  <Text style={styles.categoryText} allowFontScaling={false}>
                    {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.modernViewAllButton} onPress={onViewAllPress}>
          <Text style={styles.modernViewAllText} allowFontScaling={false}>View All Transactions</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 20,
    // Removed marginHorizontal since parent containers handle spacing
  },
  transactionsCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
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

    color: '#FFFFFF',
    marginBottom: 2,
  },
  transactionsSubtitle: {

    color: 'rgba(255, 255, 255, 0.7)',
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

    color: '#FFFFFF',
    marginBottom: 2,
  },
  modernTransactionDate: {

    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  modernTransactionAmount: {

    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionCategory: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  categoryText: {

    color: '#FFFFFF',
  },
  modernViewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  modernViewAllText: {

    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default RecentActivity;

