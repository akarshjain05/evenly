export const formatCurrency = (amount: number | string, forcePlus: boolean = false): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const absFormatted = Math.abs(num).toFixed(2);
  const isEffectivelyZero = absFormatted === '0.00';
  const isNegative = num < 0 && !isEffectivelyZero;
  const sign = isNegative ? '-' : (forcePlus && num > 0 && !isEffectivelyZero ? '+' : '');
  return `${sign}₹${absFormatted}`;
};
