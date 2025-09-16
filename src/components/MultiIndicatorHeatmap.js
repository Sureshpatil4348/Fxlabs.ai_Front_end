import { 
  Activity,
  BarChart3,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import userStateService from '../services/userStateService';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { formatSymbolDisplay, formatCurrency } from '../utils/formatters';
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
    '1D': 0.00,
    '1W': 0.00
  },
  dayTrader: {
    '5M': 0.10,
    '15M': 0.25,
    '30M': 0.25,
    '1H': 0.25,
    '4H': 0.10,
    '1D': 0.05,
    '1W': 0.00
  },
  swingTrader: {
    '5M': 0.00,
    '15M': 0.00,
    '30M': 0.10,
    '1H': 0.25,
    '4H': 0.35,
    '1D': 0.30,
    '1W': 0.00
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

// Dropdown options will be derived from RSI store settings

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
  
  // Calculation debug info available if needed
  
  let rawAggregate = 0;
  let totalCells = 0;
  let newSignalCount = 0;
  let positiveNewSignals = 0;
  
  // Calculate raw aggregate: Σ over timeframes Σ over indicators [ S(tf, ind) × W_tf(tf) × W_ind(ind) ]
  Object.entries(scores).forEach(([timeframe, timeframeScores]) => {
    const timeframeWeight = timeframeWeights[timeframe] || 0;
    
    Object.entries(timeframeScores).forEach(([indicator, score]) => {
      const indicatorWeight = indicatorWeights[indicator] || 0;
      
      const contribution = score * timeframeWeight * indicatorWeight;
      rawAggregate += contribution;
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
  
  // Check for new signal boost (≥25% of all positive cells are 'NEW')
  const newSignalBoost = totalCells > 0 && (positiveNewSignals / totalCells) >= 0.25;
  
  // Final calculation results
  
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
    finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
    buyNowPercent: Math.round(buyNowPercent * 100) / 100, // Round to 2 decimal places
    sellNowPercent: Math.round(sellNowPercent * 100) / 100, // Round to 2 decimal places
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
  const [tradingStyle, setTradingStyle] = useState(DEFAULT_TRADING_STYLE);
  const [indicatorWeight, setIndicatorWeight] = useState('equal');
  const [currentSymbol, setCurrentSymbol] = useState(selectedSymbol);
  
  // Local settings state for persistence
  const [localSettings, setLocalSettings] = useState({
    symbol: selectedSymbol,
    tradingStyle: DEFAULT_TRADING_STYLE,
    indicatorWeight: 'equal',
    showNewSignals: true
  });
  
  const { 
    ohlcData, 
    // rsiData, // Unused for now
    timeframes,
    isConnected,
    autoSubscribeToMajorPairs,
    connect,
    settings
  } = useRSITrackerStore();

  // Available symbols from store (e.g., 32 pairs). Keep 'm' suffix for RSI tracker
  const availableSymbols = useMemo(() => settings?.autoSubscribeSymbols || [], [settings?.autoSubscribeSymbols]);

  // Build dropdown options with flags and pretty labels
  const dropdownOptions = useMemo(() => {
    return availableSymbols.map((sym) => {
      const label = formatSymbolDisplay(sym);
      const clean = sym.replace(/m$/, '').toUpperCase();
      let flag = '';
      if (clean.length === 6) {
        const base = clean.slice(0, 3);
        const quote = clean.slice(3);
        flag = `${formatCurrency(base).flag}${formatCurrency(quote).flag}`;
      }
      return { value: sym, label, flag };
    });
  }, [availableSymbols]);

  // Ensure current symbol is part of available list; fallback gracefully
  useEffect(() => {
    if (availableSymbols.length > 0 && !availableSymbols.includes(currentSymbol)) {
      setCurrentSymbol(availableSymbols[0]);
    }
  }, [availableSymbols, currentSymbol]);
  
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
            tradingStyle: tradingStyle || DEFAULT_TRADING_STYLE,
            indicatorWeight: indicatorWeight || 'equal',
            showNewSignals: showNewSignals !== undefined ? showNewSignals : true
          });

          // Update component state
          setCurrentSymbol(symbol || selectedSymbol);
          setTradingStyle(tradingStyle || DEFAULT_TRADING_STYLE);
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
    
    // Deduplicate timeframes to avoid processing the same timeframe multiple times
    const uniqueTimeframes = [...new Set(timeframes)];
    
    uniqueTimeframes.forEach(timeframe => {
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
    
    // Final results calculation completed
    
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
    if (score >= 1.0) return 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300';        // Strong Buy (1.0 to 1.25)
    if (score > 0.5) return 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200';         // Buy with boost (0.5 to 1.0)
    if (score > 0) return 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border border-green-200';       // Buy (0 to 0.5)
    if (score <= -1.0) return 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-800 border border-rose-300';         // Strong Sell (-1.0 to -1.25)
    if (score < -0.5) return 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700 border border-rose-200';          // Sell with boost (-0.5 to -1.0)
    if (score < 0) return 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border border-red-200';           // Sell (0 to -0.5)
    return 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border border-gray-200';                        // Neutral (0)
  };
  
  // Get signal text (updated for new scoring range [-1.25, +1.25])
  const getSignalText = (score) => {
    if (score > 0) return (
      <div className="flex items-center justify-center space-x-1.5">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="font-bold">BUY</span>
      </div>
    );
    if (score < 0) return (
      <div className="flex items-center justify-center space-x-1.5">
        <TrendingDown className="w-3.5 h-3.5" />
        <span className="font-bold">SELL</span>
      </div>
    );
    return '0%';
  };

  // Get actionable zone based on final score
  const getActionableZone = (finalScore, tradingStyle = 'dayTrader') => {
    // Style-specific sensitivity thresholds
    const thresholds = {
      'scalper': 25,
      'dayTrader': 20,
      'swingTrader': 15
    };
    
    const threshold = thresholds[tradingStyle] || 20;
    
    let zone;
    if (finalScore >= threshold) zone = 'buy';
    else if (finalScore <= -threshold) zone = 'sell';
    else zone = 'wait';
    
    // Debug logging removed - was too verbose
    
    return zone;
  };

  // Get zone colors and styling - Premium Light Colors
  const getZoneStyling = (zone) => {
    switch (zone) {
      case 'buy':
        return {
          bgClass: 'bg-gradient-to-r from-emerald-50 to-green-100',
          borderClass: 'border-emerald-200/50',
          textClass: 'text-emerald-800',
          iconClass: 'text-emerald-600',
          valueClass: 'text-emerald-600',
          label: 'Buy Zone'
        };
      case 'sell':
        return {
          bgClass: 'bg-gradient-to-r from-red-50 to-rose-100',
          borderClass: 'border-red-200/50',
          textClass: 'text-red-800',
          iconClass: 'text-red-600',
          valueClass: 'text-red-600',
          label: 'Sell Zone'
        };
      case 'wait':
      default:
        return {
          bgClass: 'bg-gradient-to-r from-amber-50 to-yellow-100',
          borderClass: 'border-amber-200/50',
          textClass: 'text-amber-800',
          iconClass: 'text-amber-600',
          valueClass: 'text-amber-600',
          label: 'Wait / Mixed'
        };
    }
  };
  
  // Note: New signal detection is handled by the indicator calculation functions
  // The 'new' property is set by calculateEMASignals, calculateMACDSignals, etc.
  // This function is not used in the current implementation
  
  const indicators = ['EMA21', 'EMA50', 'EMA200', 'MACD', 'RSI', 'UTBOT', 'IchimokuClone'];
  
  // Component rendering with trading style
  
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg shadow-lg border border-slate-200/50" style={{height: '100%', position: 'relative'}} key={`heatmap-${tradingStyle}`}>
      {/* Fixed Header Section - Frosted Glass */}
      <div className="rounded-lg border border-white/20" style={{position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '0.5rem', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'}}>
        {/* Top Row - Title, Trading Signals, and Controls */}
        <div className="flex items-center justify-between mb-1">
          {/* Title */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-wide">All in One Currency Indicator</h2>
          </div>
          
          {/* Trading Signal Pills - Between Title and Dropdowns */}
          <div className="flex items-center gap-1.5">
            {/* Buy Signal Pill */}
            {(() => {
              const zone = getActionableZone(finalResults.finalScore, tradingStyle);
              const isActive = zone === 'buy';
              
              return (
                <div key={`buy-pill-${tradingStyle}-${finalResults.buyNowPercent}`} 
                     className={`relative overflow-hidden rounded-full px-3 py-1 transition-all duration-300 hover:scale-105 ${
                       isActive 
                         ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50' 
                         : 'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200/50'
                     }`}>
                  {/* Glassy effect overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-white/30 to-transparent ${
                    isActive ? 'animate-pulse' : ''
                  }`}></div>
                  
                  <div className="relative flex items-center space-x-1.5">
                    <span className={`text-xs ${isActive ? 'text-white' : 'text-emerald-600'}`}>📈</span>
                    <span className={`text-xs font-medium tracking-wide ${isActive ? 'text-white' : 'text-emerald-800'}`}>
                      {finalResults.buyNowPercent}%
                    </span>
                  </div>
                </div>
              );
            })()}
            
            {/* Sell Signal Pill */}
            {(() => {
              const zone = getActionableZone(finalResults.finalScore, tradingStyle);
              const isActive = zone === 'sell';
              
              return (
                <div key={`sell-pill-${tradingStyle}-${finalResults.sellNowPercent}`} 
                     className={`relative overflow-hidden rounded-full px-3 py-1 transition-all duration-300 hover:scale-105 ${
                       isActive 
                         ? 'bg-gradient-to-r from-rose-400 to-rose-600 shadow-lg shadow-rose-500/50' 
                         : 'bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200/50'
                     }`}>
                  {/* Glassy effect overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-white/30 to-transparent ${
                    isActive ? 'animate-pulse' : ''
                  }`}></div>
                  
                  <div className="relative flex items-center space-x-1.5">
                    <span className={`text-xs ${isActive ? 'text-white' : 'text-rose-600'}`}>📉</span>
                    <span className={`text-xs font-medium tracking-wide ${isActive ? 'text-white' : 'text-rose-800'}`}>
                      {finalResults.sellNowPercent}%
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center space-x-1">
          {/* Symbol Dropdown */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-gray-700">Symbol:</span>
            <div className="relative">
              <select
                value={currentSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="appearance-none pl-2 pr-6 py-1.5 bg-white/80 backdrop-blur-sm text-slate-800 rounded-xl text-xs font-semibold border-2 border-blue-200/50 focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 min-w-[80px] cursor-pointer hover:bg-white hover:shadow-md hover:scale-105 shadow-sm"
              >
                {dropdownOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.flag ? `${option.flag} ` : ''}{option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <svg className="w-2 h-2 text-blue-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="appearance-none pl-2 pr-6 py-1.5 bg-white/80 backdrop-blur-sm text-slate-800 rounded-xl text-xs font-semibold border-2 border-purple-200/50 focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400 transition-all duration-300 min-w-[80px] cursor-pointer hover:bg-white hover:shadow-md hover:scale-105 shadow-sm"
              >
                <option value="scalper">⚡ Scalper</option>
                <option value="dayTrader">📈 Day Trader</option>
                <option value="swingTrader">📊 Swing Trader</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <svg className="w-2 h-2 text-purple-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Content Area - More Space for Table */}
      <div style={{
        height: 'calc(100% - 50px)',
        overflowY: 'hidden',
        padding: '0.25rem',
        display: 'flex',
        flexDirection: 'column'
      }}>

      {/* New Signal Boost Badge
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
      )} */}

      {/* Quiet Market Safety Badge - Compact */}
      {(() => {
        // Check if any timeframe has quiet market conditions
        const hasQuietMarket = Object.values(indicatorData).some(timeframeData => 
          Object.values(timeframeData).some(indicator => indicator.quietMarket)
        );
        
        if (!hasQuietMarket) return null;
        
        return (
          <div className="mb-0.5 p-0.5 bg-blue-100 border border-blue-300 rounded text-xs">
            <div className="flex items-center">
              <Activity className="w-2 h-2 text-blue-600 mr-1" />
              <span className="text-blue-800 font-medium">Quiet Market Safety Active</span>
            </div>
          </div>
        );
      })()}

      {/* Current Actionable Zone Indicator - Only show for high probability zones */}
      {(() => {
        const zone = getActionableZone(finalResults.finalScore, tradingStyle);
        const _styling = getZoneStyling(zone);
        const thresholds = {
          'scalper': 25,
          'day-trader': 20,
          'swing-trader': 15
        };
        const _threshold = thresholds[tradingStyle] || 20;
        
        // Only show if it's a high probability zone (Buy or Sell), not Wait/Neutral
        if (zone === 'wait') {
          return null;
        }
        
        
      })()}

      
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
          {/* Data Quality Indicator - Compact */}
          {dataStatus.workingPercentage < 100 && (
            <div className="mb-0.5 p-0.5 bg-yellow-100 border border-yellow-300 rounded text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-2 h-2 text-yellow-600 mr-1" />
                  <span className="text-yellow-800 font-medium">Partial Data</span>
                </div>
                <span className="text-yellow-700 text-xs">
                  {dataStatus.workingIndicators}/{dataStatus.totalIndicators} ({dataStatus.workingPercentage}%)
                </span>
              </div>
            </div>
          )}
      
      {/* Heatmap Table - Full Height */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse h-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-0.5 px-1 font-semibold text-gray-700 text-xs w-16">TF</th>
              {indicators.map(indicator => (
                <th key={indicator} className="text-center py-0.5 px-0.5 font-semibold text-gray-700">
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{indicator}</span>
                    {indicator === 'EMA21' && <span className="text-xs">📈</span>}
                    {indicator === 'EMA50' && <span className="text-xs">📊</span>}
                    {indicator === 'EMA200' && <span className="text-xs">📈</span>}
                    {indicator === 'MACD' && <span className="text-xs">📊</span>}
                    {indicator === 'RSI' && <span className="text-xs">⚡</span>}
                    {indicator === 'UTBOT' && <Zap className="w-2 h-2 text-yellow-500" />}
                    {indicator === 'IchimokuClone' && <Activity className="w-2 h-2 text-purple-500" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="h-full">
            {[...new Set(timeframes)].map((timeframe) => (
              <tr key={timeframe} className="border-b border-slate-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30" style={{ height: 'calc(100% / ' + [...new Set(timeframes)].length + ')' }}>
                <td className="py-0.5 px-1 font-medium text-slate-800 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-bold">{timeframe}</span>
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
                  const hasData = data?.hasData || false;
                  
                  return (
                    <td key={indicator} className="text-center py-1 px-1">
                      <div className="relative h-full flex items-center justify-center">
                        <div 
                          className={`inline-flex items-center justify-center w-16 h-8 rounded-lg font-semibold text-xs shadow-sm transition-all duration-200 hover:shadow-md ${
                            hasData ? getCellColor(score) : 'bg-gray-100 text-gray-400 border border-dashed border-gray-300'
                          }`}
                          title={
                            hasData ? `Signal: ${data.signal}, Score: ${score.toFixed(2)}` : data?.error || 'No data'
                          }
                        >
                          {hasData ? getSignalText(score) : <span className="text-xs">⋯</span>}
                        </div>
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
      
      
      </div>
    </div>
  );
};

export default MultiIndicatorHeatmap;
