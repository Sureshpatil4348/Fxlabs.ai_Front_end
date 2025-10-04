import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import useBaseMarketStore from './useBaseMarketStore';
import indicatorService from '../services/indicatorService';
import websocketService from '../services/websocketService';
// Note: All calculations are now performed server-side
// RSI, RFI, and other indicators should be received from WebSocket/API


// Note: formatSymbol function removed as it's no longer used

const useRSITrackerStore = create(
  subscribeWithSelector((set, get) => ({
    // Connection state (now managed by shared WebSocket service)
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    pendingWatchlistSubscriptions: new Set(), // symbols waiting to be subscribed
    
    // Market data
    subscriptions: new Map(), // symbol -> subscription info
    tickData: new Map(),      // symbol -> latest ticks
    indicatorData: new Map(), // symbol -> indicator snapshots
    
    // RSI Data
    rsiData: new Map(), // symbol -> RSI values
    // RSI Data by timeframe for precise widget updates
    rsiDataByTimeframe: new Map(), // symbol -> Map(timeframe -> { value, period, timeframe, updatedAt })
    
    // RFI Data
    rfiData: new Map(), // symbol -> RFI analysis
    
    // RSI Historical Data
    rsiHistory: new Map(), // symbol -> array of historical RSI values with timestamps (legacy)
    rsiHistoryByTimeframe: new Map(), // symbol -> Map(timeframe -> array of { time, value })
    
    // RSI Event Tracking
    rsiEvents: new Map(), // symbol -> array of crossdown/crossup events
    
    // Price History for Sparklines
    priceHistory: new Map(), // symbol -> array of price data for sparklines
    
    // Dashboard-specific settings
    settings: {
      timeframe: '4H',
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      autoSubscribeSymbols: [
        'EURUSDm', 'GBPUSDm', 'USDJPYm', 'USDCHFm', 'AUDUSDm', 'USDCADm', 'NZDUSDm',
        'EURGBPm', 'EURJPYm', 'EURCHFm', 'EURAUDm', 'EURCADm', 'EURNZDm',
        'GBPJPYm', 'GBPCHFm', 'GBPAUDm', 'GBPCADm', 'GBPNZDm',
        'AUDJPYm', 'AUDCHFm', 'AUDCADm', 'AUDNZDm',
        'CADJPYm', 'CADCHFm', 'CHFJPYm', 'NZDJPYm', 'NZDCHFm', 'NZDCADm',
        // Precious Metals
        'XAUUSDm', 'XAGUSDm',
        // Cryptocurrencies
        'BTCUSDm', 'ETHUSDm'
      ],
      pairSet: 'all' // 'core', 'extended', 'all' - for filtering
    },
    
    // UI state
    logs: [],
    // Remove 1M from selectable timeframes for RSI Tracker
    timeframes: ['5M', '15M', '30M', '1H', '4H', '1D', '1W'],
    // Internal logging memo to avoid duplicate [CLOSE] prints
    _loggedClosedBars: new Set(), // keys: `${symbol}|${timeframe}|${timestampMs}`
    
    // Connection Actions
    connect: () => {
      const state = get();
      if (state.isConnected || state.isConnecting) return;
      
      set({ isConnecting: true, connectionError: null });
      
      // Register with centralized message router
      websocketService.registerStore('rsiTracker', {
        messageHandler: (message, _rawData) => {
          try {
            get().handleMessage(message);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[RSITracker] handleMessage error:', e);
          }
        },
        connectionCallback: () => {
          set({ isConnected: true, isConnecting: false });
          get().addLog('Connected to Market v2 (RSI Tracker probe)', 'success');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiTracker', {
              connected: true,
              connecting: false,
              error: null
            });
          });
        },
        disconnectionCallback: () => {
          set({ 
            isConnected: false, 
            isConnecting: false
          });
          get().addLog('Disconnected from Market v2 (RSI Tracker probe)', 'warning');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiTracker', {
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
          get().addLog('Connection error (RSI Tracker v2 probe)', 'error');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiTracker', {
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
      websocketService.unregisterStore('rsiTracker');
      
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
    unsubscribe: (symbol, timeframe) => {
      get().addLog(`(probe) Unsubscribe skipped for ${symbol}${timeframe ? ' @ ' + timeframe : ''}`, 'warning');
      // Note: unsubscribe() is disabled in probe mode - no console warning needed
    },
    
    handleMessage: (message) => {
      const state = get();
      
      switch (message.type) {
        case 'connected':
          get().addLog(`Welcome: ${message.message}`, 'success');
          if (message.supported_timeframes) {
            set({ timeframes: message.supported_timeframes });
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
          {
            const newSubscriptions = new Map(state.subscriptions);
            const newTickData = new Map(state.tickData);
            const newIndicatorData = new Map(state.indicatorData);

            const tf = message?.timeframe;
            if (tf) {
              // Remove only the unsubscribed timeframe data
              newIndicatorData.delete(message.symbol);
              newTickData.delete(message.symbol);
              newSubscriptions.delete(message.symbol);
            } else {
              // Remove all data for the symbol (legacy behavior)
              newIndicatorData.delete(message.symbol);
              newTickData.delete(message.symbol);
              newSubscriptions.delete(message.symbol);
            }

            set({ 
              subscriptions: newSubscriptions,
              tickData: newTickData,
              indicatorData: newIndicatorData
            });
            get().addLog(`Unsubscribed from ${message.symbol}${message?.timeframe ? ' ('+message.timeframe+')' : ''}`, 'warning');
            break;
          }
          
        case 'initial_indicators':
          {
            // Normalize payload to support both top-level and nested fields
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

            // Maintain backward-compatible flat fields using latest update
            existing.symbol = symbol;
            if (timeframe) existing.timeframe = timeframe;
            existing.indicators = indicators;
            existing.barTime = barTime;
            existing.lastUpdate = new Date();
            existing.timeframes = tfMap;

            indicatorDataMap.set(symbol, existing);
            set({ indicatorData: indicatorDataMap });
            get().addLog(`Received initial indicators for ${symbol}${timeframe ? ' (' + timeframe + ')' : ''}`, 'info');

            // Update RSI data if available
            if (indicators && indicators.rsi) {
              const rsiPeriodKey = Object.keys(indicators.rsi)[0];
              const rsiValue = indicators.rsi[rsiPeriodKey];
              if (typeof rsiValue === 'number') {
                // Store per-timeframe RSI
                const rsiByTfMap = new Map(state.rsiDataByTimeframe || new Map());
                const symTfMap = rsiByTfMap.get(symbol) instanceof Map ? rsiByTfMap.get(symbol) : new Map(rsiByTfMap.get(symbol) || []);
                if (timeframe) {
                  symTfMap.set(timeframe, {
                    value: rsiValue,
                    period: rsiPeriodKey,
                    timeframe,
                    updatedAt: new Date()
                  });
                }
                rsiByTfMap.set(symbol, symTfMap);
                set({ rsiDataByTimeframe: rsiByTfMap });

                // Update flat RSI only if this timeframe matches current tracker setting
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
            // Handle live indicator updates with normalized payload
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

            // Maintain backward-compatible flat fields using latest update
            existing.symbol = symbol;
            if (timeframe) existing.timeframe = timeframe;
            existing.indicators = indicators;
            existing.barTime = barTime;
            existing.lastUpdate = new Date();
            existing.timeframes = tfMap;

            indicatorDataMap.set(symbol, existing);
            set({ indicatorData: indicatorDataMap });
            
            // Update RSI data if available
            if (indicators && indicators.rsi) {
              const rsiPeriodKey = Object.keys(indicators.rsi)[0];
              const rsiValue = indicators.rsi[rsiPeriodKey];
              if (typeof rsiValue === 'number') {
                // Store per-timeframe RSI
                const rsiByTfMap = new Map(state.rsiDataByTimeframe || new Map());
                const symTfMap = rsiByTfMap.get(symbol) instanceof Map ? rsiByTfMap.get(symbol) : new Map(rsiByTfMap.get(symbol) || []);
                if (timeframe) {
                  symTfMap.set(timeframe, {
                    value: rsiValue,
                    period: rsiPeriodKey,
                    timeframe,
                    updatedAt: new Date()
                  });
                }
                rsiByTfMap.set(symbol, symTfMap);
                set({ rsiDataByTimeframe: rsiByTfMap });

                // Update flat RSI only if this timeframe matches current tracker setting
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
                
                // Maintain minimal RSI history per symbol for event tracking
                const historyMap = new Map(get().rsiHistory);
                const hist = [...(historyMap.get(symbol) || [])];
                hist.push({ time: Date.now(), value: rsiValue });
                if (hist.length > 200) hist.shift();
                historyMap.set(symbol, hist);
                set({ rsiHistory: historyMap });

                // Maintain per-timeframe RSI history
                if (timeframe) {
                  const historyByTf = new Map(get().rsiHistoryByTimeframe || new Map());
                  const symTfHistMap = historyByTf.get(symbol) instanceof Map ? historyByTf.get(symbol) : new Map(historyByTf.get(symbol) || []);
                  const tfHist = [...(symTfHistMap.get(timeframe) || [])];
                  tfHist.push({ time: Date.now(), value: rsiValue });
                  if (tfHist.length > 200) tfHist.shift();
                  symTfHistMap.set(timeframe, tfHist);
                  historyByTf.set(symbol, symTfHistMap);
                  set({ rsiHistoryByTimeframe: historyByTf });
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
      // Ignore rsiPeriod updates; RSI period is fixed at 14
      const { rsiPeriod: _ignoredRsiPeriod, ...rest } = newSettings || {};
      const updatedSettings = { ...oldSettings, ...rest, rsiPeriod: 14 };
      
      set({ settings: updatedSettings });
      
      // If timeframe changed, update all subscriptions
      if (updatedSettings.timeframe && updatedSettings.timeframe !== oldSettings.timeframe) {
        // TODO: Fetch initial snapshot for the new timeframe to pre-populate UI while waiting for websocket
        // Reset relevant data to show blank values until new data arrives
        set({
          rsiData: new Map(),
          rsiDataByTimeframe: new Map(),
          indicatorData: new Map(),
          // Optional: clear tickData as well to avoid showing stale prices
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
          subscribe(symbol, updatedSettings.timeframe, subscription.dataTypes || ['ticks', 'indicators']);
        });
        
        // Update subscriptions map
        set({ subscriptions: updatedSubscriptions });
        
        // Recalculate RSI with new timeframe data
        setTimeout(() => {
          get().recalculateAllRsi();
        }, 1500);

        // Fire-and-forget REST snapshot fetch to pre-populate RSI values quickly
        (async () => {
          try {
            const symbols = (updatedSettings.autoSubscribeSymbols || state.settings.autoSubscribeSymbols || []).slice(0, 32);
            if (symbols.length === 0) return;
            const res = await indicatorService.fetchIndicatorSnapshot({
              indicator: 'rsi',
              timeframe: updatedSettings.timeframe,
              pairs: symbols
            });
            const pairs = res?.pairs || [];
            if (pairs.length > 0) {
              const newRsiData = new Map(get().rsiData);
              pairs.forEach((p) => {
                newRsiData.set(p.symbol, {
                  value: p.value,
                  period: 14,
                  timeframe: p.timeframe,
                  updatedAt: new Date(p.ts || Date.now())
                });
              });
              set({ rsiData: newRsiData });
            }
          } catch (_e) {
            // Silent fail; websocket will populate shortly
          }
        })();
      }
      
      // If RSI thresholds changed, recalculate (period is fixed)
      if (newSettings.rsiOverbought || newSettings.rsiOversold) {
        get().recalculateAllRsi();
      }
    },
    
    // RSI Calculation Actions
    // Note: RSI is now calculated server-side and received via WebSocket
    // This function is kept for backward compatibility but should not perform calculations
    calculateRsi: (_symbol, _period = 14) => {
      // RSI calculations are now done server-side
      // This function should be replaced with server data retrieval
      // Note: RSI is now calculated server-side - no console warning needed
      return null;
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

    // RSI Event Tracking
    trackRsiEvents: (symbol, currentRsi, eventsMap) => {
      const state = get();
      const { rsiOverbought, rsiOversold } = state.settings;
      
      if (!eventsMap.has(symbol)) {
        eventsMap.set(symbol, []);
      }
      
      const events = eventsMap.get(symbol);
      const history = state.rsiHistory.get(symbol) || [];
      
      // Need at least 2 data points to detect events
      if (history.length < 2) return;
      
      const previousRsi = history[history.length - 2].value;
      const currentTime = new Date();
      
      // Detect crossdown events (RSI crossing below oversold threshold)
      if (previousRsi > rsiOversold && currentRsi <= rsiOversold) {
        events.push({
          type: 'crossdown',
          rsi: currentRsi,
          threshold: rsiOversold,
          timestamp: currentTime,
          description: `RSI crossed below oversold (${rsiOversold})`
        });
      }
      
      // Detect crossup events (RSI crossing above overbought threshold)
      if (previousRsi < rsiOverbought && currentRsi >= rsiOverbought) {
        events.push({
          type: 'crossup',
          rsi: currentRsi,
          threshold: rsiOverbought,
          timestamp: currentTime,
          description: `RSI crossed above overbought (${rsiOverbought})`
        });
      }
      
      // Detect exit from oversold (RSI crossing above oversold threshold)
      if (previousRsi <= rsiOversold && currentRsi > rsiOversold) {
        events.push({
          type: 'exit_oversold',
          rsi: currentRsi,
          threshold: rsiOversold,
          timestamp: currentTime,
          description: `RSI exited oversold zone (${rsiOversold})`
        });
      }
      
      // Detect exit from overbought (RSI crossing below overbought threshold)
      if (previousRsi >= rsiOverbought && currentRsi < rsiOverbought) {
        events.push({
          type: 'exit_overbought',
          rsi: currentRsi,
          threshold: rsiOverbought,
          timestamp: currentTime,
          description: `RSI exited overbought zone (${rsiOverbought})`
        });
      }
      
      // Keep only last 20 events per symbol
      if (events.length > 20) {
        events.shift();
      }
    },

    

    // Get recent RSI events for a symbol
    getRsiEvents: (symbol, limit = 5) => {
      const events = get().rsiEvents.get(symbol) || [];
      return events.slice(-limit).reverse(); // Most recent first
    },

    // Get RSI history for a symbol
    getRsiHistory: (symbol, limit = 20) => {
      const history = get().rsiHistory.get(symbol) || [];
      return history.slice(-limit);
    },

    // Get price history for sparklines
    getPriceHistory: (symbol, limit = 20) => {
      const history = get().priceHistory.get(symbol) || [];
      return history.slice(-limit);
    },

    // RFI Calculation Actions
    recalculateAllRfi: () => {
      // Note: RFI calculations are now performed server-side
      // This function should be updated to process RFI data received from WebSocket
      // For now, it's a no-op placeholder
      // Note: RFI is now calculated server-side - no console warning needed
      
      // The server should send RFI values via WebSocket messages
      // Components should listen for those messages and update state accordingly
      
      // Placeholder: maintain existing state structure but don't calculate
      // In a full implementation, this would process server-sent RFI data
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

    // Merge REST pricing snapshot entries into tickData as synthetic ticks
    ingestPricingSnapshot: (entries) => {
      if (!Array.isArray(entries) || entries.length === 0) return;
      const state = get();
      const tickData = new Map(state.tickData);
      entries.forEach((p) => {
        if (!p || !p.symbol) return;
        const syntheticTick = {
          symbol: p.symbol,
          time: typeof p.time === 'number' ? p.time : Date.now(),
          time_iso: p.time_iso || new Date().toISOString(),
          bid: p.bid,
          ask: p.ask,
          volume: typeof p.volume === 'number' ? p.volume : 0,
          daily_change_pct: typeof p.daily_change_pct === 'number' ? p.daily_change_pct : 0
        };
        const existing = tickData.get(p.symbol) || { ticks: [], lastUpdate: null };
        existing.ticks = [syntheticTick, ...existing.ticks.slice(0, 49)];
        existing.lastUpdate = new Date(syntheticTick.time);
        tickData.set(p.symbol, existing);
      });
      set({ tickData });
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

    // Get RSI for a symbol and timeframe (falls back to flat rsiData)
    getRsiForSymbolTimeframe: (symbol, timeframe) => {
      const symTfMap = get().rsiDataByTimeframe.get(symbol);
      if (symTfMap && timeframe) {
        const entry = symTfMap.get(timeframe);
        if (entry) return entry;
      }
      return get().rsiData.get(symbol) || null;
    },

    getTicksForSymbol: (symbol) => {
      const tickData = get().tickData.get(symbol);
      return tickData ? tickData.ticks : [];
    },

    getLatestTickForSymbol: (symbol) => {
      const ticks = get().getTicksForSymbol(symbol);
      return ticks.length > 0 ? ticks[0] : null;
    },

    getDailyChangePercent: (symbol) => {
      const latestTick = get().getLatestTickForSymbol(symbol);
      // Use server-provided daily_change_pct when available
      if (latestTick && typeof latestTick.daily_change_pct === 'number') {
        return latestTick.daily_change_pct;
      }
      // Fallback to 0 if no tick data available
      return 0;
    },

    // RSI Analysis Functions
    getOversoldPairs: () => {
      const state = get();
      const oversold = [];
      
      state.rsiData.forEach((rsiInfo, symbol) => {
        if (rsiInfo.value <= state.settings.rsiOversold) {
          const latestTick = get().getLatestTickForSymbol(symbol);
          const rfiData = state.rfiData.get(symbol);
          
          oversold.push({
            symbol,
            rsi: rsiInfo.value,
            rfiData,
            price: latestTick?.bid || 0,
            // Daily % based on server-provided daily_change_pct
            change: get().getDailyChangePercent(symbol),
            volume: 0 // Volume not available from tick data
          });
        }
      });
      
      return oversold.sort((a, b) => a.rsi - b.rsi);
    },

    getOverboughtPairs: () => {
      const state = get();
      const overbought = [];
      
      state.rsiData.forEach((rsiInfo, symbol) => {
        if (rsiInfo.value >= state.settings.rsiOverbought) {
          const latestTick = get().getLatestTickForSymbol(symbol);
          const rfiData = state.rfiData.get(symbol);
          
          overbought.push({
            symbol,
            rsi: rsiInfo.value,
            rfiData,
            price: latestTick?.bid || 0,
            // Daily % based on server-provided daily_change_pct
            change: get().getDailyChangePercent(symbol),
            volume: 0 // Volume not available from tick data
          });
        }
      });
      
      return overbought.sort((a, b) => b.rsi - a.rsi);
    },

    // Enhanced analysis functions with RFI
    getAllPairsWithRFI: () => {
      const state = get();
      const allPairs = [];
      
      state.rsiData.forEach((rsiInfo, symbol) => {
        const latestTick = get().getLatestTickForSymbol(symbol);
        const rfiData = state.rfiData.get(symbol);
        
        allPairs.push({
          symbol,
          rsi: rsiInfo.value,
          rfiData,
          price: latestTick?.bid || 0,
          // Daily % based on server-provided daily_change_pct
          change: get().getDailyChangePercent(symbol),
          volume: 0 // Volume not available from tick data
        });
      });
      
      return allPairs;
    },

    // Auto-subscription for major pairs
    autoSubscribeToMajorPairs: () => {
      const state = get();
      if (!state.isConnected) return;

      const { subscribe } = get();
      
      state.settings.autoSubscribeSymbols.forEach(symbol => {
        if (!state.subscriptions.has(symbol)) {
          subscribe(symbol, state.settings.timeframe, ['ticks', 'indicators']);
        }
      });
      
    },

    // Wishlist integration with base store (async database operations)
    addToWishlist: async (symbol) => {
      try {
        await useBaseMarketStore.getState().addToWishlist(symbol);
        get().addLog(`Added ${symbol} to watchlist`, 'success');
      } catch (error) {
        get().addLog(`Failed to add ${symbol} to watchlist: ${error.message}`, 'error');
        throw error;
      }
    },

    removeFromWishlist: async (symbol) => {
      try {
        await useBaseMarketStore.getState().removeFromWishlist(symbol);
        get().addLog(`Removed ${symbol} from watchlist`, 'success');
      } catch (error) {
        get().addLog(`Failed to remove ${symbol} from watchlist: ${error.message}`, 'error');
        throw error;
      }
    },

    isInWishlist: (symbol) => {
      return useBaseMarketStore.getState().isInWishlist(symbol);
    },

    // Handle watchlist symbol subscription
    subscribeWatchlistSymbol: (symbol) => {
      const state = get();
      let normalized = (symbol || "").trim().toUpperCase();
      
      // Add 'm' suffix for RSI Tracker compatibility if not already present
      if (!normalized.endsWith('M') && !normalized.endsWith('m')) {
        normalized = normalized + 'm';
      }
      
      if (state.isConnected && !state.subscriptions.has(normalized)) {
        // Subscribe immediately if connected
        get().subscribe(normalized, state.settings.timeframe, ['ticks', 'indicators']);
        // TODO: Fetch initial indicator/tick snapshot for {normalized, timeframe}
        // UI will show placeholders until websocket updates arrive
      } else if (!state.isConnected) {
        // Add to pending subscriptions if not connected
        const pending = new Set(state.pendingWatchlistSubscriptions);
        pending.add(normalized);
        set({ pendingWatchlistSubscriptions: pending });
        
        // Try to connect if not already connecting
        if (!state.isConnecting) {
          get().connect();
        }
      }
    }
  }))
);

export default useRSITrackerStore;
