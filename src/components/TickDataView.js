import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import useMarketStore from '../store/useMarketStore';
import { formatSymbolDisplay } from '../utils/formatters';

const TickDataView = ({ symbol }) => {
  const { getTicksForSymbol, getLatestTickForSymbol, tickData } = useMarketStore();
  const [ticks, setTicks] = useState([]);
  const [latestTick, setLatestTick] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    // Update reactively when tick data changes
    const newTicks = getTicksForSymbol(symbol);
    const newLatest = getLatestTickForSymbol(symbol);
    setTicks(newTicks);
    setLatestTick(newLatest);
  }, [symbol, tickData, getTicksForSymbol, getLatestTickForSymbol]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatPrice = (price) => {
    return price ? price.toFixed(5) : 'N/A';
  };

  const getSpreadColor = (bid, ask) => {
    if (!bid || !ask) return 'text-gray-500';
    const spread = ask - bid;
    return spread > 0.0002 ? 'text-danger-600' : 'text-success-600';
  };

  if (!symbol) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Select a symbol to view tick data</p>
      </div>
    );
  }

  if (ticks.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Waiting for tick data...</p>
        <p className="text-sm text-gray-400 mt-1">Symbol: {formatSymbolDisplay(symbol.replace(/m$/,''))}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest Tick Summary */}
      {latestTick && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#19235d]">{formatSymbolDisplay(symbol.replace(/m$/,''))}</h3>
            <span className="text-sm text-gray-500">
              {formatTime(latestTick.time)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
                <span className="text-sm text-[#19235d]">Bid</span>
              </div>
              <div className="text-xl font-bold text-danger-600">
                {formatPrice(latestTick.bid)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                <span className="text-sm text-[#19235d]">Ask</span>
              </div>
              <div className="text-xl font-bold text-success-600">
                {formatPrice(latestTick.ask)}
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-[#19235d]">Spread:</span>
              <span className={getSpreadColor(latestTick.bid, latestTick.ask)}>
                {latestTick.bid && latestTick.ask 
                  ? (latestTick.ask - latestTick.bid).toFixed(5)
                  : 'N/A'
                }
              </span>
            </div>
            {latestTick.volume && (
              <div className="flex justify-between text-sm">
                <span className="text-[#19235d]">Volume:</span>
                <span className="text-[#19235d]">{latestTick.volume}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tick History */}
      <div>
        <h4 className="text-sm font-medium text-[#19235d] mb-3">
          Recent Ticks ({ticks.length})
        </h4>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ask
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spread
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ticks.map((tick, index) => {
                  const spread = tick.bid && tick.ask ? tick.ask - tick.bid : null;
                  return (
                    <tr 
                      key={`${tick.time}-${index}`}
                      className={`hover:bg-gray-50 ${index === 0 ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-2 text-sm text-[#19235d] font-mono">
                        {formatTime(tick.time)}
                      </td>
                      <td className="px-4 py-2 text-sm text-danger-600 font-mono text-right">
                        {formatPrice(tick.bid)}
                      </td>
                      <td className="px-4 py-2 text-sm text-success-600 font-mono text-right">
                        {formatPrice(tick.ask)}
                      </td>
                      <td className={`px-4 py-2 text-sm font-mono text-right ${getSpreadColor(tick.bid, tick.ask)}`}>
                        {spread ? spread.toFixed(5) : 'N/A'}
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

export default TickDataView;
