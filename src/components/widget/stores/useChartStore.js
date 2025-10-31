import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Resolve system timezone once on load; fallback to 'UTC'
const SYSTEM_TIMEZONE = (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';

const defaultSettings = {
  symbol: 'BTCUSDT',
  timeframe: '1h',
  chartType: 'candlestick',
  cursorType: 'crosshair',
  // Auto-detect system timezone by default
  timezone: SYSTEM_TIMEZONE,
  showGrid: true,
  indicators: {
    // RSI Enhanced, EMA Touch, ATR Enhanced, BB Pro, MA Enhanced
    rsiEnhanced: true,
    emaTouch: false,
    atrEnhanced: false,
    bbPro: false,
    maEnhanced: false,
  }
};

export const useChartStore = create(
  persist(
    (set) => ({
      // Initial state
      candles: [],
      indicators: {
        // Keep indicators map minimal; legacy keys will be ignored
        rsiEnhanced: [],
        emaTouch: [],
        atrEnhanced: [],
        bbPro: [],
        maEnhanced: [],
      },
      dailyChangeData: {
        symbol: null,
        daily_change_pct: 0,
        daily_change: 0,
        timestamp: null,
        isPositive: false
      },
      settings: defaultSettings,
      isLoading: false,
      isConnected: false,
      error: null,
      // Drawing tools state
      activeDrawingTool: null,
      drawings: [],
      // KLine chart ref (not persisted)
      klineChartRef: null,
      // Pagination state
      currentPage: 1,
      hasMoreHistory: true,
      isLoadingHistory: false,

      // Actions
      setCandles: (candles) => set({ candles }),
      


      addCandle: (candle) => set((state) => ({
        candles: [...state.candles, candle]
      })),
      
      updateLastCandle: (candle) => set((state) => ({
        candles: state.candles.length > 0 
          ? [...state.candles.slice(0, -1), candle]
          : [candle]
      })),
      
      setIndicators: (indicators) => set({ indicators }),
      
      updateIndicators: (newCandles) => {
        // This will be called from components that import the indicator calculation functions
        // The actual calculation will happen in the component to avoid circular dependencies
        set(() => ({
          candles: newCandles
        }));
      },
      
      toggleIndicator: (indicator) => {
        console.log('💾 ChartStore: Toggling indicator', indicator);
        set((state) => ({
          settings: {
            ...state.settings,
            indicators: {
              ...state.settings.indicators,
              [indicator]: !state.settings.indicators[indicator]
            }
          }
        }));
      },
      
      setIndicatorsPreset: (indicatorsConfig) => {
        console.log('💾 ChartStore: Setting indicators preset', indicatorsConfig);
        set((state) => ({
          settings: {
            ...state.settings,
            indicators: {
              ...state.settings.indicators,
              ...indicatorsConfig
            }
          }
        }));
      },
      
      setSymbol: (symbol) => {
        console.log('💾 ChartStore: Setting symbol to', symbol);
        set((state) => ({
          settings: {
            ...state.settings,
            symbol
          }
        }));
      },
      
      setTimeframe: (timeframe) => {
        console.log('💾 ChartStore: Setting timeframe to', timeframe);
        set((state) => ({
          settings: {
            ...state.settings,
            timeframe
          }
        }));
      },
      
      setChartType: (chartType) => {
        // Lock to candlestick mode only
        const nextType = 'candlestick';
        console.log('💾 ChartStore: Setting chartType to', chartType, '-> enforced as', nextType);
        set((state) => ({
          settings: {
            ...state.settings,
            chartType: nextType
          }
        }));
      },
      
      setCursorType: (cursorType) => {
        console.log('💾 ChartStore: Setting cursorType to', cursorType);
        set((state) => ({
          settings: {
            ...state.settings,
            cursorType
          }
        }));
      },
      
      setTimezone: (timezone) => {
        console.log('💾 ChartStore: Setting timezone to', timezone);
        set((state) => ({
          settings: {
            ...state.settings,
            timezone
          }
        }));
      },
      
      toggleGrid: () => {
        console.log('💾 ChartStore: Toggling grid visibility');
        set((state) => ({
          settings: {
            ...state.settings,
            showGrid: !state.settings.showGrid
          }
        }));
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setConnected: (isConnected) => set({ isConnected }),
      
      setError: (error) => set({ error }),
      
      resetChart: () => set({
        candles: [],
        indicators: {
          rsiEnhanced: [],
          emaTouch: [],
          atrEnhanced: [],
          bbPro: [],
          maEnhanced: [],
        },
        dailyChangeData: {
          symbol: null,
          daily_change_pct: 0,
          daily_change: 0,
          timestamp: null,
          isPositive: false
        },
        isLoading: false,
        isConnected: false,
        error: null,
      }),
      
      resetSettings: () => {
        console.log('💾 ChartStore: Resetting settings to defaults');
        set(() => ({
          settings: defaultSettings
        }));
      },
      
      // Drawing tools actions
      setActiveDrawingTool: (tool) => {
        console.log('🎨 ChartStore: Setting active drawing tool:', tool);
        set({ activeDrawingTool: tool });
      },
      
      addDrawing: (drawing) => {
        console.log('🎨 ChartStore: Adding drawing:', drawing);
        set((state) => ({
          drawings: [...state.drawings, drawing]
        }));
      },
      
      removeDrawing: (id) => {
        console.log('🎨 ChartStore: Removing drawing:', id);
        set((state) => ({
          drawings: state.drawings.filter(drawing => drawing.id !== id)
        }));
      },
      
      clearAllDrawings: () => {
        console.log('🎨 ChartStore: Clearing all drawings');
        set({ drawings: [], activeDrawingTool: null });
      },
      
      // KLine chart ref actions
      setKLineChartRef: (ref) => {
        console.log('📊 ChartStore: Setting KLine chart ref');
        set({ klineChartRef: ref });
      },
      
      // Daily change data actions
      setDailyChangeData: (data) => {
        console.log('💾 ChartStore: Setting daily change data:', data);
        set(() => ({
          dailyChangeData: {
            symbol: data.symbol,
            daily_change_pct: parseFloat(data.daily_change_pct) || 0,
            daily_change: parseFloat(data.daily_change) || 0,
            timestamp: Date.now(),
            isPositive: parseFloat(data.daily_change_pct) >= 0
          }
        }));
      },
      
      clearDailyChangeData: () => {
        console.log('💾 ChartStore: Clearing daily change data');
        set({
          dailyChangeData: {
            symbol: null,
            daily_change_pct: 0,
            daily_change: 0,
            timestamp: null,
            isPositive: false
          }
        });
      },
      
      // Pagination actions
      setCurrentPage: (page) => set({ currentPage: page }),
      
      setHasMoreHistory: (hasMore) => set({ hasMoreHistory: hasMore }),
      
      setLoadingHistory: (isLoading) => set({ isLoadingHistory: isLoading }),
      
      prependCandles: (newCandles) => set((state) => {
        // Filter out duplicates and merge with existing candles
        const existingTimes = new Set(state.candles.map(c => c.time));
        const uniqueNewCandles = newCandles.filter(c => !existingTimes.has(c.time));
        
        // Sort all candles by time
        const allCandles = [...uniqueNewCandles, ...state.candles].sort((a, b) => a.time - b.time);
        
        console.log('📊 Prepending candles:', {
          newCandlesCount: newCandles.length,
          uniqueNewCount: uniqueNewCandles.length,
          existingCount: state.candles.length,
          totalCount: allCandles.length
        });
        
        return { candles: allCandles };
      }),
      
      resetPagination: () => set({ 
        currentPage: 1, 
        hasMoreHistory: true, 
        isLoadingHistory: false 
      }),
    }),
    {
      name: 'tradingview-chart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings
      }),
      onRehydrateStorage: () => (_state) => {
        if (_state) {
          console.log('💾 ChartStore: State rehydrated from localStorage', {
            symbol: _state.settings.symbol,
            timeframe: _state.settings.timeframe,
            chartType: _state.settings.chartType,
            indicators: _state.settings.indicators
          });
          // If timezone wasn't previously set, ensure we apply system timezone automatically
          try {
            if (!_state.settings.timezone) {
              const tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
              _state.settings.timezone = tz;
            }
            // Enforce candlestick-only mode on rehydrate
            if (_state.settings.chartType !== 'candlestick') {
              _state.settings.chartType = 'candlestick';
            }
          } catch (_e) {
            // noop
          }
        }
      },
    }
  )
);

// Selectors for better performance
export const selectCandles = (state) => state.candles;
export const selectIndicators = (state) => state.indicators;
export const selectSettings = (state) => state.settings;
export const selectIsLoading = (state) => state.isLoading;
export const selectIsConnected = (state) => state.isConnected;
export const selectError = (state) => state.error;
export const selectDailyChangeData = (state) => state.dailyChangeData;
