import { Star, Trash2, AlertCircle, Loader2, Plus, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthProvider";
import useBaseMarketStore from "../store/useBaseMarketStore";
import useRSITrackerStore from "../store/useRSITrackerStore";
import {
  formatSymbolDisplay,
  formatPrice,
  formatPercentage,
  formatRsi,
  getRsiColor,
} from "../utils/formatters";

// Available currency pairs for manual addition are derived from RSI Tracker store settings

const WishlistPanel = () => {
  const { user, loading: authLoading } = useAuth();

  const {
    removeFromWishlist,
    addToWishlist,
    getWishlistArray,
    loadWatchlist,
    watchlistLoading,
    watchlistError,
    clearWatchlistError,
  } = useBaseMarketStore();

  const { 
    rsiData, 
    settings, 
    getLatestTickForSymbol, 
    getLatestOhlcForSymbol
  } = useRSITrackerStore((state) => ({
      rsiData: state.rsiData,
      settings: state.settings,
      getLatestTickForSymbol: state.getLatestTickForSymbol,
      getLatestOhlcForSymbol: state.getLatestOhlcForSymbol,
      getRsiHistory: state.getRsiHistory,
      getPriceHistory: state.getPriceHistory,
      getRsiEvents: state.getRsiEvents,
    }));

  const [removingSymbol, setRemovingSymbol] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingSymbol, setAddingSymbol] = useState(null);
  const wishlistSymbols = getWishlistArray();

  // Derive available pairs from RSI Tracker store's autoSubscribeSymbols (convert 'EURUSDm' -> 'EURUSD')
  const availablePairs = useMemo(() => {
    const symbols = settings?.autoSubscribeSymbols || [];
    return symbols
      .map((s) => (s?.toUpperCase().endsWith('M') ? s.toUpperCase().slice(0, -1) : s.toUpperCase()))
      .filter(Boolean);
  }, [settings?.autoSubscribeSymbols]);

  // Filter available pairs based on search term and existing wishlist
  const filteredPairs = availablePairs.filter(pair => {
    const isNotInWishlist = !wishlistSymbols.includes(pair);
    const matchesSearch = pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formatSymbolDisplay(pair).toLowerCase().includes(searchTerm.toLowerCase());
    return isNotInWishlist && matchesSearch;
  });

  useEffect(() => {
    if (user && !authLoading) {
      loadWatchlist().catch((error) => {
        console.error("Failed to load watchlist:", error);
      });
    }
  }, [user, authLoading, loadWatchlist]);

  const handleRemove = async (symbol) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setRemovingSymbol(symbol);
    try {
      await removeFromWishlist(symbol);
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    } finally {
      setRemovingSymbol(null);
    }
  };

  const handleAddPair = async (symbol) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setAddingSymbol(symbol);
    try {
      await addToWishlist(symbol);
      setShowAddModal(false);
      setSearchTerm('');
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setAddingSymbol(null);
    }
  };



  if (authLoading) {
    return (
      <div className="widget-card p-4 h-full min-h-[185px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="widget-card p-4 h-full min-h-[185px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Please log in to view your watchlist</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card p-4 h-full min-h-[180px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-2">
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
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Add currency pair"
          >
            <Plus className="w-4 h-4" />
          </button>
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

      {/* Main Scroll Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-1">
        {watchlistLoading && wishlistSymbols.length === 0 ? (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500">Loading watchlist...</p>
            </div>
          </div>
        ) : wishlistSymbols.length > 0 ? (
          <div className="overflow-auto pb-0">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Pair
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                    RSI
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Daily %
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs text-left">
                {wishlistSymbols.map((symbol) => {
                  // Convert watchlist symbol (base format) to RSI Tracker format (with 'm' suffix)
                  const rsiSymbol = symbol + 'm';
                  
                  const latestTick = getLatestTickForSymbol(rsiSymbol);
                  const latestBar = getLatestOhlcForSymbol(rsiSymbol);
                  const rsiValue = rsiData.get(rsiSymbol)?.value ?? null;
                  
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
                      <td className="px-3 py-2 text-xs font-medium text-gray-900 text-center">
                        {formatSymbolDisplay(symbol)}
                      </td>
                      <td className={`px-3 py-2 text-xs font-bold text-center ${rsiValue != null ? getRsiColor(rsiValue, settings.rsiOverbought, settings.rsiOversold) : 'text-gray-400'}`}>
                        {rsiText}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 font-mono text-center">
                        {priceText}
                      </td>
                      <td className={`px-3 py-2 text-xs font-medium text-center ${change != null ? (change >= 0 ? 'text-success-600' : 'text-danger-600') : 'text-gray-400'}`}>
                        {changeText}
                      </td>
                      <td className="px-3 py-2 text-center">
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
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 ">No watchlist items</h3>
              <p className="text-gray-500 text-xs">
                Add currency pairs to your watchlist using the + button above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Currency Pair Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Currency Pair</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search currency pairs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Currency Pairs List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredPairs.length > 0 ? (
                <div className="space-y-2">
                  {filteredPairs.map((pair) => (
                    <button
                      key={pair}
                      onClick={() => handleAddPair(pair)}
                      disabled={addingSymbol === pair}
                      className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{formatSymbolDisplay(pair)}</div>
                        <div className="text-sm text-gray-500">{pair}</div>
                      </div>
                      {addingSymbol === pair ? (
                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                      ) : (
                        <Plus className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm ? 'No matching pairs found' : 'All available pairs are already in your watchlist'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                {filteredPairs.length} of {availablePairs.length} pairs available
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPanel;
