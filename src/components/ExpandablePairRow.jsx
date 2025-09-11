import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import React, { useState } from 'react';

import { StandardSparkline } from './SparklineChart';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';

/**
 * Expandable Pair Row Component
 * Shows basic info in collapsed state, detailed analysis when expanded
 */
const ExpandablePairRow = ({ 
  pair, 
  onAddToWishlist, 
  isInWishlist, 
  settings,
  rsiHistory = [],
  priceHistory = [],
  rsiEvents = [],
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { symbol, rsi, price, change, rfiData } = pair;

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

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      {/* Main Row - Always Visible */}
      <div 
        className={`flex items-center py-3 px-3 hover:bg-gray-50 cursor-pointer transition-colors ${
          isInWishlist ? 'bg-gray-100' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${formatSymbolDisplay(symbol)}`}
      >
        {/* Symbol */}
        <div className="w-24 text-xs font-medium text-gray-900 text-center px-2">
          {formatSymbolDisplay(symbol)}
        </div>
        
        {/* RSI */}
        <div className={`w-20 text-xs font-bold text-center px-2 ${getRsiColor(rsi, settings.rsiOverbought, settings.rsiOversold)}`}>
          {formatRsi(rsi)}
        </div>
        
        {/* Price */}
        <div className="w-24 text-xs text-gray-900 font-mono text-center px-2">
          {symbol.includes('JPY') ? formatPrice(price, 3) : formatPrice(price, 5)}
        </div>
        
        {/* Change */}
        <div className={`w-20 text-xs font-medium text-center px-2 ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
          {formatPercentage(change)}
        </div>
        
        {/* Price Sparkline */}
        <div className="w-20 flex justify-center px-2">
          <StandardSparkline data={priceHistory} />
        </div>
        
        {/* Recent Events Indicator */}
        <div className="w-16 text-center px-2">
          {rsiEvents.length > 0 && (
            <div className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
              {rsiEvents.length}
            </div>
          )}
        </div>
        
        {/* Expand/Collapse Button */}
        <div className="w-12 text-center px-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 mx-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 mx-auto" />
          )}
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

            {/* RFI Data */}
            {rfiData && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-900 mb-2">RFI Analysis</h4>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-gray-500">RFI Score</div>
                      <div className="font-bold text-lg">{rfiData.score?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Signal</div>
                      <div className={`font-medium ${
                        rfiData.signal === 'bullish' ? 'text-green-600' : 
                        rfiData.signal === 'bearish' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {rfiData.signal?.charAt(0).toUpperCase() + rfiData.signal?.slice(1) || 'Neutral'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Strength</div>
                      <div className="font-medium">{rfiData.strength?.charAt(0).toUpperCase() + rfiData.strength?.slice(1) || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="md:col-span-2 flex justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWishlist(symbol);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  isInWishlist
                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                }`}
              >
                {isInWishlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandablePairRow;
