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
      // Prevent multiple simultaneous calls
      if (get().newsLoading) {
        console.log('News fetch already in progress, skipping...');
        return;
      }
      
      console.log('Store: Starting news fetch...');
      set({ newsLoading: true });
      
      try {
        const newsService = await import('../services/newsService');
        console.log('Store: Fetching news from API...');
        const news = await newsService.fetchForexFactoryNews();
        
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
