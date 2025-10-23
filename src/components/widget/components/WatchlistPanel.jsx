import React, { useState, useEffect } from 'react';

import { watchlistService } from '../services/watchlistService';
import { useChartStore } from '../stores/useChartStore';

export const WatchlistPanel = ({ onClose }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical'); // alphabetical, dateAdded
  const [isLoading, setIsLoading] = useState(false);
  const { setSymbol } = useChartStore();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = () => {
    setIsLoading(true);
    const watchlistData = watchlistService.getWatchlist();
    setWatchlist(watchlistData);
    setIsLoading(false);
  };

  const handleRemove = (symbol) => {
    watchlistService.removeFromWatchlist(symbol);
    loadWatchlist();
  };

  const handleSymbolClick = (symbol) => {
    setSymbol(symbol);
    // Track the view
    watchlistService.trackView(symbol);
    if (onClose) onClose();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all watchlist items?')) {
      watchlistService.clearWatchlist();
      loadWatchlist();
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredWatchlist = watchlist.filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedWatchlist = [...filteredWatchlist].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.symbol.localeCompare(b.symbol);
    } else if (sortBy === 'dateAdded') {
      return new Date(b.addedAt) - new Date(a.addedAt);
    }
    return 0;
  });

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl border border-gray-200/50 p-6 w-96 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              My Watchlist
            </h3>
            <p className="text-xs text-gray-500">Track your favorite pairs</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {watchlist.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search and Sort */}
      {watchlist.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {filteredWatchlist.length} of {watchlist.length} symbols
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="alphabetical">A-Z</option>
              <option value="dateAdded">Recently Added</option>
            </select>
          </div>
        </div>
      )}

      {/* Watchlist Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Your watchlist is empty</h4>
          <p className="text-gray-500 text-sm mb-4">Start building your watchlist by adding trading pairs</p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click the star icon to add symbols
          </div>
        </div>
      ) : filteredWatchlist.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No symbols match your search</p>
          <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {sortedWatchlist.map((item, index) => (
            <div
              key={item.symbol}
              className="group flex items-center justify-between p-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 hover:shadow-md border border-gray-100 hover:border-blue-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => handleSymbolClick(item.symbol)}
                className="flex-1 text-left group-hover:scale-105 transition-transform duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {item.symbol.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                      {item.symbol}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Click to view chart</span>
                      {item.viewCount > 0 && (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{item.viewCount}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSymbolClick(item.symbol)}
                  className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="View Chart"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handleRemove(item.symbol)}
                  className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                  title="Remove from watchlist"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {watchlist.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{watchlist.length} {watchlist.length === 1 ? 'symbol' : 'symbols'} in watchlist</span>
            </div>
            <div className="text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
