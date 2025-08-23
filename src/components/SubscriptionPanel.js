import React, { useState } from 'react';
import useMarketStore, { formatSymbol } from '../store/useMarketStore';
import { Plus, Minus } from 'lucide-react';

const SubscriptionPanel = () => {
  const {
    isConnected,
    selectedSymbol,
    selectedTimeframe,
    timeframes,
    subscriptions,
    setSelectedSymbol,
    setSelectedTimeframe,
    subscribe,
    unsubscribe
  } = useMarketStore();

  const [symbolInput, setSymbolInput] = useState(selectedSymbol);

  const handleSubscribe = () => {
    if (!isConnected || !symbolInput.trim()) return;
    
    const symbol = formatSymbol(symbolInput);
    // Always subscribe to both tick data and OHLC data
    subscribe(symbol, selectedTimeframe, ['ticks', 'ohlc']);
    setSelectedSymbol(symbol);
  };

  const handleUnsubscribe = (symbol) => {
    unsubscribe(symbol);
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
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs text-gray-600 mr-2">Quick select:</span>
              {['EURUSDm', 'GBPUSDm', 'USDJPYm', 'AUDUSDm', 'USDCADm'].map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setSymbolInput(symbol)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-1 py-1 rounded transition-colors"
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



          <button
            onClick={handleSubscribe}
            disabled={!isConnected || !symbolInput.trim()}
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
            <div className="space-y-2 max-h-[80px] overflow-y-auto">
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
                      {sub.timeframe} • Tick Data & OHLC
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
