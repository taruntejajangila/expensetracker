import React from 'react';
import {  View, Text, StyleSheet, Image, Dimensions  } from 'react-native';



interface LoanCardProps {
  loanName?: string;
  loanType?: string;
  lender?: string;
  currentBalance?: number;
  monthlyPayment?: number;
  interestRate?: number;
  nextPaymentDate?: string;
  cardColor?: string;
}

const { width } = Dimensions.get('window');

const LoanCard: React.FC<LoanCardProps> = ({
  loanName = 'Personal Loan',
  loanType = 'Personal Loan',
  lender = 'Bank of America',
  currentBalance = 75000,
  monthlyPayment = 2500,
  interestRate = 12.5,
  nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  cardColor
}) => {
  // Generate card color based on loan type only
  const getCardColor = () => {
    // Normalize loan type for comparison
    const normalizedLoanType = (loanType || 'personal').toLowerCase().trim();
    
    // Extended color palette for more variety (excluding black/gray/green)
    const colors = [
      '#8B5CF6', // Violet
      '#F59E0B', // Amber
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#6366F1', // Indigo
      '#14B8A6', // Teal
      '#F43F5E', // Rose
      '#667eea', // Blue
      '#DC2626', // Red
      '#7C3AED', // Purple
      '#D97706', // Orange
      '#1E3A8A', // Deep Blue
      '#BE185D', // Rose
      '#B45309', // Amber
      '#EA580C', // Orange
      '#2563EB', // Blue
      '#9333EA', // Purple
      '#E11D48', // Rose
      '#0D9488', // Teal
      '#CA8A04', // Yellow
      '#F472B6', // Pink
      '#A78BFA', // Purple
      '#FBBF24', // Yellow
      '#60A5FA', // Blue
      '#F87171', // Red
      '#FCD34D', // Yellow
      '#C4B5FD', // Purple
      '#F59E0B', // Amber
      '#EC4899', // Pink
      '#8B5CF6', // Violet
      '#6366F1', // Indigo
      '#14B8A6', // Teal
      '#F43F5E', // Rose
      '#667eea', // Blue
      '#DC2626', // Red
      '#7C3AED', // Purple
      '#D97706', // Orange
      '#1E3A8A', // Deep Blue
      '#BE185D', // Rose
      '#B45309', // Amber
      '#EA580C', // Orange
      '#2563EB', // Blue
      '#9333EA', // Purple
      '#E11D48', // Rose
      '#0D9488', // Teal
      '#CA8A04', // Yellow
      '#F472B6', // Pink
      '#A78BFA', // Purple
      '#FBBF24', // Yellow
      '#60A5FA', // Blue
      '#F87171', // Red
      '#FCD34D', // Yellow
      '#C4B5FD', // Purple
    ];
    
    // Create a unique hash based on loan type only
    let hash = 0;
    
    for (let i = 0; i < normalizedLoanType.length; i++) {
      const char = normalizedLoanType.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Add additional randomness based on loan type length
    hash = hash + normalizedLoanType.length * 31;
    
    // Use absolute value and modulo to get index
    const index = Math.abs(hash) % colors.length;
    

            // Using fallback color for loan type
    
    return colors[index];
  };

  // Get bank logo source based on lender/bank name
  const getBankLogo = (lenderName: string): any => {
    const normalizedLenderName = (lenderName || '').toLowerCase().trim();
    
    // Bank slug mapping based on directory structure
    const bankSlugMap: { [key: string]: string } = {
      'hdfc': 'hdfc',
      'icici': 'icic', 
      'sbi': 'sbin',
      'axis': 'utib',
      'kotak': 'kkbk',
      'pnb': 'punb',
      'bank of baroda': 'barb',
      'canara': 'cnrb',
      'union bank': 'ubin',
      'indian bank': 'idib',
      'central bank': 'cbin',
      'bank of india': 'bkid',
      'maharashtra': 'mahb',
      'punjab and sind': 'psib',
      'indian overseas': 'ioba',
      'jammu and kashmir': 'jaka',
      'karnataka': 'karb',
      'karur vysya': 'kvbl',
      'south indian': 'sibl',
      'tamilnad mercantile': 'tmbl',
      'uco': 'ucba',
      'yes bank': 'yesb',
      'rbl': 'ratn',
      'indusind': 'indb',
      'idfc': 'idfb',
      'idbi': 'ibkl',
      'federal': 'fdrl',
      'dcb': 'dcbl',
      'csb': 'csbk',
      'dhanalakshmi': 'dlxb',
      'city union': 'ciub',
      'bandhan': 'bdbl',
      'au small finance': 'aubl',
      'ujjivan': 'ujvn',
      'nainital': 'ntbl',
      'airtel payments': 'airp',
      'jio payments': 'jiop',
      'paytm payments': 'pytm',
      'standard chartered': 'scbl',
      // NBFC variations
      'bajaj': 'barb',
      'bajaj finserv': 'barb',
      'tata': 'tmbl',
      'tata capital': 'tmbl',
      'muthoot': 'fdrl',
      'muthoot finance': 'fdrl',
      'manappuram': 'fdrl',
      'manappuram finance': 'fdrl',
      'aditya birla': 'barb',
      'aditya birla capital': 'barb',
      'edelweiss': 'fdrl',
      'edelweiss financial': 'fdrl',
      'piramal': 'punb',
      'piramal finance': 'punb'
    };

    // Find matching bank slug
    let bankSlug = null;
    for (const [key, slug] of Object.entries(bankSlugMap)) {
      if (normalizedLenderName.includes(key) || key.includes(normalizedLenderName)) {
        bankSlug = slug;
        break;
      }
    }

    if (!bankSlug) {
      return null; // Fallback to emoji icon
    }

    // Return the corresponding logo
    const bankLogoMap: { [key: string]: any } = {
      'hdfc': require('../assets/bank-logos/hdfc/symbol.png'),
      'icic': require('../assets/bank-logos/icic/symbol.png'),
      'sbin': require('../assets/bank-logos/sbin/symbol.png'),
      'utib': require('../assets/bank-logos/utib/symbol.png'),
      'kkbk': require('../assets/bank-logos/kkbk/symbol.png'),
      'punb': require('../assets/bank-logos/punb/symbol.png'),
      'barb': require('../assets/bank-logos/barb/symbol.png'),
      'cnrb': require('../assets/bank-logos/cnrb/symbol.png'),
      'ubin': require('../assets/bank-logos/ubin/symbol.png'),
      'idib': require('../assets/bank-logos/idib/symbol.png'),
      'cbin': require('../assets/bank-logos/cbin/symbol.png'),
      'bkid': require('../assets/bank-logos/bkid/symbol.png'),
      'mahb': require('../assets/bank-logos/mahb/symbol.png'),
      'psib': require('../assets/bank-logos/psib/symbol.png'),
      'ioba': require('../assets/bank-logos/ioba/symbol.png'),
      'jaka': require('../assets/bank-logos/jaka/symbol.png'),
      'karb': require('../assets/bank-logos/karb/symbol.png'),
      'kvbl': require('../assets/bank-logos/kvbl/symbol.png'),
      'sibl': require('../assets/bank-logos/sibl/symbol.png'),
      'tmbl': require('../assets/bank-logos/tmbl/symbol.png'),
      'ucba': require('../assets/bank-logos/ucba/symbol.png'),
      'yesb': require('../assets/bank-logos/yesb/symbol.png'),
      'ratn': require('../assets/bank-logos/ratn/symbol.png'),
      'indb': require('../assets/bank-logos/indb/symbol.png'),
      'idfb': require('../assets/bank-logos/idfb/symbol.png'),
      'ibkl': require('../assets/bank-logos/ibkl/symbol.png'),
      'fdrl': require('../assets/bank-logos/fdrl/symbol.png'),
      'dcbl': require('../assets/bank-logos/dcbl/symbol.png'),
      'csbk': require('../assets/bank-logos/csbk/symbol.png'),
      'dlxb': require('../assets/bank-logos/dlxb/symbol.png'),
      'ciub': require('../assets/bank-logos/ciub/symbol.png'),
      'bdbl': require('../assets/bank-logos/bdbl/symbol.png'),
      'aubl': require('../assets/bank-logos/aubl/symbol.png'),
      'ujvn': require('../assets/bank-logos/ujvn/symbol.png'),
      'ntbl': require('../assets/bank-logos/ntbl/symbol.png'),
      'airp': require('../assets/bank-logos/airp/symbol.png'),
      'jiop': require('../assets/bank-logos/jiop/symbol.png'),
      'pytm': require('../assets/bank-logos/pytm/symbol.png'),
      'scbl': require('../assets/bank-logos/scbl/symbol.png')
    };

    return bankLogoMap[bankSlug] || null;
  };

  // Format next payment date
  const formatNextPaymentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };



  return (
    <View style={[styles.container, { backgroundColor: getCardColor() }]}>
      {/* Background image with reduced opacity to show dynamic colors */}
      <Image 
        source={require('./CreditCardUI/images/bg.png')} 
        style={[styles.backgroundImage, { opacity: 0.6 }]}
        resizeMode="cover"
      />
      
      {/* Header with Loan Type, Lender, and Loan Icon */}
      <View style={styles.header}>
        <View style={styles.loanTypeSection}>
          <Text style={styles.loanTypeText} allowFontScaling={false}>{loanType.toUpperCase()}</Text>
          <Text style={styles.lenderName} allowFontScaling={false}>{lender.toUpperCase()}</Text>
        </View>
        <View style={styles.loanIconContainer}>
          {getBankLogo(lender) ? (
            <Image 
              source={getBankLogo(lender)}
              style={styles.loanIcon}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.genericBankIcon} allowFontScaling={false}>🏦</Text>
          )}
        </View>
      </View>

      {/* Loan Details */}
      <View style={styles.loanDetails}>
        <View style={styles.financialSection}>
          {/* Loan Name Column */}
          <View style={styles.loanNameColumn}>
            <Text style={styles.label} allowFontScaling={false}>Loan Name</Text>
            <Text style={styles.loanName} allowFontScaling={false}>{loanName}</Text>
          </View>
          
          {/* Balance Column */}
          <View style={styles.balanceColumn}>
            <Text style={styles.label} allowFontScaling={false}>Outstanding</Text>
            <Text style={styles.loanName} allowFontScaling={false}>₹{currentBalance?.toLocaleString()}</Text>
          </View>
          
          {/* Monthly Payment Column */}
          <View style={styles.monthlyColumn}>
            <Text style={[styles.label, styles.rightAlignedText]} allowFontScaling={false} numberOfLines={1}>Monthly Payment</Text>
            <Text style={[styles.loanName, styles.rightAlignedText]} allowFontScaling={false}>₹{monthlyPayment?.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Section with Interest Rate and Next Payment */}
      <View style={styles.bottomSection}>
        <View style={styles.interestSection}>
          <Text style={styles.interestLabel} allowFontScaling={false}>Interest Rate</Text>
          <Text style={styles.interestValue} allowFontScaling={false}>{Number(interestRate).toFixed(2)}%</Text>
        </View>
        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel} allowFontScaling={false}>Next Payment</Text>
          <Text style={styles.paymentValue} allowFontScaling={false}>{formatNextPaymentDate(nextPaymentDate)}</Text>
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
    height: 220, // Same height as CreditCard for consistency
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    backgroundColor: '#667eea', // Will be overridden dynamically
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loanTypeSection: {
    alignItems: 'flex-start',
  },
  loanTypeText: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  lenderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
  },
  loanIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanIcon: {
    width: 40,
    height: 40,
  },
  genericBankIcon: {
    fontSize: 20,
  },
  loanDetails: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  financialSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    height: 80,
    width: '100%',
  },
  loanNameColumn: {
    flex: 1,
    alignItems: 'flex-start',
    marginRight: 20,
  },
  balanceColumn: {
    flex: 1,
    alignItems: 'flex-start',
    marginRight: 20,
  },
  monthlyColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  financialLabel: {
    color: '#fff',

    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  financialValue: {
    color: '#fff',

  },
  monthlyLabel: {
    color: '#fff',

    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  monthlyValue: {
    color: '#fff',

  },
  label: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  loanName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bottomSection: {
    marginTop: -15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  interestSection: {
    alignItems: 'flex-start',
  },
  interestLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  interestValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentSection: {
    alignItems: 'flex-end',
  },
  paymentLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  paymentValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rightAlignedText: {
    textAlign: 'right',
  },
});

export default LoanCard;

