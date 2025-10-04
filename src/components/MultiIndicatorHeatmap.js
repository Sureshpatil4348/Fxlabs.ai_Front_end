import { 
  Bell,
  Sliders
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';


import HeatmapIndicatorTrackerAlertConfig from './HeatmapIndicatorTrackerAlertConfig';
import HeatmapTrackerAlertConfig from './HeatmapTrackerAlertConfig';
import quantImage from '../assets/quant.png';
import { useAuth } from '../auth/AuthProvider';
import heatmapTrackerAlertService from '../services/heatmapTrackerAlertService';
import userStateService from '../services/userStateService';
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

  // Build dropdown options with simple text
  const dropdownOptions = useMemo(() => {
    return availableSymbols.map((sym) => {
      const clean = sym.replace(/m$/, '').toUpperCase();
      // Display as ABC/DEF for user clarity
      const pretty = clean.length === 6 ? `${clean.slice(0, 3)}/${clean.slice(3)}` : clean;
      return { value: sym, label: pretty };
    });
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

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await userStateService.getUserDashboardSettings();
        if (savedSettings.multiIndicatorHeatmap) {
          const { symbol, tradingStyle, indicatorWeight, showNewSignals } = savedSettings.multiIndicatorHeatmap;
          const allowedStyles = ['scalper','swingTrader'];
          const normalizedStyle = allowedStyles.includes(tradingStyle) ? tradingStyle : 'swingTrader';
          
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
  const handleIndicatorConfigOpen = () => setShowIndicatorAlertConfig(true);
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
  const getActionableZone = (finalScore, tradingStyle = 'swingTrader') => {
    // Style-specific sensitivity thresholds
    const thresholds = {
      'scalper': 25,
      'swingTrader': 15
    };
    
    const threshold = thresholds[tradingStyle] || 20;
    
    if (typeof finalScore !== 'number') return 'wait';
    if (finalScore >= threshold) return 'buy';
    if (finalScore <= -threshold) return 'sell';
    return 'wait';
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
  
  const indicators = ['EMA21', 'EMA50', 'EMA200', 'MACD', 'RSI', 'UTBOT', 'ICHIMOKU'];
  
  // Component rendering with trading style
  
  return (
    <>
    <div className="widget-card h-full flex flex-col" style={{position: 'relative'}} key={`heatmap-${tradingStyle}`}>
      {/* Header */}
      <div className="mb-2 px-4">
        {/* Top Row - Title, Trading Signals, and Controls */}
        <div className="widget-header flex items-center justify-between mb-2">
          {/* Title */}
          <div className="flex items-center space-x-2">
            <img src={quantImage} alt="Quantum" className="w-5 h-5" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Quantum Analysis</h2>
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center space-x-1">
          {/* Alert Bell Icon */}
          {user && (
            <div className="flex items-center">
              <button 
                type="button"
                aria-label="Configure heatmap alerts"
                onClick={handleBellClick}
                className="relative p-1 text-gray-400 hover:text-blue-500 transition-colors duration-300 group"
              >
                <Bell className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                {activeAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
                  </span>
                )}
              </button>
              <button 
                type="button"
                aria-label="Configure custom indicator alert"
                onClick={handleIndicatorConfigOpen}
                className="relative p-1 text-gray-400 hover:text-indigo-500 transition-colors duration-300 group ml-1"
              >
                <Sliders className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          )}
          
          {/* Symbol Dropdown */}
          <div className="flex items-center space-x-1">
            <div className="relative" ref={symbolDropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                  className="appearance-none pl-2 pr-4 py-1.5 bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold border-0 rounded transition-all duration-300 min-w-[80px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  {dropdownOptions.find(opt => opt.value === currentSymbol)?.label || currentSymbol}
                </button>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                  <svg className={`w-2 h-2 text-gray-500 dark:text-slate-400 transition-transform duration-200 ${isSymbolDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Custom Dropdown Menu */}
                {isSymbolDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border-0 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {dropdownOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleSymbolChange(option.value);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                          option.value === currentSymbol ? 'bg-blue-100 dark:bg-slate-600 text-blue-800 dark:text-slate-200 font-semibold' : 'text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Style Dropdown */}
          <div className="flex items-center space-x-1">
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
                  className="appearance-none pl-2 pr-4 py-1.5 bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold border-0 rounded transition-all duration-300 min-w-[80px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
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
          
          {/* Weights Dropdown
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-gray-700">Weights:</span>
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
            <span className="text-xs font-medium text-gray-700">New:</span>
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

      {/* Server-driven only; remove quiet-market client badge */}

      {/* Current Actionable Zone Indicator - Only show for high probability zones (server-based) */}
      {(() => {
        const mcState = useMarketCacheStore.getState();
        const qEntry = mcState.quantumBySymbol.get(currentSymbol);
        const styleKey = tradingStyle === 'swingTrader' ? 'swingtrader' : 'scalper';
        const overall = qEntry && qEntry.overall ? qEntry.overall[styleKey] : null;
        const zone = getActionableZone(overall?.final_score, tradingStyle);
        const _styling = getZoneStyling(zone);
        
        // Only show if it's a high probability zone (Buy or Sell), not Wait/Neutral
        if (zone === 'wait') return null;
        return (
          <div className={`mb-1 p-1 rounded-lg border ${_styling.bgClass} ${_styling.borderClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${_styling.textClass}`}>{_styling.label}</span>
              {overall && (
                <span className={`text-xs ${_styling.valueClass}`}>{Math.round((overall.final_score || 0) * 10) / 10}</span>
              )}
            </div>
          </div>
        );
      })()}

      
      {/* Heatmap Table - Full Height (server quantum only) */}
      <div className="overflow-x-auto overflow-y-hidden lg:overflow-y-auto flex-1 min-w-0 min-h-0">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-600">
              <th className="text-left py-0.5 sm:py-1 px-1 font-bold text-gray-700 dark:text-slate-300 text-sm w-20"></th>
              {indicators.map(indicator => (
                <th key={indicator} className="text-center py-0.5 sm:py-1 px-0.5 text-gray-700 dark:text-slate-300">
                  <span className="text-sm font-bold">{formatIndicatorDisplay(indicator)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const mcState = useMarketCacheStore.getState();
              const supportedTfs = Array.isArray(mcState.supportedTimeframes) && mcState.supportedTimeframes.length > 0 ? mcState.supportedTimeframes : ['1M','5M','15M','30M','1H','4H','1D'];
              const perTf = (mcState.quantumBySymbol.get(currentSymbol) || {}).per_timeframe || {};
              return [...new Set(supportedTfs)].filter(tf => tf !== '1W').map((timeframe) => (
              <tr key={timeframe} className="border-b border-slate-100/50 dark:border-slate-700/50">
                <td className="py-0.5 sm:py-1 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs">
                  <div className="flex items-center space-x-1 ml-2">
                    <span className="text-sm font-normal">{formatTimeframeDisplay(timeframe)}</span>
                  </div>
                </td>
                {indicators.map(indicator => {
                  const tfData = perTf && perTf[timeframe];
                  const indData = tfData && tfData.indicators && tfData.indicators[indicator];
                  const hasData = !!indData;
                  const signal = (indData && indData.signal) || 'neutral';
                  const bgColor = signal === 'buy' ? '#03c05d' : signal === 'sell' ? '#e03f4c' : '#9ca3af';
                  
                  return (
                    <td key={indicator} className="text-center py-1 px-1">
                      <div className="relative h-full flex items-center justify-center">
                        <button 
                          className=""
                          style={hasData ? {
                            backgroundColor: bgColor,
                            borderRadius: '4px',
                            // Avoid mixing shorthand/non-shorthand border props across renders
                            borderWidth: '0px',
                            borderStyle: 'solid',
                            borderColor: 'transparent',
                            boxSizing: 'border-box',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'inline-block',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: window.innerWidth < 768 ? '10px' : '12px',
                            fontWeight: '700',
                            lineHeight: '1.5',
                            margin: '0',
                            maxWidth: 'none',
                            minHeight: window.innerWidth < 768 ? '24px' : '32px',
                            minWidth: window.innerWidth < 768 ? '48px' : '64px',
                            outline: 'none',
                            overflow: 'hidden',
                            padding: window.innerWidth < 768 ? '4px 6px' : '6px 8px',
                            position: 'relative',
                            textAlign: 'center',
                            textTransform: 'none',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            touchAction: 'manipulation',
                            width: window.innerWidth < 768 ? '48px' : '64px',
                            height: window.innerWidth < 768 ? '24px' : '32px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'
                          } : {
                            backgroundColor: '#f3f4f6',
                            color: '#9ca3af',
                            borderWidth: '2px',
                            borderStyle: 'dashed',
                            borderColor: '#d1d5db',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            cursor: 'not-allowed',
                            display: 'inline-block',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: window.innerWidth < 768 ? '10px' : '12px',
                            fontWeight: '700',
                            lineHeight: '1.5',
                            margin: '0',
                            maxWidth: 'none',
                            minHeight: window.innerWidth < 768 ? '24px' : '32px',
                            minWidth: window.innerWidth < 768 ? '48px' : '64px',
                            outline: 'none',
                            overflow: 'hidden',
                            padding: window.innerWidth < 768 ? '4px 6px' : '6px 8px',
                            position: 'relative',
                            textAlign: 'center',
                            textTransform: 'none',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            touchAction: 'manipulation',
                            width: '64px',
                            height: '32px'
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
            
            {/* Buy/Sell Progress Bar Row */}
            {(() => {
              const mcState = useMarketCacheStore.getState();
              const supportedTfs = Array.isArray(mcState.supportedTimeframes) && mcState.supportedTimeframes.length > 0 ? mcState.supportedTimeframes : ['1M','5M','15M','30M','1H','4H','1D'];
              return (
                <tr className="border-b-0" style={{ height: 'calc(100% / ' + ([...new Set(supportedTfs)].filter(tf => tf !== '1W').length + 1) + ')' }}>
              <td className="py-0.5 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs">
                <div className="flex items-center space-x-1 ml-2">
                </div>
              </td>
              <td colSpan={indicators.length} className="py-1 px-1">
                <div className="flex items-center justify-center">
                  {(() => {
                    const styleKey = tradingStyle === 'swingTrader' ? 'swingtrader' : 'scalper';
                    const qe = mcState.quantumBySymbol.get(currentSymbol);
                    const ov = qe && qe.overall ? qe.overall[styleKey] : null;
                    const buyPct = typeof ov?.buy_percent === 'number' ? ov.buy_percent : 50;
                    const sellPct = typeof ov?.sell_percent === 'number' ? ov.sell_percent : (100 - buyPct);
                    
                    return (
                      <div className="flex items-center gap-3 w-full">
                        <span 
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap -ml-16"
                        >BUY {buyPct.toFixed(1)}%</span>
                        <div className="flex-1 relative">
                          <div className="w-full h-4 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500 ease-out"
                              style={{ 
                                width: `${buyPct}%`,
                                background: '#03c05d',
                                borderRadius: '8px 0 0 8px'
                              }}
                            />
                            <div 
                              className="absolute top-0 h-full transition-all duration-500 ease-out"
                              style={{ 
                                left: `${buyPct}%`,
                                width: `${sellPct}%`,
                                background: '#dc2626',
                                borderRadius: '0 8px 8px 0'
                              }}
                            />
                          </div>
                        </div>
                        <span 
                          className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap m-2"
                        >SELL {sellPct.toFixed(1)}%</span>
                      </div>
                    );
                  })()}
                </div>
              </td>
            </tr>
              );
            })()}
          </tbody>
        </table>
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
