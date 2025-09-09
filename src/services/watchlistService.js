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

    // user_id backend trigger se auto-set hoga
    const { data, error } = await supabase
      .from("watchlist")
      .upsert(
        [{ symbol, user_id: user.id }],
        { onConflict: "user_id,symbol" } // match your unique constraint
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

    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("symbol", symbol);

    if (error) throw error;
    return true;
  }

  /**
   * Check if symbol exists in watchlist
   */
  async isInWatchlist(symbol) {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("watchlist")
      .select("id")
      .eq("symbol", symbol)
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
}

const watchlistService = new WatchlistService();
export default watchlistService;
