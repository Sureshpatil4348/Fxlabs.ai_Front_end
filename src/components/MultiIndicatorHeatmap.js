import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import userStateService from '../services/userStateService';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { 
  calculateEMASignals,
  calculateMACDSignals,
  calculateRSISignals,
  generateUTBotSignal,
  calculateIchimokuCloneSignals,
  isQuietMarket,
  QUIET_MARKET_PARAMETERS
} from '../utils/calculations';

// Ichimoku Clone calculation (simplified version) - keeping for potential future use
// const calculateIchimokuClone = (bars) => {
//   if (!bars || bars.length < 26) return null;
//   
//   const highs = bars.map(bar => bar.high);
//   const lows = bars.map(bar => bar.low);
//   const closes = bars.map(bar => bar.close);
//   
//   // Tenkan-sen (9-period)
//   const tenkanHigh = Math.max(...highs.slice(-9));
//   const tenkanLow = Math.min(...lows.slice(-9));
//   const tenkanSen = (tenkanHigh + tenkanLow) / 2;
//   
//   // Kijun-sen (26-period)
//   const kijunHigh = Math.max(...highs.slice(-26));
//   const kijunLow = Math.min(...lows.slice(-26));
//   const kijunSen = (kijunHigh + kijunLow) / 2;
//   
//   // Senkou Span A (leading span A)
//   const senkouSpanA = (tenkanSen + kijunSen) / 2;
//   
//   // Senkou Span B (leading span B) - 52-period
//   const senkouHigh = Math.max(...highs.slice(-52));
//   const senkouLow = Math.min(...lows.slice(-52));
//   const senkouSpanB = (senkouHigh + senkouLow) / 2;
//   
//   const currentPrice = closes[closes.length - 1];
//   
//   // Signal determination
//   let signal = 'neutral';
//   if (currentPrice > senkouSpanA && currentPrice > senkouSpanB && tenkanSen > kijunSen) {
//     signal = 'bullish';
//   } else if (currentPrice < senkouSpanA && currentPrice < senkouSpanB && tenkanSen < kijunSen) {
//     signal = 'bearish';
//   }
//   
//   return {
//     tenkanSen,
//     kijunSen,
//     senkouSpanA,
//     senkouSpanB,
//     signal,
//     cloudTop: Math.max(senkouSpanA, senkouSpanB),
//     cloudBottom: Math.min(senkouSpanA, senkouSpanB)
//   };
// };

// Trading Style Timeframe Weights (sum to 1.0 for each style)
const TRADING_STYLE_WEIGHTS = {
  scalper: {
    '5M': 0.30,
    '15M': 0.30,
    '30M': 0.20,
    '1H': 0.15,
    '4H': 0.05,
    '1D': 0.00
  },
  dayTrader: {
    '5M': 0.10,
    '15M': 0.25,
    '30M': 0.25,
    '1H': 0.25,
    '4H': 0.10,
    '1D': 0.05
  },
  swingTrader: {
    '5M': 0.00,
    '15M': 0.00,
    '30M': 0.10,
    '1H': 0.25,
    '4H': 0.35,
    '1D': 0.30
  }
};

// Default trading style
const DEFAULT_TRADING_STYLE = 'dayTrader';

// Indicator Weights (sum to 1.0 for each option)
const INDICATOR_WEIGHTS = {
  equal: {
    EMA21: 0.1429,
    EMA50: 0.1429,
    EMA200: 0.1429,
    MACD: 0.1429,
    RSI: 0.1429,
    UTBOT: 0.1429,
    IchimokuClone: 0.1429
  },
  trendTilted: {
    EMA21: 0.10,
    EMA50: 0.10,
    EMA200: 0.15,
    MACD: 0.15,
    RSI: 0.10,
    UTBOT: 0.15,
    IchimokuClone: 0.25
  }
};

// Default indicator weight option
const DEFAULT_INDICATOR_WEIGHT = 'equal';

// Major Currency Pairs
const MAJOR_CURRENCY_PAIRS = [
  { value: 'EURUSDm', label: 'EUR/USD', flag: '🇪🇺🇺🇸' },
  { value: 'GBPUSDm', label: 'GBP/USD', flag: '🇬🇧🇺🇸' },
  { value: 'USDJPYm', label: 'USD/JPY', flag: '🇺🇸🇯🇵' },
  { value: 'USDCHFm', label: 'USD/CHF', flag: '🇺🇸🇨🇭' },
  { value: 'AUDUSDm', label: 'AUD/USD', flag: '🇦🇺🇺🇸' },
  { value: 'USDCADm', label: 'USD/CAD', flag: '🇺🇸🇨🇦' },
  { value: 'NZDUSDm', label: 'NZD/USD', flag: '🇳🇿🇺🇸' },
  { value: 'EURGBPm', label: 'EUR/GBP', flag: '🇪🇺🇬🇧' },
  { value: 'EURJPYm', label: 'EUR/JPY', flag: '🇪🇺🇯🇵' },
  { value: 'GBPJPYm', label: 'GBP/JPY', flag: '🇬🇧🇯🇵' }
];

// Per-Cell Scoring Function with New-Signal Boost, Quiet-Market Safety, and Clamping
const getIndicatorScore = (indicator, value, signal, isNew = false, isQuietMarket = false) => {
  let baseScore = 0;
  
  // Convert signal to numeric score: Buy = +1, Sell = -1, Neutral = 0
  switch (signal) {
    case 'buy':
      baseScore = 1;
      break;
    case 'sell':
      baseScore = -1;
      break;
    case 'neutral':
    default:
      baseScore = 0;
      break;
  }
  
  // New-signal boost: add ±0.25 in the direction of the signal
  if (isNew && baseScore !== 0) {
    const boost = baseScore > 0 ? 0.25 : -0.25;
    baseScore += boost;
  }
  
  // Quiet-Market Safety: halve MACD and UTBOT scores when ATR is extremely low
  if (isQuietMarket && (indicator === 'MACD' || indicator === 'UTBOT')) {
    baseScore *= QUIET_MARKET_PARAMETERS.QUIET_MARKET_MULTIPLIER;
  }
  
  // Clamp per-cell score to [-1.25, +1.25]
  baseScore = Math.max(-1.25, Math.min(1.25, baseScore));
  
  return baseScore;
};

