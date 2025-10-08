import { Settings, BarChart3 } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import userStateService from '../services/userStateService';
import useCurrencyStrengthStore from '../store/useCurrencyStrengthStore';
import { getCurrencyStrengthColor } from '../utils/formatters';


const CurrencyHeatmap = ({ strengthData }) => {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
      {currencies.map(currency => {
        const strength = strengthData.find(d => d.currency === currency)?.strength || 50;

        return (
          <div
            key={currency}
            className={`py-3 rounded-md transition-all duration-300 ${getCurrencyStrengthColor(strength)}`}
          >
            <div className="flex items-center justify-between text-[10px] leading-none font-semibold px-2">
              <span className="truncate pr-1">{currency}</span>
              <span className="tabular-nums">{strength.toFixed(0)}</span>
            </div>
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
  
  // removed manual refresh state
  const [showSettings, setShowSettings] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe
  });


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
      // Only perform local calc in live mode to avoid flicker across refresh
      if (subscriptions.size > 0 && settings.mode === 'live') {
        calculateCurrencyStrength();
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [subscriptions.size, settings.mode, calculateCurrencyStrength]);

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
          const { timeframe } = savedSettings.currencyStrength;

          // Update local settings state
          setLocalSettings({
            timeframe: timeframe || settings.timeframe
          });

          // Update store settings (timeframe only)
          updateSettings({
            timeframe: timeframe || settings.timeframe
          });

        }
      } catch (error) {
        console.error('❌ Failed to load Currency Strength settings:', error);
      }
    };

    loadSettings();
  }, [settings.timeframe, updateSettings]);

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
  }, [subscriptions.size, settings.timeframe, setCurrencyStrengthSnapshot, calculateCurrencyStrength]);

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
          setCurrencyStrengthSnapshot(strength, res?.timeframe || settings.timeframe);
        }
      } catch (_e) {
        // silent; websocket will fill or local calc can be used on demand
      }
    };
    fetchInitial();
    return () => { cancelled = true; };
  }, [settings.timeframe, setCurrencyStrengthSnapshot]);

  // Manual refresh removed; strength updates automatically via snapshots/subscriptions

  const handleSaveSettings = async () => {
    try {
      // Update local store first
      updateSettings({
        timeframe: localSettings.timeframe
      });

      // Persist to database
      await userStateService.updateUserDashboardSettings({
        currencyStrength: {
          timeframe: localSettings.timeframe
        }
      });

      setShowSettings(false);
    } catch (error) {
      console.error('❌ Failed to save Currency Strength settings:', error);
    }
  };

  const handleResetSettings = () => {
    setLocalSettings({
      timeframe: settings.timeframe
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
    <div className="widget-card px-3 pb-2 z-10 relative h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-1">
        {/* Header */}
        <div className="widget-header flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Currency Strength Meter</h2>
            </div>
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
            {/* Refresh icon removed per requirements */}
          </div>
        </div>

      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        {strengthData.length > 0 ? (
          <>
            <CurrencyHeatmap strengthData={strengthData} />

            {/* Summary for heatmap mode */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg py-2 border border-green-300 dark:border-green-700 bg-transparent">
                <h4 className="text-sm font-medium text-success-700 mb-2 px-2">Strongest Currencies</h4>
                <div className="space-y-1">
                  {strengthData.slice(0, 2).map((item) => {
                    return (
                      <div key={item.currency} className="flex items-center justify-between px-2">
                        <span className="text-sm font-medium">{item.currency}</span>
                        <span className="text-sm font-bold text-success-600">
                          {item.strength.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg py-2 border border-red-300 dark:border-red-700 bg-transparent">
                <h4 className="text-sm font-medium text-danger-700 mb-2 px-2">Weakest Currencies</h4>
                <div className="space-y-1">
                  {strengthData.slice(-2).reverse().map((item) => {
                    return (
                      <div key={item.currency} className="flex items-center justify-between px-2">
                        <span className="text-sm font-medium">{item.currency}</span>
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
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"></div>
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
