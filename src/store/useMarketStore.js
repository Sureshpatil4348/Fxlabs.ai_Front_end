import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// WebSocket URL configuration - can be overridden with environment variables
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.fxlabs.ai/ws/market';

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
    // Connection state
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    websocket: null,
    
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
      dashboardConnections: {
        rsiCorrelation: { connected: false, connecting: false, error: null },
        rsiTracker: { connected: false, connecting: false, error: null },
        currencyStrength: { connected: false, connecting: false, error: null }
      },
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
      
      try {
        const ws = new WebSocket(WEBSOCKET_URL);
        
        ws.onopen = () => {
          set({ 
            isConnected: true, 
            isConnecting: false, 
            websocket: ws,
            connectionError: null 
          });
          get().addLog('Connected to MT5 server', 'success');
        };
        
        ws.onmessage = (event) => {
          try {
            // Handle both text and Blob data
            if (event.data instanceof Blob) {
              // Convert Blob to text first
              event.data.text().then(text => {
                try {
                  const message = JSON.parse(text);
                  get().handleMessage(message);
                } catch (parseError) {
                  console.error('Error parsing WebSocket message:', parseError);
                  get().addLog(`Error parsing message: ${parseError.message}`, 'error');
                }
              }).catch(blobError => {
                console.error('Error reading Blob data:', blobError);
                get().addLog(`Error reading message data: ${blobError.message}`, 'error');
              });
            } else {
              // Handle text data directly
              const message = JSON.parse(event.data);
              get().handleMessage(message);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error handling WebSocket message:', error);
            get().addLog(`Error handling message: ${error.message}`, 'error');
          }
        };
        
        ws.onclose = () => {
          set({ 
            isConnected: false, 
            isConnecting: false, 
            websocket: null 
          });
          get().addLog('Disconnected from MT5 server', 'warning');
        };
        
        ws.onerror = (error) => {
          // eslint-disable-next-line no-console
          console.error('WebSocket error:', error);
          set({ 
            isConnecting: false, 
            connectionError: 'Failed to connect to MT5 server' 
          });
          get().addLog('Connection error', 'error');
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
        initialOhlcReceived: new Set()
      });
    },
    
    subscribe: (symbol, timeframe, dataTypes) => {
      const { websocket, isConnected } = get();
      if (!isConnected || !websocket) return;
      
      const formattedSymbol = formatSymbol(symbol);
      
      const subscription = {
        action: 'subscribe',
        symbol: formattedSymbol,
        timeframe,
        data_types: dataTypes
      };
      
      websocket.send(JSON.stringify(subscription));
      get().addLog(`Subscribing to ${formattedSymbol} (${timeframe}) - ${dataTypes.join(', ')}`, 'info');
    },
    
    unsubscribe: (symbol) => {
      const { websocket, isConnected } = get();
      if (!isConnected || !websocket) return;
      
      const formattedSymbol = formatSymbol(symbol);
      
      const message = {
        action: 'unsubscribe',
        symbol: formattedSymbol
      };
      
      websocket.send(JSON.stringify(message));
      get().addLog(`Unsubscribing from ${formattedSymbol}`, 'info');
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
            
            if (lastBar && lastBar.time === message.data.time) {
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
      return ohlcData ? ohlcData.bars : [];
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

    calculateRsi: (symbol, period = 14) => {
      const bars = get().getOhlcForSymbol(symbol);
      
      if (bars.length < period + 1) {
        return null;
      }

      const closes = bars.slice(-period - 1).map(bar => bar.close);
      
      let gains = 0;
      let losses = 0;

      for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;
      
      if (avgLoss === 0) {
        return 100;
      }
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      return rsi;
    },

    recalculateAllRsi: () => {
      const state = get();
      const newRsiData = new Map();
      const newCorrelationStatus = new Map();

      // Calculate RSI for all subscribed symbols
      state.subscriptions.forEach((sub, symbol) => {
        const rsi = get().calculateRsi(symbol, state.rsiSettings.period);
        if (rsi !== null) {
          newRsiData.set(symbol, {
            value: rsi,
            timestamp: new Date(),
            period: state.rsiSettings.period
          });
        }
      });

      // Update correlation status
      [...state.correlationPairs.positive, ...state.correlationPairs.negative].forEach((pair) => {
        const [symbol1, symbol2] = pair;
        const sym1 = symbol1 + 'm';
        const sym2 = symbol2 + 'm';
        const rsi1 = newRsiData.get(sym1)?.value;
        const rsi2 = newRsiData.get(sym2)?.value;
        
        
        if (rsi1 !== undefined && rsi2 !== undefined) {
          const isPositiveCorrelation = state.correlationPairs.positive.some(
            p => (p[0] === symbol1 && p[1] === symbol2) || (p[0] === symbol2 && p[1] === symbol1)
          );
          const pairKey = `${symbol1}_${symbol2}`;
          
          let status = 'neutral';
          if (rsi1 > state.rsiSettings.overbought && rsi2 > state.rsiSettings.overbought) {
            status = isPositiveCorrelation ? 'match' : 'mismatch';
          } else if (rsi1 < state.rsiSettings.oversold && rsi2 < state.rsiSettings.oversold) {
            status = isPositiveCorrelation ? 'match' : 'mismatch';
          } else if ((rsi1 > state.rsiSettings.overbought && rsi2 < state.rsiSettings.oversold) ||
                     (rsi1 < state.rsiSettings.oversold && rsi2 > state.rsiSettings.overbought)) {
            status = isPositiveCorrelation ? 'mismatch' : 'match';
          }

          newCorrelationStatus.set(pairKey, {
            status,
            rsi1,
            rsi2,
            type: isPositiveCorrelation ? 'positive' : 'negative'
          });
        }
      });

      set({ 
        rsiData: newRsiData,
        correlationStatus: newCorrelationStatus
      });
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

          // Set connecting status for all dashboards
          set(state => ({
            globalConnectionState: {
              ...state.globalConnectionState,
              dashboardConnections: {
                rsiCorrelation: { connected: false, connecting: true, error: null },
                rsiTracker: { connected: false, connecting: true, error: null },
                currencyStrength: { connected: false, connecting: true, error: null }
              }
            }
          }));

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
      
      set(state => ({
        globalConnectionState: {
          ...state.globalConnectionState,
          dashboardConnections: {
            ...state.globalConnectionState.dashboardConnections,
            [dashboard]: connectionStatus
          }
        }
      }));

      // Check if all dashboards are connected (only if we're still in CONNECTING state)
      const currentState = get().globalConnectionState;
      if (currentState.status === 'CONNECTING') {
        setTimeout(() => get().checkAllConnectionsReady(), 100);
      }
    },

    checkAllConnectionsReady: () => {
      const state = get();
      const { dashboardConnections, status } = state.globalConnectionState;
      
      // Don't check if we're not in CONNECTING state
      if (status !== 'CONNECTING') {
        return;
      }
      
      const allConnected = Object.values(dashboardConnections).every(conn => conn.connected);
      const anyFailed = Object.values(dashboardConnections).some(conn => conn.error);


      if (allConnected) {
        
        // Clear timeout immediately to prevent retry
        if (state.globalConnectionState.timeoutId) {
          clearTimeout(state.globalConnectionState.timeoutId);
        }

        set(state => ({
          globalConnectionState: {
            ...state.globalConnectionState,
            status: 'CONNECTED',
            showLoader: false,
            timeoutId: null
          }
        }));
      } else if (anyFailed && state.globalConnectionState.status !== 'RETRYING') {
        get().handleConnectionTimeout();
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

    handleConnectionFailure: (error) => {
      
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
          dashboardConnections: {
            rsiCorrelation: { connected: false, connecting: false, error: null },
            rsiTracker: { connected: false, connecting: false, error: null },
            currencyStrength: { connected: false, connecting: false, error: null }
          },
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
      set(state => ({
        globalConnectionState: {
          status: 'INITIALIZING',
          dashboardConnections: {
            rsiCorrelation: { connected: false, connecting: false, error: null },
            rsiTracker: { connected: false, connecting: false, error: null },
            currencyStrength: { connected: false, connecting: false, error: null }
          },
          connectionAttempts: 0,
          maxRetries: 2,
          timeoutDuration: 5000,
          startTime: null,
          showLoader: false,
          timeoutId: null
        }
      }));

      // Close individual dashboard WebSocket connections
      try {
        // Import and disconnect from each store
        import('./useRSICorrelationStore').then(({ default: useRSICorrelationStore }) => {
          const store = useRSICorrelationStore.getState();
          if (store.disconnect) store.disconnect();
        });
        
        import('./useRSITrackerStore').then(({ default: useRSITrackerStore }) => {
          const store = useRSITrackerStore.getState();
          if (store.disconnect) store.disconnect();
        });
        
        import('./useCurrencyStrengthStore').then(({ default: useCurrencyStrengthStore }) => {
          const store = useCurrencyStrengthStore.getState();
          if (store.disconnect) store.disconnect();
        });
      } catch (error) {
        console.error('Error disconnecting dashboard stores:', error);
      }
    }
  }))
);

export default useMarketStore;
export { formatSymbol };
