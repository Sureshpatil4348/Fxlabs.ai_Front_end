import React, { useState } from 'react';
import useMarketStore from '../store/useMarketStore';
import TickDataView from './TickDataView';
import OHLCDataView from './OHLCDataView';
import OHLCChart from './OHLCChart';
import { TrendingUp, BarChart3, LineChart, Activity } from 'lucide-react';

const MarketDataPanel = () => {
  const { subscriptions } = useMarketStore();
  const [activeTab, setActiveTab] = useState('ticks');
  const [selectedSymbol, setSelectedSymbol] = useState('');

  // Get first subscribed symbol as default
  const subscribedSymbols = Array.from(subscriptions.keys());
  const currentSymbol = selectedSymbol || subscribedSymbols[0] || '';

  const tabs = [
    { id: 'ticks', label: 'Live Ticks', icon: TrendingUp },
    { id: 'ohlc', label: 'OHLC Data', icon: BarChart3 },
    { id: 'chart', label: 'Chart', icon: LineChart },
  ];

  if (subscriptions.size === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Subscriptions
          </h3>
          <p className="text-gray-500 mb-4">
            Subscribe to a symbol to start viewing market data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Market Data</h2>
        
        {/* Symbol Selector */}
        {subscribedSymbols.length > 1 && (
          <select
            value={currentSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="input-field"
          >
            {subscribedSymbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'ticks' && <TickDataView symbol={currentSymbol} />}
        {activeTab === 'ohlc' && <OHLCDataView symbol={currentSymbol} />}
        {activeTab === 'chart' && <OHLCChart symbol={currentSymbol} />}
      </div>
    </div>
  );
};

export default MarketDataPanel;
