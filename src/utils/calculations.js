// Mathematical calculations for technical analysis

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

// Standard EMA Parameters
export const EMA_PERIODS = {
  SHORT: 20,   // Short-term trend
  MEDIUM: 50,  // Medium-term trend
  LONG: 200    // Long-term trend
};

// Calculate multiple EMAs for trend analysis
export const calculateMultipleEMAs = (closes) => {
  if (closes.length < EMA_PERIODS.LONG) return null;
  
  const _emas = {}; // Unused variable, prefixed with underscore
  const ema20 = [];
  const ema50 = [];
  const ema200 = [];
  
  // Calculate EMAs for each period
  for (let i = 0; i < closes.length; i++) {
    const dataSlice = closes.slice(0, i + 1);
    
    if (i >= EMA_PERIODS.SHORT - 1) {
      ema20.push(calculateEMA(dataSlice, EMA_PERIODS.SHORT, ema20[ema20.length - 1]));
    }
    
    if (i >= EMA_PERIODS.MEDIUM - 1) {
      ema50.push(calculateEMA(dataSlice, EMA_PERIODS.MEDIUM, ema50[ema50.length - 1]));
    }
    
    if (i >= EMA_PERIODS.LONG - 1) {
      ema200.push(calculateEMA(dataSlice, EMA_PERIODS.LONG, ema200[ema200.length - 1]));
    }
  }
  
  return {
    ema20: ema20[ema20.length - 1],
    ema50: ema50[ema50.length - 1],
    ema200: ema200[ema200.length - 1],
    trend: getEMATrend(ema20[ema20.length - 1], ema50[ema50.length - 1], ema200[ema200.length - 1])
  };
};

// Determine trend based on EMA alignment
export const getEMATrend = (ema20, ema50, ema200) => {
  if (ema20 > ema50 && ema50 > ema200) return 'bullish';
  if (ema20 < ema50 && ema50 < ema200) return 'bearish';
  return 'sideways';
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

// UT Bot Parameters
export const UT_BOT_PARAMETERS = {
  ATR_PERIOD: 14,           // ATR calculation period
  ATR_MULTIPLIER: 2.0,      // ATR multiplier for stop loss
  RISK_REWARD_RATIO: 2.0,   // Risk:Reward ratio
  MAX_RISK_PERCENT: 2.0,    // Maximum risk per trade (% of account)
  MIN_ATR_THRESHOLD: 0.0001 // Minimum ATR threshold for trade validity
};

// UT Bot Signal Generation
export const generateUTBotSignal = (bars, currentPrice) => {
  if (!bars || bars.length < UT_BOT_PARAMETERS.ATR_PERIOD + 1) return null;
  
  // Extract highs, lows, and closes for ATR calculation
  const highs = bars.map(bar => bar.high);
  const lows = bars.map(bar => bar.low);
  const closes = bars.map(bar => bar.close);
  
  // Calculate ATR using existing function
  const atr = calculateATR(highs, lows, closes, UT_BOT_PARAMETERS.ATR_PERIOD);
  if (!atr) return null;
  
  const latestBar = bars[bars.length - 1];
  const previousBar = bars[bars.length - 2];
  
  // Calculate ATR-based levels
  const atrStopLoss = atr * UT_BOT_PARAMETERS.ATR_MULTIPLIER;
  const atrTakeProfit = atrStopLoss * UT_BOT_PARAMETERS.RISK_REWARD_RATIO;
  
  // Check for breakout conditions
  const isBullishBreakout = latestBar.close > previousBar.high;
  const isBearishBreakout = latestBar.close < previousBar.low;
  
  // Check ATR threshold
  const isValidATR = atr >= UT_BOT_PARAMETERS.MIN_ATR_THRESHOLD;
  
  if (!isValidATR) return null;
  
  if (isBullishBreakout) {
    return {
      type: 'buy',
      entry: currentPrice,
      stopLoss: currentPrice - atrStopLoss,
      takeProfit: currentPrice + atrTakeProfit,
      atr: atr,
      riskReward: UT_BOT_PARAMETERS.RISK_REWARD_RATIO,
      confidence: Math.min(atr / UT_BOT_PARAMETERS.MIN_ATR_THRESHOLD, 1.0)
    };
  }
  
  if (isBearishBreakout) {
    return {
      type: 'sell',
      entry: currentPrice,
      stopLoss: currentPrice + atrStopLoss,
      takeProfit: currentPrice - atrTakeProfit,
      atr: atr,
      riskReward: UT_BOT_PARAMETERS.RISK_REWARD_RATIO,
      confidence: Math.min(atr / UT_BOT_PARAMETERS.MIN_ATR_THRESHOLD, 1.0)
    };
  }
  
  return null;
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
