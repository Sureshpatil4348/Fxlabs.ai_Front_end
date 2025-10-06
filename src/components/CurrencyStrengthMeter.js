import { RefreshCw, Settings } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import userStateService from '../services/userStateService';
import useCurrencyStrengthStore from '../store/useCurrencyStrengthStore';
import { formatCurrency, getCurrencyStrengthColor } from '../utils/formatters';


const CurrencyHeatmap = ({ strengthData }) => {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {currencies.map(currency => {
        const strength = strengthData.find(d => d.currency === currency)?.strength || 50;
        const currencyInfo = formatCurrency(currency);
        
        return (
          <div
            key={currency}
            className={`p-3 rounded-lg text-center transition-all duration-300 ${getCurrencyStrengthColor(strength)}`}
          >
            <div className="text-lg mb-1">{currencyInfo.flag}</div>
            <div className="text-xs font-medium">{currency}</div>
            <div className="text-sm font-bold mt-1">{strength.toFixed(0)}</div>
          </div>
        );
      })}
    </div>
  );
};


const CurrencyStrengthMeter = () => {
  const { 
    currencyStrength, 
    settings,
    calculateCurrencyStrength,
    subscriptions,
    isConnected,
    autoSubscribeToMajorPairs,
    connect,
    updateSettings,
    timeframes,
    setCurrencyStrengthSnapshot
  } = useCurrencyStrengthStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    mode: settings.mode,
    useEnhancedCalculation: settings.useEnhancedCalculation
  });

  // Memoize snapshot setter to prevent dependency warnings
  const memoizedSetCurrencyStrengthSnapshot = useCallback(setCurrencyStrengthSnapshot, [setCurrencyStrengthSnapshot]);


  // Auto-subscribe to major pairs when connection is established
  useEffect(() => {
    // Ensure WebSocket connection and store registration on mount
    connect();
  }, [connect]);

  // Auto-subscribe to major pairs when connection is established
  useEffect(() => {
    if (!isConnected || hasAutoSubscribed) return;

    const timer = setTimeout(() => {
      autoSubscribeToMajorPairs();
      setHasAutoSubscribed(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, [isConnected, hasAutoSubscribed, autoSubscribeToMajorPairs]);

  // Debounced calculation to prevent excessive updates
  const debouncedCalculation = useCallback(() => {
    const timeoutId = setTimeout(() => {
      if (subscriptions.size > 0) {
        calculateCurrencyStrength();
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [subscriptions.size, calculateCurrencyStrength]);

  // Calculate currency strength when subscriptions change or settings change (debounced)
  useEffect(() => {
    const cleanup = debouncedCalculation();
    return cleanup;
  }, [subscriptions.size, settings.timeframe, settings.mode, settings.useEnhancedCalculation, debouncedCalculation]);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await userStateService.getUserDashboardSettings();
        if (savedSettings.currencyStrength) {
          const { timeframe, mode, useEnhancedCalculation } = savedSettings.currencyStrength;
          
          // Update local settings state
          setLocalSettings({
            timeframe: timeframe || settings.timeframe,
            mode: mode || settings.mode,
            useEnhancedCalculation: useEnhancedCalculation !== undefined ? useEnhancedCalculation : settings.useEnhancedCalculation
          });

          // Update store settings
          updateSettings({
            timeframe: timeframe || settings.timeframe,
            mode: mode || settings.mode,
            useEnhancedCalculation: useEnhancedCalculation !== undefined ? useEnhancedCalculation : settings.useEnhancedCalculation
          });

        }
      } catch (error) {
        console.error('❌ Failed to load Currency Strength settings:', error);
      }
    };

    loadSettings();
  }, [settings.mode, settings.timeframe, settings.useEnhancedCalculation, updateSettings]);

  // Remove the OHLC data change effect that was causing frequent updates
  // useEffect(() => {
  //   if (subscriptions.size > 0 && ohlcData.size > 0) {
  //     console.log('OHLC data changed, currency strength should update automatically via store');
  //   }
  // }, [ohlcData, subscriptions.size]);

  // Auto-refresh every 2 minutes if we have subscriptions (reduced frequency)
  useEffect(() => {
    if (subscriptions.size > 0) {
      const interval = setInterval(() => {
        // Prefer server snapshot refresh to keep in sync with backend
        (async () => {
          try {
            const { fetchIndicatorSnapshot } = (await import('../services/indicatorService.js')).default;
            const res = await fetchIndicatorSnapshot({
              indicator: 'currency_strength',
              timeframe: settings.timeframe
            });
            const strength = res?.strength || res?.data?.strength;
            if (strength) {
              setCurrencyStrengthSnapshot(strength, res?.timeframe || settings.timeframe);
            } else {
              // Fallback to local calculation if snapshot missing
              calculateCurrencyStrength();
            }
          } catch (_e) {
            // Fallback to local calculation on failure
            calculateCurrencyStrength();
          }
        })();
      }, 120000); // 2 minutes instead of 60 seconds
      return () => clearInterval(interval);
    }
  }, [subscriptions.size, calculateCurrencyStrength]);

  // Fetch initial server snapshot on mount/timeframe change
  useEffect(() => {
    let cancelled = false;
    const fetchInitial = async () => {
      try {
        const { fetchIndicatorSnapshot } = (await import('../services/indicatorService.js')).default;
        const res = await fetchIndicatorSnapshot({
          indicator: 'currency_strength',
          timeframe: settings.timeframe
        });
        if (cancelled) return;
        const strength = res?.strength || res?.data?.strength;
        if (strength) {
          memoizedSetCurrencyStrengthSnapshot(strength, res?.timeframe || settings.timeframe);
        }
      } catch (_e) {
        // silent; websocket will fill or local calc can be used on demand
      }
    };
    fetchInitial();
    return () => { cancelled = true; };
  }, [settings.timeframe, memoizedSetCurrencyStrengthSnapshot]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    calculateCurrencyStrength();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSaveSettings = async () => {
    try {
      // Update local store first
      updateSettings({
        timeframe: localSettings.timeframe,
        mode: localSettings.mode,
        useEnhancedCalculation: localSettings.useEnhancedCalculation
      });

      // Persist to database
      await userStateService.updateUserDashboardSettings({
        currencyStrength: {
          timeframe: localSettings.timeframe,
          mode: localSettings.mode,
          useEnhancedCalculation: localSettings.useEnhancedCalculation
        }
      });

      setShowSettings(false);
    } catch (error) {
      console.error('❌ Failed to save Currency Strength settings:', error);
    }
  };

  const handleResetSettings = () => {
    setLocalSettings({
      timeframe: settings.timeframe,
      mode: settings.mode,
      useEnhancedCalculation: settings.useEnhancedCalculation
    });
  };


  // Memoize strength data conversion to prevent recalculation on every render
  const strengthData = useMemo(() => {
    try {
      const entries = Array.from(currencyStrength.entries());
      return entries
        .map(([currency, strength]) => {
          const num = Number(strength);
          return {
            currency,
            strength: Number.isFinite(num) ? num : 50
          };
        })
        .sort((a, b) => b.strength - a.strength);
    } catch (_e) {
      return [];
    }
  }, [currencyStrength]);

  



  return (
    <div className="card z-10 relative h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="widget-header flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Currency Strength Meter</h2>
          <div className="flex items-center space-x-2 mt-1">
            {/* Connection status pill removed; status shown as top-right dot */}
            {strengthData.length === 0 && subscriptions.size > 0 && (
              <span className="text-xs text-blue-600">
                📊 Calculating strength for {settings.timeframe} timeframe...
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Dashboard Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        </div>

      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {strengthData.length > 0 ? (
          <>
            <CurrencyHeatmap strengthData={strengthData} />

            {/* Summary for heatmap mode */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-success-50 rounded-lg">
                <h4 className="text-sm font-medium text-success-700 mb-2">Strongest Currencies</h4>
                <div className="space-y-1">
                  {strengthData.slice(0, 2).map((item) => {
                    const currencyInfo = formatCurrency(item.currency);
                    return (
                      <div key={item.currency} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{currencyInfo.flag}</span>
                          <span className="text-sm font-medium">{item.currency}</span>
                        </div>
                        <span className="text-sm font-bold text-success-600">
                          {item.strength.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-danger-50 rounded-lg">
                <h4 className="text-sm font-medium text-danger-700 mb-2">Weakest Currencies</h4>
                <div className="space-y-1">
                  {strengthData.slice(-2).reverse().map((item) => {
                    const currencyInfo = formatCurrency(item.currency);
                    return (
                      <div key={item.currency} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{currencyInfo.flag}</span>
                          <span className="text-sm font-medium">{item.currency}</span>
                        </div>
                        <span className="text-sm font-bold text-danger-600">
                          {item.strength.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No strength data available
            </h3>
            <p className="text-gray-500 text-sm">
              Currency strength will be calculated based on subscribed pairs.
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Strength Settings</h3>
            
            <div className="space-y-4">
              {/* Calculation Method */}
              <div>
                <label htmlFor="cs-calculation-method" className="block text-sm font-medium text-gray-700 mb-1">
                  Calculation Method
                </label>
                <select
                  id="cs-calculation-method"
                  value={localSettings.useEnhancedCalculation ? 'enhanced' : 'legacy'}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    useEnhancedCalculation: e.target.value === 'enhanced' 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="enhanced">Enhanced Formula (28 pairs, log returns)</option>
                  <option value="legacy">Legacy Formula (24 pairs, price changes)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {localSettings.useEnhancedCalculation 
                    ? 'Uses all 28 major/minor pairs with log returns and proper averaging'
                    : 'Uses 24 pairs with simple price change calculations'
                  }
                </p>
              </div>

              {/* Timeframe */}
              <div>
                <label htmlFor="cs-timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <select
                  id="cs-timeframe"
                  value={localSettings.timeframe}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              {/* Mode */}
              <div>
                <label htmlFor="cs-calculation-mode" className="block text-sm font-medium text-gray-700 mb-1">
                  Calculation Mode
                </label>
                <select
                  id="cs-calculation-mode"
                  value={localSettings.mode}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="closed">Closed Candles</option>
                  <option value="live">Live Updates</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {localSettings.mode === 'live' 
                    ? 'Updates with every tick (real-time)'
                    : 'Uses completed candles only (more stable)'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
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

export default CurrencyStrengthMeter;
