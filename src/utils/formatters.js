// Utility functions for formatting data in the FXLabs.AI dashboard

export const formatPrice = (price, precision = 5) => {
  if (typeof price !== 'number' || isNaN(price)) return '0.00000';
  return price.toFixed(precision);
};

export const formatPercentage = (value, precision = 2) => {
  if (typeof value !== 'number' || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(precision)}%`;
};

export const formatRsi = (rsi) => {
  if (typeof rsi !== 'number' || isNaN(rsi)) return '--';
  return rsi.toFixed(1);
};

export const formatCurrency = (currency) => {
  const currencyMap = {
    'USD': { name: 'US Dollar', flag: '🇺🇸' },
    'EUR': { name: 'Euro', flag: '🇪🇺' },
    'GBP': { name: 'British Pound', flag: '🇬🇧' },
    'JPY': { name: 'Japanese Yen', flag: '🇯🇵' },
    'AUD': { name: 'Australian Dollar', flag: '🇦🇺' },
    'CAD': { name: 'Canadian Dollar', flag: '🇨🇦' },
    'CHF': { name: 'Swiss Franc', flag: '🇨🇭' },
    'NZD': { name: 'New Zealand Dollar', flag: '🇳🇿' }
  };
  
  return currencyMap[currency] || { name: currency, flag: '🏳️' };
};

export const formatSymbolDisplay = (symbol) => {
  // Remove 'm' suffix and format as currency pair
  const cleanSymbol = symbol.replace(/m$/, '');
  if (cleanSymbol.length === 6) {
    return `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}`;
  }
  return cleanSymbol;
};

export const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const formatNewsTime = (timeString) => {
  try {
    const [time, timezone] = timeString.split(' ');
    return { time, timezone };
  } catch {
    return { time: timeString, timezone: '' };
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'match':
      return 'text-gray-600 bg-gray-50 border-gray-200'; // Neutral color for matches
    case 'mismatch':
      return 'text-danger-600 bg-red-50 border-red-200'; // Highlight only mismatches
    case 'neutral':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'match':
      return '✅';
    case 'mismatch':
      return '❌';
    case 'neutral':
    default:
      return '⚪';
  }
};

export const getRsiColor = (rsi, overbought = 70, oversold = 30) => {
  if (rsi >= overbought) return 'text-danger-600';
  if (rsi <= oversold) return 'text-success-600';
  return 'text-gray-600';
};

export const getCurrencyStrengthColor = (strength) => {
  if (strength >= 70) return 'text-success-600 bg-success-100';
  if (strength >= 60) return 'text-success-500 bg-success-50';
  if (strength >= 40) return 'text-gray-600 bg-gray-100';
  if (strength >= 30) return 'text-danger-500 bg-danger-50';
  return 'text-danger-600 bg-danger-100';
};

export const getImpactColor = (impact) => {
  switch (impact?.toLowerCase()) {
    case 'high':
      return 'text-danger-600 bg-danger-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'low':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const sortCorrelationPairs = (correlationStatus) => {
  const pairs = Array.from(correlationStatus.entries());
  
  // Sort by status priority: non-neutral first, then neutral
  return pairs.sort((a, b) => {
    const [, statusA] = a;
    const [, statusB] = b;
    
    // Non-neutral pairs (match/mismatch) first, neutral pairs last
    if (statusA.status !== 'neutral' && statusB.status === 'neutral') return -1;
    if (statusA.status === 'neutral' && statusB.status !== 'neutral') return 1;
    
    // Within non-neutral pairs, prioritize mismatches over matches
    if (statusA.status !== 'neutral' && statusB.status !== 'neutral') {
      if (statusA.status === 'mismatch' && statusB.status === 'match') return -1;
      if (statusA.status === 'match' && statusB.status === 'mismatch') return 1;
    }
    
    // Within same status, sort by RSI extremes (highest or lowest RSI values)
    const extremeA = Math.max(Math.abs(statusA.rsi1 - 50), Math.abs(statusA.rsi2 - 50));
    const extremeB = Math.max(Math.abs(statusB.rsi1 - 50), Math.abs(statusB.rsi2 - 50));
    
    return extremeB - extremeA;
  });
};
