// Mathematical calculations for technical analysis
//
// DATA REQUIREMENTS SUMMARY:
// - EMA21: 21+ bars minimum
// - EMA50: 50+ bars minimum  
// - EMA200: 200+ bars minimum
// - RSI: 15+ bars minimum (14 + 1)
// - MACD: 26+ bars minimum
// - UTBOT: 51+ bars minimum (max(50 EMA, 10 ATR) + 1)
// - Ichimoku: 52+ bars minimum
//
// All functions now handle partial data gracefully and return null if insufficient data

export const calculateSMA = (data, period) => {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
};

export const calculateEMA = (data, period, previousEMA = null) => {
  if (data.length === 0) return null;
  
  const multiplier = 2 / (period + 1);
  const currentValue = data[data.length - 1];
  
  if (previousEMA === null) {
    // First EMA calculation - use SMA
    return calculateSMA(data, Math.min(period, data.length));
  }
  
  return (currentValue * multiplier) + (previousEMA * (1 - multiplier));
};

// Standard EMA Parameters - Updated to match requirements
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

// New Signal Definition (global)
// A cell is NEW when its trigger happened within the last K = 3 closed candles on that timeframe:
// - EMA: price cross over/under EMA
// - MACD: MACD/Signal cross
// - RSI: 50 cross or 30/70 exit
// - UTBOT: regime flip
// - IchimokuClone: Tenkan/Kijun cross or price cloud breakout
// NEW only affects per-cell score via the ±0.25 boost already defined.

// Quiet-Market Safety: Detect when ATR is extremely low (below 5th percentile of last 200 values)
// This reduces false flips in dead markets by halving MACD and UTBOT contributions
export const isQuietMarket = (bars, atrPeriod = 14) => {
  if (!bars || bars.length < QUIET_MARKET_PARAMETERS.ATR_LOOKBACK + atrPeriod) return false;
  
  const highs = bars.map(bar => bar.high);
  const lows = bars.map(bar => bar.low);
  const closes = bars.map(bar => bar.close);
  
  // Calculate ATR values for the lookback period
  const atrValues = [];
  
  for (let i = atrPeriod; i < bars.length; i++) {
    const atr = calculateATR(highs.slice(0, i + 1), lows.slice(0, i + 1), closes.slice(0, i + 1), atrPeriod);
    if (atr !== null) {
      atrValues.push(atr);
    }
  }
  
  if (atrValues.length < QUIET_MARKET_PARAMETERS.ATR_LOOKBACK) return false;
  
  // Get the last ATR_LOOKBACK values
  const recentATRs = atrValues.slice(-QUIET_MARKET_PARAMETERS.ATR_LOOKBACK);
  
  // Calculate the 5th percentile
  const sortedATRs = [...recentATRs].sort((a, b) => a - b);
  const percentileIndex = Math.floor((QUIET_MARKET_PARAMETERS.ATR_PERCENTILE / 100) * sortedATRs.length);
  const fifthPercentile = sortedATRs[percentileIndex];
  
  // Get current ATR
  const currentATR = atrValues[atrValues.length - 1];
  
  // Check if current ATR is below 5th percentile
  const isQuiet = currentATR < fifthPercentile;
  
  return {
    isQuiet,
    currentATR,
    fifthPercentile,
    atrValues: recentATRs
  };
};

// Calculate multiple EMAs for trend analysis
export const calculateMultipleEMAs = (closes) => {
  if (closes.length < EMA_PERIODS.LONG) return null;
  
  const _emas = {}; // Unused variable, prefixed with underscore
  const ema21 = [];
  const ema50 = [];
  const ema200 = [];
  
  // Calculate EMAs for each period
  for (let i = 0; i < closes.length; i++) {
    const dataSlice = closes.slice(0, i + 1);
    
    if (i >= EMA_PERIODS.SHORT - 1) {
      ema21.push(calculateEMA(dataSlice, EMA_PERIODS.SHORT, ema21[ema21.length - 1]));
    }
    
    if (i >= EMA_PERIODS.MEDIUM - 1) {
      ema50.push(calculateEMA(dataSlice, EMA_PERIODS.MEDIUM, ema50[ema50.length - 1]));
    }
    
    if (i >= EMA_PERIODS.LONG - 1) {
      ema200.push(calculateEMA(dataSlice, EMA_PERIODS.LONG, ema200[ema200.length - 1]));
    }
  }
  
  return {
    ema21: ema21[ema21.length - 1],
    ema50: ema50[ema50.length - 1],
    ema200: ema200[ema200.length - 1],
    trend: getEMATrend(ema21[ema21.length - 1], ema50[ema50.length - 1], ema200[ema200.length - 1])
  };
};

// Determine trend based on EMA alignment
export const getEMATrend = (ema21, ema50, ema200) => {
  if (ema21 > ema50 && ema50 > ema200) return 'bullish';
  if (ema21 < ema50 && ema50 < ema200) return 'bearish';
  return 'sideways';
};

// Calculate EMA slope (rate of change)
export const calculateEMASlope = (emaValues, period = 1) => {
  if (emaValues.length < period + 1) return 0;
  const current = emaValues[emaValues.length - 1];
  const previous = emaValues[emaValues.length - 1 - period];
  return current - previous;
};

