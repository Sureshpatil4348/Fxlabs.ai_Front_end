import React from 'react';
import useMarketStore from '../store/useMarketStore';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';
import { Star, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const WishlistItem = ({ item, onRemove }) => {
  const { symbol, price, change, rsi } = item;
  const { rsiSettings } = useMarketStore();

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 text-sm font-medium text-gray-900">
        {formatSymbolDisplay(symbol)}
      </td>
      <td className="px-3 py-2 text-sm text-gray-900 font-mono">
        {formatPrice(price)}
      </td>
      <td className={`px-3 py-2 text-sm font-medium ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
        <div className="flex items-center">
          {change >= 0 ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {formatPercentage(change)}
        </div>
      </td>
      <td className={`px-3 py-2 text-sm font-medium ${rsi ? getRsiColor(rsi, rsiSettings.overbought, rsiSettings.oversold) : 'text-gray-400'}`}>
        {rsi ? formatRsi(rsi) : '--'}
      </td>
      <td className="px-3 py-2 text-sm">
        <button
          onClick={() => onRemove(symbol)}
          className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
          title="Remove from wishlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

const WishlistPanel = () => {
  const { 
    getWishlistData, 
    removeFromWishlist, 
    wishlist 
  } = useMarketStore();

  const wishlistData = getWishlistData();

  const handleRemove = (symbol) => {
    removeFromWishlist(symbol);
  };

  // Calculate summary statistics
  const totalItems = wishlistData.length;
  const positiveChanges = wishlistData.filter(item => item.change > 0).length;
  const negativeChanges = wishlistData.filter(item => item.change < 0).length;
  const avgChange = totalItems > 0 
    ? wishlistData.reduce((sum, item) => sum + item.change, 0) / totalItems 
    : 0;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
        </div>
        
        <div className="text-sm text-gray-500">
          {totalItems} pair{totalItems !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Summary Statistics */}
      {totalItems > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-success-50 rounded-lg">
            <div className="text-sm font-bold text-success-600">{positiveChanges}</div>
            <div className="text-xs text-success-700">Rising</div>
          </div>
          <div className="text-center p-2 bg-danger-50 rounded-lg">
            <div className="text-sm font-bold text-danger-600">{negativeChanges}</div>
            <div className="text-xs text-danger-700">Falling</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className={`text-sm font-bold ${avgChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {formatPercentage(avgChange)}
            </div>
            <div className="text-xs text-gray-600">Avg Change</div>
          </div>
        </div>
      )}

      {/* Watchlist Table */}
      <div className="overflow-hidden">
        {wishlistData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily %
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RSI
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wishlistData.map((item) => (
                  <WishlistItem
                    key={item.symbol}
                    item={item}
                    onRemove={handleRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your watchlist is empty
            </h3>
            <p className="text-gray-500 text-sm">
              Add currency pairs from the RSI Tracker to start monitoring them here.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {wishlistData.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Track your favorite pairs and their RSI levels
            </div>
            <button
              onClick={() => {
                // Clear all wishlist items
                wishlistData.forEach(item => removeFromWishlist(item.symbol));
              }}
              className="text-danger-600 hover:text-danger-700 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPanel;
