/**
 * Filter and Sorting Utilities
 * Provides comprehensive filtering and sorting functions for trading data
 */

/**
 * Filter trading pairs based on criteria
 * @param {Array} pairs - Array of trading pair objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered pairs
 */
export const filterPairs = (pairs, filters) => {
  if (!pairs || !Array.isArray(pairs)) return [];

  return pairs.filter(pair => {
    // RSI Range Filter
    if (filters.rsiRange) {
      const rsi = pair.rsi || 0;
      if (rsi < filters.rsiRange.min || rsi > filters.rsiRange.max) {
        return false;
      }
    }

    // RFI Range Filter
    if (filters.rfiRange && pair.rfiData) {
      const rfi = pair.rfiData.score || 0;
      if (rfi < filters.rfiRange.min || rfi > filters.rfiRange.max) {
        return false;
      }
    }

    // Pair Type Filter
    if (filters.pairType && filters.pairType !== 'all') {
      const isCorePair = isCoreCurrencyPair(pair.symbol);
      if (filters.pairType === 'core' && !isCorePair) {
        return false;
      }
      if (filters.pairType === 'extended' && isCorePair) {
        return false;
      }
    }

    // Signal Filter
    if (filters.signal && filters.signal !== 'all') {
      const signal = getPairSignal(pair);
      if (signal !== filters.signal) {
        return false;
      }
    }

    // Volume Filter
    if (filters.volume && filters.volume !== 'all') {
      const volumeLevel = getVolumeLevel(pair.volume);
      if (volumeLevel !== filters.volume) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort trading pairs based on criteria
 * @param {Array} pairs - Array of trading pair objects
 * @param {Object} sortOptions - Sort criteria
 * @returns {Array} Sorted pairs
 */
export const sortPairs = (pairs, sortOptions) => {
  if (!pairs || !Array.isArray(pairs)) return [];

  const { by, order = 'desc' } = sortOptions;
  const isAscending = order === 'asc';

  return [...pairs].sort((a, b) => {
    let aValue, bValue;

    switch (by) {
      case 'rsi':
        aValue = a.rsi || 0;
        bValue = b.rsi || 0;
        break;
      case 'rfi':
        aValue = a.rfiData?.score || 0;
        bValue = b.rfiData?.score || 0;
        break;
      case 'change':
        aValue = a.change || 0;
        bValue = b.change || 0;
        break;
      case 'volume':
        aValue = a.volume || 0;
        bValue = b.volume || 0;
        break;
      case 'symbol':
        aValue = a.symbol || '';
        bValue = b.symbol || '';
        break;
      default:
        aValue = a.rsi || 0;
        bValue = b.rsi || 0;
    }

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return isAscending 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Handle numeric comparison
    if (isAscending) {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
};

/**
 * Apply both filtering and sorting to trading pairs
 * @param {Array} pairs - Array of trading pair objects
 * @param {Object} filters - Filter criteria
 * @param {Object} sortOptions - Sort criteria
 * @returns {Array} Filtered and sorted pairs
 */
export const filterAndSortPairs = (pairs, filters, sortOptions) => {
  const filtered = filterPairs(pairs, filters);
  return sortPairs(filtered, sortOptions);
};

/**
 * Check if a symbol is a core currency pair
 * @param {string} symbol - Currency pair symbol
 * @returns {boolean} True if core pair
 */
export const isCoreCurrencyPair = (symbol) => {
  const corePairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 
    'AUDUSD', 'USDCAD', 'NZDUSD'
  ];
  
  const cleanSymbol = symbol.replace('m', '').toUpperCase();
  return corePairs.includes(cleanSymbol);
};

/**
 * Get pair signal based on RSI and RFI data
 * @param {Object} pair - Trading pair object
 * @returns {string} Signal type ('bullish', 'bearish', 'neutral')
 */
export const getPairSignal = (pair) => {
  // Prioritize RFI signal if available
  if (pair.rfiData && pair.rfiData.signal) {
    return pair.rfiData.signal;
  }

  // Fallback to RSI-based signal
  const rsi = pair.rsi || 50;
  if (rsi >= 70) return 'bearish';
  if (rsi <= 30) return 'bullish';
  return 'neutral';
};

/**
 * Get volume level classification
 * @param {number} volume - Volume value
 * @returns {string} Volume level ('high', 'medium', 'low')
 */
export const getVolumeLevel = (volume) => {
  if (!volume || volume === 0) return 'low';
  
  // These thresholds should be adjusted based on your data
  if (volume > 1000000) return 'high';
  if (volume > 100000) return 'medium';
  return 'low';
};

/**
 * Get filter summary for display
 * @param {Object} filters - Active filters
 * @returns {string} Human-readable filter summary
 */
export const getFilterSummary = (filters) => {
  const parts = [];

  if (filters.rsiRange) {
    parts.push(`RSI: ${filters.rsiRange.min}-${filters.rsiRange.max}`);
  }

  if (filters.rfiRange) {
    parts.push(`RFI: ${filters.rfiRange.min.toFixed(2)}-${filters.rfiRange.max.toFixed(2)}`);
  }

  if (filters.pairType && filters.pairType !== 'all') {
    parts.push(`Type: ${filters.pairType}`);
  }

  if (filters.signal && filters.signal !== 'all') {
    parts.push(`Signal: ${filters.signal}`);
  }

  if (filters.volume && filters.volume !== 'all') {
    parts.push(`Volume: ${filters.volume}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No filters applied';
};

/**
 * Get sort summary for display
 * @param {Object} sortOptions - Sort options
 * @returns {string} Human-readable sort summary
 */
export const getSortSummary = (sortOptions) => {
  const { by, order } = sortOptions;
  const orderText = order === 'asc' ? 'ascending' : 'descending';
  return `Sorted by ${by} (${orderText})`;
};

/**
 * Create default filter state
 * @returns {Object} Default filter configuration
 */
export const getDefaultFilters = () => ({
  rsiRange: { min: 0, max: 100 },
  rfiRange: { min: -1, max: 1 },
  pairType: 'all',
  signal: 'all',
  volume: 'all'
});

/**
 * Create default sort options
 * @returns {Object} Default sort configuration
 */
export const getDefaultSortOptions = () => ({
  by: 'rsi',
  order: 'desc'
});

/**
 * Validate filter values
 * @param {Object} filters - Filter configuration
 * @returns {Object} Validated and corrected filters
 */
export const validateFilters = (filters) => {
  const validated = { ...filters };

  // Validate RSI range
  if (validated.rsiRange) {
    validated.rsiRange.min = Math.max(0, Math.min(100, validated.rsiRange.min || 0));
    validated.rsiRange.max = Math.max(0, Math.min(100, validated.rsiRange.max || 100));
    if (validated.rsiRange.min > validated.rsiRange.max) {
      [validated.rsiRange.min, validated.rsiRange.max] = [validated.rsiRange.max, validated.rsiRange.min];
    }
  }

  // Validate RFI range
  if (validated.rfiRange) {
    validated.rfiRange.min = Math.max(-1, Math.min(1, validated.rfiRange.min || -1));
    validated.rfiRange.max = Math.max(-1, Math.min(1, validated.rfiRange.max || 1));
    if (validated.rfiRange.min > validated.rfiRange.max) {
      [validated.rfiRange.min, validated.rfiRange.max] = [validated.rfiRange.max, validated.rfiRange.min];
    }
  }

  // Validate enum values
  const validPairTypes = ['all', 'core', 'extended'];
  if (!validPairTypes.includes(validated.pairType)) {
    validated.pairType = 'all';
  }

  const validSignals = ['all', 'bullish', 'bearish', 'neutral'];
  if (!validSignals.includes(validated.signal)) {
    validated.signal = 'all';
  }

  const validVolumes = ['all', 'high', 'medium', 'low'];
  if (!validVolumes.includes(validated.volume)) {
    validated.volume = 'all';
  }

  return validated;
};

/**
 * Create search functionality for pairs
 * @param {Array} pairs - Array of trading pair objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered pairs matching search term
 */
export const searchPairs = (pairs, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return pairs;

  const term = searchTerm.toLowerCase().trim();
  
  return pairs.filter(pair => {
    const symbol = (pair.symbol || '').toLowerCase();
    return symbol.includes(term);
  });
};
