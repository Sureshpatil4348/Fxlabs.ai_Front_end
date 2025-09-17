import { BarChart3, LineChart as LineChartIcon, Grid, RefreshCw, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

import userStateService from '../services/userStateService';
import useBaseMarketStore from '../store/useBaseMarketStore';
import useCurrencyStrengthStore from '../store/useCurrencyStrengthStore';
import { formatCurrency, getCurrencyStrengthColor } from '../utils/formatters';

const CurrencyStrengthBar = ({ currency, strength, isTop, isBottom }) => {
  const currencyInfo = formatCurrency(currency);
  
  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-2 w-16">
        <span className="text-lg">{currencyInfo.flag}</span>
        <span className="text-sm font-medium text-gray-900">{currency}</span>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isTop && <TrendingUp className="w-3 h-3 text-success-600" />}
            {isBottom && <TrendingDown className="w-3 h-3 text-danger-600" />}
            <span className="text-xs text-gray-600">{currencyInfo.name}</span>
          </div>
          <span className={`text-sm font-bold transition-all duration-300 ${getCurrencyStrengthColor(strength).split(' ')[0]}`}>
            {strength.toFixed(1)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ease-in-out ${getCurrencyStrengthColor(strength).split(' ')[1]}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
    </div>
  );
};

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

const StrengthChart = React.memo(({ data, type }) => {
  const chartData = useMemo(() => data.map(item => ({
    ...item,
    color: item.strength >= 70 ? '#16a34a' : 
           item.strength >= 60 ? '#22c55e' : 
           item.strength >= 40 ? '#6b7280' : 
           item.strength >= 30 ? '#f87171' : '#dc2626'
  })), [data]);

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="currency" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(1)}`, 'Strength']}
            labelFormatter={(label) => `${formatCurrency(label).name} (${label})`}
          />
          <Line 
            type="monotone" 
            dataKey="strength" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={{ r: 4 }}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="currency" />
        <YAxis domain={[0, 100]} />
        <Tooltip 
          formatter={(value) => [`${value.toFixed(1)}`, 'Strength']}
          labelFormatter={(label) => `${formatCurrency(label).name} (${label})`}
        />
        <Bar dataKey="strength" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

StrengthChart.displayName = 'StrengthChart';

const CurrencyStrengthMeter = () => {
  const { 
    currencyStrength, 
    settings,
    calculateCurrencyStrength,
    subscriptions,
    isConnected,
    autoSubscribeToMajorPairs,
    updateSettings,
    timeframes
  } = useCurrencyStrengthStore();
  
  // Get tab state from base market store
  const { tabState, updateCurrencyStrengthView, loadTabState } = useBaseMarketStore();
  
  const [viewMode, setViewMode] = useState(tabState.currencyStrength?.viewMode || 'bars');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    mode: settings.mode,
    useEnhancedCalculation: settings.useEnhancedCalculation
  });

  // Load tab state on component mount
  useEffect(() => {
    loadTabState();
  }, [loadTabState]);

  // Update viewMode when tabState changes
  useEffect(() => {
    if (tabState.currencyStrength?.viewMode) {
      setViewMode(tabState.currencyStrength.viewMode);
    }
  }, [tabState.currencyStrength?.viewMode]);

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
        // eslint-disable-next-line no-console
        console.log('Auto-refreshing currency strength (2min interval)');
        calculateCurrencyStrength();
      }, 120000); // 2 minutes instead of 60 seconds
      return () => clearInterval(interval);
    }
  }, [subscriptions.size, calculateCurrencyStrength]);

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

  // Handle view mode change with persistence
  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    try {
      await updateCurrencyStrengthView(mode);
    } catch (error) {
      console.error('Failed to update currency strength view mode:', error);
      // Revert on error
      setViewMode(viewMode);
    }
  };

  // Memoize strength data conversion to prevent recalculation on every render
  const strengthData = useMemo(() => {
    return Array.from(currencyStrength.entries())
      .map(([currency, strength]) => ({ 
        currency, 
        strength: strength || 50 // Fallback to 50 if strength is undefined/null/0
      }))
      .sort((a, b) => b.strength - a.strength);
  }, [currencyStrength]);

  

  // Memoize top and bottom currencies to prevent recalculation
  const topCurrencies = useMemo(() => 
    strengthData.slice(0, 2).map(d => d.currency), [strengthData]
  );
  const bottomCurrencies = useMemo(() => 
    strengthData.slice(-2).map(d => d.currency), [strengthData]
  );

  const viewModes = [
    { id: 'bars', label: 'Bar Chart', icon: BarChart3 },
    { id: 'lines', label: 'Line Chart', icon: LineChartIcon },
    { id: 'heatmap', label: 'Heatmap', icon: Grid }
  ];

  return (
    <div className="card z-10 relative h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="widget-header flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Currency Strength Meter</h2>
          <p className="widget-subtitle">
            {settings.timeframe} • Updates on candle close
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
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

        {/* View Mode Toggle */}
        <div className="flex space-x-1 mb-3 p-1 bg-gray-100 rounded-lg">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => handleViewModeChange(mode.id)}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {mode.label}
            </button>
          );
        })}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {strengthData.length > 0 ? (
          <>
            {viewMode === 'bars' && (
              <div className="space-y-2">
                {strengthData.map((item) => (
                  <CurrencyStrengthBar
                    key={item.currency}
                    currency={item.currency}
                    strength={item.strength}
                    isTop={topCurrencies.includes(item.currency)}
                    isBottom={bottomCurrencies.includes(item.currency)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'lines' && (
              <>
                <div className="h-48">
                  <StrengthChart data={strengthData} type="line" />
                </div>
                {/* Summary below line chart */}
                <div className="mt-28 grid grid-cols-2 gap-12 ">
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
            )}

            {viewMode === 'heatmap' && (
              <CurrencyHeatmap strengthData={strengthData} />
            )}

            {/* Summary for bars and heatmap modes */}
            {(viewMode === 'bars' || viewMode === 'heatmap') && (
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
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-gray-400" />
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
