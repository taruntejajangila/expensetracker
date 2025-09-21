import React from 'react';
import {  View, Text, StyleSheet, Image, Dimensions  } from 'react-native';


import { Ionicons } from '@expo/vector-icons';

interface BankCardProps {
  accountNumber?: string;
  accountHolderName?: string;
  accountType?: string;
  bankName?: string;
  balance?: number;
  currency?: string;
  cardColor?: string;
  accountNickname?: string;
}

const { width } = Dimensions.get('window');

const BankCard: React.FC<BankCardProps> = ({
  accountNumber = 'XXXX XXXX XXXX XXXX',
  accountHolderName = 'Prem Kumar Shahi',
  accountType = 'Savings Account',
  bankName = 'Bank of America',
  balance = 50000,
  currency = '₹',
  cardColor,
  accountNickname
}) => {
  // Convert currency code to symbol
  const getCurrencySymbol = (currencyCode: string) => {
    const currencyMap: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RUB': '₽',
      'BRL': 'R$',
      'MXN': '$',
      'ZAR': 'R',
      'KRW': '₩',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NZD': 'NZ$',
      'TRY': '₺',
      'THB': '฿',
      'MYR': 'RM',
      'PHP': '₱',
      'IDR': 'Rp',
      'VND': '₫',
      'BDT': '৳',
      'PKR': '₨',
      'LKR': '₨',
      'NPR': '₨',
      'AFN': '؋',
      'IRR': '﷼',
      'SAR': '﷼',
      'AED': 'د.إ',
      'QAR': 'ر.ق',
      'KWD': 'د.ك',
      'BHD': 'د.ب',
      'OMR': 'ر.ع.',
      'JOD': 'د.ا',
      'LBP': 'ل.ل',
      'EGP': '£',
      'MAD': 'د.م.',
      'TND': 'د.ت',
      'DZD': 'د.ج',
      'LYD': 'ل.د',
      'ETB': 'Br',
      'KES': 'KSh',
      'UGX': 'USh',
      'TZS': 'TSh',
      'ZMW': 'ZK',
      'GHS': '₵',
      'NGN': '₦',
      'XOF': 'CFA',
      'XAF': 'FCFA',
    };
    
    return currencyMap[currencyCode.toUpperCase()] || currencyCode || '₹';
  };

  const currencySymbol = getCurrencySymbol(currency);
  // Generate card color based on bank name if no specific color provided
  const getCardColor = () => {
    // Always use bank-specific colors for consistency
    // Only use cardColor if it's explicitly provided AND no bank-specific color exists
    
    // Assign unique colors to each specific bank
    const bankColors: { [key: string]: string } = {
      // Official names with unique colors
      'AU Small Finance Bank Limited': '#1E3A8A', // Deep Blue
      'Bank of Baroda': '#DC2626', // Red
      'Bank Of Baroda': '#DC2626', // Red (capital O variation)
      'Bandhan Bank': '#D97706', // Amber/Orange
      'Bank of India': '#059669', // Green
      'Central Bank Of India': '#7C3AED', // Purple
      'City Union Bank': '#EF4444', // Bright Red
      'Canara Bank': '#10B981', // Emerald Green
      'CSB Bank Limited': '#8B5CF6', // Violet
      'DCB Bank Limited': '#F59E0B', // Amber
      'Dhanalakshmi Bank': '#EC4899', // Pink
      'Federal Bank': '#06B6D4', // Cyan
      'HDFC Bank': '#84CC16', // Lime
      'IDBI Bank': '#F97316', // Orange
      'ICICI Bank Limited': '#6366F1', // Indigo
      'IDFC First Bank Limited': '#14B8A6', // Teal
      'Indian Bank': '#F43F5E', // Rose
      'Indusind Bank': '#0EA5E9', // Sky Blue
      'Indian Overseas Bank': '#A855F7', // Purple
      'Jammu and Kashmir Bank': '#F97316', // Orange
      'Karnataka Bank Limited': '#10B981', // Emerald
      'Kotak Mahindra Bank Limited': '#F59E0B', // Amber
      'Karur Vysya Bank': '#EF4444', // Red
      'Bank of Maharashtra': '#7C3AED', // Purple
      'The Nainital Bank Limited': '#059669', // Green
      'Punjab and Sind Bank': '#DC2626', // Red
      'Punjab National Bank': '#1E3A8A', // Blue
      'RBL Bank Limited': '#8B5CF6', // Violet
      'State Bank of India': '#06B6D4', // Cyan
      'South Indian Bank': '#84CC16', // Lime
      'Tamilnad Mercantile Bank Limited': '#F43F5E', // Rose
      'Union Bank of India': '#A855F7', // Purple
      'UCO Bank': '#0EA5E9', // Sky Blue
      'Axis Bank': '#10B981', // Emerald
      'Yes Bank': '#F59E0B', // Amber
      
      // Common variations with unique colors
      'HDFC': '#84CC16', // Lime
      'ICICI': '#6366F1', // Indigo
      'SBI': '#06B6D4', // Cyan
      'AXIS': '#10B981', // Emerald
      'KOTAK': '#F59E0B', // Amber
      'YES': '#F59E0B', // Amber
      'BOB': '#DC2626', // Red
      'PNB': '#1E3A8A', // Blue
      'CANARA': '#059669', // Green
      'UNION': '#A855F7', // Purple
      'BOI': '#059669', // Green
      'CBI': '#7C3AED', // Purple
      'INDIAN': '#F43F5E', // Rose
      'UCO': '#0EA5E9', // Sky Blue
      'IOB': '#A855F7', // Purple
      'PSB': '#DC2626', // Red
      'BOM': '#7C3AED', // Purple
      'FEDERAL': '#06B6D4', // Cyan
      'KARNATAKA': '#10B981', // Emerald
      'SIB': '#84CC16', // Lime
      'TMB': '#F43F5E', // Rose
      'CUB': '#EF4444', // Red
      'KVB': '#D97706', // Amber
      'RBL': '#8B5CF6', // Violet
      'IDFC': '#14B8A6', // Teal
      'BANDHAN': '#D97706', // Amber
      'AU': '#1E3A8A', // Blue
      'CSB': '#8B5CF6', // Violet
      'DCB': '#F59E0B', // Amber
      'DHANALAKSHMI': '#EC4899', // Pink
      'IDBI': '#6366F1', // Indigo
      'INDUSIND': '#0EA5E9', // Sky Blue
      'J&K': '#A855F7', // Purple
      'NAINITAL': '#059669', // Green
    };
    
    const selectedColor = bankColors[bankName];
    if (selectedColor) {
      return selectedColor;
    } else {
      // Only use cardColor as fallback if no bank-specific color exists
      return cardColor || '#667eea'; // Fallback to default blue if not found
    }
  };

  // Get bank logo based on bank name
  const getBankLogo = (bankName: string) => {
    // Since logo files are empty, return null to use fallback icon
    return null;
    
    // Commented out the logo mapping since files are empty
    /*
    const bankLogos: { [key: string]: any } = {
      // Official names (exact matches) - Updated to use existing directory names
      'AU Small Finance Bank Limited': require('../assets/bank-logos/aubl/symbol.png'),
      'Bank of Baroda': require('../assets/bank-logos/barb/symbol.png'),
      'Bank Of Baroda': require('../assets/bank-logos/barb/symbol.png'), // Added capital O variation
      'Bandhan Bank': require('../assets/bank-logos/bdbl/symbol.png'),
      'Bank of India': require('../assets/bank-logos/bkid/symbol.png'),
      'Central Bank Of India': require('../assets/bank-logos/cbin/symbol.png'),
      'City Union Bank': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'Canara Bank': require('../assets/bank-logos/canara/symbol.png'),
      'CSB Bank Limited': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'DCB Bank Limited': require('../assets/bank-logos/dcb/symbol.png'),
      'Dhanalakshmi Bank': require('../assets/bank-logos/lakshmi/symbol.png'), // Using lakshmi as fallback
      'Federal Bank': require('../assets/bank-logos/federal/symbol.png'),
      'HDFC Bank': require('../assets/bank-logos/hdfc/symbol.png'),
      'IDBI Bank': require('../assets/bank-logos/idbi/symbol.png'),
      'ICICI Bank Limited': require('../assets/bank-logos/icici/symbol.png'),
      'IDFC First Bank Limited': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'Indian Bank': require('../assets/bank-logos/indian/symbol.png'),
      'Indusind Bank': require('../assets/bank-logos/indusind/symbol.png'),
      'Indian Overseas Bank': require('../assets/bank-logos/oriental/symbol.png'), // Using oriental as fallback
      'Jammu and Kashmir Bank': require('../assets/bank-logos/jk/symbol.png'),
      'Karnataka Bank Limited': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'Kotak Mahindra Bank Limited': require('../assets/bank-logos/kotak/symbol.png'),
      'Karur Vysya Bank': require('../assets/bank-logos/karur/symbol.png'),
      'Bank of Maharashtra': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'The Nainital Bank Limited': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'Punjab and Sind Bank': require('../assets/bank-logos/punjab/symbol.png'),
      'Punjab National Bank': require('../assets/bank-logos/punjab/symbol.png'),
      'RBL Bank Limited': require('../assets/bank-logos/ratnakar/symbol.png'),
      'State Bank of India': require('../assets/bank-logos/sbi/symbol.png'),
      'South Indian Bank': require('../assets/bank-logos/south/symbol.png'),
      'Tamilnad Mercantile Bank Limited': require('../assets/bank-logos/tamilnad/symbol.png'),
      'Union Bank of India': require('../assets/bank-logos/union/symbol.png'),
      'UCO Bank': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'Axis Bank': require('../assets/bank-logos/axis/symbol.png'),
      'Yes Bank': require('../assets/bank-logos/yes/symbol.png'),
      
      // Common variations (for backward compatibility) - Updated to use existing directory names
      'HDFC': require('../assets/bank-logos/hdfc/symbol.png'),
      'ICICI': require('../assets/bank-logos/icici/symbol.png'),
      'SBI': require('../assets/bank-logos/sbi/symbol.png'),
      'AXIS': require('../assets/bank-logos/axis/symbol.png'),
      'KOTAK': require('../assets/bank-logos/kotak/symbol.png'),
      'YES': require('../assets/bank-logos/yes/symbol.png'),
      'BOB': require('../assets/bank-logos/barb/symbol.png'),
      'PNB': require('../assets/bank-logos/punjab/symbol.png'),
      'CANARA': require('../assets/bank-logos/canara/symbol.png'),
      'UNION': require('../assets/bank-logos/union/symbol.png'),
      'BOI': require('../assets/bank-logos/bkid/symbol.png'),
      'CBI': require('../assets/bank-logos/cbin/symbol.png'),
      'INDIAN': require('../assets/bank-logos/indian/symbol.png'),
      'UCO': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'IOB': require('../assets/bank-logos/oriental/symbol.png'), // Using oriental as fallback
      'PSB': require('../assets/bank-logos/punjab/symbol.png'),
      'BOM': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'FEDERAL': require('../assets/bank-logos/federal/symbol.png'),
      'KARNATAKA': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'SIB': require('../assets/bank-logos/south/symbol.png'),
      'TMB': require('../assets/bank-logos/tamilnad/symbol.png'),
      'CUB': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'KVB': require('../assets/bank-logos/karur/symbol.png'),
      'RBL': require('../assets/bank-logos/ratnakar/symbol.png'),
      'IDFC': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'BANDHAN': require('../assets/bank-logos/bdbl/symbol.png'),
      'AU': require('../assets/bank-logos/aubl/symbol.png'),
      'CSB': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
      'DCB': require('../assets/bank-logos/dcb/symbol.png'),
      'DHANALAKSHMI': require('../assets/bank-logos/lakshmi/symbol.png'), // Using lakshmi as fallback
      'IDBI': require('../assets/bank-logos/idbi/symbol.png'),
      'INDUSIND': require('../assets/bank-logos/indusind/symbol.png'),
      'J&K': require('../assets/bank-logos/jk/symbol.png'),
      'NAINITAL': require('../assets/bank-logos/coop/symbol.png'), // Using coop as fallback
    };
    
    const logo = bankLogos[bankName];
    if (logo) {
      // Symbol found
    } else {
      // Symbol not found
    }
    
    return logo || null;
    */
  };

  return (
    <View style={[styles.container, { backgroundColor: getCardColor() }]}>
      {/* Background image with reduced opacity to show dynamic colors */}
      <Image 
        source={require('./CreditCardUI/images/bg.png')} 
        style={[styles.backgroundImage, { opacity: 0.1 }]} // Reduced from 0.3 to 0.1 for better color visibility
        resizeMode="cover"
      />
      {/* Header with Account Type, Bank Name, and Bank Logo */}
      <View style={styles.header}>
        <View style={styles.accountTypeSection}>
          <Text style={styles.accountTypeText} allowFontScaling={false}>{accountType.toUpperCase()}</Text>
          <Text style={styles.bankName} allowFontScaling={false}>{bankName.toUpperCase()}</Text>
        </View>
        <View style={styles.bankLogoContainer}>
          {getBankLogo(bankName) ? (
            <Image 
              source={getBankLogo(bankName)}
              style={styles.bankLogo}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="business" size={20} color="rgba(255, 255, 255, 0.8)" />
          )}
        </View>
      </View>

      {/* Card Details */}
      <View style={styles.cardDetails}>
        <View style={styles.nameNumber}>
          {accountNickname && (
            <Text style={styles.accountNickname} allowFontScaling={false}>{accountNickname}</Text>
          )}
          <Text style={styles.label} allowFontScaling={false}>Account Number</Text>
          <Text style={styles.number} allowFontScaling={false}>XXXX XX {accountNumber}</Text>
          <Text style={styles.name} allowFontScaling={false}>{accountHolderName.toUpperCase()}</Text>
        </View>
        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel} allowFontScaling={false}>Available Balance</Text>
            <Text style={styles.balanceValue} allowFontScaling={false}>{currencySymbol}{balance?.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel} allowFontScaling={false}>Account Type</Text>
            <Text style={styles.balanceValue} allowFontScaling={false}>{accountType}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 25,
    borderRadius: 28,
    maxWidth: 380,
    width: width * 0.9,
    height: 220, // Changed back to original height from 200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    backgroundColor: '#667eea', // Will be overridden dynamically
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
  cardDetails: {
    marginTop: 20, // Reduced from 40 to 20 since header now has marginBottom
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
    fontSize: 14,
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
  accountNickname: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  bankLogoContainer: {
    width: 44, // Reverted back to original size from 56
    height: 44, // Reverted back to original size from 56
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Made more transparent
    borderRadius: 10, // Reverted back to original from 12
    padding: 6, // Reverted back to original from 8
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Made more transparent
  },
  bankLogo: {
    width: '100%',
    height: '100%',
  },
});

export default BankCard;
