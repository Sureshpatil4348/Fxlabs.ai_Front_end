import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import useMarketStore from '../store/useMarketStore';
import { formatSymbolDisplay } from '../utils/formatters';

const IndicatorDataView = ({ symbol }) => {
  const { getIndicatorsForSymbol, getLatestIndicatorsForSymbol, subscriptions, indicatorData } = useMarketStore();
  const [indicators, setIndicators] = useState(null);
  const [latestIndicators, setLatestIndicators] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    // Update reactively when indicator data changes
    const newIndicators = getIndicatorsForSymbol(symbol);
    const newLatest = getLatestIndicatorsForSymbol(symbol);
    setIndicators(newIndicators);
    setLatestIndicators(newLatest);
  }, [symbol, indicatorData, getIndicatorsForSymbol, getLatestIndicatorsForSymbol]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return value || 'N/A';
  };

  const getIndicatorColor = (indicator, value) => {
    if (indicator === 'rsi') {
      if (value >= 70) return 'text-danger-600';
      if (value <= 30) return 'text-success-600';
      return 'text-gray-600';
    }
    return 'text-gray-600';
  };

  const getIndicatorStatus = (indicator, value) => {
    if (indicator === 'rsi') {
      if (value >= 70) return 'Overbought';
      if (value <= 30) return 'Oversold';
      return 'Neutral';
    }
    return 'Active';
  };

  const subscription = subscriptions.get(symbol);
  const timeframe = subscription?.timeframe || 'Unknown';

  if (!symbol) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Select a symbol to view indicator data</p>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Waiting for indicator data...</p>
        <p className="text-sm text-gray-400 mt-1">
          Symbol: {formatSymbolDisplay(symbol.replace(/m$/,''))} • Timeframe: {timeframe}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest Indicators Summary */}
      {latestIndicators && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-[#19235d]">
              {formatSymbolDisplay(symbol.replace(/m$/,''))} - {timeframe}
            </h3>
            <span className="text-sm text-gray-500">
              {formatTime(latestIndicators.barTime)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(indicators).map(([indicatorName, indicatorValue]) => {
              if (typeof indicatorValue === 'object' && indicatorValue !== null) {
                // Handle nested indicators (e.g., RSI with different periods)
                return Object.entries(indicatorValue).map(([period, value]) => (
                  <div key={`${indicatorName}-${period}`} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {indicatorName.toUpperCase()} ({period})
                    </div>
                    <div className={`text-lg font-bold ${getIndicatorColor(indicatorName, value)}`}>
                      {formatValue(value)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getIndicatorStatus(indicatorName, value)}
                    </div>
                  </div>
                ));
              } else {
                // Handle simple indicators
                return (
                  <div key={indicatorName} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {indicatorName.toUpperCase()}
                    </div>
                    <div className={`text-lg font-bold ${getIndicatorColor(indicatorName, indicatorValue)}`}>
                      {formatValue(indicatorValue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getIndicatorStatus(indicatorName, indicatorValue)}
                    </div>
                  </div>
                );
              }
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Update:</span>
              <span className="text-[#19235d]">
                {formatTime(latestIndicators.lastUpdate)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Indicator Details */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Technical Indicators
        </h4>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indicator
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(indicators).map(([indicatorName, indicatorValue]) => {
                  if (typeof indicatorValue === 'object' && indicatorValue !== null) {
                    // Handle nested indicators
                    return Object.entries(indicatorValue).map(([period, value]) => (
                      <tr key={`${indicatorName}-${period}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-[#19235d] font-mono">
                          {indicatorName.toUpperCase()} ({period})
                        </td>
                        <td className={`px-3 py-2 text-xs font-mono text-right ${getIndicatorColor(indicatorName, value)}`}>
                          {formatValue(value)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getIndicatorStatus(indicatorName, value) === 'Overbought' 
                              ? 'bg-danger-100 text-danger-800' 
                              : getIndicatorStatus(indicatorName, value) === 'Oversold'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-gray-100 text-[#19235d]'
                          }`}>
                            {getIndicatorStatus(indicatorName, value) === 'Overbought' ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : getIndicatorStatus(indicatorName, value) === 'Oversold' ? (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            ) : null}
                            {getIndicatorStatus(indicatorName, value)}
                          </span>
                        </td>
                      </tr>
                    ));
                  } else {
                    // Handle simple indicators
                    return (
                      <tr key={indicatorName} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-[#19235d] font-mono">
                          {indicatorName.toUpperCase()}
                        </td>
                        <td className={`px-3 py-2 text-xs font-mono text-right ${getIndicatorColor(indicatorName, indicatorValue)}`}>
                          {formatValue(indicatorValue)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getIndicatorStatus(indicatorName, indicatorValue) === 'Overbought' 
                              ? 'bg-danger-100 text-danger-800' 
                              : getIndicatorStatus(indicatorName, indicatorValue) === 'Oversold'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-gray-100 text-[#19235d]'
                          }`}>
                            {getIndicatorStatus(indicatorName, indicatorValue) === 'Overbought' ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : getIndicatorStatus(indicatorName, indicatorValue) === 'Oversold' ? (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            ) : null}
                            {getIndicatorStatus(indicatorName, indicatorValue)}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicatorDataView;
