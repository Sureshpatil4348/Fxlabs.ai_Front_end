import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import useMarketStore from '../store/useMarketStore';
import { formatCurrency, getCurrencyStrengthColor } from '../utils/formatters';
import { BarChart3, LineChart as LineChartIcon, Grid, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const CurrencyStrengthBar = ({ currency, strength, isTop, isBottom }) => {
  const currencyInfo = formatCurrency(currency);
  
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-2 w-16">
        <span className="text-lg">{currencyInfo.flag}</span>
        <span className="text-sm font-medium text-gray-900">{currency}</span>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            {isTop && <TrendingUp className="w-3 h-3 text-success-600" />}
            {isBottom && <TrendingDown className="w-3 h-3 text-danger-600" />}
            <span className="text-xs text-gray-600">{currencyInfo.name}</span>
          </div>
          <span className={`text-sm font-bold transition-all duration-300 ${getCurrencyStrengthColor(strength).split(' ')[0]}`}>
            {strength.toFixed(1)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ease-in-out ${getCurrencyStrengthColor(strength).split(' ')[1]}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const CurrencyHeatmap = ({ strengthData }) => {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {currencies.map(currency => {
        const strength = strengthData.find(d => d.currency === currency)?.strength || 50;
        const currencyInfo = formatCurrency(currency);
        
        return (
          <div
            key={currency}
            className={`p-3 rounded-lg text-center transition-all duration-300 ${getCurrencyStrengthColor(strength)}`}
          >
            <div className="text-lg mb-1">{currencyInfo.flag}</div>
            <div className="text-xs font-medium">{currency}</div>
            <div className="text-sm font-bold mt-1">{strength.toFixed(0)}</div>
          </div>
        );
      })}
    </div>
  );
};

const StrengthChart = ({ data, type }) => {
  const chartData = data.map(item => ({
    ...item,
    color: item.strength >= 70 ? '#16a34a' : 
           item.strength >= 60 ? '#22c55e' : 
           item.strength >= 40 ? '#6b7280' : 
           item.strength >= 30 ? '#f87171' : '#dc2626'
  }));

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="currency" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(1)}`, 'Strength']}
            labelFormatter={(label) => `${formatCurrency(label).name} (${label})`}
          />
          <Line 
            type="monotone" 
            dataKey="strength" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="currency" />
        <YAxis domain={[0, 100]} />
        <Tooltip 
          formatter={(value) => [`${value.toFixed(1)}`, 'Strength']}
          labelFormatter={(label) => `${formatCurrency(label).name} (${label})`}
        />
        <Bar dataKey="strength" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const CurrencyStrengthMeter = () => {
  const { 
    currencyStrength, 
    strengthSettings,
    globalSettings, 
    calculateCurrencyStrength,
    subscriptions,
    ohlcData
  } = useMarketStore();
  
  const [viewMode, setViewMode] = useState('bars');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate currency strength when subscriptions change or settings change
  useEffect(() => {
    if (subscriptions.size > 0) {
      console.log('Recalculating currency strength due to settings or subscription change');
      calculateCurrencyStrength();
    }
  }, [subscriptions.size, globalSettings.timeframe, strengthSettings.mode, calculateCurrencyStrength]);

  // React to OHLC data changes to ensure currency strength updates automatically
  useEffect(() => {
    if (subscriptions.size > 0 && ohlcData.size > 0) {
      console.log('OHLC data changed, currency strength should update automatically via store');
    }
  }, [ohlcData, subscriptions.size]);

  // Auto-refresh every 30 seconds if we have subscriptions
  useEffect(() => {
    if (subscriptions.size > 0) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing currency strength');
        calculateCurrencyStrength();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [subscriptions.size, calculateCurrencyStrength]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    calculateCurrencyStrength();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Convert Map to array and sort by strength
  const strengthData = Array.from(currencyStrength.entries())
    .map(([currency, strength]) => ({ currency, strength }))
    .sort((a, b) => b.strength - a.strength);

  // Identify top 2 strongest and weakest
  const topCurrencies = strengthData.slice(0, 2).map(d => d.currency);
  const bottomCurrencies = strengthData.slice(-2).map(d => d.currency);

  const viewModes = [
    { id: 'bars', label: 'Bar Chart', icon: BarChart3 },
    { id: 'lines', label: 'Line Chart', icon: LineChartIcon },
    { id: 'heatmap', label: 'Heatmap', icon: Grid }
  ];

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Currency Strength Meter</h2>
          <p className="text-sm text-gray-500">
            {globalSettings.timeframe} • {strengthSettings.mode === 'live' ? 'Live Updates' : 'Closed Candles'}
          </p>
          {strengthData.length === 0 && subscriptions.size > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              📊 Calculating strength for {globalSettings.timeframe} timeframe...
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Content based on view mode */}
      {strengthData.length > 0 ? (
        <>
          {viewMode === 'bars' && (
            <div className="space-y-2">
              {strengthData.map((item) => (
                <CurrencyStrengthBar
                  key={item.currency}
                  currency={item.currency}
                  strength={item.strength}
                  isTop={topCurrencies.includes(item.currency)}
                  isBottom={bottomCurrencies.includes(item.currency)}
                />
              ))}
            </div>
          )}

          {viewMode === 'lines' && (
            <StrengthChart data={strengthData} type="line" />
          )}

          {viewMode === 'heatmap' && (
            <CurrencyHeatmap strengthData={strengthData} />
          )}

          {/* Summary */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-success-50 rounded-lg">
              <h4 className="text-sm font-medium text-success-700 mb-2">Strongest Currencies</h4>
              <div className="space-y-1">
                {strengthData.slice(0, 2).map((item) => {
                  const currencyInfo = formatCurrency(item.currency);
                  return (
                    <div key={item.currency} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{currencyInfo.flag}</span>
                        <span className="text-sm font-medium">{item.currency}</span>
                      </div>
                      <span className="text-sm font-bold text-success-600">
                        {item.strength.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-danger-50 rounded-lg">
              <h4 className="text-sm font-medium text-danger-700 mb-2">Weakest Currencies</h4>
              <div className="space-y-1">
                {strengthData.slice(-2).reverse().map((item) => {
                  const currencyInfo = formatCurrency(item.currency);
                  return (
                    <div key={item.currency} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{currencyInfo.flag}</span>
                        <span className="text-sm font-medium">{item.currency}</span>
                      </div>
                      <span className="text-sm font-bold text-danger-600">
                        {item.strength.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No strength data available
          </h3>
          <p className="text-gray-500 text-sm">
            Currency strength will be calculated based on subscribed pairs.
          </p>
        </div>
      )}

    </div>
  );
};

export default CurrencyStrengthMeter;
