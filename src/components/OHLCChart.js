import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import useMarketStore from '../store/useMarketStore';
import { LineChart, BarChart3 } from 'lucide-react';

const OHLCChart = ({ symbol }) => {
  const { getOhlcForSymbol, subscriptions } = useMarketStore();
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('line'); // 'line' or 'candlestick'

  useEffect(() => {
    if (!symbol) return;

    const updateChart = () => {
      const ohlcBars = getOhlcForSymbol(symbol);
      
      // Transform OHLC data for Recharts
      const transformedData = ohlcBars.slice(-50).map((bar, index) => ({
        index,
        time: new Date(bar.time).toLocaleTimeString(),
        fullTime: new Date(bar.time).toLocaleString(),
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: bar.volume || 0,
        // For line chart
        price: parseFloat(bar.close),
        // For candlestick visualization
        range: [parseFloat(bar.low), parseFloat(bar.high)],
        body: [
          Math.min(parseFloat(bar.open), parseFloat(bar.close)),
          Math.max(parseFloat(bar.open), parseFloat(bar.close))
        ],
        isGreen: parseFloat(bar.close) >= parseFloat(bar.open)
      }));

      setChartData(transformedData);
    };

    updateChart();
    const interval = setInterval(updateChart, 2000);
    return () => clearInterval(interval);
  }, [symbol, getOhlcForSymbol]);

  const subscription = subscriptions.get(symbol);
  const timeframe = subscription?.timeframe || 'Unknown';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.fullTime}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Open:</span>
              <span className="text-xs font-mono">{data.open.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">High:</span>
              <span className="text-xs font-mono text-success-600">{data.high.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Low:</span>
              <span className="text-xs font-mono text-danger-600">{data.low.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Close:</span>
              <span className={`text-xs font-mono ${data.isGreen ? 'text-success-600' : 'text-danger-600'}`}>
                {data.close.toFixed(5)}
              </span>
            </div>
            {data.volume > 0 && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Volume:</span>
                <span className="text-xs font-mono">{data.volume.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!symbol) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Select a symbol to view chart</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <LineChart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Loading chart data...</p>
        <p className="text-sm text-gray-400 mt-1">
          Symbol: {symbol} • Timeframe: {timeframe}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {symbol} - {timeframe} Chart
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-md ${
              chartType === 'line' 
                ? 'bg-primary-100 text-primary-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Line Chart"
          >
            <LineChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('ohlc')}
            className={`p-2 rounded-md ${
              chartType === 'ohlc' 
                ? 'bg-primary-100 text-primary-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="OHLC Chart"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toFixed(5)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Close Price"
                connectNulls={false}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toFixed(5)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="high"
                stroke="#10b981"
                strokeWidth={1}
                dot={false}
                name="High"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="#ef4444"
                strokeWidth={1}
                dot={false}
                name="Low"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Close"
                connectNulls={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Data Points:</span>
          <span className="text-gray-900">{chartData.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Latest Price:</span>
          <span className="text-gray-900 font-mono">
            {chartData.length > 0 ? chartData[chartData.length - 1].close.toFixed(5) : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Price Range:</span>
          <span className="text-gray-900 font-mono">
            {chartData.length > 0 
              ? `${Math.min(...chartData.map(d => d.low)).toFixed(5)} - ${Math.max(...chartData.map(d => d.high)).toFixed(5)}`
              : 'N/A'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default OHLCChart;
