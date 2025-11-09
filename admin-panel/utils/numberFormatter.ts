export const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    ...options,
  }).format(value);
};

export const formatCurrency = (
  value: number | null | undefined,
  showDecimals: boolean = false
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
};
