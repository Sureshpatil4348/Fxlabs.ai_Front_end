import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const defaultSettings = {
  symbol: 'BTCUSDT',
  timeframe: '1h',
  chartType: 'candlestick',
  indicators: {
    ema20: true,
    ema200: true,
    rsi: true,
    macd: true,
    atr: false,
    sma50: false,
    sma100: false,
    bollinger: false,
    stoch: false,
    williams: false,
    cci: false,
    obv: false,
    vwap: false,
    change24h: true,
  }
};

const defaultChartPanels = [
  {
    id: 'panel-1',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    chartType: 'candlestick',
    indicators: {
      ema20: true,
      ema200: true,
      rsi: false,
      macd: false,
      atr: false,
      sma50: false,
      sma100: false,
      bollinger: false,
      stoch: false,
      williams: false,
      cci: false,
      obv: false,
      vwap: false,
      change24h: true,
    }
  },
  {
    id: 'panel-2',
    symbol: 'ETHUSDT',
    timeframe: '1h',
    chartType: 'line',
    indicators: {
      ema20: true,
      ema200: false,
      rsi: false,
      macd: false,
      atr: false,
      sma50: false,
      sma100: false,
      bollinger: false,
      stoch: false,
      williams: false,
      cci: false,
      obv: false,
      vwap: false,
      change24h: true,
    }
  },
  {
    id: 'panel-3',
    symbol: 'BNBUSDT',
    timeframe: '30m',
    chartType: 'candlestick',
    indicators: {
      ema20: true,
      ema200: false,
      rsi: true,
      macd: false,
      atr: false,
      sma50: false,
      sma100: false,
      bollinger: false,
      stoch: false,
      williams: false,
      cci: false,
      obv: false,
      vwap: false,
      change24h: true,
    }
  },
  {
    id: 'panel-4',
    symbol: 'ADAUSDT',
    timeframe: '1h',
    chartType: 'line',
    indicators: {
      ema20: false,
      ema200: false,
      rsi: false,
      macd: true,
      atr: false,
      sma50: false,
      sma100: false,
      bollinger: false,
      stoch: false,
      williams: false,
      cci: false,
      obv: false,
      vwap: false,
      change24h: true,
    }
  },
];

export const useChartStore = create(
  persist(
    (set) => ({
      // Initial state
      candles: [],
      indicators: {
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
      },
      settings: defaultSettings,
      layoutType: 'single',
      chartPanels: defaultChartPanels,
      isLoading: false,
      isConnected: false,
      error: null,
      
      // Drawing tools state
      activeDrawingTool: null,
      drawings: [],

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
        console.log('💾 ChartStore: Setting chartType to', chartType);
        set((state) => ({
          settings: {
            ...state.settings,
            chartType
          }
        }));
      },
      
      setLayoutType: (layoutType) => set({ layoutType }),
      
      updateChartPanel: (panelId, updates) => set((state) => ({
        chartPanels: state.chartPanels.map(panel =>
          panel.id === panelId ? { ...panel, ...updates } : panel
        )
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setConnected: (isConnected) => set({ isConnected }),
      
      setError: (error) => set({ error }),
      
      resetChart: () => set({
        candles: [],
        indicators: {
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
        },
        isLoading: false,
        isConnected: false,
        error: null,
      }),
      
      resetSettings: () => {
        console.log('💾 ChartStore: Resetting settings to defaults');
        set(() => ({
          settings: defaultSettings,
          layoutType: 'single',
          chartPanels: defaultChartPanels
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
    }),
    {
      name: 'tradingview-chart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        layoutType: state.layoutType,
        chartPanels: state.chartPanels
      }),
      onRehydrateStorage: () => (_state) => {
        if (_state) {
          console.log('💾 ChartStore: State rehydrated from localStorage', {
            symbol: _state.settings.symbol,
            timeframe: _state.settings.timeframe,
            chartType: _state.settings.chartType,
            indicators: _state.settings.indicators,
            layoutType: _state.layoutType
          });
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
