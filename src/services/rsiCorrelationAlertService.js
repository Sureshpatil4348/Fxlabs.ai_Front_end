import { supabase } from '../lib/supabaseClient';

class RSICorrelationAlertService {
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
   * Validate RSI correlation alert configuration
   * @param {Object} config - Alert configuration
   * @returns {Object} - Validation result
   */
  _validateRSICorrelationAlertConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate correlation pairs (1-5 pairs)
    if (!config.correlationPairs || !Array.isArray(config.correlationPairs) || config.correlationPairs.length === 0) {
      errors.push("At least one correlation pair is required");
    } else if (config.correlationPairs.length > 5) {
      errors.push("Maximum 5 correlation pairs allowed for RSI correlation alerts");
    } else {
      // Validate pair format (should be arrays of 2 symbols)
      config.correlationPairs.forEach((pair, index) => {
        if (!Array.isArray(pair) || pair.length !== 2) {
          errors.push(`Invalid correlation pair format at index ${index}: must be array of 2 symbols`);
        } else {
          pair.forEach((symbol, symbolIndex) => {
            if (typeof symbol !== 'string' || symbol.length < 6) {
              errors.push(`Invalid symbol at pair ${index}, symbol ${symbolIndex}: ${symbol}`);
            }
          });
        }
      });
    }

