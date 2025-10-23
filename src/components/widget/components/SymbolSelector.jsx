import React, { useState, useEffect } from 'react';

import { WatchlistPanel } from './WatchlistPanel';
import { watchlistService } from '../services/watchlistService';
import { useChartStore } from '../stores/useChartStore';

// Professional Forex Symbols with EUR/USD formatting
const POPULAR_SYMBOLS = [
  // Major Pairs
  { symbol: 'EURUSD', display: 'EUR/USD', name: 'Euro vs US Dollar', category: 'Major' },
  { symbol: 'GBPUSD', display: 'GBP/USD', name: 'British Pound vs US Dollar', category: 'Major' },
  { symbol: 'USDJPY', display: 'USD/JPY', name: 'US Dollar vs Japanese Yen', category: 'Major' },
  { symbol: 'USDCHF', display: 'USD/CHF', name: 'US Dollar vs Swiss Franc', category: 'Major' },
  { symbol: 'AUDUSD', display: 'AUD/USD', name: 'Australian Dollar vs US Dollar', category: 'Major' },
  { symbol: 'USDCAD', display: 'USD/CAD', name: 'US Dollar vs Canadian Dollar', category: 'Major' },
  { symbol: 'NZDUSD', display: 'NZD/USD', name: 'New Zealand Dollar vs US Dollar', category: 'Major' },
  
  // Minor/Cross Pairs
  { symbol: 'EURGBP', display: 'EUR/GBP', name: 'Euro vs British Pound', category: 'Cross' },
  { symbol: 'EURJPY', display: 'EUR/JPY', name: 'Euro vs Japanese Yen', category: 'Cross' },
  { symbol: 'EURAUD', display: 'EUR/AUD', name: 'Euro vs Australian Dollar', category: 'Cross' },
  { symbol: 'EURCHF', display: 'EUR/CHF', name: 'Euro vs Swiss Franc', category: 'Cross' },
  { symbol: 'EURCAD', display: 'EUR/CAD', name: 'Euro vs Canadian Dollar', category: 'Cross' },
  { symbol: 'GBPJPY', display: 'GBP/JPY', name: 'British Pound vs Japanese Yen', category: 'Cross' },
  { symbol: 'GBPAUD', display: 'GBP/AUD', name: 'British Pound vs Australian Dollar', category: 'Cross' },
  { symbol: 'GBPCAD', display: 'GBP/CAD', name: 'British Pound vs Canadian Dollar', category: 'Cross' },
  { symbol: 'GBPCHF', display: 'GBP/CHF', name: 'British Pound vs Swiss Franc', category: 'Cross' },
  { symbol: 'AUDJPY', display: 'AUD/JPY', name: 'Australian Dollar vs Japanese Yen', category: 'Cross' },
  { symbol: 'AUDNZD', display: 'AUD/NZD', name: 'Australian Dollar vs New Zealand Dollar', category: 'Cross' },
  { symbol: 'AUDCAD', display: 'AUD/CAD', name: 'Australian Dollar vs Canadian Dollar', category: 'Cross' },
  { symbol: 'AUDCHF', display: 'AUD/CHF', name: 'Australian Dollar vs Swiss Franc', category: 'Cross' },
  { symbol: 'NZDJPY', display: 'NZD/JPY', name: 'New Zealand Dollar vs Japanese Yen', category: 'Cross' },
  { symbol: 'NZDCAD', display: 'NZD/CAD', name: 'New Zealand Dollar vs Canadian Dollar', category: 'Cross' },
  { symbol: 'NZDCHF', display: 'NZD/CHF', name: 'New Zealand Dollar vs Swiss Franc', category: 'Cross' },
  { symbol: 'CADJPY', display: 'CAD/JPY', name: 'Canadian Dollar vs Japanese Yen', category: 'Cross' },
  { symbol: 'CADCHF', display: 'CAD/CHF', name: 'Canadian Dollar vs Swiss Franc', category: 'Cross' },
  { symbol: 'CHFJPY', display: 'CHF/JPY', name: 'Swiss Franc vs Japanese Yen', category: 'Cross' },
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
];

