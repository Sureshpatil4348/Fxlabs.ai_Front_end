// Import technical indicators
import { 
  EMA, 
  RSI, 
  MACD, 
  ATR,
  SMA,
  BollingerBands,
  Stochastic,
  WilliamsR,
  CCI,
  OBV
} from 'technicalindicators';

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(data, period) {
  if (data.length < period) {
    return [];
  }
  
  const closes = data.map(candle => candle.close);
  const ema = EMA.calculate({ values: closes, period });
  
  if (!ema || ema.length === 0) {
    return [];
  }
  
  return data.slice(period - 1).map((candle, index) => ({
    time: candle.time,
    value: ema[index] || 0
  }));
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(data, period = 14) {
  if (data.length < period + 1) {
    return [];
  }
  
  const closes = data.map(candle => candle.close);
  const rsi = RSI.calculate({ values: closes, period });
  
  if (!rsi || rsi.length === 0) {
    return [];
  }
  
  return data.slice(period).map((candle, index) => ({
    time: candle.time,
    value: rsi[index] || 0
  }));
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data, 
  fastPeriod = 12, 
  slowPeriod = 26, 
  signalPeriod = 9
) {
  if (data.length < slowPeriod + signalPeriod) {
    return [];
  }
  
  const closes = data.map(candle => candle.close);
  const macd = MACD.calculate({ 
    values: closes, 
    fastPeriod, 
    slowPeriod, 
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  
  if (!macd || macd.length === 0) {
    return [];
  }
  
  return data.slice(slowPeriod - 1).map((candle, index) => ({
    time: candle.time,
    macd: macd[index]?.MACD || 0,
    signal: macd[index]?.signal || 0,
    histogram: macd[index]?.histogram || 0
  }));
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(data, period = 14) {
  if (data.length < period + 1) {
    return [];
  }
  
  const input = data.map(candle => ({
    high: candle.high,
    low: candle.low,
    close: candle.close
  }));
  
  const atr = ATR.calculate({ 
    high: input.map(i => i.high),
    low: input.map(i => i.low),
    close: input.map(i => i.close),
    period 
  });
  
  if (!atr || atr.length === 0) {
    return [];
  }
  
  // Create result array with all candles, filling initial values with first ATR value
  const result = [];
  const firstATR = atr[0] || 0;
  
  // Fill initial period with first ATR value for continuity
  for (let i = 0; i < period; i++) {
    result.push({
      time: data[i].time,
      atr: firstATR
    });
  }
  
  // Add calculated ATR values
  for (let i = 0; i < atr.length; i++) {
    result.push({
      time: data[i + period].time,
      atr: atr[i] || 0
    });
  }
  
  return result;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
export function calculateSMA(data, period) {
  if (data.length < period) {
    return [];
  }
  
  const closes = data.map(candle => candle.close);
  const sma = SMA.calculate({ values: closes, period });
  
  if (!sma || sma.length === 0) {
    return [];
  }
  
  return data.slice(period - 1).map((candle, index) => ({
    time: candle.time,
    value: sma[index] || 0
  }));
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(data, period = 20, stdDev = 2) {
  if (data.length < period) {
    return [];
  }
  
  const closes = data.map(candle => candle.close);
  const bb = BollingerBands.calculate({ values: closes, period, stdDev });
  
  if (!bb || bb.length === 0) {
    return [];
  }
  
  return data.slice(period - 1).map((candle, index) => ({
    time: candle.time,
    upper: bb[index]?.upper || 0,
    middle: bb[index]?.middle || 0,
    lower: bb[index]?.lower || 0
  }));
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(data, kPeriod = 14, dPeriod = 3) {
  if (data.length < kPeriod) {
    return [];
  }
  
  const input = data.map(candle => ({
    high: candle.high,
    low: candle.low,
    close: candle.close
  }));
  
  const stoch = Stochastic.calculate({ 
    high: input.map(i => i.high),
    low: input.map(i => i.low),
    close: input.map(i => i.close),
    period: kPeriod,
    signalPeriod: dPeriod
  });
  
  if (!stoch || stoch.length === 0) {
    return [];
  }
  
  return data.slice(kPeriod - 1).map((candle, index) => ({
    time: candle.time,
    k: stoch[index]?.k || 0,
    d: stoch[index]?.d || 0
  }));
}

/**
 * Calculate Williams %R
 */
export function calculateWilliamsR(data, period = 14) {
  if (data.length < period) {
    return [];
  }
  
  const input = data.map(candle => ({
    high: candle.high,
    low: candle.low,
    close: candle.close
  }));
  
  const williams = WilliamsR.calculate({ 
    high: input.map(i => i.high),
    low: input.map(i => i.low),
    close: input.map(i => i.close),
    period 
  });
  
  if (!williams || williams.length === 0) {
    return [];
  }
  
  return data.slice(period - 1).map((candle, index) => ({
    time: candle.time,
    value: williams[index] || 0
  }));
}

/**
 * Calculate CCI (Commodity Channel Index)
 */
export function calculateCCI(data, period = 20) {
  if (data.length < period) {
    return [];
  }
  
  const input = data.map(candle => ({
    high: candle.high,
    low: candle.low,
    close: candle.close
  }));
  
  const cci = CCI.calculate({ 
    high: input.map(i => i.high),
    low: input.map(i => i.low),
    close: input.map(i => i.close),
    period 
  });
  
  if (!cci || cci.length === 0) {
    return [];
  }
  
  return data.slice(period - 1).map((candle, index) => ({
    time: candle.time,
    value: cci[index] || 0
  }));
}

/**
 * Calculate OBV (On-Balance Volume)
 */
export function calculateOBV(data) {
  if (data.length < 2) {
    return [];
  }
  
  const closes = data.map(candle => candle.close);
  const volumes = data.map(candle => candle.volume);
  const obv = OBV.calculate({ close: closes, volume: volumes });
  
  if (!obv || obv.length === 0) {
    return [];
  }
  
  return data.slice(1).map((candle, index) => ({
    time: candle.time,
    value: obv[index] || 0
  }));
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(data) {
  if (data.length === 0) {
    return [];
  }
  
  let cumulativeVolume = 0;
  let cumulativeVolumePrice = 0;
  
  return data.map((candle) => {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volumePrice = typicalPrice * candle.volume;
    
    cumulativeVolume += candle.volume;
    cumulativeVolumePrice += volumePrice;
    
    return {
      time: candle.time,
      value: cumulativeVolume > 0 ? cumulativeVolumePrice / cumulativeVolume : 0
    };
  });
}

/**
 * Calculate 24h Change
 */
export function calculateChange24h(data) {
  if (data.length === 0) {
    return [];
  }
  
  // For simplicity, we'll calculate change from 24 periods ago (assuming 1h timeframe)
  const lookbackPeriod = Math.min(24, data.length - 1);
  
  return data.map((candle, index) => {
    if (index < lookbackPeriod) {
      return {
        time: candle.time,
        change: 0,
        changePercent: 0
      };
    }
    
    const previousPrice = data[index - lookbackPeriod].close;
    const change = candle.close - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    return {
      time: candle.time,
      change,
      changePercent
    };
  });
}

/**
 * Calculate all indicators for given candle data
 */
export function calculateAllIndicators(data) {
  return {
    ema20: calculateEMA(data, 20),
    ema200: calculateEMA(data, 200),
    rsi: calculateRSI(data, 14),
    macd: calculateMACD(data, 12, 26, 9),
    atr: calculateATR(data, 14),
    sma50: calculateSMA(data, 50),
    sma100: calculateSMA(data, 100),
    bollinger: calculateBollingerBands(data, 20, 2),
    stoch: calculateStochastic(data, 14, 3),
    williams: calculateWilliamsR(data, 14),
    cci: calculateCCI(data, 20),
    obv: calculateOBV(data),
    vwap: calculateVWAP(data),
    change24h: calculateChange24h(data)
  };
}

/**
 * Format indicator data for TradingView charts
 */
export function formatIndicatorData(indicatorData) {
  return indicatorData.map(item => ({
    time: item.time,
    value: item.value
  }));
}

/**
 * Format MACD data for TradingView charts
 */
export function formatMACDData(macdData) {
  return {
    macd: macdData.map(item => ({
      time: item.time,
      value: item.macd
    })),
    signal: macdData.map(item => ({
      time: item.time,
      value: item.signal
    })),
    histogram: macdData.map(item => ({
      time: item.time,
      value: item.histogram
    }))
  };
}

/**
 * Format RSI data for TradingView charts
 */
export function formatRSIData(rsiData) {
  return rsiData.map(item => ({
    time: item.time,
    value: item.value
  }));
}

/**
 * Format ATR data for TradingView charts
 */
export function formatATRData(atrData) {
  return atrData.map(item => ({
    time: item.time,
    value: item.atr
  }));
}
