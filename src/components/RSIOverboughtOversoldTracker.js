import React, { useState, useEffect } from 'react';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';
import { TrendingDown, TrendingUp, Plus, Settings } from 'lucide-react';

const PairRow = ({ pair, onAddToWishlist, isInWishlist, settings }) => {
  const { symbol, rsi, price, change } = pair;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-1 py-2 text-xs font-medium text-gray-900">
        {formatSymbolDisplay(symbol)}
      </td>
      <td className={`px-1 py-2 text-xs font-bold ${getRsiColor(rsi, settings.rsiOverbought, settings.rsiOversold)}`}>
        {formatRsi(rsi)}
      </td>
      <td className="px-1 py-2 text-xs text-gray-900 font-mono">
        {symbol.includes('JPY') ? formatPrice(price, 3) : formatPrice(price, 5)}
      </td>
      <td className={`px-1 py-2 text-xs font-medium ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
        {formatPercentage(change)}
      </td>
      {/* <td className="px-1 py-2 text-xs">
        <button
          onClick={() => onAddToWishlist(symbol)}
          disabled={isInWishlist}
          className={`p-1 rounded-md transition-colors ${
            isInWishlist 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
          }`}
          title={isInWishlist ? 'Already in wishlist' : 'Add to wishlist'}
        >
          <Plus className="w-4 h-4" />
        </button>
      </td> */}
    </tr>
  );
};



const RSIOverboughtOversoldTracker = () => {
  const { 
    getOversoldPairs, 
    getOverboughtPairs, 
    addToWishlist, 
    isInWishlist,
    settings,
    rsiData,
    isConnected,
    autoSubscribeToMajorPairs,
    updateSettings,
    timeframes
  } = useRSITrackerStore();
  
  const [activeTab, setActiveTab] = useState('oversold');
  const [showSettings, setShowSettings] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    rsiPeriod: settings.rsiPeriod,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold
  });

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
  const oversoldPairs = getOversoldPairs();
  const overboughtPairs = getOverboughtPairs();

  // React to RSI data changes to ensure UI updates
  useEffect(() => {
    console.log('RSI data updated in tracker, oversold:', oversoldPairs.length, 'overbought:', overboughtPairs.length);
  }, [rsiData, oversoldPairs.length, overboughtPairs.length]);

  const handleAddToWishlist = (symbol) => {
    addToWishlist(symbol);
  };

  const handleSaveSettings = () => {
    updateSettings({
      timeframe: localSettings.timeframe,
      rsiPeriod: localSettings.rsiPeriod,
      rsiOverbought: localSettings.rsiOverbought,
      rsiOversold: localSettings.rsiOversold
    });
    setShowSettings(false);
  };

  const handleResetSettings = () => {
    setLocalSettings({
      timeframe: settings.timeframe,
      rsiPeriod: settings.rsiPeriod,
      rsiOverbought: settings.rsiOverbought,
      rsiOversold: settings.rsiOversold
    });
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
    <div className="card h-80 flex flex-col z-9 relative">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-gray-900">RSI Tracker</h2>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? '● Connected' : '● Disconnected'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 pt-1">
              Oversold &lt; {settings.rsiOversold} | Overbought &gt; {settings.rsiOverbought}<br/> Period: {settings.rsiPeriod} | {settings.timeframe}
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Dashboard Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 p-1 bg-gray-100 rounded-lg flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-3 h-3 mr-2 ${activeTab === tab.id ? tab.color : ''}`} />
              {tab.label}
              <span className={`ml-1 px-1 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {currentPairs.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Pair
                  </th>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    RSI
                  </th>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Daily %
                  </th>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <select
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RSI Period
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overbought Level
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oversold Level
                </label>
                <input
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
