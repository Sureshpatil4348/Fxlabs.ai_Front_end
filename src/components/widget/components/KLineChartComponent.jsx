import { init, registerOverlay } from 'klinecharts';
import React, { useEffect, useRef, useState, useCallback } from 'react';

import { KLineDrawingToolbar } from './KLineDrawingToolbar';

export const KLineChartComponent = ({
  candles = [],
  settings = {},
  onLoadMoreHistory,
  isLoadingHistory = false,
  hasMoreHistory = true,
  panelSettings = {}
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(null);
  const [currentOHLC, setCurrentOHLC] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Keep track of previous candle count and scroll position
  const prevCandleCountRef = useRef(0);
  const currentScrollIndexRef = useRef(null);
  const isLoadingRef = useRef(false);
  const scrollDebounceTimerRef = useRef(null);
  const lastLoadRequestTimeRef = useRef(0);
  
  // Keep latest candles for event handlers
  const candlesRef = useRef(candles);
  useEffect(() => { candlesRef.current = candles; }, [candles]);
  
  // Update current OHLC data when candles change
  useEffect(() => {
    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      // Ensure timestamp is in milliseconds
      const timestamp = latestCandle.time < 946684800000 ? latestCandle.time * 1000 : latestCandle.time;
      
      setCurrentOHLC({
        open: Number(latestCandle.open),
        high: Number(latestCandle.high),
        low: Number(latestCandle.low),
        close: Number(latestCandle.close),
        volume: Number(latestCandle.volume) || 0,
        time: timestamp,
        isBullish: latestCandle.close >= latestCandle.open
      });
    }
  }, [candles]);

  // Register drawing tools overlays
  useEffect(() => {
    // Register trend line overlay
    registerOverlay({
      name: 'trendLine',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#2962FF',
                size: 2,
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Trend line drawn:', overlay);
      },
    });

    // Register horizontal line overlay
    registerOverlay({
      name: 'horizontalLine',
      // Single click places a full-width horizontal line
      totalStep: 1,
      createPointFigures: ({ coordinates, bounding }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 1 || !coordinates[0]) return [];
        const y = coordinates[0].y;
        const x1 = 0;
        const x2 = (bounding && typeof bounding.width === 'number') ? bounding.width : 9999;
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [{ x: x1, y }, { x: x2, y }],
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Horizontal line drawn:', overlay);
      },
    });

    // Register rectangle overlay
    registerOverlay({
      name: 'rectangle',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'rect',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#4ECDC4',
                size: 1,
                style: 'solid',
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Rectangle drawn:', overlay);
      },
    });

    // Register text overlay
    registerOverlay({
      name: 'text',
      totalStep: 1,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 1) return [];
        return [
          {
            type: 'text',
            attrs: {
              coordinates: [coordinates[0]],
              styles: {
                color: '#333333',
                size: 12,
              },
              text: 'Text Annotation',
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Text annotation drawn:', overlay);
      },
    });

    // Register arrow overlay
    registerOverlay({
      name: 'arrow',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#FFA726',
                size: 3,
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Arrow drawn:', overlay);
      },
    });

    // Register Fibonacci overlay
    registerOverlay({
      name: 'fibonacci',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#9C27B0',
                size: 2,
                style: 'dash',
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Fibonacci drawn:', overlay);
      },
    });
  }, []);

  // Initialize K-line chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || chartRef.current) return;

    try {
      setError(null);
      
      const chart = init(container);

      // Configure chart styles using setStyles (not setStyleOptions)
      chart.setStyles({
        grid: {
          horizontal: { 
            show: true,
            color: '#e5e7eb',
            size: 1
          },
          vertical: { 
            show: true,
            color: '#e5e7eb',
            size: 1
          }
        },
        crosshair: {
          show: true,
          horizontal: {
            show: true,
            line: {
              show: true,
              style: 'dash',
              dashValue: [4, 2],
              color: '#758696',
              size: 1,
            },
            text: {
              show: true,
              color: '#ffffff',
              size: 12,
              borderColor: '#2962FF',
              borderSize: 1,
            },
          },
          vertical: {
            show: true,
            line: {
              show: true,
              style: 'dash',
              dashValue: [4, 2],
              color: '#758696',
              size: 1,
            },
            text: {
              show: true,
              color: '#ffffff',
              size: 12,
              borderColor: '#2962FF',
              borderSize: 1,
            },
          },
        },
        // Remove left/right gaps completely
        padding: {
          left: 0,
          right: 0,
          top: 5,
          bottom: 5
        },
        // Force chart to use full width - remove internal margins
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }
        },
        // Force full width usage
        width: '100%',
        height: '100%',
        // Remove axis gaps
        yAxis: {
          type: 'normal',
          position: 'right',
          inside: false,
          reverse: false,
          // Enable auto-scaling
          minSpan: 0.01, // Minimum span to prevent too tight scaling
          maxSpan: Infinity,
          axisLine: {
            show: true,
            color: '#e5e7eb',
            size: 1
          },
          tickLine: {
            show: true,
            length: 3,
            color: '#e5e7eb',
            size: 1
          },
          tickText: {
            show: true,
            color: '#6b7280',
            size: 11,
            family: 'Arial',
            weight: 'normal'
          }
        },
        axis: {
          right: {
            show: true,
            position: 'right',
            margin: 0,
            padding: 0
          },
          left: {
            show: false
          }
        },
        // Force candlesticks to use full width
        candle: {
          type: 'candle_solid',
          upColor: '#10b981',
          downColor: '#ef4444',
          noChangeColor: '#888888',
          margin: {
            left: 0,
            right: 0
          },
          // Force candlesticks to extend to edges
          extend: {
            left: 0,
            right: 0
          },
          priceMark: {
            show: true,
            high: {
              show: true,
              color: '#10b981',
              textColor: '#ffffff'
            },
            low: {
              show: true,
              color: '#ef4444',
              textColor: '#ffffff'
            },
            last: {
              show: true,
              upColor: '#10b981',
              downColor: '#ef4444',
              noChangeColor: '#888888',
              text: {
                show: true,
                color: '#ffffff'
              }
            }
          }
        },
        // Force data area to use full width
        data: {
          margin: {
            left: 0,
            right: 0
          }
        }
      });

      chartRef.current = chart;

      // Set up event listeners
      chart.subscribeAction('crosshair', (data) => {
        if (data && data.kLineData) {
          const candle = data.kLineData;
          setCurrentOHLC({
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
            volume: Number(candle.volume) || 0,
            time: candle.timestamp, // KLineChart uses 'timestamp' property
            isBullish: candle.close >= candle.open
          });
        }
      });

      // Drawing tool handler: start interactive overlay creation
      const handleDrawingToolChange = (toolType) => {
        try {
          if (!toolType) return; // deactivated
          if (typeof chart.createOverlay === 'function') {
            // Prefer built-in, battle-tested overlays where available
            const overlayMap = {
              trendLine: 'segment', // 2-point segment
              fibonacci: 'fibonacciLine',
              // Keep our custom horizontalLine because it is tuned for full-width
              // Optionally: horizontalLine: 'horizontalStraightLine',
            };
            const name = overlayMap[toolType] || toolType;
            try {
              // Preferred signature (v10+)
              chart.createOverlay({ name });
            } catch (_e) {
              // Fallback
              chart.createOverlay(name);
            }
            console.log('📈 Overlay creation started for tool:', name);
          }
        } catch (err) {
          console.warn('📈 Error activating drawing tool:', err);
        }
      };

      // Store the handler for external use
      chart._handleDrawingToolChange = handleDrawingToolChange;

      // Configure chart options for better auto-scaling
      chart.setOptions({
        // Auto-scale to visible data range
        yAxis: {
          autoMinMax: true, // Automatically adjust min/max based on visible data
        }
      });

          // Handle resize - FORCE FULL WIDTH
          const handleResize = () => {
            if (container && chart) {
              const width = container.clientWidth;
              const height = container.clientHeight;
              
              if (width > 0 && height > 0) {
                // Force chart to use full container width
                chart.resize(width, height);
                // Force chart to fill entire container
                chart.setStyles({
                  width: '100%',
                  height: '100%'
                });
              }
            }
          };

      window.addEventListener('resize', handleResize);
      
      // Initial resize
      setTimeout(() => handleResize(), 100);

      console.log('📈 K-line chart initialized successfully');

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          try {
            // KLineChart v10+ auto-cleanup - just nullify the reference
            // No need to call remove() as it doesn't exist in v10+
            chartRef.current = null;
          } catch (error) {
            console.warn('📈 Error cleaning up K-line chart:', error);
          }
        }
        // No need to set isInitialized to false
      };
    } catch (error) {
      console.error('📈 Error initializing K-line chart:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize K-line chart');
    }
  }, []); // Empty dependency array - initialize only once

  // Handle scroll events for pagination
  useEffect(() => {
    if (!chartRef.current) return;

    const handleScroll = (data) => {
      // Check if we're near the left edge and should load more history
      if (data && typeof data.from === 'number') {
        const visibleRange = chartRef.current.getVisibleRange();
        
        // Save current scroll position before loading more data
        if (visibleRange && visibleRange.from !== undefined) {
          currentScrollIndexRef.current = visibleRange.from;
        }
        
        // Clear any existing debounce timer
        if (scrollDebounceTimerRef.current) {
          clearTimeout(scrollDebounceTimerRef.current);
        }
        
        // Debounce the load request - only trigger after user stops scrolling for 300ms
        scrollDebounceTimerRef.current = setTimeout(() => {
          const currentTime = Date.now();
          const timeSinceLastLoad = currentTime - lastLoadRequestTimeRef.current;
          
          // Trigger load more when we're within 20 candles of the start
          // and we're not already loading
          // and at least 2 seconds have passed since last load request
          if (visibleRange && visibleRange.from <= 20 && 
              hasMoreHistory && 
              !isLoadingHistory && 
              !isLoadingRef.current &&
              timeSinceLastLoad > 2000 &&
              onLoadMoreHistory) {
            console.log('📊 Near left edge, loading more history...', {
              from: visibleRange.from,
              to: visibleRange.to,
              currentCandles: candlesRef.current.length,
              timeSinceLastLoad
            });
            
            isLoadingRef.current = true;
            lastLoadRequestTimeRef.current = currentTime;
            onLoadMoreHistory();
          }
        }, 300);
      }
    };

    chartRef.current.subscribeAction('scroll', handleScroll);

    return () => {
      // Clear debounce timer on cleanup
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
      }
    };
  }, [hasMoreHistory, isLoadingHistory, onLoadMoreHistory]);

  // Update chart with data
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    try {
      setError(null);
      
      console.log('📈 KLineChart received candles:', {
        count: candles.length,
        prevCount: prevCandleCountRef.current,
        firstCandle: candles[0],
        lastCandle: candles[candles.length - 1],
        isInitialLoad: isInitialLoad,
        isLoadingHistory: isLoadingHistory
      });
      
      // Filter and sort candles
      const validCandles = candles.filter(candle => 
        !isNaN(candle.time) && 
        !isNaN(candle.open) && 
        !isNaN(candle.high) && 
        !isNaN(candle.low) && 
        !isNaN(candle.close) &&
        candle.time > 0
      );
      
      const sortedCandles = validCandles.sort((a, b) => a.time - b.time);
      
      // Convert to KLineChart format
      const klineData = sortedCandles.map(candle => {
        // Ensure timestamp is in milliseconds (KLineChart requirement)
        // If timestamp is less than year 2000 in milliseconds (946684800000), it's likely in seconds
        const timestamp = candle.time < 946684800000 ? candle.time * 1000 : candle.time;
        
        return {
          timestamp: timestamp,
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
          volume: Number(candle.volume) || 0,
        };
      });

      // Determine if this is a pagination load (more history added)
      const isPaginationLoad = !isInitialLoad && 
                               klineData.length > prevCandleCountRef.current &&
                               prevCandleCountRef.current > 0;
      
      if (isPaginationLoad) {
        // Calculate how many new candles were added
        const newCandlesCount = klineData.length - prevCandleCountRef.current;
        
        console.log('📊 Pagination load detected:', {
          newCandles: newCandlesCount,
          totalCandles: klineData.length,
          previousTotal: prevCandleCountRef.current
        });
        
        // Get current visible range before updating data
        const visibleRange = chartRef.current.getVisibleRange();
        const wasAtIndex = visibleRange ? visibleRange.from : 0;
        const wasViewingRealTime = visibleRange ? (visibleRange.to >= prevCandleCountRef.current - 1) : false;
        
        console.log('📊 Before pagination update:', {
          wasAtIndex,
          wasViewingRealTime,
          visibleRange
        });
        
        // Apply new data (this will prepend historical candles)
        chartRef.current.applyNewData(klineData);
        
        // Force chart to recalculate y-axis based on visible data
        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }
        
        // Restore scroll position by adjusting for the new candles added
        // The user was viewing candle at index X, now that same candle is at index X + newCandlesCount
        setTimeout(() => {
          if (chartRef.current) {
            if (wasViewingRealTime) {
              // If user was viewing real-time, keep them at the latest
              console.log('📊 Keeping user at real-time view');
              chartRef.current.scrollToRealTime();
            } else {
              // Adjust the scroll position to maintain the same view
              const newIndex = wasAtIndex + newCandlesCount;
              console.log('📊 Restoring scroll position:', {
                wasAtIndex,
                newCandlesCount,
                newIndex,
                totalCandles: klineData.length
              });
              chartRef.current.scrollToDataIndex(newIndex);
            }
            isLoadingRef.current = false;
          }
        }, 100);
      } else {
        // Initial load or real-time update
        chartRef.current.applyNewData(klineData);
        
        // Force chart to recalculate y-axis based on visible data
        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }
        
        // On initial load, scroll to show recent data
        if (isInitialLoad && klineData.length > 0) {
          setTimeout(() => {
            if (chartRef.current) {
              // Show the most recent ~100 candles or all if less
              const targetIndex = Math.max(0, klineData.length - 100);
              console.log('📊 Initial load - scrolling to index:', targetIndex, 'of', klineData.length);
              chartRef.current.scrollToDataIndex(targetIndex);
              setIsInitialLoad(false);
            }
          }, 100);
        }
      }
      
      // Update previous count
      prevCandleCountRef.current = klineData.length;

      console.log('📈 K-line chart data updated:', {
        originalCount: candles.length,
        validCount: validCandles.length,
        appliedCount: klineData.length,
        isPagination: isPaginationLoad
      });
    } catch (error) {
      console.error('📈 Error updating K-line chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to update chart data');
      isLoadingRef.current = false;
    }
  }, [candles, isInitialLoad, isLoadingHistory]);

  // Chart navigation methods
  const scrollToLatest = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.scrollToRealTime();
    }
  }, []);

  const scrollLeft = useCallback((pixels = 100) => {
    if (chartRef.current) {
      chartRef.current.scrollByDistance(-pixels);
    }
  }, []);

  const scrollRight = useCallback((pixels = 100) => {
    if (chartRef.current) {
      chartRef.current.scrollByDistance(pixels);
    }
  }, []);

  const _scrollToCandle = useCallback((index) => {
    if (chartRef.current) {
      chartRef.current.scrollToDataIndex(index);
    }
  }, []);

  const _getVisibleRange = useCallback(() => {
    if (chartRef.current) {
      return chartRef.current.getVisibleRange();
    }
    return null;
  }, []);

  // Drawing tools methods - Using correct KLineChart API
  const _setDrawingTool = useCallback((toolType) => {
    if (chartRef.current && chartRef.current._handleDrawingToolChange) {
      try {
        // Use the chart's built-in drawing tool handler
        chartRef.current._handleDrawingToolChange(toolType);
        console.log('📈 Drawing tool selected:', toolType);
      } catch (error) {
        console.warn('📈 Error setting drawing tool:', error);
      }
    }
  }, []);

  const _clearDrawings = useCallback(() => {
    if (chartRef.current) {
      try {
        // Clear all overlays using the correct API
        const overlays = chartRef.current.getAllOverlays();
        overlays.forEach(overlay => {
          chartRef.current.removeOverlay(overlay.id);
        });
        console.log('📈 All drawings cleared');
      } catch (error) {
        console.warn('📈 Error clearing drawings:', error);
      }
    }
  }, []);

  const _exportDrawings = useCallback(() => {
    if (chartRef.current) {
      try {
        const drawings = chartRef.current.getAllOverlays();
        console.log('📈 Drawings exported:', drawings);
        return drawings;
      } catch (error) {
        console.warn('📈 Error exporting drawings:', error);
        return [];
      }
    }
    return [];
  }, []);

  const _importDrawings = useCallback((drawings) => {
    if (chartRef.current && Array.isArray(drawings)) {
      try {
        drawings.forEach(drawing => {
          chartRef.current.createOverlay(drawing.name, drawing.points);
        });
        console.log('📈 Drawings imported:', drawings.length);
      } catch (error) {
        console.warn('📈 Error importing drawings:', error);
      }
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm  " >
      {/* Header - Ultra Compact */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 py-1 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {settings.symbol || panelSettings.symbol}
          </h3>
          
          {/* Real-time OHLC Display - Ultra Compact */}
          {currentOHLC && (
            <div className="flex items-center gap-1 text-xs">
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[9px]">O</span>
                <span className={`font-semibold text-[10px] ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.open.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[9px]">H</span>
                <span className={`font-semibold text-[10px] ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.high.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[9px]">L</span>
                <span className={`font-semibold text-[10px] ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.low.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500 font-medium text-[9px]">C</span>
                <span className={`font-semibold text-[10px] ${currentOHLC.isBullish ? 'text-green-600' : 'text-red-600'}`}>
                  {currentOHLC.close.toFixed(4)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={scrollLeft}
              className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded text-xs"
              title="Scroll Left"
            >
              ←
            </button>
            <button
              onClick={scrollRight}
              className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded text-xs"
              title="Scroll Right"
            >
              →
            </button>
            <button
              onClick={scrollToLatest}
              className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded text-xs"
              title="Go to Latest"
            >
              ⏭️
            </button>
          </div>
          
          <div className="text-[9px] text-gray-500 ml-1">
            {candles.length}
          </div>
        </div>
      </div>

      {/* Drawing Tools Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
        <KLineDrawingToolbar chartRef={chartRef} />
      </div>


      {/* Chart Container - ZERO GAPS */}
      <div className="flex-1 relative min-h-0 overflow-hidden " style={{ height: '150px', padding: '0', margin: '0' }}>
        <div 
          ref={chartContainerRef} 
          className="absolute inset-0"
          style={{ 
            backgroundColor: '#ffffff',
            minHeight: '320px',
            maxHeight: '320px',
            padding: '0',
            margin: '0',
            width: '100%',
            left: '0',
            right: '0'
          }}
        >
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
                  // Reset chart by clearing the ref
                  chartRef.current = null;
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry Chart
              </button>
            </div>
          )}
          
          {!chartRef.current && !error && (
            <div className="absolute inset-0 flex items-start justify-center pt-16 bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-12 h-12 border-4 border-gray-300 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 mt-3 text-sm font-medium">Loading K-line Chart...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export navigation and drawing tools methods for external use
export const useKLineChartControls = (chartRef) => {
  const scrollToLatest = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.scrollToRealTime();
    }
  }, [chartRef]);

  const scrollLeft = useCallback((pixels = 100) => {
    if (chartRef.current) {
      chartRef.current.scrollByDistance(-pixels);
    }
  }, [chartRef]);

  const scrollRight = useCallback((pixels = 100) => {
    if (chartRef.current) {
      chartRef.current.scrollByDistance(pixels);
    }
  }, [chartRef]);

  const scrollToCandle = useCallback((index) => {
    if (chartRef.current) {
      chartRef.current.scrollToDataIndex(index);
    }
  }, [chartRef]);

  const getVisibleRange = useCallback(() => {
    if (chartRef.current) {
      return chartRef.current.getVisibleRange();
    }
    return null;
  }, [chartRef]);

  const setDrawingTool = useCallback((_toolType) => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
  }, []);

  const clearDrawings = useCallback(() => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
  }, []);

  const exportDrawings = useCallback(() => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
    return [];
  }, []);

  const importDrawings = useCallback((_drawings) => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
  }, []);

  return {
    // Navigation methods
    scrollToLatest,
    scrollLeft,
    scrollRight,
    scrollToCandle,
    getVisibleRange,
    // Drawing tools (placeholder)
    setDrawingTool,
    clearDrawings,
    exportDrawings,
    importDrawings
  };
};