// Enhanced EMA Analysis with Signal Detection
export const calculateEMASignals = (closes, kLookback = SIGNAL_PARAMETERS.K_LOOKBACK) => {
  // More flexible validation - allow partial EMA calculations
  if (closes.length < EMA_PERIODS.SHORT + kLookback) return null;
  
  const currentClose = closes[closes.length - 1];
  
  // Calculate EMA values for all periods
  const ema21Values = [];
  const ema50Values = [];
  const ema200Values = [];
  
  let ema21 = null;
  let ema50 = null;
  let ema200 = null;
  
  // Calculate EMAs for each period with error handling
  for (let i = 0; i < closes.length; i++) {
    const dataSlice = closes.slice(0, i + 1);
    
    // EMA21 calculation
    if (i >= EMA_PERIODS.SHORT - 1) {
      try {
        const newEMA21 = calculateEMA(dataSlice, EMA_PERIODS.SHORT, ema21);
        if (newEMA21 !== null && !isNaN(newEMA21)) {
          ema21 = newEMA21;
          ema21Values.push(ema21);
        }
      } catch (error) {
        console.warn('EMA21 calculation error at index', i, ':', error.message);
      }
    }
    
    // EMA50 calculation
    if (i >= EMA_PERIODS.MEDIUM - 1) {
      try {
        const newEMA50 = calculateEMA(dataSlice, EMA_PERIODS.MEDIUM, ema50);
        if (newEMA50 !== null && !isNaN(newEMA50)) {
          ema50 = newEMA50;
          ema50Values.push(ema50);
        }
      } catch (error) {
        console.warn('EMA50 calculation error at index', i, ':', error.message);
      }
    }
    
    // EMA200 calculation (only if enough data)
    if (i >= EMA_PERIODS.LONG - 1) {
      try {
        const newEMA200 = calculateEMA(dataSlice, EMA_PERIODS.LONG, ema200);
        if (newEMA200 !== null && !isNaN(newEMA200)) {
          ema200 = newEMA200;
          ema200Values.push(ema200);
        }
      } catch (error) {
        console.warn('EMA200 calculation error at index', i, ':', error.message);
      }
    }
  }
  
  // Calculate slopes with null safety
  const ema21Slope = ema21Values.length >= 2 ? calculateEMASlope(ema21Values) : 0;
  const ema50Slope = ema50Values.length >= 2 ? calculateEMASlope(ema50Values) : 0;
  const ema200Slope = ema200Values.length >= 2 ? calculateEMASlope(ema200Values) : 0;
  
  // Determine signals for each EMA with null safety
  const getEMASignal = (close, ema, slope) => {
    if (ema === null || ema === undefined || isNaN(ema)) return 'neutral';
    if (close > ema && slope >= 0) return 'buy';
    if (close < ema && slope <= 0) return 'sell';
    return 'neutral';
  };
  
  const ema21Signal = ema21 !== null ? getEMASignal(currentClose, ema21, ema21Slope) : 'neutral';
  const ema50Signal = ema50 !== null ? getEMASignal(currentClose, ema50, ema50Slope) : 'neutral';
  const ema200Signal = ema200 !== null ? getEMASignal(currentClose, ema200, ema200Slope) : 'neutral';
  
  // Check for new signals (crosses within last K bars)
  const checkNewSignal = (closeValues, emaValues, kLookback) => {
    if (closeValues.length < kLookback + 1 || emaValues.length < kLookback + 1) return false;
    
    const recentCloses = closeValues.slice(-kLookback - 1);
    const recentEMAs = emaValues.slice(-kLookback - 1);
    
    for (let i = 1; i < recentCloses.length; i++) {
      const prevClose = recentCloses[i - 1];
      const currClose = recentCloses[i];
      const prevEMA = recentEMAs[i - 1];
      const currEMA = recentEMAs[i];
      
      // Check for cross above (bullish)
      if (prevClose <= prevEMA && currClose > currEMA) return true;
      // Check for cross below (bearish)
      if (prevClose >= prevEMA && currClose < currEMA) return true;
    }
    return false;
  };
  
  const ema21New = ema21 !== null && ema21Values.length > kLookback ? 
    checkNewSignal(closes.slice(-kLookback - 1), ema21Values.slice(-kLookback - 1), kLookback) : false;
  const ema50New = ema50 !== null && ema50Values.length > kLookback ? 
    checkNewSignal(closes.slice(-kLookback - 1), ema50Values.slice(-kLookback - 1), kLookback) : false;
  const ema200New = ema200 !== null && ema200Values.length > kLookback ? 
    checkNewSignal(closes.slice(-kLookback - 1), ema200Values.slice(-kLookback - 1), kLookback) : false;
  
  // Build result object with only successful calculations
  const result = {};
  
  // Only include EMAs that have valid calculations
  if (ema21 !== null && !isNaN(ema21)) {
    result.ema21 = {
      value: ema21,
      slope: ema21Slope,
      signal: ema21Signal,
      new: ema21New
    };
  }
  
  if (ema50 !== null && !isNaN(ema50)) {
    result.ema50 = {
      value: ema50,
      slope: ema50Slope,
      signal: ema50Signal,
      new: ema50New
    };
  }
  
  if (ema200 !== null && !isNaN(ema200)) {
    result.ema200 = {
      value: ema200,
      slope: ema200Slope,
      signal: ema200Signal,
      new: ema200New
    };
  }
  
  // Add trend analysis if we have at least 2 EMAs
  if (Object.keys(result).length >= 2) {
    result.trend = getEMATrend(ema21, ema50, ema200);
  }
  
  // Return null if no EMAs could be calculated
  if (Object.keys(result).length === 0) {
    console.warn('❌ No EMA calculations successful', {
      dataLength: closes.length,
      required: { ema21: EMA_PERIODS.SHORT, ema50: EMA_PERIODS.MEDIUM, ema200: EMA_PERIODS.LONG },
      kLookback
    });
    return null;
  }
  
  // console.log(`✅ EMA calculations successful: ${Object.keys(result).join(', ')}`, {
  //   dataLength: closes.length,
  //   ema21Available: !!result.ema21,
  //   ema50Available: !!result.ema50,
  //   ema200Available: !!result.ema200
  // });
  
  return result;
};

