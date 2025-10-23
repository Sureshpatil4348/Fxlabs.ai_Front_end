/**
 * Enhanced Watchlist Service for Trading Chart Widget
 * Advanced local storage based watchlist management with timestamps and metadata
 */

const WATCHLIST_KEY = 'trading_widget_watchlist';
const WATCHLIST_METADATA_KEY = 'trading_widget_watchlist_metadata';

class WidgetWatchlistService {
  /**
   * Get all watchlist symbols with metadata
   * @returns {Array<Object>} Array of watchlist items with metadata
   */
  getWatchlist() {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      const metadata = localStorage.getItem(WATCHLIST_METADATA_KEY);
      
      const symbols = stored ? JSON.parse(stored) : [];
      const metadataObj = metadata ? JSON.parse(metadata) : {};
      
      // Return symbols with metadata
      return symbols.map(symbol => ({
        symbol,
        addedAt: metadataObj[symbol]?.addedAt || new Date().toISOString(),
        lastViewed: metadataObj[symbol]?.lastViewed || null,
        viewCount: metadataObj[symbol]?.viewCount || 0
      }));
    } catch (error) {
      console.error('Error reading watchlist:', error);
      return [];
    }
  }

  /**
   * Get watchlist symbols as simple array (backward compatibility)
   * @returns {Array<string>} Array of symbol strings
   */
  getWatchlistSymbols() {
    return this.getWatchlist().map(item => item.symbol);
  }

  /**
   * Add symbol to watchlist
   * @param {string} symbol - Symbol to add (e.g., 'EURUSD')
   * @returns {boolean} Success status
   */
  addToWatchlist(symbol) {
    try {
      if (!symbol) return false;
      
      const normalized = this._normalizeSymbol(symbol);
      const watchlist = this.getWatchlistSymbols();
      const metadata = this._getMetadata();
      
      // Check if already exists
      if (watchlist.includes(normalized)) {
        return true; // Already in watchlist
      }
      
      // Add symbol to watchlist
      watchlist.push(normalized);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
      
      // Add metadata
      metadata[normalized] = {
        addedAt: new Date().toISOString(),
        lastViewed: null,
        viewCount: 0
      };
      localStorage.setItem(WATCHLIST_METADATA_KEY, JSON.stringify(metadata));
      
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  }

  /**
   * Remove symbol from watchlist
   * @param {string} symbol - Symbol to remove
   * @returns {boolean} Success status
   */
  removeFromWatchlist(symbol) {
    try {
      if (!symbol) return false;
      
      const normalized = this._normalizeSymbol(symbol);
      const watchlist = this.getWatchlistSymbols();
      const metadata = this._getMetadata();
      const filtered = watchlist.filter(s => s !== normalized);
      
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
      
      // Remove metadata
      delete metadata[normalized];
      localStorage.setItem(WATCHLIST_METADATA_KEY, JSON.stringify(metadata));
      
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  }

  /**
   * Check if symbol is in watchlist
   * @param {string} symbol - Symbol to check
   * @returns {boolean} True if in watchlist
   */
  isInWatchlist(symbol) {
    try {
      if (!symbol) return false;
      
      const normalized = this._normalizeSymbol(symbol);
      const watchlist = this.getWatchlistSymbols();
      return watchlist.includes(normalized);
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  }

  /**
   * Toggle symbol in watchlist
   * @param {string} symbol - Symbol to toggle
   * @returns {boolean} New state (true = added, false = removed)
   */
  toggleWatchlist(symbol) {
    if (this.isInWatchlist(symbol)) {
      this.removeFromWatchlist(symbol);
      return false;
    } else {
      this.addToWatchlist(symbol);
      return true;
    }
  }

  /**
   * Clear entire watchlist
   * @returns {boolean} Success status
   */
  clearWatchlist() {
    try {
      localStorage.removeItem(WATCHLIST_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      return false;
    }
  }

  /**
   * Get watchlist count
   * @returns {number} Number of symbols in watchlist
   */
  getWatchlistCount() {
    return this.getWatchlistSymbols().length;
  }

  /**
   * Track symbol view (update lastViewed and viewCount)
   * @param {string} symbol - Symbol that was viewed
   * @returns {boolean} Success status
   */
  trackView(symbol) {
    try {
      if (!symbol || !this.isInWatchlist(symbol)) return false;
      
      const normalized = this._normalizeSymbol(symbol);
      const metadata = this._getMetadata();
      
      if (metadata[normalized]) {
        metadata[normalized].lastViewed = new Date().toISOString();
        metadata[normalized].viewCount = (metadata[normalized].viewCount || 0) + 1;
        localStorage.setItem(WATCHLIST_METADATA_KEY, JSON.stringify(metadata));
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking view:', error);
      return false;
    }
  }

  /**
   * Get watchlist statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const watchlist = this.getWatchlist();
    const totalViews = watchlist.reduce((sum, item) => sum + (item.viewCount || 0), 0);
    const recentlyViewed = watchlist.filter(item => {
      if (!item.lastViewed) return false;
      const lastViewed = new Date(item.lastViewed);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastViewed > oneDayAgo;
    }).length;

    return {
      totalSymbols: watchlist.length,
      totalViews,
      recentlyViewed,
      averageViews: watchlist.length > 0 ? Math.round(totalViews / watchlist.length) : 0
    };
  }

  /**
   * Get metadata object
   * @private
   * @returns {Object} Metadata object
   */
  _getMetadata() {
    try {
      const stored = localStorage.getItem(WATCHLIST_METADATA_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading metadata:', error);
      return {};
    }
  }

  /**
   * Normalize symbol for consistent storage
   * @private
   * @param {string} symbol - Symbol to normalize
   * @returns {string} Normalized symbol
   */
  _normalizeSymbol(symbol) {
    return (symbol || '').trim().toUpperCase().replace(/[/\s]/g, '');
  }
}

// Export singleton instance
export const watchlistService = new WidgetWatchlistService();
