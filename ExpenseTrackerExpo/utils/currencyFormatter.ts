/**
 * Currency Formatter Utility
 * 
 * Standardizes currency formatting across the app using Indian numbering system (en-IN)
 * Format: 1,000 | 10,000 | 1,00,000 | 10,00,000 | 1,00,00,000
 */

/**
 * Format currency amount with Indian numbering system (en-IN locale)
 * @param amount - The amount to format
 * @param showCurrencySymbol - Whether to include ₹ symbol (default: true)
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(100000) // Returns "₹1,00,000"
 * formatCurrency(100000, false) // Returns "1,00,000"
 * formatCurrency(100000, true, true) // Returns "₹1,00,000.00"
 */
export const formatCurrency = (
  amount: number,
  showCurrencySymbol: boolean = true,
  showDecimals: boolean = false
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showCurrencySymbol ? '₹0' : '0';
  }

  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  // Use Indian numbering system (en-IN) for consistent formatting
  const formatted = new Intl.NumberFormat('en-IN', {
    style: showCurrencySymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absoluteAmount);

  // If currency symbol is included by Intl, return as is
  // Otherwise, manually add ₹ symbol
  if (showCurrencySymbol && !formatted.includes('₹') && !formatted.includes('Rs')) {
    return `${isNegative ? '-' : ''}₹${formatted}`;
  }

  return `${isNegative ? '-' : ''}${formatted}`;
};

/**
 * Format number with Indian numbering system (without currency symbol)
 * @param num - The number to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(100000) // Returns "1,00,000"
 * formatNumber(100000.50, true) // Returns "1,00,000.50"
 */
export const formatNumber = (num: number, showDecimals: boolean = false): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
};

/**
 * Quick format function for currency (shorthand)
 * Same as formatCurrency(amount, true, false)
 */
export const currency = (amount: number): string => {
  return formatCurrency(amount, true, false);
};

