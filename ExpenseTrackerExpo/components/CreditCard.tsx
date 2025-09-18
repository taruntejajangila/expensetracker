import React from 'react';
import {  View, Text, StyleSheet, Image, Dimensions  } from 'react-native';



interface CreditCardProps {
  cardNumber?: string;
  cardHolderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardType?: string;
  issuer?: string;
  creditLimit?: number;
  currentBalance?: number;
  cardColor?: string;
}

const { width } = Dimensions.get('window');

const CreditCard: React.FC<CreditCardProps> = ({
  cardNumber = '8050 5040 2030 3020',
  cardHolderName = 'Prem Kumar Shahi',
  expiryMonth = '05',
  expiryYear = '28',
  cardType = 'Master Card',
  issuer = 'Bank of America',
  creditLimit = 100000,
  currentBalance = 25000,
  cardColor
}) => {
  // Add space between "master" and "card" for Mastercard
  const formattedCardType = cardType === 'Mastercard' ? 'Master Card' : cardType;

  // Generate card color based on card type if no specific color provided
  const getCardColor = () => {
    if (cardColor) return cardColor;
    
    // Normalize card type for comparison - handle various formats
    const normalizedCardType = cardType.toLowerCase().trim();
    
    // Handle different variations of card types
    if (normalizedCardType.includes('visa')) {
      return '#1E3A8A'; // Deep Blue
    } else if (normalizedCardType.includes('mastercard') || normalizedCardType.includes('master card')) {
      return '#DC2626'; // Red
    } else if (normalizedCardType.includes('amex') || normalizedCardType.includes('american express')) {
      return '#D97706'; // Amber/Orange
    } else if (normalizedCardType.includes('rupay')) {
      return '#059669'; // Green
    } else if (normalizedCardType.includes('discover')) {
      return '#7C3AED'; // Purple
    } else if (normalizedCardType.includes('jcb')) {
      return '#EF4444'; // Bright Red
    } else if (normalizedCardType.includes('unionpay')) {
      return '#10B981'; // Emerald Green
    } else {
      // Generate a unique color based on issuer name for other card types
      const colors = [
        '#8B5CF6', // Violet
        '#F59E0B', // Amber
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#F97316', // Orange
        '#6366F1', // Indigo
        '#14B8A6', // Teal
        '#F43F5E', // Rose
        '#8B5CF6', // Violet
        '#06B6D4', // Cyan
        '#10B981', // Emerald
      ];
      const index = (issuer.length + normalizedCardType.length) % colors.length;
      return colors[index];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getCardColor() }]}>
      {/* Background image with reduced opacity to show dynamic colors */}
      <Image 
        source={require('./CreditCardUI/images/bg.png')} 
        style={[styles.backgroundImage, { opacity: 0.3 }]}
        resizeMode="cover"
      />
      {/* Header with Card Type, Issuer/Bank, and Chip */}
      <View style={styles.header}>
        <View style={styles.cardTypeSection}>
          <Text style={styles.cardTypeText} allowFontScaling={false}>{formattedCardType}</Text>
          <Text style={styles.issuerName} allowFontScaling={false}>{issuer.toUpperCase()}</Text>
        </View>
        <Image 
          source={require('./CreditCardUI/images/chip.png')} 
          style={styles.chip}
          resizeMode="contain"
        />
      </View>

      {/* Card Details */}
      <View style={styles.cardDetails}>
        <View style={styles.nameNumber}>
          <Text style={styles.label} allowFontScaling={false}>Card Number</Text>
          <Text style={styles.number} allowFontScaling={false}>XXXX XXXX XXXX {cardNumber.slice(-4)}</Text>
          <Text style={styles.name} allowFontScaling={false}>{cardHolderName.toUpperCase()}</Text>
        </View>
        <View style={styles.financialSection}>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel} allowFontScaling={false}>Limit</Text>
            <Text style={styles.financialValue} allowFontScaling={false}>₹{creditLimit?.toLocaleString()}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel} allowFontScaling={false}>Available</Text>
            <Text style={styles.financialValue} allowFontScaling={false}>₹{(creditLimit - currentBalance)?.toLocaleString()}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel} allowFontScaling={false}>Outstanding</Text>
            <Text style={styles.financialValue} allowFontScaling={false}>₹{currentBalance?.toLocaleString()}</Text>
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
    height: 220, // Fixed height for consistency
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
  },
  cardTypeSection: {
    alignItems: 'flex-start',
  },
  cardTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  issuerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  chip: {
    width: 50,
    height: 50,
  },
  cardDetails: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nameNumber: {
    flex: 1,
  },
  financialSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  financialRow: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  financialLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.8,
    marginBottom: 2,
  },
  financialValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  label: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '400',
  },
  number: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  name: {
    marginTop: 15,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  issuer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});

export default CreditCard;
