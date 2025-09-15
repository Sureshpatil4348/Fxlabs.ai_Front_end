import { Star, Trash2, AlertCircle, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Clock, Activity, Plus, Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import { StandardSparkline } from "./SparklineChart";
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

// Available currency pairs for manual addition
const AVAILABLE_PAIRS = [
  // Core pairs (7)
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  // Extended pairs (21)
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
  'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',
  'NZDJPY', 'NZDCHF', 'NZDCAD',
  'CADJPY', 'CADCHF',
  'CHFJPY',
  // Precious metals (2)
  'XAUUSD', 'XAGUSD',
  // Cryptocurrencies (2)
  'BTCUSD', 'ETHUSD'
];

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
    getLatestOhlcForSymbol,
    getRsiHistory,
    getPriceHistory,
    getRsiEvents
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
  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingSymbol, setAddingSymbol] = useState(null);
  const wishlistSymbols = getWishlistArray();

  // Filter available pairs based on search term and existing wishlist
  const filteredPairs = AVAILABLE_PAIRS.filter(pair => {
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

  const toggleExpanded = (symbol) => {
    setExpandedSymbol(expandedSymbol === symbol ? null : symbol);
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'crossdown':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'crossup':
        return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'exit_oversold':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'exit_overbought':
        return <TrendingDown className="w-3 h-3 text-green-500" />;
      default:
        return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'crossdown':
      case 'crossup':
        return 'text-red-600 bg-red-50';
      case 'exit_oversold':
      case 'exit_overbought':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatEventTime = (timestamp) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - eventTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[185px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[185px] flex flex-col overflow-hidden">
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[180px] flex flex-col overflow-hidden">
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
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="w-24 text-center px-2">Pair</div>
                <div className="w-20 text-center px-2">RSI</div>
                <div className="w-24 text-center px-2">Price</div>
                <div className="w-20 text-center px-2">Change</div>
                <div className="w-20 text-center px-2">Chart</div>
                <div className="w-16 text-center px-2">Events</div>
                <div className="w-12 text-center px-2"></div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
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
                const isExpanded = expandedSymbol === symbol;

                // Get history data for chart and events
                const rsiHistory = getRsiHistory(rsiSymbol);
                const priceHistory = getPriceHistory(rsiSymbol);
                const rsiEvents = getRsiEvents(rsiSymbol);

                return (
                  <div key={symbol} className="border-b border-gray-200">
                    {/* Main Row */}
                    <div 
                      className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleExpanded(symbol)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpanded(symbol);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${formatSymbolDisplay(symbol)}`}
                    >
                      {/* Pair */}
                      <div className="w-24 text-xs font-medium text-gray-900 text-center px-2">
                        {formatSymbolDisplay(symbol)}
                      </div>
                      
                      {/* RSI */}
                      <div className={`w-20 text-xs font-bold text-center px-2 ${rsiValue != null ? getRsiColor(rsiValue, settings.rsiOverbought, settings.rsiOversold) : 'text-gray-400'}`}>
                        {rsiText}
                      </div>
                      
                      {/* Price */}
                      <div className="w-24 text-xs text-gray-900 font-mono text-center px-2">
                        {priceText}
                      </div>
                      
                      {/* Change */}
                      <div className={`w-20 text-xs font-medium text-center px-2 ${change != null ? (change >= 0 ? 'text-success-600' : 'text-danger-600') : 'text-gray-400'}`}>
                        {changeText}
                      </div>
                      
                      {/* Chart */}
                      <div className="w-20 flex justify-center px-2">
                        <StandardSparkline data={priceHistory} />
                      </div>
                      
                      {/* Events */}
                      <div className="w-16 text-center px-2">
                        {rsiEvents.length > 0 && (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                            {rsiEvents.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Expand/Collapse Button */}
                      <div className="w-10 text-center px-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 mx-auto" />
                        )}
                      </div>

                      <div className="w-4 text-center ">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(symbol);
                          }}
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
                      </div>
                    </div>
                   
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* RSI History Chart */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">RSI History</h4>
                            <div className="bg-white p-3 rounded-lg border">
                              <StandardSparkline 
                                data={rsiHistory.map(h => ({ price: h.value, timestamp: h.timestamp }))} 
                                width={200} 
                                height={40}
                              />
                              <div className="mt-2 text-xs text-gray-500">
                                Last 20 periods
                              </div>
                            </div>
                          </div>

                          {/* Recent RSI Events */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Events</h4>
                            <div className="space-y-2">
                              {rsiEvents.length > 0 ? (
                                rsiEvents.slice(0, 3).map((event, index) => (
                                  <div key={index} className={`flex items-center justify-between p-2 rounded-lg text-xs ${getEventColor(event.type)}`}>
                                    <div className="flex items-center space-x-2">
                                      {getEventIcon(event.type)}
                                      <span className="font-medium">{event.description}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatEventTime(event.timestamp)}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-gray-500 p-2">No recent events</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">RFI Analysis</h4>
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <div className="text-gray-500">RFI Score</div>
                                <div className="font-bold text-lg">0.02</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Signal</div>
                                <div className="font-medium text-gray-600">Neutral</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Strength</div>
                                <div className="font-medium">Weak</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Remove Button */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(symbol);
                            }}
                            disabled={isRemoving || watchlistLoading}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRemoving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3 inline mr-1" />
                                Remove from Watchlist
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
                {filteredPairs.length} of {AVAILABLE_PAIRS.length} pairs available
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPanel;