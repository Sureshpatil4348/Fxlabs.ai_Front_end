import React from 'react';
import useBaseMarketStore from '../store/useBaseMarketStore';
import { formatSymbolDisplay } from '../utils/formatters';
import { Star, Trash2 } from 'lucide-react';

const WishlistItem = ({ symbol, onRemove }) => {
  return (
    <div className="flex h-8 items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-xs">
      <div className="flex items-center space-x-2">
        <Star className="w-3 h-3 text-green-500" />
        <span className="font-medium text-gray-900">
          {formatSymbolDisplay(symbol)}
        </span>
      </div>
      <button
        onClick={() => onRemove(symbol)}
        className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors text-xs"
        title="Remove from wishlist"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

const WishlistPanel = () => {
  const { 
    removeFromWishlist, 
    getWishlistArray
  } = useBaseMarketStore();

  const wishlistSymbols = getWishlistArray();

  const handleRemove = (symbol) => {
    removeFromWishlist(symbol);
  };

  return (
    <div className="card h-40 flex flex-col">
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
          <div className="h-full overflow-auto space-y-2">
            {wishlistSymbols.map((symbol) => (
              <WishlistItem
                key={symbol}
                symbol={symbol}
                onRemove={handleRemove}
              />
            ))}
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