export const calculateRSI = (closes, period = 14) => {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Wilder's RSI smoothing formula: Wilder's Moving Average
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    // Wilder's smoothing: (Previous Average * (Period - 1) + Current Value) / Period
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Enhanced RSI Analysis with Signal Detection (Updated to match requirements)
export const calculateRSISignals = (closes, period = 14, kLookback = SIGNAL_PARAMETERS.K_LOOKBACK) => {
  // More flexible validation - allow RSI calculation with minimum data
  if (closes.length < period + 1) {
    console.warn(`❌ RSI needs ${period + 1} bars, have ${closes.length}`);
    return null;
  }
  
  // Check for valid price data and clean it
  const validCloses = closes.filter(price => price != null && !isNaN(price) && price > 0);
  if (validCloses.length < period + 1) {
    console.warn(`❌ RSI needs ${period + 1} valid prices, have ${validCloses.length} valid out of ${closes.length} total`);
    console.warn('Sample invalid data:', closes.filter(price => price == null || isNaN(price) || price <= 0).slice(0, 3));
    return null;
  }
  
  // Use cleaned data for RSI calculation
  const cleanedCloses = validCloses;
  
  // Calculate RSI values for all periods with error handling
  const rsiValues = [];
  
  try {
    for (let i = period; i < cleanedCloses.length; i++) {
      const rsi = calculateRSI(cleanedCloses.slice(0, i + 1), period);
      if (rsi !== null && !isNaN(rsi)) {
        rsiValues.push(rsi);
      }
    }
  } catch (error) {
    console.error('❌ RSI calculation loop error:', error);
    return null;
  }
  
  if (rsiValues.length === 0) {
    console.warn('❌ No valid RSI values calculated');
    return null;
  }
  
  const currentRSI = rsiValues[rsiValues.length - 1];
  
  // Determine signal based on requirements
  let signal = 'neutral';
  if (currentRSI <= 30) {
    signal = 'buy';  // RSI goes below 25, RSI <= 30
  } else if (currentRSI >= 70) {
    signal = 'sell'; // RSI goes above 75, RSI >= 70
  }
  
  // Check for new signals (crosses within last K bars) - with safety checks
  // RSI: 50 cross or 30/70 exit
  const checkNewSignal = (rsiValues, kLookback) => {
    // More flexible - work with available data
    if (rsiValues.length < 2) return false;
    
    const actualLookback = Math.min(kLookback, rsiValues.length - 1);
    const recentRSI = rsiValues.slice(-actualLookback - 1);
    
    try {
      for (let i = 1; i < recentRSI.length; i++) {
        const prevRSI = recentRSI[i - 1];
        const currRSI = recentRSI[i];
        
        if (isNaN(prevRSI) || isNaN(currRSI)) continue;
        
        // Check for 50 cross (bullish - RSI crosses above 50)
        if (prevRSI <= 50 && currRSI > 50) return true;
        // Check for 50 cross (bearish - RSI crosses below 50)
        if (prevRSI >= 50 && currRSI < 50) return true;
        // Check for cross below 30 (bullish - oversold exit)
        if (prevRSI > 30 && currRSI <= 30) return true;
        // Check for cross above 70 (bearish - overbought exit)
        if (prevRSI < 70 && currRSI >= 70) return true;
      }
    } catch (error) {
      console.warn('RSI new signal detection error:', error);
      return false;
    }
    return false;
  };
  
  const newSignal = checkNewSignal(rsiValues, kLookback);
  
  return {
    rsi: Math.round(currentRSI * 100) / 100,
    analysis: {
      signal: signal,
      new: newSignal,
      oversold: currentRSI <= 30,
      overbought: currentRSI >= 70,
      neutral: currentRSI > 30 && currentRSI < 70
    }
  };
};

// Centered RSI (cRSI) = RSI - 50
export const calculateCenteredRSI = (closes, period = 14) => {
  const rsi = calculateRSI(closes, period);
  if (rsi === null) return null;
  return rsi - 50;
};

// RFI (RSI-Flow Imbalance) Parameters
export const RFI_PARAMETERS = {
  RSI_PERIOD: 14,
  VOLUME_PERIOD: 20,
  PRICE_PERIOD: 20
};

// RFI (RSI-Flow Imbalance) Score Calculation
export const calculateRFI = (closes, volumes = null, highs = null, lows = null) => {
  if (closes.length < RFI_PARAMETERS.RSI_PERIOD + 1) return null;
  
  // Calculate RSI Flow
  const rsi = calculateRSI(closes, RFI_PARAMETERS.RSI_PERIOD);
  if (rsi === null) return null;
  
  // RSI Flow: How far RSI is from 50 (neutral)
  const rsiFlow = Math.abs(rsi - 50) / 50; // Normalize to 0-1
  
  // Volume Flow (if volumes available)
  let volumeFlow = 0.5; // Default neutral
  if (volumes && volumes.length >= RFI_PARAMETERS.VOLUME_PERIOD) {
    const recentVolume = calculateSMA(volumes.slice(-RFI_PARAMETERS.VOLUME_PERIOD), RFI_PARAMETERS.VOLUME_PERIOD);
    const avgVolume = calculateSMA(volumes, volumes.length);
    volumeFlow = recentVolume > avgVolume ? 0.8 : 0.2;
  }
  
  // Price Flow (if highs/lows available)
  let priceFlow = 0.5; // Default neutral
  if (highs && lows && highs.length >= RFI_PARAMETERS.PRICE_PERIOD) {
    const recentHigh = Math.max(...highs.slice(-RFI_PARAMETERS.PRICE_PERIOD));
    const recentLow = Math.min(...lows.slice(-RFI_PARAMETERS.PRICE_PERIOD));
    const priceRange = recentHigh - recentLow;
    const currentPrice = closes[closes.length - 1];
    const pricePosition = (currentPrice - recentLow) / priceRange;
    priceFlow = pricePosition > 0.7 ? 0.8 : pricePosition < 0.3 ? 0.2 : 0.5;
  }
  
  // Calculate RFI Score (weighted combination)
  const rfiScore = (rsiFlow * 0.5) + (volumeFlow * 0.3) + (priceFlow * 0.2);
  
  return {
    rfiScore: Math.round(rfiScore * 100) / 100, // Round to 2 decimal places
    rsiFlow: Math.round(rsiFlow * 100) / 100,
    volumeFlow: Math.round(volumeFlow * 100) / 100,
    priceFlow: Math.round(priceFlow * 100) / 100,
    rsi: Math.round(rsi * 100) / 100,
    interpretation: getRFIInterpretation(rfiScore)
  };
};

// RFI Interpretation
export const getRFIInterpretation = (rfiScore) => {
  if (rfiScore >= 0.8) return 'Strong Imbalance';
  if (rfiScore >= 0.6) return 'Moderate Imbalance';
  if (rfiScore >= 0.4) return 'Neutral';
  if (rfiScore >= 0.2) return 'Weak Imbalance';
  return 'Very Weak Imbalance';
};

export const calculateBollingerBands = (closes, period = 20, stdDev = 2) => {
  if (closes.length < period) return null;
  
  const sma = calculateSMA(closes, period);
  if (sma === null) return null;
  
  const slice = closes.slice(-period);
  const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev)
  };
};

