import React from 'react';
import {  View, Text, StyleSheet  } from 'react-native';


import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CashWalletProps {
  balance: number;
  lastUpdated: string;
  onPress?: () => void;
}

const CashWallet: React.FC<CashWalletProps> = ({ 
  balance, 
  lastUpdated, 
  onPress 
}) => {
  return (
    <View style={styles.section}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cashCard}
      >
        {/* Header with Account Type, Bank Name, and Wallet Icon */}
        <View style={styles.header}>
          <View style={styles.accountTypeSection}>
            <Text style={styles.accountTypeText} allowFontScaling={false}>CASH WALLET</Text>
            <Text style={styles.bankName} allowFontScaling={false}>PHYSICAL & DIGITAL</Text>
          </View>
          <View style={styles.walletIconContainer}>
            <Ionicons name="wallet" size={20} color="rgba(255, 255, 255, 0.8)" />
          </View>
        </View>

        {/* Card Details */}
        <View style={styles.cardDetails}>
          <View style={styles.nameNumber}>
            <Text style={styles.label} allowFontScaling={false}>Available Balance</Text>
            <Text style={styles.number} allowFontScaling={false}>₹{balance.toLocaleString()}</Text>
            <Text style={styles.name} allowFontScaling={false}>CASH ACCOUNT</Text>
          </View>
          <View style={styles.balanceSection}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel} allowFontScaling={false}>Last Updated</Text>
              <Text style={styles.balanceValue} allowFontScaling={false}>{lastUpdated}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel} allowFontScaling={false}>Status</Text>
              <Text style={styles.balanceValue} allowFontScaling={false}>Active</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 20,
    marginHorizontal: 16, // Same as SpendingAnalytics - this will cancel out with parent's marginHorizontal: -16
  },
  cashCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 15,
    backgroundColor: '#FF6B35', // Fallback color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  accountTypeSection: {
    alignItems: 'flex-start',
  },
  accountTypeText: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
  },
  walletIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardDetails: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nameNumber: {
    flex: 1,
  },
  balanceSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  balanceRow: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 2,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    color: '#fff',
    fontSize: 10,
  },
  number: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CashWallet;

