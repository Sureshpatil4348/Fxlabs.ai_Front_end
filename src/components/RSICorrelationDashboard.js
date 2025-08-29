import React, { useState, useEffect } from 'react';
import useRSICorrelationStore from '../store/useRSICorrelationStore';
import { formatSymbolDisplay, getStatusColor, getStatusIcon, formatRsi, sortCorrelationPairs } from '../utils/formatters';
import { RefreshCw, TrendingUp, TrendingDown, Settings, BarChart3, Activity } from 'lucide-react';

const CorrelationPairCard = ({ pairKey, pairData, pair, calculationMode, realCorrelationData }) => {
  const [symbol1, symbol2] = pair;
  
  if (calculationMode === 'real_correlation') {
    const correlationData = realCorrelationData.get(pairKey);
    if (!correlationData) {
      return (
        <div className="p-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Calculating...</span>
        </div>
      );
    }
    
    const { correlation, strength, type } = correlationData;
    const correlationValue = (correlation * 100).toFixed(1);
    
    // Determine color based on correlation strength and type
    let cardColor = 'border-gray-300 bg-gray-50';
    let strengthColor = 'text-gray-600';
    
    if (Math.abs(correlation) >= 0.7) {
      cardColor = type === 'positive' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
      strengthColor = type === 'positive' ? 'text-green-700' : 'text-red-700';
    } else if (Math.abs(correlation) >= 0.3) {
      cardColor = type === 'positive' ? 'border-green-300 bg-green-25' : 'border-red-300 bg-red-25';
      strengthColor = type === 'positive' ? 'text-green-600' : 'text-red-600';
    }
    
    return (
      <div className={`p-2 rounded-md border-2 transition-all duration-500 hover:shadow-sm ${cardColor}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <span className={`text-xs font-medium uppercase tracking-wide ${strengthColor}`}>
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
          <div className={`text-xs font-bold ${strengthColor}`}>
            {strength.toUpperCase()}
          </div>
        </div>
        
        <div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="text-center p-1 bg-opacity-50 rounded transition-all duration-300">
              <div className={`font-medium text-xs ${strengthColor}`}>{formatSymbolDisplay(symbol1)}</div>
            </div>
            <div className="text-center p-1 bg-opacity-50 rounded transition-all duration-300">
              <div className={`font-medium text-xs ${strengthColor}`}>{formatSymbolDisplay(symbol2)}</div>
            </div>
          </div>
          <div className={`text-center p-1 rounded text-xs font-bold ${strengthColor}`}>
            {correlationValue}%
          </div>
        </div>
      </div>
    );
  }
  
  // Original RSI threshold mode
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
    realCorrelationData,
    settings,
    recalculateAllRsi,
    calculateAllCorrelations,
    subscriptions,
    isConnected,
    updateSettings,
    autoSubscribeToCorrelationPairs,
    timeframes,
    correlationWindows
  } = useRSICorrelationStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: settings.timeframe,
    rsiPeriod: settings.rsiPeriod,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold,
    correlationWindow: settings.correlationWindow,
    calculationMode: settings.calculationMode
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

  // Trigger initial calculations when we have data
  useEffect(() => {
    if (subscriptions.size > 0) {
      if (localSettings.calculationMode === 'real_correlation') {
        calculateAllCorrelations();
      } else {
        recalculateAllRsi();
      }
    }
  }, [subscriptions.size, localSettings.calculationMode, recalculateAllRsi, calculateAllCorrelations]);

  // React to data changes to ensure UI updates
  useEffect(() => {
  }, [correlationStatus, realCorrelationData]);

  // Reset hasAutoSubscribed when timeframe changes to ensure re-subscription
  useEffect(() => {
    setHasAutoSubscribed(false);
  }, [settings.timeframe]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (localSettings.calculationMode === 'real_correlation') {
      calculateAllCorrelations();
    } else {
      recalculateAllRsi();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSaveSettings = () => {
    updateSettings({
      timeframe: localSettings.timeframe,
      rsiPeriod: localSettings.rsiPeriod,
      rsiOverbought: localSettings.rsiOverbought,
      rsiOversold: localSettings.rsiOversold,
      correlationWindow: localSettings.correlationWindow,
      calculationMode: localSettings.calculationMode
    });
    setShowSettings(false);
  };

  const handleResetSettings = () => {
    setLocalSettings({
      timeframe: settings.timeframe,
      rsiPeriod: settings.rsiPeriod,
      rsiOverbought: settings.rsiOverbought,
      rsiOversold: settings.rsiOversold,
      correlationWindow: settings.correlationWindow,
      calculationMode: settings.calculationMode
    });
  };

  const handleCalculationModeToggle = () => {
    const newMode = localSettings.calculationMode === 'rsi_threshold' ? 'real_correlation' : 'rsi_threshold';
    setLocalSettings(prev => ({ ...prev, calculationMode: newMode }));
  };

  // Get sorted pairs based on calculation mode
  let sortedPairs;
  if (localSettings.calculationMode === 'real_correlation') {
    sortedPairs = Array.from(realCorrelationData.entries()).sort(([, a], [, b]) => {
      // Sort by correlation strength (absolute value)
      return Math.abs(b.correlation) - Math.abs(a.correlation);
    });
  } else {
    sortedPairs = sortCorrelationPairs(correlationStatus);
  }
  
  // Prepare data for grid display (expand to 6x3 grid = 18 pairs)
  const gridPairs = sortedPairs.slice(0, 18);
  
  // Calculate statistics based on calculation mode
  let totalPairs, matches, mismatches, neutral;
  
  if (localSettings.calculationMode === 'real_correlation') {
    totalPairs = sortedPairs.length;
    const strongCorrelations = sortedPairs.filter(([, data]) => data.strength === 'strong').length;
    const moderateCorrelations = sortedPairs.filter(([, data]) => data.strength === 'moderate').length;
    const weakCorrelations = sortedPairs.filter(([, data]) => data.strength === 'weak').length;
    
    matches = strongCorrelations;
    mismatches = weakCorrelations;
    neutral = moderateCorrelations;
  } else {
    totalPairs = sortedPairs.length;
    matches = sortedPairs.filter(([, data]) => data.status === 'match').length;
    mismatches = sortedPairs.filter(([, data]) => data.status === 'mismatch').length;
    neutral = sortedPairs.filter(([, data]) => data.status === 'neutral').length;
  }

  return (
    <div className="card z-10 relative">
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
            {localSettings.calculationMode === 'real_correlation' ? (
              `Correlation Window: ${localSettings.correlationWindow} | ${localSettings.timeframe}`
            ) : (
              `Period: ${localSettings.rsiPeriod} | Overbought: ${localSettings.rsiOverbought} | Oversold: ${localSettings.rsiOversold} | ${localSettings.timeframe}`
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Calculation Mode Toggle */}
          <button
            onClick={handleCalculationModeToggle}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all duration-300 flex items-center space-x-2 ${
              localSettings.calculationMode === 'real_correlation'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
            title={`Switch to ${localSettings.calculationMode === 'rsi_threshold' ? 'Real Correlation' : 'RSI Threshold'} mode`}
          >
            {localSettings.calculationMode === 'real_correlation' ? (
              <>
                <Activity className="w-3 h-3" />
                <span>Real Correlation</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3 h-3" />
                <span>RSI Threshold</span>
              </>
            )}
          </button>
          
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

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{totalPairs}</div>
          <div className="text-xs text-gray-600">Total Pairs</div>
        </div>
        <div className="text-center p-3 bg-success-50 rounded-lg">
          <div className="text-2xl font-bold text-success-600">{matches}</div>
          <div className="text-xs text-success-700">
            {localSettings.calculationMode === 'real_correlation' ? 'Strong' : 'Matches'}
          </div>
        </div>
        <div className="text-center p-3 bg-danger-50 rounded-lg">
          <div className="text-2xl font-bold text-danger-600">{mismatches}</div>
          <div className="text-xs text-danger-700">
            {localSettings.calculationMode === 'real_correlation' ? 'Weak' : 'Mismatches'}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{neutral}</div>
          <div className="text-xs text-gray-600">
            {localSettings.calculationMode === 'real_correlation' ? 'Moderate' : 'Neutral'}
          </div>
        </div>
      </div>

      {/* 6x3 Grid of Correlation Pairs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {gridPairs.map(([pairKey, pairData]) => {
          const [symbol1, symbol2] = pairKey.split('_');
          return (
            <CorrelationPairCard
              key={pairKey}
              pairKey={pairKey}
              pairData={pairData}
              pair={[symbol1, symbol2]}
              calculationMode={localSettings.calculationMode}
              realCorrelationData={realCorrelationData}
            />
          );
        })}
        
        {/* Fill empty slots if less than 18 pairs */}
        {Array.from({ length: Math.max(0, 18 - gridPairs.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="p-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
          >
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RSI Correlation Settings</h3>
            
            <div className="space-y-4">
              {/* Calculation Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calculation Mode
                </label>
                <select
                  value={localSettings.calculationMode}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, calculationMode: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rsi_threshold">RSI Threshold Analysis</option>
                  <option value="real_correlation">Real Rolling Correlation</option>
                </select>
              </div>

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

              {/* Correlation Window (only show for real correlation mode) */}
              {localSettings.calculationMode === 'real_correlation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correlation Window
                  </label>
                  <select
                    value={localSettings.correlationWindow}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, correlationWindow: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {correlationWindows.map(window => (
                      <option key={window} value={window}>{window} periods</option>
                    ))}
                  </select>
                </div>
              )}

              {/* RSI Settings (only show for RSI threshold mode) */}
              {localSettings.calculationMode === 'rsi_threshold' && (
                <>
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
                </>
              )}
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
