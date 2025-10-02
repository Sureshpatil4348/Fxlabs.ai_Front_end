import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import websocketService from '../services/websocketService';

// Note: All calculations are now performed server-side
// RSI, correlations, and other indicators should be received from WebSocket/API

// Note: formatSymbol function removed as it's no longer used

// Correlation pairs data - only the specified pairs
const CORRELATION_PAIRS = {
  negative: [
    ['EURUSD', 'USDCHF'],
    ['GBPUSD', 'USDCHF'],
    ['USDJPY', 'EURUSD'],
    ['USDJPY', 'GBPUSD'],
    ['USDCAD', 'AUDUSD'],
    ['USDCHF', 'AUDUSD'],
    ['XAUUSD', 'USDJPY']  // Gold-USDJPY moderately negative
  ],
  positive: [
    ['EURUSD', 'GBPUSD'],
    ['EURUSD', 'AUDUSD'],
    ['EURUSD', 'NZDUSD'],
    ['GBPUSD', 'AUDUSD'],
    ['AUDUSD', 'NZDUSD'],
    ['USDCHF', 'USDJPY'],
    ['XAUUSD', 'XAGUSD'],  // Gold-Silver very high positive
    ['XAUUSD', 'EURUSD'],  // Gold-EUR moderately positive (safe-haven vs USD)
    ['BTCUSD', 'ETHUSD'],  // Crypto very high positive
    ['BTCUSD', 'XAUUSD']   // BTC-Gold weak/moderate positive
  ]
};

// Rolling correlation window options
const CORRELATION_WINDOWS = [20, 50, 90, 120];

