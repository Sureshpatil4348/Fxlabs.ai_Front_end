import React, { useState, useEffect } from 'react';
import useRSICorrelationStore from '../store/useRSICorrelationStore';
import { formatSymbolDisplay, getStatusColor, getStatusIcon, formatRsi, sortCorrelationPairs } from '../utils/formatters';
import { RefreshCw, TrendingUp, TrendingDown, Settings } from 'lucide-react';

const CorrelationPairCard = ({ pairKey, pairData, pair }) => {
  const [symbol1, symbol2] = pair;
  const { status, rsi1, rsi2, type } = pairData;
  
  return (
    <div className={`p-2 rounded-md border-2 transition-all duration-500 hover:shadow-sm ${getStatusColor(status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <span className="text-sm">{getStatusIcon(status)}</span>
          <span className="text-xs font-medium uppercase tracking-wide">
            {type === 'positive' ? (
              <span className="flex items-center">
                <TrendingUp className="w-2 h-2 mr-1" />
                Pos
              </span>
            ) : (
              <span className="flex items-center">
                <TrendingDown className="w-2 h-2 mr-1" />
                Neg
              </span>
            )}
          </span>
        </div>
        <div className="text-xs font-bold">
          {status === 'match' ? 'MATCH' : status === 'mismatch' ? 'MISMATCH' : 'NEUTRAL'}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="text-center p-1 bg-gray-50 bg-opacity-50 rounded transition-all duration-300">
            <div className="font-medium text-xs">{formatSymbolDisplay(symbol1)}</div>
            <div className="font-bold text-sm transition-all duration-300">{formatRsi(rsi1)}</div>
          </div>
          <div className="text-center p-1 bg-gray-50 bg-opacity-50 rounded transition-all duration-300">
            <div className="font-medium text-xs">{formatSymbolDisplay(symbol2)}</div>
            <div className="font-bold text-sm transition-all duration-300">{formatRsi(rsi2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RSICorrelationDashboard = () => {
  const { 
    correlationStatus, 
    settings,
    recalculateAllRsi,
    subscriptions,
    isConnected,
    updateSettings,
    autoSubscribeToCorrelationPairs,
    timeframes
  } = useRSICorrelationStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    rsiPeriod: settings.rsiPeriod,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold
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

  // Trigger initial RSI calculation when we have data
  useEffect(() => {
    if (subscriptions.size > 0) {
      recalculateAllRsi();
    }
  }, [subscriptions.size, recalculateAllRsi]);

  // React to RSI data changes to ensure UI updates
  useEffect(() => {
  }, [correlationStatus]);

  // Reset hasAutoSubscribed when timeframe changes to ensure re-subscription
  useEffect(() => {
    setHasAutoSubscribed(false);
  }, [settings.timeframe]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    recalculateAllRsi();
    setTimeout(() => setIsRefreshing(false), 1000);
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

  // Get sorted pairs with mismatches first
  const sortedPairs = sortCorrelationPairs(correlationStatus);
  
  // Prepare data for grid display (limit to 15 pairs for 5x3 grid)
  const gridPairs = sortedPairs.slice(0, 15);
  
  // Calculate statistics
  const totalPairs = sortedPairs.length;
  const matches = sortedPairs.filter(([, data]) => data.status === 'match').length;
  const mismatches = sortedPairs.filter(([, data]) => data.status === 'mismatch').length;
  const neutral = sortedPairs.filter(([, data]) => data.status === 'neutral').length;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">RSI Correlation Dashboard</h2>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Period: {settings.rsiPeriod} | Overbought: {settings.rsiOverbought} | Oversold: {settings.rsiOversold} | {settings.timeframe}
          </p>
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
            title="Refresh RSI Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{totalPairs}</div>
          <div className="text-xs text-gray-600">Total Pairs</div>
        </div>
        <div className="text-center p-3 bg-success-50 rounded-lg">
          <div className="text-2xl font-bold text-success-600">{matches}</div>
          <div className="text-xs text-success-700">Matches</div>
        </div>
        <div className="text-center p-3 bg-danger-50 rounded-lg">
          <div className="text-2xl font-bold text-danger-600">{mismatches}</div>
          <div className="text-xs text-danger-700">Mismatches</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{neutral}</div>
          <div className="text-xs text-gray-600">Neutral</div>
        </div>
      </div>

      {/* 5x3 Grid of Correlation Pairs */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {gridPairs.map(([pairKey, pairData]) => {
          const [symbol1, symbol2] = pairKey.split('_');
          return (
            <CorrelationPairCard
              key={pairKey}
              pairKey={pairKey}
              pairData={pairData}
              pair={[symbol1, symbol2]}
            />
          );
        })}
        
        {/* Fill empty slots if less than 15 pairs */}
        {Array.from({ length: Math.max(0, 15 - gridPairs.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="p-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
          >
            <span className="text-gray-400 text-xs">No Data</span>
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RSI Correlation Settings</h3>
            
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

export default RSICorrelationDashboard;
