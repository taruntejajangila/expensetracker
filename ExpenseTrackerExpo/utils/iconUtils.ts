// Mock iconUtils for testing
export const getCategoryIcon = (categoryName: string): string => {
  const iconMap: { [key: string]: string } = {
    'Food & Dining': 'restaurant',
    'Groceries & Vegetables': 'basket',
    'Transportation': 'car',
    'Shopping': 'bag',
    'Entertainment': 'film',
    'Bills & Utilities': 'receipt',
    'Healthcare': 'medical',
    'Education': 'school',
    'Salary': 'cash',
    'Freelance': 'laptop',
    'Investment': 'trending-up',
    'Other': 'ellipsis-horizontal',
    'Others': 'ellipsis-horizontal'
  };
  
  return iconMap[categoryName] || 'ellipsis-horizontal';
};

export const getCategoryColor = (categoryName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Food & Dining': '#FF6B6B',
    'Groceries & Vegetables': '#4CAF50',
    'Transportation': '#4ECDC4',
    'Shopping': '#A8E6CF',
    'Entertainment': '#FFB6C1',
    'Bills & Utilities': '#DDA0DD',
    'Healthcare': '#87CEEB',
    'Education': '#F0E68C',
    'Salary': '#34C759',
    'Freelance': '#F7DC6F',
    'Investment': '#98D8C8',
    'Other': '#CCCCCC',
    'Others': '#CCCCCC'
  };
  
  return colorMap[categoryName] || '#CCCCCC';
};

export const getAccountIcon = (accountType: string): string => {
  const iconMap: { [key: string]: string } = {
    'checking': 'card',
    'savings': 'wallet',
    'credit': 'credit-card',
    'investment': 'trending-up',
    'loan': 'receipt'
  };
  
  return iconMap[accountType] || 'card';
};

export const getAccountColor = (accountType: string): string => {
  const colorMap: { [key: string]: string } = {
    'checking': '#007AFF',
    'savings': '#34C759',
    'credit': '#FF9500',
    'investment': '#5856D6',
    'loan': '#FF3B30'
  };
  
  return colorMap[accountType] || '#007AFF';
};

export const getIconName = (iconName: string): string => {
  // If iconName is already a valid Ionicons name, return it as is
  // Otherwise, try to map it to a valid Ionicons name
  const iconMap: { [key: string]: string } = {
    'restaurant': 'restaurant',
    'car': 'car',
    'bag': 'bag',
    'film': 'film',
    'receipt': 'receipt',
    'medical': 'medical',
    'school': 'school',
    'cash': 'cash',
    'laptop': 'laptop',
    'trending-up': 'trending-up',
    'ellipsis-horizontal': 'ellipsis-horizontal',
    'wallet': 'wallet',
    'credit-card': 'card',
    'food': 'restaurant',
    'transport': 'car',
    'shopping': 'bag',
    'entertainment': 'film',
    'bills': 'receipt',
    'health': 'medical',
    'education': 'school',
    'salary': 'cash',
    'freelance': 'laptop',
    'investment': 'trending-up',
    'other': 'ellipsis-horizontal',
    'others': 'ellipsis-horizontal'
  };
  
  // Return mapped icon or the original name if it's already valid
  return iconMap[iconName] || iconName || 'ellipsis-horizontal';
};

