import { Settings, BarChart3, Bell, Maximize2, X } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

import CurrencyStrengthAlertConfig from './CurrencyStrengthAlertConfig';
import { useAuth } from '../auth/AuthProvider';
import currencyStrengthAlertService from '../services/currencyStrengthAlertService';
import userStateService from '../services/userStateService';
import useCurrencyStrengthStore from '../store/useCurrencyStrengthStore';
import { getCurrencyStrengthColor } from '../utils/formatters';


// Darker shade variant for heatmap cells in dialog
const getCurrencyStrengthColorModal = (strength) => {
  if (strength > 0) {
    if (strength >= 50) return 'text-green-800 bg-green-300 dark:text-green-200 dark:bg-green-900/50';
    if (strength >= 20) return 'text-green-700 bg-green-200 dark:text-green-300 dark:bg-green-900/40';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
  } else if (strength < 0) {
    if (strength <= -50) return 'text-red-800 bg-red-300 dark:text-red-200 dark:bg-red-900/50';
    if (strength <= -20) return 'text-red-700 bg-red-200 dark:text-red-300 dark:bg-red-900/40';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  }
  return 'text-gray-700 bg-gray-200 dark:text-gray-300 dark:bg-slate-800';
};

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
    setCurrencyStrengthSnapshot,
    lastServerStrengthByTimeframe
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
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);


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
    <div className="widget-card px-3 pb-2 z-10 relative h-full flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="pt-1">
        {/* Header */}
        <div className="widget-header flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-[#19235d] dark:text-slate-100">
                Currency Strength Meter
                <span className="ml-2 align-middle text-xs font-normal text-gray-400 dark:text-slate-400">
                  ({settings.timeframe})
                </span>
              </h2>
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
              type="button"
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-[#19235d] hover:bg-gray-100 rounded-md transition-colors"
              title="Dashboard Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowHeatmapModal(true)}
              className="p-2 text-gray-600 hover:text-[#19235d] hover:bg-gray-100 rounded-md transition-colors"
              title="Open Heatmap"
              aria-label="Open currency strength heatmap"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {/* Refresh icon removed per requirements */}
          </div>
        </div>

      </div>

      {/* Content Area */}
      <div className="px-1 pb-2 flex-1 min-h-0 overflow-y-auto">
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

      {/* Heatmap Dialog Modal */}
      {showHeatmapModal && createPortal(
        <CurrencyStrengthFullscreenHeatmap
          onClose={() => setShowHeatmapModal(false)}
          getColor={getCurrencyStrengthColorModal}
          lastSnapshots={lastServerStrengthByTimeframe}
          setSnapshot={setCurrencyStrengthSnapshot}
        />, 
        document.body
      )}

    </div>
  );
};

export default CurrencyStrengthMeter;

// Heatmap Dialog Component
const CurrencyStrengthFullscreenHeatmap = ({ onClose, getColor, lastSnapshots, setSnapshot }) => {

  // Build memoized lookup for snapshot per timeframe
  const snapshotByTf = useMemo(() => {
    const map = new Map();
    CS_FULL_TIMEFRAMES.forEach(tf => {
      const snap = lastSnapshots?.get?.(tf);
      map.set(tf, snap instanceof Map ? snap : null);
    });
    return map;
  }, [lastSnapshots]);

  // Fetch missing snapshots on open
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = CS_FULL_TIMEFRAMES.filter(tf => !(snapshotByTf.get(tf) && snapshotByTf.get(tf).size > 0));
      if (missing.length === 0) return;
      try {
        const { fetchIndicatorSnapshot } = (await import('../services/indicatorService.js')).default;
        await Promise.all(missing.map(async (tf) => {
          try {
            const res = await fetchIndicatorSnapshot({ indicator: 'currency_strength', timeframe: tf });
            if (cancelled) return;
            const strength = res?.strength || res?.data?.strength || res?.currencies || res?.data?.currencies;
            const barTime = res?.bar_time || res?.data?.bar_time || res?.ts || res?.data?.ts;
            if (strength) {
              setSnapshot(strength, tf, barTime);
            }
          } catch (_e) {
            // best-effort for each timeframe
          }
        }));
      } catch (_e) {
        // ignore module load errors
      }
      return () => { cancelled = true; };
    })();
  }, [snapshotByTf, setSnapshot]);

  const Cell = ({ tf, currency }) => {
    const snap = snapshotByTf.get(tf);
    const val = snap?.get?.(currency);
    const isLoading = !(snap && typeof val === 'number');
    return (
      <div className={`px-3 py-2 rounded-md border border-transparent ${isLoading ? 'bg-gray-300 dark:bg-slate-900/40 text-gray-600 dark:text-slate-300' : getColor(val)}`}>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="opacity-70">{currency}</span>
          <span className="tabular-nums">{isLoading ? '--' : Number(val).toFixed(0)}</span>
        </div>
      </div>
    );
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cs-heatmap-title"
    >
      <div className="bg-white dark:bg-[#0b122f] rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
            <h3 id="cs-heatmap-title" className="text-base sm:text-lg font-semibold text-[#19235d] dark:text-slate-100">Currency Strength Heatmap</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#19235d] dark:text-slate-100 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 rounded-md"
            aria-label="Close heatmap"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="min-w-[720px]">
            {/* Header Row */}
            <div className="grid" style={{ gridTemplateColumns: `140px repeat(${CS_FULL_TIMEFRAMES.length}, minmax(110px, 1fr))` }}>
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Currency</div>
              {CS_FULL_TIMEFRAMES.map(tf => (
                <div key={`hdr-${tf}`} className="px-2 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide">{tf}</div>
              ))}
            </div>
            {/* Rows */}
            {CS_CURRENCIES_ASC.map((cur) => (
              <div key={`row-${cur}`} className="grid items-center gap-2 py-2" style={{ gridTemplateColumns: `140px repeat(${CS_FULL_TIMEFRAMES.length}, minmax(110px, 1fr))` }}>
                <div className="px-2 text-sm font-medium text-[#19235d] dark:text-slate-100">{cur}</div>
                {CS_FULL_TIMEFRAMES.map(tf => (
                  <Cell key={`cell-${cur}-${tf}`} tf={tf} currency={cur} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Module-scope constants to keep React hook deps stable and satisfy eslint-plugin-react-hooks
const CS_FULL_TIMEFRAMES = ['5M', '15M', '1H', '4H', '1D', '1W'];
// Ascending alphabetical order by currency code
const CS_CURRENCIES_ASC = ['AUD', 'CAD', 'CHF', 'EUR', 'GBP', 'JPY', 'NZD', 'USD'];
