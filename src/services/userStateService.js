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
   * Get user tab state from database (existing functionality)
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
        rsiTracker: { activeTab: 'oversold' },
        currencyStrength: { viewMode: 'bars' },
        news: { filter: 'upcoming' }
      };
    }

    return data.tab_state || {};
  }

  /**
   * Update user tab state in database (existing functionality)
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
   * Update specific tab state (existing functionality)
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
   * Reset user tab state to defaults (existing functionality)
   */
  async resetUserTabState() {
    const defaultState = {
      rsiThreshold: { overbought: 70, oversold: 30 },
      rsiTracker: { activeTab: 'oversold' },
      currencyStrength: { viewMode: 'bars' },
      news: { filter: 'upcoming' }
    };

    return await this.updateUserTabState(defaultState);
  }

  // ========== NEW COMPREHENSIVE DASHBOARD SETTINGS FUNCTIONALITY ==========

  /**
   * Get default dashboard settings
   */
  getDefaultDashboardSettings() {
    return {
      // Global Settings
      global: {
        timeframe: '1H'
      },
      
      // RSI Correlation Settings
      rsiCorrelation: {
        timeframe: '1H',
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        correlationWindow: 50,
        calculationMode: 'rsi_threshold' // 'rsi_threshold' | 'real_correlation'
      },
      
      // RSI Tracker Settings
      rsiTracker: {
        timeframe: '1H',
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        autoSubscribeSymbols: [
          'EURUSDm', 'GBPUSDm', 'USDJPYm', 'USDCHFm', 'AUDUSDm', 'USDCADm', 'NZDUSDm',
          'EURGBPm', 'EURJPYm', 'EURCHFm', 'EURAUDm', 'EURCADm', 'EURNZDm',
          'GBPJPYm', 'GBPCHFm', 'GBPAUDm', 'GBPCADm', 'GBPNZDm',
          'AUDJPYm', 'AUDCHFm', 'AUDCADm', 'AUDNZDm',
          'CADJPYm', 'CADCHFm', 'CHFJPYm', 'NZDJPYm', 'NZDCHFm', 'NZDCADm'
        ]
      },
      
      // Currency Strength Settings
      currencyStrength: {
        timeframe: '1H',
        mode: 'closed', // 'closed' | 'live'
        useEnhancedCalculation: true,
        autoSubscribeSymbols: [
          // Major pairs (7)
          'EURUSDm', 'GBPUSDm', 'USDJPYm', 'USDCHFm', 'AUDUSDm', 'USDCADm', 'NZDUSDm',
          // EUR crosses (6)
          'EURGBPm', 'EURJPYm', 'EURCHFm', 'EURAUDm', 'EURCADm', 'EURNZDm',
          // GBP crosses (5)
          'GBPJPYm', 'GBPCHFm', 'GBPAUDm', 'GBPCADm', 'GBPNZDm',
          // AUD crosses (4)
          'AUDJPYm', 'AUDCHFm', 'AUDCADm', 'AUDNZDm',
          // NZD crosses (3)
          'NZDJPYm', 'NZDCHFm', 'NZDCADm',
          // CAD crosses (2)
          'CADJPYm', 'CADCHFm',
          // CHF crosses (1)
          'CHFJPYm'
        ]
      },
      
      // Multi-Indicator Heatmap Settings
      multiIndicatorHeatmap: {
        symbol: 'EURUSDm',
        tradingStyle: 'dayTrader',
        indicatorWeight: 'equal',
        showNewSignals: true
      }
    };
  }

  /**
   * Get user dashboard settings from database
   */
  async getUserDashboardSettings() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_settings")
      .select("dashboard_settings")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    
    // Return default settings if no data exists
    if (!data || !data.dashboard_settings) {
      return this.getDefaultDashboardSettings();
    }

    // Merge with defaults to ensure all settings are present
    const defaults = this.getDefaultDashboardSettings();
    const userSettings = data.dashboard_settings;
    
    return {
      global: { ...defaults.global, ...userSettings.global },
      rsiCorrelation: { ...defaults.rsiCorrelation, ...userSettings.rsiCorrelation },
      rsiTracker: { ...defaults.rsiTracker, ...userSettings.rsiTracker },
      currencyStrength: { ...defaults.currencyStrength, ...userSettings.currencyStrength },
      multiIndicatorHeatmap: { ...defaults.multiIndicatorHeatmap, ...userSettings.multiIndicatorHeatmap }
    };
  }

  /**
   * Update user dashboard settings in database
   */
  async updateUserDashboardSettings(settings) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get current settings and merge with new settings
    const currentSettings = await this.getUserDashboardSettings();
    const mergedSettings = {
      global: { ...currentSettings.global, ...settings.global },
      rsiCorrelation: { ...currentSettings.rsiCorrelation, ...settings.rsiCorrelation },
      rsiTracker: { ...currentSettings.rsiTracker, ...settings.rsiTracker },
      currencyStrength: { ...currentSettings.currencyStrength, ...settings.currencyStrength },
      multiIndicatorHeatmap: { ...currentSettings.multiIndicatorHeatmap, ...settings.multiIndicatorHeatmap }
    };

    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        [{ 
          user_id: user.id, 
          dashboard_settings: mergedSettings
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
   * Update specific dashboard settings section
   */
  async updateDashboardSettingsSection(section, settings) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get current settings
    const currentSettings = await this.getUserDashboardSettings();
    
    // Update specific section
    const updatedSettings = {
      ...currentSettings,
      [section]: { ...currentSettings[section], ...settings }
    };

    return await this.updateUserDashboardSettings(updatedSettings);
  }

  /**
   * Get specific dashboard settings section
   */
  async getDashboardSettingsSection(section) {
    const settings = await this.getUserDashboardSettings();
    return settings[section] || this.getDefaultDashboardSettings()[section];
  }

  /**
   * Reset dashboard settings to defaults
   */
  async resetDashboardSettings() {
    const defaultSettings = this.getDefaultDashboardSettings();
    return await this.updateUserDashboardSettings(defaultSettings);
  }

  /**
   * Reset specific dashboard settings section
   */
  async resetDashboardSettingsSection(section) {
    const defaultSettings = this.getDefaultDashboardSettings();
    const sectionDefaults = defaultSettings[section];
    
    return await this.updateDashboardSettingsSection(section, sectionDefaults);
  }

  // ========== CONVENIENCE METHODS FOR SPECIFIC SETTINGS ==========

  /**
   * Update Global Settings
   */
  async updateGlobalSettings(settings) {
    return await this.updateDashboardSettingsSection('global', settings);
  }

  /**
   * Get Global Settings
   */
  async getGlobalSettings() {
    return await this.getDashboardSettingsSection('global');
  }

  /**
   * Update RSI Correlation Settings
   */
  async updateRSICorrelationSettings(settings) {
    return await this.updateDashboardSettingsSection('rsiCorrelation', settings);
  }

  /**
   * Get RSI Correlation Settings
   */
  async getRSICorrelationSettings() {
    return await this.getDashboardSettingsSection('rsiCorrelation');
  }

  /**
   * Update RSI Tracker Settings
   */
  async updateRSITrackerSettings(settings) {
    return await this.updateDashboardSettingsSection('rsiTracker', settings);
  }

  /**
   * Get RSI Tracker Settings
   */
  async getRSITrackerSettings() {
    return await this.getDashboardSettingsSection('rsiTracker');
  }

  /**
   * Update Currency Strength Settings
   */
  async updateCurrencyStrengthSettings(settings) {
    return await this.updateDashboardSettingsSection('currencyStrength', settings);
  }

  /**
   * Get Currency Strength Settings
   */
  async getCurrencyStrengthSettings() {
    return await this.getDashboardSettingsSection('currencyStrength');
  }

  /**
   * Update RSI Threshold (legacy support)
   */
  async updateRSIThreshold(overbought, oversold) {
    const rsiSettings = {
      rsiOverbought: overbought,
      rsiOversold: oversold
    };

    // Update both RSI Correlation and RSI Tracker settings
    await this.updateRSICorrelationSettings(rsiSettings);
    await this.updateRSITrackerSettings(rsiSettings);
    
    return await this.updateTabState('rsiThreshold', { overbought, oversold });
  }
}

const userStateService = new UserStateService();
export default userStateService;