// Standard MACD Parameters
export const MACD_PARAMETERS = {
  FAST_PERIOD: 12,   // Fast EMA period
  SLOW_PERIOD: 26,   // Slow EMA period
  SIGNAL_PERIOD: 9   // Signal line EMA period
};

export const calculateMACD = (closes, fastPeriod = MACD_PARAMETERS.FAST_PERIOD, slowPeriod = MACD_PARAMETERS.SLOW_PERIOD, signalPeriod = MACD_PARAMETERS.SIGNAL_PERIOD) => {
  if (closes.length < slowPeriod) return null;
  
  let fastEMA = null;
  let slowEMA = null;
  const macdLine = [];
  
  for (let i = 0; i < closes.length; i++) {
    const slice = closes.slice(0, i + 1);
    fastEMA = calculateEMA(slice, fastPeriod, fastEMA);
    slowEMA = calculateEMA(slice, slowPeriod, slowEMA);
    
    if (fastEMA !== null && slowEMA !== null) {
      macdLine.push(fastEMA - slowEMA);
    }
  }
  
  if (macdLine.length < signalPeriod) return null;
  
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const _histogram = macdLine[macdLine.length - 1] - signalLine; // Unused variable, prefixed with underscore
  
  // Enhanced MACD Analysis
  const currentMACD = macdLine[macdLine.length - 1];
  const previousMACD = macdLine.length > 1 ? macdLine[macdLine.length - 2] : currentMACD;
  const currentSignal = signalLine;
  const previousSignal = macdLine.length > signalPeriod ? calculateEMA(macdLine.slice(0, -1), signalPeriod) : currentSignal;
  
  // Histogram Analysis
  const currentHistogram = currentMACD - currentSignal;
  const previousHistogram = previousMACD - previousSignal;
  const histogramChange = currentHistogram - previousHistogram;
  
  // Signal Analysis
  const macdAboveSignal = currentMACD > currentSignal;
  const macdBelowSignal = currentMACD < currentSignal;
  const macdCrossingUp = currentMACD > currentSignal && previousMACD <= previousSignal;
  const macdCrossingDown = currentMACD < currentSignal && previousMACD >= previousSignal;
  
  // Histogram Momentum
  const histogramIncreasing = histogramChange > 0;
  const histogramDecreasing = histogramChange < 0;
  const histogramDivergence = (macdAboveSignal && histogramDecreasing) || (macdBelowSignal && histogramIncreasing);
  
  return {
    macd: Math.round(currentMACD * 1000000) / 1000000, // Round to 6 decimal places
    signal: Math.round(currentSignal * 1000000) / 1000000,
    histogram: Math.round(currentHistogram * 1000000) / 1000000,
    histogramChange: Math.round(histogramChange * 1000000) / 1000000,
    analysis: {
      macdAboveSignal,
      macdBelowSignal,
      macdCrossingUp,
      macdCrossingDown,
      histogramIncreasing,
      histogramDecreasing,
      histogramDivergence,
      signal: getMACDSignal(macdCrossingUp, macdCrossingDown, histogramIncreasing, histogramDecreasing)
    }
  };
};

