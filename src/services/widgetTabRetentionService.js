import { supabase } from '../lib/supabaseClient';

/**
 * =====================================================================
 * Widget Tab Retention Service
 * =====================================================================
 * Manages persistent storage of widget states and configurations
 * for tools tab widgets in the dashboard, as well as dashboard-level
 * settings like active tab selection.
 * 
 * Features:
 * - Get/Set widget states with automatic user authentication
 * - Support for multiple widgets with individual configurations
 * - Default state management for each widget type
 * - Batch operations for multiple widgets
 * - Dashboard active tab retention (Analysis/Tools)
 * - Error handling and validation
 * =====================================================================
 */

class WidgetTabRetentionService {
  /**
   * Widget names constants for type safety
   */
  static WIDGETS = {
    LOT_SIZE_CALCULATOR: 'LotSizeCalculator',
    MULTI_TIME_ANALYSIS: 'MultiTimeAnalysis',
    MULTI_INDICATOR_HEATMAP: 'MultiIndicatorHeatmap'
  };

  /**
   * Special widget name for dashboard-level settings
   */
  static DASHBOARD_SETTINGS = 'DashboardSettings';

  /**
   * Valid tab names for dashboard
   */
  static TABS = {
    ANALYSIS: 'analysis',
    TOOLS: 'tools'
  };

