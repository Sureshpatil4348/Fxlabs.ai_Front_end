import { supabase } from '../lib/supabaseClient';

class RSIAlertService {
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
   * Validate RSI alert configuration
   * @param {Object} config - Alert configuration
   * @returns {Object} - Validation result
   */
  _validateRSIAlertConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate pairs (1-5 pairs)
    if (!config.pairs || !Array.isArray(config.pairs) || config.pairs.length === 0) {
      errors.push("At least one trading pair is required");
    } else if (config.pairs.length > 5) {
      errors.push("Maximum 5 trading pairs allowed for RSI alerts");
    } else {
      // Validate pair format (basic validation)
      config.pairs.forEach((pair, index) => {
        if (typeof pair !== 'string' || pair.length < 6) {
          errors.push(`Invalid pair format at index ${index}: ${pair}`);
        }
      });
    }

    // Validate timeframes (1-3 timeframes)
    const validTimeframes = ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];
    if (!config.timeframes || !Array.isArray(config.timeframes) || config.timeframes.length === 0) {
      errors.push("At least one timeframe is required");
    } else if (config.timeframes.length > 3) {
      errors.push("Maximum 3 timeframes allowed for RSI alerts");
    } else {
      config.timeframes.forEach((timeframe, index) => {
        if (!validTimeframes.includes(timeframe)) {
          errors.push(`Invalid timeframe at index ${index}: ${timeframe}`);
        }
      });
    }

    // Validate RSI period
    if (config.rsiPeriod !== undefined) {
      if (!Number.isFinite(config.rsiPeriod)) {
        errors.push("RSI period must be a valid number");
      } else if (config.rsiPeriod < 5 || config.rsiPeriod > 50) {
        errors.push("RSI period must be between 5 and 50");
      }
    }

    // Validate RSI thresholds
    if (config.rsiOverboughtThreshold !== undefined) {
      if (!Number.isFinite(config.rsiOverboughtThreshold)) {
        errors.push("RSI overbought threshold must be a valid number");
      } else if (config.rsiOverboughtThreshold < 60 || config.rsiOverboughtThreshold > 90) {
        errors.push("RSI overbought threshold must be between 60 and 90");
      }
    }
    if (config.rsiOversoldThreshold !== undefined) {
      if (!Number.isFinite(config.rsiOversoldThreshold)) {
        errors.push("RSI oversold threshold must be a valid number");
      } else if (config.rsiOversoldThreshold < 10 || config.rsiOversoldThreshold > 40) {
        errors.push("RSI oversold threshold must be between 10 and 40");
      }
    }

    // Validate threshold order
    if (config.rsiOverboughtThreshold !== undefined && config.rsiOversoldThreshold !== undefined) {
      if (Number.isFinite(config.rsiOverboughtThreshold) && Number.isFinite(config.rsiOversoldThreshold)) {
        if (config.rsiOverboughtThreshold <= config.rsiOversoldThreshold) {
          errors.push("RSI overbought threshold must be greater than oversold threshold");
        }
      }
    }

    // Validate alert conditions (1-6 conditions)
    const validConditions = ['overbought', 'oversold', 'rfi_strong', 'rfi_moderate', 'crossup', 'crossdown'];
    if (!config.alertConditions || !Array.isArray(config.alertConditions) || config.alertConditions.length === 0) {
      errors.push("At least one alert condition is required");
    } else if (config.alertConditions.length > 6) {
      errors.push("Maximum 6 alert conditions allowed");
    } else {
      config.alertConditions.forEach((condition, index) => {
        if (!validConditions.includes(condition)) {
          errors.push(`Invalid alert condition at index ${index}: ${condition}`);
        }
      });
    }

    // Validate RFI thresholds
    if (config.rfiStrongThreshold !== undefined) {
      if (!Number.isFinite(config.rfiStrongThreshold)) {
        errors.push("RFI strong threshold must be a valid number");
      } else if (config.rfiStrongThreshold < 0.50 || config.rfiStrongThreshold > 1.00) {
        errors.push("RFI strong threshold must be between 0.50 and 1.00");
      }
    }
    if (config.rfiModerateThreshold !== undefined) {
      if (!Number.isFinite(config.rfiModerateThreshold)) {
        errors.push("RFI moderate threshold must be a valid number");
      } else if (config.rfiModerateThreshold < 0.30 || config.rfiModerateThreshold > 0.80) {
        errors.push("RFI moderate threshold must be between 0.30 and 0.80");
      }
    }

    // Validate RFI threshold order
    if (config.rfiStrongThreshold !== undefined && config.rfiModerateThreshold !== undefined) {
      if (Number.isFinite(config.rfiStrongThreshold) && Number.isFinite(config.rfiModerateThreshold)) {
        if (config.rfiStrongThreshold < config.rfiModerateThreshold) {
          errors.push("RFI strong threshold must be greater than or equal to moderate threshold");
        }
      }
    }

    // Validate alert frequency
    const validFrequencies = ['once', 'every_5min', 'every_15min', 'every_30min', 'every_hour'];
    if (config.alertFrequency && !validFrequencies.includes(config.alertFrequency)) {
      errors.push("Invalid alert frequency");
    }

    // Validate notification methods
    if (config.notificationMethods && Array.isArray(config.notificationMethods)) {
      const validMethods = ['browser', 'email', 'push'];
      config.notificationMethods.forEach((method, index) => {
        if (!validMethods.includes(method)) {
          errors.push(`Invalid notification method at index ${index}: ${method}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert snake_case database fields to camelCase for service layer
   * @param {Object} dbAlert - Alert data from database in snake_case
   * @returns {Object} - Alert data in camelCase format
   */
  _convertDbAlertToCamelCase(dbAlert) {
    if (!dbAlert) return null;
    
    return {
      id: dbAlert.id,
      userId: dbAlert.user_id,
      userEmail: dbAlert.user_email,
      alertName: dbAlert.alert_name,
      isActive: dbAlert.is_active,
      pairs: dbAlert.pairs,
      timeframes: dbAlert.timeframes,
      alertConditions: dbAlert.alert_conditions,
      rsiPeriod: dbAlert.rsi_period,
      rsiOverboughtThreshold: dbAlert.rsi_overbought_threshold,
      rsiOversoldThreshold: dbAlert.rsi_oversold_threshold,
      rfiStrongThreshold: dbAlert.rfi_strong_threshold,
      rfiModerateThreshold: dbAlert.rfi_moderate_threshold,
      notificationMethods: dbAlert.notification_methods,
      alertFrequency: dbAlert.alert_frequency,
      createdAt: dbAlert.created_at,
      updatedAt: dbAlert.updated_at
    };
  }

  /**
   * Convert camelCase service layer fields to snake_case for database
   * @param {Object} camelCaseUpdates - Updates in camelCase format
   * @returns {Object} - Updates in snake_case format for database
   */
  _convertCamelCaseToDbFormat(camelCaseUpdates) {
    if (!camelCaseUpdates) return {};
    
    const dbUpdates = {};
    
    // Whitelist of allowed fields that can be updated
    const allowedFields = {
      alertName: 'alert_name',
      isActive: 'is_active',
      pairs: 'pairs',
      timeframes: 'timeframes',
      alertConditions: 'alert_conditions',
      rsiPeriod: 'rsi_period',
      rsiOverboughtThreshold: 'rsi_overbought_threshold',
      rsiOversoldThreshold: 'rsi_oversold_threshold',
      rfiStrongThreshold: 'rfi_strong_threshold',
      rfiModerateThreshold: 'rfi_moderate_threshold',
      notificationMethods: 'notification_methods',
      alertFrequency: 'alert_frequency'
    };
    
    // Convert only whitelisted fields
    Object.keys(camelCaseUpdates).forEach(camelKey => {
      if (allowedFields.hasOwnProperty(camelKey)) {
        const dbKey = allowedFields[camelKey];
        dbUpdates[dbKey] = camelCaseUpdates[camelKey];
      }
    });
    
    return dbUpdates;
  }

  /**
   * Create a new RSI alert
   * @param {Object} alertConfig - Alert configuration
   * @returns {Object} - Created alert or error
   */
  async createAlert(alertConfig) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Validate configuration
    const validation = this._validateRSIAlertConfig(alertConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid alert configuration: ${validation.errors.join(', ')}`);
    }

    // Prepare data for insertion
    const alertData = {
      user_id: user.id,
      user_email: user.email, // Add user email for backend notifications
      alert_name: alertConfig.alertName || `RSI Alert ${new Date().toLocaleString()}`,
      is_active: alertConfig.isActive !== undefined ? alertConfig.isActive : true,
      pairs: alertConfig.pairs,
      timeframes: alertConfig.timeframes || ['1H'],
      rsi_period: alertConfig.rsiPeriod || 14,
      rsi_overbought_threshold: alertConfig.rsiOverboughtThreshold || 70,
      rsi_oversold_threshold: alertConfig.rsiOversoldThreshold || 30,
      alert_conditions: alertConfig.alertConditions,
      rfi_strong_threshold: alertConfig.rfiStrongThreshold || 0.80,
      rfi_moderate_threshold: alertConfig.rfiModerateThreshold || 0.60,
      notification_methods: alertConfig.notificationMethods || ['browser'],
      alert_frequency: alertConfig.alertFrequency || 'once'
    };

    const { data, error } = await supabase
      .from('rsi_alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return this._convertDbAlertToCamelCase(data);
  }

  /**
   * Get all RSI alerts for current user
   * @returns {Array} - Array of alerts
   */
  async getAlerts() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('rsi_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return (data || []).map(alert => this._convertDbAlertToCamelCase(alert));
  }

  /**
   * Get active RSI alerts for current user
   * @returns {Array} - Array of active alerts
   */
  async getActiveAlerts() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('rsi_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return (data || []).map(alert => this._convertDbAlertToCamelCase(alert));
  }

  /**
   * Get alert by ID
   * @param {string} alertId - Alert ID
   * @returns {Object} - Alert data
   */
  async getAlertById(alertId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('rsi_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return this._convertDbAlertToCamelCase(data);
  }

  /**
   * Update an existing RSI alert
   * @param {string} alertId - Alert ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} - Updated alert
   */
  async updateAlert(alertId, updates) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Validate updates if they include configuration changes
    const configFields = [
      'pairs', 'timeframes', 'alertConditions', 'rsiPeriod', 
      'rsiOverboughtThreshold', 'rsiOversoldThreshold', 'rfiStrongThreshold', 
      'rfiModerateThreshold', 'notificationMethods', 'alertFrequency', 'isActive'
    ];
    
    const hasConfigChanges = configFields.some(field => updates.hasOwnProperty(field));
    
    if (hasConfigChanges) {
      const currentAlertDb = await this.getAlertById(alertId);
      const currentAlertCamelCase = this._convertDbAlertToCamelCase(currentAlertDb);
      const updatedConfig = { ...currentAlertCamelCase, ...updates };
      const validation = this._validateRSIAlertConfig(updatedConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid alert configuration: ${validation.errors.join(', ')}`);
      }
    }

    // Convert camelCase updates to snake_case for database
    const dbUpdates = this._convertCamelCaseToDbFormat(updates);
    
    const { data, error } = await supabase
      .from('rsi_alerts')
      .update(dbUpdates)
      .eq('id', alertId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return this._convertDbAlertToCamelCase(data);
  }

  /**
   * Delete an RSI alert
   * @param {string} alertId - Alert ID
   * @returns {boolean} - Success status
   */
  async deleteAlert(alertId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('rsi_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  }

  /**
   * Toggle alert active status
   * @param {string} alertId - Alert ID
   * @param {boolean} isActive - New active status
   * @returns {Object} - Updated alert
   */
  async toggleAlert(alertId, isActive) {
    return await this.updateAlert(alertId, { is_active: isActive });
  }

  /**
   * Get alert triggers for a specific RSI alert
   * @param {string} alertId - Alert ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of triggers
   */
  async getAlertTriggers(alertId, options = {}) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from('rsi_alert_triggers')
      .select(`
        *,
        rsi_alerts!inner(user_id)
      `)
      .eq('alert_id', alertId)
      .eq('rsi_alerts.user_id', user.id)
      .order('triggered_at', { ascending: false });

    // Apply filters
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    if (options.triggerCondition) {
      query = query.eq('trigger_condition', options.triggerCondition);
    }
    if (options.symbol) {
      query = query.eq('symbol', options.symbol);
    }
    if (options.timeframe) {
      query = query.eq('timeframe', options.timeframe);
    }
    if (options.acknowledged !== undefined) {
      query = query.eq('is_acknowledged', options.acknowledged);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Acknowledge an RSI alert trigger
   * @param {string} triggerId - Trigger ID
   * @returns {Object} - Updated trigger
   */
  async acknowledgeTrigger(triggerId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('rsi_alert_triggers')
      .update({ 
        is_acknowledged: true, 
        acknowledged_at: new Date().toISOString() 
      })
      .eq('id', triggerId)
      .select(`
        *,
        rsi_alerts!inner(user_id)
      `)
      .eq('rsi_alerts.user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get recent triggers for all user RSI alerts
   * @param {Object} options - Query options
   * @returns {Array} - Array of recent triggers
   */
  async getRecentTriggers(options = {}) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from('rsi_alert_triggers')
      .select(`
        *,
        rsi_alerts!inner(user_id, alert_name)
      `)
      .eq('rsi_alerts.user_id', user.id)
      .order('triggered_at', { ascending: false });

    // Apply filters
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.hours) {
      const cutoffTime = new Date(Date.now() - options.hours * 60 * 60 * 1000).toISOString();
      query = query.gte('triggered_at', cutoffTime);
    }
    if (options.acknowledged !== undefined) {
      query = query.eq('is_acknowledged', options.acknowledged);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get RSI alert statistics for current user
   * @returns {Object} - Alert statistics
   */
  async getAlertStats() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get total alerts
    const { count: totalAlerts, error: totalError } = await supabase
      .from('rsi_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (totalError) throw totalError;

    // Get active alerts
    const { count: activeAlerts, error: activeError } = await supabase
      .from('rsi_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeError) throw activeError;

    // Get total triggers
    const { count: totalTriggers, error: triggersError } = await supabase
      .from('rsi_alert_triggers')
      .select(`
        *,
        rsi_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('rsi_alerts.user_id', user.id);

    if (triggersError) throw triggersError;

    // Get unacknowledged triggers
    const { count: unacknowledgedTriggers, error: unackError } = await supabase
      .from('rsi_alert_triggers')
      .select(`
        *,
        rsi_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('rsi_alerts.user_id', user.id)
      .eq('is_acknowledged', false);

    if (unackError) throw unackError;

    // Get triggers in last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentTriggers, error: recentError } = await supabase
      .from('rsi_alert_triggers')
      .select(`
        *,
        rsi_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('rsi_alerts.user_id', user.id)
      .gte('triggered_at', last24Hours);

    if (recentError) throw recentError;

    return {
      totalAlerts: totalAlerts || 0,
      activeAlerts: activeAlerts || 0,
      totalTriggers: totalTriggers || 0,
      unacknowledgedTriggers: unacknowledgedTriggers || 0,
      recentTriggers: recentTriggers || 0
    };
  }

  /**
   * Check if RSI alert should trigger based on current market data
   * This method would typically be called by the backend system
   * @param {string} alertId - Alert ID
   * @param {Object} marketData - Current market data
   * @returns {Object} - Trigger result
   */
  async checkAlertTrigger(alertId, marketData) {
    const alert = await this.getAlertById(alertId);
    if (!alert || !alert.is_active) {
      return { shouldTrigger: false, reason: 'Alert not found or inactive' };
    }

    // This is a simplified check - in reality, you'd need to:
    // 1. Calculate the actual RSI values for the alert's pairs/timeframe
    // 2. Check RFI scores if applicable
    // 3. Detect RSI crossup/crossdown events
    // 4. Compare against the alert conditions
    // 5. Check if enough time has passed since last trigger (based on alert_frequency)
    
    // For now, return a placeholder structure
    return {
      shouldTrigger: false,
      reason: 'Market data analysis not implemented',
      alert,
      marketData
    };
  }

  /**
   * Get default RSI alert configuration
   * @returns {Object} - Default configuration
   */
  getDefaultAlertConfig() {
    return {
      alertName: '',
      isActive: true,
      pairs: ['EURUSD'],
      timeframes: ['1H'],
      rsiPeriod: 14,
      rsiOverboughtThreshold: 70,
      rsiOversoldThreshold: 30,
      alertConditions: ['overbought', 'oversold'],
      rfiStrongThreshold: 0.80,
      rfiModerateThreshold: 0.60,
      notificationMethods: ['browser'],
      alertFrequency: 'once'
    };
  }

  /**
   * Get available options for RSI alert configuration
   * @returns {Object} - Available options
   */
  getAlertOptions() {
    return {
      timeframes: [
        { value: '1M', label: '1 Minute' },
        { value: '5M', label: '5 Minutes' },
        { value: '15M', label: '15 Minutes' },
        { value: '30M', label: '30 Minutes' },
        { value: '1H', label: '1 Hour' },
        { value: '4H', label: '4 Hours' },
        { value: '1D', label: '1 Day' },
        { value: '1W', label: '1 Week' }
      ],
      alertConditions: [
        { value: 'overbought', label: 'RSI Overbought', description: 'RSI above overbought threshold' },
        { value: 'oversold', label: 'RSI Oversold', description: 'RSI below oversold threshold' },
        { value: 'rfi_strong', label: 'Strong RFI', description: 'RFI score above strong threshold' },
        { value: 'rfi_moderate', label: 'Moderate RFI', description: 'RFI score above moderate threshold' },
        { value: 'crossup', label: 'RSI Cross Up', description: 'RSI crosses above oversold threshold' },
        { value: 'crossdown', label: 'RSI Cross Down', description: 'RSI crosses below overbought threshold' }
      ],
      alertFrequencies: [
        { value: 'once', label: 'Once Only' },
        { value: 'every_5min', label: 'Every 5 Minutes' },
        { value: 'every_15min', label: 'Every 15 Minutes' },
        { value: 'every_30min', label: 'Every 30 Minutes' },
        { value: 'every_hour', label: 'Every Hour' }
      ],
      notificationMethods: [
        { value: 'browser', label: 'Browser Notification' },
        { value: 'email', label: 'Email' },
        { value: 'push', label: 'Push Notification' }
      ]
    };
  }
}

const rsiAlertService = new RSIAlertService();
export default rsiAlertService;
