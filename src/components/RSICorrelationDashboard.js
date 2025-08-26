import React, { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import { formatSymbolDisplay, getStatusColor, getStatusIcon, formatRsi, sortCorrelationPairs } from '../utils/formatters';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

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
        <div className="text-xs font-semibold text-center">
          {formatSymbolDisplay(symbol1)} / {formatSymbolDisplay(symbol2)}
        </div>
        
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="text-center p-1 bg-white bg-opacity-50 rounded transition-all duration-300">
            <div className="font-medium text-xs">{formatSymbolDisplay(symbol1)}</div>
            <div className="font-bold text-sm transition-all duration-300">{formatRsi(rsi1)}</div>
          </div>
          <div className="text-center p-1 bg-white bg-opacity-50 rounded transition-all duration-300">
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
    correlationPairs, 
    correlationStatus, 
    rsiSettings,
    globalSettings, 
    recalculateAllRsi,
    subscriptions,
    isConnected
  } = useMarketStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAutoSubscribed, setHasAutoSubscribed] = useState(false);

  // Auto-subscribe to correlation pairs when connection is established (only once)
  useEffect(() => {
    if (!isConnected || hasAutoSubscribed) {
      console.log('Not connected or already auto-subscribed, skipping');
      return;
    }

    // Small delay to ensure connection is fully established
    const timer = setTimeout(() => {
      const { subscribe } = useMarketStore.getState();
      const allPairs = [...correlationPairs.positive, ...correlationPairs.negative];
      console.log('Auto-subscribing to correlation pairs:', allPairs, 'with timeframe:', globalSettings.timeframe);
      
      let subscriptionCount = 0;
      allPairs.forEach(([symbol1, symbol2]) => {
        const sym1 = symbol1 + 'm';
        const sym2 = symbol2 + 'm';
        
        if (!subscriptions.has(sym1)) {
          console.log('Auto-subscribing to', sym1);
          subscribe(sym1, globalSettings.timeframe, ['ticks', 'ohlc']);
          subscriptionCount++;
        }
        if (!subscriptions.has(sym2)) {
          console.log('Auto-subscribing to', sym2);
          subscribe(sym2, globalSettings.timeframe, ['ticks', 'ohlc']);
          subscriptionCount++;
        }
      });
      
      console.log(`Auto-subscribed to ${subscriptionCount} new symbols`);
      setHasAutoSubscribed(true);
    }, 1000); // 1 second delay to ensure connection is stable

    return () => clearTimeout(timer);
  }, [isConnected, hasAutoSubscribed, correlationPairs, globalSettings.timeframe, subscriptions]);

  // Trigger initial RSI calculation when we have data
  useEffect(() => {
    if (subscriptions.size > 0) {
      console.log('Triggering RSI calculation for', subscriptions.size, 'subscriptions');
      recalculateAllRsi();
    }
  }, [subscriptions.size, recalculateAllRsi]);

  // React to RSI data changes to ensure UI updates
  useEffect(() => {
    console.log('RSI data updated, correlation pairs:', correlationStatus.size);
  }, [correlationStatus]);

  // Reset hasAutoSubscribed when global timeframe changes to ensure re-subscription
  useEffect(() => {
    setHasAutoSubscribed(false);
  }, [globalSettings.timeframe]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    recalculateAllRsi();
    setTimeout(() => setIsRefreshing(false), 1000);
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
      {/* Status Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Analysis:</span> {subscriptions.size} subscriptions • {correlationStatus.size} pairs analyzed
          </div>
        </div>
        {subscriptions.size === 0 && isConnected && (
          <div className="mt-2 text-xs">
            🔄 <strong>Auto-subscribing to correlation pairs...</strong> Please wait a moment for data to load.
          </div>
        )}
        {subscriptions.size > 0 && correlationStatus.size === 0 && (
          <div className="mt-2 text-xs text-blue-600">
            📊 Calculating RSI for {globalSettings.timeframe} timeframe...
          </div>
        )}
        {!isConnected && (
          <div className="mt-2 text-xs">
            💡 <strong>Tip:</strong> Correlation pairs will auto-subscribe once WebSocket connection is established.
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">RSI Correlation Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Period: {rsiSettings.period} | Overbought: {rsiSettings.overbought} | Oversold: {rsiSettings.oversold} | {globalSettings.timeframe}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
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

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">Legend:</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs">✅</span>
            <span>Match: Correlation aligns with RSI</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">❌</span>
            <span>Mismatch: Correlation conflicts with RSI</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">⚪</span>
            <span>Neutral: No strong RSI signals</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RSICorrelationDashboard;
