import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import websocketService from '../services/websocketService';

// Note: formatSymbol function removed as it's no longer used

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
    // Connection state (now managed by shared WebSocket service)
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    
    // Market data
    subscriptions: new Map(), // symbol -> subscription info
    tickData: new Map(),      // symbol -> latest ticks
    indicatorData: new Map(), // symbol -> indicator snapshots
    
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
      
      // Register with centralized message router
      websocketService.registerStore('currencyStrength', {
        messageHandler: (message, _rawData) => {
          try {
            get().handleMessage(message);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[CurrencyStrength] handleMessage error:', e);
          }
        },
        connectionCallback: () => {
          set({ isConnected: true, isConnecting: false });
          get().addLog('Connected to Market v2 (Currency Strength probe)', 'success');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('currencyStrength', {
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
          get().addLog('Disconnected from Market v2 (Currency Strength probe)', 'warning');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('currencyStrength', {
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
          get().addLog('Connection error (Currency Strength v2 probe)', 'error');
          
          // Report to global connection manager
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('currencyStrength', {
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
      websocketService.unregisterStore('currencyStrength');
      
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

            // Optional: trigger calculation lightly after initial snapshot
            setTimeout(() => {
              get().calculateCurrencyStrength();
            }, 200);
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
          
          // Remove automatic recalculation on tick updates to prevent flickering
          // Currency strength will only update on manual refresh or scheduled intervals
          // if (state.settings.mode === 'live') {
          //   get().calculateCurrencyStrength();
          // }
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
            
            // Keep recalculation manual/scheduled to avoid flickering
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
          subscribe(symbol, newSettings.timeframe, subscription.dataTypes || ['ticks', 'indicators']);
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
          // Use latest tick data for closed mode as well since OHLC is no longer available
          const tickInfo = state.tickData.get(symbol);
          if (tickInfo && tickInfo.ticks.length >= 2) {
            currentPrice = tickInfo.ticks[0].bid;
            previousPrice = tickInfo.ticks[1].bid;
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
          // Use latest tick data for closed mode as well since OHLC is no longer available
          const tickInfo = state.tickData.get(symbol);
          if (tickInfo && tickInfo.ticks.length >= 2) {
            currentPrice = tickInfo.ticks[0].bid;
            previousPrice = tickInfo.ticks[1].bid;
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
          subscribe(symbol, state.settings.timeframe, ['ticks', 'indicators']);
        }
      });
      
    }
  }))
);

export default useCurrencyStrengthStore;
