import { RefreshCw, Plus, Minus, Settings, BarChart3, Activity, Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import RSICorrelationAlertConfig from './RSICorrelationAlertConfig';
import { useAuth } from '../auth/AuthProvider';
import rsiCorrelationAlertService from '../services/rsiCorrelationAlertService';
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
    
    // Determine mismatch and styling per requirement
    const computedIsMismatch = (type === 'positive' && correlation < 0.25) || (type === 'negative' && correlation > -0.15);
    const isMismatch = correlationData.isMismatch !== undefined ? correlationData.isMismatch : computedIsMismatch;
    const cardColor = isMismatch ? 'border-2 border-gray-300' : 'border-2 border-gray-300 bg-white';
    const textColor = isMismatch ? 'text-white' : 'text-gray-700';
    const iconColor = isMismatch ? 'text-white' : 'text-gray-500';
    const highlightClass = '';
    
    if (isMobile) {
      return (
        <div 
          className={`p-1 pr-2 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}
          style={isMismatch ? { backgroundColor: '#03c05d', borderColor: '#03c05d' } : {}}
        >
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center space-x-1">
              <span className={`text-lg font-black ${iconColor}`}>
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
              <span className={`text-sm font-medium ${textColor}`}>
                {formatSymbolDisplay(symbol1)} / {formatSymbolDisplay(symbol2)}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-xs ${textColor}`}>
                {correlationValue}%
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`p-0.5 pr-0.5 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}
        style={isMismatch ? { backgroundColor: '#03c05d', borderColor: '#03c05d' } : {}}
      >
        <div className="mb-0 text-center">
          <div className="flex items-center justify-center">
            <span className={`text-sm font-black ${iconColor}`}>
              {type === 'positive' ? (
                <span className="flex items-center">
                  <Plus className="w-4 h-4 mr-1 font-black stroke-2" />
                </span>
              ) : (
                <span className="flex items-center">
                  <Minus className="w-4 h-4 mr-1 font-black stroke-2" />
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
              <div className={`font-normal text-[8px] ${textColor}`}>{formatSymbolDisplay(symbol1)}</div>
            </div>
            <div className="text-center p-0 bg-opacity-50 rounded transition-all duration-300">
              <div className={`font-normal text-[8px] ${textColor}`}>{formatSymbolDisplay(symbol2)}</div>
            </div>
          </div>
          <div className={`text-center p-0 rounded text-xs font-semibold ${textColor}`}>
            {correlationValue}%
          </div>
        </div>
      </div>
    );
  }
  
  // Original RSI threshold mode
  const { status, rsi1, rsi2, type } = pairData;
  
  // Styling for RSI threshold mode: mismatches green border, others grey
  const isMismatch = status === 'mismatch';
  const cardColor = isMismatch ? 'border-2 border-gray-300' : 'border-2 border-gray-300 bg-white';
  const textColor = isMismatch ? 'text-white' : 'text-gray-700';
  const iconColor = isMismatch ? 'text-white' : 'text-gray-500';
  const highlightClass = '';

  if (isMobile) {
    return (
      <div 
        className={`p-1 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}
        style={isMismatch ? { backgroundColor: '#03c05d', borderColor: '#03c05d' } : {}}
      >
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center space-x-1">
            <span className={`text-lg font-black ${iconColor}`}>
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
            <span className={`text-sm font-medium ${textColor}`}>
              {formatSymbolDisplay(symbol1)} / {formatSymbolDisplay(symbol2)}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-xs ${textColor}`}>
              RSI: {formatRsi(rsi1)} / {formatRsi(rsi2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-0.5 pr-0.5 rounded-md border transition-all duration-500 hover:shadow-sm ${cardColor} ${highlightClass}`}
      style={isMismatch ? { backgroundColor: '#03c05d', borderColor: '#03c05d' } : {}}
    >
      <div className="mb-0 text-center">
        <div className="flex items-center justify-center">
          <span className={`text-sm font-black ${iconColor}`}>
            {type === 'positive' ? (
              <span className="flex items-center">
                <Plus className="w-4 h-4 mr-1 font-black stroke-2" />
              </span>
            ) : (
              <span className="flex items-center">
                <Minus className="w-4 h-4 mr-1 font-black stroke-2" />
              </span>
            )}
          </span>
        </div>
      </div>
      
      <div className="space-y-0">
        <div className="grid grid-cols-2 gap-0 text-xs">
          <div className="text-center p-0 bg-opacity-50 rounded transition-all duration-300">
            <div className={`font-normal text-[8px] ${textColor}`}>{formatSymbolDisplay(symbol1)}</div>
            <div className={`font-semibold text-xs transition-all duration-300 ${textColor}`}>{formatRsi(rsi1)}</div>
          </div>
          <div className="text-center p-0 bg-opacity-50 rounded transition-all duration-300">
            <div className={`font-normal text-[8px] ${textColor}`}>{formatSymbolDisplay(symbol2)}</div>
            <div className={`font-semibold text-xs transition-all duration-300 ${textColor}`}>{formatRsi(rsi2)}</div>
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
  
  // Alert functionality
  const { user } = useAuth();
  const [showRSICorrelationAlertConfig, setShowRSICorrelationAlertConfig] = useState(false);
  const [activeRSICorrelationAlertsCount, setActiveRSICorrelationAlertsCount] = useState(0);
  
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

  // Alert handlers
  const handleRSICorrelationBellClick = () => {
    setShowRSICorrelationAlertConfig(true);
  };

  const handleRSICorrelationAlertConfigClose = () => {
    setShowRSICorrelationAlertConfig(false);
    // Refresh active RSI correlation alerts count when modal closes
    if (user) {
      const loadActiveRSICorrelationAlertsCount = async () => {
        try {
          const activeRSICorrelationAlerts = await rsiCorrelationAlertService.getActiveAlerts();
          setActiveRSICorrelationAlertsCount(activeRSICorrelationAlerts.length);
        } catch (error) {
          console.error('Failed to load active RSI correlation alerts count:', error);
        }
      };
      loadActiveRSICorrelationAlertsCount();
    } else {
      // For public access, set count to 0
      setActiveRSICorrelationAlertsCount(0);
    }
  };

  // Load active RSI correlation alerts count when user is logged in
  useEffect(() => {
    if (user) {
      const loadActiveRSICorrelationAlertsCount = async () => {
        try {
          const activeRSICorrelationAlerts = await rsiCorrelationAlertService.getActiveAlerts();
          setActiveRSICorrelationAlertsCount(activeRSICorrelationAlerts.length);
        } catch (error) {
          console.error('Failed to load active RSI correlation alerts count:', error);
        }
      };
      loadActiveRSICorrelationAlertsCount();
    } else {
      // For public access, set count to 0
      setActiveRSICorrelationAlertsCount(0);
    }
  }, [user]);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (user) {
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
        }
      } catch (error) {
        console.error('❌ Failed to load RSI Correlation settings:', error);
      }
    };

    loadSettings();
  }, [settings.calculationMode, settings.correlationWindow, settings.rsiOverbought, settings.rsiOversold, settings.rsiPeriod, settings.timeframe, updateSettings, user]);

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

      // Persist to database (only if user is logged in)
      if (user) {
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
      }

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
      const aMismatch = (a.isMismatch !== undefined) ? a.isMismatch : ((a.type === 'positive' && a.correlation < 0.25) || (a.type === 'negative' && a.correlation > -0.15));
      const bMismatch = (b.isMismatch !== undefined) ? b.isMismatch : ((b.type === 'positive' && b.correlation < 0.25) || (b.type === 'negative' && b.correlation > -0.15));
      if (aMismatch && !bMismatch) return -1;
      if (!aMismatch && bMismatch) return 1;
      return 0;
    });
  } else {
    sortedPairs = sortCorrelationPairs(correlationStatus);
  }
  
  // Prepare data for grid display (expand to accommodate all pairs)
  const gridPairs = sortedPairs;
  
  // Calculate statistics based on calculation mode
  let _totalPairs, _matches, _mismatches, _neutral;
  
  if (localSettings.calculationMode === 'real_correlation') {
    _totalPairs = sortedPairs.length;
    const strongCorrelations = sortedPairs.filter(([, data]) => data.strength === 'strong').length;
    const moderateCorrelations = sortedPairs.filter(([, data]) => data.strength === 'moderate').length;
    const weakCorrelations = sortedPairs.filter(([, data]) => data.strength === 'weak').length;
    
    _matches = strongCorrelations;
    _mismatches = weakCorrelations;
    _neutral = moderateCorrelations;
  } else {
    _totalPairs = sortedPairs.length;
    _matches = sortedPairs.filter(([, data]) => data.status === 'match').length;
    _mismatches = sortedPairs.filter(([, data]) => data.status === 'mismatch').length;
    _neutral = sortedPairs.filter(([, data]) => data.status === 'neutral').length;
  }

  return (
    <>
    <div className="widget-card px-4 pb-1 z-10 relative h-full flex flex-col mb-[15px]">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="widget-header flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">RSI Correlation Dashboard</h2>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            {/* Connection status pill removed; status shown as top-right dot */}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:self-start">
          {/* Calculation Mode Toggle */}
          <button
            onClick={handleCalculationModeToggle}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md ${
              localSettings.calculationMode === 'real_correlation'
                ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 shadow-blue-200'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-gray-200'
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
          
          {/* RSI Correlation Alert Bell Icon */}
          {user && (
            <button 
              type="button"
              aria-label="Configure RSI correlation alerts"
              onClick={handleRSICorrelationBellClick}
              className="relative p-2 text-gray-400 dark:text-slate-400 hover:text-purple-500 transition-colors duration-300 group"
            >
              <Bell className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              {activeRSICorrelationAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {activeRSICorrelationAlertsCount > 9 ? '9+' : activeRSICorrelationAlertsCount}
                </span>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-slate-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
            title="Dashboard Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-slate-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        </div>

        {/* Color legend removed per request for cleaner header */}

      </div>

      {/* Scrollable Content Area - remove inner rounded/background to avoid nested card look */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3">
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
        <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
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
      {showSettings && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">RSI Correlation Settings</h3>
            
            <div className="space-y-4">
              {/* Calculation Mode */}
              <div>
                <label htmlFor="rsi-calc-mode" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Calculation Mode
                </label>
                <select
                  id="rsi-calc-mode"
                  value={localSettings.calculationMode}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, calculationMode: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rsi_threshold">RSI Threshold Analysis</option>
                  <option value="real_correlation">Real Rolling Correlation</option>
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label htmlFor="rsi-timeframe" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Timeframe
                </label>
                <select
                  id="rsi-timeframe"
                  value={localSettings.timeframe}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              {/* Correlation Window (only show for real correlation mode) */}
              {localSettings.calculationMode === 'real_correlation' && (
                <div>
                  <label htmlFor="rsi-corr-window" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Correlation Window
                  </label>
                  <select
                    id="rsi-corr-window"
                    value={localSettings.correlationWindow}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, correlationWindow: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label htmlFor="rsi-period-input" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      RSI Period
                    </label>
                    <input
                      id="rsi-period-input"
                      type="number"
                      min="2"
                      max="50"
                      value={localSettings.rsiPeriod}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, rsiPeriod: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Overbought Level */}
                  <div>
                    <label htmlFor="rsi-overbought-input" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Overbought Level
                    </label>
                    <input
                      id="rsi-overbought-input"
                      type="number"
                      min="50"
                      max="90"
                      value={localSettings.rsiOverbought}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, rsiOverbought: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Oversold Level */}
                  <div>
                    <label htmlFor="rsi-oversold-input" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Oversold Level
                    </label>
                    <input
                      id="rsi-oversold-input"
                      type="number"
                      min="10"
                      max="50"
                      value={localSettings.rsiOversold}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, rsiOversold: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={handleResetSettings}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-md transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-md transition-colors"
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
        </div>,
        document.body
      )}

    </div>
    
    {/* RSI Correlation Alert Configuration Modal - Outside widget for proper z-index */}
    <RSICorrelationAlertConfig 
      isOpen={showRSICorrelationAlertConfig} 
      onClose={handleRSICorrelationAlertConfigClose} 
    />
    </>
  );
};

export default RSICorrelationDashboard;
