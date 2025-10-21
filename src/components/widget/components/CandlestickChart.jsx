import { createChart } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';

export const CandlestickChart = ({
  candles,
  indicators,
  settings
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug logging
  console.log('🕯️ CandlestickChart Props:', {
    candlesCount: candles.length,
    indicatorsCount: {
      ema20: indicators.ema20?.length || 0,
      ema200: indicators.ema200?.length || 0,
      rsi: indicators.rsi?.length || 0,
      macd: indicators.macd?.length || 0,
      atr: indicators.atr?.length || 0
    },
    settings: settings,
    firstCandle: candles[0],
    lastCandle: candles[candles.length - 1]
  });
  
  // Price series refs
  const candlestickSeriesRef = useRef(null);
  
  // Indicator series refs
  // Series refs for future indicator implementation
  // const ema20SeriesRef = useRef(null);
  // const ema200SeriesRef = useRef(null);
  // const rsiSeriesRef = useRef(null);
  // const macdSeriesRef = useRef(null);
  // const macdSignalSeriesRef = useRef(null);
  // const macdHistogramSeriesRef = useRef(null);
  // const atrSeriesRef = useRef(null);
  // const volumeSeriesRef = useRef(null);

  // Initialize chart
  useEffect(() => {
    console.log('🕯️ CandlestickChart: Initialization effect triggered', {
      hasContainer: !!chartContainerRef.current,
      isInitialized,
      containerWidth: chartContainerRef.current?.clientWidth
    });

    if (!chartContainerRef.current || isInitialized) return;

    // Clean up any existing chart first
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.warn('🕯️ Error removing existing chart:', error);
      }
      chartRef.current = null;
    }

    try {
      setError(null);
      const containerWidth = chartContainerRef.current.clientWidth || 800;
      const containerHeight = 600;
      
      console.log('🕯️ Creating candlestick chart with dimensions:', { containerWidth, containerHeight });

      const chart = createChart(chartContainerRef.current, {
        width: Math.max(containerWidth, 800),
        height: containerHeight,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333333',
        },
        grid: {
          vertLines: { color: '#e5e7eb' },
          horzLines: { color: '#e5e7eb' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#e5e7eb',
        },
        timeScale: {
          borderColor: '#e5e7eb',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      });
      candlestickSeriesRef.current = candlestickSeries;

      // Store references
      chartRef.current = chart;

      console.log('🕯️ Candlestick chart initialized successfully');
      setIsInitialized(true);

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          const width = chartContainerRef.current.clientWidth;
          const height = chartContainerRef.current.clientHeight;
          try {
            chart.applyOptions({
              width: width,
              height: height,
            });
          } catch (error) {
            console.warn('🕯️ Error resizing chart:', error);
          }
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          try {
            chart.remove();
          } catch (error) {
            console.warn('🕯️ Chart cleanup warning:', error);
          }
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        setIsInitialized(false);
      };
    } catch (error) {
      console.error('🕯️ Error initializing candlestick chart:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize chart');
    }
  }, [chartContainerRef, chartRef, isInitialized, setError]); // Include all dependencies

  // Update chart with data
  useEffect(() => {
    console.log('🕯️ CandlestickChart: Data update effect triggered', {
      isInitialized,
      candlesCount: candles.length,
      hasCandlestickSeries: !!candlestickSeriesRef.current
    });

    if (candles.length === 0) {
      console.log('🕯️ CandlestickChart: Skipping data update - no candles');
      return;
    }

    // Wait a bit for chart to be initialized
    if (!isInitialized) {
      console.log('🕯️ CandlestickChart: Chart not initialized yet, will retry');
      return;
    }

    try {
      setError(null);
      
      // Filter out invalid candles and sort by time
      const validCandles = candles.filter(candle => 
        !isNaN(candle.time) && 
        !isNaN(candle.open) && 
        !isNaN(candle.high) && 
        !isNaN(candle.low) && 
        !isNaN(candle.close) &&
        candle.time > 0
      );
      
      const sortedCandles = validCandles.sort((a, b) => a.time - b.time);
      
      console.log('🕯️ CandlestickChart: Processing candles', {
        originalCount: candles.length,
        validCount: validCandles.length,
        sortedCount: sortedCandles.length,
        firstValid: sortedCandles[0],
        lastValid: sortedCandles[sortedCandles.length - 1]
      });

      // Update candlestick data
      if (candlestickSeriesRef.current && chartRef.current) {
        const candlestickData = sortedCandles.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        
        console.log('🕯️ CandlestickChart: Setting candlestick data', {
          dataCount: candlestickData.length,
          firstData: candlestickData[0],
          lastData: candlestickData[candlestickData.length - 1]
        });
        
        try {
          candlestickSeriesRef.current.setData(candlestickData);
          console.log('🕯️ CandlestickChart: Candlestick data set successfully');
          
          // Fit content
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        } catch (error) {
          console.error('🕯️ Error setting candlestick data:', error);
          setError('Failed to set chart data');
        }
      } else {
        console.warn('🕯️ CandlestickChart: No candlestick series reference available');
      }
    } catch (error) {
      console.error('🕯️ Error updating chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to update chart data');
    }
  }, [candles, isInitialized, chartRef, setError]);


  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Candlestick Chart - {settings.symbol}
        </h3>
      </div>

      {/* Chart Container */}
      <div className="flex-1 p-3" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ 
            backgroundColor: '#ffffff',
            position: 'relative',
            minHeight: '500px'
          }}
        >
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4 z-10">
              <div className="text-center mb-4">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-700 mt-4 text-lg font-medium">Chart Error</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
              
              {/* Fallback: Show data in table format */}
              {candles.length > 0 && (
                <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Candle Data (Fallback View)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-left">Open</th>
                          <th className="px-3 py-2 text-left">High</th>
                          <th className="px-3 py-2 text-left">Low</th>
                          <th className="px-3 py-2 text-left">Close</th>
                          <th className="px-3 py-2 text-left">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candles.slice(-10).map((candle, index) => {
                          // Defensive validation helper functions
                          const isValidNumber = (value) => Number.isFinite(value) && !isNaN(value);
                          const formatPrice = (value) => {
                            if (!isValidNumber(value)) return 'N/A';
                            return `$${Number(value).toFixed(2)}`;
                          };
                          const formatVolume = (value) => {
                            if (!isValidNumber(value)) return 'N/A';
                            return Number(value).toFixed(0);
                          };
                          const formatTime = (timeValue) => {
                            if (!isValidNumber(timeValue)) return 'N/A';
                            // Detect if time is in seconds (typical for Unix timestamps) or milliseconds
                            const timeInMs = timeValue > 1e10 ? timeValue : timeValue * 1000;
                            try {
                              return new Date(timeInMs).toLocaleString();
                            } catch (error) {
                              return 'Invalid Date';
                            }
                          };

                          return (
                            <tr key={index} className="border-b">
                              <td className="px-3 py-2">{formatTime(candle.time)}</td>
                              <td className="px-3 py-2">{formatPrice(candle.open)}</td>
                              <td className="px-3 py-2">{formatPrice(candle.high)}</td>
                              <td className="px-3 py-2">{formatPrice(candle.low)}</td>
                              <td className="px-3 py-2">{formatPrice(candle.close)}</td>
                              <td className="px-3 py-2">{formatVolume(candle.volume)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  setError(null);
                  setIsInitialized(false);
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry Chart
              </button>
            </div>
          )}
          
          {!isInitialized && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-300 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 mt-4 text-lg font-medium">Loading Candlestick Chart</p>
                <p className="text-gray-500 text-sm mt-1">Initializing lightweight charts...</p>
                <p className="text-gray-400 text-xs mt-2">Candles: {candles.length} | Container: {chartContainerRef.current ? 'Ready' : 'Not Ready'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
