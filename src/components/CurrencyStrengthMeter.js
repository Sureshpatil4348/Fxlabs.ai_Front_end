import { Settings, BarChart3, Bell } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

import CurrencyStrengthAlertConfig from './CurrencyStrengthAlertConfig';
import { useAuth } from '../auth/AuthProvider';
import currencyStrengthAlertService from '../services/currencyStrengthAlertService';
import userStateService from '../services/userStateService';
import useCurrencyStrengthStore from '../store/useCurrencyStrengthStore';
import { getCurrencyStrengthColor } from '../utils/formatters';


const CurrencyHeatmap = ({ strengthData, isLoading }) => {
  // Split currencies into strongest top 4 and weakest bottom 4 (no duplicates)
  const strongestCurrencies = [...strengthData]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4);

  const strongestSet = new Set(strongestCurrencies.map(i => i.currency));
  const weakestCurrencies = strengthData
    .filter(item => !strongestSet.has(item.currency))
    .sort((a, b) => a.strength - b.strength)
    .slice(0, 4);

  const CurrencyCard = ({ currency, strength, isLoading }) => (
    <div
      className={`py-4 px-3 rounded-lg transition-all duration-300 ${
        isLoading 
          ? 'bg-gray-200 dark:bg-gray-700' 
          : getCurrencyStrengthColor(strength)
      }`}
    >
      <div className="flex items-center justify-between text-sm leading-none font-semibold">
        <span className="truncate pr-2">{currency}</span>
        {isLoading ? (
          <span className="tabular-nums shimmer-text">--</span>
        ) : (
          <span className="tabular-nums">{strength.toFixed(0)}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Strongest Currencies Row */}
      <div>
        <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1.5 px-1">Strongest Currencies</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {strongestCurrencies.map((item) => (
            <CurrencyCard key={item.currency} currency={item.currency} strength={item.strength} isLoading={isLoading} />
          ))}
        </div>
      </div>

      {/* Weakest Currencies Row */}
      <div>
        <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1.5 px-1">Weakest Currencies</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {weakestCurrencies.map((item) => (
            <CurrencyCard key={item.currency} currency={item.currency} strength={item.strength} isLoading={isLoading} />
          ))}
        </div>
      </div>
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
  const { user } = useAuth();
  
  // removed manual refresh state
  const [showSettings, setShowSettings] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe
  });
  const [showCSAlertConfig, setShowCSAlertConfig] = useState(false);
  const [activeCSAlertsCount, setActiveCSAlertsCount] = useState(0);


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

  // Helper to normalize disallowed timeframe values
  const normalizeTimeframe = useCallback((tf) => {
    const up = String(tf || '').toUpperCase();
    return (up === '1M' || up === 'M1') ? '5M' : up || '5M';
  }, []);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await userStateService.getUserDashboardSettings();
        if (savedSettings.currencyStrength) {
          const { timeframe } = savedSettings.currencyStrength;
          const safeTf = normalizeTimeframe(timeframe || settings.timeframe);

          // Update local settings state
          setLocalSettings({
            timeframe: safeTf
          });

          // Update store settings (timeframe only)
          updateSettings({
            timeframe: safeTf
          });

        }
      } catch (error) {
        console.error('❌ Failed to load Currency Strength settings:', error);
      }
    };

    loadSettings();
  }, [settings.timeframe, updateSettings, normalizeTimeframe]);

  // Currency Strength Alert handlers
  const handleCSBellClick = () => {
    setShowCSAlertConfig(true);
  };
  const handleCSAlertConfigClose = () => {
    setShowCSAlertConfig(false);
    // Refresh active alert count after closing
    (async () => {
      try {
        const alert = await currencyStrengthAlertService.getActiveAlert();
        setActiveCSAlertsCount(alert ? 1 : 0);
      } catch (_e) {
        // ignore
      }
    })();
  };

  // Load active Currency Strength alert count when user logs in
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const alert = await currencyStrengthAlertService.getActiveAlert();
        setActiveCSAlertsCount(alert ? 1 : 0);
      } catch (_e) {
        setActiveCSAlertsCount(0);
      }
    })();
  }, [user]);

  // Remove the OHLC data change effect that was causing frequent updates
  // useEffect(() => {
  //   if (subscriptions.size > 0 && ohlcData.size > 0) {
  //     console.log('OHLC data changed, currency strength should update automatically via store');
  //   }
  // }, [ohlcData, subscriptions.size]);

  // Removed periodic REST auto-refresh: rely on WS pushes for updates

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
        const strength = res?.strength || res?.data?.strength || res?.currencies || res?.data?.currencies;
        const barTime = res?.bar_time || res?.data?.bar_time || res?.ts || res?.data?.ts;
        if (strength) {
          setCurrencyStrengthSnapshot(strength, res?.timeframe || settings.timeframe, barTime);
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
      // Ensure all 8 major currencies are always present
      const allCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
      const strengthMap = new Map(currencyStrength);
      
      // Initialize missing currencies with neutral value (0)
      allCurrencies.forEach(currency => {
        if (!strengthMap.has(currency)) {
          strengthMap.set(currency, 0);
        }
      });
      
      const entries = Array.from(strengthMap.entries());
      return entries
        .map(([currency, strength]) => {
          const num = Number(strength);
          return {
            currency,
            strength: Number.isFinite(num) ? num : 0
          };
        })
        .sort((a, b) => b.strength - a.strength);
    } catch (_e) {
      // Fallback: return all currencies with neutral value
      return ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].map(currency => ({
        currency,
        strength: 0
      }));
    }
  }, [currencyStrength]);

  // Detect if data is still loading (all values are 0 or very close to default neutral values)
  const isDataLoading = useMemo(() => {
    if (strengthData.length === 0) return true;
    
    // Check if all values are at their initial/default state (0 or very close to it)
    const allZeroOrDefault = strengthData.every(item => {
      const strength = item.strength;
      // Consider loading if all values are 0 or within a very narrow range around neutral
      return strength === 0 || (strength >= 49 && strength <= 51);
    });
    
    // Also check if we have subscriptions and connection
    const hasNoData = subscriptions.size === 0 || !isConnected;
    
    return allZeroOrDefault || hasNoData;
  }, [strengthData, subscriptions.size, isConnected]);

  



  return (
    <div className="widget-card px-3 pb-2 z-10 relative h-full flex flex-col">
      {/* Header Section */}
      <div className="pt-1">
        {/* Header */}
        <div className="widget-header flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-[#19235d] dark:text-slate-100">Currency Strength Meter</h2>
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
            {user && (
              <button 
                type="button"
                aria-label="Configure currency strength alerts"
                onClick={handleCSBellClick}
                className={`relative p-2 transition-colors duration-300 group ${
                  activeCSAlertsCount > 0
                    ? 'text-emerald-600'
                    : 'text-gray-400 hover:text-emerald-600'
                }`}
                title="Configure Currency Strength Alert"
              >
                <Bell className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-[#19235d] hover:bg-gray-100 rounded-md transition-colors"
              title="Dashboard Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {/* Refresh icon removed per requirements */}
          </div>
        </div>

      </div>

      {/* Content Area */}
      <div className="px-1 pb-2">
        {strengthData.length > 0 ? (
          <CurrencyHeatmap strengthData={strengthData} isLoading={isDataLoading} />
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"></div>
            <h3 className="text-lg font-medium text-[#19235d] mb-2">
              No strength data available
            </h3>
            <p className="text-gray-500 text-sm">
              Currency strength will be calculated based on subscribed pairs.
            </p>
          </div>
        )}
      </div>

      {/* Currency Strength Alert Configuration */}
      <CurrencyStrengthAlertConfig 
        isOpen={showCSAlertConfig}
        onClose={handleCSAlertConfigClose}
      />

      {/* Settings Modal */}
      {showSettings && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            isolation: 'isolate'
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#19235d] mb-4">Currency Strength Settings</h3>
            
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
                  {timeframes
                    .filter(tf => String(tf).toUpperCase() !== '1M' && String(tf).toUpperCase() !== 'M1')
                    .map(tf => (
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
        </div>,
        document.body
      )}

    </div>
  );
};

export default CurrencyStrengthMeter;
