import { RefreshCw, Plus, Minus, Settings, BarChart3, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import userStateService from '../services/userStateService';
import useRSICorrelationStore from '../store/useRSICorrelationStore';
import { formatSymbolDisplay, formatRsi, sortCorrelationPairs } from '../utils/formatters';

const CorrelationPairCard = ({ pairKey, pairData, pair, calculationMode, realCorrelationData, isMobile = false }) => {
  const [symbol1, symbol2] = pair;
  
  if (calculationMode === 'real_correlation') {
    const correlationData = realCorrelationData.get(pairKey);
    if (!correlationData) {
      return (
        <div className="p-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Calculating...</span>
        </div>
      );
    }
    
    const { correlation, strength: _strength, type } = correlationData;
    const correlationValue = (correlation * 100).toFixed(1);
    
    // Determine color based on correlation type (positive/negative) and strength for highlighting
    let cardColor, strengthColor, highlightClass;
    
    // Check if pair matches (strong correlation) or doesn't match (weak correlation)
    const isMatch = correlationData.strength === 'strong';
    const isMismatch = correlationData.strength === 'weak';
    
    if (isMatch) {
      // Unique highlighting for matching pairs
      if (type === 'positive') {
        cardColor = 'border-emerald-400 bg-gradient-to-br from-emerald-100 to-green-200 shadow-lg ring-2 ring-emerald-200';
        strengthColor = 'text-emerald-800';
        highlightClass = '';
      } else {
        cardColor = 'border-red-400 bg-gradient-to-br from-red-100 to-rose-200 shadow-lg ring-2 ring-red-200';
        strengthColor = 'text-red-800';
        highlightClass = '';
      }
    } else if (isMismatch) {
      // Grey highlighting for non-matching pairs
      cardColor = 'border-gray-400 bg-gradient-to-br from-gray-100 to-slate-200 shadow-sm';
      strengthColor = 'text-gray-600';
      highlightClass = '';
    } else {
      // Moderate correlation - neutral styling
      if (type === 'positive') {
        cardColor = 'border-green-300 bg-green-50';
        strengthColor = 'text-green-700';
      } else {
        cardColor = 'border-red-300 bg-red-50';
        strengthColor = 'text-red-700';
      }
      highlightClass = '';
    }
    
    if (isMobile) {
      return (
        <div className={`p-1 pr-2 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}>
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center space-x-1">
              <span className={`text-lg font-black ${strengthColor}`}>
                {type === 'positive' ? (
                  <span className="flex items-center">
                    <Plus className="w-6 h-6 mr-2 font-black stroke-2" />
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Minus className="w-6 h-6 mr-2 font-black stroke-2" />
                  </span>
                )}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {formatSymbolDisplay(symbol1)} / {formatSymbolDisplay(symbol2)}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-xs ${strengthColor}`}>
                {correlationValue}%
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-0.5 pr-1 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}>
        <div className="mb-0 text-center">
          <div className="flex items-center justify-center">
            <span className={`text-sm font-black ${strengthColor}`}>
              {type === 'positive' ? (
                <span className="flex items-center">
                  <Plus className="w-5 h-5 mr-1 font-black stroke-2" />
                </span>
              ) : (
                <span className="flex items-center">
                  <Minus className="w-5 h-5 mr-1 font-black stroke-2" />
                </span>
              )}
            </span>
          </div>
          <div className="text-center">
            {/* Strength keyword removed */}
          </div>
        </div>
        
        <div>
          <div className="grid grid-cols-2 gap-0 text-xs">
            <div className="text-center p-0 bg-opacity-50 rounded transition-all duration-300">
              <div className={`font-normal text-[8px] ${strengthColor}`}>{formatSymbolDisplay(symbol1)}</div>
            </div>
            <div className="text-center p-0 bg-opacity-50 rounded transition-all duration-300">
              <div className={`font-normal text-[8px] ${strengthColor}`}>{formatSymbolDisplay(symbol2)}</div>
            </div>
          </div>
          <div className={`text-center p-0 rounded text-xs font-semibold ${strengthColor}`}>
            {correlationValue}%
          </div>
        </div>
      </div>
    );
  }
  
  // Original RSI threshold mode
  const { status, rsi1, rsi2, type } = pairData;
  
  // Determine card color and text color based on correlation type and status for RSI threshold mode
  let cardColor, strengthColor, highlightClass;
  
  // Check if pair matches or doesn't match based on status
  const isMatch = status === 'match';
  const isMismatch = status === 'mismatch';
  
  if (isMatch) {
    // Unique highlighting for matching pairs
    if (type === 'positive') {
      cardColor = 'border-emerald-400 bg-gradient-to-br from-emerald-100 to-green-200 shadow-lg ring-2 ring-emerald-200';
      strengthColor = 'text-emerald-800';
      highlightClass = '';
    } else {
      cardColor = 'border-red-400 bg-gradient-to-br from-red-100 to-rose-200 shadow-lg ring-2 ring-red-200';
      strengthColor = 'text-red-800';
      highlightClass = '';
    }
  } else if (isMismatch) {
    // Grey highlighting for non-matching pairs
    cardColor = 'border-gray-400 bg-gradient-to-br from-gray-100 to-slate-200 shadow-sm';
    strengthColor = 'text-gray-600';
    highlightClass = '';
  } else {
    // Neutral status - standard styling
    if (type === 'positive') {
      cardColor = 'border-green-300 bg-green-50';
      strengthColor = 'text-green-700';
    } else {
      cardColor = 'border-red-300 bg-red-50';
      strengthColor = 'text-red-700';
    }
    highlightClass = '';
  }

  if (isMobile) {
    return (
      <div className={`p-1 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center space-x-1">
            <span className="text-lg font-black">
              {type === 'positive' ? (
                <span className="flex items-center text-green-600">
                  <Plus className="w-6 h-6 mr-2 font-black stroke-2" />
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <Minus className="w-6 h-6 mr-2 font-black stroke-2" />
                </span>
              )}
            </span>
            <span className={`text-sm font-medium ${strengthColor}`}>
              {formatSymbolDisplay(symbol1)} / {formatSymbolDisplay(symbol2)}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-xs ${strengthColor}`}>
              RSI: {formatRsi(rsi1)} / {formatRsi(rsi2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-0.5 pr-1 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}>
      <div className="mb-0 text-center">
        <div className="flex items-center justify-center">
          <span className="text-sm font-black">
            {type === 'positive' ? (
              <span className="flex items-center text-green-600">
                <Plus className="w-5 h-5 mr-1 font-black stroke-2" />
              </span>
            ) : (
              <span className="flex items-center text-red-600">
                <Minus className="w-5 h-5 mr-1 font-black stroke-2" />
              </span>
            )}
          </span>
        </div>
      </div>
      
      <div className="space-y-0">
        <div className="grid grid-cols-2 gap-0 text-xs">
          <div className="text-center p-0 bg-opacity-50 rounded transition-all duration-300">
            <div className={`font-normal text-[8px] ${strengthColor}`}>{formatSymbolDisplay(symbol1)}</div>
            <div className={`font-semibold text-sm transition-all duration-300 ${strengthColor}`}>{formatRsi(rsi1)}</div>
          </div>
          <div className="text-center p-0 bg-opacity-50 rounded transition-all duration-300">
            <div className={`font-normal text-[8px] ${strengthColor}`}>{formatSymbolDisplay(symbol2)}</div>
            <div className={`font-semibold text-sm transition-all duration-300 ${strengthColor}`}>{formatRsi(rsi2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RSICorrelationDashboard = () => {
  const { 
    correlationStatus, 
    realCorrelationData,
    settings,
    recalculateAllRsi,
    calculateAllCorrelations,
    subscriptions,
    isConnected,
    updateSettings,
    autoSubscribeToCorrelationPairs,
    timeframes,
    correlationWindows
  } = useRSICorrelationStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    rsiPeriod: settings.rsiPeriod,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold,
    correlationWindow: settings.correlationWindow,
    calculationMode: settings.calculationMode
  });

  // Auto-subscribe to correlation pairs when connection is established (only once)
  useEffect(() => {
    if (!isConnected || hasAutoSubscribed) {
      return;
    }

    // Small delay to ensure connection is fully established
    const timer = setTimeout(() => {
      autoSubscribeToCorrelationPairs();
      setHasAutoSubscribed(true);
    }, 1000); // 1 second delay to ensure connection is stable

    return () => clearTimeout(timer);
  }, [isConnected, hasAutoSubscribed, autoSubscribeToCorrelationPairs]);

  // Trigger initial calculations when we have data
  useEffect(() => {
    if (subscriptions.size > 0) {
      if (localSettings.calculationMode === 'real_correlation') {
        calculateAllCorrelations();
      } else {
        recalculateAllRsi();
      }
    }
  }, [subscriptions.size, localSettings.calculationMode, recalculateAllRsi, calculateAllCorrelations]);

  // React to data changes to ensure UI updates
  useEffect(() => {
  }, [correlationStatus, realCorrelationData]);

  // Reset hasAutoSubscribed when timeframe changes to ensure re-subscription
  useEffect(() => {
    setHasAutoSubscribed(false);
  }, [settings.timeframe]);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await userStateService.getUserDashboardSettings();
        if (savedSettings.rsiCorrelation) {
          const { timeframe, rsiPeriod, rsiOverbought, rsiOversold, correlationWindow, calculationMode } = savedSettings.rsiCorrelation;
          
          // Update local settings state
          setLocalSettings({
            timeframe: timeframe || settings.timeframe,
            rsiPeriod: rsiPeriod || settings.rsiPeriod,
            rsiOverbought: rsiOverbought || settings.rsiOverbought,
            rsiOversold: rsiOversold || settings.rsiOversold,
            correlationWindow: correlationWindow || settings.correlationWindow,
            calculationMode: calculationMode || settings.calculationMode
          });

          // Update store settings
          updateSettings({
            timeframe: timeframe || settings.timeframe,
            rsiPeriod: rsiPeriod || settings.rsiPeriod,
            rsiOverbought: rsiOverbought || settings.rsiOverbought,
            rsiOversold: rsiOversold || settings.rsiOversold,
            correlationWindow: correlationWindow || settings.correlationWindow,
            calculationMode: calculationMode || settings.calculationMode
          });

        }
      } catch (error) {
        console.error('❌ Failed to load RSI Correlation settings:', error);
      }
    };

    loadSettings();
  }, [settings.calculationMode, settings.correlationWindow, settings.rsiOverbought, settings.rsiOversold, settings.rsiPeriod, settings.timeframe, updateSettings]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (localSettings.calculationMode === 'real_correlation') {
      calculateAllCorrelations();
    } else {
      recalculateAllRsi();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSaveSettings = async () => {
    try {
      // Update local store first
      updateSettings({
        timeframe: localSettings.timeframe,
        rsiPeriod: localSettings.rsiPeriod,
        rsiOverbought: localSettings.rsiOverbought,
        rsiOversold: localSettings.rsiOversold,
        correlationWindow: localSettings.correlationWindow,
        calculationMode: localSettings.calculationMode
      });

      // Persist to database
      await userStateService.updateUserDashboardSettings({
        rsiCorrelation: {
          timeframe: localSettings.timeframe,
          rsiPeriod: localSettings.rsiPeriod,
          rsiOverbought: localSettings.rsiOverbought,
          rsiOversold: localSettings.rsiOversold,
          correlationWindow: localSettings.correlationWindow,
          calculationMode: localSettings.calculationMode
        }
      });

      setShowSettings(false);
    } catch (error) {
      console.error('❌ Failed to save RSI Correlation settings:', error);
    }
  };

  const handleResetSettings = () => {
    setLocalSettings({
      timeframe: settings.timeframe,
      rsiPeriod: settings.rsiPeriod,
      rsiOverbought: settings.rsiOverbought,
      rsiOversold: settings.rsiOversold,
      correlationWindow: settings.correlationWindow,
      calculationMode: settings.calculationMode
    });
  };

  const handleCalculationModeToggle = () => {
    const newMode = localSettings.calculationMode === 'rsi_threshold' ? 'real_correlation' : 'rsi_threshold';
    setLocalSettings(prev => ({ ...prev, calculationMode: newMode }));
  };

  // Get sorted pairs based on calculation mode
  let sortedPairs;
  if (localSettings.calculationMode === 'real_correlation') {
    sortedPairs = Array.from(realCorrelationData.entries()).sort(([, a], [, b]) => {
      // Prioritize mismatches (weak correlations) first, then non-neutral pairs
      if (a.strength === 'weak' && b.strength !== 'weak') return -1;
      if (a.strength !== 'weak' && b.strength === 'weak') return 1;
      
      // Within non-neutral pairs, prioritize strong over moderate
      if (a.strength !== 'weak' && b.strength !== 'weak') {
        if (a.strength === 'strong' && b.strength === 'moderate') return -1;
        if (a.strength === 'moderate' && b.strength === 'strong') return 1;
      }
      
      // Within same strength, sort by correlation strength (absolute value)
      return Math.abs(b.correlation) - Math.abs(a.correlation);
    });
  } else {
    sortedPairs = sortCorrelationPairs(correlationStatus);
  }
  
  // Prepare data for grid display (expand to accommodate all pairs)
  const gridPairs = sortedPairs;
  
  // Calculate statistics based on calculation mode
  let totalPairs, _matches, _mismatches, _neutral;
  
  if (localSettings.calculationMode === 'real_correlation') {
    totalPairs = sortedPairs.length;
    const strongCorrelations = sortedPairs.filter(([, data]) => data.strength === 'strong').length;
    const moderateCorrelations = sortedPairs.filter(([, data]) => data.strength === 'moderate').length;
    const weakCorrelations = sortedPairs.filter(([, data]) => data.strength === 'weak').length;
    
    _matches = strongCorrelations;
    _mismatches = weakCorrelations;
    _neutral = moderateCorrelations;
  } else {
    totalPairs = sortedPairs.length;
    _matches = sortedPairs.filter(([, data]) => data.status === 'match').length;
    _mismatches = sortedPairs.filter(([, data]) => data.status === 'mismatch').length;
    _neutral = sortedPairs.filter(([, data]) => data.status === 'neutral').length;
  }

  return (
    <div className="bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm px-4 pt-4 pb-1 z-10 relative h-full flex flex-col mb-[15px]">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">RSI Correlation Dashboard</h2>
            </div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium w-fit shadow-md transition-all duration-300 ${
              isConnected ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200/50' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200/50'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {/* Total Pairs Pill */}
            <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-medium shadow-md border border-blue-200/50">
              <Activity className="w-3 h-3 mr-1" />
              <span className="font-bold mr-1">{totalPairs}</span>
              <span>Total Pairs</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {localSettings.calculationMode === 'real_correlation' ? (
              `Correlation Window: ${localSettings.correlationWindow} | ${localSettings.timeframe}`
            ) : (
              `Period: ${localSettings.rsiPeriod} | Overbought: ${localSettings.rsiOverbought} | Oversold: ${localSettings.rsiOversold} | ${localSettings.timeframe}`
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Calculation Mode Toggle */}
          <button
            onClick={handleCalculationModeToggle}
            className={`px-3 py-2 text-xs font-medium rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 ${
              localSettings.calculationMode === 'real_correlation'
                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50'
                : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200/50'
            }`}
            title={`Switch to ${localSettings.calculationMode === 'rsi_threshold' ? 'Real Correlation' : 'RSI Threshold'} mode`}
          >
            {localSettings.calculationMode === 'real_correlation' ? (
              <>
                <Activity className="w-3 h-3" />
                <span className="hidden sm:inline">Real Correlation</span>
                <span className="sm:hidden">Real</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3 h-3" />
                <span className="hidden sm:inline">RSI Threshold</span>
                <span className="sm:hidden">RSI</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
            title="Dashboard Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        </div>

        {/* Color legend removed per request for cleaner header */}

      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 bg-gradient-to-br from-slate-50/30 to-white rounded-xl">
        {/* Mobile List Layout */}
        <div className="block sm:hidden">
          <div className="space-y-2 pr-1">
            {gridPairs.map(([pairKey, pairData]) => {
              const [symbol1, symbol2] = pairKey.split('_');
              return (
                <div key={pairKey} className="w-full">
                  <CorrelationPairCard
                    pairKey={pairKey}
                    pairData={pairData}
                    pair={[symbol1, symbol2]}
                    calculationMode={localSettings.calculationMode}
                    realCorrelationData={realCorrelationData}
                    isMobile={true}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Grid Layout - Dynamic columns based on available width */}
        <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
          {gridPairs.map(([pairKey, pairData]) => {
            const [symbol1, symbol2] = pairKey.split('_');
            return (
              <CorrelationPairCard
                key={pairKey}
                pairKey={pairKey}
                pairData={pairData}
                pair={[symbol1, symbol2]}
                calculationMode={localSettings.calculationMode}
                realCorrelationData={realCorrelationData}
                isMobile={false}
              />
            );
          })}
          
          {/* Grid automatically handles layout - no need for empty slots */}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RSI Correlation Settings</h3>
            
            <div className="space-y-4">
              {/* Calculation Mode */}
              <div>
                <label htmlFor="rsi-calc-mode" className="block text-sm font-medium text-gray-700 mb-1">
                  Calculation Mode
                </label>
                <select
                  id="rsi-calc-mode"
                  value={localSettings.calculationMode}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, calculationMode: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rsi_threshold">RSI Threshold Analysis</option>
                  <option value="real_correlation">Real Rolling Correlation</option>
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label htmlFor="rsi-timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <select
                  id="rsi-timeframe"
                  value={localSettings.timeframe}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              {/* Correlation Window (only show for real correlation mode) */}
              {localSettings.calculationMode === 'real_correlation' && (
                <div>
                  <label htmlFor="rsi-corr-window" className="block text-sm font-medium text-gray-700 mb-1">
                    Correlation Window
                  </label>
                  <select
                    id="rsi-corr-window"
                    value={localSettings.correlationWindow}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, correlationWindow: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {correlationWindows.map(window => (
                      <option key={window} value={window}>{window} periods</option>
                    ))}
                  </select>
                </div>
              )}

              {/* RSI Settings (only show for RSI threshold mode) */}
              {localSettings.calculationMode === 'rsi_threshold' && (
                <>
                  {/* RSI Period */}
                  <div>
                    <label htmlFor="rsi-period-input" className="block text-sm font-medium text-gray-700 mb-1">
                      RSI Period
                    </label>
                    <input
                      id="rsi-period-input"
                      type="number"
                      min="2"
                      max="50"
                      value={localSettings.rsiPeriod}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, rsiPeriod: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Overbought Level */}
                  <div>
                    <label htmlFor="rsi-overbought-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Overbought Level
                    </label>
                    <input
                      id="rsi-overbought-input"
                      type="number"
                      min="50"
                      max="90"
                      value={localSettings.rsiOverbought}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, rsiOverbought: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Oversold Level */}
                  <div>
                    <label htmlFor="rsi-oversold-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Oversold Level
                    </label>
                    <input
                      id="rsi-oversold-input"
                      type="number"
                      min="10"
                      max="50"
                      value={localSettings.rsiOversold}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, rsiOversold: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={handleResetSettings}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RSICorrelationDashboard;
