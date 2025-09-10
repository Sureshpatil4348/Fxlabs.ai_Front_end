import { supabase } from '../lib/supabaseClient';

class WatchlistService {
  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    return user;
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

    let normalized = (symbol || "").trim().toUpperCase();
    if (!normalized) throw new Error("Symbol is required");
    
    // Remove any slashes and spaces for consistent format
    normalized = normalized.replace(/[/\s]/g, '');
    
    // Remove 'M' suffix for consistent storage (watchlist stores base symbols)
    if (normalized.endsWith('M')) {
      normalized = normalized.slice(0, -1);
    }

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

    let normalized = (symbol || "").trim().toUpperCase();
    
    // Remove any slashes and spaces for consistent format
    normalized = normalized.replace(/[/\s]/g, '');
    
    // Remove 'M' suffix for consistent storage (watchlist stores base symbols)
    if (normalized.endsWith('M')) {
      normalized = normalized.slice(0, -1);
    }
    
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

    let normalized = (symbol || "").trim().toUpperCase();
    
    // Remove any slashes and spaces for consistent format
    normalized = normalized.replace(/[/\s]/g, '');
    
    // Remove 'M' suffix for consistent storage (watchlist stores base symbols)
    if (normalized.endsWith('M')) {
      normalized = normalized.slice(0, -1);
    }
    
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
      
      // Add missing symbols
      for (const symbol of toAdd) {
        await this.addToWatchlist(symbol);
      }
      
      // Remove extra symbols
      for (const symbol of toRemove) {
        await this.removeFromWatchlist(symbol);
      }
      
      return {
        added: toAdd,
        removed: toRemove,
        synced: true
      };
    } catch (error) {
      console.error('Sync watchlist error:', error);
      throw error;
    }
  }
}

const watchlistService = new WatchlistService();
export default watchlistService;