    // Validate timeframes (1-3 timeframes)
    const validTimeframes = ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];
    if (!config.timeframes || !Array.isArray(config.timeframes) || config.timeframes.length === 0) {
      errors.push("At least one timeframe is required");
    } else if (config.timeframes.length > 3) {
      errors.push("Maximum 3 timeframes allowed for RSI correlation alerts");
    } else {
      config.timeframes.forEach((timeframe, index) => {
        if (!validTimeframes.includes(timeframe)) {
          errors.push(`Invalid timeframe at index ${index}: ${timeframe}`);
        }
      });
    }

    // Validate calculation mode
    const validModes = ['rsi_threshold', 'real_correlation'];
    if (!config.calculationMode || !validModes.includes(config.calculationMode)) {
      errors.push("Valid calculation mode is required (rsi_threshold or real_correlation)");
    }

    // Validate RSI settings (for RSI Threshold mode)
    if (config.calculationMode === 'rsi_threshold') {
      if (config.rsiPeriod !== undefined) {
        if (!Number.isFinite(config.rsiPeriod)) {
          errors.push("RSI period must be a valid number");
        } else if (config.rsiPeriod < 5 || config.rsiPeriod > 50) {
          errors.push("RSI period must be between 5 and 50");
        }
      }
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
      if (config.rsiOverboughtThreshold !== undefined && config.rsiOversoldThreshold !== undefined) {
        if (Number.isFinite(config.rsiOverboughtThreshold) && Number.isFinite(config.rsiOversoldThreshold)) {
          if (config.rsiOverboughtThreshold <= config.rsiOversoldThreshold) {
            errors.push("RSI overbought threshold must be greater than oversold threshold");
          }
        }
      }
    }

    // Validate correlation settings (for Real Correlation mode)
    if (config.calculationMode === 'real_correlation') {
      const validWindows = [20, 50, 90, 120];
      if (config.correlationWindow !== undefined && !validWindows.includes(config.correlationWindow)) {
        errors.push("Correlation window must be one of: 20, 50, 90, 120");
      }
    }

    // Validate alert conditions based on calculation mode
    if (!config.alertConditions || !Array.isArray(config.alertConditions) || config.alertConditions.length === 0) {
      errors.push("At least one alert condition is required");
    } else if (config.alertConditions.length > 6) {
      errors.push("Maximum 6 alert conditions allowed");
    } else {
      if (config.calculationMode === 'rsi_threshold') {
        const validRSIConditions = ['positive_mismatch', 'negative_mismatch', 'neutral_break'];
        config.alertConditions.forEach((condition, index) => {
          if (!validRSIConditions.includes(condition)) {
            errors.push(`Invalid RSI threshold condition at index ${index}: ${condition}`);
          }
        });
      } else if (config.calculationMode === 'real_correlation') {
        const validCorrelationConditions = ['strong_positive', 'strong_negative', 'weak_correlation', 'correlation_break'];
        config.alertConditions.forEach((condition, index) => {
          if (!validCorrelationConditions.includes(condition)) {
            errors.push(`Invalid real correlation condition at index ${index}: ${condition}`);
          }
        });
      }
    }

    // Validate correlation thresholds (for Real Correlation mode)
    if (config.calculationMode === 'real_correlation') {
      if (config.strongCorrelationThreshold !== undefined) {
        if (!Number.isFinite(config.strongCorrelationThreshold)) {
          errors.push("Strong correlation threshold must be a valid number");
        } else if (config.strongCorrelationThreshold < 0.50 || config.strongCorrelationThreshold > 1.00) {
          errors.push("Strong correlation threshold must be between 0.50 and 1.00");
        }
      }
      if (config.moderateCorrelationThreshold !== undefined) {
        if (!Number.isFinite(config.moderateCorrelationThreshold)) {
          errors.push("Moderate correlation threshold must be a valid number");
        } else if (config.moderateCorrelationThreshold < 0.20 || config.moderateCorrelationThreshold > 0.80) {
          errors.push("Moderate correlation threshold must be between 0.20 and 0.80");
        }
      }
      if (config.weakCorrelationThreshold !== undefined) {
        if (!Number.isFinite(config.weakCorrelationThreshold)) {
          errors.push("Weak correlation threshold must be a valid number");
        } else if (config.weakCorrelationThreshold < 0.05 || config.weakCorrelationThreshold > 0.50) {
          errors.push("Weak correlation threshold must be between 0.05 and 0.50");
        }
      }

      // Validate threshold order
      if (config.strongCorrelationThreshold !== undefined && config.moderateCorrelationThreshold !== undefined) {
        if (Number.isFinite(config.strongCorrelationThreshold) && Number.isFinite(config.moderateCorrelationThreshold)) {
          if (config.strongCorrelationThreshold < config.moderateCorrelationThreshold) {
            errors.push("Strong correlation threshold must be greater than or equal to moderate threshold");
          }
        }
      }
      if (config.moderateCorrelationThreshold !== undefined && config.weakCorrelationThreshold !== undefined) {
        if (Number.isFinite(config.moderateCorrelationThreshold) && Number.isFinite(config.weakCorrelationThreshold)) {
          if (config.moderateCorrelationThreshold < config.weakCorrelationThreshold) {
            errors.push("Moderate correlation threshold must be greater than or equal to weak threshold");
          }
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
      correlationPairs: dbAlert.correlation_pairs,
      timeframes: dbAlert.timeframes,
      calculationMode: dbAlert.calculation_mode,
      alertConditions: dbAlert.alert_conditions,
      rsiPeriod: dbAlert.rsi_period,
      rsiOverboughtThreshold: dbAlert.rsi_overbought_threshold,
      rsiOversoldThreshold: dbAlert.rsi_oversold_threshold,
      correlationWindow: dbAlert.correlation_window,
      strongCorrelationThreshold: dbAlert.strong_correlation_threshold,
      moderateCorrelationThreshold: dbAlert.moderate_correlation_threshold,
      weakCorrelationThreshold: dbAlert.weak_correlation_threshold,
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
      correlationPairs: 'correlation_pairs',
      timeframes: 'timeframes',
      calculationMode: 'calculation_mode',
      alertConditions: 'alert_conditions',
      rsiPeriod: 'rsi_period',
      rsiOverboughtThreshold: 'rsi_overbought_threshold',
      rsiOversoldThreshold: 'rsi_oversold_threshold',
      correlationWindow: 'correlation_window',
      strongCorrelationThreshold: 'strong_correlation_threshold',
      moderateCorrelationThreshold: 'moderate_correlation_threshold',
      weakCorrelationThreshold: 'weak_correlation_threshold',
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
   * Create a new RSI correlation alert
   * @param {Object} alertConfig - Alert configuration
   * @returns {Object} - Created alert or error
   */
  async createAlert(alertConfig) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Validate configuration
    const validation = this._validateRSICorrelationAlertConfig(alertConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid alert configuration: ${validation.errors.join(', ')}`);
    }

    // Map UI symbols to broker-specific symbols
    const mapSymbolsToBroker = (symbols) => {
      const symbolMapping = {
        "EURUSD": "EURUSDm",
        "GBPUSD": "GBPUSDm", 
        "USDJPY": "USDJPYm",
        "USDCHF": "USDCHFm",
        "AUDUSD": "AUDUSDm",
        "USDCAD": "USDCADm",
        "NZDUSD": "NZDUSDm",
        "XAUUSD": "XAUUSDm",
        "BTCUSD": "BTCUSDm",
        "ETHUSD": "ETHUSDm"
      };
      return symbols.map(symbol => symbolMapping[symbol] || symbol);
    };

    // Map correlation pairs (each pair is [symbol1, symbol2])
    const mapCorrelationPairs = (pairs) => {
      return pairs.map(pair => mapSymbolsToBroker(pair));
    };

    // Prepare data for insertion
    const alertData = {
      user_id: user.id,
      user_email: user.email, // Add user email for backend notifications
      alert_name: alertConfig.alertName || `RSI Correlation Alert ${new Date().toLocaleString()}`,
      is_active: alertConfig.isActive !== undefined ? alertConfig.isActive : true,
      correlation_pairs: mapCorrelationPairs(alertConfig.correlationPairs),
      timeframes: alertConfig.timeframes || ['1H'],
      calculation_mode: alertConfig.calculationMode || 'rsi_threshold',
      rsi_period: alertConfig.rsiPeriod || 14,
      rsi_overbought_threshold: alertConfig.rsiOverboughtThreshold || 70,
      rsi_oversold_threshold: alertConfig.rsiOversoldThreshold || 30,
      correlation_window: alertConfig.correlationWindow || 50,
      alert_conditions: alertConfig.alertConditions,
      strong_correlation_threshold: alertConfig.strongCorrelationThreshold || 0.70,
      moderate_correlation_threshold: alertConfig.moderateCorrelationThreshold || 0.30,
      weak_correlation_threshold: alertConfig.weakCorrelationThreshold || 0.15,
      notification_methods: alertConfig.notificationMethods || ['browser'],
      alert_frequency: alertConfig.alertFrequency || 'once'
    };

    const { data, error } = await supabase
      .from('rsi_correlation_alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return this._convertDbAlertToCamelCase(data);
  }

  /**
   * Get all RSI correlation alerts for current user
   * @returns {Array} - Array of alerts
   */
  async getAlerts() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('rsi_correlation_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return (data || []).map(alert => this._convertDbAlertToCamelCase(alert));
  }

  /**
   * Get active RSI correlation alerts for current user
   * @returns {Array} - Array of active alerts
   */
  async getActiveAlerts() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('rsi_correlation_alerts')
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
      .from('rsi_correlation_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return this._convertDbAlertToCamelCase(data);
  }

  /**
   * Update an existing RSI correlation alert
   * @param {string} alertId - Alert ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} - Updated alert
   */
  async updateAlert(alertId, updates) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Validate updates if they include configuration changes
    const configFields = [
      'correlationPairs', 'timeframes', 'calculationMode', 'alertConditions', 
      'rsiPeriod', 'rsiOverboughtThreshold', 'rsiOversoldThreshold', 
      'correlationWindow', 'strongCorrelationThreshold', 'moderateCorrelationThreshold', 
      'weakCorrelationThreshold', 'notificationMethods', 'alertFrequency', 'isActive'
    ];
    
    const hasConfigChanges = configFields.some(field => updates.hasOwnProperty(field));
    
    if (hasConfigChanges) {
      const currentAlertDb = await this.getAlertById(alertId);
      const currentAlertCamelCase = this._convertDbAlertToCamelCase(currentAlertDb);
      const updatedConfig = { ...currentAlertCamelCase, ...updates };
      const validation = this._validateRSICorrelationAlertConfig(updatedConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid alert configuration: ${validation.errors.join(', ')}`);
      }
    }

    // Convert camelCase updates to snake_case for database
    const dbUpdates = this._convertCamelCaseToDbFormat(updates);
    
    const { data, error } = await supabase
      .from('rsi_correlation_alerts')
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
   * Delete an RSI correlation alert
   * @param {string} alertId - Alert ID
   * @returns {boolean} - Success status
   */
  async deleteAlert(alertId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('rsi_correlation_alerts')
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
    return await this.updateAlert(alertId, { isActive: isActive });
  }

  /**
   * Get alert triggers for a specific RSI correlation alert
   * @param {string} alertId - Alert ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of triggers
   */
  async getAlertTriggers(alertId, options = {}) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from('rsi_correlation_alert_triggers')
      .select(`
        *,
        rsi_correlation_alerts!inner(user_id)
      `)
      .eq('alert_id', alertId)
      .eq('rsi_correlation_alerts.user_id', user.id)
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
    if (options.calculationMode) {
      query = query.eq('calculation_mode', options.calculationMode);
    }
    if (options.pairSymbol1) {
      query = query.eq('pair_symbol1', options.pairSymbol1);
    }
    if (options.pairSymbol2) {
      query = query.eq('pair_symbol2', options.pairSymbol2);
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
   * Acknowledge an RSI correlation alert trigger
   * @param {string} triggerId - Trigger ID
   * @returns {Object} - Updated trigger
   */
  async acknowledgeTrigger(triggerId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('rsi_correlation_alert_triggers')
      .update({ 
        is_acknowledged: true, 
        acknowledged_at: new Date().toISOString() 
      })
      .eq('id', triggerId)
      .select(`
        *,
        rsi_correlation_alerts!inner(user_id)
      `)
      .eq('rsi_correlation_alerts.user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get recent triggers for all user RSI correlation alerts
   * @param {Object} options - Query options
   * @returns {Array} - Array of recent triggers
   */
  async getRecentTriggers(options = {}) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from('rsi_correlation_alert_triggers')
      .select(`
        *,
        rsi_correlation_alerts!inner(user_id, alert_name)
      `)
      .eq('rsi_correlation_alerts.user_id', user.id)
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
   * Get RSI correlation alert statistics for current user
   * @returns {Object} - Alert statistics
   */
  async getAlertStats() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get total alerts
    const { count: totalAlerts, error: totalError } = await supabase
      .from('rsi_correlation_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (totalError) throw totalError;

    // Get active alerts
    const { count: activeAlerts, error: activeError } = await supabase
      .from('rsi_correlation_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeError) throw activeError;

    // Get total triggers
    const { count: totalTriggers, error: triggersError } = await supabase
      .from('rsi_correlation_alert_triggers')
      .select(`
        *,
        rsi_correlation_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('rsi_correlation_alerts.user_id', user.id);

    if (triggersError) throw triggersError;

    // Get unacknowledged triggers
    const { count: unacknowledgedTriggers, error: unackError } = await supabase
      .from('rsi_correlation_alert_triggers')
      .select(`
        *,
        rsi_correlation_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('rsi_correlation_alerts.user_id', user.id)
      .eq('is_acknowledged', false);

    if (unackError) throw unackError;

    // Get triggers in last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentTriggers, error: recentError } = await supabase
      .from('rsi_correlation_alert_triggers')
      .select(`
        *,
        rsi_correlation_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('rsi_correlation_alerts.user_id', user.id)
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
   * Check if RSI correlation alert should trigger based on current market data
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
    // 1. Calculate the actual RSI values or correlation values for the alert's pairs/timeframes
    // 2. Check against the alert conditions based on calculation mode
    // 3. Compare against the alert thresholds
    // 4. Check if enough time has passed since last trigger (based on alert_frequency)
    
    // For now, return a placeholder structure
    return {
      shouldTrigger: false,
      reason: 'Market data analysis not implemented',
      alert,
      marketData
    };
  }

  /**
   * Get default RSI correlation alert configuration
   * @returns {Object} - Default configuration
   */
  getDefaultAlertConfig() {
    return {
      alertName: '',
      isActive: true,
      correlationPairs: [['EURUSD', 'GBPUSD']],
      timeframes: ['1H'],
      calculationMode: 'rsi_threshold',
      rsiPeriod: 14,
      rsiOverboughtThreshold: 70,
      rsiOversoldThreshold: 30,
      correlationWindow: 50,
      alertConditions: ['positive_mismatch', 'negative_mismatch'],
      strongCorrelationThreshold: 0.70,
      moderateCorrelationThreshold: 0.30,
      weakCorrelationThreshold: 0.15,
      notificationMethods: ['browser'],
      alertFrequency: 'once'
    };
  }

  /**
   * Get available options for RSI correlation alert configuration
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
      calculationModes: [
        { value: 'rsi_threshold', label: 'RSI Threshold', description: 'Alert based on RSI overbought/oversold mismatches' },
        { value: 'real_correlation', label: 'Real Correlation', description: 'Alert based on actual correlation coefficients' }
      ],
      rsiThresholdConditions: [
        { value: 'positive_mismatch', label: 'Positive Mismatch', description: 'Positive pairs with RSI mismatch (one >70, other <30)' },
        { value: 'negative_mismatch', label: 'Negative Mismatch', description: 'Negative pairs with RSI mismatch (both >70 or both <30)' },
        { value: 'neutral_break', label: 'Neutral Break', description: 'Pairs breaking neutral correlation status' }
      ],
      realCorrelationConditions: [
        { value: 'strong_positive', label: 'Strong Positive', description: 'Strong positive correlation detected' },
        { value: 'strong_negative', label: 'Strong Negative', description: 'Strong negative correlation detected' },
        { value: 'weak_correlation', label: 'Weak Correlation', description: 'Weak correlation detected' },
        { value: 'correlation_break', label: 'Correlation Break', description: 'Correlation breaking established patterns' }
      ],
      correlationWindows: [
        { value: 20, label: '20 Periods' },
        { value: 50, label: '50 Periods' },
        { value: 90, label: '90 Periods' },
        { value: 120, label: '120 Periods' }
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
      ],
      correlationPairs: [
        // Positive correlations
        { pair: ['EURUSD', 'GBPUSD'], type: 'positive', description: 'EUR/USD - GBP/USD' },
        { pair: ['EURUSD', 'AUDUSD'], type: 'positive', description: 'EUR/USD - AUD/USD' },
        { pair: ['EURUSD', 'NZDUSD'], type: 'positive', description: 'EUR/USD - NZD/USD' },
        { pair: ['GBPUSD', 'AUDUSD'], type: 'positive', description: 'GBP/USD - AUD/USD' },
        { pair: ['AUDUSD', 'NZDUSD'], type: 'positive', description: 'AUD/USD - NZD/USD' },
        { pair: ['USDCHF', 'USDJPY'], type: 'positive', description: 'USD/CHF - USD/JPY' },
        { pair: ['XAUUSD', 'XAGUSD'], type: 'positive', description: 'Gold - Silver' },
        { pair: ['XAUUSD', 'EURUSD'], type: 'positive', description: 'Gold - EUR/USD' },
        { pair: ['BTCUSD', 'ETHUSD'], type: 'positive', description: 'Bitcoin - Ethereum' },
        { pair: ['BTCUSD', 'XAUUSD'], type: 'positive', description: 'Bitcoin - Gold' },
        // Negative correlations
        { pair: ['EURUSD', 'USDCHF'], type: 'negative', description: 'EUR/USD - USD/CHF' },
        { pair: ['GBPUSD', 'USDCHF'], type: 'negative', description: 'GBP/USD - USD/CHF' },
        { pair: ['USDJPY', 'EURUSD'], type: 'negative', description: 'USD/JPY - EUR/USD' },
        { pair: ['USDJPY', 'GBPUSD'], type: 'negative', description: 'USD/JPY - GBP/USD' },
        { pair: ['USDCAD', 'AUDUSD'], type: 'negative', description: 'USD/CAD - AUD/USD' },
        { pair: ['USDCHF', 'AUDUSD'], type: 'negative', description: 'USD/CHF - AUD/USD' },
        { pair: ['XAUUSD', 'USDJPY'], type: 'negative', description: 'Gold - USD/JPY' }
      ]
    };
  }
}

const rsiCorrelationAlertService = new RSICorrelationAlertService();
export default rsiCorrelationAlertService;
