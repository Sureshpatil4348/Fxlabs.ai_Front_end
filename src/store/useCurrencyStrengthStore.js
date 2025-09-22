import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

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

// Core currency pairs - Major pairs only (7 pairs)
const CORE_PAIRS = [
  'EURUSDm', 'GBPUSDm', 'USDJPYm', 'USDCHFm', 'AUDUSDm', 'USDCADm', 'NZDUSDm'
];

// Extended currency pairs - Cross pairs (21 pairs)
const EXTENDED_PAIRS = [
  // EUR crosses (6)
  'EURGBPm', 'EURJPYm', 'EURCHFm', 'EURAUDm', 'EURCADm', 'EURNZDm',
  
  // GBP crosses (5)
  'GBPJPYm', 'GBPCHFm', 'GBPAUDm', 'GBPCADm', 'GBPNZDm',
  
  // AUD crosses (4)
  'AUDJPYm', 'AUDCHFm', 'AUDCADm', 'AUDNZDm',
  
  // NZD crosses (3)
  'NZDJPYm', 'NZDCHFm', 'NZDCADm',
  
  // CAD crosses (2)
  'CADJPYm', 'CADCHFm',
  
  // CHF crosses (1)
  'CHFJPYm'
];

// Precious Metals pairs
const PRECIOUS_METALS_PAIRS = [
  'XAUUSDm', // Gold
  'XAGUSDm'  // Silver
];

// Cryptocurrency pairs
const CRYPTO_PAIRS = [
  'BTCUSDm', // Bitcoin
  'ETHUSDm'  // Ethereum
];

// All currency pairs - Combined core, extended, precious metals, and crypto (32 pairs total)
const ALL_PAIRS = [...CORE_PAIRS, ...EXTENDED_PAIRS, ...PRECIOUS_METALS_PAIRS, ...CRYPTO_PAIRS];

// Enhanced currency pairs for strength calculation - All 28 major/minor combinations (legacy support)
// eslint-disable-next-line no-unused-vars
const ENHANCED_CURRENCY_PAIRS = ALL_PAIRS;

// Major currency pairs for strength calculation (legacy support)
// eslint-disable-next-line no-unused-vars
const MAJOR_PAIRS = ALL_PAIRS;