// Calculate final score using exact aggregation formula
// Raw aggregate: Σ over timeframes Σ over indicators [ S(tf, ind) × W_tf(tf) × W_ind(ind) ]
// Final Score = 100 × ( Raw / 1.25 )
// Buy Now % = (Final Score + 100) / 2
const calculateFinalScore = (scores, tradingStyle = DEFAULT_TRADING_STYLE, indicatorWeight = DEFAULT_INDICATOR_WEIGHT) => {
  const timeframeWeights = TRADING_STYLE_WEIGHTS[tradingStyle] || TRADING_STYLE_WEIGHTS[DEFAULT_TRADING_STYLE];
  const indicatorWeights = INDICATOR_WEIGHTS[indicatorWeight] || INDICATOR_WEIGHTS[DEFAULT_INDICATOR_WEIGHT];
  
  let rawAggregate = 0;
  let totalCells = 0;
  let newSignalCount = 0;
  let positiveNewSignals = 0;
  
  // Calculate raw aggregate: Σ over timeframes Σ over indicators [ S(tf, ind) × W_tf(tf) × W_ind(ind) ]
  Object.entries(scores).forEach(([timeframe, timeframeScores]) => {
    const timeframeWeight = timeframeWeights[timeframe] || 0;
    
    Object.entries(timeframeScores).forEach(([indicator, score]) => {
      const indicatorWeight = indicatorWeights[indicator] || 0;
      
      // S(tf, ind) × W_tf(tf) × W_ind(ind)
      rawAggregate += score * timeframeWeight * indicatorWeight;
      totalCells++;
      
      // Track new signals for boost badge
      if (Math.abs(score) > 1.0) { // New signal (score > 1.0 or < -1.0)
        newSignalCount++;
        if (score > 0) {
          positiveNewSignals++;
        }
      }
    });
  });
  
  // Normalize to human-readable -100...+100
  // Final Score = 100 × ( Raw / 1.25 )
  const finalScore = 100 * (rawAggregate / 1.25);
  
  // Buy Now % = (Final Score + 100) / 2
  const buyNowPercent = (finalScore + 100) / 2;
  const sellNowPercent = 100 - buyNowPercent;
  
  // Check for new signal boost (≥25% of all positive cells are "NEW")
  const newSignalBoost = totalCells > 0 && (positiveNewSignals / totalCells) >= 0.25;
  
    // Enhanced debug logging with detailed breakdown (disabled to avoid lint warnings)
    // console.group('🎯 Final Score Calculation');
    // console.log('📊 Raw Data:', {
    //   rawAggregate: rawAggregate.toFixed(4),
    //   finalScore,
    //   tradingStyle,
    //   indicatorWeight
    // });
    // 
    // console.log('📈 Results:', {
    //   buyNowPercent,
    //   sellNowPercent,
    //   zone: finalScore >= 25 ? '🟢 BUY' : finalScore <= -25 ? '🔴 SELL' : '🟡 WAIT'
    // });
    // 
    // console.log('🆕 Signal Analysis:', {
    //   totalCells,
    //   newSignalCount,
    //   positiveNewSignals,
    //   newSignalBoost,
    //   boostThreshold: '25% of positive cells must be NEW'
    // });
    // 
    // console.groupEnd();
  
  return {
    finalScore: Math.round(finalScore),
    buyNowPercent: Math.round(buyNowPercent),
    sellNowPercent: Math.round(sellNowPercent),
    newSignalBoost,
    rawAggregate,
    totalCells,
    newSignalCount,
    positiveNewSignals
  };
};

const MultiIndicatorHeatmap = ({ selectedSymbol = 'EURUSDm' }) => {
  // const [selectedTimeframe, setSelectedTimeframe] = useState('1H'); // Unused for now
  const [showNewSignals, setShowNewSignals] = useState(true);
  const [tradingStyle, setTradingStyle] = useState('scalper');
  const [indicatorWeight, setIndicatorWeight] = useState('equal');
  const [currentSymbol, setCurrentSymbol] = useState(selectedSymbol);
  
  // Local settings state for persistence
  const [localSettings, setLocalSettings] = useState({
    symbol: selectedSymbol,
    tradingStyle: 'scalper',
    indicatorWeight: 'equal',
    showNewSignals: true
  });
  
  const { 
    ohlcData, 
    // rsiData, // Unused for now
    // settings, // Unused for now
    timeframes,
    isConnected,
    autoSubscribeToMajorPairs,
    connect
  } = useRSITrackerStore();
  
  // Add this state
const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await userStateService.getUserDashboardSettings();
        if (savedSettings.multiIndicatorHeatmap) {
          const { symbol, tradingStyle, indicatorWeight, showNewSignals } = savedSettings.multiIndicatorHeatmap;
          
          // Update local settings state
          setLocalSettings({
            symbol: symbol || selectedSymbol,
            tradingStyle: tradingStyle || 'scalper',
            indicatorWeight: indicatorWeight || 'equal',
            showNewSignals: showNewSignals !== undefined ? showNewSignals : true
          });

          // Update component state
          setCurrentSymbol(symbol || selectedSymbol);
          setTradingStyle(tradingStyle || 'scalper');
          setIndicatorWeight(indicatorWeight || 'equal');
          setShowNewSignals(showNewSignals !== undefined ? showNewSignals : true);
        }
      } catch (error) {
        // console.error('❌ Failed to load Multi-Indicator Heatmap settings:', error);
      }
    };

    loadSettings();
  }, [selectedSymbol]);

  // Save settings to database
  const saveSettings = async (newSettings) => {
    try {
      const updatedSettings = {
        ...localSettings,
        ...newSettings
      };
      
      setLocalSettings(updatedSettings);
      
      // Persist to database
      await userStateService.updateUserDashboardSettings({
        multiIndicatorHeatmap: updatedSettings
      });
      
      // console.log('✅ Multi-Indicator Heatmap settings saved:', updatedSettings);
    } catch (error) {
      // console.error('❌ Failed to save Multi-Indicator Heatmap settings:', error);
    }
  };

  // Handle symbol change with persistence
  const handleSymbolChange = async (symbol) => {
    setCurrentSymbol(symbol);
    await saveSettings({ symbol });
  };

  // Handle trading style change with persistence
  const handleTradingStyleChange = async (style) => {
    setTradingStyle(style);
    await saveSettings({ tradingStyle: style });
  };

  // Handle indicator weight change with persistence
  const _handleIndicatorWeightChange = async (weight) => {
    setIndicatorWeight(weight);
    await saveSettings({ indicatorWeight: weight });
  };

  // Handle show new signals change with persistence
  const _handleShowNewSignalsChange = async (show) => {
    setShowNewSignals(show);
    await saveSettings({ showNewSignals: show });
  };