// Enhanced MACD Analysis with Signal Detection (Updated to match requirements)
export const calculateMACDSignals = (closes, kLookback = SIGNAL_PARAMETERS.K_LOOKBACK) => {
  if (closes.length < MACD_PARAMETERS.SLOW_PERIOD + kLookback) return null;
  
  let fastEMA = null;
  let slowEMA = null;
  const macdLine = [];
  
  // Calculate MACD line values
  for (let i = 0; i < closes.length; i++) {
    const slice = closes.slice(0, i + 1);
    fastEMA = calculateEMA(slice, MACD_PARAMETERS.FAST_PERIOD, fastEMA);
    slowEMA = calculateEMA(slice, MACD_PARAMETERS.SLOW_PERIOD, slowEMA);
    
    if (fastEMA !== null && slowEMA !== null) {
      macdLine.push(fastEMA - slowEMA);
    }
  }
  
  if (macdLine.length < MACD_PARAMETERS.SIGNAL_PERIOD) return null;
  
  // Calculate signal line values
  const signalLineValues = [];
  let signalEMA = null;
  
  for (let i = 0; i < macdLine.length; i++) {
    const slice = macdLine.slice(0, i + 1);
    signalEMA = calculateEMA(slice, MACD_PARAMETERS.SIGNAL_PERIOD, signalEMA);
    if (signalEMA !== null) {
      signalLineValues.push(signalEMA);
    }
  }
  
  const currentMACD = macdLine[macdLine.length - 1];
  const currentSignal = signalLineValues[signalLineValues.length - 1];
  
  // Determine signal based on requirements
  let signal = 'neutral';
  if (currentMACD > currentSignal && currentMACD > 0) {
    signal = 'buy';
  } else if (currentMACD < currentSignal && currentMACD < 0) {
    signal = 'sell';
  }
  
  // Check for new signals (crosses within last K bars)
  const checkNewSignal = (macdValues, signalValues, kLookback) => {
    if (macdValues.length < kLookback + 1 || signalValues.length < kLookback + 1) return false;
    
    const recentMACD = macdValues.slice(-kLookback - 1);
    const recentSignal = signalValues.slice(-kLookback - 1);
    
    for (let i = 1; i < recentMACD.length; i++) {
      const prevMACD = recentMACD[i - 1];
      const currMACD = recentMACD[i];
      const prevSignal = recentSignal[i - 1];
      const currSignal = recentSignal[i];
      
      // Check for cross above (bullish)
      if (prevMACD <= prevSignal && currMACD > currSignal) return true;
      // Check for cross below (bearish)
      if (prevMACD >= prevSignal && currMACD < currSignal) return true;
    }
    return false;
  };
  
  const newSignal = checkNewSignal(macdLine.slice(-kLookback - 1), signalLineValues.slice(-kLookback - 1), kLookback);
  
  return {
    macd: Math.round(currentMACD * 1000000) / 1000000,
    signal: Math.round(currentSignal * 1000000) / 1000000,
    histogram: Math.round((currentMACD - currentSignal) * 1000000) / 1000000,
    analysis: {
      signal: signal,
      new: newSignal,
      macdAboveSignal: currentMACD > currentSignal,
      macdBelowSignal: currentMACD < currentSignal,
      macdAboveZero: currentMACD > 0,
      macdBelowZero: currentMACD < 0
    }
  };
};

// MACD Signal Interpretation
export const getMACDSignal = (crossingUp, crossingDown, histogramIncreasing, histogramDecreasing) => {
  if (crossingUp && histogramIncreasing) return 'Strong Buy';
  if (crossingUp) return 'Buy';
  if (crossingDown && histogramDecreasing) return 'Strong Sell';
  if (crossingDown) return 'Sell';
  if (histogramIncreasing) return 'Bullish Momentum';
  if (histogramDecreasing) return 'Bearish Momentum';
  return 'Neutral';
};

// ATR (Average True Range) calculation - using existing function

// UT Bot Parameters - Updated to match requirements
export const UT_BOT_PARAMETERS = {
  EMA_LENGTH: 50,           // EMA length for baseline
  ATR_LENGTH: 10,           // ATR calculation period
  ATR_MULTIPLIER: 3.0,      // ATR multiplier for stops
  CONFIRMATION_BARS: 1,     // Optional confirmation bars (off by default)
  MIN_ATR_THRESHOLD: 0.00001 // Minimum ATR threshold for trade validity (lowered for better compatibility)
};

