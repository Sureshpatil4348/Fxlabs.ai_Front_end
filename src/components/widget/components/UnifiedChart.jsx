import React, { useEffect, useState, useMemo, useRef } from "react";
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
} from "recharts";

import { EnhancedCandlestickChart } from "./EnhancedCandlestickChart";
import { UniversalDrawingTools } from "./UniversalDrawingTools";
import useMarketCacheStore from "../../../store/useMarketCacheStore";
import { realMarketService } from "../services/realMarketService";
import { useChartStore } from "../stores/useChartStore";
import { useSplitChartStore } from "../stores/useSplitChartStore";
import { calculateAllIndicators } from "../utils/indicators";

export const UnifiedChart = ({ isFullscreen = false, chartIndex = 1 }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [lineChartKey, setLineChartKey] = useState(0); // Key to force re-render
    const isMainChart = chartIndex === 1;

    // Throttle state for real-time tick updates (avoid per-tick re-renders)
    const tickThrottleLastEmitRef = useRef(0);
    const tickThrottleTimerRef = useRef(null);
    const tickThrottlePendingRef = useRef(null);
    const TICK_UPDATE_THROTTLE_MS = useMemo(() => {
        const val = parseInt(
            process.env.REACT_APP_TRADING_CHART_TICK_THROTTLE_MS || "0",
            10
        );
        return Number.isFinite(val) && val >= 0 ? val : 0;
    }, []);

    // Use different stores based on chart index
    const mainChartStore = useChartStore();
    const splitChartStore = useSplitChartStore();
    
    const store = isMainChart ? mainChartStore : splitChartStore;
    const settings = mainChartStore.settings; // Settings always come from main store
    
    const {
        candles,
        indicators,
        isLoading,
        error,
        currentPage,
        hasMoreHistory,
        isLoadingHistory,
        setCandles,
        addCandle: _addCandle,
        updateLastCandle: _updateLastCandle,
        setIndicators,
        setLoading,
        setConnected,
        setError,
        setCurrentPage,
        setHasMoreHistory,
        setLoadingHistory,
        prependCandles,
        resetPagination,
    } = store;

    // Get current settings based on chart index (with fallbacks matching main chart)
    const currentSymbol = isMainChart 
        ? settings.symbol 
        : (settings.splitChart?.symbol || settings.symbol);
    const currentTimeframe = isMainChart 
        ? settings.timeframe 
        : (settings.splitChart?.timeframe || settings.timeframe);
    const currentIndicators = isMainChart 
        ? settings.indicators 
        : (settings.splitChart?.indicators || settings.indicators);

    // Determine how many initial bars to load.
    // Business rule: always fetch 150 candles via REST `limit` param.
    const getInitialBarsForTimeframe = useMemo(() => (_tf) => 150, []);

    const { pricingBySymbol } = useMarketCacheStore();
    // Cursors for OHLC keyset pagination
    const olderCursorRef = useRef(null); // use next_before from last response to page older
    // Background preload session + guard
    const backgroundPreloadStartedRef = useRef(false);
    const preloadSessionRef = useRef(0);

    // Apply cursor style based on settings
    useEffect(() => {
        const chartContainer = document.querySelector(
            ".unified-chart-container"
        );
        if (chartContainer) {
            chartContainer.style.cursor = settings.cursorType || "crosshair";
        }
    }, [settings.cursorType]);

    // Reset background preload session on symbol/timeframe change
    useEffect(() => {
        preloadSessionRef.current += 1;
        backgroundPreloadStartedRef.current = false;
    }, [currentSymbol, currentTimeframe]);

    // Create lookup maps for better performance
    const indicatorMaps = useMemo(() => {
        const createMap = (data, key = "time", valueKey) => {
            const map = new Map();
            data.forEach((item) => {
                const keyValue = item[key];
                const value = valueKey ? item[valueKey] : item;
                map.set(keyValue, value);
            });
            return map;
        };

        // Safe helper function to handle undefined indicators
        const safe = (value) => value || [];

        return {
            ema20: createMap(safe(indicators.ema20), "time", "value"),
            ema200: createMap(safe(indicators.ema200), "time", "value"),
            rsi: createMap(safe(indicators.rsi), "time", "value"),
            macd: createMap(safe(indicators.macd), "time"),
            atr: createMap(safe(indicators.atr), "time", "atr"),
            sma50: createMap(safe(indicators.sma50), "time", "value"),
            sma100: createMap(safe(indicators.sma100), "time", "value"),
            bollinger: createMap(safe(indicators.bollinger), "time"),
            stoch: createMap(safe(indicators.stoch), "time"),
            williams: createMap(safe(indicators.williams), "time", "value"),
            cci: createMap(safe(indicators.cci), "time", "value"),
            obv: createMap(safe(indicators.obv), "time", "value"),
            vwap: createMap(safe(indicators.vwap), "time", "value"),
            change24h: createMap(safe(indicators.change24h), "time"),
        };
    }, [indicators]);

    // Get candles for display based on chart type
    const displayCandles = useMemo(() => {
        if (settings.chartType === "candlestick") {
            // Candlestick: use all candles (with pagination)
            return candles;
        } else {
            // Line chart: only use the most recent 500 candles
            const maxLineChartCandles = 500;
            if (candles.length > maxLineChartCandles) {
                return candles.slice(-maxLineChartCandles);
            }
            return candles;
        }
    }, [candles, settings.chartType]);

    // Format data for Recharts with proper indicator alignment (optimized)
    const chartData = useMemo(() => {
        return displayCandles.map((candle, index) => {
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
                atr:
                    atrValue !== undefined && atrValue !== null
                        ? atrValue * 100
                        : null, // Scale ATR by 100x, use null for missing data
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
    }, [displayCandles, indicatorMaps]);

    // Performance optimized - removed debug logging for better performance

    // Calculate price information - use same data source as Trending Pairs for consistency
    const pricingSymbol = currentSymbol ? `${currentSymbol}m` : null;
    const pricing = pricingSymbol
        ? pricingBySymbol.get(pricingSymbol) || {}
        : {};

    // Use bid price from market cache (same as Trending Pairs) instead of candle close price
    const latestPrice =
        typeof pricing.bid === "number"
            ? pricing.bid
            : candles.length > 0
            ? candles[candles.length - 1].close
            : 0;

    // Initialize chart
    useEffect(() => {
        console.log("Unified Chart initialization effect running...");
        setIsInitialized(true);
    }, []);

    // Refresh line chart when switching to line chart type
    useEffect(() => {
        if (settings.chartType !== "candlestick") {
            console.log("📊 Refreshing line chart area...");
            // Force re-render of line chart components
            setLineChartKey((prev) => prev + 1);
        }
    }, [settings.chartType]);

    // Load more historical data (pagination)
    // removed loadMoreHistory; background preloader now fetches slices inline

    // Background preloading: after initial page is ready, wait 2s, then sequentially load up to 20 pages total
    useEffect(() => {
        // Only start after we have at least the first page
        if (currentPage >= 1 && hasMoreHistory && !backgroundPreloadStartedRef.current) {
            const sessionId = preloadSessionRef.current;
            const MAX_TOTAL_PAGES = 4;

            const timer = setTimeout(() => {
                // Mark started only when the timer actually fires to avoid premature cancellation on re-renders
                backgroundPreloadStartedRef.current = true;
                (async () => {
                    try {
                        // Keep fetching older slices until limits reached or new session starts
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            // Stop if session changed (symbol/timeframe switched)
                            if (preloadSessionRef.current !== sessionId) break;
                            // Stop if we've reached max total pages (include the first page)
                            const { currentPage: latestPage, hasMoreHistory: stillHasMore } = useChartStore.getState();
                            if (latestPage >= MAX_TOTAL_PAGES) break;
                            if (!stillHasMore) break;

                            // Fetch one older slice inline
                            try {
                                setLoadingHistory(true);
                                const { candles: slice, nextBefore, count } = await realMarketService.fetchOhlcSlice(
                                  currentSymbol,
                                  currentTimeframe,
                                  { limit: 500, before: olderCursorRef.current }
                                );
                                if (slice.length > 0) {
                                    // Merge candles and recalc indicators using latest store data
                                    const existing = useChartStore.getState().candles;
                                    prependCandles(slice);
                                    const allCandles = [...slice, ...existing].sort((a, b) => a.time - b.time);
                                    const calculatedIndicators = calculateAllIndicators(allCandles);
                                    setIndicators(calculatedIndicators);

                                    setCurrentPage(useChartStore.getState().currentPage + 1);
                                    olderCursorRef.current = nextBefore || null;
                                    setHasMoreHistory(Boolean(nextBefore && count > 0));
                                } else {
                                    setHasMoreHistory(false);
                                    break;
                                }
                            } catch (e) {
                                // eslint-disable-next-line no-console
                                console.warn('⚠️ Preload slice failed:', e);
                                break; // break on error to avoid tight loop
                            } finally {
                                setLoadingHistory(false);
                            }
                        }
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.warn("⚠️ Background preload stopped:", e);
                    } finally {
                        // Log a summary only if we're still in the same session
                        try {
                            if (preloadSessionRef.current === sessionId) {
                                const state = useChartStore.getState();
                                const all = Array.isArray(state.candles) ? [...state.candles] : [];
                                if (all.length > 0) {
                                    const sorted = all.sort((a, b) => a.time - b.time);
                                    const first = sorted[0];
                                    const last = sorted[sorted.length - 1];
                                    const toIso = (t) => {
                                        const ms = t < 946684800000 ? t * 1000 : t;
                                        return new Date(ms).toISOString();
                                    };
                                    // eslint-disable-next-line no-console
                                    console.log('[ChartSummary]', {
                                        timeframe: currentTimeframe,
                                        totalCandles: sorted.length,
                                        firstCandle: first,
                                        lastCandle: last,
                                        startTime: toIso(first.time),
                                        endTime: toIso(last.time)
                                    });
                                } else {
                                    // eslint-disable-next-line no-console
                                    console.log('[ChartSummary]', {
                                        timeframe: currentTimeframe,
                                        totalCandles: 0
                                    });
                                }
                            }
                        } catch (_e) {
                            // ignore summary errors
                        }
                        // Guard remains set for this session; resets on symbol/timeframe change
                    }
                })();
            }, 2000);

            return () => {
                clearTimeout(timer);
            };
        }
        return undefined;
    }, [currentPage, hasMoreHistory, currentSymbol, currentTimeframe, prependCandles, setIndicators, setCurrentPage, setHasMoreHistory, setLoadingHistory]);

    // Load historical data
    useEffect(() => {
        const loadHistoricalData = async () => {
            console.log("🚀 Starting to load historical data...");
            console.log("📊 Settings:", {
                symbol: currentSymbol,
                timeframe: currentTimeframe,
            });

      // If candles are already loaded for this symbol/timeframe, reuse cache and skip REST
      try {
        const state = store;
        const hasCached = Array.isArray(state.candles) && state.candles.length > 0
          && state.candlesMeta
          && state.candlesMeta.symbol === currentSymbol
          && state.candlesMeta.timeframe === currentTimeframe;

        if (hasCached) {
          console.log('♻️ Using cached candles; skipping REST fetch');
          // Ensure indicators align with cached candles
          try {
            const calc = calculateAllIndicators(state.candles);
            setIndicators(calc);
          } catch (_) {}
          setLoading(false);
          return;
        }
      } catch (_) {}

      setLoading(true);
      setError(null);
      resetPagination(); // Reset pagination when loading new data

            try {
                // Figure out how many bars to fetch initially (fixed at 150)
                const desiredBars = getInitialBarsForTimeframe(
                    currentTimeframe
                );
                // Always request 150 candles per REST call
                const LIMIT_PER_CALL = 150;
                const combined = [];
                let before = null; // no cursor -> most recent slice
                let hasMoreOlder = true;
                while (combined.length < desiredBars && hasMoreOlder) {
                    const limit = LIMIT_PER_CALL;
                    // eslint-disable-next-line no-await-in-loop
                    const { candles: slice, nextBefore, count } = await realMarketService.fetchOhlcSlice(
                        currentSymbol,
                        currentTimeframe,
                        { limit, before }
                    );
                    if (slice.length > 0) combined.push(...slice);
                    if (!nextBefore || !count) {
                        hasMoreOlder = false;
                    } else {
                        before = nextBefore;
                        olderCursorRef.current = nextBefore;
                    }
                }

                // Deduplicate by time and sort ascending
                const seen = new Set();
                const unique = [];
                for (let i = 0; i < combined.length; i++) {
                    const c = combined[i];
                    if (!seen.has(c.time)) {
                        seen.add(c.time);
                        unique.push(c);
                    }
                }
                unique.sort((a, b) => a.time - b.time);
                const sliced =
                    unique.length > desiredBars
                        ? unique.slice(-desiredBars)
                        : unique;

                console.log("✅ Historical data loaded successfully!", {
                    desiredBars,
                    received: combined.length,
                    unique: unique.length,
                    used: sliced.length,
                });

                // Validate the data structure
                if (sliced.length > 0) {
                    const firstCandle = sliced[0];
                    console.log("🔍 Data validation:", {
                        hasTime:
                            typeof firstCandle.time === "number" &&
                            !isNaN(firstCandle.time),
                        hasOpen:
                            typeof firstCandle.open === "number" &&
                            !isNaN(firstCandle.open),
                        hasHigh:
                            typeof firstCandle.high === "number" &&
                            !isNaN(firstCandle.high),
                        hasLow:
                            typeof firstCandle.low === "number" &&
                            !isNaN(firstCandle.low),
                        hasClose:
                            typeof firstCandle.close === "number" &&
                            !isNaN(firstCandle.close),
                        timeValue: firstCandle.time,
                        openValue: firstCandle.open,
                    });
                } else {
                    console.warn("⚠️ No data received from realMarketService!");
                    console.warn("⚠️ Data is empty or null:", sliced);
                }

                console.log("💾 Setting candles in store...");
                setCandles(sliced);
                console.log("✅ Candles set in store, length:", sliced.length);

                // Update pagination counters to reflect how many pages we fetched
                setCurrentPage(Math.ceil(combined.length / 150));
                setHasMoreHistory(Boolean(olderCursorRef.current));

                // Calculate indicators
                console.log("🧮 Calculating indicators...");
                const calculatedIndicators = calculateAllIndicators(sliced);
                console.log(
                    "✅ Indicators calculated:",
                    Object.keys(calculatedIndicators)
                );
                setIndicators(calculatedIndicators);
            } catch (err) {
                console.error("❌ Error loading data:", err);
                console.error("❌ Error details:", {
                    message: err.message,
                    stack: err.stack,
                    name: err.name,
                });
                setError(
                    err instanceof Error ? err.message : "Failed to load data"
                );
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
                    change24h: [],
                });
            } finally {
                console.log("🏁 Loading process completed");
                setLoading(false);
            }
        };

        if (isInitialized) {
            loadHistoricalData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isInitialized,
        currentSymbol,
        currentTimeframe,
    ]);

    // WebSocket connection for real-time data (throttled)
    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        // Internal apply function that always uses the latest store state
        const applyCandle = (newCandle) => {
            const store = useChartStore.getState();
            const currentCandles = store.candles;
            const lastCandle = currentCandles[currentCandles.length - 1];

            // Special handling for live tick updates (partial bar updates)
            if (newCandle && newCandle.source === "tick") {
                const price = Number(newCandle.price);
                const time = Number(newCandle.time);
                if (
                    !Number.isFinite(price) ||
                    !Number.isFinite(time) ||
                    time <= 0
                )
                    return;

                // If the latest bar matches this bucket, update H/L/C; preserve the original open
                if (lastCandle && lastCandle.time === time) {
                    const merged = {
                        time,
                        open: Number.isFinite(lastCandle.open)
                            ? lastCandle.open
                            : price,
                        high: Math.max(Number(lastCandle.high ?? price), price),
                        low: Math.min(Number(lastCandle.low ?? price), price),
                        close: price,
                        volume:
                            (Number(lastCandle.volume) || 0) +
                            (Number(newCandle.volume) || 0),
                    };
                    store.updateLastCandle(merged);
                } else if (!lastCandle || lastCandle.time < time) {
                    // Start a new (live) bar for this timeframe bucket
                    const live = {
                        time,
                        open: price,
                        high: price,
                        low: price,
                        close: price,
                        volume: Number(newCandle.volume) || 0,
                    };
                    store.addCandle(live);
                } else {
                    // Older tick than last candle's time — ignore to keep chart stable
                    return;
                }

                // Recalculate indicators with updated candles
                const postUpdate = useChartStore.getState().candles;
                const sorted = [...postUpdate].sort((a, b) => a.time - b.time);
                const calculatedIndicators = calculateAllIndicators(sorted);
                store.setIndicators(calculatedIndicators);
                return;
            }

            // Full candle validation and merge (REST/ohlc_updates)
            if (
                isNaN(newCandle.time) ||
                isNaN(newCandle.open) ||
                isNaN(newCandle.high) ||
                isNaN(newCandle.low) ||
                isNaN(newCandle.close) ||
                newCandle.time <= 0
            ) {
                console.warn("Invalid candle data received:", newCandle);
                return;
            }

            if (lastCandle && newCandle.time === lastCandle.time) {
                store.updateLastCandle(newCandle);
            } else if (!lastCandle || newCandle.time > lastCandle.time) {
                store.addCandle(newCandle);
            } else {
                const updatedCandles = [...currentCandles, newCandle].sort(
                    (a, b) => a.time - b.time
                );
                store.setCandles(updatedCandles);
                const calculatedIndicators =
                    calculateAllIndicators(updatedCandles);
                store.setIndicators(calculatedIndicators);
                return;
            }

            const updatedCandles =
                lastCandle && newCandle.time === lastCandle.time
                    ? [...currentCandles.slice(0, -1), newCandle]
                    : [...currentCandles, newCandle];
            const sortedCandles = updatedCandles.sort(
                (a, b) => a.time - b.time
            );
            const calculatedIndicators = calculateAllIndicators(sortedCandles);
            store.setIndicators(calculatedIndicators);
        };

        // Tick handler (per-tick if throttle is 0, otherwise throttled)
        const handleNewCandle = (incomingCandle) => {
            if (TICK_UPDATE_THROTTLE_MS <= 0) {
                applyCandle(incomingCandle);
                return;
            }
            tickThrottlePendingRef.current = incomingCandle;
            const now = Date.now();

            const elapsed = now - (tickThrottleLastEmitRef.current || 0);
            if (elapsed >= TICK_UPDATE_THROTTLE_MS) {
                const toApply = tickThrottlePendingRef.current;
                tickThrottlePendingRef.current = null;
                tickThrottleLastEmitRef.current = now;
                if (toApply) applyCandle(toApply);
            } else if (!tickThrottleTimerRef.current) {
                const remaining = Math.max(
                    TICK_UPDATE_THROTTLE_MS - elapsed,
                    0
                );
                tickThrottleTimerRef.current = setTimeout(() => {
                    tickThrottleTimerRef.current = null;
                    tickThrottleLastEmitRef.current = Date.now();
                    const toApplyLater = tickThrottlePendingRef.current;
                    tickThrottlePendingRef.current = null;
                    if (toApplyLater) applyCandle(toApplyLater);
                }, remaining);
            }
        };

        const handleError = (error) => {
            console.error("WebSocket error:", error);
            setError("Connection error");
            setConnected(false);
        };

        const handleClose = () => {
            setConnected(false);
        };

        const handleOpen = () => {
            setConnected(true);
            setError(null);
        };

        // Connect to WebSocket
        realMarketService.connectWebSocket(
            currentSymbol,
            currentTimeframe,
            handleNewCandle,
            handleError,
            handleClose,
            handleOpen
        );

        return () => {
            if (tickThrottleTimerRef.current) {
                clearTimeout(tickThrottleTimerRef.current);
                tickThrottleTimerRef.current = null;
            }
            tickThrottlePendingRef.current = null;
            realMarketService.disconnectWebSocket();
            setConnected(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInitialized, currentSymbol, currentTimeframe]);

    // Initialize wishlist WebSocket (temporarily disabled to fix main chart)

    // For candlestick (KLineChart), let the inner component handle its own initial loader
    if (isLoading && settings.chartType !== "candlestick") {
        return (
            <div className="flex-1 bg-white flex items-start justify-center pt-16 h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading Chart...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <p className="text-red-600 font-medium mb-2">
                        Error loading data
                    </p>
                    <p className="text-gray-600 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 bg-white flex flex-col h-full overflow-hidden">
            {/* Chart Container: candlestick uses container-sized chart, others can scroll */}
            <div
                className={`unified-chart-container ${
                    settings.chartType === "candlestick"
                        ? "flex-1 relative overflow-hidden"
                        : "flex-1 overflow-y-auto"
                }`}
                style={
                    settings.chartType === "candlestick"
                        ? { minHeight: 0 }
                        : {
                              minHeight: 0,
                              maxHeight: "calc(100vh - 200px)",
                              scrollbarWidth: "thin",
                              scrollbarColor: "#d1d5db #f3f4f6",
                              scrollBehavior: "smooth",
                          }
                }
            >
                {settings.chartType === "candlestick" ? (
                    // Show Enhanced Candlestick Chart with drawing tools, sized to container
                    <div
                        className="absolute"
                        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        <EnhancedCandlestickChart
                            key={`enhanced-candlestick-${currentSymbol}-${currentTimeframe}`}
                            candles={displayCandles}
                            indicators={indicators}
                            settings={{...settings, symbol: currentSymbol, timeframe: currentTimeframe, indicators: currentIndicators}}
                            isLoadingHistory={isLoadingHistory}
                            hasMoreHistory={hasMoreHistory}
                            isFullscreen={isFullscreen}
                        />
                    </div>
                ) : (
                    // Show separate Recharts for each indicator
                    <>
                        {chartData.length > 0 ? (
                            <div
                                key={lineChartKey}
                                className="space-y-0.5 pb-1 px-1"
                            >
                                {/* Price Chart - Always visible */}
                                <div className="bg-white rounded-lg border border-gray-200 p-1 relative">
                                    <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                        Price Chart - {currentSymbol}
                                    </h4>
                                    <div className="text-[10px] text-gray-600 mb-0.5">
                                        Data: {chartData.length} points | Price:
                                        ${chartData[0]?.price} - $
                                        {chartData[chartData.length - 1]?.price}
                                    </div>
                                    <div className="relative">
                                        <ResponsiveContainer
                                            width="100%"
                                            height={140}
                                        >
                                            <ComposedChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                    style={{
                                                        textAnchor: "middle",
                                                        fontSize: "7px",
                                                    }}
                                                />
                                                <YAxis
                                                    yAxisId="left"
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) =>
                                                        value / 100
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            // Show unscaled ATR values in tooltip
                                                            if (
                                                                name === "ATR"
                                                            ) {
                                                                return [
                                                                    value / 100,
                                                                    name,
                                                                ];
                                                            }
                                                            return [
                                                                value,
                                                                name,
                                                            ];
                                                        }
                                                        return [value, name];
                                                    }}
                                                />
                                                <Legend />

                                                {/* Price Area - Always visible */}
                                                <Area
                                                    type="monotone"
                                                    dataKey="price"
                                                    fill="#3b82f6"
                                                    stroke="#2563eb"
                                                    fillOpacity={0.3}
                                                    name="Price"
                                                    isAnimationActive={false}
                                                />

                                                {/* EMAs - Toggleable */}
                                                {settings.indicators.ema20 && (
                                                    <Line
                                                        type="monotone"
                                                        dataKey="ema20"
                                                        stroke="#ff9800"
                                                        dot={false}
                                                        strokeWidth={2}
                                                        name="EMA 20"
                                                        isAnimationActive={
                                                            false
                                                        }
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
                                                        isAnimationActive={
                                                            false
                                                        }
                                                    />
                                                )}

                                                {/* SMAs - Toggleable */}
                                                {settings.indicators.sma50 && (
                                                    <Line
                                                        type="monotone"
                                                        dataKey="sma50"
                                                        stroke="#10b981"
                                                        dot={false}
                                                        strokeWidth={2}
                                                        name="SMA 50"
                                                        isAnimationActive={
                                                            false
                                                        }
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
                                                        isAnimationActive={
                                                            false
                                                        }
                                                    />
                                                )}

                                                {/* Bollinger Bands - Toggleable */}
                                                {settings.indicators
                                                    .bollinger && (
                                                    <>
                                                        <Line
                                                            type="monotone"
                                                            dataKey="bollingerUpper"
                                                            stroke="#8b5cf6"
                                                            strokeWidth={1}
                                                            dot={false}
                                                            name="BB Upper"
                                                            isAnimationActive={
                                                                false
                                                            }
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="bollingerMiddle"
                                                            stroke="#7c3aed"
                                                            strokeWidth={2}
                                                            dot={false}
                                                            name="BB Middle"
                                                            isAnimationActive={
                                                                false
                                                            }
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="bollingerLower"
                                                            stroke="#8b5cf6"
                                                            strokeWidth={1}
                                                            dot={false}
                                                            name="BB Lower"
                                                            isAnimationActive={
                                                                false
                                                            }
                                                        />
                                                    </>
                                                )}

                                                {/* VWAP - Toggleable */}
                                                {settings.indicators.vwap && (
                                                    <Line
                                                        type="monotone"
                                                        dataKey="vwap"
                                                        stroke="#06b6d4"
                                                        dot={false}
                                                        strokeWidth={2}
                                                        name="VWAP"
                                                        isAnimationActive={
                                                            false
                                                        }
                                                    />
                                                )}

                                                {/* ATR - Toggleable */}
                                                {settings.indicators.atr && (
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="atr"
                                                        stroke="#ff5722"
                                                        dot={false}
                                                        strokeWidth={3}
                                                        name="ATR"
                                                        connectNulls={true}
                                                        isAnimationActive={
                                                            false
                                                        }
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

                                {/* Volume Chart - Always visible */}
                                <div className="bg-white rounded-lg border border-gray-200 p-1 mb-1">
                                    <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                        Volume
                                    </h4>
                                    <ResponsiveContainer
                                        width="100%"
                                        height={80}
                                    >
                                        <BarChart
                                            data={chartData}
                                            margin={{
                                                top: 2,
                                                right: 8,
                                                left: 2,
                                                bottom: 8,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="time"
                                                tick={{ fontSize: 7 }}
                                                tickFormatter={(value) => {
                                                    const dataPoint =
                                                        chartData[value];
                                                    return dataPoint
                                                        ? dataPoint.timeLabel
                                                        : "";
                                                }}
                                                style={{
                                                    textAnchor: "middle",
                                                    fontSize: "7px",
                                                }}
                                            />
                                            <YAxis
                                                domain={["auto", "auto"]}
                                                tick={{ fontSize: 7 }}
                                            />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (
                                                        typeof value ===
                                                        "number"
                                                    ) {
                                                        return [
                                                            value.toFixed(0),
                                                            name,
                                                        ];
                                                    }
                                                    return [value, name];
                                                }}
                                            />
                                            <Bar
                                                dataKey="volume"
                                                fill="#8b5cf6"
                                                name="Volume"
                                                opacity={0.7}
                                                isAnimationActive={false}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* RSI Chart */}
                                {settings.indicators.rsi && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            RSI (Relative Strength Index)
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                                {/* RSI Overbought/Oversold lines */}
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => 70}
                                                    stroke="#ff5722"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Overbought (70)"
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => 30}
                                                    stroke="#4caf50"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Oversold (30)"
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* MACD Chart */}
                                {settings.indicators.macd && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            MACD (Moving Average Convergence
                                            Divergence)
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <ComposedChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value.toFixed(
                                                                    4
                                                                ),
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />

                                                {/* Signal Line */}
                                                <Line
                                                    type="monotone"
                                                    dataKey="macdSignal"
                                                    stroke="#ff9800"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="Signal"
                                                    isAnimationActive={false}
                                                />

                                                {/* Histogram */}
                                                <Bar
                                                    dataKey="macdHistogram"
                                                    fill="#4caf50"
                                                    name="Histogram"
                                                    opacity={0.7}
                                                    isAnimationActive={false}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* SMA 50 Chart */}
                                {settings.indicators.sma50 && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            SMA 50 (Simple Moving Average)
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* SMA 100 Chart */}
                                {settings.indicators.sma100 && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            SMA 100 (Simple Moving Average)
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Bollinger Bands Chart */}
                                {settings.indicators.bollinger && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            Bollinger Bands
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <ComposedChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="bollingerMiddle"
                                                    stroke="#7c3aed"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="Middle Band"
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="bollingerLower"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={1}
                                                    dot={false}
                                                    name="Lower Band"
                                                    isAnimationActive={false}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Stochastic Chart */}
                                {settings.indicators.stoch && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            Stochastic Oscillator
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <ComposedChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="stochD"
                                                    stroke="#be185d"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="%D"
                                                    isAnimationActive={false}
                                                />
                                                {/* Overbought/Oversold lines */}
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => 80}
                                                    stroke="#ef4444"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Overbought (80)"
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => 20}
                                                    stroke="#22c55e"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Oversold (20)"
                                                    isAnimationActive={false}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Williams %R Chart */}
                                {settings.indicators.williams && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            Williams %R
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={[-100, 0]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                                {/* Overbought/Oversold lines */}
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => -20}
                                                    stroke="#f97316"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Overbought (-20)"
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => -80}
                                                    stroke="#22c55e"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Oversold (-80)"
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* CCI Chart */}
                                {settings.indicators.cci && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            CCI (Commodity Channel Index)
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                                {/* CCI reference lines */}
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => 100}
                                                    stroke="#ef4444"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Overbought (100)"
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={() => -100}
                                                    stroke="#22c55e"
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Oversold (-100)"
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* OBV Chart */}
                                {settings.indicators.obv && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            OBV (On-Balance Volume)
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value.toFixed(
                                                                    0
                                                                ),
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* VWAP Chart */}
                                {settings.indicators.vwap && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            VWAP (Volume Weighted Average Price)
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* 24h Change Chart */}
                                {settings.indicators.change24h && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-1">
                                        <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                                            24h Change
                                        </h4>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={120}
                                        >
                                            <ComposedChart
                                                data={chartData}
                                                margin={{
                                                    top: 2,
                                                    right: 8,
                                                    left: 2,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="time"
                                                    tick={{ fontSize: 7 }}
                                                    tickFormatter={(value) => {
                                                        const dataPoint =
                                                            chartData[value];
                                                        return dataPoint
                                                            ? dataPoint.timeLabel
                                                            : "";
                                                    }}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fontSize: 7 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (
                                                            typeof value ===
                                                            "number"
                                                        ) {
                                                            if (
                                                                name ===
                                                                "Change %"
                                                            )
                                                                return [
                                                                    value.toFixed(
                                                                        2
                                                                    ) + "%",
                                                                    name,
                                                                ];
                                                            return [
                                                                value,
                                                                name,
                                                            ];
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
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="change24hPercent"
                                                    stroke="#ea580c"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="Change %"
                                                    isAnimationActive={false}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Scroll Indicator */}
                                <div className="text-center py-2 text-xs text-gray-400">
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                            />
                                        </svg>
                                        <span>
                                            Scroll to see all indicators
                                        </span>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">📊</div>
                                    <p className="text-gray-600 font-medium">
                                        No chart data available
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {candles.length === 0
                                            ? "Loading market data..."
                                            : "Processing chart data..."}
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
