import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import userStateService from '../services/userStateService';
import watchlistService from '../services/watchlistService';

// Shared functionality that all dashboards can use
const useBaseMarketStore = create(
  subscribeWithSelector((set, get) => ({
    // News Data (shared across all dashboards)
    newsData: [],
    aiAnalysis: new Map(), // newsId -> AI analysis
    newsLoading: false,
    newsLastFetchedAt: 0,
    
    // Wishlist (shared across all dashboards)
    wishlist: new Set(), // tracked symbols
    watchlistLoading: false,
    watchlistError: null,
    
    // Tab State Management
    tabState: {
      rsiThreshold: { overbought: 70, oversold: 30 },
      rsiTracker: { activeTab: 'oversold' },
      currencyStrength: { viewMode: 'bars' },
      news: { filter: 'upcoming' }
    },
    // Track which tab sections were updated locally to avoid DB race overwrites
    tabStateLocalUpdatedSections: new Set(),
    tabStateLoading: false,
    tabStateError: null,
    tabStateHasLoaded: false,
    
    // News Actions
    fetchNews: async () => {
      // Prevent multiple simultaneous calls
      if (get().newsLoading) {
        // eslint-disable-next-line no-console
        console.log('News fetch already in progress, skipping...');
        return;
      }
      // Debounce/TTL: skip if fetched within last 30 seconds
      const now = Date.now();
      const last = get().newsLastFetchedAt || 0;
      if (now - last < 30 * 1000) {
        // eslint-disable-next-line no-console
        console.log('News fetched recently, skipping duplicate fetch');
        return;
      }
      
      // eslint-disable-next-line no-console
      console.log('Store: Starting news fetch...');
      set({ newsLoading: true });
      
      try {
        const newsService = await import('../services/newsService');
        // eslint-disable-next-line no-console
        console.log('Store: Fetching news from API...');
        const news = await newsService.fetchForexFactoryNews();
        
        // eslint-disable-next-line no-console
        console.log('Store: News fetched, analyzing with AI...');
        // Fetch AI analysis for each news item
        const analysisPromises = news.map(async (newsItem) => {
          try {
            const analysis = await newsService.analyzeNewsWithAI(newsItem);
            return { newsId: newsItem.id, analysis };
          } catch (error) {
            console.error(`Failed to analyze news ${newsItem.id}:`, error);
            return null;
          }
        });
        
        const analysisResults = await Promise.all(analysisPromises);
        
        // Update AI analysis map
        const aiAnalysis = new Map();
        analysisResults.forEach(result => {
          if (result) {
            aiAnalysis.set(result.newsId, result.analysis);
          }
        });
        
        // eslint-disable-next-line no-console
        console.log('Store: Setting news data and analysis...');
        set({ newsData: news, aiAnalysis, newsLoading: false, newsLastFetchedAt: Date.now() });
      } catch (error) {
        console.error('Failed to fetch news:', error);
        set({ newsLoading: false });
      }
    },

    setAiAnalysis: (newsId, analysis) => {
      const aiAnalysis = new Map(get().aiAnalysis);
      aiAnalysis.set(newsId, analysis);
      set({ aiAnalysis });
    },

    // Tab State Actions
    loadTabState: async () => {
      if (get().tabStateHasLoaded) {
        return get().tabState;
      }
      set({ tabStateLoading: true, tabStateError: null });
      
      try {
        const dbTabState = await userStateService.getUserTabState();
        // Merge DB state with local state, preserving locally updated sections
        set((state) => {
          const updatedSections = state.tabStateLocalUpdatedSections;
          if (updatedSections && updatedSections.size > 0) {
            const merged = { ...dbTabState };
            updatedSections.forEach((section) => {
              // If this section was updated locally, keep the local value
              if (state.tabState && Object.prototype.hasOwnProperty.call(state.tabState, section)) {
                merged[section] = state.tabState[section];
              }
            });
            return { tabState: merged, tabStateLoading: false, tabStateHasLoaded: true };
          }
          // No local updates yet; trust DB fully (overrides defaults)
          return { tabState: dbTabState, tabStateLoading: false, tabStateHasLoaded: true };
        });
        return dbTabState;
      } catch (error) {
        console.error('Failed to load tab state:', error);
        set({ tabStateError: error.message, tabStateLoading: false });
        throw error;
      }
    },

    updateTabState: async (tabType, tabValue) => {
      try {
        // Update local state immediately for responsive UI
        set((state) => {
          const updatedSections = new Set(state.tabStateLocalUpdatedSections);
          updatedSections.add(tabType);
          return {
            tabState: {
              ...state.tabState,
              [tabType]: tabValue
            },
            tabStateError: null,
            tabStateLocalUpdatedSections: updatedSections
          };
        });

        // Update database in background
        await userStateService.updateTabState(tabType, tabValue);
      } catch (error) {
        console.error('Failed to update tab state:', error);
        set({ tabStateError: error.message });
        throw error;
      }
    },

    updateRSIThreshold: async (overbought, oversold) => {
      return await get().updateTabState('rsiThreshold', { overbought, oversold });
    },

    updateRSITrackerTab: async (activeTab) => {
      return await get().updateTabState('rsiTracker', { activeTab });
    },

    updateCurrencyStrengthView: async (viewMode) => {
      return await get().updateTabState('currencyStrength', { viewMode });
    },

    updateNewsFilter: async (filter) => {
      return await get().updateTabState('news', { filter });
    },

    resetTabState: async () => {
      try {
        await userStateService.resetUserTabState();
        const defaultState = {
          rsiThreshold: { overbought: 70, oversold: 30 },
          rsiTracker: { activeTab: 'oversold' },
          currencyStrength: { viewMode: 'bars' },
          news: { filter: 'upcoming' }
        };
        set({ tabState: defaultState, tabStateError: null, tabStateLocalUpdatedSections: new Set() });
      } catch (error) {
        console.error('Failed to reset tab state:', error);
        set({ tabStateError: error.message });
        throw error;
      }
    },

    // Watchlist Actions with Database Persistence
    loadWatchlist: async () => {
      set({ watchlistLoading: true, watchlistError: null });
      
      try {
        const symbols = await watchlistService.getWatchlistSymbols();
        const wishlist = new Set(symbols);
        set({ wishlist, watchlistLoading: false });
        
        // Auto-subscribe to market data for existing watchlist items
        try {
          const useRSITrackerStore = await import('./useRSITrackerStore');
          const rsiStore = useRSITrackerStore.default.getState();
          symbols.forEach(symbol => {
            rsiStore.subscribeWatchlistSymbol(symbol);
          });
        } catch (subscribeError) {
          console.error('Failed to auto-subscribe to watchlist symbols:', subscribeError);
          // Don't throw error as watchlist loading was successful
        }
        
        return symbols;
      } catch (error) {
        console.error('Failed to load watchlist:', error);
        set({ watchlistError: error.message, watchlistLoading: false });
        throw error;
      }
    },

    addToWishlist: async (symbol) => {
      try {
        // Normalize + validate (store base symbols without 'M' suffix)
        let normalized = (symbol ?? '').trim().toUpperCase();
        if (!normalized) {
          const err = new Error('Symbol is required');
          set({ watchlistError: err.message });
          throw err;
        }
        
        // Remove any slashes and spaces for consistent format
        normalized = normalized.replace(/[/\s]/g, '');
        
        // Remove 'M' suffix for consistent storage
        if (normalized.endsWith('M')) {
          normalized = normalized.slice(0, -1);
        }
        // Add to database first
       await watchlistService.addToWatchlist(normalized);
       // Then update local state (functional update to avoid races)
       set((state) => {
          const wishlist = new Set(state.wishlist);
         wishlist.add(normalized);
          return { wishlist, watchlistError: null };
        });
        
        // Auto-subscribe to market data in RSI Tracker
        try {
          const useRSITrackerStore = await import('./useRSITrackerStore');
          useRSITrackerStore.default.getState().subscribeWatchlistSymbol(normalized);
        } catch (subscribeError) {
          console.error('Failed to auto-subscribe to market data:', subscribeError);
          // Don't throw error as watchlist addition was successful
        }
        
        return true;
      } catch (error) {
        console.error('Failed to add to watchlist:', error);
        const message = error?.userMessage || error?.message || 'Failed to add to watchlist';
        set({ watchlistError: message });
        throw error;
      }
    },

    removeFromWishlist: async (symbol) => {
      try {
        let normalized = (symbol ?? '').trim().toUpperCase();
        if (!normalized) {
          const err = new Error('Symbol is required');
          set({ watchlistError: err.message });
          throw err;
        }
        
        // Remove any slashes and spaces for consistent format
        normalized = normalized.replace(/[/\s]/g, '');
        
        // Remove 'M' suffix for consistent storage
        if (normalized.endsWith('M')) {
          normalized = normalized.slice(0, -1);
        }
        // Remove from database first
        await watchlistService.removeFromWatchlist(normalized);
        // Also stop market data (handles both active and pending)
        try {
          const useRSITrackerStore = await import('./useRSITrackerStore');
          const rsiStore = useRSITrackerStore.default.getState();
          if (typeof rsiStore.unsubscribeWatchlistSymbol === 'function') {
            rsiStore.unsubscribeWatchlistSymbol(normalized);
          } else if (rsiStore.isConnected) {
            // Fallback for older RSI store versions
            rsiStore.unsubscribe(normalized + 'm');
          }
        } catch (unsubscribeError) {
          console.error('Failed to unsubscribe market data for removed symbol:', unsubscribeError);
          // Do not fail the removal on unsubscribe issues
        }
        // Then update local state (functional update to avoid races)
        set((state) => {
          const wishlist = new Set(state.wishlist);
          wishlist.delete(normalized);
          return { wishlist, watchlistError: null };
       });
        
        return true;
      } catch (error) {
        console.error('Failed to remove from watchlist:', error);
        const message = error?.userMessage || error?.message || 'Failed to remove from watchlist';
        set({ watchlistError: message });
        throw error;
      }
    },

    isInWishlist: (symbol) => {
      return get().wishlist.has(symbol);
    },

    getWishlistArray: () => {
      return Array.from(get().wishlist);
    },

    // Sync local state with database
    syncWatchlist: async () => {
      try {
        const localSymbols = get().getWishlistArray();
        const result = await watchlistService.syncWatchlist(localSymbols);
        
        // Reload watchlist from database to ensure consistency
        await get().loadWatchlist();
        
        return result;
      } catch (error) {
        console.error('Failed to sync watchlist:', error);
        set({ watchlistError: error.message });
        throw error;
      }
    },

    // Clear watchlist error
    clearWatchlistError: () => {
      set({ watchlistError: null });
    },

    // Force refresh watchlist subscriptions
    refreshWatchlistSubscriptions: async () => {
      try {
        const symbols = get().getWishlistArray();
        const useRSITrackerStore = await import('./useRSITrackerStore');
        const rsiStore = useRSITrackerStore.default.getState();
        
        if (rsiStore.isConnected) {
          symbols.forEach(symbol => {
            rsiStore.subscribeWatchlistSymbol(symbol);
          });
        }
      } catch (error) {
        console.error('Failed to refresh watchlist subscriptions:', error);
      }
    }
  }))
);

export default useBaseMarketStore;