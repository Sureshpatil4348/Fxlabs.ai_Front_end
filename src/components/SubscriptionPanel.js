import React, { useState } from 'react';
import useMarketStore, { formatSymbol } from '../store/useMarketStore';
import { Plus, Minus, TrendingUp, BarChart3 } from 'lucide-react';

const SubscriptionPanel = () => {
  const {
    isConnected,
    selectedSymbol,
    selectedTimeframe,
    dataTypes,
    timeframes,
    subscriptions,
    setSelectedSymbol,
    setSelectedTimeframe,
    setDataTypes,
    subscribe,
    unsubscribe
  } = useMarketStore();

  const [symbolInput, setSymbolInput] = useState(selectedSymbol);

  const handleSubscribe = () => {
    if (!isConnected || !symbolInput.trim()) return;
    
    const symbol = formatSymbol(symbolInput);
    subscribe(symbol, selectedTimeframe, dataTypes);
    setSelectedSymbol(symbol);
  };

  const handleUnsubscribe = (symbol) => {
    unsubscribe(symbol);
  };

  const handleDataTypeChange = (type) => {
    const newDataTypes = dataTypes.includes(type)
      ? dataTypes.filter(t => t !== type)
      : [...dataTypes, type];
    setDataTypes(newDataTypes);
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscriptions</h2>

      <div className="space-y-4">
        {/* New Subscription Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(formatSymbol(e.target.value))}
              placeholder="EURUSDm"
              className="input-field w-full"
              disabled={!isConnected}
            />
            <div className="mt-1 text-xs text-gray-500">
              💡 MT5 symbols often have lowercase 'm' suffix (e.g., EURUSDm)
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs text-gray-600 mr-2">Quick select:</span>
              {['EURUSDm', 'GBPUSDm', 'USDJPYm', 'AUDUSDm', 'USDCADm'].map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setSymbolInput(symbol)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                  disabled={!isConnected}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="input-field w-full"
              disabled={!isConnected}
            >
              {timeframes.map(tf => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Types
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dataTypes.includes('ticks')}
                  onChange={() => handleDataTypeChange('ticks')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={!isConnected}
                />
                <TrendingUp className="w-4 h-4 ml-2 mr-1" />
                <span className="text-sm">Tick Data</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dataTypes.includes('ohlc')}
                  onChange={() => handleDataTypeChange('ohlc')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={!isConnected}
                />
                <BarChart3 className="w-4 h-4 ml-2 mr-1" />
                <span className="text-sm">OHLC Data</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={!isConnected || !symbolInput.trim() || dataTypes.length === 0}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Subscribe
          </button>
        </div>

        {/* Active Subscriptions */}
        {subscriptions.size > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Active Subscriptions ({subscriptions.size})
            </h3>
            <div className="space-y-2">
              {Array.from(subscriptions.values()).map((sub) => (
                <div
                  key={sub.symbol}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {sub.symbol}
                    </div>
                    <div className="text-xs text-gray-500">
                      {sub.timeframe} • {sub.dataTypes.join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(sub.symbol)}
                    className="text-danger-600 hover:text-danger-700 p-1"
                    title="Unsubscribe"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPanel;
