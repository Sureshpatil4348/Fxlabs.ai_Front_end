/**
 * RSI-Flow Imbalance (RFI) Calculation Utilities
 * 
 * RFI combines RSI, volume flow, and price flow to provide a comprehensive
 * market sentiment indicator that goes beyond traditional RSI analysis.
 */

/**
 * Calculate RSI Flow based on RSI momentum and direction
 * @param {Array} rsiValues - Array of RSI values over time
 * @returns {number} RSI flow score (-1 to 1)
 */
export const calculateRSIFlow = (rsiValues) => {
  if (!rsiValues || rsiValues.length < 3) return 0;

  const recent = rsiValues.slice(-3);
  const flow = recent.reduce((sum, rsi, index) => {
    if (index === 0) return sum;
    const change = rsi - recent[index - 1];
    return sum + change;
  }, 0);

  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, flow / 30));
};

/**
 * Calculate Volume Flow based on volume changes
 * @param {Array} volumeData - Array of volume values over time
 * @returns {number} Volume flow score (-1 to 1)
 */
export const calculateVolumeFlow = (volumeData) => {
  if (!volumeData || volumeData.length < 3) return 0;

  const recent = volumeData.slice(-3);
  const _avgVolume = recent.reduce((sum, vol) => sum + vol, 0) / recent.length; // Unused variable, prefixed with underscore
  
  // Calculate volume momentum
  const volumeMomentum = recent.reduce((sum, vol, index) => {
    if (index === 0) return sum;
    const change = (vol - recent[index - 1]) / recent[index - 1];
    return sum + change;
  }, 0);

  // Normalize based on average volume and momentum
  const normalizedMomentum = volumeMomentum / 3;
  return Math.max(-1, Math.min(1, normalizedMomentum));
};

/**
 * Calculate Price Flow based on price momentum and volatility
 * @param {Array} priceData - Array of price values over time
 * @returns {number} Price flow score (-1 to 1)
 */
export const calculatePriceFlow = (priceData) => {
  if (!priceData || priceData.length < 3) return 0;

  const recent = priceData.slice(-3);
  
  // Calculate price momentum
  const priceMomentum = recent.reduce((sum, price, index) => {
    if (index === 0) return sum;
    const change = (price - recent[index - 1]) / recent[index - 1];
    return sum + change;
  }, 0);

  // Calculate volatility
  const avgPrice = recent.reduce((sum, price) => sum + price, 0) / recent.length;
  const volatility = recent.reduce((sum, price) => {
    return sum + Math.pow((price - avgPrice) / avgPrice, 2);
  }, 0) / recent.length;

  // Combine momentum and volatility
  const normalizedMomentum = priceMomentum / 3;
  const volatilityAdjustment = Math.min(0.5, volatility * 10);
  
  return Math.max(-1, Math.min(1, normalizedMomentum + volatilityAdjustment));
};

/**
 * Calculate comprehensive RFI score
 * @param {Object} data - Market data object
 * @param {Array} data.rsiValues - RSI values over time
 * @param {Array} data.volumeData - Volume values over time
 * @param {Array} data.priceData - Price values over time
 * @param {Object} weights - Weight configuration for different flows
 * @returns {Object} RFI analysis result
 */
export const calculateRFI = (data, weights = { rsi: 0.4, volume: 0.3, price: 0.3 }) => {
  const { rsiValues, volumeData, priceData } = data;
  
  // Calculate individual flows
  const rsiFlow = calculateRSIFlow(rsiValues);
  const volumeFlow = calculateVolumeFlow(volumeData);
  const priceFlow = calculatePriceFlow(priceData);
  
  // Calculate weighted RFI score
  const rfi = (rsiFlow * weights.rsi) + (volumeFlow * weights.volume) + (priceFlow * weights.price);
  
  // Determine signal strength and direction
  let signal = 'neutral';
  let strength = 'weak';
  
  if (rfi > 0.6) {
    signal = 'bullish';
    strength = rfi > 0.8 ? 'strong' : 'moderate';
  } else if (rfi < -0.6) {
    signal = 'bearish';
    strength = rfi < -0.8 ? 'strong' : 'moderate';
  }
  
  return {
    score: rfi,
    rsiFlow,
    volumeFlow,
    priceFlow,
    signal,
    strength,
    timestamp: new Date(),
    weights
  };
};

/**
 * Calculate RFI for multiple symbols
 * @param {Map} symbolData - Map of symbol -> market data
 * @param {Object} weights - Weight configuration
 * @returns {Map} Map of symbol -> RFI analysis
 */
export const calculateRFIForSymbols = (symbolData, weights = { rsi: 0.4, volume: 0.3, price: 0.3 }) => {
  const rfiResults = new Map();
  
  symbolData.forEach((data, symbol) => {
    try {
      const rfi = calculateRFI(data, weights);
      rfiResults.set(symbol, rfi);
    } catch (error) {
      console.error(`Failed to calculate RFI for ${symbol}:`, error);
      // Set neutral RFI for failed calculations
      rfiResults.set(symbol, {
        score: 0,
        rsiFlow: 0,
        volumeFlow: 0,
        priceFlow: 0,
        signal: 'neutral',
        strength: 'weak',
        timestamp: new Date(),
        weights
      });
    }
  });
  
  return rfiResults;
};

/**
 * Get RFI signal color for UI display
 * @param {string} signal - RFI signal ('bullish', 'bearish', 'neutral')
 * @param {string} strength - Signal strength ('strong', 'moderate', 'weak')
 * @returns {string} CSS color class
 */
export const getRFISignalColor = (signal, strength) => {
  if (signal === 'bullish') {
    return strength === 'strong' ? 'text-green-600' : 'text-green-500';
  } else if (signal === 'bearish') {
    return strength === 'strong' ? 'text-red-600' : 'text-red-500';
  }
  return 'text-gray-500';
};

/**
 * Get RFI signal background color for UI display
 * @param {string} signal - RFI signal ('bullish', 'bearish', 'neutral')
 * @param {string} strength - Signal strength ('strong', 'moderate', 'weak')
 * @returns {string} CSS background color class
 */
export const getRFISignalBgColor = (signal, strength) => {
  if (signal === 'bullish') {
    return strength === 'strong' ? 'bg-green-100' : 'bg-green-50';
  } else if (signal === 'bearish') {
    return strength === 'strong' ? 'bg-red-100' : 'bg-red-50';
  }
  return 'bg-gray-50';
};

/**
 * Format RFI score for display
 * @param {number} score - RFI score (-1 to 1)
 * @returns {string} Formatted score string
 */
export const formatRFIScore = (score) => {
  if (score === null || score === undefined || isNaN(score)) {
    return 'N/A';
  }
  return score.toFixed(3);
};

/**
 * Get RFI trend direction based on recent scores
 * @param {Array} rfiScores - Array of recent RFI scores
 * @returns {string} Trend direction ('increasing', 'decreasing', 'stable')
 */
export const getRFITrend = (rfiScores) => {
  if (!rfiScores || rfiScores.length < 2) return 'stable';
  
  const recent = rfiScores.slice(-3);
  const trend = recent.reduce((sum, score, index) => {
    if (index === 0) return sum;
    return sum + (score - recent[index - 1]);
  }, 0);
  
  if (trend > 0.1) return 'increasing';
  if (trend < -0.1) return 'decreasing';
  return 'stable';
};
