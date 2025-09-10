import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import watchlistService from '../services/watchlistService';

// Shared functionality that all dashboards can use
const useBaseMarketStore = create(
  subscribeWithSelector((set, get) => ({
    // News Data (shared across all dashboards)
    newsData: [],
    aiAnalysis: new Map(), // newsId -> AI analysis
    newsLoading: false,
    
    // Wishlist (shared across all dashboards)
    wishlist: new Set(), // tracked symbols
    watchlistLoading: false,
    watchlistError: null,
    
    // News Actions
    fetchNews: async () => {
      // Prevent multiple simultaneous calls
      if (get().newsLoading) {
        // eslint-disable-next-line no-console
        console.log('News fetch already in progress, skipping...');
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
        set({ newsData: news, aiAnalysis, newsLoading: false });
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