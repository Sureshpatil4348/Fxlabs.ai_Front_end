/**
 * RSI-Flow Imbalance (RFI) Display Utilities
 * 
 * All RFI calculations are now performed server-side.
 * This file contains only UI formatting and display helpers.
 */

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

// Note: All RFI calculation functions have been removed.
// RFI scores and components (rsiFlow, volumeFlow, priceFlow) are now calculated server-side.
// Components should receive pre-calculated RFI data from the API/WebSocket.