// Enhanced connection and auto-subscription with better logging
useEffect(() => {
  if (hasAutoSubscribed) return;

  // First, try to connect if not connected
  if (!isConnected) {
    // console.log('🔌 RSI Tracker not connected, attempting to connect...');
    connect();
    return; // Exit early, let the connection effect handle subscription
  }

  // If connected, auto-subscribe immediately
  // console.group('🔗 Auto-Subscription Process');
  // console.log('✅ RSI Tracker connected, starting auto-subscription...');
  
  // const availableSymbols = useRSITrackerStore.getState().settings.autoSubscribeSymbols;
  // console.log('📈 Available symbols for subscription:', availableSymbols?.length || 0);
  
  autoSubscribeToMajorPairs();
  setHasAutoSubscribed(true);
  
  // Check subscriptions after a short delay with enhanced feedback
  setTimeout(() => {
    const currentSubscriptions = Array.from(useRSITrackerStore.getState().subscriptions.keys());
    // const currentData = useRSITrackerStore.getState().ohlcData;
    
    // console.log('✅ Subscriptions completed:', {
    //   subscribedCount: currentSubscriptions.length,
    //   subscriptions: currentSubscriptions.slice(0, 5), // Show first 5
    //   dataReceived: currentData.size,
    //   currentSymbolSubscribed: currentSubscriptions.includes(currentSymbol),
    //   currentSymbolHasData: currentData.has(currentSymbol)
    // });
    
    if (!currentSubscriptions.includes(currentSymbol)) {
      // console.warn('⚠️ Current symbol not in subscriptions:', currentSymbol);
    }
    
    // console.groupEnd();
  }, 1500); // Increased delay for better data collection
}, [isConnected, hasAutoSubscribed, autoSubscribeToMajorPairs, connect, currentSymbol]);

  // Enhanced Debug: Monitor connection and data status
  useEffect(() => {
    // const subscriptions = Array.from(useRSITrackerStore.getState().subscriptions.keys());
    const symbolData = ohlcData.get(currentSymbol);
    
    // console.group('🔍 MultiIndicatorHeatmap Debug Status');
    // console.log('🔗 Connection:', {
    //   isConnected,
    //   hasAutoSubscribed,
    //   subscriptionsCount: subscriptions.length,
    //   subscriptions: subscriptions.slice(0, 5) // Show first 5 to avoid spam
    // });
    // 
    // console.log('📊 Data Status:', {
    //   currentSymbol,
    //   hasSymbolData: ohlcData.has(currentSymbol),
    //   dataSize: symbolData?.bars?.length || 0,
    //   timeframe: symbolData?.timeframe,
    //   lastUpdate: symbolData?.bars?.length > 0 ? new Date(symbolData.bars[symbolData.bars.length - 1].time * 1000).toLocaleTimeString() : 'N/A',
    //   totalSymbols: ohlcData.size,
    //   availableSymbols: Array.from(ohlcData.keys()).slice(0, 5) // Show first 5
    // });
    // 
    // console.log('⚙️ Settings:', {
    //   tradingStyle,
    //   indicatorWeight,
    //   showNewSignals,
    //   timeframesCount: timeframes.length
    // });
    
    // Data quality assessment
    if (symbolData?.bars?.length) {
      // const bars = symbolData.bars.length;
      // const quality = bars >= 200 ? '🟢 EXCELLENT' : 
      //                bars >= 100 ? '🟡 GOOD' : 
      //                bars >= 50 ? '🟠 FAIR' : '🔴 POOR';
      // console.log('🎯 Data Quality:', quality, `(${bars} bars)`);
    }
    
    // console.groupEnd();
  }, [isConnected, currentSymbol, ohlcData, timeframes, hasAutoSubscribed, showNewSignals, tradingStyle, indicatorWeight]);
  // Calculate indicators using current timeframe data for all columns
  const indicatorData = useMemo(() => {
    const data = {};
    
    // Check if we have data for the current symbol
    if (!ohlcData.has(currentSymbol)) {
      // console.log('❌ No data for symbol:', currentSymbol);
      return { error: 'NO_DATA', message: `No market data available for ${currentSymbol}` };
    }
    
    const symbolData = ohlcData.get(currentSymbol);
    if (!symbolData || !symbolData.bars) {
      // console.log('❌ No bars data for symbol:', currentSymbol);
      return { error: 'NO_BARS', message: `No OHLC bars available for ${currentSymbol}` };
    }
    
    const bars = symbolData.bars;
    const closes = bars.map(bar => bar.close);
    // const highs = bars.map(bar => bar.high); // Unused in current implementation
    // const lows = bars.map(bar => bar.low); // Unused in current implementation
    
    // console.log('📊 Data Status:', {
    //   symbol: currentSymbol,
    //   barsCount: bars.length,
    //   timeframe: symbolData.timeframe,
    //   closesLength: closes.length,
    //   firstClose: closes[0],
    //   lastClose: closes[closes.length - 1],
    //   dataQuality: bars.length >= 200 ? 'EXCELLENT' : bars.length >= 100 ? 'GOOD' : bars.length >= 50 ? 'FAIR' : 'POOR'
    // });
    
    // Enhanced data validation with different thresholds
    const minDataRequired = {
      basic: 50,    // Minimum for basic calculations
      optimal: 100, // Optimal for reliable signals
      excellent: 200 // Excellent for all indicators
    };
    
    if (closes.length < minDataRequired.basic) {
      // console.log('❌ Insufficient data, need at least 50 bars, have:', closes.length);
      return { 
        error: 'INSUFFICIENT_DATA', 
        message: `Insufficient data: ${closes.length}/50 bars available`,
        dataCount: closes.length,
        required: minDataRequired.basic
      };
    }
    
    // Calculate indicators with comprehensive error handling and fallbacks
    let emaSignals, macdSignals, rsiSignals, utBot, ichimokuSignals, quietMarketInfo;
    const calculationErrors = [];
    const calculationWarnings = [];
    
    // Helper function to safely calculate indicators
    const safeCalculate = (name, calculationFn, fallbackFn = null) => {
      try {
        const result = calculationFn();
        if (!result) {
          calculationWarnings.push(`${name}: Insufficient data`);
          return fallbackFn ? fallbackFn() : null;
        }
        return result;
      } catch (error) {
        // console.error(`❌ ${name} calculation error:`, error);
        calculationErrors.push(`${name}: ${error.message}`);
        return fallbackFn ? fallbackFn() : null;
      }
    };
    
    // Create fallback functions for each indicator
    const createEMAFallback = () => ({
      ema21: { value: closes[closes.length - 1], signal: 'neutral', new: false },
      ema50: { value: closes[closes.length - 1], signal: 'neutral', new: false },
      ema200: { value: closes[closes.length - 1], signal: 'neutral', new: false }
    });
    
    const createMACDFallback = () => ({
      macd: 0,
      signal: 0,
      histogram: 0,
      analysis: { signal: 'neutral', new: false }
    });
    
    const createRSIFallback = () => ({
      rsi: 50,
      analysis: { signal: 'neutral', new: false }
    });
    
    const createUTBotFallback = () => ({
      signal: 'neutral',
      confidence: 0.5,
      new: false
    });
    
    const createIchimokuFallback = () => ({
      analysis: { signal: 'neutral', new: false },
      cloudTop: closes[closes.length - 1],
      cloudBottom: closes[closes.length - 1]
    });
    
    // Calculate each indicator with fallbacks
    emaSignals = safeCalculate(
      'EMA',
      () => calculateEMASignals(closes),
      closes.length >= 21 ? createEMAFallback : null
    );
    
    macdSignals = safeCalculate(
      'MACD',
      () => calculateMACDSignals(closes),
      closes.length >= 26 ? createMACDFallback : null
    );
    
    rsiSignals = safeCalculate(
      'RSI',
      () => calculateRSISignals(closes, 14),
      closes.length >= 15 ? createRSIFallback : null
    );
    
    utBot = safeCalculate(
      'UTBOT',
      () => generateUTBotSignal(bars, closes[closes.length - 1]),
      bars.length >= 20 ? createUTBotFallback : null
    );
    
    ichimokuSignals = safeCalculate(
      'Ichimoku',
      () => calculateIchimokuCloneSignals(bars),
      bars.length >= 26 ? createIchimokuFallback : null
    );
    
    // Quiet market detection (non-critical)
    quietMarketInfo = safeCalculate(
      'QuietMarket',
      () => isQuietMarket(bars, 14),
      () => ({ isQuiet: false, currentATR: null, fifthPercentile: null })
    );
    
    // Log calculation results
    if (calculationErrors.length > 0) {
      // console.warn('⚠️ Calculation errors:', calculationErrors);
    }
    if (calculationWarnings.length > 0) {
      // console.info('ℹ️ Calculation warnings:', calculationWarnings);
    }
    
    // Enhanced signal logging with success/failure tracking (disabled to avoid lint warnings)
    // console.group(`📊 ${currentSymbol} Signal Calculations`);
    
    const signalSummary = {
      successful: [],
      failed: [],
      signals: {},
      newSignals: {}
    };
    
    // Track each indicator's success/failure
    const indicators = [
      { name: 'EMA21', data: emaSignals?.ema21, source: emaSignals },
      { name: 'EMA50', data: emaSignals?.ema50, source: emaSignals },
      { name: 'EMA200', data: emaSignals?.ema200, source: emaSignals },
      { name: 'MACD', data: macdSignals?.analysis, source: macdSignals },
      { name: 'RSI', data: rsiSignals?.analysis, source: rsiSignals },
      { name: 'UTBOT', data: utBot, source: utBot },
      { name: 'Ichimoku', data: ichimokuSignals?.analysis, source: ichimokuSignals }
    ];
    
    indicators.forEach(({ name, data, source }) => {
      if (source && data) {
        signalSummary.successful.push(name);
        signalSummary.signals[name] = data.signal || source.signal;
        signalSummary.newSignals[name] = data.new || source.new || false;
      } else {
        signalSummary.failed.push(name);
        signalSummary.signals[name] = 'FAILED';
        signalSummary.newSignals[name] = false;
      }
    });
    
    // console.log('✅ Successful calculations:', signalSummary.successful.join(', ') || 'None');
    // if (signalSummary.failed.length > 0) {
    //   console.warn('❌ Failed calculations:', signalSummary.failed.join(', '));
    // }
    
    // console.log('📊 Current Signals:', signalSummary.signals);
    
    // const newSignalCount = Object.values(signalSummary.newSignals).filter(Boolean).length;
    // if (newSignalCount > 0) {
    //   console.log('🆕 New Signals (K=3 lookback):', 
    //     Object.entries(signalSummary.newSignals)
    //       .filter(([, isNew]) => isNew)
    //       .map(([name]) => name)
    //       .join(', ')
    //   );
    // }
    
    // if (quietMarketInfo) {
    //   console.log('🔇 Market Conditions:', {
    //     isQuiet: quietMarketInfo.isQuiet,
    //     currentATR: quietMarketInfo.currentATR?.toFixed(6),
    //     fifthPercentile: quietMarketInfo.fifthPercentile?.toFixed(6),
    //     affectedIndicators: quietMarketInfo.isQuiet ? ['MACD', 'UTBOT'] : [],
    //     multiplier: quietMarketInfo.isQuiet ? QUIET_MARKET_PARAMETERS.QUIET_MARKET_MULTIPLIER : 1.0
    //   });
    // }
    
    // console.groupEnd();
    
    // Add data quality indicator
    const dataQuality = {
      excellent: closes.length >= 200,
      good: closes.length >= 100,
      fair: closes.length >= 50,
      poor: closes.length < 50
    };
    
    // Use the same calculated data for all timeframes (since we only have one timeframe of data)
    timeframes.forEach(timeframe => {
      data[timeframe] = {
        EMA21: { 
          value: emaSignals?.ema21?.value || null, 
          signal: emaSignals?.ema21?.signal || 'neutral',
          new: emaSignals?.ema21?.new || false,
          quietMarket: false, // EMA not affected by quiet market
          hasData: !!emaSignals?.ema21,
          error: !emaSignals?.ema21 ? (closes.length < 21 ? 'Need 21+ bars' : 'Calc failed') : null,
          fallback: false // EMA21 doesn't use fallback - either calculates or shows as unavailable
        },
        EMA50: { 
          value: emaSignals?.ema50?.value || null, 
          signal: emaSignals?.ema50?.signal || 'neutral',
          new: emaSignals?.ema50?.new || false,
          quietMarket: false, // EMA not affected by quiet market
          hasData: !!emaSignals?.ema50,
          error: !emaSignals?.ema50 ? (closes.length < 50 ? 'Need 50+ bars' : 'Calc failed') : null,
          fallback: false // EMA50 doesn't use fallback - either calculates or shows as unavailable
        },
        EMA200: { 
          value: emaSignals?.ema200?.value || null, 
          signal: emaSignals?.ema200?.signal || 'neutral',
          new: emaSignals?.ema200?.new || false,
          quietMarket: false, // EMA not affected by quiet market
          hasData: !!emaSignals?.ema200,
          error: !emaSignals?.ema200 ? (closes.length < 200 ? 'Need 200+ bars' : 'Calc failed') : null,
          fallback: false // EMA200 doesn't use fallback - either calculates or shows as unavailable
        },
        MACD: { 
          value: macdSignals?.macd || null, 
          signal: macdSignals?.analysis?.signal || 'neutral',
          new: macdSignals?.analysis?.new || false,
          quietMarket: quietMarketInfo?.isQuiet || false, // MACD affected by quiet market
          hasData: !!macdSignals,
          error: !macdSignals ? (closes.length < 26 ? 'Need 26+ bars' : 'Calc failed') : null,
          fallback: false // MACD doesn't use fallback - either calculates or shows as unavailable
        },
        RSI: { 
          value: rsiSignals?.rsi || null, 
          signal: rsiSignals?.analysis?.signal || 'neutral',
          new: rsiSignals?.analysis?.new || false,
          quietMarket: false, // RSI not affected by quiet market
          hasData: !!rsiSignals,
          error: !rsiSignals ? (closes.length < 15 ? 'Need 15+ bars' : 'Calc failed') : null,
          fallback: false // RSI doesn't use fallback - either calculates or shows as unavailable
        },
        UTBOT: { 
          value: utBot?.confidence || null, 
          signal: utBot?.signal || 'neutral',
          new: utBot?.new || false,
          quietMarket: quietMarketInfo?.isQuiet || false, // UTBOT affected by quiet market
          hasData: !!utBot,
          error: !utBot ? (bars.length < 20 ? 'Need 20+ bars' : 'Calc failed') : null,
          fallback: false // UTBOT doesn't use fallback - either calculates or shows as unavailable
        },
        IchimokuClone: { 
          value: ichimokuSignals?.cloudTop || null, 
          signal: ichimokuSignals?.analysis?.signal || 'neutral',
          new: ichimokuSignals?.analysis?.new || false,
          quietMarket: false, // IchimokuClone not affected by quiet market
          hasData: !!ichimokuSignals,
          error: !ichimokuSignals ? (bars.length < 52 ? 'Need 52+ bars' : 'Calc failed') : null,
          fallback: false // Ichimoku doesn't use fallback - either calculates or shows as unavailable
        }
      };
    });
    
    // Add comprehensive metadata for debugging and monitoring
    data._metadata = {
      symbol: currentSymbol,
      dataCount: closes.length,
      dataQuality,
      calculationErrors,
      calculationWarnings,
      hasQuietMarket: quietMarketInfo?.isQuiet || false,
      quietMarketDetails: {
        currentATR: quietMarketInfo?.currentATR,
        fifthPercentile: quietMarketInfo?.fifthPercentile,
        affectedIndicators: quietMarketInfo?.isQuiet ? ['MACD', 'UTBOT'] : []
      },
      indicatorStatus: {
        EMA: !!emaSignals,
        MACD: !!macdSignals,
        RSI: !!rsiSignals,
        UTBOT: !!utBot,
        Ichimoku: !!ichimokuSignals
      },
      dataRequirements: {
        EMA21: { required: 21, available: closes.length, sufficient: closes.length >= 21 },
        EMA50: { required: 50, available: closes.length, sufficient: closes.length >= 50 },
        EMA200: { required: 200, available: closes.length, sufficient: closes.length >= 200 },
        MACD: { required: 26, available: closes.length, sufficient: closes.length >= 26 },
        RSI: { required: 15, available: closes.length, sufficient: closes.length >= 15 },
        UTBOT: { required: 20, available: bars.length, sufficient: bars.length >= 20 },
        Ichimoku: { required: 52, available: bars.length, sufficient: bars.length >= 52 }
      },
      timestamp: new Date().toISOString()
    };
    
    return data;
  }, [currentSymbol, ohlcData, timeframes]);
  
  // Calculate scores and final results with error handling
  const { scores, finalResults, dataStatus } = useMemo(() => {
    // Check for data errors first
    if (indicatorData.error) {
      return {
        scores: {},
        finalResults: {
          finalScore: 0,
          buyNowPercent: 50,
          sellNowPercent: 50,
          newSignalBoost: false,
          rawAggregate: 0,
          totalCells: 0,
          newSignalCount: 0,
          positiveNewSignals: 0
        },
        dataStatus: {
          hasError: true,
          error: indicatorData.error,
          message: indicatorData.message,
          dataCount: indicatorData.dataCount || 0,
          required: indicatorData.required || 50
        }
      };
    }
    
    const scores = {};
    const metadata = indicatorData._metadata || {};
    let totalIndicators = 0;
    let workingIndicators = 0;
    
    Object.entries(indicatorData).forEach(([timeframe, indicators]) => {
      if (timeframe === '_metadata') return; // Skip metadata
      
      scores[timeframe] = {};
      
      Object.entries(indicators).forEach(([indicator, data]) => {
        totalIndicators++;
        if (data.hasData) workingIndicators++;
        
        const score = getIndicatorScore(indicator, data.value, data.signal, data.new, data.quietMarket);
        scores[timeframe][indicator] = score;
      });
    });
    
    const finalResults = calculateFinalScore(scores, tradingStyle, indicatorWeight);
    
    return {
      scores,
      finalResults,
      dataStatus: {
        hasError: false,
        dataCount: metadata.dataCount || 0,
        dataQuality: metadata.dataQuality,
        calculationErrors: metadata.calculationErrors || [],
        workingIndicators,
        totalIndicators,
        workingPercentage: totalIndicators > 0 ? Math.round((workingIndicators / totalIndicators) * 100) : 0,
        hasQuietMarket: metadata.hasQuietMarket || false
      }
    };
  }, [indicatorData, tradingStyle, indicatorWeight]);
  
  // Get cell color based on score (updated for new scoring range [-1.25, +1.25])
  const getCellColor = (score) => {
    if (score >= 1.0) return 'bg-green-500 text-white';        // Strong Buy (1.0 to 1.25)
    if (score > 0.5) return 'bg-green-400 text-white';         // Buy with boost (0.5 to 1.0)
    if (score > 0) return 'bg-green-200 text-green-800';       // Buy (0 to 0.5)
    if (score <= -1.0) return 'bg-red-500 text-white';         // Strong Sell (-1.0 to -1.25)
    if (score < -0.5) return 'bg-red-400 text-white';          // Sell with boost (-0.5 to -1.0)
    if (score < 0) return 'bg-red-200 text-red-800';           // Sell (0 to -0.5)
    return 'bg-gray-200 text-gray-600';                        // Neutral (0)
  };
  
  // Get signal text (updated for new scoring range [-1.25, +1.25])
  const getSignalText = (score) => {
    if (score > 0) return 'BUY';
    if (score < 0) return 'SELL';
    return '0%';
  };

  // Get actionable zone based on final score
  const getActionableZone = (finalScore, tradingStyle = 'day-trader') => {
    // Style-specific sensitivity thresholds
    const thresholds = {
      'scalper': 25,
      'day-trader': 20,
      'swing-trader': 15
    };
    
    const threshold = thresholds[tradingStyle] || 20;
    
    let zone;
    if (finalScore >= threshold) zone = 'buy';
    else if (finalScore <= -threshold) zone = 'sell';
    else zone = 'wait';
    
    // Debug logging removed - was too verbose
    
    return zone;
  };

  // Get zone colors and styling
  const getZoneStyling = (zone) => {
    switch (zone) {
      case 'buy':
        return {
          bgClass: 'bg-gradient-to-r from-green-50 to-green-100',
          borderClass: 'border-green-200',
          textClass: 'text-green-800',
          iconClass: 'text-green-600',
          valueClass: 'text-green-600',
          label: 'Buy Zone'
        };
      case 'sell':
        return {
          bgClass: 'bg-gradient-to-r from-red-50 to-red-100',
          borderClass: 'border-red-200',
          textClass: 'text-red-800',
          iconClass: 'text-red-600',
          valueClass: 'text-red-600',
          label: 'Sell Zone'
        };
      case 'wait':
      default:
        return {
          bgClass: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
          borderClass: 'border-yellow-200',
          textClass: 'text-yellow-800',
          iconClass: 'text-yellow-600',
          valueClass: 'text-yellow-600',
          label: 'Wait / Mixed'
        };
    }
  };
  
  // Note: New signal detection is handled by the indicator calculation functions
  // The 'new' property is set by calculateEMASignals, calculateMACDSignals, etc.
  // This function is not used in the current implementation
  
  const indicators = ['EMA21', 'EMA50', 'EMA200', 'MACD', 'RSI', 'UTBOT', 'IchimokuClone'];
  
  return (
    <div className="bg-white rounded-lg shadow-lg" style={{height: '100%', position: 'relative'}}>
      {/* Fixed Header Section */}
      <div style={{position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', padding: '1rem', borderBottom: '1px solid #e5e7eb'}}>
        <div className="flex items-center justify-between mb-3">
          {/* Title */}
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">All in One Currency Indicator</h2>
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center space-x-3">
          {/* Symbol Dropdown */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-gray-700">Symbol:</span>
            <div className="relative">
              <select
                value={currentSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="appearance-none pl-2 pr-6 py-1 bg-blue-50 text-blue-900 rounded text-xs font-medium border border-blue-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[80px] cursor-pointer hover:bg-blue-100"
              >
                {MAJOR_CURRENCY_PAIRS.map(pair => (
                  <option key={pair.value} value={pair.value}>
                    {pair.flag} {pair.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <svg className="w-3 h-3 text-blue-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Style Dropdown */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-gray-700">Style:</span>
            <div className="relative">
              <select
                value={tradingStyle}
                onChange={(e) => handleTradingStyleChange(e.target.value)}
                className="appearance-none pl-2 pr-6 py-1 bg-purple-50 text-purple-900 rounded text-xs font-medium border border-purple-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-w-[80px] cursor-pointer hover:bg-purple-100"
              >
                <option value="scalper">⚡ Scalper</option>
                <option value="dayTrader">📈 Day Trader</option>
                <option value="swingTrader">📊 Swing Trader</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <svg className="w-3 h-3 text-purple-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Weights Dropdown
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-gray-700">Weights:</span>
            <div className="relative">
              <select
                value={indicatorWeight}
                onChange={(e) => handleIndicatorWeightChange(e.target.value)}
                className="appearance-none pl-2 pr-6 py-1 bg-orange-50 text-orange-900 rounded text-xs font-medium border border-orange-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 min-w-[70px] cursor-pointer hover:bg-orange-100"
              >
                <option value="equal">⚖️ Equal</option>
                <option value="trendTilted">📈 Trend-Tilted</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <svg className="w-3 h-3 text-orange-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div> */}
          
          {/* Show New Toggle */}
          {/* <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-gray-700">New:</span>
            <div className="relative">
              <select
                value={showNewSignals ? 'on' : 'off'}
                onChange={(e) => handleShowNewSignalsChange(e.target.value === 'on')}
                className="appearance-none pl-2 pr-6 py-1 bg-green-50 text-green-900 rounded text-xs font-medium border border-green-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200 min-w-[60px] cursor-pointer hover:bg-green-100"
              >
                <option value="on">🟢 ON</option>
                <option value="off">🔴 OFF</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <svg className="w-3 h-3 text-green-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div> */}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div style={{
        height: 'calc(100% - 100px)',
        overflowY: 'auto',
        padding: '1rem'
      }}>
        {/* Final Score Summary with Actionable Bands */}
      <div className="flex justify-between gap-6 mb-4">
        {/* Buy Now % Card - Dynamic styling based on zone */}
        {(() => {
          const zone = getActionableZone(finalResults.finalScore, tradingStyle);
          const styling = getZoneStyling(zone);
          
          return (
            <div className={`${styling.bgClass} border-2 ${styling.borderClass} rounded-lg p-3 flex-1`}>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className={`w-5 h-5 ${styling.iconClass}`} />
                <span className={`text-sm font-medium ${styling.textClass}`}>Buy Now %</span>
              </div>
              <div className={`text-2xl font-bold ${styling.valueClass}`}>
                {finalResults.buyNowPercent}%
              </div>
              <div className={`text-xs ${styling.textClass} font-medium`}>{styling.label}</div>
              <div className="text-xs text-gray-500 mt-1">Probability</div>
            </div>
          );
        })()}
        
        {/* Sell Now % Card - Always Red Shade */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-3 flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Sell Now %</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {finalResults.sellNowPercent}%
          </div>
          <div className="text-xs text-red-800 font-medium">
            {(() => {
              const zone = getActionableZone(finalResults.finalScore, tradingStyle);
              const styling = getZoneStyling(zone);
              return styling.label;
            })()}
          </div>
          <div className="text-xs text-gray-500 mt-1">Probability</div>
        </div>
      </div>

      {/* New Signal Boost Badge */}
      {finalResults.newSignalBoost && (
        <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded-lg">
          <div className="flex items-center">
            <Zap className="w-5 h-5 text-orange-600 mr-2" />
            <span className="text-orange-800 font-medium">New Signal Boost Active!</span>
            <span className="text-orange-700 ml-2">
              {finalResults.positiveNewSignals} of {finalResults.totalCells} cells have new signals
            </span>
          </div>
        </div>
      )}

      {/* Quiet Market Safety Badge */}
      {(() => {
        // Check if any timeframe has quiet market conditions
        const hasQuietMarket = Object.values(indicatorData).some(timeframeData => 
          Object.values(timeframeData).some(indicator => indicator.quietMarket)
        );
        
        if (!hasQuietMarket) return null;
        
        // Get quiet market info from first available timeframe
        // const firstTimeframe = Object.values(indicatorData)[0];
        // const macdData = firstTimeframe?.MACD; // Unused for now
        // const utbotData = firstTimeframe?.UTBOT; // Unused for now
        
        return (
          <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">Quiet Market Safety Active!</span>
              <span className="text-blue-700 ml-2">
                ATR below 5th percentile - MACD and UTBOT scores reduced by 50%
              </span>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              This reduces false signals in low-volatility markets
            </div>
          </div>
        );
      })()}

      {/* Current Actionable Zone Indicator */}
      {(() => {
        const zone = getActionableZone(finalResults.finalScore, tradingStyle);
        const styling = getZoneStyling(zone);
        const thresholds = {
          'scalper': 25,
          'day-trader': 20,
          'swing-trader': 15
        };
        const threshold = thresholds[tradingStyle] || 20;
        
        return (
          <div className={`mb-3 p-2 ${styling.bgClass} border-2 ${styling.borderClass} rounded-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${styling.iconClass.replace('text-', 'bg-')} mr-3`}></div>
                <span className={`font-semibold ${styling.textClass}`}>
                  Current Zone: {styling.label}
                </span>
              </div>
              <div className={`text-sm ${styling.textClass}`}>
                Threshold: ±{threshold} (Final Score: {finalResults.finalScore})
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {zone === 'buy' && 'Strong bullish signals detected - Consider buying opportunities'}
              {zone === 'sell' && 'Strong bearish signals detected - Consider selling opportunities'}
              {zone === 'wait' && 'Mixed signals - Wait for clearer direction or use smaller position sizes'}
            </div>
          </div>
        );
      })()}

      {/* Zone Thresholds Info */}
      <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Zone Thresholds:</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Buy Zone: ≥{tradingStyle === 'scalper' ? '25' : tradingStyle === 'day-trader' ? '20' : '15'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-xs text-gray-600">Wait: ±{tradingStyle === 'scalper' ? '25' : tradingStyle === 'day-trader' ? '20' : '15'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-600">Sell Zone: ≤-{tradingStyle === 'scalper' ? '25' : tradingStyle === 'day-trader' ? '20' : '15'}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Style: {tradingStyle.charAt(0).toUpperCase() + tradingStyle.slice(1).replace('-', ' ')}
          </div>
        </div>
      </div>
      
      {/* Data Status and Error Handling */}
      {dataStatus.hasError ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {dataStatus.error === 'NO_DATA' ? 'No Market Data' : 
             dataStatus.error === 'NO_BARS' ? 'No OHLC Data' : 
             dataStatus.error === 'INSUFFICIENT_DATA' ? 'Insufficient Data' : 'Data Error'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {dataStatus.message}
          </p>
          {dataStatus.error === 'INSUFFICIENT_DATA' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700">Data Progress:</span>
                <span className="text-sm font-medium text-blue-800">
                  {dataStatus.dataCount}/{dataStatus.required} bars
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (dataStatus.dataCount / dataStatus.required) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Market data is still loading. Indicators will activate as more data becomes available.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Data Quality Indicator */}
          {dataStatus.workingPercentage < 100 && (
            <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">Partial Data Available</span>
                </div>
                <span className="text-yellow-700 text-sm">
                  {dataStatus.workingIndicators}/{dataStatus.totalIndicators} indicators active ({dataStatus.workingPercentage}%)
                </span>
              </div>
              {dataStatus.calculationErrors.length > 0 && (
                <div className="mt-2 text-xs text-yellow-600">
                  Issues: {dataStatus.calculationErrors.join(', ')}
                </div>
              )}
            </div>
          )}
      
      {/* Heatmap Table - Swapped rows/columns */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Timeframe</th>
              {indicators.map(indicator => (
                <th key={indicator} className="text-center py-2 px-1 font-semibold text-gray-700 min-w-[80px]">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs">{indicator}</span>
                    {indicator === 'UTBOT' && <Zap className="w-3 h-3 text-yellow-500" />}
                    {indicator === 'IchimokuClone' && <Activity className="w-3 h-3 text-purple-500" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeframes.map(timeframe => (
              <tr key={timeframe} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">
                  <div className="flex items-center space-x-2">
                    <span>{timeframe}</span>
                    {/* Show status indicator for failed calculations in this timeframe */}
                    {indicators.some(indicator => !indicatorData[timeframe]?.[indicator]?.hasData) && (
                      <span 
                        className="text-xs ml-1 text-red-500" 
                        title="Some calculations failed - insufficient data"
                      >
                        ⚠️
                      </span>
                    )}
                  </div>
                </td>
                {indicators.map(indicator => {
                  const score = scores[timeframe]?.[indicator] || 0;
                  const data = indicatorData[timeframe]?.[indicator];
                  const isNew = data?.new || false;
                  const hasData = data?.hasData || false;
                  
                  return (
                    <td key={indicator} className="text-center py-1 px-1">
                      <div className="relative">
                        <div 
                          className={`inline-flex items-center justify-center w-14 h-10 rounded-md font-bold text-xs ${
                            hasData ? getCellColor(score) : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                          }`}
                          title={
                            hasData ? `Signal: ${data.signal}, Score: ${score.toFixed(2)}` : data?.error || 'No data'
                          }
                        >
                          {hasData ? getSignalText(score) : <span className="text-xs">⋯</span>}
                        </div>
                        {isNew && showNewSignals && hasData && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border border-white"></div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}
      
      {/* Legend */}
      {/* <div className="mt-4 flex items-center justify-center space-x-3 text-sm flex-wrap">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold"></div>
          <span>Strong Buy (1.0-1.25)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-400 rounded flex items-center justify-center text-white text-xs font-bold"></div>
          <span>Buy+ (0.5-1.0)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-200 rounded flex items-center justify-center text-green-800 text-xs font-bold"></div>
          <span>Buy (0-0.5)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-xs font-bold"></div>
          <span>Neutral (0)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-200 rounded flex items-center justify-center text-red-800 text-xs font-bold"></div>
          <span>Sell (0 to -0.5)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-400 rounded flex items-center justify-center text-white text-xs font-bold"></div>
          <span>Sell+ (-0.5 to -1.0)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold"></div>
          <span>Strong Sell (-1.0 to -1.25)</span>
        </div>
        {showNewSignals && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>New Signal (+0.25 boost)</span>
          </div>
        )}
      </div> */}
      </div>
    </div>
  );
};

export default MultiIndicatorHeatmap;
