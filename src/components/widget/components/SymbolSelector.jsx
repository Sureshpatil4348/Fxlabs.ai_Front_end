import React from 'react';

import { useChartStore } from '../stores/useChartStore';

// Updated with real market forex symbols
const POPULAR_SYMBOLS = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', icon: '€' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', icon: '£' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', icon: '¥' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', icon: 'A$' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', icon: 'C$' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', icon: 'CHF' },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', icon: 'NZ$' },
  { symbol: 'EURGBP', name: 'Euro / British Pound', icon: '€' },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', icon: '€' },
  { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', icon: '£' },
  { symbol: 'AUDCAD', name: 'Australian Dollar / Canadian Dollar', icon: 'A$' },
  { symbol: 'AUDCHF', name: 'Australian Dollar / Swiss Franc', icon: 'A$' },
  { symbol: 'AUDJPY', name: 'Australian Dollar / Japanese Yen', icon: 'A$' },
  { symbol: 'CADCHF', name: 'Canadian Dollar / Swiss Franc', icon: 'C$' },
  { symbol: 'CADJPY', name: 'Canadian Dollar / Japanese Yen', icon: 'C$' },
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

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  const currentSymbol = POPULAR_SYMBOLS.find(s => s.symbol === settings.symbol);

  return (
    <div className="flex items-center space-x-1 bg-white border-b border-gray-200 px-2 py-1.5">
      {/* Symbol Selector */}
      <div className="flex items-center space-x-1">
        <label htmlFor="symbol-select" className="text-xs font-medium text-gray-700">Symbol:</label>
        <select
          id="symbol-select"
          value={settings.symbol}
          onChange={handleSymbolChange}
          className="px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-medium"
        >
          {POPULAR_SYMBOLS.map((sym) => (
            <option key={sym.symbol} value={sym.symbol}>
              {sym.icon} {sym.name}
            </option>
          ))}
        </select>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center space-x-1">
        <label htmlFor="timeframe-select" className="text-xs font-medium text-gray-700">Timeframe:</label>
        <select
          id="timeframe-select"
          value={settings.timeframe}
          onChange={handleTimeframeChange}
          className="px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
        >
          {TIMEFRAMES.map((tf) => (
            <option key={tf.value} value={tf.value}>
              {tf.label}
            </option>
          ))}
        </select>
      </div>

      {/* Current Selection Display */}
      <div className="flex-1 flex items-center justify-end space-x-1">
        <div className="bg-blue-50 px-2 py-0.5 rounded-lg">
          <span className="text-xs font-medium text-blue-700">
            {currentSymbol?.icon} {settings.symbol}
          </span>
        </div>
        <div className="bg-green-50 px-2 py-0.5 rounded-lg">
          <span className="text-xs font-medium text-green-700">
            📊 {TIMEFRAMES.find(tf => tf.value === settings.timeframe)?.label || settings.timeframe}
          </span>
        </div>
      </div>
    </div>
  );
};