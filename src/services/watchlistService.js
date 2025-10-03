import { supabase } from '../lib/supabaseClient';

class WatchlistService {
  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error fetching session:", error);
      return null;
    }
    return session?.user ?? null;
  }

  /**
   * Normalize symbol for consistent storage and lookup
   * @param {string} symbol - The symbol to normalize
   * @returns {string|null} - Normalized symbol or null if empty/invalid
   */
  _normalizeSymbol(symbol) {
    let normalized = (symbol || "").trim().toUpperCase();
    if (!normalized) return null;
    
    // Remove any slashes and spaces for consistent format
    normalized = normalized.replace(/[/\s]/g, '');
    
    // Remove 'M' suffix for consistent storage (watchlist stores base symbols)
    if (normalized.endsWith('M')) {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  }

  /**
   * Get all watchlist items for current user
   */
  async getWatchlist() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    
    const { data, error } = await supabase
         .from("watchlist")
          .select("*")
       .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add symbol to watchlist
   */
  async addToWatchlist(symbol) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const normalized = this._normalizeSymbol(symbol);
    if (!normalized) throw new Error("Symbol is required");

    const { data, error } = await supabase
      .from("watchlist")
      .upsert(
        [{ symbol: normalized, user_id: user.id }],
        { onConflict: "user_id,symbol" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove symbol from watchlist
   */
  async removeFromWatchlist(symbol) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const normalized = this._normalizeSymbol(symbol);
    if (!normalized) throw new Error("Symbol is required");
    
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("symbol", normalized);

    if (error) throw error;
    return true;
  }

  /**
   * Check if symbol exists in watchlist
   */
  async isInWatchlist(symbol) {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const normalized = this._normalizeSymbol(symbol);
    if (!normalized) return false;
    
    const { data, error } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("symbol", normalized)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  /**
   * Get only symbols
   */
  async getWatchlistSymbols() {
    const list = await this.getWatchlist();
    return list.map(item => item.symbol);
  }

  /**
   * Sync local watchlist with database
   */
  async syncWatchlist(localSymbols) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    try {
      // Get current database symbols
      const dbSymbols = await this.getWatchlistSymbols();
      
      // Find symbols to add (in local but not in db)
      const toAdd = localSymbols.filter(symbol => !dbSymbols.includes(symbol));
      
      // Find symbols to remove (in db but not in local)
      const toRemove = dbSymbols.filter(symbol => !localSymbols.includes(symbol));
      
      // Execute add operations concurrently
      const addPromises = toAdd.map(async (symbol) => {
        try {
          await this.addToWatchlist(symbol);
          return { symbol, success: true, error: null };
        } catch (error) {
          console.error(`Failed to add symbol ${symbol} to watchlist:`, error);
          return { symbol, success: false, error: error.message };
        }
      });
      
      // Execute remove operations concurrently
      const removePromises = toRemove.map(async (symbol) => {
        try {
          await this.removeFromWatchlist(symbol);
          return { symbol, success: true, error: null };
        } catch (error) {
          console.error(`Failed to remove symbol ${symbol} from watchlist:`, error);
          return { symbol, success: false, error: error.message };
        }
      });
      
      // Wait for all operations to complete
      const [addResults, removeResults] = await Promise.all([
        Promise.allSettled(addPromises),
        Promise.allSettled(removePromises)
      ]);
      
      // Process add results
      const added = [];
      const addFailures = [];
      addResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { symbol, success, error } = result.value;
          if (success) {
            added.push(symbol);
          } else {
            addFailures.push({ symbol, error });
          }
        } else {
          addFailures.push({ symbol: toAdd[index], error: result.reason?.message || 'Unknown error' });
        }
      });
      
      // Process remove results
      const removed = [];
      const removeFailures = [];
      removeResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { symbol, success, error } = result.value;
          if (success) {
            removed.push(symbol);
          } else {
            removeFailures.push({ symbol, error });
          }
        } else {
          removeFailures.push({ symbol: toRemove[index], error: result.reason?.message || 'Unknown error' });
        }
      });
      
      // Log any failures
      if (addFailures.length > 0 || removeFailures.length > 0) {
        console.warn('Sync watchlist completed with some failures:', {
          addFailures,
          removeFailures
        });
      }
      
      return {
        added,
        removed,
        addFailures,
        removeFailures,
        synced: addFailures.length === 0 && removeFailures.length === 0,
        totalOperations: toAdd.length + toRemove.length,
        successfulOperations: added.length + removed.length
      };
    } catch (error) {
      console.error('Sync watchlist error:', error);
      throw error;
    }
  }
}

const watchlistService = new WatchlistService();
export default watchlistService;