export const SymbolSelector = () => {
  const { settings, setSymbol, setTimeframe } = useChartStore();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [showWatchlistPanel, setShowWatchlistPanel] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);

  // Check if current symbol is in watchlist
  useEffect(() => {
    setIsInWatchlist(watchlistService.isInWatchlist(settings.symbol));
    setWatchlistCount(watchlistService.getWatchlistCount());
  }, [settings.symbol]);

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  const handleToggleWatchlist = () => {
    const newState = watchlistService.toggleWatchlist(settings.symbol);
    setIsInWatchlist(newState);
    setWatchlistCount(watchlistService.getWatchlistCount());
  };

  const handleToggleWatchlistPanel = () => {
    setShowWatchlistPanel(!showWatchlistPanel);
  };

  const handleCloseWatchlistPanel = () => {
    setShowWatchlistPanel(false);
    setWatchlistCount(watchlistService.getWatchlistCount());
  };

  const currentSymbol = POPULAR_SYMBOLS.find(s => s.symbol === settings.symbol);

  return (
    <div className="relative flex items-center space-x-2 bg-white border-b border-gray-200 px-3 py-2">
      {/* Symbol Selector */}
      <div className="flex items-center space-x-2">
        <label htmlFor="symbol-select" className="text-sm font-semibold text-gray-700">Symbol:</label>
        <div className="flex items-center space-x-1">
          <select
            id="symbol-select"
            value={settings.symbol}
            onChange={handleSymbolChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium bg-white hover:border-gray-400 transition-colors min-w-[140px]"
          >
          {/* Fallback option when settings.symbol exists but isn't in POPULAR_SYMBOLS */}
          {settings.symbol && !POPULAR_SYMBOLS.find(sym => sym.symbol === settings.symbol) && (
            <option value={settings.symbol}>
              {settings.symbol}
            </option>
          )}
          
          {/* Major Pairs */}
          <optgroup label="━━━ Major Pairs ━━━">
            {POPULAR_SYMBOLS.filter(s => s.category === 'Major').map((sym) => (
              <option key={sym.symbol} value={sym.symbol}>
                {sym.display}
              </option>
            ))}
          </optgroup>
          
          {/* Cross Pairs */}
          <optgroup label="━━━ Cross Pairs ━━━">
            {POPULAR_SYMBOLS.filter(s => s.category === 'Cross').map((sym) => (
              <option key={sym.symbol} value={sym.symbol}>
                {sym.display}
              </option>
            ))}
          </optgroup>
        </select>
        
        {/* Compact Unique Watchlist Button */}
        <button
          onClick={handleToggleWatchlist}
          className={`group relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
            isInWatchlist 
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300' 
              : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 hover:from-slate-200 hover:to-slate-300 hover:text-slate-700 shadow-sm hover:shadow-md'
          }`}
          title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {/* Unique Star Icon - Smaller and more distinctive */}
          <svg 
            className={`w-4 h-4 transition-all duration-300 ${
              isInWatchlist 
                ? 'animate-pulse drop-shadow-sm' 
                : 'group-hover:rotate-180'
            }`} 
            fill={isInWatchlist ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={isInWatchlist ? 2 : 2.5} 
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
            />
          </svg>
          
          {/* Sparkle effect for active state */}
          {isInWatchlist && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
          )}
          
          {/* Subtle border effect */}
          <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ${
            isInWatchlist 
              ? 'border-amber-300' 
              : 'border-transparent group-hover:border-slate-300'
          }`}></div>
        </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center space-x-2">
        <label htmlFor="timeframe-select" className="text-sm font-semibold text-gray-700">Timeframe:</label>
        <select
          id="timeframe-select"
          value={settings.timeframe}
          onChange={handleTimeframeChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium bg-white hover:border-gray-400 transition-colors"
        >
          {TIMEFRAMES.map((tf) => (
            <option key={tf.value} value={tf.value}>
              {tf.label}
            </option>
          ))}
        </select>
      </div>

      {/* Current Selection Display */}
      <div className="flex-1 flex items-center justify-end space-x-2">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 rounded-lg border border-blue-200">
          <span className="text-sm font-bold text-blue-700">
            {currentSymbol?.display || settings.symbol}
          </span>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 py-1.5 rounded-lg border border-green-200">
          <span className="text-sm font-bold text-green-700">
            {TIMEFRAMES.find(tf => tf.value === settings.timeframe)?.label || settings.timeframe}
          </span>
        </div>
        
        {/* View Watchlist Button */}
        <button
          onClick={handleToggleWatchlistPanel}
          className="relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 text-sm font-medium"
          title="View Watchlist"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 10h16M4 14h16M4 18h16" 
            />
          </svg>
          <span>Watchlist</span>
          {watchlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {watchlistCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Watchlist Panel */}
      {showWatchlistPanel && (
        <div className="absolute top-14 right-3 z-50">
          <WatchlistPanel onClose={handleCloseWatchlistPanel} />
        </div>
      )}
    </div>
  );
};