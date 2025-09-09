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
        return symbols;
      } catch (error) {
        console.error('Failed to load watchlist:', error);
        set({ watchlistError: error.message, watchlistLoading: false });
        throw error;
      }
    },

    addToWishlist: async (symbol) => {
      try {
        // Add to database first
        await watchlistService.addToWatchlist(symbol);
        
        // Then update local state
        const wishlist = new Set(get().wishlist);
        wishlist.add(symbol);
        set({ wishlist, watchlistError: null });
        
        return true;
      } catch (error) {
        console.error('Failed to add to watchlist:', error);
        set({ watchlistError: error.message });
        throw error;
      }
    },

    removeFromWishlist: async (symbol) => {
      try {
        // Remove from database first
        await watchlistService.removeFromWatchlist(symbol);
        
        // Then update local state
        const wishlist = new Set(get().wishlist);
        wishlist.delete(symbol);
        set({ wishlist, watchlistError: null });
        
        return true;
      } catch (error) {
        console.error('Failed to remove from watchlist:', error);
        set({ watchlistError: error.message });
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
    }
  }))
);

export default useBaseMarketStore;