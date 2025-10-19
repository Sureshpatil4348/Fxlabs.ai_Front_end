import { 
  Bell,
  Sliders as _Sliders
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';


import HeatmapIndicatorTrackerAlertConfig from './HeatmapIndicatorTrackerAlertConfig';
import HeatmapTrackerAlertConfig from './HeatmapTrackerAlertConfig';
import quantImage from '../assets/quant.png';
import { useAuth } from '../auth/AuthProvider';
import heatmapTrackerAlertService from '../services/heatmapTrackerAlertService';
import widgetTabRetentionService from '../services/widgetTabRetentionService';
import { Card, CardTitle } from './ui/card';
import useMarketCacheStore from '../store/useMarketCacheStore';
import useRSITrackerStore from '../store/useRSITrackerStore';
// Note: All indicator calculations are now performed server-side
// EMA, MACD, RSI, UTBOT, Ichimoku signals should be received from WebSocket/API
// import { formatSymbolDisplay, formatCurrency } from '../utils/formatters';

// Format timeframe for UI display
const formatTimeframeDisplay = (timeframe) => {
  const timeframeMap = {
    '1M': '1 Min',
    '5M': '5 Min', 
    '15M': '15 Mins',
    '30M': '30 Mins',
    '1H': '1 Hour',
    '4H': '4 Hours',
    '1D': '1 Day'
  };
  return timeframeMap[timeframe] || timeframe;
};

// Format indicator name for UI display
const formatIndicatorDisplay = (indicator) => {
  const indicatorMap = {
    'EMA21': 'EMA 21',
    'EMA50': 'EMA 50',
    'EMA200': 'EMA 200',
    'UTBOT': 'UT BOT',
    'IchimokuClone': 'Ichimoku',
    'ICHIMOKU': 'Ichimoku'
  };
  return indicatorMap[indicator] || indicator;
};

// flag utilities removed

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

// Default trading style
const DEFAULT_TRADING_STYLE = 'swingTrader';

// Dropdown options will be derived from RSI store settings

// No local calculations; rely solely on server quantum data

const MultiIndicatorHeatmap = ({ selectedSymbol = 'EURUSDm' }) => {
  // const [selectedTimeframe, setSelectedTimeframe] = useState('1H'); // Unused for now
  const [_showNewSignals, _setShowNewSignals] = useState(true);
  const [tradingStyle, setTradingStyle] = useState(DEFAULT_TRADING_STYLE);
  const [_indicatorWeight, _setIndicatorWeight] = useState('equal');
  const [currentSymbol, setCurrentSymbol] = useState(selectedSymbol);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  
  // Alert functionality
  const { user } = useAuth();
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [showIndicatorAlertConfig, setShowIndicatorAlertConfig] = useState(false);
  
  // Local settings state for persistence
  const [localSettings, setLocalSettings] = useState({
    symbol: selectedSymbol,
    tradingStyle: DEFAULT_TRADING_STYLE,
    indicatorWeight: 'equal',
    showNewSignals: true
  });
  
  const { 
    timeframes,
    isConnected,
    autoSubscribeToMajorPairs,
    connect,
    subscribe,
    settings
  } = useRSITrackerStore();

  // Available symbols from store (e.g., 32 pairs). Keep 'm' suffix for RSI tracker
  const availableSymbols = useMemo(() => settings?.autoSubscribeSymbols || [], [settings?.autoSubscribeSymbols]);

  // Build dropdown options with flags - sorted alphabetically
  const dropdownOptions = useMemo(() => {
    return availableSymbols.map((sym) => {
      const clean = sym.replace(/m$/, '').toUpperCase();
      const pretty = clean.length === 6 ? `${clean.slice(0, 3)}/${clean.slice(3)}` : clean;
      return { value: sym, label: pretty };
    }).sort((a, b) => a.label.localeCompare(b.label));
  }, [availableSymbols]);

  // Ensure current symbol is part of available list; fallback gracefully
  useEffect(() => {
    if (availableSymbols.length > 0 && !availableSymbols.includes(currentSymbol)) {
      setCurrentSymbol(availableSymbols[0]);
    }
  }, [availableSymbols, currentSymbol]);

  // Minimal REST snapshot: hydrate server quantum for current symbol once if missing
  useEffect(() => {
    try {
      const mc = useMarketCacheStore.getState();
      const hasQuantum = !!mc.quantumBySymbol.get(currentSymbol);
      if (!hasQuantum && currentSymbol) {
        mc.hydrateQuantumForSymbol(currentSymbol);
      }
    } catch (_e) {
      // silent
    }
  }, [currentSymbol]);
  
  // Add this state
const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
const symbolDropdownRef = useRef(null);

  // Close symbol dropdown on outside click
  useEffect(() => {
    if (!isSymbolDropdownOpen) return;
    const handleOutside = (e) => {
      const el = symbolDropdownRef.current;
      if (el && !el.contains(e.target)) {
        setIsSymbolDropdownOpen(false);
      }
    };
    const listenerOptions = { capture: true, passive: true };
    document.addEventListener('mousedown', handleOutside, listenerOptions);
    document.addEventListener('touchstart', handleOutside, listenerOptions);
    return () => {
      document.removeEventListener('mousedown', handleOutside, listenerOptions);
      document.removeEventListener('touchstart', handleOutside, listenerOptions);
    };
  }, [isSymbolDropdownOpen]);

  // Load settings from database on component mount using widget tab retention service
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedState = await widgetTabRetentionService.getWidgetState('MultiIndicatorHeatmap');
        if (savedState && Object.keys(savedState).length > 0) {
          const { selectedSymbol: symbol, tradingStyle: style, indicatorWeight, showNewSignals } = savedState;
          const allowedStyles = ['scalper','swingTrader'];
          const normalizedStyle = allowedStyles.includes(style) ? style : 'swingTrader';
          
          // Update local settings state
          setLocalSettings({
            symbol: symbol || selectedSymbol,
            tradingStyle: normalizedStyle || DEFAULT_TRADING_STYLE,
            indicatorWeight: indicatorWeight || 'equal',
            showNewSignals: showNewSignals !== undefined ? showNewSignals : true
          });

          // Update component state
          setCurrentSymbol(symbol || selectedSymbol);
          setTradingStyle(normalizedStyle || DEFAULT_TRADING_STYLE);
          _setIndicatorWeight(indicatorWeight || 'equal');
          _setShowNewSignals(showNewSignals !== undefined ? showNewSignals : true);
        }
      } catch (error) {
        console.error('Failed to load MultiIndicatorHeatmap state:', error);
      }
    };

    loadSettings();
  }, [selectedSymbol]);

  // Save settings to database using widget tab retention service
  const saveSettings = async (newSettings) => {
    try {
      const updatedSettings = {
        ...localSettings,
        ...newSettings
      };
      
      setLocalSettings(updatedSettings);
      
      // Map to widget state format
      const widgetState = {
        selectedSymbol: updatedSettings.symbol,
        tradingStyle: updatedSettings.tradingStyle,
        indicatorWeight: updatedSettings.indicatorWeight,
        showNewSignals: updatedSettings.showNewSignals
      };
      
      // Persist to database via widget retention service
      await widgetTabRetentionService.saveWidgetState('MultiIndicatorHeatmap', widgetState);
    } catch (error) {
      console.error('Failed to save MultiIndicatorHeatmap state:', error);
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
    _setIndicatorWeight(weight);
    await saveSettings({ indicatorWeight: weight });
  };

  // Handle show new signals change with persistence
  const _handleShowNewSignalsChange = async (show) => {
    _setShowNewSignals(show);
    await saveSettings({ showNewSignals: show });
  };

  // Alert handlers
  const handleBellClick = () => {
    setShowAlertConfig(true);
  };
  const _handleIndicatorConfigOpen = () => setShowIndicatorAlertConfig(true);
  const handleIndicatorConfigClose = () => setShowIndicatorAlertConfig(false);

  const handleAlertConfigClose = () => {
    setShowAlertConfig(false);
    // Refresh active alerts count when modal closes
    if (user) {
      const loadActiveAlertsCount = async () => {
        try {
          const alert = await heatmapTrackerAlertService.getActiveAlert();
          setActiveAlertsCount(alert ? 1 : 0);
        } catch (error) {
          console.error('Failed to load active alerts count:', error);
        }
      };
      loadActiveAlertsCount();
    }
  };

  // Load active alerts count when user is logged in
  useEffect(() => {
    if (user) {
      const loadActiveAlertsCount = async () => {
        try {
          const alert = await heatmapTrackerAlertService.getActiveAlert();
          setActiveAlertsCount(alert ? 1 : 0);
        } catch (error) {
          console.error('Failed to load active alerts count:', error);
        }
      };
      loadActiveAlertsCount();
    }
  }, [user]);

  // Frontend no longer evaluates or creates triggers; backend handles evaluation

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

  // Subscribe the current symbol to required multiple timeframes for heatmap
  useEffect(() => {
    if (!isConnected || !currentSymbol) return;
    const desiredTimeframes = ['1M', '5M', '15M', '30M', '1H', '4H', '1D'];
    const supported = Array.isArray(timeframes) && timeframes.length > 0 ? timeframes : desiredTimeframes;
    const toSubscribe = desiredTimeframes.filter(tf => supported.includes(tf));
    toSubscribe.forEach(tf => {
      try {
        subscribe(currentSymbol, tf, ['ticks', 'ohlc']);
      } catch (_e) {
        // swallow subscription errors
      }
    });
  }, [isConnected, currentSymbol, subscribe, timeframes]);

  // Remove heavy debug effect to reduce overhead
  // Remove local indicator calculations; use server quantum below
  
  // No local scoring; values are taken from server quantum only
  
  // Get cell color based on score (updated for new scoring range [-1.25, +1.25])
  // const getCellColor = (score) => {
  //   if (score > 0) return 'text-white border-0 shadow-md hover:opacity-75 focus:opacity-75';
  //   if (score < 0) return 'text-white border-0 shadow-md hover:opacity-75 focus:opacity-75';
  //   return 'bg-gray-300 text-gray-600 border-0 shadow-sm';
  // };
  
  // Server signal label
  const getSignalTextFromServer = (signal) => {
    if (signal === 'buy') return <span className="font-bold">BUY</span>;
    if (signal === 'sell') return <span className="font-bold">SELL</span>;
    return 'Neutral';
  };

  // Get actionable zone based on server final_score

  
  // Note: New signal detection is handled by the indicator calculation functions
  // The 'new' property is set by calculateEMASignals, calculateMACDSignals, etc.
  // This function is not used in the current implementation
  
  const indicators = ['EMA21', 'EMA50', 'EMA200', 'MACD', 'RSI', 'UTBOT', 'ICHIMOKU'];
  
  // Component rendering with trading style
  
  return (
    <>
    <div className="h-full flex flex-col" style={{position: 'relative'}} key={`heatmap-${tradingStyle}`}>
      {/* Header */}
      <div className="mb-0.5 px-2">
        {/* Top Row - Title with Dropdowns, and Controls */}
        {/* Mobile: wrap and stack, Desktop: single row */}
        <div className="widget-header flex flex-wrap items-start justify-between gap-1 mb-0.5">
          {/* Title with Dropdowns (mobile: stacked, desktop: inline) */}
          <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-1 md:space-x-2 flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-[#19235d] dark:text-white flex items-start tools-heading">
              <img src={quantImage} alt="Quantum" className="w-5 h-5 mr-2 flex-shrink-0" />
              Quantum Analysis
            </CardTitle>
            
            {/* Dropdowns row */}
            <div className="flex items-center space-x-2 gap-1 md:space-x-0.5">
            {/* Symbol Dropdown */}
            <div className="flex items-center space-x-0.5">
              <div className="relative" ref={symbolDropdownRef}>
                <div className="relative">
                  <button
                    onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                    className="appearance-none pl-2 pr-4 py-1.5 bg-transparent text-[#19235d] dark:text-white text-sm font-medium border-0 rounded transition-all duration-300 min-w-[120px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    {(() => {
                      const opt = dropdownOptions.find(opt => opt.value === currentSymbol);
                      if (!opt) return currentSymbol;
                      return (
                        <span className="inline-flex items-center gap-1.5">
                          {/* flags removed */}
                          <span className="text-sm font-medium">{opt.label}</span>
                          {/* flags removed */}
                        </span>
                      );
                    })()}
                  </button>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                    <svg className={`w-2 h-2 text-gray-500 dark:text-slate-400 transition-transform duration-200 ${isSymbolDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Custom Dropdown Menu */}
                  {isSymbolDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#19235d] border-0 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {dropdownOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleSymbolChange(option.value);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-[#19235d] transition-colors duration-150 ${
                            option.value === currentSymbol ? 'bg-blue-100 dark:bg-[#19235d] text-blue-800 dark:text-slate-200 font-medium' : 'text-[#19235d] dark:text-gray-200'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {/* flags removed */}
                            <span className="text-sm font-medium">{option.label}</span>
                            {/* flags removed */}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Style Dropdown */}
            <div className="flex items-center space-x-0.5">
              <div className="relative">
                <div 
                  onMouseEnter={(e) => {
                    const select = e.currentTarget.querySelector('select');
                    if (select) select.click();
                  }}
                >
                  <select
                    value={tradingStyle}
                    onChange={(e) => handleTradingStyleChange(e.target.value)}
                    className="appearance-none pl-2 pr-4 py-1.5 bg-transparent text-[#19235d] dark:text-white text-sm font-medium border-0 rounded transition-all duration-300 min-w-[80px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                  <option value="scalper">Scalper</option>
                  <option value="swingTrader">Swing Trader</option>
                  </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                  <svg className="w-2 h-2 text-gray-500 dark:text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            </div>
          </div>
          
          {/* Weights Dropdown
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-[#19235d]">Weights:</span>
            <div className="relative">
              <select
                value={indicatorWeight}
                onChange={(e) => handleIndicatorWeightChange(e.target.value)}
                className="appearance-none pl-2 pr-6 py-1 bg-orange-50 text-orange-900 rounded text-xs font-medium border-0 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 min-w-[70px] cursor-pointer hover:bg-orange-100"
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
            <span className="text-xs font-medium text-[#19235d]">New:</span>
            <div className="relative">
              <select
                value={showNewSignals ? 'on' : 'off'}
                onChange={(e) => handleShowNewSignalsChange(e.target.value === 'on')}
                className="appearance-none pl-2 pr-6 py-1 bg-green-50 text-green-900 rounded text-xs font-medium border-0 focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200 min-w-[60px] cursor-pointer hover:bg-green-100"
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
          
          {/* Controls Row - Right Side (vertically centered on mobile) */}
          <div className="flex items-center space-x-0.5 flex-wrap gap-0.5 self-center shrink-0 ml-2">
            {/* Alert Bell Icon */}
            {user && (
              <div className="flex items-center">
                <button 
                  type="button"
                  aria-label="Configure heatmap alerts"
                  onClick={handleBellClick}
                  className={`relative p-0.5 transition-colors duration-300 group ${
                    activeAlertsCount > 0
                      ? 'text-blue-600'
                      : 'text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area - More Space for Table */}
      <div className="lg:overflow-y-hidden overflow-y-auto" style={{
        height: 'auto',
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


      
      {/* Heatmap Table + Meter */}
      <div className="flex flex-col gap-0 h-full">
        {/* Header Row for Desktop Table and Meter */}
        <div className="hidden lg:flex gap-1.5 border-b border-gray-200 dark:border-[#19235d] pb-1">
          {/* Left: Table Headers */}
          <div className="flex-1 min-w-0">
            <table className="w-full border-collapse min-w-[560px] table-fixed" style={{tableLayout: 'fixed'}}>
              <thead>
                <tr>
                  <th className="text-left py-0.5 px-0.5 font-bold text-[#19235d] dark:text-gray-200 text-sm w-14"></th>
                  {indicators.map(indicator => (
                    <th key={indicator} className="text-center py-0.5 px-0.5 text-[#19235d] dark:text-gray-200" style={{width: `${504 / indicators.length}px`}}>
                      <span className="text-sm font-bold">{formatIndicatorDisplay(indicator)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>
          {/* Right: Trading Meter Header (desktop only) */}
          <div className="w-96 xl:w-[28rem] shrink-0 text-center py-0.5 px-0.5">
            <span className="text-sm font-bold text-[#19235d] dark:text-gray-200">Trading Meter</span>
          </div>
        </div>

        {/* Content Row - Desktop Layout */}
        <div className="hidden lg:flex gap-1.5 flex-1 min-h-0 pt-1.5 pl-4">
          {/* Left: Compact Table */}
          <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden lg:overflow-y-auto">
            <table className="w-full border-collapse min-w-[560px] table-fixed" style={{tableLayout: 'fixed'}}>
              <tbody>
              {(() => {
                const mcState = useMarketCacheStore.getState();
                const supportedTfs = Array.isArray(mcState.supportedTimeframes) && mcState.supportedTimeframes.length > 0 ? mcState.supportedTimeframes : ['1M','5M','15M','30M','1H','4H','1D'];
                const perTf = (mcState.quantumBySymbol.get(currentSymbol) || {}).per_timeframe || {};
                return [...new Set(supportedTfs)].filter(tf => tf !== '1W').map((timeframe) => (
                <tr key={timeframe} className="border-b border-slate-100/50 dark:border-[#19235d]/50">
                  <td className="py-0.5 pr-0.5 font-medium text-[#19235d] dark:text-gray-200 text-sm w-14">
                    <div className="flex items-center space-x-0.5">
                      <span className="text-sm font-medium">{formatTimeframeDisplay(timeframe)}</span>
                    </div>
                  </td>
                  {indicators.map(indicator => {
                    const tfData = perTf && perTf[timeframe];
                    const indData = tfData && tfData.indicators && tfData.indicators[indicator];
                    const hasData = !!indData;
                    const signal = (indData && indData.signal) || 'neutral';
                    const bgGradient = signal === 'buy' ? 'linear-gradient(to bottom right, #10b981, #16a34a)' : signal === 'sell' ? 'linear-gradient(to bottom right, #f15b5b, #e64c4c)' : '#f1f5f9';
                    const textColor = signal === 'neutral' ? '#19235d' : '#ffffff';
                    const cellBorderWidth = signal === 'neutral' ? '1px' : '0px';
                    const cellBorderColor = signal === 'neutral' ? '#e2e8f0' : 'transparent';
                    
                    return (
                      <td key={indicator} className="text-center py-0.5 px-0.5" style={{width: `${504 / indicators.length}px`}}>
                        <div className="relative h-full flex items-center justify-center">
                          <button 
                            className=""
                            style={hasData ? {
                              background: bgGradient,
                              borderRadius: '4px',
                              borderWidth: cellBorderWidth,
                              borderStyle: 'solid',
                              borderColor: cellBorderColor,
                              boxSizing: 'border-box',
                              color: textColor,
                              cursor: 'pointer',
                              display: 'inline-block',
                              fontFamily: 'Inter, system-ui, sans-serif',
                              fontSize: window.innerWidth < 768 ? '9.5px' : '11px',
                              fontWeight: '700',
                              lineHeight: '1.3',
                              margin: '0',
                              maxWidth: 'none',
                              minHeight: window.innerWidth < 768 ? '20px' : '28px',
                              minWidth: window.innerWidth < 768 ? '44px' : '62px',
                              outline: 'none',
                              overflow: 'hidden',
                              padding: window.innerWidth < 768 ? '3px 4px' : '4px 6px',
                              position: 'relative',
                              textAlign: 'center',
                              textTransform: 'none',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              touchAction: 'manipulation',
                              width: window.innerWidth < 768 ? '44px' : '62px',
                              height: window.innerWidth < 768 ? '20px' : '28px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)'
                            } : {
                              backgroundColor: '#f3f4f6',
                              color: '#19235d',
                              borderWidth: '2px',
                              borderStyle: 'dashed',
                              borderColor: '#19235d',
                              borderRadius: '4px',
                              boxSizing: 'border-box',
                              cursor: 'not-allowed',
                              display: 'inline-block',
                              fontFamily: 'Inter, system-ui, sans-serif',
                              fontSize: window.innerWidth < 768 ? '9.5px' : '11px',
                              fontWeight: '700',
                              lineHeight: '1.3',
                              margin: '0',
                              maxWidth: 'none',
                              minHeight: window.innerWidth < 768 ? '20px' : '28px',
                              minWidth: window.innerWidth < 768 ? '44px' : '62px',
                              outline: 'none',
                              overflow: 'hidden',
                              padding: window.innerWidth < 768 ? '3px 4px' : '4px 6px',
                              position: 'relative',
                              textAlign: 'center',
                              textTransform: 'none',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              touchAction: 'manipulation',
                              width: window.innerWidth < 768 ? '44px' : '62px',
                              height: window.innerWidth < 768 ? '20px' : '28px'
                            }}
                            title={hasData ? `Signal: ${signal}` : 'No data'}
                            disabled={!hasData}
                          >
                            {hasData ? getSignalTextFromServer(signal) : <span className="text-xs">⋯</span>}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Right: Buy/Sell Now Meter (desktop only) */}
        <div className="w-96 xl:w-[28rem] shrink-0 min-h-0 flex flex-col">
          {(() => {
            const mcState = useMarketCacheStore.getState();
            const styleKey = tradingStyle === 'swingTrader' ? 'swingtrader' : 'scalper';
            const qe = mcState.quantumBySymbol.get(currentSymbol);
            const ov = qe && qe.overall ? qe.overall[styleKey] : null;
            const buyPct = typeof ov?.buy_percent === 'number' ? ov.buy_percent : 50;
            const sellPct = typeof ov?.sell_percent === 'number' ? ov.sell_percent : (100 - buyPct);
            const score = buyPct - sellPct; // -100 (strong sell) .. +100 (strong buy)
            // Map score to needle angle: -90deg (left) .. +90deg (right)
            const angle = Math.max(-90, Math.min(90, (score / 100) * 90));
            // Determine dominant signal: >75% is "STRONG", otherwise just "BUY" or "SELL"
            let dominant;
            if (buyPct > 75) {
              dominant = 'STRONG BUY';
            } else if (sellPct > 75) {
              dominant = 'STRONG SELL';
            } else if (buyPct >= sellPct) {
              dominant = 'BUY';
            } else {
              dominant = 'SELL';
            }

            return (
              <Card className="flex-1 min-h-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-[#19235d] border-gray-200 dark:border-[#19235d] p-3 overflow-y-auto custom-scrollbar">
                {/* Gauge */}
                <div className="relative w-full" style={{ height: 130 }}>
                  <svg viewBox="0 0 200 110" className="w-full h-full">
                    <defs>
                      <linearGradient id="gaugeStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444"/>
                        <stop offset="50%" stopColor="#19235d"/>
                        <stop offset="100%" stopColor="#10b981"/>
                      </linearGradient>
                      <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#19235d" floodOpacity="0.35" />
                      </filter>
                    </defs>
                    {/* Track */}
                    <path d="M10,100 A90,90 0 0,1 190,100" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
                    {/* Colored stroke */}
                    <path d="M10,100 A90,90 0 0,1 190,100" fill="none" stroke="url(#gaugeStroke)" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
                    {/* Tick marks */}
                    {Array.from({length: 11}).map((_, i) => {
                      const t = i / 10; // 0..1
                      const ang = (-Math.PI / 2) + (Math.PI * t); // -90deg .. +90deg
                      const inner = 82; // inner radius for tick start
                      const outer = i % 5 === 0 ? 94 : 90; // longer for major ticks
                      const x1 = 100 + Math.cos(ang) * inner;
                      const y1 = 100 + Math.sin(ang) * inner;
                      const x2 = 100 + Math.cos(ang) * outer;
                      const y2 = 100 + Math.sin(ang) * outer;
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#cbd5e1"
                          strokeWidth={i % 5 === 0 ? 2 : 1}
                          strokeLinecap="round"
                        />
                      );
                    })}
                    {/* Numeric labels - 0 to 100% BUY */}
                    {([0.5, 1]).map((t, idx) => {
                      const values = ['0', '100'];
                      const labels = ['', 'BUY'];
                      const ang = (-Math.PI / 2) + (Math.PI * t);
                      const r = 74; // label radius
                      const tx = 100 + Math.cos(ang) * r;
                      const ty = 100 + Math.sin(ang) * r;
                      return (
                        <g key={`lbl-${idx}`}>
                          <text
                            x={tx}
                            y={ty - 4}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-[#19235d]"
                            style={{ fontSize: 11, fontWeight: 600 }}
                          >
                            {values[idx]}
                          </text>
                          {labels[idx] && (
                            <text
                              x={tx}
                              y={ty + 8}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-emerald-600"
                              style={{ fontSize: 8, fontWeight: 600 }}
                            >
                              {labels[idx]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* Needle */}
                    <g transform={`rotate(${angle} 100 100)`}>
                      <polygon points="100,22 95,100 105,100" fill="#7c3aed" />
                    </g>
                    {/* Pivot */}
                    <circle cx="100" cy="100" r="6" fill="#ffffff" stroke="#374151" strokeWidth="2" />
                  </svg>
                  {/* Labels */}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      SELL
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      BUY
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-bold ${buyPct > sellPct ? 'text-emerald-600' : 'text-rose-600'}`}>{dominant}</div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-rose-600">{sellPct.toFixed(0)}%</div>
                      <div className="text-gray-500 dark:text-gray-400">Sell</div>
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-600">{buyPct.toFixed(0)}%</div>
                      <div className="text-gray-500 dark:text-gray-400">Buy</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })()}
        </div>
        </div>

        {/* Mobile Layout - Trading Meter First, Then Table */}
        <div className="lg:hidden flex flex-col gap-3 pt-1.5">
          {/* Trading Meter Section - Above Table on Mobile */}
          <div className="w-full px-2">
            <div className="text-center py-1 mb-2 border-b border-gray-200 dark:border-slate-600 pb-3">
              <span className="text-sm font-bold text-[#19235d] dark:text-gray-200">Trading Meter</span>
            </div>
            {(() => {
              const mcState = useMarketCacheStore.getState();
              const styleKey = tradingStyle === 'swingTrader' ? 'swingtrader' : 'scalper';
              const qe = mcState.quantumBySymbol.get(currentSymbol);
              const ov = qe && qe.overall ? qe.overall[styleKey] : null;
              const buyPct = typeof ov?.buy_percent === 'number' ? ov.buy_percent : 50;
              const sellPct = typeof ov?.sell_percent === 'number' ? ov.sell_percent : (100 - buyPct);
              const score = buyPct - sellPct;
              const angle = Math.max(-90, Math.min(90, (score / 100) * 90));
              let dominant;
              if (buyPct > 75) {
                dominant = 'STRONG BUY';
              } else if (sellPct > 75) {
                dominant = 'STRONG SELL';
              } else if (buyPct >= sellPct) {
                dominant = 'BUY';
              } else {
                dominant = 'SELL';
              }

              return (
                <Card className="shadow-lg bg-white dark:bg-[#19235d] border-gray-200 dark:border-gray-700 p-3">
                  <div className="relative w-full" style={{ height: 130 }}>
                    <svg viewBox="0 0 200 110" className="w-full h-full">
                      <defs>
                        <linearGradient id="gaugeStrokeMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444"/>
                          <stop offset="50%" stopColor="#19235d"/>
                          <stop offset="100%" stopColor="#10b981"/>
                        </linearGradient>
                      </defs>
                      <path d="M10,100 A90,90 0 0,1 190,100" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
                      <path d="M10,100 A90,90 0 0,1 190,100" fill="none" stroke="url(#gaugeStrokeMobile)" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
                      {Array.from({length: 11}).map((_, i) => {
                        const t = i / 10;
                        const ang = (-Math.PI / 2) + (Math.PI * t);
                        const x1 = 100 + 85 * Math.cos(ang);
                        const y1 = 100 + 85 * Math.sin(ang);
                        const x2 = 100 + 95 * Math.cos(ang);
                        const y2 = 100 + 95 * Math.sin(ang);
                        const labels = ['-100', '-80', '-60', '-40', '-20', '0', '20', '40', '60', '80', '100'];
                        return (
                          <g key={i}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#19235d" strokeWidth="2" strokeLinecap="round" />
                            {i % 2 === 0 && (
                              <text 
                                x={100 + 70 * Math.cos(ang)} 
                                y={100 + 70 * Math.sin(ang)} 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                className="fill-emerald-600"
                                style={{ fontSize: 8, fontWeight: 600 }}
                              >
                                {labels[i]}
                              </text>
                            )}
                          </g>
                        );
                      })}
                      {/* Needle */}
                      <g transform={`rotate(${angle} 100 100)`}>
                        <polygon points="100,22 95,100 105,100" fill="#7c3aed" />
                      </g>
                      {/* Pivot */}
                      <circle cx="100" cy="100" r="6" fill="#ffffff" stroke="#374151" strokeWidth="2" />
                    </svg>
                    {/* Labels */}
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        SELL
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        BUY
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-bold ${buyPct > sellPct ? 'text-emerald-600' : 'text-rose-600'}`}>{dominant}</div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-semibold text-rose-600">{sellPct.toFixed(0)}%</div>
                        <div className="text-gray-500 dark:text-gray-400">Sell</div>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-600">{buyPct.toFixed(0)}%</div>
                        <div className="text-gray-500 dark:text-gray-400">Buy</div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>

          {/* Table Section with Header - Single Scrollable Container */}
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <table className="w-full border-collapse min-w-[560px] table-fixed" style={{tableLayout: 'fixed'}}>
              {/* Mobile Table Header */}
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-600">
                  <th className="text-left py-0.5 px-0.5 font-bold text-[#19235d] dark:text-gray-200 text-sm w-14"></th>
                  {indicators.map(indicator => (
                    <th key={indicator} className="text-center py-0.5 px-0.5 text-[#19235d] dark:text-gray-200" style={{width: `${504 / indicators.length}px`}}>
                      <span className="text-sm font-bold">{formatIndicatorDisplay(indicator)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              {/* Mobile Table Body */}
              <tbody>
              {(() => {
                const mcState = useMarketCacheStore.getState();
                const supportedTfs = Array.isArray(mcState.supportedTimeframes) && mcState.supportedTimeframes.length > 0 ? mcState.supportedTimeframes : ['1M','5M','15M','30M','1H','4H','1D'];
                const perTf = (mcState.quantumBySymbol.get(currentSymbol) || {}).per_timeframe || {};
                return [...new Set(supportedTfs)].filter(tf => tf !== '1W').map((timeframe) => (
                <tr key={timeframe} className="border-b border-slate-100/50 dark:border-[#19235d]/50">
                  <td className="py-0.5 pr-0.5 font-medium text-[#19235d] dark:text-gray-200 text-sm w-14">
                    <div className="flex items-center space-x-0.5">
                      <span className="text-sm font-medium">{formatTimeframeDisplay(timeframe)}</span>
                    </div>
                  </td>
                  {indicators.map(indicator => {
                    const tfData = perTf && perTf[timeframe];
                    const indData = tfData && tfData.indicators && tfData.indicators[indicator];
                    const hasData = !!indData;
                    const signal = (indData && indData.signal) || 'neutral';
                    const bgGradient = signal === 'buy' ? 'linear-gradient(to bottom right, #10b981, #16a34a)' : signal === 'sell' ? 'linear-gradient(to bottom right, #f15b5b, #e64c4c)' : '#f1f5f9';
                    const textColor = signal === 'neutral' ? '#19235d' : '#ffffff';
                    const cellBorderWidth = signal === 'neutral' ? '1px' : '0px';
                    const cellBorderColor = signal === 'neutral' ? '#e2e8f0' : 'transparent';
                    
                    return (
                      <td key={indicator} className="text-center py-0.5 px-0.5" style={{width: `${504 / indicators.length}px`}}>
                        <div className="relative h-full flex items-center justify-center">
                          <button 
                            className=""
                            style={hasData ? {
                              background: bgGradient,
                              borderRadius: '4px',
                              borderWidth: cellBorderWidth,
                              borderStyle: 'solid',
                              borderColor: cellBorderColor,
                              boxSizing: 'border-box',
                              color: textColor,
                              cursor: 'pointer',
                              display: 'inline-block',
                              fontFamily: 'Inter, system-ui, sans-serif',
                              fontSize: window.innerWidth < 768 ? '9.5px' : '11px',
                              fontWeight: '700',
                              lineHeight: '1.3',
                              margin: '0',
                              maxWidth: 'none',
                              minHeight: window.innerWidth < 768 ? '20px' : '28px',
                              minWidth: window.innerWidth < 768 ? '44px' : '62px',
                              outline: 'none',
                              overflow: 'hidden',
                              padding: window.innerWidth < 768 ? '3px 4px' : '4px 6px',
                              position: 'relative',
                              textAlign: 'center',
                              textTransform: 'none',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              touchAction: 'manipulation',
                              width: window.innerWidth < 768 ? '44px' : '62px',
                              height: window.innerWidth < 768 ? '20px' : '28px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)'
                            } : {
                              backgroundColor: '#f3f4f6',
                              color: '#19235d',
                              borderWidth: '2px',
                              borderStyle: 'dashed',
                              borderColor: '#19235d',
                              borderRadius: '4px',
                              boxSizing: 'border-box',
                              cursor: 'not-allowed',
                              display: 'inline-block',
                              fontFamily: 'Inter, system-ui, sans-serif',
                              fontSize: window.innerWidth < 768 ? '9.5px' : '11px',
                              fontWeight: '700',
                              lineHeight: '1.3',
                              margin: '0',
                              maxWidth: 'none',
                              minHeight: window.innerWidth < 768 ? '20px' : '28px',
                              minWidth: window.innerWidth < 768 ? '44px' : '62px',
                              outline: 'none',
                              overflow: 'hidden',
                              padding: window.innerWidth < 768 ? '3px 4px' : '4px 6px',
                              position: 'relative',
                              textAlign: 'center',
                              textTransform: 'none',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              touchAction: 'manipulation',
                              width: window.innerWidth < 768 ? '44px' : '62px',
                              height: window.innerWidth < 768 ? '20px' : '28px'
                            }}
                            title={hasData ? `Signal: ${signal}` : 'No data'}
                            disabled={!hasData}
                          >
                            {hasData ? getSignalTextFromServer(signal) : <span className="text-xs">⋯</span>}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        </div>
      </div>
      </div>
    </div>
    
    {/* Heatmap Alert Configuration Modal - Outside widget for proper z-index */}
    <HeatmapTrackerAlertConfig 
      isOpen={showAlertConfig} 
      onClose={handleAlertConfigClose} 
    />
    <HeatmapIndicatorTrackerAlertConfig
      isOpen={showIndicatorAlertConfig}
      onClose={handleIndicatorConfigClose}
    />
    </>
  );
};

export default MultiIndicatorHeatmap;
