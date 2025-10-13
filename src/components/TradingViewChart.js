import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { TrendingUp, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import useMarketStore from '../store/useMarketStore';
import { formatSymbolDisplay } from '../utils/formatters';


const TradingViewChart = ({ symbol }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const { getLatestTickForSymbol, subscriptions, tickData } = useMarketStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartOptions, setChartOptions] = useState({
    showVolume: true,
    chartType: 'candlestick' // 'candlestick' or 'line'
  });
  const [latestTick, setLatestTick] = useState(null);


  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart before creating new one
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }



    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#19235d',
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#9B7DFF',
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: '#9B7DFF',
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor: '#19235d',
        scaleMargins: {
          top: 0.1,
          bottom: chartOptions.showVolume ? 0.3 : 0.1,
        },
      },
      timeScale: {
        borderColor: '#19235d',
        timeVisible: true,
        secondsVisible: true,
      },
      watermark: {
        visible: true,
        fontSize: 24,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(171, 71, 188, 0.1)',
        text: (symbol ? formatSymbolDisplay(symbol.replace(/m$/,'')) : 'TradingView'),
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
      },
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Create volume series if enabled
    if (chartOptions.showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          console.warn('Error removing chart:', error);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // Update chart data reactively when tick data changes
  useEffect(() => {
    if (!symbol || !candlestickSeriesRef.current) return;

    // Safety check: ensure chart and series are still valid
    if (!chartRef.current || !candlestickSeriesRef.current) return;
    
    const latestTick = getLatestTickForSymbol(symbol);
    
    if (!latestTick) return;

    // Create a simple line chart using tick data
    const lineData = {
      time: Math.floor(new Date(latestTick.time).getTime() / 1000),
      value: parseFloat(latestTick.bid),
    };

    // Update the series with new data
    try {
      candlestickSeriesRef.current.update(lineData);
    } catch (error) {
      console.warn('Error updating tick data:', error);
      return;
    }

    // Don't auto-fit content to preserve user zoom level
    // Users can manually zoom and pan as needed
  }, [symbol, tickData, getLatestTickForSymbol]);

  // Update tick data reactively when new ticks arrive
  useEffect(() => {
    if (!symbol) return;

    const tick = getLatestTickForSymbol(symbol);
    setLatestTick(tick);
  }, [symbol, tickData, getLatestTickForSymbol]);

  const subscription = subscriptions.get(symbol);
  const timeframe = subscription?.timeframe || 'Unknown';

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle fullscreen resize
  useEffect(() => {
    const resizeChart = () => {
      if (chartRef.current && chartContainerRef.current) {
        // Small delay to ensure DOM has updated
        setTimeout(() => {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }, 100);
      }
    };

    resizeChart();
  }, [isFullscreen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Exit fullscreen with Escape
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        return;
      }

      // Zoom controls (only when chart is focused or in fullscreen)
      if (isFullscreen || document.activeElement === chartContainerRef.current) {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          zoomIn();
        } else if (event.key === '-') {
          event.preventDefault();
          zoomOut();
        } else if (event.key === '0') {
          event.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

  // Zoom control functions
  const zoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const center = (visibleRange.from + visibleRange.to) / 2;
        const range = (visibleRange.to - visibleRange.from) * 0.7; // Zoom in by 30%
        timeScale.setVisibleRange({
          from: center - range / 2,
          to: center + range / 2
        });
      }
    }
  };

  const zoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const center = (visibleRange.from + visibleRange.to) / 2;
        const range = (visibleRange.to - visibleRange.from) * 1.4; // Zoom out by 40%
        timeScale.setVisibleRange({
          from: center - range / 2,
          to: center + range / 2
        });
      }
    }
  };

  const resetZoom = () => {
    if (chartRef.current) {
      try {
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        console.warn('Error resetting zoom:', error);
      }
    }
  };

  const toggleVolume = () => {
    const newShowVolume = !chartOptions.showVolume;
    
    if (chartRef.current) {
      if (newShowVolume && !volumeSeriesRef.current) {
        // Add volume series
        const volumeSeries = chartRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
          scaleMargins: {
            top: 0.7,
            bottom: 0,
          },
        });

        chartRef.current.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.7,
            bottom: 0,
          },
        });

        volumeSeriesRef.current = volumeSeries;
        
        // Populate the volume series with current data
        // Note: Volume data is not available from tick data, so we'll skip volume series
        // const latestTick = getLatestTickForSymbol(symbol);
        // if (latestTick) {
        //   // Volume data is not available from tick data
        //   console.log('Volume data not available from tick data');
        // }
      } else if (!newShowVolume && volumeSeriesRef.current) {
        // Remove volume series
        try {
          chartRef.current.removeSeries(volumeSeriesRef.current);
          volumeSeriesRef.current = null;
        } catch (error) {
          console.warn('Error removing volume series:', error);
        }
      }
    }
    
    setChartOptions(prev => ({
      ...prev,
      showVolume: newShowVolume
    }));
  };

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Select a symbol to view chart</p>
          <p className="text-gray-400 text-sm mt-2">Professional TradingView candlestick charts</p>
        </div>
      </div>
    );
  }

  const chartHeight = isFullscreen ? 'calc(80vh - 120px)' : '500px';

  return (
    <>
      {/* Backdrop overlay for fullscreen */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setIsFullscreen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFullscreen(false); } }}
          role="button"
          tabIndex={0}
          aria-label="Close fullscreen"
          title="Click to close fullscreen"
        />
      )}
      
      <div className={`${isFullscreen ? 'fixed top-[5%] left-[10%] right-[10%] bottom-[5%] z-50 bg-white rounded-lg shadow-2xl flex flex-col max-w-6xl max-h-[90vh] mx-auto animate-in zoom-in-95 fade-in duration-300' : ''}`}>
      <div className="space-y-4">
        {/* Chart Header */}
        <div className={`${isFullscreen ? 'flex flex-row items-center justify-between' : 'flex flex-col space-y-4 sm:flex-row sm:space-y-0 lg:flex-row lg:items-center justify-between'} bg-white p-4 border-b border-gray-200 rounded-t-lg gap-4`}>
          
          {/* Mobile: 3-line layout, Desktop: side-by-side */}
          <div className={`${isFullscreen ? 'flex flex-row items-center space-x-6' : 'flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-6 lg:flex-row lg:items-center w-full sm:w-auto'}`}>
            
            {/* Line 1: Symbol and Timeframe */}
            <div className={`${isFullscreen ? '' : 'w-full sm:w-auto'}`}>
              <h3 className={`${isFullscreen ? 'text-2xl' : 'text-xl'} font-bold text-[#19235d] flex items-center ${isFullscreen ? '' : 'justify-center sm:justify-start'}`}>
                {formatSymbolDisplay(symbol.replace(/m$/,''))}
                <span className="mx-2">{" "}</span>
                <TrendingUp className={`${isFullscreen ? 'w-6 h-6' : 'w-5 h-5'} text-blue-600`} />
              </h3>
              <p className={`text-sm text-gray-500 ${isFullscreen ? '' : 'text-center sm:text-left'}`}>
                Timeframe: <span className="font-medium">{timeframe}</span>
              </p>
            </div>
            
            {/* Line 2: Live Tick Data */}
            {latestTick && (
              <div className={`flex items-center justify-center space-x-2 sm:space-x-4 bg-gray-50 rounded-lg px-3 sm:px-4 py-2 border-l-4 border-green-400 relative overflow-x-auto ${isFullscreen ? 'ml-4' : 'w-full sm:w-auto'}`}>
                {/* Live indicator */}
                <div className="absolute -top-1 -right-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-center min-w-0 flex-shrink-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Bid</div>
                  <div className="text-sm font-mono font-semibold text-red-600">
                    {parseFloat(latestTick.bid).toFixed(5)}
                  </div>
                </div>
                <div className="text-center min-w-0 flex-shrink-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Ask</div>
                  <div className="text-sm font-mono font-semibold text-green-600">
                    {parseFloat(latestTick.ask).toFixed(5)}
                  </div>
                </div>
                <div className="text-center min-w-0 flex-shrink-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Spread</div>
                  <div className="text-sm font-mono font-semibold text-[#19235d]">
                    {(parseFloat(latestTick.ask) - parseFloat(latestTick.bid)).toFixed(5)}
                  </div>
                </div>
                {latestTick.volume && (
                  <div className="text-center min-w-0 flex-shrink-0">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Volume</div>
                    <div className="text-sm font-mono font-semibold text-blue-600">
                      {parseFloat(latestTick.volume).toLocaleString()}
                    </div>
                  </div>
                )}
                <div className="text-center min-w-0 flex-shrink-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
                  <div className="text-xs font-mono text-[#19235d]">
                    {new Date(latestTick.time).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Line 3: Chart Controls */}
          <div className={`flex items-center justify-center space-x-2 ${isFullscreen ? 'flex-shrink-0' : 'w-full sm:w-auto sm:justify-end'}`}>
            {/* Zoom Controls */}
            <div className={`flex items-center space-x-1 bg-gray-100 rounded-md ${isFullscreen ? 'p-2' : 'p-1.5'}`} title="Zoom Controls: +/- keys or mouse wheel">
              <button
                onClick={zoomIn}
                className={`${isFullscreen ? 'p-2' : 'p-1.5'} rounded text-[#19235d] hover:bg-gray-200 transition-colors touch-manipulation`}
                title="Zoom In (+)"
              >
                <ZoomIn className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </button>
              <button
                onClick={zoomOut}
                className={`${isFullscreen ? 'p-2' : 'p-1.5'} rounded text-[#19235d] hover:bg-gray-200 transition-colors touch-manipulation`}
                title="Zoom Out (-)"
              >
                <ZoomOut className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </button>
              <button
                onClick={resetZoom}
                className={`${isFullscreen ? 'p-2' : 'p-1.5'} rounded text-[#19235d] hover:bg-gray-200 transition-colors touch-manipulation`}
                title="Reset Zoom (0)"
              >
                <RotateCcw className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </button>
            </div>

            <button
              onClick={toggleVolume}
              className={`${isFullscreen ? 'px-4 py-3' : 'px-3 py-2.5'} rounded-md text-sm font-medium transition-colors touch-manipulation ${
                chartOptions.showVolume
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-[#19235d] hover:bg-gray-200'
              }`}
              title="Toggle Volume"
            >
              Volume
            </button>
            
            <button
              onClick={toggleFullscreen}
              className={`${isFullscreen ? 'p-3' : 'p-2.5'} rounded-md bg-gray-100 text-[#19235d] hover:bg-gray-200 transition-colors touch-manipulation`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
              ) : (
                <Maximize2 className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
              )}
            </button>

            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-2.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors touch-manipulation"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Chart Container */}
        <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${isFullscreen ? 'flex-1' : ''}`}>
          <div
            ref={chartContainerRef}
            style={{ height: chartHeight }}
            className="w-full"
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default TradingViewChart;
