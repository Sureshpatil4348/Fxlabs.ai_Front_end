import { TrendingDown, TrendingUp, Settings, Activity, Bell, Star, List, Trash2, Loader2, Plus, Search, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import ExpandablePairRow from './ExpandablePairRow';
import RFIScoreCard from './RFIScoreCard';
import RSITrackerAlertConfig from './RSITrackerAlertConfig';
import { useAuth } from '../auth/AuthProvider';
import rsiTrackerAlertService from '../services/rsiTrackerAlertService';
import userStateService from '../services/userStateService';
import useBaseMarketStore from '../store/useBaseMarketStore';
import useRSICorrelationStore from '../store/useRSICorrelationStore';
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

const WatchlistRow = ({ symbol, onRemoveFromWishlist, settings, rsiData, getLatestTickForSymbol, getDailyChangePercent, isRemoving }) => {
  // Convert watchlist symbol (base format) to RSI Tracker format (with 'm' suffix)
  const rsiSymbol = symbol + 'm';
  
  const latestTick = getLatestTickForSymbol(rsiSymbol);
  const rsiValue = rsiData.get(rsiSymbol)?.value ?? null;
  
  const price = latestTick?.bid || null;
  const change = getDailyChangePercent ? getDailyChangePercent(rsiSymbol) : (latestTick?.daily_change_pct || null);
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
    subscribeWatchlistSymbol,
    unsubscribe,
    isInWishlist,
    getRsiEvents,
    getRsiHistory,
    getPriceHistory,
    settings,
    rsiData,
    isConnected,
    connect,
    updateSettings,
    timeframes,
    getLatestTickForSymbol,
    getDailyChangePercent
  } = useRSITrackerStore();
  // Read correlation settings to keep tracker in sync (timeframe only)
  const { settings: _corrSettings } = useRSICorrelationStore();
  
  // Get tab state from base market store
  const { 
    tabState, 
    updateRSITrackerTab, 
    loadTabState,
    getWishlistArray,
    loadWatchlist,
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
  const [showWatchlist, setShowWatchlist] = useState(
    tabState.rsiTracker?.showWatchlist === true
  ); // persisted toggle
  const [removingSymbol, setRemovingSymbol] = useState(null); // State for tracking which symbol is being removed
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold
  });
  // Manual add-to-watchlist modal state (Watchlist mode)
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingSymbol, setAddingSymbol] = useState(null);
  const lastPricingKeyRef = React.useRef('');

  // Load tab state on component mount
  useEffect(() => {
    loadTabState();
  }, [loadTabState]);

  // Ensure watchlist is loaded once user is available
  useEffect(() => {
    if (user) {
      loadWatchlist().catch((err) => {
        console.error('Failed to load watchlist:', err);
      });
    }
  }, [user, loadWatchlist]);

  // Update activeTab and watchlist toggle when tabState changes
  useEffect(() => {
    if (tabState.rsiTracker?.activeTab) {
      setActiveTab(tabState.rsiTracker.activeTab);
    }
    if (typeof tabState.rsiTracker?.showWatchlist === 'boolean') {
      setShowWatchlist(tabState.rsiTracker.showWatchlist);
    }
  }, [tabState.rsiTracker?.activeTab, tabState.rsiTracker?.showWatchlist]);

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
          const alert = await rsiTrackerAlertService.getActiveAlert();
          setActiveRSIAlertsCount(alert ? 1 : 0);
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
          const alert = await rsiTrackerAlertService.getActiveAlert();
          setActiveRSIAlertsCount(alert ? 1 : 0);
        } catch (error) {
          console.error('Failed to load active RSI alerts count:', error);
        }
      };
      loadActiveRSIAlertsCount();
    }
  }, [user]);
  
  // Limit subscriptions scope: remove auto-subscribe majors.
  // Subscriptions will be driven by watchlist and user interactions only.
  useEffect(() => {
    if (!isConnected) return;
    if (!hasAutoSubscribed) {
      setHasAutoSubscribed(true);
    }
  }, [isConnected, hasAutoSubscribed]);

  // Ensure WebSocket connection on mount for real-time RSI/ticks/OHLC
  useEffect(() => {
    if (!isConnected) {
      try { connect(); } catch (_e) {}
    }
  }, [isConnected, connect]);

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
    //console.log('RSI data updated in tracker, oversold:', oversoldPairs.length, 'overbought:', overboughtPairs.length);
  }, [rsiData, oversoldPairs.length, overboughtPairs.length]);

  // Period is fixed at 14; no cross-sync needed

  // Load settings from database on user change (avoid continuous overwrites that can desync timeframes)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await userStateService.getUserDashboardSettings();
        if (savedSettings.rsiTracker) {
          const { timeframe, rsiOverbought, rsiOversold } = savedSettings.rsiTracker;
          // Normalize disallowed timeframe (exclude 1M/M1)
          const normalizedTf = (timeframe === '1M' || timeframe === 'M1') ? '5M' : timeframe;
          
          // Update local settings state using only provided keys
          setLocalSettings(prev => ({
            ...prev,
            ...(normalizedTf != null ? { timeframe: normalizedTf } : {}),
            ...(rsiOverbought != null ? { rsiOverbought } : {}),
            ...(rsiOversold != null ? { rsiOversold } : {})
          }));

          // Update store settings using partial update
          const partialUpdate = {};
          if (normalizedTf != null) partialUpdate.timeframe = normalizedTf;
          if (rsiOverbought != null) partialUpdate.rsiOverbought = rsiOverbought;
          if (rsiOversold != null) partialUpdate.rsiOversold = rsiOversold;
          if (Object.keys(partialUpdate).length > 0) {
            updateSettings(partialUpdate);
          }

        }
      } catch (error) {
        console.error('❌ Failed to load RSI Tracker settings:', error);
      }
    };

    loadSettings();
  }, [user, updateSettings]);

  

  // Fetch initial RSI snapshot on mount and whenever timeframe or autosubscribe symbols change
  useEffect(() => {
    let cancelled = false;
    const fetchInitial = async () => {
      try {
        const symbols = (settings?.autoSubscribeSymbols || []).slice(0, 32);
        if (symbols.length === 0 || !settings?.timeframe) return;
        const { fetchIndicatorSnapshot } = (await import('../services/indicatorService.js')).default;
        const res = await fetchIndicatorSnapshot({
          indicator: 'rsi',
          timeframe: settings.timeframe,
          pairs: symbols
        });
        if (cancelled) return;
        const pairs = res?.pairs || [];
        if (pairs.length > 0) {
          // Get current rsiData from store to merge with fetched data
          const currentRsiData = useRSITrackerStore.getState().rsiData;
          const newRsiData = new Map(currentRsiData);
          pairs.forEach((p) => {
            newRsiData.set(p.symbol, {
              value: p.value,
              period: 14,
              timeframe: p.timeframe,
              updatedAt: new Date(p.ts || Date.now())
            });
          });
          // Update store
          useRSITrackerStore.setState({ rsiData: newRsiData });
        }
      } catch (_e) {
        // silent; websocket will fill
      }
    };
    fetchInitial();
    return () => { cancelled = true; };
  }, [settings.timeframe, settings?.autoSubscribeSymbols]);

  const handleAddToWishlist = (symbol) => {
    addToWishlist(symbol);
    try {
      subscribeWatchlistSymbol(symbol);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to subscribe newly added watchlist symbol:', symbol, e);
    }
  };

  const handleRemoveFromWishlist = async (symbol) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setRemovingSymbol(symbol);
    try {
      // Unsubscribe from streaming first to limit resource usage
      try { unsubscribe(symbol + 'm'); } catch (_e) { /* ignore */ }
      await removeFromWishlist(symbol);
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    } finally {
      setRemovingSymbol(null);
    }
  };

  // Get watchlist symbols
  const watchlistSymbols = getWishlistArray();

  // Derive available pairs from RSI Tracker store's autoSubscribeSymbols (convert 'EURUSDm' -> 'EURUSD')
  const availablePairs = React.useMemo(() => {
    const symbols = settings?.autoSubscribeSymbols || [];
    return symbols
      .map((s) => (s?.toUpperCase().endsWith('M') ? s.toUpperCase().slice(0, -1) : s.toUpperCase()))
      .filter(Boolean);
  }, [settings?.autoSubscribeSymbols]);

  // Filter available pairs based on search term and existing wishlist
  const filteredPairs = React.useMemo(() => {
    const wl = watchlistSymbols || [];
    const term = (searchTerm || '').toLowerCase();
    return availablePairs.filter((pair) => {
      const notInList = !wl.includes(pair);
      const matches = pair.toLowerCase().includes(term) ||
        formatSymbolDisplay(pair).toLowerCase().includes(term);
      return notInList && matches;
    });
  }, [availablePairs, watchlistSymbols, searchTerm]);

  const handleAddPair = async (symbol) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    setAddingSymbol(symbol);
    try {
      await addToWishlist(symbol);
      setShowAddModal(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    } finally {
      setAddingSymbol(null);
    }
  };

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
        rsiOverbought: validatedOverbought,
        rsiOversold: validatedOversold
      });
      // TODO: Trigger an API fetch for RSI snapshot for the new configuration
      // UI will remain in blank/placeholder state until websocket updates arrive

      // Persist to database
      await userStateService.updateUserDashboardSettings({
        rsiTracker: {
          timeframe: localSettings.timeframe,
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

  // Compute visible RSI symbols for pricing snapshots (after dependencies are defined)
  const visibleRsiSymbols = React.useMemo(() => {
    if (showWatchlist) {
      const bases = (watchlistSymbols || []).map((s) => (s || '').toUpperCase());
      return Array.from(new Set(bases.map((b) => (b.endsWith('M') || b.endsWith('m') ? b.slice(0, -1) : b).concat('m')))).slice(0, 32);
    }
    const symbols = (currentPairs || []).map((p) => p.symbol).filter(Boolean);
    return Array.from(new Set(symbols)).slice(0, 32);
  }, [showWatchlist, watchlistSymbols, currentPairs]);

  // Stable key for deduping pricing fetches
  const visiblePricingKey = React.useMemo(() => {
    const sorted = [...visibleRsiSymbols].sort();
    return sorted.join(',');
  }, [visibleRsiSymbols]);

  // Fetch initial pricing snapshots for visible pairs; subsequent updates via WebSocket ticks
  useEffect(() => {
    let cancelled = false;
    const fetchPricing = async () => {
      try {
        if (!visiblePricingKey || visiblePricingKey === lastPricingKeyRef.current) return;
        lastPricingKeyRef.current = visiblePricingKey;
        const { fetchPricingSnapshot } = (await import('../services/pricingService.js')).default;
        const res = await fetchPricingSnapshot({ pairs: visibleRsiSymbols });
        if (cancelled) return;
        const entries = res?.pairs || [];
        if (entries.length > 0) {
          try { useRSITrackerStore.getState().ingestPricingSnapshot(entries); } catch (_e) {}
        }
      } catch (_e) {
        // Silent; websocket ticks will fill in
      }
    };
    fetchPricing();
    return () => { cancelled = true; };
  }, [visiblePricingKey, visibleRsiSymbols]);

  return (
    <>
    <div className="widget-card px-4 pb-4 h-full flex flex-col z-1 relative">
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
              onClick={async () => {
                const next = !showWatchlist;
                setShowWatchlist(next);
                try {
                  await updateRSITrackerTab(activeTab);
                  await useBaseMarketStore.getState().updateRSITrackerShowWatchlist(next);
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to persist watchlist toggle:', e);
                }
              }}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-1.5 ${
                showWatchlist 
                  ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 shadow-blue-200' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-gray-200'
              }`}
              title={showWatchlist ? "Switch to RSI Tracker mode" : "Switch to Watchlist mode"}
            >
              {showWatchlist ? <List className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              <span className="text-xs font-medium">{showWatchlist ? 'Watchlist' : 'RSI Tracker'}</span>
            </button>

            {/* Add Pair (visible in Watchlist mode) */}
            {showWatchlist && user && (
              <button
                type="button"
                aria-label="Add currency pair to watchlist"
                onClick={() => setShowAddModal(true)}
                className="p-1 text-gray-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                title="Add currency pair"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            
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
                        getDailyChangePercent={getDailyChangePercent}
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
    <RSITrackerAlertConfig 
      isOpen={showRSIAlertConfig} 
      onClose={handleRSIAlertConfigClose} 
    />
    
    {/* Settings Modal - Outside widget for proper z-index */}
    {showSettings && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[5000]">
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
                {timeframes.filter(tf => tf !== '1M').map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* RSI Period removed: fixed at 14 */}

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

    {/* Add Currency Pair Modal (Watchlist mode) */}
    {showAddModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[5000]">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Add Currency Pair</h3>
            <button
              onClick={() => { setShowAddModal(false); setSearchTerm(''); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              aria-label="Close add pair modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search currency pairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Currency Pairs List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredPairs.length > 0 ? (
              <div className="space-y-2">
                {filteredPairs.map((pair) => (
                  <button
                    key={pair}
                    onClick={() => handleAddPair(pair)}
                    disabled={addingSymbol === pair}
                    className="w-full flex items-center justify-between p-3 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-slate-100">{formatSymbolDisplay(pair)}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{formatSymbolDisplay(pair)}</div>
                    </div>
                    {addingSymbol === pair ? (
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                    ) : (
                      <Plus className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-slate-400">
                  {searchTerm ? 'No matching pairs found' : 'All available pairs are already in your watchlist'}
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="text-xs text-gray-500 dark:text-slate-400 text-center">
              {filteredPairs.length} of {availablePairs.length} pairs available
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default RSIOverboughtOversoldTracker;
