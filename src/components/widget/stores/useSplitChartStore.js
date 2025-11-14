import { create } from 'zustand';

// Simplified store for the split chart (chart #2)
// This is a non-persistent store that manages data independently
export const useSplitChartStore = create((set) => ({
  // Initial state
  candles: [],
  candlesMeta: null,
  indicators: {
    rsiEnhanced: [],
    emaTouch: [],
    atrEnhanced: [],
    bbPro: [],
    maEnhanced: [],
    orbEnhanced: [],
    stEnhanced: [],
    srEnhanced: [],
    macdEnhanced: [],
  },
  isLoading: false,
  isConnected: false,
  error: null,
  currentPage: 1,
  hasMoreHistory: true,
  isLoadingHistory: false,
  // KLine chart ref (not persisted)
  klineChartRef: null,

  // Actions
  setCandles: (candles, symbol, timeframe) => set({
    candles,
    candlesMeta: { symbol, timeframe }
  }),
  
  addCandle: (candle) => set((state) => ({
    candles: [...state.candles, candle]
  })),
  
  updateLastCandle: (candle) => set((state) => ({
    candles: state.candles.length > 0 
      ? [...state.candles.slice(0, -1), candle]
      : [candle]
  })),
  
  setIndicators: (indicators) => set({ indicators }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  setError: (error) => set({ error }),
  
  resetChart: () => set({
    candles: [],
    candlesMeta: null,
    indicators: {
      rsiEnhanced: [],
      emaTouch: [],
      atrEnhanced: [],
      bbPro: [],
      maEnhanced: [],
      orbEnhanced: [],
      stEnhanced: [],
      srEnhanced: [],
      macdEnhanced: [],
    },
    isLoading: false,
    isConnected: false,
    error: null,
  }),
  
  // Pagination actions
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setHasMoreHistory: (hasMore) => set({ hasMoreHistory: hasMore }),
  
  setLoadingHistory: (isLoading) => set({ isLoadingHistory: isLoading }),
  
  prependCandles: (newCandles) => set((state) => {
    const existingTimes = new Set(state.candles.map(c => c.time));
    const uniqueNewCandles = newCandles.filter(c => !existingTimes.has(c.time));
    const allCandles = [...uniqueNewCandles, ...state.candles].sort((a, b) => a.time - b.time);
    return { candles: allCandles };
  }),
  
  resetPagination: () => set({ 
    currentPage: 1, 
    hasMoreHistory: true, 
    isLoadingHistory: false 
  }),

  // KLine chart ref actions
  setKLineChartRef: (ref) => {
    console.log('📊 SplitChartStore: Setting KLine chart ref');
    set({ klineChartRef: ref });
  },
}));

// Selectors for better performance
export const selectSplitCandles = (state) => state.candles;
export const selectSplitIndicators = (state) => state.indicators;
export const selectSplitIsLoading = (state) => state.isLoading;
export const selectSplitIsConnected = (state) => state.isConnected;
export const selectSplitError = (state) => state.error;