const useRSICorrelationStore = create(
  subscribeWithSelector((set, get) => ({
    // Connection state (now managed by shared WebSocket service)
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    
    // Market data
    subscriptions: new Map(), // symbol -> subscription info
    tickData: new Map(),      // symbol -> latest ticks
    ohlcData: new Map(),      // symbol -> OHLC bars (default timeframe)
    ohlcByTimeframe: new Map(), // symbol -> Map(timeframe -> { symbol, timeframe, bars, lastUpdate })
    initialOhlcReceived: new Set(), // symbols that received initial OHLC
    
    // RSI Data
    rsiData: new Map(), // symbol -> RSI values
    
    // Dashboard-specific settings
    settings: {
      timeframe: '4H',
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      correlationWindow: 50, // Default rolling correlation window
      calculationMode: 'rsi_threshold' // 'rsi_threshold' | 'real_correlation'
    },
    
    // Correlation Data
    correlationPairs: CORRELATION_PAIRS,
    correlationStatus: new Map(), // pairKey -> { status: 'match'|'mismatch'|'neutral', rsi1, rsi2 }
    realCorrelationData: new Map(), // pairKey -> { correlation: -1 to 1, strength: 'weak'|'moderate'|'strong', trend: 'increasing'|'decreasing'|'stable' }
    
    // UI state
    logs: [],
    // Remove 1M from selectable timeframes for RSI Correlation Dashboard
    timeframes: ['5M', '15M', '30M', '1H', '4H', '1D'],
    correlationWindows: CORRELATION_WINDOWS,
    
    // Connection Actions
    connect: () => {
      const state = get();
      if (state.isConnected || state.isConnecting) return;
      
      set({ isConnecting: true, connectionError: null });
      
      // Register with centralized message router
      websocketService.registerStore('rsiCorrelation', {
        messageHandler: (_message, _rawData) => {
          // v2 probe: no logging - handled by router
        },
        connectionCallback: () => {
          set({ isConnected: true, isConnecting: false });
          get().addLog('Connected to Market v2 (RSI Correlation probe)', 'success');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiCorrelation', {
              connected: true,
              connecting: false,
              error: null
            });
          });
        },
        disconnectionCallback: () => {
          // Reset connection flags and clear subscription/data maps so a future
          // auto-subscribe will re-send subscribe messages on a new socket
          set({ 
            isConnected: false, 
            isConnecting: false,
            subscriptions: new Map(),
            tickData: new Map(),
            ohlcData: new Map(),
            ohlcByTimeframe: new Map(),
            initialOhlcReceived: new Set()
          });
          get().addLog('Disconnected from Market v2 (RSI Correlation probe)', 'warning');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiCorrelation', {
              connected: false,
              connecting: false,
              error: 'Connection closed'
            });
          });
        },
        errorCallback: (_error) => {
          set({ 
            isConnecting: false, 
            connectionError: 'Failed to connect to Market v2' 
          });
          get().addLog('Connection error (RSI Correlation v2 probe)', 'error');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiCorrelation', {
              connected: false,
              connecting: false,
              error: 'Failed to connect to MT5 server'
            });
          });
        },
        subscribedMessageTypes: ['connected', 'subscribed', 'unsubscribed', 'initial_ohlc', 'ticks', 'ohlc_update', 'pong', 'error']
      });
      
      // Connect to shared WebSocket service
      websocketService.connect().catch((error) => {
        set({ 
          isConnecting: false, 
          connectionError: error.message 
        });
      });
    },
    
    disconnect: () => {
      // Unregister from centralized message router
      websocketService.unregisterStore('rsiCorrelation');
      
      set({ 
        isConnected: false, 
        isConnecting: false, 
        subscriptions: new Map(),
        tickData: new Map(),
        ohlcData: new Map(),
        ohlcByTimeframe: new Map(),
        initialOhlcReceived: new Set()
      });
    },
    
    // v2 probe: disable legacy subscribe; log intent only
    subscribe: (symbol, timeframe, dataTypes) => {
      get().addLog(`(probe) Subscribe skipped for ${symbol} @ ${timeframe} [${(dataTypes||[]).join(', ')}]`, 'warning');
      // Note: subscribe() is disabled in probe mode - no console warning needed
    },
    
    // v2 probe: disable legacy unsubscribe; log intent only
    unsubscribe: (symbol) => {
      get().addLog(`(probe) Unsubscribe skipped for ${symbol}`, 'warning');
      // Note: unsubscribe() is disabled in probe mode - no console warning needed
    },
    
    handleMessage: (message) => {
      const state = get();
      
      switch (message.type) {
        case 'connected':
          get().addLog(`Welcome: ${message.message}`, 'success');
          if (message.supported_timeframes) {
            // Ensure 1M is excluded even if server sends it
            set({ timeframes: message.supported_timeframes.filter(tf => tf !== '1M' && tf !== 'M1') });
          }
          break;
          
        case 'subscribed':
          const subscriptions = new Map(state.subscriptions);
          subscriptions.set(message.symbol, {
            symbol: message.symbol,
            timeframe: message.timeframe,
            dataTypes: message.data_types,
            subscribedAt: new Date()
          });
          set({ subscriptions });
          get().addLog(`Subscribed to ${message.symbol} (${message.timeframe})`, 'success');
          break;
          
        case 'unsubscribed':
          const newSubscriptions = new Map(state.subscriptions);
          newSubscriptions.delete(message.symbol);
          const newTickData = new Map(state.tickData);
          newTickData.delete(message.symbol);
          const newOhlcData = new Map(state.ohlcData);
          newOhlcData.delete(message.symbol);
          const newInitialReceived = new Set(state.initialOhlcReceived);
          newInitialReceived.delete(message.symbol);
          
          set({ 
            subscriptions: newSubscriptions,
            tickData: newTickData,
            ohlcData: newOhlcData,
            initialOhlcReceived: newInitialReceived
          });
          get().addLog(`Unsubscribed from ${message.symbol}`, 'warning');
          break;
          
        case 'initial_ohlc':
          const ohlcData = new Map(state.ohlcData);
          const initialReceived = new Set(state.initialOhlcReceived);
          const ohlcByTimeframe_init = new Map(state.ohlcByTimeframe || new Map());

          // Top-level default timeframe buffer (kept for backward compatibility)
          ohlcData.set(message.symbol, {
            symbol: message.symbol,
            timeframe: message.timeframe,
            bars: message.data,
            lastUpdate: new Date()
          });

          // Populate multi-timeframe buffer
          const perSymbol_init = new Map(ohlcByTimeframe_init.get(message.symbol) || new Map());
          perSymbol_init.set(message.timeframe, {
            symbol: message.symbol,
            timeframe: message.timeframe,
            bars: message.data,
            lastUpdate: new Date()
          });
          ohlcByTimeframe_init.set(message.symbol, perSymbol_init);

          initialReceived.add(message.symbol);

          set({ 
            ohlcData,
            ohlcByTimeframe: ohlcByTimeframe_init,
            initialOhlcReceived: initialReceived
          });
          get().addLog(`Received ${message.data.length} initial OHLC bars for ${message.symbol}`, 'info');
          
          // Trigger calculations when initial data is received
          setTimeout(() => {
            get().recalculateAllRsi();
            if (state.settings.calculationMode === 'real_correlation') {
              get().calculateAllCorrelations();
            }
          }, 200);
          break;
          
        case 'ticks':
          const tickData = new Map(state.tickData);
          message.data.forEach(tick => {
            const existing = tickData.get(tick.symbol) || { ticks: [], lastUpdate: null };
            existing.ticks = [tick, ...existing.ticks.slice(0, 49)]; // Keep last 50 ticks
            existing.lastUpdate = new Date();
            tickData.set(tick.symbol, existing);
          });
          set({ tickData });
          break;
          
        case 'ohlc_update':
          const currentOhlcData = new Map(state.ohlcData);
          const currentByTf = new Map(state.ohlcByTimeframe || new Map());

          // Normalize timestamp helper to align numeric epoch and ISO strings
          const toTime = (t) => {
            const n = Number(t);
            return Number.isFinite(n) ? n : Date.parse(t);
          };

          // Ensure top-level buffer exists and update
          let symbolData = currentOhlcData.get(message.data.symbol);
          if (!symbolData) {
            symbolData = {
              symbol: message.data.symbol,
              timeframe: message.data.timeframe,
              bars: [],
              lastUpdate: new Date()
            };
          }

          // Update the most recent bar or add new one for top-level buffer
          {
            const bars = Array.isArray(symbolData.bars) ? [...symbolData.bars] : [];
            const lastBar = bars[bars.length - 1];
            if (lastBar && toTime(lastBar.time) === toTime(message.data.time)) {
              bars[bars.length - 1] = message.data;
            } else {
              bars.push(message.data);
              if (bars.length > 100) {
                bars.shift();
              }
              get().addLog(`New candle: ${message.data.symbol} - ${message.data.close}`, 'info');
            }
            symbolData.bars = bars;
            symbolData.timeframe = message.data.timeframe;
            symbolData.lastUpdate = new Date();
            currentOhlcData.set(message.data.symbol, symbolData);
          }

          // Update multi-timeframe buffer (robust even without initial_ohlc)
          {
            const perSymbolTf = new Map(currentByTf.get(message.data.symbol) || new Map());
            const existingTfData = perSymbolTf.get(message.data.timeframe);
            const tfBars = existingTfData && Array.isArray(existingTfData.bars) ? [...existingTfData.bars] : [];
            const tfLast = tfBars[tfBars.length - 1];
            if (tfLast && toTime(tfLast.time) === toTime(message.data.time)) {
              tfBars[tfBars.length - 1] = message.data;
            } else {
              tfBars.push(message.data);
              if (tfBars.length > 100) {
                tfBars.shift();
              }
            }
            perSymbolTf.set(message.data.timeframe, {
              symbol: message.data.symbol,
              timeframe: message.data.timeframe,
              bars: tfBars,
              lastUpdate: new Date()
            });
            currentByTf.set(message.data.symbol, perSymbolTf);
          }

          set({ ohlcData: currentOhlcData, ohlcByTimeframe: currentByTf });

          // Recalculate RSI on every update; calculation excludes forming bar based on timeframe
          setTimeout(() => {
            get().recalculateAllRsi();
            if (state.settings.calculationMode === 'real_correlation') {
              get().calculateAllCorrelations();
            }
          }, 100);
          break;
          
        case 'pong':
          get().addLog('Pong received', 'info');
          break;
          
        case 'error':
          get().addLog(`Error: ${message.error}`, 'error');
          break;
          
        default:
      }
    },
    
    // Settings Actions
    updateSettings: (newSettings) => {
      const state = get();
      const oldSettings = state.settings;
      const updatedSettings = { ...oldSettings, ...newSettings };
      
      set({ settings: updatedSettings });
      
      // If timeframe changed, update all subscriptions
      if (newSettings.timeframe && newSettings.timeframe !== oldSettings.timeframe) {
        
        const { subscribe } = get();
        const currentSubscriptions = Array.from(state.subscriptions.entries());
        
        // Update subscriptions to use new timeframe
        const updatedSubscriptions = new Map();
        currentSubscriptions.forEach(([symbol, subscription]) => {
          
          // Update subscription info with new timeframe
          const updatedSubscription = {
            ...subscription,
            timeframe: newSettings.timeframe
          };
          updatedSubscriptions.set(symbol, updatedSubscription);
          
          // Subscribe to new timeframe
          subscribe(symbol, newSettings.timeframe, subscription.dataTypes || ['ticks', 'ohlc']);
        });
        
        // Update subscriptions map
        set({ subscriptions: updatedSubscriptions });
        
        // Recalculate RSI with new timeframe data
        setTimeout(() => {
          get().recalculateAllRsi();
          if (updatedSettings.calculationMode === 'real_correlation') {
            get().calculateAllCorrelations();
          }
        }, 1500);
      }
      
      // If RSI settings changed, recalculate
      if (newSettings.rsiPeriod || newSettings.rsiOverbought || newSettings.rsiOversold) {
        get().recalculateAllRsi();
      }
      
      // If correlation window changed, recalculate correlations
      if (newSettings.correlationWindow && newSettings.correlationWindow !== oldSettings.correlationWindow) {
        if (updatedSettings.calculationMode === 'real_correlation') {
          get().calculateAllCorrelations();
        }
      }
      
      // If calculation mode changed, recalculate appropriate metrics
      if (newSettings.calculationMode && newSettings.calculationMode !== oldSettings.calculationMode) {
        if (newSettings.calculationMode === 'real_correlation') {
          get().calculateAllCorrelations();
        } else {
          get().recalculateAllRsi();
        }
      }
    },
    
    // RSI Calculation Actions
    // Note: RSI is now calculated server-side and received via WebSocket
    // This function is kept for backward compatibility but should not perform calculations
    calculateRsi: (_symbol, _period = 14) => {
      // RSI calculations are now done server-side
      // This function should be replaced with server data retrieval
      console.warn('calculateRsi called but calculations are now server-side');
      return null;
    },

    // Rolling Correlation Calculation
    // Note: Correlation calculations are now performed server-side
    // This function is kept for backward compatibility but should not perform calculations
    calculateRollingCorrelation: (_symbol1, _symbol2, _window = 50) => {
      // Correlation calculations are now done server-side
      // This function should be replaced with server data retrieval
      console.warn('calculateRollingCorrelation called but calculations are now server-side');
      return null;
    },
    
      // Calculate all correlations
    calculateAllCorrelations: () => {
      // Note: Correlation calculations are now performed server-side
      // This function should be updated to process correlation data received from WebSocket
      // For now, it's a no-op placeholder
      // Note: correlations are now calculated server-side - no console warning needed
      
      // The server should send correlation values via WebSocket messages
      // Components should listen for those messages and update state accordingly
      
      // Placeholder: maintain existing state structure but don't calculate
      // In a full implementation, this would process server-sent correlation data
    },

    recalculateAllRsi: () => {
      // Note: RSI calculations are now performed server-side
      // This function should be updated to process RSI data received from WebSocket
      // For now, it's a no-op placeholder
      // Note: RSI is now calculated server-side - no console warning needed
      
      // The server should send RSI values via WebSocket messages
      // Components should listen for those messages and update state accordingly
      
      // Placeholder: maintain existing state structure but don't calculate
      // In a full implementation, this would process server-sent RSI data
    },

    
    
    // Utility Actions
    addLog: (message, type = 'info') => {
      const logs = get().logs;
      const newLog = {
        id: Date.now(),
        timestamp: new Date(),
        message,
        type
      };
      set({ logs: [newLog, ...logs.slice(0, 99)] }); // Keep last 100 logs
    },

    clearLogs: () => {
      set({ logs: [] });
    },

    // Data Getters
    getOhlcForSymbol: (symbol) => {
      // Prefer the active timeframe's bars when available (multi-timeframe buffer)
      const tf = get().settings?.timeframe;
      const byTf = get().ohlcByTimeframe?.get(symbol);

      const tfAliases = (t) => {
        switch (t) {
          case '1M': return ['1M', 'M1'];
          case '5M': return ['5M', 'M5'];
          case '15M': return ['15M', 'M15'];
          case '30M': return ['30M', 'M30'];
          case '1H': return ['1H', 'H1'];
          case '4H': return ['4H', 'H4'];
          case '1D': return ['1D', 'D1'];
          case '1W': return ['1W', 'W1'];
          default: return [t];
        }
      };

      if (tf && byTf) {
        const keys = tfAliases(tf);
        for (const key of keys) {
          const tfData = byTf.get(key);
          if (tfData && Array.isArray(tfData.bars) && tfData.bars.length > 0) {
            return tfData.bars;
          }
        }
      }

      // Fallback: top-level buffer, but only if timeframe matches active timeframe
      const ohlcData = get().ohlcData.get(symbol);
      if (ohlcData && tf) {
        const aliases = tfAliases(tf);
        if (aliases.includes(ohlcData.timeframe)) {
          return ohlcData.bars || [];
        }
        return [];
      }
      return ohlcData ? (ohlcData.bars || []) : [];
    },

    getTicksForSymbol: (symbol) => {
      const tickData = get().tickData.get(symbol);
      return tickData ? tickData.ticks : [];
    },

    // Auto-subscription for correlation pairs
    autoSubscribeToCorrelationPairs: (force = false) => {
      const state = get();
      if (!state.isConnected) return;

      const { subscribe } = get();
      const allPairs = [...state.correlationPairs.positive, ...state.correlationPairs.negative];
      
      allPairs.forEach(([symbol1, symbol2]) => {
        const sym1 = symbol1 + 'm';
        const sym2 = symbol2 + 'm';
        
        if (force || !state.subscriptions.has(sym1)) {
          subscribe(sym1, state.settings.timeframe, ['ticks', 'ohlc']);
        }
        if (force || !state.subscriptions.has(sym2)) {
          subscribe(sym2, state.settings.timeframe, ['ticks', 'ohlc']);
        }
      });
      
    }
  }))
);

export default useRSICorrelationStore;
