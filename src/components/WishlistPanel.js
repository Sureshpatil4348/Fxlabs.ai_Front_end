import React from 'react';
import useBaseMarketStore from '../store/useBaseMarketStore';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';
import { Star, Trash2 } from 'lucide-react';

const WishlistPanel = () => {
  const { 
    removeFromWishlist, 
    getWishlistArray
  } = useBaseMarketStore();

  const {
    rsiData,
    settings,
    getLatestTickForSymbol,
    getLatestOhlcForSymbol
  } = useRSITrackerStore(state => ({
    rsiData: state.rsiData,
    settings: state.settings,
    getLatestTickForSymbol: state.getLatestTickForSymbol,
    getLatestOhlcForSymbol: state.getLatestOhlcForSymbol
  }));

  const wishlistSymbols = getWishlistArray();

  const handleRemove = (symbol) => {
    removeFromWishlist(symbol);
  };

  return (
    <div className="card h-[260px] flex flex-col z-9 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
        </div>
        
        <div className="text-sm text-gray-500">
          {wishlistSymbols.length} pair{wishlistSymbols.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="flex-1 overflow-hidden">
        {wishlistSymbols.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Pair</th>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">RSI</th>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Daily %</th>
                  <th className="px-1 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs text-left">
                {wishlistSymbols.map((symbol) => {
                  const latestTick = getLatestTickForSymbol(symbol);
                  const latestBar = getLatestOhlcForSymbol(symbol);
                  const price = latestTick?.bid || latestBar?.close || null;
                  const change = latestBar ? ((latestBar.close - latestBar.open) / latestBar.open * 100) : null;
                  const rsiValue = rsiData.get(symbol)?.value ?? null;
                  const priceText = price != null
                    ? (symbol.includes('JPY') ? formatPrice(price, 3) : formatPrice(price, 5))
                    : '--';
                  const rsiText = rsiValue != null ? formatRsi(rsiValue) : '--';
                  const changeText = change != null ? formatPercentage(change) : '--';

                  return (
                    <tr key={symbol} className="hover:bg-gray-50">
                      <td className="px-1 py-2 text-xs font-medium text-gray-900">{formatSymbolDisplay(symbol)}</td>
                      <td className={`px-1 py-2 text-xs font-bold ${rsiValue != null ? getRsiColor(rsiValue, settings.rsiOverbought, settings.rsiOversold) : 'text-gray-400'}`}>{rsiText}</td>
                      <td className="px-1 py-2 text-xs text-gray-900 font-mono">{priceText}</td>
                      <td className={`px-1 py-2 text-xs font-medium ${change != null ? (change >= 0 ? 'text-success-600' : 'text-danger-600') : 'text-gray-400'}`}>{changeText}</td>
                      <td className="px-1 py-2 text-right">
                        <button
                          onClick={() => handleRemove(symbol)}
                          className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors text-xs"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 mb-2">No watchlist items</h3>
              <p className="text-gray-500 text-xs">
                Add currency pairs to your watchlist from the RSI Tracker dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPanel;