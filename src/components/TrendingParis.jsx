import { TrendingUp, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import useRSITrackerStore from '../store/useRSITrackerStore';

const TrendingPairs = () => {
  const [trendingPairs, setTrendingPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    subscriptions, 
    rsiData, 
    getDailyChangePercent,
    getAllPairsWithRFI,
    isConnected 
  } = useRSITrackerStore();

  // Function to get trending pairs with daily changes
  const getTrendingPairs = useCallback(() => {
    setIsLoading(true);
    const pairs = [];
    
    // Get all pairs with RSI and RFI data
    const allPairs = getAllPairsWithRFI();
    
    // Filter and process pairs for trending analysis
    allPairs.forEach((pair) => {
      const dailyChange = getDailyChangePercent(pair.symbol);
      const rsiValue = pair.rsi;
      const rfiData = pair.rfiData;
      
      // Calculate trending score based on:
      // 1. Daily change percentage (absolute value)
      // 2. RSI momentum (distance from 50)
      // 3. RFI strength if available
      const dailyChangeAbs = Math.abs(dailyChange);
      const rsiMomentum = Math.abs(rsiValue - 50) / 50; // Normalize RSI momentum
      const rfiScore = rfiData?.rfiScore || 0.5; // Default to neutral if no RFI data
      
      // Combined trending score (weighted)
      const trendingScore = (dailyChangeAbs * 0.5) + (rsiMomentum * 0.3) + (rfiScore * 0.2);
      
      // Only include pairs with significant movement or strong signals
      if (dailyChangeAbs >= 0.5 || rsiMomentum >= 0.3 || rfiScore >= 0.7) {
        pairs.push({
          symbol: pair.symbol,
          dailyChange: dailyChange,
          dailyChangeAbs: dailyChangeAbs,
          rsi: rsiValue,
          rfiScore: rfiScore,
          trendingScore: trendingScore,
          price: pair.price,
          volume: pair.volume
        });
      }
    });
    
    // Sort by trending score descending (most trending first)
    pairs.sort((a, b) => b.trendingScore - a.trendingScore);
    setTrendingPairs(pairs);
    setIsLoading(false);
  }, [getDailyChangePercent, getAllPairsWithRFI]);

  // Update trending pairs when data changes
  useEffect(() => {
    if (isConnected && subscriptions.size > 0 && rsiData.size > 0) {
      getTrendingPairs();
    }
  }, [isConnected, subscriptions, rsiData, getTrendingPairs]);

  // Refresh function
  const handleRefresh = () => {
    getTrendingPairs();
  };

  // Format percentage with proper sign and color
  const formatChange = (change) => {
    const isPositive = change >= 0;
    const colorClass = isPositive 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
    const sign = isPositive ? '+' : '';
    return (
      <span className={colorClass}>
        {sign}{change.toFixed(2)}%
      </span>
    );
  };

  // Get RSI status color
  const getRSIColor = (rsi) => {
    if (rsi >= 70) return 'text-red-500';
    if (rsi <= 30) return 'text-green-500';
    return 'text-yellow-500';
  };

  // Get RFI strength indicator
  const getRFIIndicator = (rfiScore) => {
    if (rfiScore >= 0.8) return { text: 'Strong', color: 'text-green-600 dark:text-green-400' };
    if (rfiScore >= 0.6) return { text: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Weak', color: 'text-gray-600 dark:text-gray-400' };
  };

  return (
    <div className="card z-10 relative h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Trending Pairs</h2>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Daily changes with RSI & RFI analysis
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-2 p-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-[11px] text-yellow-800 dark:text-yellow-200">
            Connecting to market data...
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {trendingPairs.length > 0 ? (
          <div className="space-y-1">
            {trendingPairs.slice(0, 8).map((pair, index) => {
              const rfiIndicator = getRFIIndicator(pair.rfiScore);
              return (
                <div
                  key={pair.symbol}
                  className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                        {pair.symbol}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="text-gray-500 dark:text-gray-400">
                          RSI: <span className={getRSIColor(pair.rsi)}>{pair.rsi.toFixed(1)}</span>
                        </span>
                        <span className={`${rfiIndicator.color}`}>
                          RFI: {rfiIndicator.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <TrendingUp className="w-3 h-3 text-blue-500" />
                    <div className="text-right">
                      <div className="text-[11px] font-bold">
                        {formatChange(pair.dailyChange)}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Score: {pair.trendingScore.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-7 h-7 mx-auto mb-2 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <h3 className="text-[13px] font-medium text-gray-900 dark:text-white mb-1">
              No Trending Pairs
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {!isConnected 
                ? 'Waiting for market data connection...'
                : 'No pairs found with significant trending activity'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingPairs;
