// Utility functions for formatting data in the FxLabs Prime dashboard

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
  return rsi.toFixed(2);
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
  const cleanSymbol = String(symbol || '').replace(/m$/i, '');
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

// Format a news item's datetime into device's local timezone
// Accepts either:
// - ISO string via news.date
// - Original server-provided time string "YYYY.MM.DD HH:mm:ss" via news.originalTime
// The function prefers ISO `dateIso` when available for reliable timezone conversion.
export const formatNewsLocalDateTime = ({ dateIso, originalTime }) => {
  // Helper: try parse ISO first
  const parseIso = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  // Helper: parse "YYYY.MM.DD HH:mm:ss" as local time
  const parseOriginal = (str) => {
    try {
      if (!str) return null;
      const [datePart, timePart] = str.split(' ');
      if (!datePart || !timePart) return null;
      const [y, m, d] = datePart.split('.').map((v) => parseInt(v, 10));
      const [hh, mm, ss] = timePart.split(':').map((v) => parseInt(v, 10));
      const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0));
      return isNaN(dt.getTime()) ? null : dt;
    } catch {
      return null;
    }
  };

  let dateObj = null;
  if (dateIso) {
    dateObj = parseIso(dateIso);
  }
  if (!dateObj && originalTime) {
    dateObj = parseOriginal(originalTime);
  }
  // Fallback: now
  if (!dateObj) {
    dateObj = new Date();
  }

  // Build localized outputs
  const localTime = dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const localDate = dateObj.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
  const localTzName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  return {
    time: localTime,
    date: localDate,
    timezone: localTzName,
    dateObj
  };
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
  if (strength > 0) {
    // Positive values - Green (stronger = darker green)
    if (strength >= 50) return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
    if (strength >= 20) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    return 'text-green-500 bg-green-50 dark:text-green-500 dark:bg-green-900/10';
  } else if (strength < 0) {
    // Negative values - Red (weaker = darker red)
    if (strength <= -50) return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30';
    if (strength <= -20) return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    return 'text-red-500 bg-red-50 dark:text-red-500 dark:bg-red-900/10';
  }
  // Zero or neutral
  return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
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

// Get event status and timing information
export const getEventTiming = (newsItem) => {
  const { dateObj } = formatNewsLocalDateTime({ 
    dateIso: newsItem.date, 
    originalTime: newsItem.originalTime 
  });
  
  const now = new Date();
  const eventTime = dateObj;
  const timeDiff = eventTime.getTime() - now.getTime();
  
  // Determine status
  let status = 'upcoming';
  let timingText = 'Starting soon';
  
  if (timeDiff < 0) {
    // Event has passed
    status = 'past';
    const hoursAgo = Math.abs(Math.floor(timeDiff / (1000 * 60 * 60)));
    const minutesAgo = Math.abs(Math.floor(timeDiff / (1000 * 60)));
    
    if (hoursAgo > 0) {
      timingText = `Started ${hoursAgo}h ago`;
    } else if (minutesAgo > 0) {
      timingText = `Started ${minutesAgo}m ago`;
    } else {
      timingText = 'Just started';
    }
  } else if (timeDiff < 30 * 60 * 1000) {
    // Event is starting within 30 minutes
    status = 'starting-soon';
    const minutesLeft = Math.floor(timeDiff / (1000 * 60));
    timingText = `In ${minutesLeft}m`;
  } else if (timeDiff < 2 * 60 * 60 * 1000) {
    // Event is starting within 2 hours
    status = 'upcoming';
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    timingText = `In ${hoursLeft}h ${minutesLeft}m`;
  } else {
    // Event is more than 2 hours away
    status = 'upcoming';
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    timingText = `In ${hoursLeft}h`;
  }
  
  return {
    status,
    timingText,
    isUpcoming: status === 'upcoming' || status === 'starting-soon',
    isPast: status === 'past',
    isStartingSoon: status === 'starting-soon'
  };
};
