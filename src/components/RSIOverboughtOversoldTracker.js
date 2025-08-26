import React, { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import { formatSymbolDisplay, formatPrice, formatPercentage, formatRsi, getRsiColor } from '../utils/formatters';
import { TrendingDown, TrendingUp, Plus } from 'lucide-react';

const PairRow = ({ pair, onAddToWishlist, isInWishlist }) => {
  const { symbol, rsi, price, change } = pair;
  const { rsiSettings } = useMarketStore();

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 text-sm font-medium text-gray-900">
        {formatSymbolDisplay(symbol)}
      </td>
      <td className={`px-3 py-2 text-sm font-bold ${getRsiColor(rsi, rsiSettings.overbought, rsiSettings.oversold)}`}>
        {formatRsi(rsi)}
      </td>
      <td className="px-3 py-2 text-sm text-gray-900 font-mono">
        {formatPrice(price)}
      </td>
      <td className={`px-3 py-2 text-sm font-medium ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
        {formatPercentage(change)}
      </td>
      <td className="px-3 py-2 text-sm">
        <button
          onClick={() => onAddToWishlist(symbol)}
          disabled={isInWishlist}
          className={`p-1 rounded-md transition-colors ${
            isInWishlist 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
          }`}
          title={isInWishlist ? 'Already in wishlist' : 'Add to wishlist'}
        >
          <Plus className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};



const RSIOverboughtOversoldTracker = () => {
  const { 
    getOversoldPairs, 
    getOverboughtPairs, 
    addToWishlist, 
    isInWishlist,
    rsiSettings,
    globalSettings,
    rsiData
  } = useMarketStore();
  
  const [activeTab, setActiveTab] = useState('oversold');

  // Get fresh data every time RSI data updates
  const oversoldPairs = getOversoldPairs();
  const overboughtPairs = getOverboughtPairs();

  // React to RSI data changes to ensure UI updates
  useEffect(() => {
    console.log('RSI data updated in tracker, oversold:', oversoldPairs.length, 'overbought:', overboughtPairs.length);
  }, [rsiData, oversoldPairs.length, overboughtPairs.length]);

  const handleAddToWishlist = (symbol) => {
    addToWishlist(symbol);
  };

  const tabs = [
    { 
      id: 'oversold', 
      label: 'Oversold', 
      icon: TrendingDown, 
      count: oversoldPairs.length,
      color: 'text-success-600'
    },
    { 
      id: 'overbought', 
      label: 'Overbought', 
      icon: TrendingUp, 
      count: overboughtPairs.length,
      color: 'text-danger-600'
    }
  ];

  const currentPairs = activeTab === 'oversold' ? oversoldPairs : overboughtPairs;

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">RSI Tracker</h2>
        <p className="text-sm text-gray-500">
                      Oversold &lt; {rsiSettings.oversold} | Overbought &gt; {rsiSettings.overbought} | Period: {rsiSettings.period} | {globalSettings.timeframe}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 p-1 bg-gray-100 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? tab.color : ''}`} />
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        {currentPairs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RSI
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily %
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPairs.map((pair) => (
                  <PairRow
                    key={pair.symbol}
                    pair={pair}
                    onAddToWishlist={handleAddToWishlist}
                    isInWishlist={isInWishlist(pair.symbol)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
              activeTab === 'oversold' ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              {activeTab === 'oversold' ? (
                <TrendingDown className="w-6 h-6 text-success-600" />
              ) : (
                <TrendingUp className="w-6 h-6 text-danger-600" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} pairs found
            </h3>
            <p className="text-gray-500 text-sm">
              No currency pairs are currently in the {activeTab} zone 
              ({activeTab === 'oversold' ? `< ${rsiSettings.oversold}` : `> ${rsiSettings.overbought}`}).
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {currentPairs.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{currentPairs.length}</span> pairs in {activeTab} zone
            {activeTab === 'oversold' && (
              <span className="text-success-600 ml-2">• Potential buying opportunities</span>
            )}
            {activeTab === 'overbought' && (
              <span className="text-danger-600 ml-2">• Potential selling opportunities</span>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RSIOverboughtOversoldTracker;
