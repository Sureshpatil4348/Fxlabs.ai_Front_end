import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import websocketService from '../services/websocketService';

// Note: All calculations are now performed server-side
// RSI and other indicators should be received from WebSocket/API

// Smart symbol formatting - keeps 'm' suffix lowercase
const formatSymbol = (input) => {
  const trimmed = input.trim();
  if (trimmed.toLowerCase().endsWith('m')) {
    const base = trimmed.slice(0, -1);
    return base + 'm';
  }
  return trimmed;
};

// Correlation pairs data
const CORRELATION_PAIRS = {
  negative: [
    ['AUDUSD', 'GBPNZD'],
    ['EURAUD', 'CADCHF'],
    ['EURGBP', 'GBPCHF'],
    ['EURCAD', 'CADJPY'],
    ['GBPNZD', 'NZDCHF'],
    ['EURAUD', 'AUDJPY'],
    ['GBPUSD', 'USDCHF'],
    ['EURAUD', 'AUDCHF'],
    ['USDJPY', 'EURCAD'],
    ['GBPUSD', 'USDCAD'],
    ['USDCAD', 'AUDCHF'],
    ['USDJPY', 'NZDUSD']
  ],
  positive: [
    ['EURUSD', 'GBPUSD'],
    ['AUDUSD', 'AUDCAD'],
    ['EURAUD', 'EURNZD']
  ]
};

