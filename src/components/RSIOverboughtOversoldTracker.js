import { TrendingDown, TrendingUp, Settings, Activity, Bell, Star, List, Trash2, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import ExpandablePairRow from './ExpandablePairRow';
import RFIScoreCard from './RFIScoreCard';
import RSIAlertConfig from './RSIAlertConfig';
import { useAuth } from '../auth/AuthProvider';
import rsiAlertService from '../services/rsiAlertService';
import userStateService from '../services/userStateService';
import useBaseMarketStore from '../store/useBaseMarketStore';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';

// Utility function to clamp values within min/max bounds
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const PairRow = ({ pair, onAddToWishlist, isInWishlist, settings }) => {
  const { symbol, rsi, price, change } = pair;

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer ${isInWishlist ? 'bg-gray-100 dark:bg-slate-600' : ''}`} onClick={() => onAddToWishlist(symbol)}>
      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-slate-100 text-center">
        {formatSymbolDisplay(symbol)}
      </td>
      <td className={`px-3 py-2 text-xs font-bold text-center ${getRsiColor(rsi, settings.rsiOverbought, settings.rsiOversold)}`}>
        {formatRsi(rsi)}
      </td>
      <td className="px-3 py-2 text-xs text-gray-900 dark:text-slate-100 font-mono text-center">
        {symbol.includes('JPY') ? formatPrice(price, 3) : formatPrice(price, 5)}
      </td>
      <td className={`px-3 py-2 text-xs font-medium text-center ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
        {formatPercentage(change)}
      </td>
    </tr>
  );
};

const WatchlistRow = ({ symbol, onRemoveFromWishlist, settings, rsiData, getLatestTickForSymbol, getLatestOhlcForSymbol, isRemoving }) => {
  // Convert watchlist symbol (base format) to RSI Tracker format (with 'm' suffix)
  const rsiSymbol = symbol + 'm';
  
  const latestTick = getLatestTickForSymbol(rsiSymbol);
  const latestBar = getLatestOhlcForSymbol(rsiSymbol);
  const rsiValue = rsiData.get(rsiSymbol)?.value ?? null;
  
  const price = latestTick?.bid || latestBar?.close || null;
  const change = latestBar ? ((latestBar.close - latestBar.open) / latestBar.open * 100) : null;
  const priceText = price != null
    ? (symbol.includes('JPY') ? formatPrice(price, 3) : formatPrice(price, 5))
    : '--';
  const rsiText = rsiValue != null ? formatRsi(rsiValue) : '--';
  const changeText = change != null ? formatPercentage(change) : '--';

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-700">
      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-slate-100 text-center">
        {formatSymbolDisplay(symbol)}
      </td>
      <td className={`px-3 py-2 text-xs font-bold text-center ${rsiValue != null ? getRsiColor(rsiValue, settings.rsiOverbought, settings.rsiOversold) : 'text-gray-400 dark:text-slate-500'}`}>
        {rsiText}
      </td>
      <td className="px-3 py-2 text-xs text-gray-900 dark:text-slate-100 font-mono text-center">
        {priceText}
      </td>
      <td className={`px-3 py-2 text-xs font-medium text-center ${change != null ? (change >= 0 ? 'text-success-600' : 'text-danger-600') : 'text-gray-400 dark:text-slate-500'}`}>
        {changeText}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromWishlist(symbol);
          }}
          disabled={isRemoving}
          className="p-1 text-gray-400 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-md transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove from watchlist"
        >
          {isRemoving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      </td>
    </tr>
  );
};



