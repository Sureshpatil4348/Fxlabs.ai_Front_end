import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Resolve system timezone once on load; fallback to 'UTC'
const SYSTEM_TIMEZONE = (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';

const defaultSettings = {
  symbol: 'EURUSD',
  timeframe: '1h',
  chartType: 'candlestick',
  cursorType: 'crosshair',
  // Auto-detect system timezone by default
  timezone: SYSTEM_TIMEZONE,
  showGrid: true,
  // Split mode settings
  isSplitMode: false,
  // Per-indicator configuration
  indicatorSettings: {
    rsiEnhanced: {
      length: 14,
      source: 'close', // one of: close, open, high, low, hl2, hlc3, ohlc4
      overbought: 70,
      oversold: 30,
      rsiLineColor: '#2962FF',
      showMidline: true,
      midlineColor: 'rgba(128,128,128,0.5)',
      obLineColor: 'rgba(242,54,69,0.6)',
      osLineColor: 'rgba(8,153,129,0.6)',
      obFillColor: 'rgba(242,54,69,0.1)',
      osFillColor: 'rgba(8,153,129,0.1)'
    }
    ,
    atrEnhanced: {
      // ATR - Pro settings
      length: 14,
      smoothingMethod: 'RMA', // 'RMA' | 'SMA' | 'EMA' | 'WMA'
      atrLineColor: '#2962FF',
    }
    ,
    emaTouch: {
      // Trend Strategy (BB + ATR Targets) configurable params
      bbLength: 20,
      bbStdDev: 2.0,
      atrLength: 14,
      tp1Multiplier: 1.0,
      tp2Multiplier: 2.5,
      tp3Multiplier: 4.0,
    }
    ,
    bbPro: {
      // Bollinger Bands - Pro settings
      length: 20,
      source: 'close', // close|open|high|low|hl2|hlc3|ohlc4
      stdDev: 2.0,
    }
    ,
    maEnhanced: {
      // Moving Average - Pro settings
      maType: 'EMA', // 'EMA' | 'SMA'
      source: 'close', // close|open|high|low|hl2|hlc3|ohlc4
      ma1Enabled: true,
      ma1Length: 9,
      ma2Enabled: true,
      ma2Length: 21,
      ma3Enabled: true,
      ma3Length: 50,
      ma4Enabled: false,
      ma4Length: 100,
    }
    ,
    orbEnhanced: {
      // Opening Range Breakout - Enhanced settings
      startHour: 9,
      startMinute: 15,
      orPeriod: 1, // number of bars to form opening range
      targetRR: 4.0, // Risk:Reward ratio
    }
    ,
    stEnhanced: {
      // SuperTrend - Pro settings
      atrPeriod: 10,
      atrMultiplier: 3.0,
    }
  },
  indicators: {
    // RSI Enhanced, EMA Touch, ATR Enhanced, BB Pro, MA Enhanced, ORB Enhanced, ST Enhanced, SR Enhanced, MACD Enhanced
    rsiEnhanced: true,
    emaTouch: false,
    atrEnhanced: false,
    bbPro: false,
    maEnhanced: false,
    orbEnhanced: false,
    stEnhanced: false,
    srEnhanced: false,
    macdEnhanced: false,
  },
  // Split chart settings (for the second chart in split mode)
  // Initially matches main chart settings
  splitChart: {
    symbol: 'EURUSD',
    timeframe: '1h',
    indicators: {
      rsiEnhanced: true,
      emaTouch: false,
      atrEnhanced: false,
      bbPro: false,
      maEnhanced: false,
      orbEnhanced: false,
      stEnhanced: false,
      srEnhanced: false,
      macdEnhanced: false,
    }
  }
};

export const useChartStore = create(
  persist(
    (set) => ({
      // Initial state
      candles: [],
      // Tracks which symbol/timeframe the current candles belong to
      candlesMeta: null,
      indicators: {
        // Keep indicators map minimal; legacy keys will be ignored
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
      // Workspace visibility state
      isWorkspaceHidden: false,
      hiddenIndicatorsSnapshot: null,
      // KLine chart ref (not persisted)
      klineChartRef: null,
      // Pagination state
      currentPage: 1,
      hasMoreHistory: true,
      isLoadingHistory: false,

      // Actions
      setCandles: (candles) => set((state) => ({
        candles,
        candlesMeta: {
          symbol: state.settings.symbol,
          timeframe: state.settings.timeframe,
        }
      })),
      


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

      // Update per-indicator settings (partial patch)
      updateIndicatorSettings: (key, partial) => {
        console.log('💾 ChartStore: Updating indicator settings', key, partial);
        set((state) => ({
          settings: {
            ...state.settings,
            indicatorSettings: {
              ...state.settings.indicatorSettings,
              [key]: {
                ...(state.settings.indicatorSettings?.[key] || {}),
                ...(partial || {})
              }
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

      // Workspace visibility actions
      setWorkspaceHidden: (hidden) => {
        console.log('📊 ChartStore: Setting workspace hidden =', hidden);
        set({ isWorkspaceHidden: Boolean(hidden) });
      },
      setHiddenIndicatorsSnapshot: (snapshot) => {
        // Shallow clone only expected; keys are booleans
        const snap = snapshot && typeof snapshot === 'object' ? { ...snapshot } : null;
        console.log('📊 ChartStore: Updating hidden indicators snapshot', snap);
        set({ hiddenIndicatorsSnapshot: snap });
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

      // Split mode actions
      toggleSplitMode: () => {
        console.log('💾 ChartStore: Toggling split mode');
        set((state) => {
          const willEnableSplitMode = !state.settings.isSplitMode;
          
          // When enabling split mode, initialize split chart with current main chart settings
          if (willEnableSplitMode) {
            return {
              settings: {
                ...state.settings,
                isSplitMode: true,
                splitChart: {
                  symbol: state.settings.symbol,
                  timeframe: state.settings.timeframe,
                  indicators: { ...state.settings.indicators }
                }
              }
            };
          }
          
          // When disabling, just toggle the flag
          return {
            settings: {
              ...state.settings,
              isSplitMode: false
            }
          };
        });
      },

      setSplitChartSymbol: (symbol) => {
        console.log('💾 ChartStore: Setting split chart symbol to', symbol);
        set((state) => ({
          settings: {
            ...state.settings,
            splitChart: {
              ...state.settings.splitChart,
              symbol
            }
          }
        }));
      },

      setSplitChartTimeframe: (timeframe) => {
        console.log('💾 ChartStore: Setting split chart timeframe to', timeframe);
        set((state) => ({
          settings: {
            ...state.settings,
            splitChart: {
              ...state.settings.splitChart,
              timeframe
            }
          }
        }));
      },

      toggleSplitChartIndicator: (indicator) => {
        console.log('💾 ChartStore: Toggling split chart indicator', indicator);
        set((state) => ({
          settings: {
            ...state.settings,
            splitChart: {
              ...state.settings.splitChart,
              indicators: {
                ...state.settings.splitChart.indicators,
                [indicator]: !state.settings.splitChart.indicators[indicator]
              }
            }
          }
        }));
      },
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
            // Ensure split mode settings exist (migration for existing users)
            if (!_state.settings.isSplitMode) {
              _state.settings.isSplitMode = false;
            }
            if (!_state.settings.splitChart) {
              // Initialize split chart with same settings as main chart
              _state.settings.splitChart = {
                symbol: _state.settings.symbol || 'EURUSD',
                timeframe: _state.settings.timeframe || '1h',
                indicators: { ...(_state.settings.indicators || {
                  rsiEnhanced: true,
                  emaTouch: false,
                  atrEnhanced: false,
                  bbPro: false,
                  maEnhanced: false,
                  orbEnhanced: false,
                  stEnhanced: false,
                  srEnhanced: false,
                  macdEnhanced: false,
                })}
              };
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