const useMarketStore = create(
  subscribeWithSelector((set, get) => ({
    // Connection state (now managed by shared WebSocket service)
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    
    // Market data
    subscriptions: new Map(), // symbol -> subscription info
    tickData: new Map(),      // symbol -> latest ticks
    ohlcData: new Map(),      // symbol -> OHLC bars
    initialOhlcReceived: new Set(), // symbols that received initial OHLC
    
    // RSI Data
    rsiData: new Map(), // symbol -> RSI values
    rsiSettings: {
      period: 14,
      overbought: 70,
      oversold: 30
    },
    
    // Currency Strength Data
    currencyStrength: new Map(), // currency -> strength score (0-100)
    strengthSettings: {
      mode: 'closed' // 'closed' | 'live'
    },
    
    // Global Dashboard Settings
    globalSettings: {
      timeframe: '1H' // Universal timeframe for all indicators
    },
    
    // News Data
    newsData: [],
    aiAnalysis: new Map(), // newsId -> AI analysis
    newsLoading: false,
    
    // Wishlist
    wishlist: new Set(), // tracked symbols
    
    // Correlation Data
    correlationPairs: CORRELATION_PAIRS,
    correlationStatus: new Map(), // pairKey -> { status: 'match'|'mismatch'|'neutral', rsi1, rsi2 }
    
    // Global Connection Management
    globalConnectionState: {
      status: 'INITIALIZING', // 'INITIALIZING' | 'CONNECTING' | 'RETRYING' | 'CONNECTED' | 'FAILED'
      connectionAttempts: 0,
      maxRetries: 2,
      timeoutDuration: 5000,
      startTime: null,
      showLoader: true,
      timeoutId: null
    },
    
    // UI state
    selectedSymbol: 'EURUSDm',
    selectedTimeframe: '1M',
    dataTypes: ['ticks', 'ohlc'],
    logs: [],
    
    // Available options
    timeframes: ['1M', '5M', '15M', '30M', '1H', '4H', '1D'],
    
    // Actions
    connect: () => {
      const state = get();
      if (state.isConnected || state.isConnecting) return;
      
      set({ isConnecting: true, connectionError: null });
      
      // Register with centralized message router
      websocketService.registerStore('market', {
        messageHandler: (_message, _rawData) => {
          // v2 probe: no logging - handled by router
        },
        connectionCallback: () => {
          set({ 
            isConnected: true, 
            isConnecting: false, 
            connectionError: null 
          });
          get().addLog('Connected to Market v2 (probe mode)', 'success');
        },
        disconnectionCallback: () => {
          set({ 
            isConnected: false, 
            isConnecting: false
          });
          get().addLog('Disconnected from Market v2 (probe mode)', 'warning');
        },
        errorCallback: (_error) => {
          set({ 
            isConnecting: false, 
            connectionError: 'Failed to connect to Market v2' 
          });
          get().addLog('Connection error (Market v2 probe)', 'error');
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
      websocketService.unregisterStore('market');
      
      set({ 
        isConnected: false, 
        isConnecting: false, 
        subscriptions: new Map(),
        tickData: new Map(),
        ohlcData: new Map(),
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
          ohlcData.set(message.symbol, {
            symbol: message.symbol,
            timeframe: message.timeframe,
            bars: message.data,
            lastUpdate: new Date()
          });
          const initialReceived = new Set(state.initialOhlcReceived);
          initialReceived.add(message.symbol);
          
          set({ 
            ohlcData,
            initialOhlcReceived: initialReceived
          });
          get().addLog(`Received ${message.data.length} initial OHLC bars for ${message.symbol}`, 'info');
          
          // Trigger calculations when initial data is received
          setTimeout(() => {
            get().recalculateAllRsi();
            get().calculateCurrencyStrength();
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
          const symbolData = currentOhlcData.get(message.data.symbol);
          if (symbolData) {
            // Update the most recent bar or add new one
            const bars = [...symbolData.bars];
            const lastBar = bars[bars.length - 1];
            const toTime = (t) => {
              const n = Number(t);
              return Number.isFinite(n) ? n : Date.parse(t);
            };
            
            if (lastBar && toTime(lastBar.time) === toTime(message.data.time)) {
              // Update existing bar - don't log
              bars[bars.length - 1] = message.data;
            } else {
              // Add new bar and keep only last 100 - log this as it's a new candle
              bars.push(message.data);
              if (bars.length > 100) {
                bars.shift();
              }
              get().addLog(`New candle: ${message.data.symbol} - ${message.data.close}`, 'info');
            }
            
            symbolData.bars = bars;
            symbolData.lastUpdate = new Date();
            currentOhlcData.set(message.data.symbol, symbolData);
            set({ ohlcData: currentOhlcData });
            
            // Trigger RSI and Currency Strength recalculation when new data arrives
            setTimeout(() => {
              get().recalculateAllRsi();
              get().calculateCurrencyStrength();
            }, 100);
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
    
    setSelectedSymbol: (symbol) => {
      set({ selectedSymbol: formatSymbol(symbol) });
    },
    
    setSelectedTimeframe: (timeframe) => {
      set({ selectedTimeframe: timeframe });
    },
    
    setDataTypes: (dataTypes) => {
      set({ dataTypes });
    },
    
    // Computed getters
    getTicksForSymbol: (symbol) => {
      const tickData = get().tickData.get(symbol);
      return tickData ? tickData.ticks : [];
    },
    
    getOhlcForSymbol: (symbol) => {
      const ohlcData = get().ohlcData.get(symbol);
      if (!ohlcData) return [];

      // Ensure bars match the active global timeframe to avoid stale data on timeframe switch
      const tf = get().globalSettings?.timeframe;
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
      if (tf) {
        const aliases = tfAliases(tf);
        if (!aliases.includes(ohlcData.timeframe)) return [];
      }
      return ohlcData.bars || [];
    },
    
    getLatestTickForSymbol: (symbol) => {
      const ticks = get().getTicksForSymbol(symbol);
      return ticks.length > 0 ? ticks[0] : null;
    },
    
    getLatestOhlcForSymbol: (symbol) => {
      const bars = get().getOhlcForSymbol(symbol);
      return bars.length > 0 ? bars[bars.length - 1] : null;
    },
    
    isSymbolSubscribed: (symbol) => {
      return get().subscriptions.has(symbol);
    },

    // Global Settings Actions
    updateGlobalSettings: (newSettings) => {
      const state = get();
      const oldSettings = state.globalSettings;
      const updatedSettings = { ...oldSettings, ...newSettings };
      
      set({ globalSettings: updatedSettings });
      
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
        
        // Recalculate both indicators with new timeframe data
        setTimeout(() => {
          get().recalculateAllRsi();
          get().calculateCurrencyStrength();
        }, 1500);
      }
    },

    // RSI Actions
    updateRsiSettings: (newSettings) => {
      const state = get();
      const oldSettings = state.rsiSettings;
      const updatedSettings = { ...oldSettings, ...newSettings };
      
      set({ rsiSettings: updatedSettings });
      
      // Only recalculate with existing data since timeframe is now global
      get().recalculateAllRsi();
    },

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

    // Currency Strength Actions
    updateStrengthSettings: (newSettings) => {
      const oldSettings = get().strengthSettings;
      const updatedSettings = { ...oldSettings, ...newSettings };
      
      set({ strengthSettings: updatedSettings });
      
      // Only recalculate with existing data since timeframe is now global
      get().calculateCurrencyStrength();
    },

    calculateCurrencyStrength: () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
      const strengthMap = new Map();
      
      // Initialize with neutral strength
      currencies.forEach(currency => {
        strengthMap.set(currency, 50);
      });

      // Calculate based on major pairs performance
      const majorPairs = [
        'EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY',
        'EURGBP', 'EURAUD', 'EURNZD', 'EURCAD', 'EURCHF', 'EURJPY',
        'GBPAUD', 'GBPNZD', 'GBPCAD', 'GBPCHF', 'GBPJPY',
        'AUDNZD', 'AUDCAD', 'AUDCHF', 'AUDJPY',
        'NZDCAD', 'NZDCHF', 'NZDJPY',
        'CADCHF', 'CADJPY',
        'CHFJPY'
      ];

      majorPairs.forEach(pair => {
        const symbol = pair + 'm';
        const bars = get().getOhlcForSymbol(symbol);
        if (bars.length >= 2) {
          const current = bars[bars.length - 1];
          const previous = bars[bars.length - 2];
          const change = (current.close - previous.close) / previous.close;
          
          const baseCurrency = pair.substring(0, 3);
          const quoteCurrency = pair.substring(3, 6);
          
          const currentBase = strengthMap.get(baseCurrency) || 50;
          const currentQuote = strengthMap.get(quoteCurrency) || 50;
          
          // If pair goes up, base currency strengthens, quote weakens
          strengthMap.set(baseCurrency, Math.max(0, Math.min(100, currentBase + (change * 1000))));
          strengthMap.set(quoteCurrency, Math.max(0, Math.min(100, currentQuote - (change * 1000))));
        }
      });

      set({ currencyStrength: strengthMap });
    },

    // News Actions
    fetchNews: async () => {
      set({ newsLoading: true });
      try {
        const { fetchForexFactoryNews } = await import('../services/newsService');
        const newsData = await fetchForexFactoryNews();
        
        set({ newsData, newsLoading: false });
        
        // Trigger AI analysis for each news item
        newsData.forEach(news => {
          get().analyzeNews(news);
        });
      } catch (error) {
        console.error('Error fetching news:', error);
        set({ newsLoading: false });
      }
    },

    analyzeNews: async (newsItem) => {
      try {
        const { analyzeNewsWithAI } = await import('../services/newsService');
        const analysis = await analyzeNewsWithAI(newsItem);
        
        const currentAnalysis = new Map(get().aiAnalysis);
        currentAnalysis.set(newsItem.id, analysis);
        set({ aiAnalysis: currentAnalysis });
      } catch (error) {
        console.error('Error analyzing news:', error);
      }
    },

    // Wishlist Actions
    addToWishlist: (symbol) => {
      const newWishlist = new Set(get().wishlist);
      newWishlist.add(symbol);
      set({ wishlist: newWishlist });
    },

    removeFromWishlist: (symbol) => {
      const newWishlist = new Set(get().wishlist);
      newWishlist.delete(symbol);
      set({ wishlist: newWishlist });
    },

    isInWishlist: (symbol) => {
      return get().wishlist.has(symbol);
    },

    // Enhanced getters
    getOversoldPairs: () => {
      const state = get();
      const oversold = [];
      
      state.rsiData.forEach((rsiInfo, symbol) => {
        if (rsiInfo.value < state.rsiSettings.oversold) {
          const latestTick = get().getLatestTickForSymbol(symbol);
          const latestBar = get().getLatestOhlcForSymbol(symbol);
          
          oversold.push({
            symbol,
            rsi: rsiInfo.value,
            price: latestTick?.bid || latestBar?.close || 0,
            change: latestBar ? ((latestBar.close - latestBar.open) / latestBar.open * 100) : 0
          });
        }
      });
      
      return oversold.sort((a, b) => a.rsi - b.rsi);
    },

    getOverboughtPairs: () => {
      const state = get();
      const overbought = [];
      
      state.rsiData.forEach((rsiInfo, symbol) => {
        if (rsiInfo.value > state.rsiSettings.overbought) {
          const latestTick = get().getLatestTickForSymbol(symbol);
          const latestBar = get().getLatestOhlcForSymbol(symbol);
          
          overbought.push({
            symbol,
            rsi: rsiInfo.value,
            price: latestTick?.bid || latestBar?.close || 0,
            change: latestBar ? ((latestBar.close - latestBar.open) / latestBar.open * 100) : 0
          });
        }
      });
      
      return overbought.sort((a, b) => b.rsi - a.rsi);
    },

    getWishlistData: () => {
      const state = get();
      const wishlistData = [];
      
      state.wishlist.forEach(symbol => {
        const latestTick = get().getLatestTickForSymbol(symbol);
        const latestBar = get().getLatestOhlcForSymbol(symbol);
        const rsiInfo = state.rsiData.get(symbol);
        
        wishlistData.push({
          symbol,
          price: latestTick?.bid || latestBar?.close || 0,
          change: latestBar ? ((latestBar.close - latestBar.open) / latestBar.open * 100) : 0,
          rsi: rsiInfo?.value || null
        });
      });
      
      return wishlistData;
    },

    // Global Connection Management Actions
    initiateGlobalConnection: () => {
      const state = get();
      
      // Don't initiate if we're already connected or connecting
      if (state.globalConnectionState.status === 'CONNECTED' || 
          state.globalConnectionState.status === 'CONNECTING') {
        return;
      }

      
      set(state => ({
        globalConnectionState: {
          ...state.globalConnectionState,
          status: 'CONNECTING',
          startTime: Date.now(),
          connectionAttempts: state.globalConnectionState.connectionAttempts + 1,
          showLoader: true
        }
      }));

      // Import dashboard stores dynamically to avoid circular imports
      const initConnections = async () => {
        try {
          const [
            { default: useRSICorrelationStore },
            { default: useRSITrackerStore },
            { default: useCurrencyStrengthStore }
          ] = await Promise.all([
            import('./useRSICorrelationStore'),
            import('./useRSITrackerStore'),
            import('./useCurrencyStrengthStore')
          ]);

          // Initiate connections with staggered timing
          setTimeout(() => useRSICorrelationStore.getState().connect(), 100);
          setTimeout(() => useRSITrackerStore.getState().connect(), 300);
          setTimeout(() => useCurrencyStrengthStore.getState().connect(), 500);

          // Set timeout for connection attempts
          const timeoutId = setTimeout(() => {
            // Only trigger timeout if we're still in CONNECTING state
            const currentState = get().globalConnectionState;
            if (currentState.status === 'CONNECTING') {
              get().handleConnectionTimeout();
            }
          }, get().globalConnectionState.timeoutDuration);

          set(state => ({
            globalConnectionState: {
              ...state.globalConnectionState,
              timeoutId
            }
          }));

        } catch (error) {
          console.error('Failed to import dashboard stores:', error);
          get().handleConnectionFailure('Failed to initialize dashboard stores');
        }
      };

      initConnections();
    },

    updateDashboardConnection: (dashboard, connectionStatus) => {
      // Simplified: Just mark as connected when any store connects successfully
      const currentState = get().globalConnectionState;
      if (currentState.status === 'CONNECTING' && connectionStatus.connected) {
        // Clear timeout immediately to prevent retry
        if (currentState.timeoutId) {
          clearTimeout(currentState.timeoutId);
        }

        set(state => ({
          globalConnectionState: {
            ...state.globalConnectionState,
            status: 'CONNECTED',
            showLoader: false,
            timeoutId: null
          }
        }));
      }
    },

    handleConnectionTimeout: () => {
      const state = get();
      const { connectionAttempts, maxRetries, status } = state.globalConnectionState;

      // Don't handle timeout if we're already connected or in a different state
      if (status !== 'CONNECTING') {
        return;
      }

      if (connectionAttempts <= maxRetries) {
        // Retry connections
        set(state => ({
          globalConnectionState: {
            ...state.globalConnectionState,
            status: 'RETRYING'
          }
        }));

        // Wait 2 seconds before retry
        setTimeout(() => {
          get().initiateGlobalConnection();
        }, 2000);
      } else {
        // Max retries reached
        
        set(state => ({
          globalConnectionState: {
            ...state.globalConnectionState,
            status: 'FAILED',
            showLoader: true // Keep loader visible to show error
          }
        }));
      }
    },

    handleConnectionFailure: () => {
      
      set(state => ({
        globalConnectionState: {
          ...state.globalConnectionState,
          status: 'FAILED',
          showLoader: true
        }
      }));
    },

    retryAllConnections: () => {
      
      // Reset connection state
      set(state => ({
        globalConnectionState: {
          ...state.globalConnectionState,
          status: 'INITIALIZING',
          connectionAttempts: 0,
          showLoader: true
        }
      }));

      // Initiate new connection attempt
      setTimeout(() => get().initiateGlobalConnection(), 500);
    },

    setLoaderVisibility: (visible) => {
      set(state => ({
        globalConnectionState: {
          ...state.globalConnectionState,
          showLoader: visible
        }
      }));
    },

    // Disconnect all WebSocket connections and reset state
    disconnectAll: () => {
      const state = get();
      
      // Clear any existing timeouts
      if (state.globalConnectionState.timeoutId) {
        clearTimeout(state.globalConnectionState.timeoutId);
      }

      // Reset global connection state
      set({
        globalConnectionState: {
          status: 'INITIALIZING',
          connectionAttempts: 0,
          maxRetries: 2,
          timeoutDuration: 5000,
          startTime: null,
          showLoader: false,
          timeoutId: null
        }
      });

      // Disconnect shared WebSocket service
      websocketService.disconnect();
    }
  }))
);

export default useMarketStore;
export { formatSymbol };
