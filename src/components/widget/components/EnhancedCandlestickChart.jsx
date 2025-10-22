import { createChart } from 'lightweight-charts';
import React, { useEffect, useRef, useState, useMemo } from 'react';

import { UniversalDrawingTools } from './UniversalDrawingTools';

export const EnhancedCandlestickChart = ({
  candles,
  settings
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [chartDimensions, setChartDimensions] = useState({
    width: 800,
    height: 600,
    minPrice: 0,
    maxPrice: 0,
    minTime: 0,
    maxTime: 0,
    priceRange: 0,
    timeRange: 0
  });

  // Price series refs
  const candlestickSeriesRef = useRef(null);

  // Calculate chart dimensions from candles data
  const calculatedDimensions = useMemo(() => {
    if (candles.length === 0) return chartDimensions;

    const prices = candles.map(c => [c.high, c.low]).flat();
    const times = candles.map(c => c.time);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      width: chartContainerRef.current?.clientWidth || 800,
      height: chartContainerRef.current?.clientHeight || 600,
      minPrice,
      maxPrice,
      minTime,
      maxTime,
      priceRange: maxPrice - minPrice,
      timeRange: maxTime - minTime
    };
  }, [candles, chartDimensions]);

  // Update chart dimensions when calculated dimensions change
  useEffect(() => {
    setChartDimensions(calculatedDimensions);
  }, [calculatedDimensions]);

  // Initialize chart
  useEffect(() => {
    console.log('🕯️ EnhancedCandlestickChart: Initialization effect triggered', {
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
      // Use actual container dimensions; avoid hardcoded heights
      const containerWidth = chartContainerRef.current.clientWidth || 800;
      const containerHeight = chartContainerRef.current.clientHeight || 500;
      
      console.log('🕯️ Creating enhanced candlestick chart with dimensions:', { containerWidth, containerHeight });

      const chart = createChart(chartContainerRef.current, {
        width: containerWidth,
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
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
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

      console.log('🕯️ Enhanced candlestick chart initialized successfully');
      setIsInitialized(true);

      // Handle resize using ResizeObserver for container-based sizing
      let resizeObserver;
      const handleResize = () => {
        if (!chartContainerRef.current || !chart) return;
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        try {
          chart.applyOptions({ width, height });
          setChartDimensions(prev => ({ ...prev, width, height }));
        } catch (error) {
          console.warn('🕯️ Error resizing chart:', error);
        }
      };
      if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(chartContainerRef.current);
      } else {
        // Fallback: window resize
        window.addEventListener('resize', handleResize);
      }

      return () => {
        if (resizeObserver) {
          try { resizeObserver.disconnect(); } catch (_) {}
        } else {
          window.removeEventListener('resize', handleResize);
        }
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
      console.error('🕯️ Error initializing enhanced candlestick chart:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize chart');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update chart with data
  useEffect(() => {
    console.log('🕯️ EnhancedCandlestickChart: Data update effect triggered', {
      isInitialized,
      candlesCount: candles.length,
      hasCandlestickSeries: !!candlestickSeriesRef.current
    });

    if (candles.length === 0) {
      console.log('🕯️ EnhancedCandlestickChart: Skipping data update - no candles');
      return;
    }

    if (!isInitialized) {
      console.log('🕯️ EnhancedCandlestickChart: Chart not initialized yet, will retry');
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
      
      console.log('🕯️ EnhancedCandlestickChart: Processing candles', {
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
        
        console.log('🕯️ EnhancedCandlestickChart: Setting candlestick data', {
          dataCount: candlestickData.length,
          firstData: candlestickData[0],
          lastData: candlestickData[candlestickData.length - 1]
        });
        
        try {
          candlestickSeriesRef.current.setData(candlestickData);
          console.log('🕯️ EnhancedCandlestickChart: Candlestick data set successfully');
          
          // Fit content
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        } catch (error) {
          console.error('🕯️ Error setting candlestick data:', error);
          setError('Failed to set chart data');
        }
      } else {
        console.warn('🕯️ EnhancedCandlestickChart: No candlestick series reference available');
      }
    } catch (error) {
      console.error('🕯️ Error updating chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to update chart data');
    }
  }, [candles, isInitialized]);

  // Prepare chart data for drawing tools
  const chartDataForDrawing = useMemo(() => {
    return candles.map((candle, index) => ({
      time: index,
      timestamp: candle.time,
      price: candle.close,
      high: candle.high,
      low: candle.low,
      open: candle.open,
      close: candle.close,
      volume: candle.volume
    }));
  }, [candles]);

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">
          Enhanced Candlestick Chart - {settings.symbol}
        </h3>
      </div>

      {/* Chart Container */}
      <div className="flex-1 p-3 overflow-hidden min-h-[300px]">
        <div 
          ref={chartContainerRef} 
          className="w-full h-full relative"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Universal Drawing Tools Overlay */}
          <UniversalDrawingTools
            chartData={chartDataForDrawing}
            chartWidth={chartContainerRef.current?.clientWidth || 800}
            chartHeight={chartContainerRef.current?.clientHeight || 600}
            currentPrice={candles.length > 0 ? candles[candles.length - 1].close : 0}
            chartType="candlestick"
            containerRef={chartContainerRef}
          />

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
              <div className="text-center mb-4">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-700 mt-4 text-lg font-medium">Chart Error</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
              
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
          ) : !isInitialized ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-300 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 mt-4 text-lg font-medium">Loading Enhanced Candlestick Chart</p>
                <p className="text-gray-500 text-sm mt-1">Initializing with drawing tools...</p>
                <p className="text-gray-400 text-xs mt-2">Candles: {candles.length}</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-green-50">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-green-700 text-lg font-medium">Enhanced Chart Ready</p>
                <p className="text-green-600 text-sm mt-1">Candlestick chart with drawing tools</p>
                <p className="text-green-500 text-xs mt-2">Select a drawing tool from the sidebar to start</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
