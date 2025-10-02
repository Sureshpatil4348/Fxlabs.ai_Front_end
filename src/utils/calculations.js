// Technical Analysis Constants
// All calculations are now performed server-side
// This file exports only constants needed for configuration and display

// Standard EMA Parameters
export const EMA_PERIODS = {
  SHORT: 21,   // Short-term trend
  MEDIUM: 50,  // Medium-term trend
  LONG: 200    // Long-term trend
};

// Signal detection parameters
export const SIGNAL_PARAMETERS = {
  K_LOOKBACK: 3  // Default lookback for new signal detection (K = 3 closed candles)
};

// Quiet-Market Safety parameters
export const QUIET_MARKET_PARAMETERS = {
  ATR_LOOKBACK: 200,        // Lookback period for ATR percentile calculation
  ATR_PERCENTILE: 5,        // 5th percentile threshold for quiet market detection
  QUIET_MARKET_MULTIPLIER: 0.5  // Multiplier for MACD and UTBOT scores in quiet markets
};

// Standard MACD Parameters
export const MACD_PARAMETERS = {
  FAST_PERIOD: 12,   // Fast EMA period
  SLOW_PERIOD: 26,   // Slow EMA period
  SIGNAL_PERIOD: 9   // Signal line EMA period
};

// RFI (RSI-Flow Imbalance) Parameters
export const RFI_PARAMETERS = {
  RSI_PERIOD: 14,
  VOLUME_PERIOD: 20,
  PRICE_PERIOD: 20
};

// UT Bot Parameters
export const UT_BOT_PARAMETERS = {
  EMA_LENGTH: 50,           // EMA length for baseline
  ATR_LENGTH: 10,           // ATR calculation period
  ATR_MULTIPLIER: 3.0,      // ATR multiplier for stops
  CONFIRMATION_BARS: 1,     // Optional confirmation bars (off by default)
  MIN_ATR_THRESHOLD: 0.00001 // Minimum ATR threshold for trade validity
};

// IchimokuClone Parameters
export const ICHIMOKU_PARAMETERS = {
  TENKAN_PERIOD: 9,    // Tenkan-sen period
  KIJUN_PERIOD: 26,    // Kijun-sen period
  SENKOU_B_PERIOD: 52, // Senkou Span B period
  CHIKOU_SHIFT: 26     // Chikou Span shift
};

// Note: All calculation functions have been removed.
// Technical indicators are now calculated server-side.
// Components should receive pre-calculated values from the API/WebSocket.
