import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import useMarketStore from '../store/useMarketStore';
import { formatSymbolDisplay } from '../utils/formatters';

const OHLCDataView = ({ symbol }) => {
  const { getOhlcForSymbol, getLatestOhlcForSymbol, subscriptions, ohlcData } = useMarketStore();
  const [ohlcBars, setOhlcBars] = useState([]);
  const [latestBar, setLatestBar] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    // Update reactively when OHLC data changes
    const newBars = getOhlcForSymbol(symbol);
    const newLatest = getLatestOhlcForSymbol(symbol);
    setOhlcBars(newBars);
    setLatestBar(newLatest);
  }, [symbol, ohlcData, getOhlcForSymbol, getLatestOhlcForSymbol]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPrice = (price) => {
    return price ? price.toFixed(5) : 'N/A';
  };

  const getBarColor = (open, close) => {
    if (!open || !close) return 'text-gray-500';
    return close >= open ? 'text-success-600' : 'text-danger-600';
  };

  const getBarType = (open, close) => {
    if (!open || !close) return 'Doji';
    return close >= open ? 'Bullish' : 'Bearish';
  };

  const subscription = subscriptions.get(symbol);
  const timeframe = subscription?.timeframe || 'Unknown';

  if (!symbol) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Select a symbol to view OHLC data</p>
      </div>
    );
  }

  if (ohlcBars.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Waiting for OHLC data...</p>
        <p className="text-sm text-gray-400 mt-1">
          Symbol: {formatSymbolDisplay(symbol.replace(/m$/,''))} • Timeframe: {timeframe}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest Bar Summary */}
      {latestBar && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatSymbolDisplay(symbol.replace(/m$/,''))} - {timeframe}
            </h3>
            <span className="text-sm text-gray-500">
              {formatTime(latestBar.time)}
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Open</div>
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(latestBar.open)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">High</div>
              <div className="text-lg font-bold text-success-600">
                {formatPrice(latestBar.high)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Low</div>
              <div className="text-lg font-bold text-danger-600">
                {formatPrice(latestBar.low)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Close</div>
              <div className={`text-lg font-bold ${getBarColor(latestBar.open, latestBar.close)}`}>
                {formatPrice(latestBar.close)}
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bar Type:</span>
              <span className={getBarColor(latestBar.open, latestBar.close)}>
                {getBarType(latestBar.open, latestBar.close)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Range:</span>
              <span className="text-gray-900">
                {latestBar.high && latestBar.low 
                  ? (latestBar.high - latestBar.low).toFixed(5)
                  : 'N/A'
                }
              </span>
            </div>
            {latestBar.volume && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Volume:</span>
                <span className="text-gray-900">{latestBar.volume.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OHLC History */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          OHLC History ({ohlcBars.length} bars)
        </h4>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    High
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Low
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Close
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ohlcBars.slice().reverse().map((bar, index) => {
                  const isLatest = index === 0;
                  return (
                    <tr 
                      key={`${bar.time}-${index}`}
                      className={`hover:bg-gray-50 ${isLatest ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-900 font-mono">
                        {new Date(bar.time).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 font-mono text-right">
                        {formatPrice(bar.open)}
                      </td>
                      <td className="px-3 py-2 text-xs text-success-600 font-mono text-right">
                        {formatPrice(bar.high)}
                      </td>
                      <td className="px-3 py-2 text-xs text-danger-600 font-mono text-right">
                        {formatPrice(bar.low)}
                      </td>
                      <td className={`px-3 py-2 text-xs font-mono text-right ${getBarColor(bar.open, bar.close)}`}>
                        {formatPrice(bar.close)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          bar.close >= bar.open 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-danger-100 text-danger-800'
                        }`}>
                          {bar.close >= bar.open ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {getBarType(bar.open, bar.close)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OHLCDataView;