  /**
   * Get current authenticated user
   * @returns {Promise<Object|null>} User object or null if not authenticated
   */
  async getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }
      return session?.user ?? null;
    } catch (err) {
      console.error('Error in getCurrentUser:', err);
      return null;
    }
  }

  /**
   * Get default state for a specific widget
   * @param {string} widgetName - Name of the widget
   * @returns {Object} Default state object
   */
  getDefaultWidgetState(widgetName) {
    const defaults = {
      [WidgetTabRetentionService.WIDGETS.LOT_SIZE_CALCULATOR]: {
        accountBalance: '',
        riskPercentage: '',
        stopLoss: '',
        instrumentType: 'forex',
        currencyPair: 'EURUSDm',
        contractSize: '100000',
        pipValue: '10',
        currentPrice: '',
        lastCalculation: null
      },
      [WidgetTabRetentionService.WIDGETS.MULTI_TIME_ANALYSIS]: {
        selectedTimezone: 'Asia/Kolkata',
        is24Hour: false,
        sliderPosition: 66.67
      },
      [WidgetTabRetentionService.WIDGETS.MULTI_INDICATOR_HEATMAP]: {
        selectedSymbol: 'EURUSDm',
        tradingStyle: 'swingTrader',
        indicatorWeight: 'equal',
        showNewSignals: true,
        visibleIndicators: ['rsi', 'macd', 'ema', 'sma'],
        timeframeFilter: 'all'
      },
      [WidgetTabRetentionService.DASHBOARD_SETTINGS]: {
        activeTab: WidgetTabRetentionService.TABS.ANALYSIS,
        lastVisited: null
      }
    };

    return defaults[widgetName] || {};
  }

  /**
   * Get default configuration for a specific widget
   * @param {string} widgetName - Name of the widget
   * @returns {Object} Default configuration object
   */
  getDefaultWidgetConfig(widgetName) {
    const configs = {
      [WidgetTabRetentionService.WIDGETS.LOT_SIZE_CALCULATOR]: {
        autoSave: true,
        refreshOnDataChange: true,
        showAdvancedOptions: false
      },
      [WidgetTabRetentionService.WIDGETS.MULTI_TIME_ANALYSIS]: {
        showMarketHours: true,
        highlightActiveMarkets: true,
        showAllTimezones: false
      },
      [WidgetTabRetentionService.WIDGETS.MULTI_INDICATOR_HEATMAP]: {
        autoUpdate: true,
        updateInterval: 30000, // 30 seconds
        showLegend: true,
        colorScheme: 'default'
      },
      [WidgetTabRetentionService.DASHBOARD_SETTINGS]: {
        rememberTab: true,
        autoSwitchOnAction: false
      }
    };

    return configs[widgetName] || {};
  }

  /**
   * Get widget state from database
   * @param {string} widgetName - Name of the widget
   * @returns {Promise<Object>} Widget state object
   */
  async getWidgetState(widgetName) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.warn('User not authenticated, returning default state');
        return this.getDefaultWidgetState(widgetName);
      }

      const { data, error } = await supabase
        .from('widget_tab_retention')
        .select('widget_state, widget_config, is_visible, display_order')
        .eq('user_id', user.id)
        .eq('widget_name', widgetName)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching widget state for ${widgetName}:`, error);
        return this.getDefaultWidgetState(widgetName);
      }

      // Return default if no data exists
      if (!data) {
        return this.getDefaultWidgetState(widgetName);
      }

      // Merge with defaults to ensure all properties exist
      return {
        ...this.getDefaultWidgetState(widgetName),
        ...data.widget_state,
        _config: data.widget_config || this.getDefaultWidgetConfig(widgetName),
        _isVisible: data.is_visible ?? true,
        _displayOrder: data.display_order ?? 0
      };
    } catch (err) {
      console.error(`Error in getWidgetState for ${widgetName}:`, err);
      return this.getDefaultWidgetState(widgetName);
    }
  }

  /**
   * Save widget state to database
   * @param {string} widgetName - Name of the widget
   * @param {Object} state - Widget state object
   * @param {Object} options - Optional configuration
   * @returns {Promise<Object>} Updated widget data
   */
  async saveWidgetState(widgetName, state, options = {}) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate widget name - include both widgets and dashboard settings
      const validWidgets = [
        ...Object.values(WidgetTabRetentionService.WIDGETS),
        WidgetTabRetentionService.DASHBOARD_SETTINGS
      ];
      if (!validWidgets.includes(widgetName)) {
        throw new Error(`Invalid widget name: ${widgetName}`);
      }

      // Get current state to merge with new state
      const currentData = await this.getWidgetState(widgetName);
      
      // Extract metadata from current state
      const currentConfig = currentData._config || this.getDefaultWidgetConfig(widgetName);
      const currentIsVisible = currentData._isVisible ?? true;
      const currentDisplayOrder = currentData._displayOrder ?? 0;

      // Remove metadata from state
      const { _config, _isVisible, _displayOrder, ...cleanState } = state;

      // Merge states
      const mergedState = { ...currentData, ...cleanState };
      
      // Remove metadata from merged state
      const { _config: _, _isVisible: __, _displayOrder: ___, ...finalState } = mergedState;

      // Prepare upsert data
      const upsertData = {
        user_id: user.id,
        widget_name: widgetName,
        widget_state: finalState,
        widget_config: options.config || currentConfig,
        is_visible: options.isVisible !== undefined ? options.isVisible : currentIsVisible,
        display_order: options.displayOrder !== undefined ? options.displayOrder : currentDisplayOrder,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('widget_tab_retention')
        .upsert(upsertData, { 
          onConflict: 'user_id,widget_name',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error(`Error saving widget state for ${widgetName}:`, error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`Error in saveWidgetState for ${widgetName}:`, err);
      throw err;
    }
  }

  /**
   * Update specific fields in widget state (partial update)
   * @param {string} widgetName - Name of the widget
   * @param {Object} partialState - Partial state object to update
   * @returns {Promise<Object>} Updated widget data
   */
  async updateWidgetState(widgetName, partialState) {
    try {
      const currentState = await this.getWidgetState(widgetName);
      const updatedState = { ...currentState, ...partialState };
      return await this.saveWidgetState(widgetName, updatedState);
    } catch (err) {
      console.error(`Error in updateWidgetState for ${widgetName}:`, err);
      throw err;
    }
  }

  /**
   * Get all widget states for current user
   * @returns {Promise<Object>} Object with all widget states keyed by widget name
   */
  async getAllWidgetStates() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.warn('User not authenticated, returning default states');
        const defaults = {};
        Object.values(WidgetTabRetentionService.WIDGETS).forEach(widgetName => {
          defaults[widgetName] = this.getDefaultWidgetState(widgetName);
        });
        return defaults;
      }

      const { data, error } = await supabase
        .from('widget_tab_retention')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching all widget states:', error);
        throw error;
      }

      // Convert array to object keyed by widget_name
      const widgetStates = {};
      
      // Add all default widgets first
      Object.values(WidgetTabRetentionService.WIDGETS).forEach(widgetName => {
        widgetStates[widgetName] = this.getDefaultWidgetState(widgetName);
      });

      // Override with saved data
      if (data && data.length > 0) {
        data.forEach(widget => {
          widgetStates[widget.widget_name] = {
            ...this.getDefaultWidgetState(widget.widget_name),
            ...widget.widget_state,
            _config: widget.widget_config || this.getDefaultWidgetConfig(widget.widget_name),
            _isVisible: widget.is_visible ?? true,
            _displayOrder: widget.display_order ?? 0,
            _updatedAt: widget.updated_at
          };
        });
      }

      return widgetStates;
    } catch (err) {
      console.error('Error in getAllWidgetStates:', err);
      throw err;
    }
  }

  /**
   * Save multiple widget states in batch
   * @param {Object} widgetStates - Object with widget states keyed by widget name
   * @returns {Promise<Array>} Array of saved widget data
   */
  async saveAllWidgetStates(widgetStates) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const savePromises = Object.entries(widgetStates).map(([widgetName, state]) => {
        return this.saveWidgetState(widgetName, state);
      });

      const results = await Promise.allSettled(savePromises);
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const widgetName = Object.keys(widgetStates)[index];
          console.error(`Failed to save ${widgetName}:`, result.reason);
        }
      });

      // Return successful saves
      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (err) {
      console.error('Error in saveAllWidgetStates:', err);
      throw err;
    }
  }

  /**
   * Reset widget state to default
   * @param {string} widgetName - Name of the widget
   * @returns {Promise<boolean>} Success status
   */
  async resetWidgetState(widgetName) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('widget_tab_retention')
        .delete()
        .eq('user_id', user.id)
        .eq('widget_name', widgetName);

      if (error) {
        console.error(`Error resetting widget state for ${widgetName}:`, error);
        throw error;
      }

      return true;
    } catch (err) {
      console.error(`Error in resetWidgetState for ${widgetName}:`, err);
      throw err;
    }
  }

  /**
   * Reset all widget states to defaults
   * @returns {Promise<number>} Number of deleted records
   */
  async resetAllWidgetStates() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('widget_tab_retention')
        .delete()
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Error resetting all widget states:', error);
        throw error;
      }

      return data ? data.length : 0;
    } catch (err) {
      console.error('Error in resetAllWidgetStates:', err);
      throw err;
    }
  }

  /**
   * Update widget visibility
   * @param {string} widgetName - Name of the widget
   * @param {boolean} isVisible - Visibility status
   * @returns {Promise<Object>} Updated widget data
   */
  async setWidgetVisibility(widgetName, isVisible) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const currentState = await this.getWidgetState(widgetName);
      return await this.saveWidgetState(widgetName, currentState, { isVisible });
    } catch (err) {
      console.error(`Error in setWidgetVisibility for ${widgetName}:`, err);
      throw err;
    }
  }

  /**
   * Update widget display order
   * @param {string} widgetName - Name of the widget
   * @param {number} displayOrder - Display order value
   * @returns {Promise<Object>} Updated widget data
   */
  async setWidgetDisplayOrder(widgetName, displayOrder) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const currentState = await this.getWidgetState(widgetName);
      return await this.saveWidgetState(widgetName, currentState, { displayOrder });
    } catch (err) {
      console.error(`Error in setWidgetDisplayOrder for ${widgetName}:`, err);
      throw err;
    }
  }

  /**
   * Update widget configuration
   * @param {string} widgetName - Name of the widget
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Updated widget data
   */
  async updateWidgetConfig(widgetName, config) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const currentState = await this.getWidgetState(widgetName);
      const currentConfig = currentState._config || this.getDefaultWidgetConfig(widgetName);
      const mergedConfig = { ...currentConfig, ...config };
      
      return await this.saveWidgetState(widgetName, currentState, { config: mergedConfig });
    } catch (err) {
      console.error(`Error in updateWidgetConfig for ${widgetName}:`, err);
      throw err;
    }
  }

  /**
   * Get widget configuration
   * @param {string} widgetName - Name of the widget
   * @returns {Promise<Object>} Widget configuration object
   */
  async getWidgetConfig(widgetName) {
    try {
      const state = await this.getWidgetState(widgetName);
      return state._config || this.getDefaultWidgetConfig(widgetName);
    } catch (err) {
      console.error(`Error in getWidgetConfig for ${widgetName}:`, err);
      return this.getDefaultWidgetConfig(widgetName);
    }
  }

  /**
   * Check if widget state exists in database
   * @param {string} widgetName - Name of the widget
   * @returns {Promise<boolean>} True if widget state exists
   */
  async widgetStateExists(widgetName) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('widget_tab_retention')
        .select('id')
        .eq('user_id', user.id)
        .eq('widget_name', widgetName)
        .maybeSingle();

      if (error) {
        console.error(`Error checking widget state existence for ${widgetName}:`, error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error(`Error in widgetStateExists for ${widgetName}:`, err);
      return false;
    }
  }

  /**
   * Export all widget states as JSON
   * @returns {Promise<string>} JSON string of all widget states
   */
  async exportWidgetStates() {
    try {
      const states = await this.getAllWidgetStates();
      return JSON.stringify(states, null, 2);
    } catch (err) {
      console.error('Error in exportWidgetStates:', err);
      throw err;
    }
  }

  /**
   * Import widget states from JSON
   * @param {string} jsonString - JSON string of widget states
   * @returns {Promise<Array>} Array of saved widget data
   */
  async importWidgetStates(jsonString) {
    try {
      const states = JSON.parse(jsonString);
      return await this.saveAllWidgetStates(states);
    } catch (err) {
      console.error('Error in importWidgetStates:', err);
      throw err;
    }
  }

  /**
   * =====================================================================
   * Dashboard Active Tab Management
   * =====================================================================
   */

  /**
   * Get the active tab from database
   * @returns {Promise<string>} Active tab name ('analysis' or 'tools')
   */
  async getActiveTab() {
    try {
      console.log('[WidgetRetention] getActiveTab() called');
      const user = await this.getCurrentUser();
      if (!user) {
        console.warn('[WidgetRetention] User not authenticated, returning default active tab');
        return WidgetTabRetentionService.TABS.ANALYSIS;
      }

      console.log('[WidgetRetention] User authenticated:', user.id);
      console.log('[WidgetRetention] Querying widget_tab_retention for DashboardSettings...');

      const { data, error } = await supabase
        .from('widget_tab_retention')
        .select('widget_state')
        .eq('user_id', user.id)
        .eq('widget_name', WidgetTabRetentionService.DASHBOARD_SETTINGS)
        .maybeSingle();

      if (error) {
        console.error('[WidgetRetention] Error fetching active tab:', error);
        return WidgetTabRetentionService.TABS.ANALYSIS;
      }

      console.log('[WidgetRetention] Query result:', data);

      if (!data || !data.widget_state || !data.widget_state.activeTab) {
        console.log('[WidgetRetention] No saved tab found, returning default (analysis)');
        return WidgetTabRetentionService.TABS.ANALYSIS;
      }

      // Validate the tab value
      const validTabs = Object.values(WidgetTabRetentionService.TABS);
      if (!validTabs.includes(data.widget_state.activeTab)) {
        console.warn(`[WidgetRetention] Invalid tab value: ${data.widget_state.activeTab}, returning default`);
        return WidgetTabRetentionService.TABS.ANALYSIS;
      }

      console.log('[WidgetRetention] Returning saved tab:', data.widget_state.activeTab);
      return data.widget_state.activeTab;
    } catch (err) {
      console.error('[WidgetRetention] Error in getActiveTab:', err);
      return WidgetTabRetentionService.TABS.ANALYSIS;
    }
  }

  /**
   * Save the active tab to database
   * @param {string} tabName - Tab name ('analysis' or 'tools')
   * @returns {Promise<Object>} Updated dashboard settings data
   */
  async setActiveTab(tabName) {
    try {
      console.log('[WidgetRetention] setActiveTab() called with:', tabName);
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('[WidgetRetention] User not authenticated, cannot save tab');
        throw new Error('User not authenticated');
      }

      console.log('[WidgetRetention] User authenticated:', user.id);

      // Validate tab name
      const validTabs = Object.values(WidgetTabRetentionService.TABS);
      if (!validTabs.includes(tabName)) {
        console.error('[WidgetRetention] Invalid tab name:', tabName);
        throw new Error(`Invalid tab name: ${tabName}. Must be one of: ${validTabs.join(', ')}`);
      }

      const dashboardState = {
        activeTab: tabName,
        lastVisited: new Date().toISOString()
      };

      console.log('[WidgetRetention] Saving dashboard state:', dashboardState);

      const result = await this.saveWidgetState(
        WidgetTabRetentionService.DASHBOARD_SETTINGS,
        dashboardState
      );

      console.log('[WidgetRetention] Save successful, result:', result);
      return result;
    } catch (err) {
      console.error('[WidgetRetention] Error in setActiveTab:', err);
      throw err;
    }
  }

  /**
   * Get dashboard settings (includes active tab and other settings)
   * @returns {Promise<Object>} Dashboard settings object
   */
  async getDashboardSettings() {
    try {
      return await this.getWidgetState(WidgetTabRetentionService.DASHBOARD_SETTINGS);
    } catch (err) {
      console.error('Error in getDashboardSettings:', err);
      return this.getDefaultWidgetState(WidgetTabRetentionService.DASHBOARD_SETTINGS);
    }
  }

  /**
   * Update dashboard settings
   * @param {Object} settings - Partial dashboard settings to update
   * @returns {Promise<Object>} Updated dashboard settings data
   */
  async updateDashboardSettings(settings) {
    try {
      const currentSettings = await this.getDashboardSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      // Remove metadata
      const { _config, _isVisible, _displayOrder, ...cleanSettings } = updatedSettings;
      
      return await this.saveWidgetState(
        WidgetTabRetentionService.DASHBOARD_SETTINGS,
        cleanSettings
      );
    } catch (err) {
      console.error('Error in updateDashboardSettings:', err);
      throw err;
    }
  }

  /**
   * Reset dashboard settings to default
   * @returns {Promise<boolean>} Success status
   */
  async resetDashboardSettings() {
    try {
      return await this.resetWidgetState(WidgetTabRetentionService.DASHBOARD_SETTINGS);
    } catch (err) {
      console.error('Error in resetDashboardSettings:', err);
      throw err;
    }
  }
}

// Create and export singleton instance
const widgetTabRetentionService = new WidgetTabRetentionService();
export default widgetTabRetentionService;

// Also export the class for testing purposes
export { WidgetTabRetentionService };