// Enhanced UT Bot Signal Generation with Flip Logic
export const generateUTBotSignal = (bars, _currentPrice) => {
  // More flexible validation - check minimum requirements separately
  if (!bars || bars.length < UT_BOT_PARAMETERS.ATR_LENGTH + 1) {
    console.warn(`❌ UTBOT needs ${UT_BOT_PARAMETERS.ATR_LENGTH + 1} bars for ATR, have ${bars?.length || 0}`);
    return null;
  }
  
  if (bars.length < UT_BOT_PARAMETERS.EMA_LENGTH) {
    console.warn(`❌ UTBOT needs ${UT_BOT_PARAMETERS.EMA_LENGTH} bars for EMA, have ${bars.length}`);
    return null;
  }
  
  // Extract highs, lows, and closes for calculations
  const highs = bars.map(bar => bar.high);
  const lows = bars.map(bar => bar.low);
  const closes = bars.map(bar => bar.close);
  
  // Calculate baseline EMA with error handling
  let baseline;
  try {
    baseline = calculateEMA(closes, UT_BOT_PARAMETERS.EMA_LENGTH);
    if (!baseline || isNaN(baseline)) {
      console.warn('❌ UTBOT baseline EMA calculation failed');
      return null;
    }
  } catch (error) {
    console.error('❌ UTBOT EMA calculation error:', error);
    return null;
  }
  
  // Calculate ATR with error handling
  let atr;
  try {
    atr = calculateATR(highs, lows, closes, UT_BOT_PARAMETERS.ATR_LENGTH);
    if (!atr || isNaN(atr)) {
      console.warn(`❌ UTBOT ATR calculation failed: ${atr}`);
      return null;
    }
    
    // Log ATR for debugging (temporarily remove threshold check)
    if (atr < UT_BOT_PARAMETERS.MIN_ATR_THRESHOLD) {
      console.warn(`⚠️ UTBOT ATR very low: ${atr?.toFixed(8)} (min: ${UT_BOT_PARAMETERS.MIN_ATR_THRESHOLD}) - Proceeding anyway for testing`);
    }
  } catch (error) {
    console.error('❌ UTBOT ATR calculation error:', error);
    return null;
  }
  
  // Calculate stop levels
  const longStop = baseline - (UT_BOT_PARAMETERS.ATR_MULTIPLIER * atr);
  const shortStop = baseline + (UT_BOT_PARAMETERS.ATR_MULTIPLIER * atr);
  
  const currentClose = closes[closes.length - 1];
  
  // Determine current position based on close vs stops
  let currentPosition = 'neutral';
  if (currentClose > shortStop) {
    currentPosition = 'long';
  } else if (currentClose < longStop) {
    currentPosition = 'short';
  }
  
  // Check for flips within last K bars
  const checkForFlip = (closes, longStop, shortStop, kLookback = 3) => {
    if (closes.length < kLookback + 1) return false;
    
    const recentCloses = closes.slice(-kLookback - 1);
    let previousPosition = 'neutral';
    
    for (let i = 0; i < recentCloses.length; i++) {
      const close = recentCloses[i];
      let position = 'neutral';
      
      if (close > shortStop) {
        position = 'long';
      } else if (close < longStop) {
        position = 'short';
      }
      
      if (i > 0 && position !== previousPosition && previousPosition !== 'neutral') {
        return true; // Found a flip
      }
      
      previousPosition = position;
    }
    return false;
  };
  
  const hasFlip = checkForFlip(closes, longStop, shortStop);
  
  // Determine signal based on requirements
  let signal = 'neutral';
  let signalType = 'neutral';
  
  if (currentPosition === 'long' || (currentClose > shortStop)) {
    signal = 'buy';
    signalType = 'long';
  } else if (currentPosition === 'short' || (currentClose < longStop)) {
    signal = 'sell';
    signalType = 'short';
  }
  
  return {
    type: signalType,
    signal: signal,
    baseline: Math.round(baseline * 100000) / 100000,
    atr: Math.round(atr * 100000) / 100000,
    longStop: Math.round(longStop * 100000) / 100000,
    shortStop: Math.round(shortStop * 100000) / 100000,
    currentPosition: currentPosition,
    new: hasFlip,
    confidence: Math.min(atr / UT_BOT_PARAMETERS.MIN_ATR_THRESHOLD, 1.0)
  };
};

export const calculateStochastic = (highs, lows, closes, kPeriod = 14, _dPeriod = 3) => {
  if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) {
    return null;
  }
  
  const recentHighs = highs.slice(-kPeriod);
  const recentLows = lows.slice(-kPeriod);
  const currentClose = closes[closes.length - 1];
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  const kPercent = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  // For %D, we would need multiple %K values to calculate the SMA
  // This is a simplified version
  return {
    k: kPercent,
    d: kPercent // In a full implementation, this would be SMA of %K values
  };
};

export const calculateATR = (highs, lows, closes, period = 14) => {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
    return null;
  }
  
  const trueRanges = [];
  
  for (let i = 1; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  return calculateSMA(trueRanges.slice(-period), period);
};

