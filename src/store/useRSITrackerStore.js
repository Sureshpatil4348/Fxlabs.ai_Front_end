import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import useBaseMarketStore from './useBaseMarketStore';
import websocketService from '../services/websocketService';
// Note: All calculations are now performed server-side
// RSI, RFI, and other indicators should be received from WebSocket/API

// OHLC debug logging configuration (symbol + timeframe)
const ENABLE_OHLC_DEBUG_LOGS = (
  process.env.REACT_APP_ENABLE_OHLC_DEBUG_LOGS || process.env.REACT_APP_ENABLE_BTCUSD_M1_LOGS || 'true'
).toString().toLowerCase() === 'true';
const OHLC_DEBUG_SYMBOL = process.env.REACT_APP_OHLC_DEBUG_SYMBOL || 'BTCUSDm';
const OHLC_DEBUG_TF = (process.env.REACT_APP_OHLC_DEBUG_TF || 'H4').toUpperCase();

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
    ohlcData: new Map(),      // symbol -> OHLC bars (default timeframe; kept for backward compatibility)
    ohlcByTimeframe: new Map(), // symbol -> Map(timeframe -> { symbol, timeframe, bars, lastUpdate })
    initialOhlcReceived: new Set(), // symbols that received initial OHLC
    
    // RSI Data
    rsiData: new Map(), // symbol -> RSI values
    
    // RFI Data
    rfiData: new Map(), // symbol -> RFI analysis
    
    // RSI Historical Data
    rsiHistory: new Map(), // symbol -> array of historical RSI values with timestamps
    
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
        messageHandler: (_message, _rawData) => {
          // v2 probe: no logging - handled by router
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
      websocketService.unregisterStore('rsiTracker');
      
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
            const newOhlcData = new Map(state.ohlcData);
            const newOhlcByTimeframe = new Map(state.ohlcByTimeframe);
            const newInitialReceived = new Set(state.initialOhlcReceived);

            const tf = message?.timeframe;
            if (tf) {
              // Remove only the unsubscribed timeframe buffers
              const perSymbol = new Map(newOhlcByTimeframe.get(message.symbol) || new Map());
              const tfAliases = (t) => {
                switch ((t || '').toUpperCase()) {
                  case '1M': case 'M1': return ['1M','M1'];
                  case '5M': case 'M5': return ['5M','M5'];
                  case '15M': case 'M15': return ['15M','M15'];
                  case '30M': case 'M30': return ['30M','M30'];
                  case '1H': case 'H1': return ['1H','H1'];
                  case '4H': case 'H4': return ['4H','H4'];
                  case '1D': case 'D1': return ['1D','D1'];
                  case '1W': case 'W1': return ['1W','W1'];
                  default: return [t];
                }
              };
              for (const key of tfAliases(tf)) perSymbol.delete(key);
              if (perSymbol.size > 0) {
                newOhlcByTimeframe.set(message.symbol, perSymbol);
              } else {
                newOhlcByTimeframe.delete(message.symbol);
                newOhlcData.delete(message.symbol);
                newTickData.delete(message.symbol);
                newInitialReceived.delete(message.symbol);
                newSubscriptions.delete(message.symbol);
              }
            } else {
              // Remove all timeframes for the symbol (legacy behavior)
              newOhlcByTimeframe.delete(message.symbol);
              newOhlcData.delete(message.symbol);
              newTickData.delete(message.symbol);
              newInitialReceived.delete(message.symbol);
              newSubscriptions.delete(message.symbol);
            }

            set({ 
              subscriptions: newSubscriptions,
              tickData: newTickData,
              ohlcData: newOhlcData,
              ohlcByTimeframe: newOhlcByTimeframe,
              initialOhlcReceived: newInitialReceived
            });
            get().addLog(`Unsubscribed from ${message.symbol}${message?.timeframe ? ' ('+message.timeframe+')' : ''}`, 'warning');
            break;
          }
          
        case 'initial_ohlc':
          const ohlcData = new Map(state.ohlcData);
          ohlcData.set(message.symbol, {
            symbol: message.symbol,
            timeframe: message.timeframe,
            bars: message.data,
            lastUpdate: new Date()
          });

          // Update multi-timeframe structure
          const ohlcByTimeframe = new Map(state.ohlcByTimeframe);
          const perSymbol = new Map(ohlcByTimeframe.get(message.symbol) || new Map());
          const tfEntry = {
            symbol: message.symbol,
            timeframe: message.timeframe,
            bars: message.data,
            lastUpdate: new Date()
          };
          // Store under server timeframe key
          perSymbol.set(message.timeframe, tfEntry);
          // Also store under UI-alias key (e.g., H4 -> 4H) for direct access
          const toUiAlias = (t) => {
            const u = (t || '').toUpperCase();
            switch (u) {
              case 'M1': return '1M';
              case 'M5': return '5M';
              case 'M15': return '15M';
              case 'M30': return '30M';
              case 'H1': return '1H';
              case 'H4': return '4H';
              case 'D1': return '1D';
              case 'W1': return '1W';
              default: return u;
            }
          };
          perSymbol.set(toUiAlias(message.timeframe), tfEntry);
          ohlcByTimeframe.set(message.symbol, perSymbol);

          const initialReceived = new Set(state.initialOhlcReceived);
          initialReceived.add(message.symbol);
          
          set({ 
            ohlcData,
            ohlcByTimeframe,
            initialOhlcReceived: initialReceived
          });
          get().addLog(`Received ${message.data.length} initial OHLC bars for ${message.symbol}`, 'info');
          
          // Trigger calculations ONLY for the active timeframe to avoid mixing buffers
          setTimeout(() => {
            const activeTf = get().settings?.timeframe;
            const perSymbolMap = get().ohlcByTimeframe.get(message.symbol);
            if (!activeTf || !perSymbolMap) return;
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
            let tfData = null;
            for (const key of tfAliases(activeTf)) {
              const candidate = perSymbolMap.get(key);
              if (candidate && Array.isArray(candidate.bars) && candidate.bars.length >= 15) {
                tfData = candidate;
                break;
              }
            }
            if (tfData) get().recalculateAllRsi();
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
          const toTime = (t) => {
            const n = Number(t);
            return Number.isFinite(n) ? n : Date.parse(t);
          };
          const topLevelSymbolData = currentOhlcData.get(message.data.symbol);
          if (topLevelSymbolData) {
            // Update the most recent bar or add new one (top-level default timeframe)
            const bars = [...topLevelSymbolData.bars];
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
            
            topLevelSymbolData.bars = bars;
            topLevelSymbolData.lastUpdate = new Date();
            currentOhlcData.set(message.data.symbol, topLevelSymbolData);
          }

          // Update multi-timeframe map
          const currentByTf = new Map(state.ohlcByTimeframe);
          const perSymbolTf = new Map(currentByTf.get(message.data.symbol) || new Map());
          const existingTfData = perSymbolTf.get(message.data.timeframe) || perSymbolTf.get(((t)=>{
            const u=(t||'').toUpperCase();
            return ({M1:'1M',M5:'5M',M15:'15M',M30:'30M',H1:'1H',H4:'4H',D1:'1D',W1:'1W'})[u]||u;
          })(message.data.timeframe));
          const tfBars = existingTfData ? [...existingTfData.bars] : [];
          const tfLast = tfBars[tfBars.length - 1];
          const wasUpdateEvent = tfLast && toTime(tfLast.time) === toTime(message.data.time);

          // Backend now guarantees closed-minute emission for every minute.
          // No client-side backfilling required.
          if (wasUpdateEvent) {
            tfBars[tfBars.length - 1] = message.data;
          } else {
            tfBars.push(message.data);
            if (tfBars.length > 100) {
              tfBars.shift();
            }
          }
          const tfEntry2 = {
            symbol: message.data.symbol,
            timeframe: message.data.timeframe,
            bars: tfBars,
            lastUpdate: new Date()
          };
          // Store under server key and UI alias for direct keyed access
          const toUiAlias2 = (t) => {
            const u = (t || '').toUpperCase();
            switch (u) {
              case 'M1': return '1M';
              case 'M5': return '5M';
              case 'M15': return '15M';
              case 'M30': return '30M';
              case 'H1': return '1H';
              case 'H4': return '4H';
              case 'D1': return '1D';
              case 'W1': return '1W';
              default: return u;
            }
          };
          perSymbolTf.set(message.data.timeframe, tfEntry2);
          perSymbolTf.set(toUiAlias2(message.data.timeframe), tfEntry2);
          currentByTf.set(message.data.symbol, perSymbolTf);

          // OHLC debug logging: OPEN/UPDATE events and previous CLOSE with RSI(14)
          try {
            const isSymbol = message?.data?.symbol === OHLC_DEBUG_SYMBOL;
            const isTf = (() => {
              const tf = (message?.data?.timeframe || '').toUpperCase();
              if (OHLC_DEBUG_TF === '1M') return tf === '1M' || tf === 'M1';
              if (OHLC_DEBUG_TF === '5M') return tf === '5M' || tf === 'M5';
              if (OHLC_DEBUG_TF === '15M') return tf === '15M' || tf === 'M15';
              if (OHLC_DEBUG_TF === '30M') return tf === '30M' || tf === 'M30';
              if (OHLC_DEBUG_TF === '1H') return tf === '1H' || tf === 'H1';
              if (OHLC_DEBUG_TF === '4H') return tf === '4H' || tf === 'H4';
              if (OHLC_DEBUG_TF === '1D') return tf === '1D' || tf === 'D1';
              if (OHLC_DEBUG_TF === '1W') return tf === '1W' || tf === 'W1';
              return tf === OHLC_DEBUG_TF;
            })();
            if (ENABLE_OHLC_DEBUG_LOGS && isSymbol && isTf) {
              const toMs = (t) => {
                const n = Number(t);
                return Number.isFinite(n) ? n : Date.parse(t);
              };

              const isUpdate = wasUpdateEvent;

              const tsMs = toMs(message.data.time);
              const dt = new Date(tsMs);
              const iso = dt.toISOString();
              const dateStr = iso.slice(0, 10);
              const timeStr = iso.slice(11, 19);

              const o = Number(message.data.open);
              const h = Number(message.data.high);
              const l = Number(message.data.low);
              const c = Number(message.data.close);

              // Note: RSI calculations removed - should come from server
              // Debug logging now shows only OHLC data

              // Log CLOSE only when previous bar is explicitly closed and not yet logged
              if (tfBars.length > 1) {
                const prev = tfBars[tfBars.length - 2];
                if (prev && prev.is_closed === true) {
                  const prevKey = `${message.data.symbol}|${message.data.timeframe}|${toMs(prev.time)}`;
                  const logged = get()._loggedClosedBars;
                  if (!logged.has(prevKey)) {
                    const prevTs = toMs(prev?.time);
                    const prevDt = new Date(prevTs);
                    const prevIso = prevDt.toISOString();
                    const prevDate = prevIso.slice(0, 10);
                    const prevTime = prevIso.slice(11, 19);

                    // eslint-disable-next-line no-console
                    console.log(
                      `[BTCUSDm][1M][CLOSE] ${prevDate} ${prevTime} | O:${prev?.open} H:${prev?.high} L:${prev?.low} C:${prev?.close}`,
                      prev
                    );
                    logged.add(prevKey);
                  }
                }
              }

              const evt = isUpdate ? 'UPDATE' : 'OPEN';
              // eslint-disable-next-line no-console
              console.log(
                `[BTCUSDm][1M][${evt}] ${dateStr} ${timeStr} | O:${o} H:${h} L:${l} C:${c}`,
                message.data
              );
            }
          } catch (_e) {
            // Swallow logging errors to avoid impacting data flow
          }

          set({ ohlcData: currentOhlcData, ohlcByTimeframe: currentByTf });
          
          // Recalculate RSI on every update; hard-gate to active timeframe buffer only
          setTimeout(() => {
            try {
              const activeTf = get().settings?.timeframe;
              if (!activeTf) return;
              const perSymbolTf2 = get().ohlcByTimeframe.get(message.data.symbol);
              if (!perSymbolTf2) return;
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
              let tfData2 = null;
              for (const key of tfAliases(activeTf)) {
                const candidate = perSymbolTf2.get(key);
                if (candidate) { tfData2 = candidate; break; }
              }
              const closedBars = tfData2 && Array.isArray(tfData2.bars)
                ? tfData2.bars.filter(b => b && b.is_closed === true)
                : [];
              const period = get().settings?.rsiPeriod || 14;
              if (closedBars.length >= period + 1) {
                get().recalculateAllRsi();
              }
            } catch (_e) { /* ignore */ }
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
      if (updatedSettings.timeframe && updatedSettings.timeframe !== oldSettings.timeframe) {
        
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
          subscribe(symbol, updatedSettings.timeframe, subscription.dataTypes || ['ticks', 'ohlc']);
        });
        
        // Update subscriptions map
        set({ subscriptions: updatedSubscriptions });
        
        // Recalculate RSI with new timeframe data
        setTimeout(() => {
          get().recalculateAllRsi();
        }, 1500);
      }
      
      // If RSI settings changed, recalculate
      if (newSettings.rsiPeriod || newSettings.rsiOverbought || newSettings.rsiOversold) {
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

    // Data Getters
    getOhlcForSymbol: (symbol) => {
      // Prefer the active timeframe's bars when available
      const tf = get().settings?.timeframe;
      const byTf = get().ohlcByTimeframe.get(symbol);

      // Normalize timeframe aliases between UI ('5M','4H','1D','1W') and server ('M5','H4','D1','W1')
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

      // Fallback: only if legacy top-level timeframe matches active timeframe
      const ohlcData = get().ohlcData.get(symbol);
      if (ohlcData && tf) {
        const aliases = tfAliases(tf);
        if (aliases.includes(ohlcData.timeframe)) {
          return ohlcData.bars || [];
        }
        // Timeframe mismatch: avoid using stale bars from another timeframe
        return [];
      }
      return ohlcData ? (ohlcData.bars || []) : [];
    },

    getOhlcForSymbolAndTimeframe: (symbol, timeframe) => {
      const byTf = get().ohlcByTimeframe.get(symbol);
      if (!byTf) return [];
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
      for (const key of tfAliases(timeframe)) {
        const tfData = byTf.get(key);
        if (tfData && Array.isArray(tfData.bars) && tfData.bars.length > 0) {
          return tfData.bars;
        }
      }
      return [];
    },

    getTicksForSymbol: (symbol) => {
      const tickData = get().tickData.get(symbol);
      return tickData ? tickData.ticks : [];
    },

    getLatestTickForSymbol: (symbol) => {
      const ticks = get().getTicksForSymbol(symbol);
      return ticks.length > 0 ? ticks[0] : null;
    },

    getLatestOhlcForSymbol: (symbol) => {
      const bars = get().getOhlcForSymbol(symbol);
      return bars.length > 0 ? bars[bars.length - 1] : null;
    },

    // Daily Change helpers
    // Try to obtain today's open from daily timeframe (preferred),
    // then fall back to the first bar of the current day from the active timeframe,
    // and finally to the latest bar open as a last resort.
    getDailyOpenForSymbol: (symbol) => {
      // Preferred: explicit daily timeframe data ('1D' or 'D1')
      const dailyBars1D = get().getOhlcForSymbolAndTimeframe(symbol, '1D');
      const dailyBarsD1 = dailyBars1D && dailyBars1D.length > 0
        ? dailyBars1D
        : get().getOhlcForSymbolAndTimeframe(symbol, 'D1');
      const dailyBars = dailyBarsD1;
      if (dailyBars && dailyBars.length > 0) {
        const latestDaily = dailyBars[dailyBars.length - 1];
        if (latestDaily && typeof latestDaily.open === 'number') return latestDaily.open;
      }

      // Fallback: derive from current timeframe bars by finding first bar of "today".
      const bars = get().getOhlcForSymbol(symbol);
      if (!bars || bars.length === 0) return null;

      const latest = bars[bars.length - 1];
      const latestTime = latest?.time || latest?.timestamp;
      if (latestTime) {
        try {
          const d = new Date(latestTime);
          const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          // Find the first bar whose time is on/after start of day
          for (let i = 0; i < bars.length; i++) {
            const bt = bars[i]?.time || bars[i]?.timestamp;
            if (bt && new Date(bt).getTime() >= startOfDay) {
              if (typeof bars[i].open === 'number') return bars[i].open;
            }
          }
        } catch (_e) {
          // ignore and fall through
        }
      }

      // Last resort: use latest bar open (intrabar), which approximates change
      return typeof latest?.open === 'number' ? latest.open : null;
    },

    getDailyChangePercent: (symbol) => {
      const latestTick = get().getLatestTickForSymbol(symbol);
      const latestBar = get().getLatestOhlcForSymbol(symbol);
      const currentPrice = latestTick?.bid || latestBar?.close;
      if (typeof currentPrice !== 'number') return 0;

      const dayOpen = get().getDailyOpenForSymbol(symbol);
      if (typeof dayOpen !== 'number' || dayOpen === 0) return 0;

      return ((currentPrice - dayOpen) / dayOpen) * 100;
    },

    // RSI Analysis Functions
    getOversoldPairs: () => {
      const state = get();
      const oversold = [];
      
      state.rsiData.forEach((rsiInfo, symbol) => {
        if (rsiInfo.value <= state.settings.rsiOversold) {
          const latestTick = get().getLatestTickForSymbol(symbol);
          const latestBar = get().getLatestOhlcForSymbol(symbol);
          const rfiData = state.rfiData.get(symbol);
          
          oversold.push({
            symbol,
            rsi: rsiInfo.value,
            rfiData,
            price: latestTick?.bid || latestBar?.close || 0,
            // Daily % based on start-of-day open when available
            change: get().getDailyChangePercent(symbol),
            volume: latestBar ? Math.abs(latestBar.close - latestBar.open) * 1000000 : 0 // Simulated volume
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
          const latestBar = get().getLatestOhlcForSymbol(symbol);
          const rfiData = state.rfiData.get(symbol);
          
          overbought.push({
            symbol,
            rsi: rsiInfo.value,
            rfiData,
            price: latestTick?.bid || latestBar?.close || 0,
            // Daily % based on start-of-day open when available
            change: get().getDailyChangePercent(symbol),
            volume: latestBar ? Math.abs(latestBar.close - latestBar.open) * 1000000 : 0 // Simulated volume
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
        const latestBar = get().getLatestOhlcForSymbol(symbol);
        const rfiData = state.rfiData.get(symbol);
        
        allPairs.push({
          symbol,
          rsi: rsiInfo.value,
          rfiData,
          price: latestTick?.bid || latestBar?.close || 0,
          // Daily % based on start-of-day open when available
          change: get().getDailyChangePercent(symbol),
          volume: latestBar ? Math.abs(latestBar.close - latestBar.open) * 1000000 : 0
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
          subscribe(symbol, state.settings.timeframe, ['ticks', 'ohlc']);
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
        get().subscribe(normalized, state.settings.timeframe, ['ticks', 'ohlc']);
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
