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
    indicatorData: new Map(), // symbol -> indicator snapshots
    
    // RSI Data
    rsiData: new Map(), // symbol -> RSI values (active timeframe only)
    rsiDataByTimeframe: new Map(), // symbol -> Map(timeframe -> { value, period, timeframe, updatedAt })
    
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
        messageHandler: (message, _rawData) => {
          try {
            get().handleMessage(message);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[RSICorrelation] handleMessage error:', e);
          }
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
            indicatorData: new Map()
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
        subscribedMessageTypes: ['connected', 'subscribed', 'unsubscribed', 'initial_indicators', 'ticks', 'indicator_update', 'pong', 'error']
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
        indicatorData: new Map()
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
          const newIndicatorData = new Map(state.indicatorData);
          newIndicatorData.delete(message.symbol);
          
          set({ 
            subscriptions: newSubscriptions,
            tickData: newTickData,
            indicatorData: newIndicatorData
          });
          get().addLog(`Unsubscribed from ${message.symbol}`, 'warning');
          break;
          
        case 'initial_indicators':
          {
            const symbol = message.symbol || message?.data?.symbol;
            const timeframe = (message.timeframe || message?.data?.timeframe || '').toUpperCase();
            const indicators = message?.data?.indicators || message?.indicators;
            const barTime = message?.data?.bar_time ?? message?.bar_time;

            if (!symbol || !indicators) break;

            const indicatorDataMap = new Map(state.indicatorData || new Map());
            const existing = indicatorDataMap.get(symbol) || { symbol, timeframes: new Map() };
            const tfMap = existing.timeframes instanceof Map ? existing.timeframes : new Map(existing.timeframes || []);

            if (timeframe) {
              tfMap.set(timeframe, {
                indicators,
                barTime,
                lastUpdate: new Date()
              });
            }

            existing.symbol = symbol;
            if (timeframe) existing.timeframe = timeframe;
            existing.indicators = indicators;
            existing.barTime = barTime;
            existing.lastUpdate = new Date();
            existing.timeframes = tfMap;

            indicatorDataMap.set(symbol, existing);
            set({ indicatorData: indicatorDataMap });
            get().addLog(`Received initial indicators for ${symbol}${timeframe ? ' (' + timeframe + ')' : ''}`, 'info');

            if (indicators && indicators.rsi) {
              const rsiPeriodKey = Object.keys(indicators.rsi)[0];
              const rsiValue = indicators.rsi[rsiPeriodKey];
              if (typeof rsiValue === 'number') {
                // Store per-timeframe RSI
                const byTf = new Map(state.rsiDataByTimeframe || new Map());
                const symTfMap = byTf.get(symbol) instanceof Map ? byTf.get(symbol) : new Map(byTf.get(symbol) || []);
                if (timeframe) {
                  symTfMap.set(timeframe, {
                    value: rsiValue,
                    period: rsiPeriodKey,
                    timeframe,
                    updatedAt: new Date()
                  });
                }
                byTf.set(symbol, symTfMap);
                set({ rsiDataByTimeframe: byTf });

                // Update flat RSI only if this timeframe matches current dashboard setting
                if (!timeframe || timeframe === state.settings.timeframe) {
                  const newRsiData = new Map(state.rsiData);
                  newRsiData.set(symbol, {
                    value: rsiValue,
                    period: rsiPeriodKey,
                    timeframe: timeframe || state.settings.timeframe,
                    updatedAt: new Date()
                  });
                  set({ rsiData: newRsiData });
                }
              }
            }
          }
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
          
        case 'indicator_update':
          {
            const symbol = message.symbol || message?.data?.symbol;
            const timeframe = (message.timeframe || message?.data?.timeframe || '').toUpperCase();
            const indicators = message?.data?.indicators || message?.indicators;
            const barTime = message?.data?.bar_time ?? message?.bar_time;

            if (!symbol || !indicators) break;

            const indicatorDataMap = new Map(state.indicatorData || new Map());
            const existing = indicatorDataMap.get(symbol) || { symbol, timeframes: new Map() };
            const tfMap = existing.timeframes instanceof Map ? existing.timeframes : new Map(existing.timeframes || []);

            if (timeframe) {
              tfMap.set(timeframe, {
                indicators,
                barTime,
                lastUpdate: new Date()
              });
            }

            existing.symbol = symbol;
            if (timeframe) existing.timeframe = timeframe;
            existing.indicators = indicators;
            existing.barTime = barTime;
            existing.lastUpdate = new Date();
            existing.timeframes = tfMap;

            indicatorDataMap.set(symbol, existing);
            set({ indicatorData: indicatorDataMap });
            
            if (indicators && indicators.rsi) {
              const rsiPeriodKey = Object.keys(indicators.rsi)[0];
              const rsiValue = indicators.rsi[rsiPeriodKey];
              if (typeof rsiValue === 'number') {
                // Store per-timeframe RSI
                const byTf = new Map(state.rsiDataByTimeframe || new Map());
                const symTfMap = byTf.get(symbol) instanceof Map ? byTf.get(symbol) : new Map(byTf.get(symbol) || []);
                if (timeframe) {
                  symTfMap.set(timeframe, {
                    value: rsiValue,
                    period: rsiPeriodKey,
                    timeframe,
                    updatedAt: new Date()
                  });
                }
                byTf.set(symbol, symTfMap);
                set({ rsiDataByTimeframe: byTf });

                // Update flat RSI only if this timeframe matches current dashboard setting
                if (!timeframe || timeframe === state.settings.timeframe) {
                  const newRsiData = new Map(state.rsiData);
                  newRsiData.set(symbol, {
                    value: rsiValue,
                    period: rsiPeriodKey,
                    timeframe: timeframe || state.settings.timeframe,
                    updatedAt: new Date()
                  });
                  set({ rsiData: newRsiData });
                }
              }
            }
          }
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
      // Ignore rsiPeriod and correlationWindow updates; both are fixed
      const { rsiPeriod: _ignoredRsiPeriod, correlationWindow: _ignoredCorrelationWindow, ...rest } = newSettings || {};
      const updatedSettings = { ...oldSettings, ...rest, rsiPeriod: 14, correlationWindow: 50 };
      
      set({ settings: updatedSettings });
      
      // If timeframe changed, update all subscriptions
      if (newSettings.timeframe && newSettings.timeframe !== oldSettings.timeframe) {
        // TODO: Fetch correlation snapshot for the new timeframe to pre-populate UI while waiting for websocket
        // Reset correlation and RSI maps to blank state until new data arrives
        set({
          correlationStatus: new Map(),
          realCorrelationData: new Map(),
          rsiData: new Map(),
          rsiDataByTimeframe: new Map(),
          indicatorData: new Map(),
          tickData: new Map()
        });
        
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
          subscribe(symbol, newSettings.timeframe, subscription.dataTypes || ['ticks', 'indicators']);
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
      
      // If RSI thresholds changed, recalculate (period is fixed)
      if (newSettings.rsiOverbought || newSettings.rsiOversold) {
        get().recalculateAllRsi();
      }
      
      // Correlation window is fixed at 50; no recalculation needed
      
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
    getIndicatorsForSymbol: (symbol) => {
      const indicatorData = get().indicatorData.get(symbol);
      return indicatorData ? indicatorData.indicators : null;
    },
    
    getLatestIndicatorsForSymbol: (symbol) => {
      const indicatorData = get().indicatorData.get(symbol);
      return indicatorData ? {
        indicators: indicatorData.indicators,
        barTime: indicatorData.barTime,
        lastUpdate: indicatorData.lastUpdate
      } : null;
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
          subscribe(sym1, state.settings.timeframe, ['ticks', 'indicators']);
          // TODO: Fetch initial indicator snapshot for {sym1, timeframe}
        }
        if (force || !state.subscriptions.has(sym2)) {
          subscribe(sym2, state.settings.timeframe, ['ticks', 'indicators']);
          // TODO: Fetch initial indicator snapshot for {sym2, timeframe}
        }
      });
      
    }
  }))
);

export default useRSICorrelationStore;
