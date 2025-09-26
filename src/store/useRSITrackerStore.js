import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import useBaseMarketStore from './useBaseMarketStore';
import rsiTrackerAlertService from '../services/rsiTrackerAlertService';
import { calculateRSI } from '../utils/calculations';
import { calculateRFIForSymbols } from '../utils/rfiCalculations';

// WebSocket URL configuration
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.fxlabs.ai/ws/market';

// Smart symbol formatting
const formatSymbol = (input) => {
  const trimmed = input.trim();
  if (trimmed.toLowerCase().endsWith('m')) {
    const base = trimmed.slice(0, -1);
    return base + 'm';
  }
  return trimmed;
};

const useRSITrackerStore = create(
  subscribeWithSelector((set, get) => ({
    // Connection state
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    websocket: null,
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
      timeframe: '1H',
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
    timeframes: ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'],
    
    // Connection Actions
    connect: () => {
      const state = get();
      if (state.isConnected || state.isConnecting) return;
      
      set({ isConnecting: true, connectionError: null });
      
      try {
        const ws = new WebSocket(WEBSOCKET_URL);
        set({ websocket: ws });
        
        ws.onopen = () => {
          set({ isConnected: true, isConnecting: false });
          get().addLog('Connected to MT5 server (RSI Tracker)', 'success');
          
          // Subscribe to any pending watchlist symbols
          const { pendingWatchlistSubscriptions, settings } = get();
          if (pendingWatchlistSubscriptions.size > 0) {
            pendingWatchlistSubscriptions.forEach(symbol => {
              get().subscribe(symbol, settings.timeframe, ['ticks', 'ohlc']);
            });
            set({ pendingWatchlistSubscriptions: new Set() });
          }
          
          // Also subscribe to any existing watchlist symbols
          setTimeout(async () => {
            try {
              const useBaseMarketStore = await import('./useBaseMarketStore');
              const watchlistSymbols = useBaseMarketStore.default.getState().getWishlistArray();
              watchlistSymbols.forEach(symbol => {
                const symbolWithM = symbol + 'm';
                if (!get().subscriptions.has(symbolWithM)) {
                  get().subscribe(symbolWithM, settings.timeframe, ['ticks', 'ohlc']);
                }
              });
            } catch (error) {
              console.error('Failed to subscribe to existing watchlist symbols:', error);
            }
          }, 500);
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiTracker', {
              connected: true,
              connecting: false,
              error: null
            });
          });
        };
        
        ws.onmessage = (event) => {
          try {
            // Handle binary data - convert to text first
            let message;
            if (event.data instanceof Blob) {
              // Convert blob to text
              event.data.text().then(text => {
                try {
                  message = JSON.parse(text);
                  get().handleMessage(message);
                } catch (parseError) {
                  console.error('Failed to parse WebSocket message text:', parseError);
                }
              }).catch(blobError => {
                console.error('Failed to read blob data:', blobError);
              });
            } else if (typeof event.data === 'string') {
              // Handle string data directly
              message = JSON.parse(event.data);
              get().handleMessage(message);
            } else {
              console.warn('Unknown message data type:', typeof event.data);
            }
          } catch (error) {
            console.error('Failed to handle WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          set({ 
            isConnected: false, 
            isConnecting: false, 
            websocket: null 
          });
          get().addLog('Disconnected from MT5 server (RSI Tracker)', 'warning');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiTracker', {
              connected: false,
              connecting: false,
              error: 'Connection closed'
            });
          });
        };
        
        ws.onerror = (error) => {
          console.error('RSI Tracker WebSocket error:', error);
          set({ 
            isConnecting: false, 
            connectionError: 'Failed to connect to MT5 server' 
          });
          get().addLog('Connection error (RSI Tracker)', 'error');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('rsiTracker', {
              connected: false,
              connecting: false,
              error: 'Failed to connect to MT5 server'
            });
          });
        };
        
      } catch (error) {
        set({ 
          isConnecting: false, 
          connectionError: error.message 
        });
      }
    },
    
    disconnect: () => {
      const { websocket } = get();
      if (websocket) {
        websocket.close();
      }
      set({ 
        isConnected: false, 
        isConnecting: false, 
        websocket: null,
        subscriptions: new Map(),
        tickData: new Map(),
        ohlcData: new Map(),
        ohlcByTimeframe: new Map(),
        initialOhlcReceived: new Set()
      });
    },
    
    subscribe: (symbol, timeframe, dataTypes) => {
      const { websocket, isConnected } = get();
      if (!isConnected || !websocket) return;
      
      // Check if WebSocket is ready to send data
      if (websocket.readyState !== WebSocket.OPEN) {
        get().addLog(`WebSocket not ready for subscription to ${symbol}`, 'warning');
        return;
      }
      
      const formattedSymbol = formatSymbol(symbol);
      
      const subscription = {
        action: 'subscribe',
        symbol: formattedSymbol,
        timeframe,
        data_types: dataTypes
      };
      
      try {
        websocket.send(JSON.stringify(subscription));
        get().addLog(`Subscribing to ${formattedSymbol} (${timeframe}) - ${dataTypes.join(', ')}`, 'info');
      } catch (error) {
        get().addLog(`Failed to subscribe to ${formattedSymbol}: ${error.message}`, 'error');
      }
    },
    
    unsubscribe: (symbol) => {
      const { websocket, isConnected } = get();
      if (!isConnected || !websocket) return;
      
      // Check if WebSocket is ready to send data
      if (websocket.readyState !== WebSocket.OPEN) {
        get().addLog(`WebSocket not ready for unsubscription from ${symbol}`, 'warning');
        return;
      }
      
      const formattedSymbol = formatSymbol(symbol);
      
      const message = {
        action: 'unsubscribe',
        symbol: formattedSymbol
      };
      
      try {
        websocket.send(JSON.stringify(message));
        get().addLog(`Unsubscribing from ${formattedSymbol}`, 'info');
      } catch (error) {
        get().addLog(`Failed to unsubscribe from ${formattedSymbol}: ${error.message}`, 'error');
      }
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
          const newSubscriptions = new Map(state.subscriptions);
          newSubscriptions.delete(message.symbol);
          const newTickData = new Map(state.tickData);
          newTickData.delete(message.symbol);
          const newOhlcData = new Map(state.ohlcData);
          newOhlcData.delete(message.symbol);
          const newOhlcByTimeframe = new Map(state.ohlcByTimeframe);
          newOhlcByTimeframe.delete(message.symbol);
          const newInitialReceived = new Set(state.initialOhlcReceived);
          newInitialReceived.delete(message.symbol);
          
          set({ 
            subscriptions: newSubscriptions,
            tickData: newTickData,
            ohlcData: newOhlcData,
            ohlcByTimeframe: newOhlcByTimeframe,
            initialOhlcReceived: newInitialReceived
          });
          get().addLog(`Unsubscribed from ${message.symbol}`, 'warning');
          break;
          
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
          perSymbol.set(message.timeframe, {
            symbol: message.symbol,
            timeframe: message.timeframe,
            bars: message.data,
            lastUpdate: new Date()
          });
          ohlcByTimeframe.set(message.symbol, perSymbol);

          const initialReceived = new Set(state.initialOhlcReceived);
          initialReceived.add(message.symbol);
          
          set({ 
            ohlcData,
            ohlcByTimeframe,
            initialOhlcReceived: initialReceived
          });
          get().addLog(`Received ${message.data.length} initial OHLC bars for ${message.symbol}`, 'info');
          
          // Trigger calculations when initial data is received
          setTimeout(() => {
            get().recalculateAllRsi();
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
          const topLevelSymbolData = currentOhlcData.get(message.data.symbol);
          if (topLevelSymbolData) {
            // Update the most recent bar or add new one (top-level default timeframe)
            const bars = [...topLevelSymbolData.bars];
            const lastBar = bars[bars.length - 1];
            
            if (lastBar && lastBar.time === message.data.time) {
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
          const existingTfData = perSymbolTf.get(message.data.timeframe);
          const tfBars = existingTfData ? [...existingTfData.bars] : [];
          const tfLast = tfBars[tfBars.length - 1];
          if (tfLast && tfLast.time === message.data.time) {
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

          set({ ohlcData: currentOhlcData, ohlcByTimeframe: currentByTf });
          
          // Trigger RSI recalculation when new data arrives
          setTimeout(() => {
            get().recalculateAllRsi();
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
        }, 1500);
      }
      
      // If RSI settings changed, recalculate
      if (newSettings.rsiPeriod || newSettings.rsiOverbought || newSettings.rsiOversold) {
        get().recalculateAllRsi();
      }
    },
    
    // RSI Calculation Actions
    // Use Wilder's RSI on closed candles when possible (via utils.calculateRSI)
    calculateRsi: (symbol, period = 14) => {
      const bars = get().getOhlcForSymbol(symbol);
      if (!bars || bars.length < period + 1) return null;

      // Prefer closed candles: drop the last bar only when we have enough history
      const effectiveBars = bars.length > period + 1 ? bars.slice(0, -1) : bars;
      const closes = effectiveBars
        .map(bar => Number(bar.close))
        .filter(v => Number.isFinite(v));
      if (closes.length < period + 1) return null;

      return calculateRSI(closes, period);
    },

    recalculateAllRsi: () => {
      const state = get();
      const newRsiData = new Map();
      const newRsiHistory = new Map(state.rsiHistory);
      const newRsiEvents = new Map(state.rsiEvents);
      const newPriceHistory = new Map(state.priceHistory);

      // Calculate RSI for all subscribed symbols
      state.subscriptions.forEach((sub, symbol) => {
        const rsi = get().calculateRsi(symbol, state.settings.rsiPeriod);
        if (rsi !== null) {
          const currentTime = new Date();
          const rsiInfo = {
            value: rsi,
            timestamp: currentTime,
            period: state.settings.rsiPeriod
          };
          
          newRsiData.set(symbol, rsiInfo);
          
          // Store historical RSI data
          if (!newRsiHistory.has(symbol)) {
            newRsiHistory.set(symbol, []);
          }
          const history = newRsiHistory.get(symbol);
          history.push({
            value: rsi,
            timestamp: currentTime
          });
          
          // Keep only last 100 historical values
          if (history.length > 100) {
            history.shift();
          }
          
          // Track RSI events (crossdown/crossup)
          get().trackRsiEvents(symbol, rsi, newRsiEvents);
          
          // Store price history for sparklines
          const latestTick = get().getLatestTickForSymbol(symbol);
          const latestBar = get().getLatestOhlcForSymbol(symbol);
          const currentPrice = latestTick?.bid || latestBar?.close || 0;
          
          if (!newPriceHistory.has(symbol)) {
            newPriceHistory.set(symbol, []);
          }
          const priceHistory = newPriceHistory.get(symbol);
          priceHistory.push({
            price: currentPrice,
            timestamp: currentTime
          });
          
          // Keep only last 50 price points for sparklines
          if (priceHistory.length > 50) {
            priceHistory.shift();
          }
        }
      });

      set({ 
        rsiData: newRsiData,
        rsiHistory: newRsiHistory,
        rsiEvents: newRsiEvents,
        priceHistory: newPriceHistory
      });
      
      // Also calculate RFI after RSI calculation
      get().recalculateAllRfi();
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
        // Fire simplified RSI tracker alert trigger if enabled
        get().triggerRsiTrackerAlert(symbol, 'crossdown', currentRsi).catch(() => {});
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
        // Fire simplified RSI tracker alert trigger if enabled
        get().triggerRsiTrackerAlert(symbol, 'crossup', currentRsi).catch(() => {});
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

    // Simplified RSI Tracker Alert trigger
    triggerRsiTrackerAlert: async (symbol, eventType, rsiValue) => {
      try {
        const alert = await rsiTrackerAlertService.getActiveAlert();
        if (!alert || !alert.isActive) return;
        const tf = get().settings?.timeframe || alert.timeframe;
        const triggerCondition = eventType === 'crossup' ? 'overbought' : 'oversold';
        await rsiTrackerAlertService.createTrigger({
          alertId: alert.id,
          symbol,
          timeframe: tf,
          rsiValue,
          triggerCondition
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to create RSI tracker alert trigger:', e);
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
      const state = get();
      const symbolData = new Map();

      // Prepare data for RFI calculation
      state.subscriptions.forEach((sub, symbol) => {
        const rsiInfo = state.rsiData.get(symbol);
        const ohlcInfo = state.ohlcData.get(symbol);
        const _tickInfo = state.tickData.get(symbol); // Unused variable, prefixed with underscore

        if (rsiInfo && ohlcInfo) {
          // Get recent RSI values (simulate historical RSI for flow calculation)
          const rsiValues = [rsiInfo.value, rsiInfo.value * 0.95, rsiInfo.value * 1.05]; // Simplified
          
          // Get recent price data
          const bars = ohlcInfo.bars.slice(-10); // Last 10 bars
          const priceData = bars.map(bar => bar.close);
          
          // Get volume data (simulate from price movement)
          const volumeData = bars.map((bar, index) => {
            if (index === 0) return 1000000; // Base volume
            const priceChange = Math.abs(bar.close - bars[index - 1].close) / bars[index - 1].close;
            return 1000000 * (1 + priceChange * 5); // Volume based on price volatility
          });

          symbolData.set(symbol, {
            rsiValues,
            priceData,
            volumeData
          });
        }
      });

      // Calculate RFI for all symbols
      const rfiResults = calculateRFIForSymbols(symbolData);
      set({ rfiData: rfiResults });
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
