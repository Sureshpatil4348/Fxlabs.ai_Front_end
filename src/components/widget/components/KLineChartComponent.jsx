import { init, registerOverlay } from 'klinecharts';
import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useChartStore } from '../stores/useChartStore';

export const KLineChartComponent = ({
  candles = [],
  settings = {},
  onLoadMoreHistory,
  isLoadingHistory = false,
  hasMoreHistory = true,
  panelSettings: _panelSettings = {}
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(null);
  const [_currentOHLC, setCurrentOHLC] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialBarSpaceRef = useRef(null);
  
  // Get the setter from store
  const { setKLineChartRef } = useChartStore();
  
  // Keep track of previous candle count and scroll position
  const prevCandleCountRef = useRef(0);
  const currentScrollIndexRef = useRef(null);
  const isLoadingRef = useRef(false);
  const scrollDebounceTimerRef = useRef(null);
  const lastLoadRequestTimeRef = useRef(0);
  const isAutoFollowRef = useRef(true);
  const lastManualVisibleRangeRef = useRef(null);
  const lastOffsetRightDistanceRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const prevFirstTimestampRef = useRef(null);
  const prevLastTimestampRef = useRef(null);
  const markProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 0);
  }, []);
  useEffect(() => {
    prevCandleCountRef.current = 0;
    prevFirstTimestampRef.current = null;
    prevLastTimestampRef.current = null;
    isAutoFollowRef.current = true;
    lastManualVisibleRangeRef.current = null;
    lastOffsetRightDistanceRef.current = null;
    currentScrollIndexRef.current = null;
    setIsInitialLoad(true);
  }, [settings.symbol, settings.timeframe]);
  
  // Keep latest candles for event handlers
  const candlesRef = useRef(candles);
  useEffect(() => { candlesRef.current = candles; }, [candles]);

  // Update grid visibility when settings change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setStyles({
        grid: {
          horizontal: { 
            show: settings.showGrid !== false,
            color: '#e5e7eb',
            size: 1
          },
          vertical: { 
            show: settings.showGrid !== false,
            color: '#e5e7eb',
            size: 1
          }
        }
      });
    }
  }, [settings.showGrid]);
  
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
      
      // Initialize chart with timezone awareness
      const tz = settings.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      const chart = init(container, { timezone: tz });

      // Configure chart styles using setStyles (not setStyleOptions)
      chart.setStyles({
        grid: {
          horizontal: { 
            show: settings.showGrid !== false,
            color: '#e5e7eb',
            size: 1
          },
          vertical: { 
            show: settings.showGrid !== false,
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
      // Capture initial bar space for reset/reload behavior
      try {
        if (typeof chart.getBarSpace === 'function') {
          const bs = chart.getBarSpace();
          if (bs && typeof bs.bar === 'number') {
            initialBarSpaceRef.current = bs.bar;
          }
        }
      } catch (_e) {
        // no-op: optional API
      }
      
      // Register chart ref with store for sidebar access
      setKLineChartRef(chart);

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
            setKLineChartRef(null); // Clear from store
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
  }, [settings.showGrid, setKLineChartRef, settings.timezone]); // Include timezone for initial setup

  // Apply timezone changes to the chart dynamically
  useEffect(() => {
    if (!chartRef.current) return;
    try {
      const tz = settings.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      if (typeof chartRef.current.setTimezone === 'function') {
        chartRef.current.setTimezone(tz);
      }
    } catch (e) {
      console.warn('📈 Failed to apply chart timezone:', e);
    }
  }, [settings.timezone]);

  // Handle scroll/zoom events for pagination
  useEffect(() => {
    if (!chartRef.current || !onLoadMoreHistory) return;

    const handleScroll = (_data) => {
      if (!chartRef.current) return;

      const visibleRange = chartRef.current.getVisibleRange();

      if (visibleRange) {
        if (typeof visibleRange.from === 'number') {
          currentScrollIndexRef.current = visibleRange.from;
        }

        if (!isProgrammaticScrollRef.current) {
          lastManualVisibleRangeRef.current = visibleRange;

          if (typeof chartRef.current.getOffsetRightDistance === 'function') {
            lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          }

          const dataList = typeof chartRef.current.getDataList === 'function'
            ? chartRef.current.getDataList()
            : [];
          const totalCandles = Array.isArray(dataList) ? dataList.length : 0;

          if (totalCandles > 0 && typeof visibleRange.to === 'number') {
            const latestIndex = totalCandles - 1;
            const futureDistance = visibleRange.to - latestIndex;
            const nearRightEdge = futureDistance >= -1 && futureDistance <= 0;

            if (futureDistance > 0) {
              isAutoFollowRef.current = false;
            } else {
              isAutoFollowRef.current = nearRightEdge;
            }
          }
        }
      }

      // Check if we're near the left edge and should load more history
      if (visibleRange) {
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
    // Also trigger the same logic on zoom out since visibleRange can expand left
    chartRef.current.subscribeAction('zoom', handleScroll);

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
      
      // Filter and sort candles
      const validCandles = candles.filter(candle => 
        !isNaN(candle.time) && 
        !isNaN(candle.open) && 
        !isNaN(candle.high) && 
        !isNaN(candle.low) && 
        !isNaN(candle.close) &&
        candle.time > 0
      );
      // Sort by time (ascending)
      const sortedCandles = validCandles.sort((a, b) => a.time - b.time);

      // Convert to KLineChart format
      const rawKlineData = sortedCandles.map(candle => {
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

      // Deduplicate by timestamp to prevent duplicate candles (keep the latest occurrence)
      const dedupeMap = new Map();
      for (let i = rawKlineData.length - 1; i >= 0; i--) {
        const d = rawKlineData[i];
        if (!dedupeMap.has(d.timestamp)) {
          dedupeMap.set(d.timestamp, d);
        }
      }
      const klineData = Array.from(dedupeMap.values()).sort((a, b) => a.timestamp - b.timestamp);

      const previousVisibleRange = chartRef.current.getVisibleRange() || lastManualVisibleRangeRef.current;
      const previousOffsetRightDistance = typeof chartRef.current.getOffsetRightDistance === 'function'
        ? chartRef.current.getOffsetRightDistance()
        : lastOffsetRightDistanceRef.current;
      const shouldAutoFollow = isAutoFollowRef.current;

      const firstTimestamp = klineData.length > 0 ? klineData[0].timestamp : null;
      const lastTimestamp = klineData.length > 0 ? klineData[klineData.length - 1].timestamp : null;
      const prevFirstTimestamp = prevFirstTimestampRef.current;

      const dataLengthIncreased = klineData.length > prevCandleCountRef.current;
      const appendedCount = dataLengthIncreased ? klineData.length - prevCandleCountRef.current : 0;
      const hasOlderHistory = dataLengthIncreased &&
        prevFirstTimestamp !== null &&
        firstTimestamp !== null &&
        firstTimestamp < prevFirstTimestamp;
      const isPaginationLoad = hasOlderHistory;
      const handledWithIncrementalUpdate = !isInitialLoad && !isPaginationLoad;

      const restoreManualRange = (range, offsetRight, adjustForHistory = false, historyDelta = 0) => {
        if (!chartRef.current || !range || typeof range.from !== 'number' || typeof range.to !== 'number') {
          return;
        }

        const rangeSize = Math.max(0, range.to - range.from);
        let targetFrom = range.from + (adjustForHistory ? historyDelta : 0);
        const maxFrom = Math.max(0, klineData.length - Math.max(1, rangeSize));
        targetFrom = Math.max(0, Math.min(targetFrom, maxFrom));

        markProgrammaticScroll();
        chartRef.current.scrollToDataIndex(targetFrom);

        if (typeof chartRef.current.setOffsetRightDistance === 'function' && typeof offsetRight === 'number') {
          chartRef.current.setOffsetRightDistance(offsetRight);
        }

        const cappedLength = Math.max(0, klineData.length - 1);
        const targetTo = Math.min(cappedLength, targetFrom + rangeSize);
        lastManualVisibleRangeRef.current = {
          from: targetFrom,
          to: targetTo
        };
        currentScrollIndexRef.current = targetFrom;

        if (typeof chartRef.current.getOffsetRightDistance === 'function') {
          lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
        }

        isAutoFollowRef.current = false;
      };
      const maybeTriggerLeftEdgeBackfill = () => {
        try {
          if (!chartRef.current || !onLoadMoreHistory) return;
          const vr = chartRef.current.getVisibleRange();
          const dl = typeof chartRef.current.getDataList === 'function' ? chartRef.current.getDataList() : [];
          const total = Array.isArray(dl) ? dl.length : 0;
          if (vr && typeof vr.from === 'number' && total > 0) {
            const fromIdx = Math.max(0, Math.floor(vr.from));
            const nearLeft = fromIdx <= 2; // robust threshold
            const now = Date.now();
            const elapsed = now - lastLoadRequestTimeRef.current;
            if (nearLeft && hasMoreHistory && !isLoadingHistory && !isLoadingRef.current && elapsed > 2000) {
              console.log('📊 Left-edge backfill (post-update) triggering load more...', { fromIdx, total });
              isLoadingRef.current = true;
              lastLoadRequestTimeRef.current = now;
              onLoadMoreHistory();
            }
          }
        } catch (_e) {
          // no-op
        }
      };

      if (handledWithIncrementalUpdate) {
        const latestCandles = appendedCount > 0 ? klineData.slice(-appendedCount) : (klineData.length > 0 ? [klineData[klineData.length - 1]] : []);
        latestCandles.forEach((candle) => {
          chartRef.current.updateData(candle);
        });

        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }

        // When a new candle is added (appendedCount > 0), verify user is actually viewing latest candles
        // before auto-scrolling. This prevents unwanted scroll when user has manually scrolled to history.
        if (appendedCount > 0 && shouldAutoFollow) {
          // Check if user's visible range (before update) included the latest candle
          const prevDataLength = prevCandleCountRef.current;
          const wasViewingLatest = previousVisibleRange && 
            typeof previousVisibleRange.to === 'number' &&
            prevDataLength > 0 &&
            previousVisibleRange.to >= prevDataLength - 2; // Within 2 candles of the end
          
          console.log('📊 New candle formed - checking auto-scroll:', {
            appendedCount,
            prevDataLength,
            visibleRangeTo: previousVisibleRange?.to,
            wasViewingLatest,
            willAutoScroll: wasViewingLatest
          });
          
          if (wasViewingLatest) {
            // User was viewing the latest area, safe to auto-scroll
            markProgrammaticScroll();
            chartRef.current.scrollToRealTime();
            isAutoFollowRef.current = true;
            lastManualVisibleRangeRef.current = null;
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
          } else {
            // User was viewing historical data, maintain their position
            console.log('📊 User viewing history - maintaining scroll position');
            const maintainedRange = chartRef.current.getVisibleRange();
            if (maintainedRange) {
              lastManualVisibleRangeRef.current = maintainedRange;
            }
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
            isAutoFollowRef.current = false;
          }
        } else if (!shouldAutoFollow) {
          const maintainedRange = chartRef.current.getVisibleRange();
          if (maintainedRange) {
            lastManualVisibleRangeRef.current = maintainedRange;
          }
          if (typeof chartRef.current.getOffsetRightDistance === 'function') {
            lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          }
        } else if (typeof chartRef.current.getOffsetRightDistance === 'function') {
          lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          lastManualVisibleRangeRef.current = null;
        }

        isLoadingRef.current = false;
        // Fallback: if user is already at far left, trigger backfill
        maybeTriggerLeftEdgeBackfill();
      } else if (isPaginationLoad) {
        const newCandlesCount = appendedCount;
        
        console.log('📊 Pagination load detected:', {
          newCandles: newCandlesCount,
          totalCandles: klineData.length,
          previousTotal: prevCandleCountRef.current
        });

        chartRef.current.applyNewData(klineData);
        
        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }
        
        setTimeout(() => {
          if (!chartRef.current) return;

          if (shouldAutoFollow) {
            markProgrammaticScroll();
            chartRef.current.scrollToRealTime();
            isAutoFollowRef.current = true;
            lastManualVisibleRangeRef.current = null;
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
          } else {
            restoreManualRange(previousVisibleRange, previousOffsetRightDistance, true, newCandlesCount);
          }

          isLoadingRef.current = false;
          // After pagination load, check again in case user remains at left edge
          maybeTriggerLeftEdgeBackfill();
        }, 100);
      } else {
        chartRef.current.applyNewData(klineData);
        
        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }
        
        if (isInitialLoad && klineData.length > 0) {
          setTimeout(() => {
            if (!chartRef.current) return;

            console.log('📊 Initial load - scrolling to current candle (real-time)');
            markProgrammaticScroll();
            chartRef.current.scrollToRealTime();
            setIsInitialLoad(false);
            isAutoFollowRef.current = true;
            lastManualVisibleRangeRef.current = null;
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
          }, 100);
        } else if (!shouldAutoFollow && previousVisibleRange) {
          setTimeout(() => {
            if (!chartRef.current) return;
            restoreManualRange(previousVisibleRange, previousOffsetRightDistance);
          }, 0);
        } else if (shouldAutoFollow) {
          markProgrammaticScroll();
          chartRef.current.scrollToRealTime();
          isAutoFollowRef.current = true;
          lastManualVisibleRangeRef.current = null;
          if (typeof chartRef.current.getOffsetRightDistance === 'function') {
            lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          }
        }

        isLoadingRef.current = false;
        // Initial/full apply path: check left edge too
        maybeTriggerLeftEdgeBackfill();
      }

      // Update previous dataset metadata (after dedupe and chart updates)
      prevCandleCountRef.current = klineData.length;
      prevFirstTimestampRef.current = firstTimestamp;
      prevLastTimestampRef.current = lastTimestamp;
    } catch (error) {
      console.error('📈 Error updating K-line chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to update chart data');
      isLoadingRef.current = false;
    }
  }, [candles, isInitialLoad, isLoadingHistory, markProgrammaticScroll, hasMoreHistory, onLoadMoreHistory]);

  // Handle indicator visibility changes
  useEffect(() => {
    if (!chartRef.current) return;

    try {
      console.log('📈 KLineChart: Indicator settings changed', settings.indicators);

      // Map of indicator names to their KLineCharts API names
      const indicatorMap = {
        rsi: { name: 'RSI', params: {} },
        ema20: { name: 'EMA', params: { periods: 20 } },
        ema200: { name: 'EMA', params: { periods: 200 } },
        macd: { name: 'MACD', params: {} },
        atr: { name: 'ATR', params: {} },
        sma50: { name: 'SMA', params: { periods: 50 } },
        sma100: { name: 'SMA', params: { periods: 100 } },
        bollinger: { name: 'BOLL', params: {} },
        stoch: { name: 'KDJ', params: {} }, // KLineCharts uses KDJ for Stochastic
        williams: { name: 'WR', params: {} }, // Williams %R
        cci: { name: 'CCI', params: {} },
        obv: { name: 'OBV', params: {} },
        vwap: { name: 'VWAP', params: {} },
        change24h: { name: null, params: {} } // Not a KLineCharts indicator
      };

      // Process each indicator
      Object.entries(indicatorMap).forEach(([key, config]) => {
        if (!config.name) return; // Skip if not a KLineCharts indicator

        const isEnabled = settings.indicators?.[key];
        const indicatorName = config.name;

        // Create unique key for indicators with params
        const uniqueKey = key === 'ema20' || key === 'ema200' || key === 'sma50' || key === 'sma100' 
          ? `${indicatorName}${config.params.periods}` 
          : indicatorName;

        if (isEnabled) {
          console.log(`📈 KLineChart: Adding ${key} (${uniqueKey}) indicator`);
          try {
            if (typeof chartRef.current.createIndicator === 'function') {
              // For indicators with parameters
              if (Object.keys(config.params).length > 0) {
                chartRef.current.createIndicator(indicatorName, false, config.params);
              } else {
                chartRef.current.createIndicator(indicatorName, false);
              }
              console.log(`✅ KLineChart: ${key} indicator added`);
            } else {
              console.warn('📈 KLineChart: createIndicator method not available');
            }
          } catch (error) {
            console.warn(`⚠️ KLineChart: Error adding ${key}:`, error?.message);
          }
        } else {
          // Remove indicator
          try {
            if (typeof chartRef.current.removeIndicator === 'function') {
              chartRef.current.removeIndicator(uniqueKey);
              console.log(`📈 KLineChart: ${key} indicator removed`);
            }
          } catch (error) {
            // Silently ignore if indicator doesn't exist
          }
        }
      });
    } catch (error) {
      console.error('📈 KLineChart: Error handling indicator changes:', error);
    }
  }, [settings.indicators]);

  // Chart navigation methods
  const _scrollToLatest = useCallback(() => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollToRealTime();
      isAutoFollowRef.current = true;
      lastManualVisibleRangeRef.current = null;
      if (typeof chartRef.current.getOffsetRightDistance === 'function') {
        lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
      }
    }
  }, [markProgrammaticScroll]);

  const _scrollLeft = useCallback((pixels = 100) => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollByDistance(-pixels);
      isAutoFollowRef.current = false;
    }
  }, [markProgrammaticScroll]);

  const _scrollRight = useCallback((pixels = 100) => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollByDistance(pixels);
      isAutoFollowRef.current = false;
    }
  }, [markProgrammaticScroll]);

  const _scrollToCandle = useCallback((index) => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollToDataIndex(index);
      isAutoFollowRef.current = false;
    }
  }, [markProgrammaticScroll]);

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

  // Overlay control handlers
  const handleZoomIn = useCallback(() => {
    const chart = chartRef.current;
    const el = chartContainerRef.current;
    if (!chart || !el) return;
    const width = el.clientWidth || 0;
    const height = el.clientHeight || 0;
    // Zoom in around center
    chart.zoomAtCoordinate(1.2, { x: width / 2, y: height / 2 }, 120);
  }, []);

  const handleZoomOut = useCallback(() => {
    const chart = chartRef.current;
    const el = chartContainerRef.current;
    if (!chart || !el) return;
    const width = el.clientWidth || 0;
    const height = el.clientHeight || 0;
    // Zoom out around center
    chart.zoomAtCoordinate(0.83, { x: width / 2, y: height / 2 }, 120);
  }, []);

  const handleScrollLeft = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    let step = 160; // px fallback
    try {
      if (typeof chart.getBarSpace === 'function') {
        const bs = chart.getBarSpace();
        if (bs && typeof bs.bar === 'number') step = bs.bar * 18; // ~18 bars
      }
    } catch (_e) { /* ignore */ }
    chart.scrollByDistance(-step, 120);
    isAutoFollowRef.current = false;
  }, []);

  const handleScrollRight = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    let step = 160; // px fallback
    try {
      if (typeof chart.getBarSpace === 'function') {
        const bs = chart.getBarSpace();
        if (bs && typeof bs.bar === 'number') step = bs.bar * 18; // ~18 bars
      }
    } catch (_e) { /* ignore */ }
    chart.scrollByDistance(step, 120);
    isAutoFollowRef.current = false;
  }, []);

  const handleReload = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    try {
      // Reset bar space if available
      if (initialBarSpaceRef.current && typeof chart.setBarSpace === 'function') {
        chart.setBarSpace(initialBarSpaceRef.current);
      }
    } catch (_e) { /* ignore optional API */ }
    // Jump to latest and re-enable auto-follow
    chart.scrollToRealTime(150);
    isAutoFollowRef.current = true;
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
      {/* Chart Container - ZERO GAPS */}
      <div className="flex-1 relative min-h-0 overflow-hidden " style={{ height: '370px', padding: '0', margin: '0' }}>
        <div 
          ref={chartContainerRef} 
          className="absolute inset-0"
          style={{ 
            backgroundColor: '#ffffff',
            minHeight: '370px',
            maxHeight: '370px',
            padding: '0',
            margin: '0',
            width: '100%',
            left: '0',
            right: '0'
          }}
        >
          {!chartRef.current && (
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
          
          {error && chartRef.current && (
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
          
          {!chartRef.current && error && (
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
          
          {/* Overlay Controls - centered above bottom panel */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '32px', zIndex: 50, pointerEvents: 'none' }}>
            <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
              {/* Zoom out card */}
              <button
                type="button"
                aria-label="Zoom out"
                onClick={handleZoomOut}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14"/></svg>
              </button>

              {/* Zoom in card */}
              <button
                type="button"
                aria-label="Zoom in"
                onClick={handleZoomIn}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14"/></svg>
              </button>

              {/* Pan left card */}
              <button
                type="button"
                aria-label="Scroll left"
                onClick={handleScrollRight}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </button>

              {/* Pan right card */}
              <button
                type="button"
                aria-label="Scroll right"
                onClick={handleScrollLeft}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>

              {/* Reload / reset card */}
              <button
                type="button"
                aria-label="Reload chart"
                onClick={handleReload}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.906-2M4 16a8 8 0 0014.906 2"/></svg>
              </button>
            </div>
          </div>
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
