import { supabase } from '../lib/supabaseClient';

class UserStateService {
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
   * Get user tab state from database
   */
  async getUserTabState() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_state")
      .select("tab_state")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    
    // Return default tab state if no data exists
    if (!data) {
      return {
        rsiThreshold: { overbought: 70, oversold: 30 },
        rsiTracker: { 
          activeTab: 'oversold',
          viewMode: 'table',
          filters: {
            rsiRange: { min: 0, max: 100 },
            rfiRange: { min: -1, max: 1 },
            pairType: 'all',
            signal: 'all',
            volume: 'all'
          },
          sortOptions: { by: 'rsi', order: 'desc' }
        },
        currencyStrength: { viewMode: 'bars' },
        news: { filter: 'upcoming' }
      };
    }

    return data.tab_state || {};
  }

  /**
   * Update user tab state in database
   */
  async updateUserTabState(tabState) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get current state and merge with new state
    const currentState = await this.getUserTabState();
    const mergedState = { ...currentState, ...tabState };

    const { data, error } = await supabase
      .from("user_state")
      .upsert(
        [{ 
          user_id: user.id, 
          tab_state: mergedState
        }],
        { 
          onConflict: "user_id",
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update specific tab state
   */
  async updateTabState(tabType, tabValue) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get current state
    const currentState = await this.getUserTabState();
    
    // Update specific tab
    const updatedState = {
      ...currentState,
      [tabType]: tabValue
    };

    return await this.updateUserTabState(updatedState);
  }

  /**
   * Reset user tab state to defaults
   */
  async resetUserTabState() {
    const defaultState = {
      rsiThreshold: { overbought: 70, oversold: 30 },
      rsiTracker: { 
        activeTab: 'oversold',
        viewMode: 'table',
        filters: {
          rsiRange: { min: 0, max: 100 },
          rfiRange: { min: -1, max: 1 },
          pairType: 'all',
          signal: 'all',
          volume: 'all'
        },
        sortOptions: { by: 'rsi', order: 'desc' }
      },
      currencyStrength: { viewMode: 'bars' },
      news: { filter: 'upcoming' }
    };

    return await this.updateUserTabState(defaultState);
  }
}

const userStateService = new UserStateService();
export default userStateService;