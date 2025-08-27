import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Shared functionality that all dashboards can use
const useBaseMarketStore = create(
  subscribeWithSelector((set, get) => ({
    // News Data (shared across all dashboards)
    newsData: [],
    aiAnalysis: new Map(), // newsId -> AI analysis
    newsLoading: false,
    
    // Wishlist (shared across all dashboards)
    wishlist: new Set(), // tracked symbols
    
    // News Actions
    fetchNews: async () => {
      set({ newsLoading: true });
      try {
        const newsService = await import('../services/newsService');
        const news = await newsService.fetchLatestNews();
        set({ newsData: news, newsLoading: false });
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

    // Wishlist Actions
    addToWishlist: (symbol) => {
      const wishlist = new Set(get().wishlist);
      wishlist.add(symbol);
      set({ wishlist });
    },

    removeFromWishlist: (symbol) => {
      const wishlist = new Set(get().wishlist);
      wishlist.delete(symbol);
      set({ wishlist });
    },

    isInWishlist: (symbol) => {
      return get().wishlist.has(symbol);
    },

    getWishlistArray: () => {
      return Array.from(get().wishlist);
    }
  }))
);

export default useBaseMarketStore;