const RSIOverboughtOversoldTracker = () => {
  const { 
    getOversoldPairs, 
    getOverboughtPairs,
    getAllPairsWithRFI,
    addToWishlist, 
    isInWishlist,
    getRsiEvents,
    getRsiHistory,
    getPriceHistory,
    settings,
    rsiData,
    isConnected,
    autoSubscribeToMajorPairs,
    updateSettings,
    timeframes,
    getLatestTickForSymbol,
    getLatestOhlcForSymbol
  } = useRSITrackerStore();
  
  // Get tab state from base market store
  const { 
    tabState, 
    updateRSITrackerTab, 
    loadTabState,
    getWishlistArray,
    removeFromWishlist,
    isInWishlist: _isInWishlistBase
  } = useBaseMarketStore();
  
  // Alert functionality
  const { user } = useAuth();
  const [showRSIAlertConfig, setShowRSIAlertConfig] = useState(false);
  const [activeRSIAlertsCount, setActiveRSIAlertsCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState(tabState.rsiTracker?.activeTab || 'oversold');
  const [showSettings, setShowSettings] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [viewMode] = useState('table'); // 'table', 'cards', or 'expandable'
  const [showWatchlist, setShowWatchlist] = useState(false); // New state for watchlist view
  const [removingSymbol, setRemovingSymbol] = useState(null); // State for tracking which symbol is being removed
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    rsiPeriod: settings.rsiPeriod,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold
  });

  // Load tab state on component mount
  useEffect(() => {
    loadTabState();
  }, [loadTabState]);

  // Update activeTab when tabState changes
  useEffect(() => {
    if (tabState.rsiTracker?.activeTab) {
      setActiveTab(tabState.rsiTracker.activeTab);
    }
  }, [tabState.rsiTracker?.activeTab]);

  // Alert handlers
  const handleRSIBellClick = () => {
    setShowRSIAlertConfig(true);
  };

  const handleRSIAlertConfigClose = () => {
    setShowRSIAlertConfig(false);
    // Refresh active RSI alerts count when modal closes
    if (user) {
      const loadActiveRSIAlertsCount = async () => {
        try {
          const activeRSIAlerts = await rsiAlertService.getActiveAlerts();
          setActiveRSIAlertsCount(activeRSIAlerts.length);
        } catch (error) {
          console.error('Failed to load active RSI alerts count:', error);
        }
      };
      loadActiveRSIAlertsCount();
    }
  };

  // Load active RSI alerts count when user is logged in
  useEffect(() => {
    if (user) {
      const loadActiveRSIAlertsCount = async () => {
        try {
          const activeRSIAlerts = await rsiAlertService.getActiveAlerts();
          setActiveRSIAlertsCount(activeRSIAlerts.length);
        } catch (error) {
          console.error('Failed to load active RSI alerts count:', error);
        }
      };
      loadActiveRSIAlertsCount();
    }
  }, [user]);
  
  // Auto-subscribe to major pairs when connection is established
  useEffect(() => {
    if (!isConnected || hasAutoSubscribed) return;

    const timer = setTimeout(() => {
      autoSubscribeToMajorPairs();
      setHasAutoSubscribed(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isConnected, hasAutoSubscribed, autoSubscribeToMajorPairs]);

  // Get fresh data every time RSI data updates
  const rawOversoldPairs = getOversoldPairs();
  const rawOverboughtPairs = getOverboughtPairs();
  const _allPairs = getAllPairsWithRFI(); // Unused variable, prefixed with underscore

  // Use raw pairs directly (no filtering/sorting needed)
  const oversoldPairs = rawOversoldPairs;
  const overboughtPairs = rawOverboughtPairs;
  // const filteredAllPairs = filterAndSortPairs(allPairs, filters, sortOptions); // Reserved for future use

  // React to RSI data changes to ensure UI updates
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('RSI data updated in tracker, oversold:', oversoldPairs.length, 'overbought:', overboughtPairs.length);
  }, [rsiData, oversoldPairs.length, overboughtPairs.length]);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await userStateService.getUserDashboardSettings();
        if (savedSettings.rsiTracker) {
          const { timeframe, rsiPeriod, rsiOverbought, rsiOversold } = savedSettings.rsiTracker;
          
          // Update local settings state
          setLocalSettings({
            timeframe: timeframe || settings.timeframe,
            rsiPeriod: rsiPeriod || settings.rsiPeriod,
            rsiOverbought: rsiOverbought || settings.rsiOverbought,
            rsiOversold: rsiOversold || settings.rsiOversold
          });

          // Update store settings
          updateSettings({
            timeframe: timeframe || settings.timeframe,
            rsiPeriod: rsiPeriod || settings.rsiPeriod,
            rsiOverbought: rsiOverbought || settings.rsiOverbought,
            rsiOversold: rsiOversold || settings.rsiOversold
          });

        }
      } catch (error) {
        console.error('❌ Failed to load RSI Tracker settings:', error);
      }
    };

    loadSettings();
  }, [settings.rsiOverbought, settings.rsiOversold, settings.rsiPeriod, settings.timeframe, updateSettings]);

  const handleAddToWishlist = (symbol) => {
    addToWishlist(symbol);
  };

  const handleRemoveFromWishlist = async (symbol) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setRemovingSymbol(symbol);
    try {
      await removeFromWishlist(symbol);
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    } finally {
      setRemovingSymbol(null);
    }
  };

  // Get watchlist symbols
  const watchlistSymbols = getWishlistArray();

  const handleSaveSettings = async () => {
    try {
      // Validate and enforce oversold < overbought constraint
      let validatedOverbought = clamp(localSettings.rsiOverbought, 50, 90);
      let validatedOversold = clamp(localSettings.rsiOversold, 10, 50);
      
      // Ensure oversold < overbought
      if (validatedOversold >= validatedOverbought) {
        validatedOversold = Math.max(10, validatedOverbought - 1);
        validatedOverbought = Math.min(90, validatedOversold + 1);
      }

      // Update local store first
      updateSettings({
        timeframe: localSettings.timeframe,
        rsiPeriod: localSettings.rsiPeriod,
        rsiOverbought: validatedOverbought,
        rsiOversold: validatedOversold
      });

      // Persist to database
      await userStateService.updateUserDashboardSettings({
        rsiTracker: {
          timeframe: localSettings.timeframe,
          rsiPeriod: localSettings.rsiPeriod,
          rsiOverbought: validatedOverbought,
          rsiOversold: validatedOversold
        }
      });

      setShowSettings(false);
    } catch (error) {
      console.error('❌ Failed to save RSI Tracker settings:', error);
    }
  };

  const handleResetSettings = () => {
    setLocalSettings({
      timeframe: settings.timeframe,
      rsiPeriod: settings.rsiPeriod,
      rsiOverbought: settings.rsiOverbought,
      rsiOversold: settings.rsiOversold
    });
  };

  // Handle tab change with persistence
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    try {
      await updateRSITrackerTab(tabId);
    } catch (error) {
      console.error('Failed to update RSI tracker tab state:', error);
      // Revert on error
      setActiveTab(activeTab);
    }
  };

  const tabs = [
    { 
      id: 'oversold', 
      label: 'Oversold', 
      count: oversoldPairs.length,
      color: 'text-success-600'
    },
    { 
      id: 'overbought', 
      label: 'Overbought', 
      count: overboughtPairs.length,
      color: 'text-danger-600'
    }
  ];

  const currentPairs = activeTab === 'oversold' ? oversoldPairs : overboughtPairs;

  return (
    <>
    <div className="widget-card px-4 pb-4 h-full flex flex-col z-10 relative">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="mb-2">
        <div className="widget-header flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">RSI Tracker</h2>
              </div>
              {/* Connection status pill removed; status shown as top-right dot */}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {/* Watchlist Toggle Button */}
            <button
              onClick={() => setShowWatchlist(!showWatchlist)}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-1.5 ${
                showWatchlist 
                  ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 shadow-blue-200' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-gray-200'
              }`}
              title={showWatchlist ? "Show RSI Tracker" : "Show Watchlist"}
            >
              {showWatchlist ? <List className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              <span className="text-xs font-medium">{showWatchlist ? 'RSI Tracker' : 'Watchlist'}</span>
            </button>
            
            {/* RSI Alert Bell Icon */}
            {user && (
              <button 
                type="button"
                aria-label="Configure RSI alerts"
                onClick={handleRSIBellClick}
                className="relative p-1 text-gray-400 dark:text-slate-400 hover:text-orange-500 transition-colors duration-300 group"
              >
                <Bell className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                {activeRSIAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {activeRSIAlertsCount > 9 ? '9+' : activeRSIAlertsCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title="Dashboard Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>


        {/* Tab Navigation - Only show when not in watchlist mode */}
        {!showWatchlist && (
          <div className="flex space-x-0.5 mb-1 p-0.5 bg-gray-100 dark:bg-slate-700 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center py-1.5 px-0.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              <span className={`ml-0.5 px-1 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-gray-100 dark:bg-slate-500 text-gray-700 dark:text-slate-200' : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-1">
        {showWatchlist ? (
          // Watchlist View
          watchlistSymbols.length > 0 ? (
            <div>
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Pair
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      RSI
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Price
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Daily %
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600 text-xs text-left">
                  {watchlistSymbols.map((symbol) => {
                    const isRemoving = removingSymbol === symbol;
                    return (
                      <WatchlistRow
                        key={symbol}
                        symbol={symbol}
                        onRemoveFromWishlist={handleRemoveFromWishlist}
                        settings={settings}
                        rsiData={rsiData}
                        getLatestTickForSymbol={getLatestTickForSymbol}
                        getLatestOhlcForSymbol={getLatestOhlcForSymbol}
                        isRemoving={isRemoving}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
                  <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                  No watchlist items
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm">
                  Click on currency pairs in the RSI tracker to add them to your watchlist.
                </p>
              </div>
            </div>
          )
        ) : (
          // RSI Tracker View
          currentPairs.length > 0 ? (
            <div>
              {viewMode === 'table' ? (
                <table className="w-full divide-y divide-gray-200 dark:divide-slate-600">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Pair
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        RSI
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Price
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Daily %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600 text-xs text-left">
                    {currentPairs.map((pair) => (
                      <PairRow
                        key={pair.symbol}
                        pair={pair}
                        onAddToWishlist={handleAddToWishlist}
                        isInWishlist={isInWishlist(pair.symbol)}
                        settings={settings}
                      />
                    ))}
                  </tbody>
                </table>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 gap-2 p-2">
                  {currentPairs.map((pair) => (
                    <RFIScoreCard
                      key={pair.symbol}
                      symbol={pair.symbol}
                      rfiData={pair.rfiData}
                      price={pair.price}
                      change={pair.change}
                      volume={pair.volume}
                      onAddToWishlist={handleAddToWishlist}
                      isInWishlist={isInWishlist(pair.symbol)}
                      className="text-xs"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800">
                  {/* Expandable View Header */}
                  <div className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 px-3 py-3">
                    <div className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400">
                      <div className="w-24 text-center px-2">Pair</div>
                      <div className="w-20 text-center px-2">RSI</div>
                      <div className="w-24 text-center px-2">Price</div>
                      <div className="w-20 text-center px-2">Change</div>
                      <div className="w-16 text-center px-2">Events</div>
                      <div className="w-12 text-center px-2"></div>
                    </div>
                  </div>
                  
                  {/* Expandable Rows */}
                  {currentPairs.map((pair) => (
                    <ExpandablePairRow
                      key={pair.symbol}
                      pair={pair}
                      onAddToWishlist={handleAddToWishlist}
                      isInWishlist={isInWishlist(pair.symbol)}
                      settings={settings}
                      rsiHistory={getRsiHistory(pair.symbol)}
                      priceHistory={getPriceHistory(pair.symbol)}
                      rsiEvents={getRsiEvents(pair.symbol)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                activeTab === 'oversold' ? 'bg-success-100 dark:bg-success-900/20' : 'bg-danger-100 dark:bg-danger-900/20'
              }`}>
                {activeTab === 'oversold' ? (
                  <TrendingDown className="w-6 h-6 text-success-600 dark:text-success-400" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-danger-600 dark:text-danger-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                No {activeTab} pairs found
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                No currency pairs are currently in the {activeTab} zone 
                ({activeTab === 'oversold' ? `< ${settings.rsiOversold}` : `> ${settings.rsiOverbought}`}).
              </p>
              </div>
            </div>
          )
        )}
      </div>


    </div>
    
    {/* RSI Alert Configuration Modal - Outside widget for proper z-index */}
    <RSIAlertConfig 
      isOpen={showRSIAlertConfig} 
      onClose={handleRSIAlertConfigClose} 
    />
    
    {/* Settings Modal - Outside widget for proper z-index */}
    {showSettings && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">RSI Tracker Settings</h3>
          
          <div className="space-y-4">
            {/* Timeframe */}
            <div>
              <label htmlFor="rsi-tracker-timeframe" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Timeframe
              </label>
              <select
                id="rsi-tracker-timeframe"
                value={localSettings.timeframe}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, timeframe: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {timeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* RSI Period */}
            <div>
              <label htmlFor="rsi-tracker-period" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                RSI Period
              </label>
              <input
                id="rsi-tracker-period"
                type="number"
                min="2"
                max="50"
                value={localSettings.rsiPeriod}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setLocalSettings(prev => ({ ...prev, rsiPeriod: Number.isFinite(n) ? clamp(n, 2, 50) : prev.rsiPeriod }));
                }}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Overbought Level */}
            <div>
              <label htmlFor="rsi-tracker-overbought" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Overbought Level
              </label>
              <input
                id="rsi-tracker-overbought"
                type="number"
                min="50"
                max="90"
                value={localSettings.rsiOverbought}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  if (!Number.isFinite(n)) return;
                  
                  const newOverbought = clamp(n, 50, 90);
                  setLocalSettings(prev => {
                    // If new overbought <= current oversold, adjust oversold
                    if (newOverbought <= prev.rsiOversold) {
                      const newOversold = Math.max(10, newOverbought - 1);
                      return { 
                        ...prev, 
                        rsiOverbought: newOverbought,
                        rsiOversold: newOversold
                      };
                    }
                    return { ...prev, rsiOverbought: newOverbought };
                  });
                }}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Oversold Level */}
            <div>
              <label htmlFor="rsi-tracker-oversold" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Oversold Level
              </label>
              <input
                id="rsi-tracker-oversold"
                type="number"
                min="10"
                max="50"
                value={localSettings.rsiOversold}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  if (!Number.isFinite(n)) return;
                  
                  const newOversold = clamp(n, 10, 50);
                  setLocalSettings(prev => {
                    // If new oversold >= current overbought, adjust overbought
                    if (newOversold >= prev.rsiOverbought) {
                      const newOverbought = Math.min(90, newOversold + 1);
                      return { 
                        ...prev, 
                        rsiOversold: newOversold,
                        rsiOverbought: newOverbought
                      };
                    }
                    return { ...prev, rsiOversold: newOversold };
                  });
                }}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
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
      </div>
    )}
    </>
  );
};

export default RSIOverboughtOversoldTracker;
