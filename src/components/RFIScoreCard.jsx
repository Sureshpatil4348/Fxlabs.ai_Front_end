import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import React from 'react';

import { formatSymbolDisplay } from '../utils/formatters';
import { 
  formatRFIScore, 
  getRFISignalColor, 
  getRFISignalBgColor 
} from '../utils/rfiCalculations';

/**
 * RFI Score Card Component
 * Displays RSI-Flow Imbalance score with detailed breakdown
 */
const RFIScoreCard = ({ 
  symbol, 
  rfiData, 
  price, 
  change, 
  volume, 
  onAddToWatchlist,
  onAddToWishlist, // Support both prop names for compatibility
  isInWatchlist = false,
  isInWishlist = false, // Support both prop names for compatibility
  className = ""
}) => {
  if (!rfiData) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Calculating RFI...</p>
        </div>
      </div>
    );
  }

  const { score, rsiFlow, volumeFlow, priceFlow, signal, strength } = rfiData;
  const signalColor = getRFISignalColor(signal, strength);
  const signalBgColor = getRFISignalBgColor(signal, strength);

  const getSignalIcon = () => {
    if (signal === 'bullish') {
      return <TrendingUp className="w-4 h-4" />;
    } else if (signal === 'bearish') {
      return <TrendingDown className="w-4 h-4" />;
    }
    return <BarChart3 className="w-4 h-4" />;
  };

  const getSignalText = () => {
    if (signal === 'bullish') {
      return `${strength.charAt(0).toUpperCase() + strength.slice(1)} Bullish`;
    } else if (signal === 'bearish') {
      return `${strength.charAt(0).toUpperCase() + strength.slice(1)} Bearish`;
    }
    return 'Neutral';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-[#19235d] text-sm">{formatSymbolDisplay(symbol)}</h3>
          <p className="text-xs text-gray-500">Current Price: {price || 'N/A'}</p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change ? change.toFixed(2) : '0.00'}%
          </span>
        </div>
      </div>

      {/* RFI Score Display */}
      <div className="mb-3">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${signalBgColor} ${signalColor}`}>
          {getSignalIcon()}
          <span className="ml-1">{getSignalText()}</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-[#19235d]">
            {formatRFIScore(score)}
          </div>
          <div className="text-xs text-gray-500">RFI Score</div>
        </div>
      </div>

      {/* Flow Breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-xs text-gray-500">RSI Flow</div>
          <div className="text-sm font-semibold text-[#19235d]">
            {formatRFIScore(rsiFlow)}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-xs text-gray-500">Volume Flow</div>
          <div className="text-sm font-semibold text-[#19235d]">
            {formatRFIScore(volumeFlow)}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-xs text-gray-500">Price Flow</div>
          <div className="text-sm font-semibold text-[#19235d]">
            {formatRFIScore(priceFlow)}
          </div>
        </div>
      </div>

      {/* Volume and Action */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Volume: {volume ? volume.toLocaleString() : 'N/A'}
        </span>
        <button 
          onClick={() => {
            const handler = onAddToWatchlist || onAddToWishlist;
            if (handler) handler(symbol);
          }}
          className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
            (isInWatchlist || isInWishlist)
              ? 'text-green-600 bg-green-50 hover:bg-green-100' 
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          {(isInWatchlist || isInWishlist) ? 'In Watchlist' : 'Add to Watchlist'}
        </button>
      </div>
    </div>
  );
};

/**
 * Compact RFI Score Card for smaller spaces
 */
export const CompactRFIScoreCard = ({ 
  symbol, 
  rfiData, 
  _price, // Unused parameter, prefixed with underscore
  change,
  onAddToWatchlist,
  onAddToWishlist, // Support both prop names for compatibility
  isInWatchlist = false,
  isInWishlist = false, // Support both prop names for compatibility
  className = ""
}) => {
  if (!rfiData) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="text-center text-gray-500">
          <Activity className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs">Calculating...</p>
        </div>
      </div>
    );
  }

  const { score, signal, strength } = rfiData;
  const signalColor = getRFISignalColor(signal, strength);
  const signalBgColor = getRFISignalBgColor(signal, strength);

  const getSignalIcon = () => {
    if (signal === 'bullish') {
      return <TrendingUp className="w-3 h-3" />;
    } else if (signal === 'bearish') {
      return <TrendingDown className="w-3 h-3" />;
    }
    return <BarChart3 className="w-3 h-3" />;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-[#19235d] text-sm">{formatSymbolDisplay(symbol)}</h4>
        <span className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change ? change.toFixed(2) : '0.00'}%
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${signalBgColor} ${signalColor}`}>
          {getSignalIcon()}
          <span className="ml-1">{signal.charAt(0).toUpperCase() + signal.slice(1)}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[#19235d]">
            {formatRFIScore(score)}
          </div>
          <div className="text-xs text-gray-500">RFI</div>
        </div>
      </div>
      
      {/* Watchlist Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => {
            const handler = onAddToWatchlist || onAddToWishlist;
            if (handler) handler(symbol);
          }}
          className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
            (isInWatchlist || isInWishlist)
              ? 'text-green-600 bg-green-50 hover:bg-green-100' 
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          {(isInWatchlist || isInWishlist) ? 'In Watchlist' : 'Add to Watchlist'}
        </button>
      </div>
    </div>
  );
};

export default RFIScoreCard;
