import React, { useEffect, useState, useMemo } from 'react';
import {
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { EnhancedCandlestickChart } from './EnhancedCandlestickChart';
import { UniversalDrawingTools } from './UniversalDrawingTools';
import { realMarketService } from '../services/realMarketService';
import { useChartStore } from '../stores/useChartStore';
import { 
  calculateAllIndicators
} from '../utils/indicators';

export const UnifiedChart = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    candles,
    indicators,
    settings,
    isLoading,
    isConnected,
    error,
    setCandles,
    addCandle,
    updateLastCandle,
    setIndicators,
    setLoading,
    setConnected,
    setError
  } = useChartStore();
  
  // Create lookup maps for better performance
  const indicatorMaps = useMemo(() => {
    const createMap = (data, key = 'time', valueKey) => {
      const map = new Map();
      data.forEach(item => {
        const keyValue = item[key];
        const value = valueKey ? item[valueKey] : item;
        map.set(keyValue, value);
      });
      return map;
    };

    // Safe helper function to handle undefined indicators
    const safe = (value) => value || [];

    return {
      ema20: createMap(safe(indicators.ema20), 'time', 'value'),
      ema200: createMap(safe(indicators.ema200), 'time', 'value'),
      rsi: createMap(safe(indicators.rsi), 'time', 'value'),
      macd: createMap(safe(indicators.macd), 'time'),
      atr: createMap(safe(indicators.atr), 'time', 'atr'),
      sma50: createMap(safe(indicators.sma50), 'time', 'value'),
      sma100: createMap(safe(indicators.sma100), 'time', 'value'),
      bollinger: createMap(safe(indicators.bollinger), 'time'),
      stoch: createMap(safe(indicators.stoch), 'time'),
      williams: createMap(safe(indicators.williams), 'time', 'value'),
      cci: createMap(safe(indicators.cci), 'time', 'value'),
      obv: createMap(safe(indicators.obv), 'time', 'value'),
      vwap: createMap(safe(indicators.vwap), 'time', 'value'),
      change24h: createMap(safe(indicators.change24h), 'time')
    };
  }, [indicators]);

  // Format data for Recharts with proper indicator alignment (optimized)
  const chartData = useMemo(() => {
    return candles.map((candle, index) => {
      // Use fast Map lookups instead of expensive .find() operations
      const ema20Value = indicatorMaps.ema20.get(candle.time);
      const ema200Value = indicatorMaps.ema200.get(candle.time);
      const rsiValue = indicatorMaps.rsi.get(candle.time);
      const macdValue = indicatorMaps.macd.get(candle.time);
      const atrValue = indicatorMaps.atr.get(candle.time);
      
      // New indicators
      const sma50Value = indicatorMaps.sma50.get(candle.time);
      const sma100Value = indicatorMaps.sma100.get(candle.time);
      const bollingerValue = indicatorMaps.bollinger.get(candle.time);
      const stochValue = indicatorMaps.stoch.get(candle.time);
      const williamsValue = indicatorMaps.williams.get(candle.time);
      const cciValue = indicatorMaps.cci.get(candle.time);
      const obvValue = indicatorMaps.obv.get(candle.time);
      const vwapValue = indicatorMaps.vwap.get(candle.time);
      const change24hValue = indicatorMaps.change24h.get(candle.time);
      
      return {
        time: index, // Use index for better chart rendering
        timeLabel: new Date(candle.time * 1000).toLocaleTimeString(),
        timestamp: candle.time,
        price: candle.close,
        high: candle.high,
        low: candle.low,
        open: candle.open,
        close: candle.close,
        volume: candle.volume,
        ema20: ema20Value || null,
        ema200: ema200Value || null,
        rsi: rsiValue || null,
        macd: macdValue?.macd || null,
        signal: macdValue?.signal || null,
        histogram: macdValue?.histogram || null,
        atr: atrValue ? atrValue * 100 : null, // Scale ATR by 100x for better visibility
        // New indicators
        sma50: sma50Value || null,
        sma100: sma100Value || null,
        bollingerUpper: bollingerValue?.upper || null,
        bollingerMiddle: bollingerValue?.middle || null,
        bollingerLower: bollingerValue?.lower || null,
        stochK: stochValue?.k || null,
        stochD: stochValue?.d || null,
        williams: williamsValue || null,
        cci: cciValue || null,
        obv: obvValue || null,
        vwap: vwapValue || null,
        change24h: change24hValue?.change || null,
        change24hPercent: change24hValue?.changePercent || null,
      };
    });
  }, [candles, indicatorMaps]);

  // Performance optimized - removed debug logging for better performance


  // Calculate price information
  const latestPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const previousPrice = candles.length > 1 ? candles[candles.length - 2].close : latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  
  // Debug logging for candles
  console.log('📊 UnifiedChart render - Candles state:', {
    candlesLength: candles.length,
    isLoading,
    isConnected,
    error,
    latestPrice,
    settings: settings
  });

  // Initialize chart
  useEffect(() => {
    console.log('Unified Chart initialization effect running...');
    setIsInitialized(true);
  }, []);


  // Load historical data
  useEffect(() => {
    const loadHistoricalData = async () => {
      console.log('🚀 Starting to load historical data...');
      console.log('📊 Settings:', { symbol: settings.symbol, timeframe: settings.timeframe });
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('📡 Calling realMarketService.getHistoricalData...');
        const data = await realMarketService.getHistoricalData(
          settings.symbol,
          settings.timeframe,
          500
        );
        
        console.log('✅ Historical data loaded successfully!');
        console.log('📈 Data length:', data.length, 'candles');
        console.log('📈 First candle:', data[0]);
        console.log('📈 Last candle:', data[data.length - 1]);
        console.log('📈 Full data array:', data);
        
        // Validate the data structure
        if (data.length > 0) {
          const firstCandle = data[0];
          console.log('🔍 Data validation:', {
            hasTime: typeof firstCandle.time === 'number' && !isNaN(firstCandle.time),
            hasOpen: typeof firstCandle.open === 'number' && !isNaN(firstCandle.open),
            hasHigh: typeof firstCandle.high === 'number' && !isNaN(firstCandle.high),
            hasLow: typeof firstCandle.low === 'number' && !isNaN(firstCandle.low),
            hasClose: typeof firstCandle.close === 'number' && !isNaN(firstCandle.close),
            timeValue: firstCandle.time,
            openValue: firstCandle.open
          });
        } else {
          console.warn('⚠️ No data received from realMarketService!');
          console.warn('⚠️ Data is empty or null:', data);
        }
        
        console.log('💾 Setting candles in store...');
        setCandles(data);
        console.log('✅ Candles set in store, length:', data.length);
        
        // Calculate indicators
        console.log('🧮 Calculating indicators...');
        const calculatedIndicators = calculateAllIndicators(data);
        console.log('✅ Indicators calculated:', Object.keys(calculatedIndicators));
        setIndicators(calculatedIndicators);
        
      } catch (err) {
        console.error('❌ Error loading data:', err);
        console.error('❌ Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setCandles([]);
        setIndicators({
          ema20: [],
          ema200: [],
          rsi: [],
          macd: [],
          atr: [],
          sma50: [],
          sma100: [],
          bollinger: [],
          stoch: [],
          williams: [],
          cci: [],
          obv: [],
          vwap: [],
          change24h: []
        });
      } finally {
        console.log('🏁 Loading process completed');
        setLoading(false);
      }
    };

    if (isInitialized) {
      loadHistoricalData();
    }
  }, [isInitialized, settings.symbol, settings.timeframe, setCandles, setIndicators, setLoading, setError]);


  // WebSocket connection for real-time data
  useEffect(() => {
    console.log('🔄 WebSocket effect triggered. isInitialized:', isInitialized);
    if (!isInitialized) {
      console.log('⏸️ WebSocket effect: Chart not initialized yet, skipping connection');
      return;
    }
    
    console.log('🚀 WebSocket effect: Chart is initialized, proceeding with connection');

    const handleNewCandle = (newCandle) => {
      // Validate the new candle data
      if (isNaN(newCandle.time) || isNaN(newCandle.open) || isNaN(newCandle.high) || 
          isNaN(newCandle.low) || isNaN(newCandle.close) || newCandle.time <= 0) {
        console.warn('Invalid candle data received:', newCandle);
        return;
      }

      const lastCandle = candles[candles.length - 1];
      
      if (lastCandle && newCandle.time === lastCandle.time) {
        // Update existing candle
        updateLastCandle(newCandle);
      } else if (!lastCandle || newCandle.time > lastCandle.time) {
        // Add new candle (only if time is greater than last candle)
        addCandle(newCandle);
      } else {
        // If new candle time is older, insert it in the correct position
        const updatedCandles = [...candles, newCandle].sort((a, b) => a.time - b.time);
        setCandles(updatedCandles);
        
        // Recalculate indicators with sorted data
        const calculatedIndicators = calculateAllIndicators(updatedCandles);
        setIndicators(calculatedIndicators);
        return;
      }
      
      // Recalculate indicators with new data
      const updatedCandles = lastCandle && newCandle.time === lastCandle.time
        ? [...candles.slice(0, -1), newCandle]
        : [...candles, newCandle];
      
      // Ensure candles are sorted by time
      const sortedCandles = updatedCandles.sort((a, b) => a.time - b.time);
      const calculatedIndicators = calculateAllIndicators(sortedCandles);
      setIndicators(calculatedIndicators);
    };

    const handleError = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
      setConnected(false);
    };

    const handleClose = () => {
      setConnected(false);
    };

    const handleOpen = () => {
      console.log('🟢 UnifiedChart: WebSocket opened - setting connected to true');
      setConnected(true);
      setError(null);
    };

    console.log('🔧 UnifiedChart: Setting up WebSocket connection for', settings.symbol, settings.timeframe);
    
    // Connect to WebSocket
    realMarketService.connectWebSocket(
      settings.symbol,
      settings.timeframe,
      handleNewCandle,
      handleError,
      handleClose,
      handleOpen
    );

    return () => {
      console.log('🧹 WebSocket cleanup: disconnecting');
      realMarketService.disconnectWebSocket();
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, settings.symbol, settings.timeframe]);

  // Initialize wishlist WebSocket (temporarily disabled to fix main chart)

  if (isLoading) {
  return (
      <div className="flex-1 bg-white flex items-center justify-center h-screen ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unified chart data...</p>
                </div>
              </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium mb-2">Error loading data</p>
          <p className="text-gray-600 text-sm">{error}</p>
                </div>
              </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col h-screen pb-[600px] m-3 mb-3">
      {/* Price Info Bar */}
      <div className="bg-white  px-4 py-1 flex-shrink-0 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-900">{settings.symbol}</span>
            <span className="text-xl font-bold text-gray-900">
                  ${latestPrice?.toFixed(2) || '0.00'}
            </span>
            <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
                </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Connected: {isConnected ? '🟢' : '🔴'}</span>
            <span>Candles: {candles.length}</span>
          </div>
        </div>
      </div>

      {/* Chart Container with Internal Scroll */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ 
          minHeight: '400px',
          maxHeight: 'calc(100vh - 200px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          scrollBehavior: 'smooth'
        }}
      >
        {(() => {
          console.log('📊 UnifiedChart: Rendering decision', {
            chartType: settings.chartType,
            isCandlestick: settings.chartType === 'candlestick',
            candlesCount: candles.length
          });
          return null;
        })()}
        {settings.chartType === 'candlestick' ? (
          // Show Enhanced Candlestick Chart with drawing tools
          <EnhancedCandlestickChart 
            key={`enhanced-candlestick-${settings.symbol}-${settings.timeframe}`}
            candles={candles}
            indicators={indicators}
            settings={settings}
          />
        ) : (
          // Show separate Recharts for each indicator
          <>
            {chartData.length > 0 ? (
              <div className="space-y-2 pb-2">
                {/* Price Chart with EMAs */}
                <div className="bg-white rounded-lg border border-gray-200 p-2 relative">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Price Chart - {settings.symbol}</h4>
                  <div className="text-xs text-gray-600 mb-2">
                    Data: {chartData.length} points | Price: ${chartData[0]?.price?.toFixed(2)} - ${chartData[chartData.length-1]?.price?.toFixed(2)}
                  </div>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 9 }}
                        tickFormatter={(value) => {
                          const dataPoint = chartData[value];
                          return dataPoint ? dataPoint.timeLabel : '';
                        }}
                        style={{ 
                          textAnchor: 'middle',
                          fontSize: '9px'
                        }}
                      />
                      <YAxis 
                        yAxisId="left"
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 9 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 9 }}
                        tickFormatter={(value) => (value / 100).toFixed(2)}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (typeof value === 'number') {
                            // Show unscaled ATR values in tooltip
                            if (name === 'ATR') {
                              return [(value / 100).toFixed(4), name];
                            }
                            return [value.toFixed(2), name];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend />
                      
                      {/* Price Area */}
                      <Area
                        type="monotone"
                        dataKey="price"
                        fill="#3b82f6"
                        stroke="#2563eb"
                        fillOpacity={0.3}
                        name="Price"
                      />
                      
                      {/* EMAs */}
                      {settings.indicators.ema20 && (
                        <Line
                          type="monotone"
                          dataKey="ema20"
                          stroke="#ff9800"
                          dot={false}
                          strokeWidth={2}
                          name="EMA 20"
                        />
                      )}
                      {settings.indicators.ema200 && (
                        <Line
                          type="monotone"
                          dataKey="ema200"
                          stroke="#2196f3"
                          dot={false}
                          strokeWidth={2}
                          name="EMA 200"
                        />
                      )}
                      
                      {/* SMAs */}
                      {settings.indicators.sma50 && (
                        <Line
                          type="monotone"
                          dataKey="sma50"
                          stroke="#10b981"
                          dot={false}
                          strokeWidth={2}
                          name="SMA 50"
                        />
                      )}
                      {settings.indicators.sma100 && (
                        <Line
                          type="monotone"
                          dataKey="sma100"
                          stroke="#059669"
                          dot={false}
                          strokeWidth={2}
                          name="SMA 100"
                        />
                      )}
                      
                      {/* Bollinger Bands */}
                      {settings.indicators.bollinger && (
                        <>
                          <Line
                            type="monotone"
                            dataKey="bollingerUpper"
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            dot={false}
                            name="BB Upper"
                          />
                          <Line
                            type="monotone"
                            dataKey="bollingerMiddle"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={false}
                            name="BB Middle"
                          />
                          <Line
                            type="monotone"
                            dataKey="bollingerLower"
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            dot={false}
                            name="BB Lower"
                          />
                        </>
                      )}
                      
                      {/* VWAP */}
                      {settings.indicators.vwap && (
                        <Line
                          type="monotone"
                          dataKey="vwap"
                          stroke="#06b6d4"
                          dot={false}
                          strokeWidth={2}
                          name="VWAP"
                        />
                      )}
                      
                      {/* ATR - Integrated into main price chart with enhanced visibility */}
                      {settings.indicators.atr && (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="atr"
                          stroke="#ff5722"
                          dot={false}
                          strokeWidth={3}
                          name="ATR"
                          connectNulls={false}
                        />
                      )}
                    </ComposedChart>
                    </ResponsiveContainer>
                    
                    {/* Universal Drawing Tools Overlay */}
                    <UniversalDrawingTools 
                      chartData={chartData}
                      chartWidth={800} // Responsive width - will be improved with ResizeObserver
                      chartHeight={200}
                      currentPrice={latestPrice}
                      chartType="recharts"
                    />
                  </div>
                </div>

                {/* RSI Chart */}
                {settings.indicators.rsi && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">RSI (Relative Strength Index)</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rsi"
                          stroke="#9c27b0"
                          strokeWidth={2}
                          dot={false}
                          name="RSI"
                        />
                        {/* RSI Overbought/Oversold lines */}
                        <Line
                          type="monotone"
                          dataKey={() => 70}
                          stroke="#ff5722"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Overbought (70)"
                        />
                        <Line
                          type="monotone"
                          dataKey={() => 30}
                          stroke="#4caf50"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Oversold (30)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* MACD Chart */}
                {settings.indicators.macd && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">MACD (Moving Average Convergence Divergence)</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(4), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        
                        {/* MACD Line */}
                        <Line
                          type="monotone"
                          dataKey="macd"
                          stroke="#2196f3"
                          strokeWidth={2}
                          dot={false}
                          name="MACD"
                        />
                        
                        {/* Signal Line */}
                        <Line
                          type="monotone"
                          dataKey="macdSignal"
                          stroke="#ff9800"
                          strokeWidth={2}
                          dot={false}
                          name="Signal"
                        />
                        
                        {/* Histogram */}
                        <Bar
                          dataKey="macdHistogram"
                          fill="#4caf50"
                          name="Histogram"
                          opacity={0.7}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}


                {/* SMA 50 Chart */}
                {settings.indicators.sma50 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">SMA 50 (Simple Moving Average)</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sma50"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          name="SMA 50"
                        />
                      </LineChart>
                    </ResponsiveContainer>
            </div>
                )}

                {/* SMA 100 Chart */}
                {settings.indicators.sma100 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">SMA 100 (Simple Moving Average)</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sma100"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                          name="SMA 100"
                        />
                      </LineChart>
                    </ResponsiveContainer>
          </div>
                )}

                {/* Bollinger Bands Chart */}
                {settings.indicators.bollinger && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Bollinger Bands</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="bollingerUpper"
                          stroke="#8b5cf6"
                          strokeWidth={1}
                          dot={false}
                          name="Upper Band"
                        />
                        <Line
                          type="monotone"
                          dataKey="bollingerMiddle"
                          stroke="#7c3aed"
                          strokeWidth={2}
                          dot={false}
                          name="Middle Band"
                        />
                        <Line
                          type="monotone"
                          dataKey="bollingerLower"
                          stroke="#8b5cf6"
                          strokeWidth={1}
                          dot={false}
                          name="Lower Band"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
        </div>
      )}

                {/* Stochastic Chart */}
                {settings.indicators.stoch && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Stochastic Oscillator</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="stochK"
                          stroke="#ec4899"
                          strokeWidth={2}
                          dot={false}
                          name="%K"
                        />
                        <Line
                          type="monotone"
                          dataKey="stochD"
                          stroke="#be185d"
                          strokeWidth={2}
                          dot={false}
                          name="%D"
                        />
                        {/* Overbought/Oversold lines */}
                        <Line
                          type="monotone"
                          dataKey={() => 80}
                          stroke="#ef4444"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Overbought (80)"
                        />
                        <Line
                          type="monotone"
                          dataKey={() => 20}
                          stroke="#22c55e"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Oversold (20)"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                </div>
                )}

                {/* Williams %R Chart */}
                {settings.indicators.williams && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Williams %R</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={[-100, 0]}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="williams"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                          name="Williams %R"
                        />
                        {/* Overbought/Oversold lines */}
                        <Line
                          type="monotone"
                          dataKey={() => -20}
                          stroke="#f97316"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Overbought (-20)"
                        />
                        <Line
                          type="monotone"
                          dataKey={() => -80}
                          stroke="#22c55e"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Oversold (-80)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
              </div>
                )}

                {/* CCI Chart */}
                {settings.indicators.cci && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">CCI (Commodity Channel Index)</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cci"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                          name="CCI"
                        />
                        {/* CCI reference lines */}
                        <Line
                          type="monotone"
                          dataKey={() => 100}
                          stroke="#ef4444"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Overbought (100)"
                        />
                        <Line
                          type="monotone"
                          dataKey={() => -100}
                          stroke="#22c55e"
                          strokeDasharray="5 5"
                          dot={false}
                          name="Oversold (-100)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
            </div>
          )}
          
                {/* OBV Chart */}
                {settings.indicators.obv && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">OBV (On-Balance Volume)</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(0), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="obv"
                          stroke="#14b8a6"
                          strokeWidth={2}
                          dot={false}
                          name="OBV"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                </div>
                )}

                {/* VWAP Chart */}
                {settings.indicators.vwap && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">VWAP (Volume Weighted Average Price)</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="vwap"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          dot={false}
                          name="VWAP"
                        />
                      </LineChart>
                    </ResponsiveContainer>
              </div>
                )}

                {/* 24h Change Chart */}
                {settings.indicators.change24h && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">24h Change</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => {
                            const dataPoint = chartData[value];
                            return dataPoint ? dataPoint.timeLabel : '';
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (typeof value === 'number') {
                              if (name === 'Change %') return [value.toFixed(2) + '%', name];
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="change24h"
                          fill="#f97316"
                          name="Change"
                          opacity={0.7}
                        />
                        <Line
                          type="monotone"
                          dataKey="change24hPercent"
                          stroke="#ea580c"
                          strokeWidth={2}
                          dot={false}
                          name="Change %"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
            </div>
          )}
          
                {/* Volume Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-2 mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Volume</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 9 }}
                        tickFormatter={(value) => {
                          const dataPoint = chartData[value];
                          return dataPoint ? dataPoint.timeLabel : '';
                        }}
                        style={{ 
                          textAnchor: 'middle',
                          fontSize: '9px'
                        }}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 9 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (typeof value === 'number') {
                            return [value.toFixed(0), name];
                          }
                          return [value, name];
                        }}
                      />
                      <Bar
                        dataKey="volume"
                        fill="#8b5cf6"
                        name="Volume"
                        opacity={0.7}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Scroll Indicator */}
                <div className="text-center py-2 text-xs text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>Scroll to see all indicators</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600 font-medium">No chart data available</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {candles.length === 0 ? 'Loading market data...' : 'Processing chart data...'}
                  </p>
            </div>
              </div>
            )}
          </>
          )}
      </div>

    </div>
  );
};
