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

  // Calculate RSI using smoothed averages for remaining periods
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
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

export const calculateMACD = (closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
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
  const histogram = macdLine[macdLine.length - 1] - signalLine;
  
  return {
    macd: macdLine[macdLine.length - 1],
    signal: signalLine,
    histogram
  };
};

export const calculateStochastic = (highs, lows, closes, kPeriod = 14, dPeriod = 3) => {
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

export const calculateCurrencyStrength = (pairs, period = 20) => {
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