const useCurrencyStrengthStore = create(
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
    
    // Currency Strength Data
    currencyStrength: new Map(), // currency -> strength score (0-100)
    
    // Dashboard-specific settings
    settings: {
      timeframe: '1H',
      mode: 'closed', // 'closed' | 'live'
      autoSubscribeSymbols: ALL_PAIRS, // Use all pairs (core + extended)
      useEnhancedCalculation: true, // Toggle between old and new calculation methods
      pairSet: 'all' // 'core', 'extended', 'all' - for filtering
    },
    
    // UI state
    logs: [],
    timeframes: ['1M', '5M', '15M', '30M', '1H', '4H', '1D'],
    
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
          get().addLog('Connected to MT5 server (Currency Strength)', 'success');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('currencyStrength', {
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
          get().addLog('Disconnected from MT5 server (Currency Strength)', 'warning');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('currencyStrength', {
              connected: false,
              connecting: false,
              error: 'Connection closed'
            });
          });
        };
        
        ws.onerror = (error) => {
          console.error('Currency Strength WebSocket error:', error);
          set({ 
            isConnecting: false, 
            connectionError: 'Failed to connect to MT5 server' 
          });
          get().addLog('Connection error (Currency Strength)', 'error');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('currencyStrength', {
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
          
          // Remove automatic recalculation on tick updates to prevent flickering
          // Currency strength will only update on manual refresh or scheduled intervals
          // if (state.settings.mode === 'live') {
          //   get().calculateCurrencyStrength();
          // }
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
            
            // Remove automatic strength recalculation to prevent flickering
            // Currency strength will only update on manual refresh or scheduled intervals
            // setTimeout(() => {
            //   get().calculateCurrencyStrength();
            // }, 100);
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
        
        // Recalculate strength with new timeframe data
        setTimeout(() => {
          get().calculateCurrencyStrength();
        }, 1500);
      }
      
      // If mode changed, recalculate
      if (newSettings.mode && newSettings.mode !== oldSettings.mode) {
        get().calculateCurrencyStrength();
      }
      
      // If calculation method changed, recalculate
      if (newSettings.useEnhancedCalculation !== undefined && newSettings.useEnhancedCalculation !== oldSettings.useEnhancedCalculation) {
        get().calculateCurrencyStrength();
      }
    },
    
    // Enhanced Currency Strength Calculation using client's formula
    calculateCurrencyStrength: () => {
      const state = get();
      
      if (state.settings.useEnhancedCalculation) {
        get().calculateEnhancedCurrencyStrength();
      } else {
        get().calculateLegacyCurrencyStrength();
      }
    },
    
    // New enhanced calculation method based on client's document
    calculateEnhancedCurrencyStrength: () => {
      const state = get();
      
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
      const strengthMap = new Map();
      const currencyContributions = new Map(); // Track contributions for each currency
      
      // Initialize all currencies with neutral strength (50)
      currencies.forEach(currency => {
        strengthMap.set(currency, 50);
        currencyContributions.set(currency, []);
      });
      
      
      // Process each subscribed pair using the enhanced formula
      state.subscriptions.forEach((subscription, symbol) => {
        
        // Extract base and quote currencies from symbol (e.g., EURUSDm -> EUR, USD)
        const symbolWithoutM = symbol.replace('m', '');
        let baseCurrency = '';
        let quoteCurrency = '';
        
        // Parse currency pair
        for (let i = 3; i <= 6; i++) {
          const potential = symbolWithoutM.substring(0, i);
          if (currencies.includes(potential)) {
            baseCurrency = potential;
            quoteCurrency = symbolWithoutM.substring(i);
            break;
          }
        }
        
        if (!baseCurrency || !quoteCurrency || !currencies.includes(quoteCurrency)) {
          return;
        }
        
        // Get price data based on mode
        let currentPrice, previousPrice;
        
        if (state.settings.mode === 'live') {
          // Use latest tick data
          const tickInfo = state.tickData.get(symbol);
          if (tickInfo && tickInfo.ticks.length >= 2) {
            currentPrice = tickInfo.ticks[0].bid;
            previousPrice = tickInfo.ticks[1].bid;
          }
        } else {
          // Use closed candle data
          const ohlcInfo = state.ohlcData.get(symbol);
          if (ohlcInfo && ohlcInfo.bars.length >= 2) {
            const bars = ohlcInfo.bars;
            currentPrice = bars[bars.length - 1].close;
            previousPrice = bars[bars.length - 2].close;
          }
        }
        
        if (currentPrice && previousPrice && currentPrice > 0 && previousPrice > 0) {
          // Calculate log return as per client's formula: rt = ln(Pt/Pt-1)
          const logReturn = Math.log(currentPrice / previousPrice);
          
          // Store contributions for each currency
          const baseContributions = currencyContributions.get(baseCurrency);
          const quoteContributions = currencyContributions.get(quoteCurrency);
          
          baseContributions.push(logReturn);
          quoteContributions.push(-logReturn); // Opposite effect for quote currency
          
          currencyContributions.set(baseCurrency, baseContributions);
          currencyContributions.set(quoteCurrency, quoteContributions);
        }
      });
      
      // Apply the averaging formula: SC(t) = (1/NC) * Σ sC,j(t)
      currencies.forEach(currency => {
        const contributions = currencyContributions.get(currency);
        if (contributions && contributions.length > 0) {
          const averageContribution = contributions.reduce((sum, val) => sum + val, 0) / contributions.length;
          
          // Convert to percentage and scale more conservatively
          const strengthChange = averageContribution * 200; // Reduced scale for more balanced values
          const newStrength = Math.max(20, Math.min(80, 50 + strengthChange)); // Keep within 20-80 range
          
          strengthMap.set(currency, newStrength);
        } else {
          // Ensure currencies without data are explicitly set to neutral
          strengthMap.set(currency, 50);
        }
      });
      
      // Only normalize currencies that have actual data contributions
      const currenciesWithData = currencies.filter(currency => {
        const contributions = currencyContributions.get(currency);
        return contributions && contributions.length > 0;
      });
      
      if (currenciesWithData.length > 1) {
        // Only normalize currencies that have data
        const strengthValues = currenciesWithData.map(currency => strengthMap.get(currency));
        const minStrength = Math.min(...strengthValues);
        const maxStrength = Math.max(...strengthValues);
        const range = maxStrength - minStrength;
        
        if (range > 0) {
          currenciesWithData.forEach(currency => {
            const strength = strengthMap.get(currency);
            // Normalize to 10-90 range while preserving relative relationships (more conservative)
            const normalizedStrength = 10 + ((strength - minStrength) / range) * 80;
            strengthMap.set(currency, normalizedStrength);
          });
        }
      }
      
      // Final safety check: ensure all currencies have reasonable strength values
      currencies.forEach(currency => {
        const currentStrength = strengthMap.get(currency);
        if (currentStrength === 0 || currentStrength === undefined || isNaN(currentStrength)) {
          strengthMap.set(currency, 50);
        } else if (currentStrength < 10) {
          strengthMap.set(currency, 10); // Minimum strength
        } else if (currentStrength > 90) {
          strengthMap.set(currency, 90); // Maximum strength
        }
      });
      
      // Debug logging
      // eslint-disable-next-line no-console
      console.log('Currency Strength Calculation Debug:');
      currencies.forEach(currency => {
        const strength = strengthMap.get(currency);
        const contributions = currencyContributions.get(currency);
        // eslint-disable-next-line no-console
        console.log(`${currency}: strength=${strength}, contributions=${contributions ? contributions.length : 0}`);
      });
      
      set({ currencyStrength: strengthMap });
      get().addLog('Enhanced currency strength calculation completed', 'info');
    },
    
    // Legacy calculation method (original implementation)
    calculateLegacyCurrencyStrength: () => {
      const state = get();
      
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
      const strengthMap = new Map();
      
      // Initialize all currencies with neutral strength (50)
      currencies.forEach(currency => {
        strengthMap.set(currency, 50);
      });
      
      // Process each subscribed pair
      state.subscriptions.forEach((subscription, symbol) => {
        
        // Extract base and quote currencies from symbol (e.g., EURUSDm -> EUR, USD)
        const symbolWithoutM = symbol.replace('m', '');
        let baseCurrency = '';
        let quoteCurrency = '';
        
        // Parse currency pair
        for (let i = 3; i <= 6; i++) {
          const potential = symbolWithoutM.substring(0, i);
          if (currencies.includes(potential)) {
            baseCurrency = potential;
            quoteCurrency = symbolWithoutM.substring(i);
            break;
          }
        }
        
        if (!baseCurrency || !quoteCurrency || !currencies.includes(quoteCurrency)) {
          return;
        }
        
        // Get price data based on mode
        let currentPrice, previousPrice;
        
        if (state.settings.mode === 'live') {
          // Use latest tick data
          const tickInfo = state.tickData.get(symbol);
          if (tickInfo && tickInfo.ticks.length >= 2) {
            currentPrice = tickInfo.ticks[0].bid;
            previousPrice = tickInfo.ticks[1].bid;
          }
        } else {
          // Use closed candle data
          const ohlcInfo = state.ohlcData.get(symbol);
          if (ohlcInfo && ohlcInfo.bars.length >= 2) {
            const bars = ohlcInfo.bars;
            currentPrice = bars[bars.length - 1].close;
            previousPrice = bars[bars.length - 2].close;
          }
        }
        
        if (currentPrice && previousPrice && currentPrice > 0 && previousPrice > 0) {
          const priceChange = (currentPrice - previousPrice) / previousPrice;
          const changePercent = priceChange * 100;
          
          // Update currency strengths
          const currentBaseStrength = strengthMap.get(baseCurrency);
          const currentQuoteStrength = strengthMap.get(quoteCurrency);
          
          // If base currency strengthened (pair went up), increase base strength, decrease quote strength
          // If base currency weakened (pair went down), decrease base strength, increase quote strength
          const strengthAdjustment = changePercent * 2; // Amplify the effect
          
          strengthMap.set(baseCurrency, Math.max(0, Math.min(100, currentBaseStrength + strengthAdjustment)));
          strengthMap.set(quoteCurrency, Math.max(0, Math.min(100, currentQuoteStrength - strengthAdjustment)));
        } else {
          get().addLog(`[Legacy] Skipping ${symbol} - could not parse currencies`, 'warning');
        }
      });
            
      // Only normalize if we have meaningful data variation
      const strengthValues = Array.from(strengthMap.values());
      const minStrength = Math.min(...strengthValues);
      const maxStrength = Math.max(...strengthValues);
      const range = maxStrength - minStrength;
      
      // Only normalize if there's sufficient range and not all values are the same
      if (range > 5) { // Only normalize if there's meaningful variation
        strengthMap.forEach((strength, currency) => {
          // Normalize to 0-100 range
          const normalizedStrength = ((strength - minStrength) / range) * 100;
          strengthMap.set(currency, normalizedStrength);
        });
      } else {
        // If no meaningful variation, ensure all currencies show neutral strength
        currencies.forEach(currency => {
          strengthMap.set(currency, 50);
        });
      }
      
      set({ currencyStrength: strengthMap });
      get().addLog('Legacy currency strength calculation completed', 'info');
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
      const ohlcData = get().ohlcData.get(symbol);
      return ohlcData ? ohlcData.bars : [];
    },

    getTicksForSymbol: (symbol) => {
      const tickData = get().tickData.get(symbol);
      return tickData ? tickData.ticks : [];
    },

    // Helper functions for pair management
    getFilteredPairs: (pairSet = 'all') => {
      switch (pairSet) {
        case 'core':
          return CORE_PAIRS;
        case 'extended':
          return EXTENDED_PAIRS;
        case 'precious_metals':
          return PRECIOUS_METALS_PAIRS;
        case 'crypto':
          return CRYPTO_PAIRS;
        case 'all':
        default:
          return ALL_PAIRS;
      }
    },

    updatePairSet: (pairSet) => {
      const state = get();
      const filteredPairs = get().getFilteredPairs(pairSet);
      
      set({
        settings: {
          ...state.settings,
          pairSet,
          autoSubscribeSymbols: filteredPairs
        }
      });
      
      // Re-subscribe to new pair set if connected
      if (state.isConnected) {
        get().autoSubscribeToMajorPairs();
      }
    },

    // Auto-subscription for enhanced currency pairs
    autoSubscribeToMajorPairs: () => {
      const state = get();
      if (!state.isConnected) return;

      const { subscribe } = get();
      
      state.settings.autoSubscribeSymbols.forEach(symbol => {
        if (!state.subscriptions.has(symbol)) {
          subscribe(symbol, state.settings.timeframe, ['ticks', 'ohlc']);
        }
      });
      
    }
  }))
);

export default useCurrencyStrengthStore;
