export const formatCurrency = (amount: number | string, forcePlus: boolean = false): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const isNegative = num < 0;
  const sign = isNegative ? '-' : (forcePlus && num > 0 ? '+' : '');
  return `${sign}₹${Math.abs(num).toFixed(2)}`;
};
