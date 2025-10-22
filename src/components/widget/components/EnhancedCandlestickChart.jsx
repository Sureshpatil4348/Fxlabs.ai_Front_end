import { createChart } from 'lightweight-charts';
import React, { useEffect, useRef, useState, useMemo } from 'react';

import { UniversalDrawingTools } from './UniversalDrawingTools';

export const EnhancedCandlestickChart = ({
  candles,
  settings,
  onLoadMoreHistory,
  isLoadingHistory = false,
  hasMoreHistory = true
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
  
  // Pagination refs
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  
  // Current OHLC data for display
  const [currentOHLC, setCurrentOHLC] = useState(null);

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
  
  // Update loading ref when loading state changes
  useEffect(() => {
    isLoadingRef.current = isLoadingHistory;
  }, [isLoadingHistory]);
  
  // Update current OHLC data when candles change
  useEffect(() => {
    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      setCurrentOHLC({
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
        volume: latestCandle.volume || 0,
        time: latestCandle.time,
        isBullish: latestCandle.close >= latestCandle.open
      });
    }
  }, [candles]);

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
      const containerWidth = chartContainerRef.current.clientWidth || 800;
      // Use full container height for better chart display
      const containerHeight = chartContainerRef.current.clientHeight || 600;
      
      console.log('🕯️ Creating enhanced candlestick chart with dimensions:', { containerWidth, containerHeight, actualHeight: chartContainerRef.current.clientHeight });

      const chart = createChart(chartContainerRef.current, {
        width: containerWidth,
        height: containerHeight,
        autoSize: false,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333333',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: '#e5e7eb', visible: true },
          horzLines: { color: '#e5e7eb', visible: true },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: '#758696',
            style: 3,
            labelBackgroundColor: '#2962FF',
          },
          horzLine: {
            width: 1,
            color: '#758696',
            style: 3,
            labelBackgroundColor: '#2962FF',
          },
        },
        rightPriceScale: {
          borderColor: '#e5e7eb',
          visible: true,
          scaleMargins: {
            top: 0.02,
            bottom: 0.02,
          },
        },
        timeScale: {
          borderColor: '#e5e7eb',
          timeVisible: true,
          secondsVisible: false,
          visible: true,
          fixLeftEdge: false,
          fixRightEdge: false,
          rightOffset: 3,
          barSpacing: 4,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          vertTouchDrag: true,
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

      // Subscribe to crosshair move to update OHLC on hover
      chart.subscribeCrosshairMove((param) => {
        if (param.time) {
          const data = param.seriesData.get(candlestickSeries);
          if (data) {
            setCurrentOHLC({
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: data.volume || 0,
              time: param.time,
              isBullish: data.close >= data.open
            });
          }
        } else {
          // Reset to latest candle when not hovering
          if (candles.length > 0) {
            const latestCandle = candles[candles.length - 1];
            setCurrentOHLC({
              open: latestCandle.open,
              high: latestCandle.high,
              low: latestCandle.low,
              close: latestCandle.close,
              volume: latestCandle.volume || 0,
              time: latestCandle.time,
              isBullish: latestCandle.close >= latestCandle.open
            });
          }
        }
      });

      // Store references
      chartRef.current = chart;

      console.log('🕯️ Enhanced candlestick chart initialized successfully');
      setIsInitialized(true);

      // Subscribe to visible range changes for pagination
      const timeScale = chart.timeScale();
      timeScale.subscribeVisibleLogicalRangeChange(() => {
        const logicalRange = timeScale.getVisibleLogicalRange();
        
        if (logicalRange !== null) {
          const barsInfo = candlestickSeries.barsInLogicalRange(logicalRange);
          
          // Check if we're at the left edge (viewing oldest data)
          // Load more if we're within 20 bars of the start
          if (barsInfo !== null && logicalRange.from <= 20) {
            const now = Date.now();
            const timeSinceLastLoad = now - lastLoadTimeRef.current;
            
            // Debounce: only load if it's been at least 1 second since last load
            if (
              !isLoadingRef.current && 
              hasMoreHistory && 
              timeSinceLastLoad > 1000 &&
              onLoadMoreHistory
            ) {
              console.log('📊 Reached left edge, loading more history...', {
                logicalFrom: logicalRange.from,
                barsInfo
              });
              
              isLoadingRef.current = true;
              lastLoadTimeRef.current = now;
              
              onLoadMoreHistory().finally(() => {
                isLoadingRef.current = false;
              });
            }
          }
        }
      });

      // Handle resize with debouncing
      let resizeTimeout;
      const handleResize = () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
          if (chartContainerRef.current && chart) {
            const width = chartContainerRef.current.clientWidth;
            const height = chartContainerRef.current.clientHeight;
            
            if (width > 0 && height > 0) {
              try {
                chart.applyOptions({
                  width: width,
                  height: height,
                });
                
                // Fit content after resize
                chart.timeScale().fitContent();
                
                // Update dimensions for drawing tools
                setChartDimensions(prev => ({
                  ...prev,
                  width,
                  height
                }));
                
                console.log('🕯️ Chart resized:', { width, height });
              } catch (error) {
                console.warn('🕯️ Error resizing chart:', error);
              }
            }
          }
        }, 100);
      };

      window.addEventListener('resize', handleResize);
      
      // Initial resize to fit container
      setTimeout(() => handleResize(), 100);

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
    <div className="w-full h-[340px] flex flex-col bg-white rounded-lg shadow-sm ">
      {/* Header - Ultra Compact */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {settings.symbol}
          </h3>
          
          {/* Real-time OHLC Display - Ultra Compact */}
          {currentOHLC && (
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[10px]">O</span>
                <span className={`font-semibold ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.open.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[10px]">H</span>
                <span className={`font-semibold ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.high.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[10px]">L</span>
                <span className={`font-semibold ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.low.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[10px]">C</span>
                <span className={`font-semibold ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.close.toFixed(5)}
                </span>
              </div>
              {currentOHLC.volume > 0 && (
                <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-gray-300">
                  <span className="text-gray-500 font-medium text-[10px]">Vol</span>
                  <span className="font-semibold text-gray-700">
                    {currentOHLC.volume.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-[10px] text-gray-500">
          {candles.length}
        </div>
      </div>

      {/* Chart Container - Maximum Space Utilization */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <div 
          ref={chartContainerRef} 
          className="absolute inset-0"
          style={{ 
            backgroundColor: '#ffffff'
          }}
        >
          {/* Universal Drawing Tools Overlay */}
          {isInitialized && !error && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              <UniversalDrawingTools
                chartData={chartDataForDrawing}
                chartWidth={chartContainerRef.current?.clientWidth || 800}
                chartHeight={chartContainerRef.current?.clientHeight || 600}
                currentPrice={candles.length > 0 ? candles[candles.length - 1].close : 0}
                chartType="candlestick"
                containerRef={chartContainerRef}
              />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4 z-10">
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
          )}
          
          {!isInitialized && !error && (
            <div className="absolute inset-0 flex items-start justify-center pt-16 bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-12 h-12 border-4 border-gray-300 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 mt-3 text-sm font-medium">Loading Chart...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