export const calculatePivotPoints = (high, low, close) => {
  const pivot = (high + low + close) / 3;
  
  return {
    pivot,
    r1: (2 * pivot) - low,
    r2: pivot + (high - low),
    r3: high + (2 * (pivot - low)),
    s1: (2 * pivot) - high,
    s2: pivot - (high - low),
    s3: low - (2 * (high - pivot))
  };
};

export const calculateCurrencyStrength = (pairs, _period = 20) => {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  const strength = {};
  
  // Initialize all currencies with neutral strength
  currencies.forEach(currency => {
    strength[currency] = 50;
  });
  
  let totalMovements = 0;
  
  pairs.forEach(({ symbol, change }) => {
    if (typeof change !== 'number' || isNaN(change)) return;
    
    const base = symbol.substring(0, 3);
    const quote = symbol.substring(3, 6);
    
    if (currencies.includes(base) && currencies.includes(quote)) {
      // Normalize the change (multiply by 1000 for better scaling)
      const normalizedChange = change * 1000;
      
      strength[base] += normalizedChange;
      strength[quote] -= normalizedChange;
      totalMovements++;
    }
  });
  
  if (totalMovements === 0) return strength;
  
  // Normalize to 0-100 scale
  const values = Object.values(strength);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) return strength;
  
  currencies.forEach(currency => {
    strength[currency] = ((strength[currency] - min) / range) * 100;
  });
  
  return strength;
};

// IchimokuClone Parameters - Updated to match requirements
export const ICHIMOKU_PARAMETERS = {
  TENKAN_PERIOD: 9,    // Tenkan-sen period
  KIJUN_PERIOD: 26,    // Kijun-sen period
  SENKOU_B_PERIOD: 52, // Senkou Span B period
  CHIKOU_SHIFT: 26     // Chikou Span shift
};

