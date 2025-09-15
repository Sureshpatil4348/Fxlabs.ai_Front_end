import { TrendingDown, TrendingUp, Settings, Filter } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import ExpandablePairRow from './ExpandablePairRow';
import FilterPanel from './FilterPanel';
import RFIScoreCard from './RFIScoreCard';
import userStateService from '../services/userStateService';
import useBaseMarketStore from '../store/useBaseMarketStore';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { filterAndSortPairs, getDefaultFilters, getDefaultSortOptions } from '../utils/filterUtils';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';

const PairRow = ({ pair, onAddToWishlist, isInWishlist, settings }) => {
  const { symbol, rsi, price, change } = pair;

  return (
    <tr className={`hover:bg-gray-50 cursor-pointer ${isInWishlist ? 'bg-gray-100' : ''}`} onClick={() => onAddToWishlist(symbol)}>
      <td className="px-3 py-2 text-xs font-medium text-gray-900 text-center">
        {formatSymbolDisplay(symbol)}
      </td>
      <td className={`px-3 py-2 text-xs font-bold text-center ${getRsiColor(rsi, settings.rsiOverbought, settings.rsiOversold)}`}>
        {formatRsi(rsi)}
      </td>
      <td className="px-3 py-2 text-xs text-gray-900 font-mono text-center">
        {symbol.includes('JPY') ? formatPrice(price, 3) : formatPrice(price, 5)}
      </td>
      <td className={`px-3 py-2 text-xs font-medium text-center ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
        {formatPercentage(change)}
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
    timeframes
  } = useRSITrackerStore();
  
  // Get tab state from base market store
  const { tabState, updateRSITrackerTab, loadTabState } = useBaseMarketStore();
  
  const [activeTab, setActiveTab] = useState(tabState.rsiTracker?.activeTab || 'oversold');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards', or 'expandable'
  const [filters, setFilters] = useState(getDefaultFilters());
  const [sortOptions, setSortOptions] = useState(getDefaultSortOptions());
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

  // Apply filtering and sorting
  const oversoldPairs = filterAndSortPairs(rawOversoldPairs, filters, sortOptions);
  const overboughtPairs = filterAndSortPairs(rawOverboughtPairs, filters, sortOptions);
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

  const handleSaveSettings = async () => {
    try {
      // Update local store first
      updateSettings({
        timeframe: localSettings.timeframe,
        rsiPeriod: localSettings.rsiPeriod,
        rsiOverbought: localSettings.rsiOverbought,
        rsiOversold: localSettings.rsiOversold
      });

      // Persist to database
      await userStateService.updateUserDashboardSettings({
        rsiTracker: {
          timeframe: localSettings.timeframe,
          rsiPeriod: localSettings.rsiPeriod,
          rsiOverbought: localSettings.rsiOverbought,
          rsiOversold: localSettings.rsiOversold
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
      icon: TrendingDown, 
      count: oversoldPairs.length,
      color: 'text-success-600'
    },
    { 
      id: 'overbought', 
      label: 'Overbought', 
      icon: TrendingUp, 
      count: overboughtPairs.length,
      color: 'text-danger-600'
    }
  ];

  const currentPairs = activeTab === 'oversold' ? oversoldPairs : overboughtPairs;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full flex flex-col z-9 relative">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">RSI Tracker</h2>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? '● Connected' : '● Disconnected'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 pt-1">
              Oversold &lt; {settings.rsiOversold} | Overbought &gt; {settings.rsiOverbought} | Period: {settings.rsiPeriod} | {settings.timeframe}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 rounded-md transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
                   <button
                     onClick={() => {
                       const modes = ['table', 'cards', 'expandable'];
                       const currentIndex = modes.indexOf(viewMode);
                       const nextIndex = (currentIndex + 1) % modes.length;
                       setViewMode(modes[nextIndex]);
                     }}
                     className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                     title={`Switch View Mode (Current: ${viewMode})`}
                   >
                     {viewMode === 'table' ? '📋' : viewMode === 'cards' ? '📊' : '📈'}
                   </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Dashboard Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-2">
            <FilterPanel
              onFilterChange={setFilters}
              onSortChange={setSortOptions}
              initialFilters={filters}
              initialSort={sortOptions}
              className="text-xs"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-0.5 mb-1 p-0.5 bg-gray-100 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center py-1.5 px-0.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-3 h-3 mr-1 ${activeTab === tab.id ? tab.color : ''}`} />
              {tab.label}
              <span className={`ml-0.5 px-1 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-1">
        {currentPairs.length > 0 ? (
          <div>
            {viewMode === 'table' ? (
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Pair
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      RSI
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Price
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Daily %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-xs text-left">
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
              <div className="bg-white">
                {/* Expandable View Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-3">
                  <div className="flex items-center text-xs font-medium text-gray-500">
                    <div className="w-24 text-center px-2">Pair</div>
                    <div className="w-20 text-center px-2">RSI</div>
                    <div className="w-24 text-center px-2">Price</div>
                    <div className="w-20 text-center px-2">Change</div>
                    <div className="w-20 text-center px-2">Chart</div>
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
              activeTab === 'oversold' ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              {activeTab === 'oversold' ? (
                <TrendingDown className="w-6 h-6 text-success-600" />
              ) : (
                <TrendingUp className="w-6 h-6 text-danger-600" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} pairs found
            </h3>
            <p className="text-gray-500 text-sm">
              No currency pairs are currently in the {activeTab} zone 
              ({activeTab === 'oversold' ? `< ${settings.rsiOversold}` : `> ${settings.rsiOverbought}`}).
            </p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RSI Tracker Settings</h3>
            
            <div className="space-y-4">
              {/* Timeframe */}
              <div>
                <label htmlFor="rsi-tracker-timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <select
                  id="rsi-tracker-timeframe"
                  value={localSettings.timeframe}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              {/* RSI Period */}
              <div>
                <label htmlFor="rsi-tracker-period" className="block text-sm font-medium text-gray-700 mb-1">
                  RSI Period
                </label>
                <input
                  id="rsi-tracker-period"
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
                <label htmlFor="rsi-tracker-overbought" className="block text-sm font-medium text-gray-700 mb-1">
                  Overbought Level
                </label>
                <input
                  id="rsi-tracker-overbought"
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
                <label htmlFor="rsi-tracker-oversold" className="block text-sm font-medium text-gray-700 mb-1">
                  Oversold Level
                </label>
                <input
                  id="rsi-tracker-oversold"
                  type="number"
                  min="10"
                  max="50"
                  value={localSettings.rsiOversold}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, rsiOversold: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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

export default RSIOverboughtOversoldTracker;
