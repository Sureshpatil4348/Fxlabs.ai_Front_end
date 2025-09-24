/**
 * Data & Formulas Analysis - Usage Examples
 * 
 * This file demonstrates how to use all the enhanced technical analysis functions
 * with proper Wilder's RSI, RFI, Centered RSI, and Enhanced MACD
 */

import {
  calculateRSI,
  calculateCenteredRSI,
  calculateRFI,
  calculateMACD,
  calculateMultipleEMAs,
  EMA_PERIODS,
  MACD_PARAMETERS,
  RFI_PARAMETERS
} from './calculations';

/**
 * Example: Complete Technical Analysis for a Symbol
 * 
 * @param {Array} bars - OHLC bars data
 * @param {Array} volumes - Volume data (optional)
 * @returns {Object} Complete technical analysis
 */
export const performCompleteAnalysis = (bars, volumes = null) => {
  if (!bars || bars.length < 50) {
    return { error: 'Insufficient data for analysis' };
  }

  // Extract data arrays
  const closes = bars.map(bar => bar.close);
  // Use closed candles only for RSI-based metrics
  const closesClosed = closes.length > 15 ? closes.slice(0, -1) : closes;
  const highs = bars.map(bar => bar.high);
  const lows = bars.map(bar => bar.low);
  const currentPrice = closes[closes.length - 1];

  // 1. Wilder's RSI Analysis
  const rsi = calculateRSI(closesClosed, 14);
  const rsiAnalysis = {
    value: rsi,
    interpretation: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
    strength: rsi > 80 ? 'Very Strong' : rsi > 60 ? 'Strong' : rsi < 40 ? 'Weak' : 'Moderate'
  };

  // 2. Centered RSI (cRSI) Analysis
  const cRSI = calculateCenteredRSI(closesClosed, 14);
  const cRSIAnalysis = {
    value: cRSI,
    interpretation: cRSI > 20 ? 'Strong Bullish' : cRSI < -20 ? 'Strong Bearish' : 'Neutral',
    trend: cRSI > 0 ? 'Bullish' : 'Bearish'
  };

  // 3. RFI (RSI-Flow Imbalance) Analysis
  const rfi = calculateRFI(closesClosed, volumes, highs, lows);
  const rfiAnalysis = {
    score: rfi?.rfiScore || 0,
    interpretation: rfi?.interpretation || 'No Data',
    components: {
      rsiFlow: rfi?.rsiFlow || 0,
      volumeFlow: rfi?.volumeFlow || 0,
      priceFlow: rfi?.priceFlow || 0
    }
  };

  // 4. Enhanced MACD Analysis
  const macd = calculateMACD(closes);
  const macdAnalysis = {
    macd: macd?.macd || 0,
    signal: macd?.signal || 0,
    histogram: macd?.histogram || 0,
    histogramChange: macd?.histogramChange || 0,
    analysis: macd?.analysis || {},
    signalType: macd?.analysis?.signal || 'Neutral'
  };

  // 5. Multiple EMA Analysis
  const emaData = calculateMultipleEMAs(closes);
  const emaAnalysis = {
    ema20: emaData?.ema20 || 0,
    ema50: emaData?.ema50 || 0,
    ema200: emaData?.ema200 || 0,
    trend: emaData?.trend || 'sideways',
    alignment: getEMAAlignment(emaData)
  };

  // 6. Overall Signal Generation
  const overallSignal = generateOverallSignal(rsiAnalysis, macdAnalysis, emaAnalysis, rfiAnalysis);

  return {
    timestamp: new Date().toISOString(),
    currentPrice,
    rsi: rsiAnalysis,
    cRSI: cRSIAnalysis,
    rfi: rfiAnalysis,
    macd: macdAnalysis,
    ema: emaAnalysis,
    overallSignal,
    parameters: {
      rsiPeriod: 14,
      macdParameters: MACD_PARAMETERS,
      emaParameters: EMA_PERIODS,
      rfiParameters: RFI_PARAMETERS
    }
  };
};

/**
 * Helper function to determine EMA alignment
 */
const getEMAAlignment = (emaData) => {
  if (!emaData) return 'No Data';
  
  const { ema20, ema50, ema200 } = emaData;
  
  if (ema20 > ema50 && ema50 > ema200) return 'Perfect Bullish Alignment';
  if (ema20 < ema50 && ema50 < ema200) return 'Perfect Bearish Alignment';
  if (ema20 > ema50) return 'Short-term Bullish';
  if (ema20 < ema50) return 'Short-term Bearish';
  return 'Mixed Signals';
};

/**
 * Generate overall trading signal based on all indicators
 */
const generateOverallSignal = (rsi, macd, ema, rfi) => {
  let bullishSignals = 0;
  let bearishSignals = 0;
  let neutralSignals = 0;

  // RSI Signal
  if (rsi.value < 30) bullishSignals++;
  else if (rsi.value > 70) bearishSignals++;
  else neutralSignals++;

  // MACD Signal
  if (macd.signalType.includes('Buy')) bullishSignals++;
  else if (macd.signalType.includes('Sell')) bearishSignals++;
  else neutralSignals++;

  // EMA Signal
  if (ema.trend === 'bullish') bullishSignals++;
  else if (ema.trend === 'bearish') bearishSignals++;
  else neutralSignals++;

  // RFI Signal
  if (rfi.score > 0.6) {
    if (rfi.components.rsiFlow > 0.5) bullishSignals++;
    else bearishSignals++;
  } else neutralSignals++;

  // Determine overall signal
  const totalSignals = bullishSignals + bearishSignals + neutralSignals;
  const bullishRatio = bullishSignals / totalSignals;
  const bearishRatio = bearishSignals / totalSignals;

  if (bullishRatio >= 0.6) return 'Strong Buy';
  if (bullishRatio >= 0.4) return 'Buy';
  if (bearishRatio >= 0.6) return 'Strong Sell';
  if (bearishRatio >= 0.4) return 'Sell';
  return 'Neutral';
};

/**
 * Example usage in a React component or service
 */
export const exampleUsage = () => {
  // Sample OHLC data
  const sampleBars = [
    { open: 1.2345, high: 1.2350, low: 1.2340, close: 1.2348 },
    { open: 1.2348, high: 1.2355, low: 1.2345, close: 1.2352 },
    // ... more bars
  ];

  // Sample volume data
  const sampleVolumes = [1000, 1200, 1100, 1300, 1400];

  // Perform complete analysis
  const analysis = performCompleteAnalysis(sampleBars, sampleVolumes);

  // eslint-disable-next-line no-console
  console.log('Complete Technical Analysis:', analysis);

  return analysis;
};

/**
 * Real-time analysis function for live data
 */
export const performRealTimeAnalysis = (latestBar, historicalBars, volumes = null) => {
  // Add latest bar to historical data
  const allBars = [...historicalBars, latestBar];
  
  // Perform analysis
  const analysis = performCompleteAnalysis(allBars, volumes);
  
  // Add real-time specific data
  analysis.realTime = {
    timestamp: new Date().toISOString(),
    latestPrice: latestBar.close,
    priceChange: latestBar.close - historicalBars[historicalBars.length - 1].close,
    priceChangePercent: ((latestBar.close - historicalBars[historicalBars.length - 1].close) / historicalBars[historicalBars.length - 1].close) * 100
  };

  return analysis;
};