// Enhanced IchimokuClone Analysis with Decision Priority Logic
export const calculateIchimokuCloneSignals = (bars, kLookback = SIGNAL_PARAMETERS.K_LOOKBACK) => {
  if (!bars || bars.length < ICHIMOKU_PARAMETERS.SENKOU_B_PERIOD + ICHIMOKU_PARAMETERS.CHIKOU_SHIFT) return null;
  
  const highs = bars.map(bar => bar.high);
  const lows = bars.map(bar => bar.low);
  const closes = bars.map(bar => bar.close);
  
  const currentPrice = closes[closes.length - 1];
  
  // Calculate Tenkan-sen (9-period)
  const tenkanHigh = Math.max(...highs.slice(-ICHIMOKU_PARAMETERS.TENKAN_PERIOD));
  const tenkanLow = Math.min(...lows.slice(-ICHIMOKU_PARAMETERS.TENKAN_PERIOD));
  const tenkanSen = (tenkanHigh + tenkanLow) / 2;
  
  // Calculate Kijun-sen (26-period)
  const kijunHigh = Math.max(...highs.slice(-ICHIMOKU_PARAMETERS.KIJUN_PERIOD));
  const kijunLow = Math.min(...lows.slice(-ICHIMOKU_PARAMETERS.KIJUN_PERIOD));
  const kijunSen = (kijunHigh + kijunLow) / 2;
  
  // Calculate Senkou Span A (shifted +26)
  const senkouSpanA = (tenkanSen + kijunSen) / 2;
  
  // Calculate Senkou Span B (52-period, shifted +26)
  const senkouHigh = Math.max(...highs.slice(-ICHIMOKU_PARAMETERS.SENKOU_B_PERIOD));
  const senkouLow = Math.min(...lows.slice(-ICHIMOKU_PARAMETERS.SENKOU_B_PERIOD));
  const senkouSpanB = (senkouHigh + senkouLow) / 2;
  
  // Calculate Chikou Span (close shifted -26)
  const chikouIndex = closes.length - 1 - ICHIMOKU_PARAMETERS.CHIKOU_SHIFT;
  const chikouSpan = chikouIndex >= 0 ? closes[chikouIndex] : null;
  
  // Decision Priority Logic (first hit wins)
  let signal = 'neutral';
  let signalReason = '';
  
  // 1. Price vs Cloud: above = Buy, below = Sell, inside = Neutral
  const cloudTop = Math.max(senkouSpanA, senkouSpanB);
  const cloudBottom = Math.min(senkouSpanA, senkouSpanB);
  
  if (currentPrice > cloudTop) {
    signal = 'buy';
    signalReason = 'price_above_cloud';
  } else if (currentPrice < cloudBottom) {
    signal = 'sell';
    signalReason = 'price_below_cloud';
  } else {
    // 2. Tenkan/Kijun Cross: Tenkan>Kijun = Buy; < = Sell
    if (tenkanSen > kijunSen) {
      signal = 'buy';
      signalReason = 'tenkan_above_kijun';
    } else if (tenkanSen < kijunSen) {
      signal = 'sell';
      signalReason = 'tenkan_below_kijun';
    } else {
      // 3. Cloud Color: SpanA>SpanB = Buy; < = Sell
      if (senkouSpanA > senkouSpanB) {
        signal = 'buy';
        signalReason = 'cloud_bullish';
      } else if (senkouSpanA < senkouSpanB) {
        signal = 'sell';
        signalReason = 'cloud_bearish';
      } else {
        // 4. Chikou vs price (26 bars ago): above = Buy; below = Sell; else Neutral
        if (chikouSpan !== null) {
          const price26BarsAgo = closes[closes.length - 1 - ICHIMOKU_PARAMETERS.CHIKOU_SHIFT];
          if (chikouSpan > price26BarsAgo) {
            signal = 'buy';
            signalReason = 'chikou_above_price';
          } else if (chikouSpan < price26BarsAgo) {
            signal = 'sell';
            signalReason = 'chikou_below_price';
          }
        }
      }
    }
  }
  
  // Check for new signals (Tenkan/Kijun cross or price cloud breakout within last K bars)
  const checkNewSignal = (highs, lows, closes, tenkanSen, kijunSen, cloudTop, cloudBottom, kLookback) => {
    if (closes.length < kLookback + 1) return false;
    
    const recentHighs = highs.slice(-kLookback - 1);
    const recentLows = lows.slice(-kLookback - 1);
    const recentCloses = closes.slice(-kLookback - 1);
    
    for (let i = 1; i < recentCloses.length; i++) {
      // Check for Tenkan/Kijun cross
      const prevTenkanHigh = Math.max(...recentHighs.slice(0, i).slice(-ICHIMOKU_PARAMETERS.TENKAN_PERIOD));
      const prevTenkanLow = Math.min(...recentLows.slice(0, i).slice(-ICHIMOKU_PARAMETERS.TENKAN_PERIOD));
      const prevTenkan = (prevTenkanHigh + prevTenkanLow) / 2;
      
      const prevKijunHigh = Math.max(...recentHighs.slice(0, i).slice(-ICHIMOKU_PARAMETERS.KIJUN_PERIOD));
      const prevKijunLow = Math.min(...recentLows.slice(0, i).slice(-ICHIMOKU_PARAMETERS.KIJUN_PERIOD));
      const prevKijun = (prevKijunHigh + prevKijunLow) / 2;
      
      // Check for cross
      if ((prevTenkan <= prevKijun && tenkanSen > kijunSen) || 
          (prevTenkan >= prevKijun && tenkanSen < kijunSen)) {
        return true;
      }
      
      // Check for price cloud breakout
      const prevClose = recentCloses[i - 1];
      const currClose = recentCloses[i];
      
      if ((prevClose <= cloudTop && currClose > cloudTop) || 
          (prevClose >= cloudBottom && currClose < cloudBottom)) {
        return true;
      }
    }
    return false;
  };
  
  const newSignal = checkNewSignal(highs, lows, closes, tenkanSen, kijunSen, cloudTop, cloudBottom, kLookback);
  
  return {
    tenkanSen: Math.round(tenkanSen * 100000) / 100000,
    kijunSen: Math.round(kijunSen * 100000) / 100000,
    senkouSpanA: Math.round(senkouSpanA * 100000) / 100000,
    senkouSpanB: Math.round(senkouSpanB * 100000) / 100000,
    chikouSpan: chikouSpan ? Math.round(chikouSpan * 100000) / 100000 : null,
    cloudTop: Math.round(cloudTop * 100000) / 100000,
    cloudBottom: Math.round(cloudBottom * 100000) / 100000,
    analysis: {
      signal: signal,
      reason: signalReason,
      new: newSignal,
      priceAboveCloud: currentPrice > cloudTop,
      priceBelowCloud: currentPrice < cloudBottom,
      priceInCloud: currentPrice >= cloudBottom && currentPrice <= cloudTop,
      tenkanAboveKijun: tenkanSen > kijunSen,
      cloudBullish: senkouSpanA > senkouSpanB
    }
  };
};

export const detectPatterns = (ohlcData, patternType = 'doji') => {
  if (ohlcData.length === 0) return false;
  
  const latest = ohlcData[ohlcData.length - 1];
  const { open, high, low, close } = latest;
  
  const bodySize = Math.abs(close - open);
  const upperShadow = high - Math.max(open, close);
  const lowerShadow = Math.min(open, close) - low;
  const totalRange = high - low;
  
  switch (patternType) {
    case 'doji':
      return bodySize <= (totalRange * 0.1);
    
    case 'hammer':
      return (
        lowerShadow >= (bodySize * 2) &&
        upperShadow <= (bodySize * 0.5) &&
        close < open
      );
    
    case 'shooting_star':
      return (
        upperShadow >= (bodySize * 2) &&
        lowerShadow <= (bodySize * 0.5) &&
        close < open
      );
    
    case 'engulfing_bullish':
      if (ohlcData.length < 2) return false;
      const prev = ohlcData[ohlcData.length - 2];
      return (
        prev.close < prev.open && // Previous candle is bearish
        close > open && // Current candle is bullish
        open < prev.close && // Current open below previous close
        close > prev.open // Current close above previous open
      );
    
    case 'engulfing_bearish':
      if (ohlcData.length < 2) return false;
      const prevBull = ohlcData[ohlcData.length - 2];
      return (
        prevBull.close > prevBull.open && // Previous candle is bullish
        close < open && // Current candle is bearish
        open > prevBull.close && // Current open above previous close
        close < prevBull.open // Current close below previous open
      );
    
    default:
      return false;
  }
};
