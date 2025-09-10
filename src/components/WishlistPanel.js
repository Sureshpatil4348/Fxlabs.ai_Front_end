import { Star, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthProvider';
import useBaseMarketStore from '../store/useBaseMarketStore';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';

const WishlistPanel = () => {
  const { user, loading: authLoading } = useAuth();
  
  const { 
    removeFromWishlist, 
    getWishlistArray,
    loadWatchlist,
    watchlistLoading,
    watchlistError,
    clearWatchlistError
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

  const [removingSymbol, setRemovingSymbol] = useState(null);

  const wishlistSymbols = getWishlistArray();

  // Load watchlist on component mount only if user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      loadWatchlist().catch(error => {
        console.error('Failed to load watchlist:', error);
      });
    }
  }, [user, authLoading, loadWatchlist]);

  const handleRemove = async (symbol) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setRemovingSymbol(symbol);
    clearWatchlistError();
    
    try {
      await removeFromWishlist(symbol);
    } catch (error) {
      console.error('Failed to remove symbol:', error);
    } finally {
      setRemovingSymbol(null);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="card-compact h-[260px] flex flex-col z-9 relative">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div className="card-compact h-[260px] flex flex-col z-9 relative">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500 text-xs">
              Please log in to access your watchlist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-compact h-[260px] flex flex-col z-9 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {watchlistLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
          <div className="text-sm text-gray-500">
            {wishlistSymbols.length} pair{wishlistSymbols.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {watchlistError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{watchlistError}</p>
          <button
            onClick={clearWatchlistError}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Watchlist Items */}
      <div className="flex-1 overflow-hidden">
        {watchlistLoading && wishlistSymbols.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading watchlist...</p>
            </div>
          </div>
        ) : wishlistSymbols.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Pair</th>
                  <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">RSI</th>
                  <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Daily %</th>
                  <th className="px-1 py-1" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs text-left">
                {wishlistSymbols.map((symbol) => {
                  // Convert watchlist symbol (base format) to RSI Tracker format (with 'm' suffix)
                  const rsiSymbol = symbol + 'm';
                  
                  const latestTick = getLatestTickForSymbol(rsiSymbol);
                  const latestBar = getLatestOhlcForSymbol(rsiSymbol);
                  const rsiValue = rsiData.get(rsiSymbol)?.value ?? null;
                  
                  // Simple debug: log once if no data found
                  if (!latestTick && !latestBar && rsiValue === null && symbol === 'CADJPY') {
                    // Debug logging removed to fix linting warning
                  }
                  
                  const price = latestTick?.bid || latestBar?.close || null;
                  const change = latestBar ? ((latestBar.close - latestBar.open) / latestBar.open * 100) : null;
                  const priceText = price != null
                    ? (symbol.includes('JPY') ? formatPrice(price, 3) : formatPrice(price, 5))
                    : '--';
                  const rsiText = rsiValue != null ? formatRsi(rsiValue) : '--';
                  const changeText = change != null ? formatPercentage(change) : '--';
                  const isRemoving = removingSymbol === symbol;

                  return (
                    <tr key={symbol} className="hover:bg-gray-50">
                      <td className="px-1 py-1 text-xs font-medium text-gray-900 text-center">{formatSymbolDisplay(symbol)}</td>
                      <td className={`px-1 py-1 text-xs font-bold text-center ${rsiValue != null ? getRsiColor(rsiValue, settings.rsiOverbought, settings.rsiOversold) : 'text-gray-400'}`}>{rsiText}</td>
                      <td className="px-1 py-1 text-xs text-gray-900 font-mono text-center">{priceText}</td>
                      <td className={`px-1 py-1 text-xs font-medium text-center ${change != null ? (change >= 0 ? 'text-success-600' : 'text-danger-600') : 'text-gray-400'}`}>{changeText}</td>
                      <td className="px-1 py-1 text-center">
                        <button
                          onClick={() => handleRemove(symbol)}
                          disabled={isRemoving || watchlistLoading}
                          className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove from watchlist"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
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