import { toBrokerSymbol } from '../constants/pairs';
import { supabase } from '../lib/supabaseClient';

class HeatmapAlertService {
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
   * Validate alert configuration
   * @param {Object} config - Alert configuration
   * @returns {Object} - Validation result
   */
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
      selectedIndicators: dbAlert.selected_indicators,
      tradingStyle: dbAlert.trading_style,
      buyThresholdMin: dbAlert.buy_threshold_min,
      sellThresholdMax: dbAlert.sell_threshold_max,
      minAlignment: dbAlert.min_alignment,
      cooldownMinutes: dbAlert.cooldown_minutes,
      gateByBuyNow: dbAlert.gate_by_buy_now,
      gateBuyMin: dbAlert.gate_buy_min,
      gateSellMax: dbAlert.gate_sell_max,
      notificationMethods: dbAlert.notification_methods,
      alertFrequency: dbAlert.alert_frequency,
      createdAt: dbAlert.created_at,
      updatedAt: dbAlert.updated_at,
      previousValues: dbAlert.previous_values,
      styleWeightsOverride: dbAlert.style_weights_override
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
      selectedIndicators: 'selected_indicators',
      tradingStyle: 'trading_style',
      buyThresholdMin: 'buy_threshold_min',
      sellThresholdMax: 'sell_threshold_max',
      minAlignment: 'min_alignment',
      cooldownMinutes: 'cooldown_minutes',
      gateByBuyNow: 'gate_by_buy_now',
      gateBuyMin: 'gate_buy_min',
      gateSellMax: 'gate_sell_max',
      notificationMethods: 'notification_methods',
      alertFrequency: 'alert_frequency',
      styleWeightsOverride: 'style_weights_override'
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
   * Deep merge two objects, with the second object taking precedence
   * @param {Object} target - Target object to merge into
   * @param {Object} source - Source object to merge from
   * @returns {Object} - Merged object
   */
  _deepMergeObjects(target, source) {
    if (!target || typeof target !== 'object') return source || {};
    if (!source || typeof source !== 'object') return target || {};
    
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMergeObjects(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }

  _validateAlertConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate pairs (1-3 pairs)
    if (!config.pairs || !Array.isArray(config.pairs) || config.pairs.length === 0) {
      errors.push("At least one trading pair is required");
    } else if (config.pairs.length > 3) {
      errors.push("Maximum 3 trading pairs allowed");
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
      errors.push("Maximum 3 timeframes allowed");
    } else {
      config.timeframes.forEach((tf, index) => {
        if (!validTimeframes.includes(tf)) {
          errors.push(`Invalid timeframe at index ${index}: ${tf}`);
        }
      });
    }

    // Validate indicators (1-2 indicators)
    const validIndicators = ['EMA21', 'EMA50', 'EMA200', 'MACD', 'RSI', 'UTBOT', 'IchimokuClone'];
    if (!config.selectedIndicators || !Array.isArray(config.selectedIndicators) || config.selectedIndicators.length === 0) {
      errors.push("At least one indicator is required");
    } else if (config.selectedIndicators.length > 2) {
      errors.push("Maximum 2 indicators allowed");
    } else {
      config.selectedIndicators.forEach((indicator, index) => {
        if (!validIndicators.includes(indicator)) {
          errors.push(`Invalid indicator at index ${index}: ${indicator}`);
        }
      });
    }

    // Validate trading style
    const validTradingStyles = ['scalper', 'day', 'swing'];
    if (!config.tradingStyle || !validTradingStyles.includes(config.tradingStyle)) {
      errors.push("Valid trading style is required (scalper, day, swing)");
    }

    // Validate thresholds
    if (config.buyThresholdMin !== undefined) {
      if (config.buyThresholdMin < 70 || config.buyThresholdMin > 100) {
        errors.push("Buy threshold minimum must be between 70-100");
      }
    }
    if (config.sellThresholdMax !== undefined) {
      if (config.sellThresholdMax < 0 || config.sellThresholdMax > 30) {
        errors.push("Sell threshold maximum must be between 0-30");
      }
    }
    // Min alignment (0..5) optional
    if (config.minAlignment !== undefined) {
      if (!Number.isInteger(config.minAlignment) || config.minAlignment < 0 || config.minAlignment > 5) {
        errors.push("Minimum alignment must be an integer between 0 and 5");
      }
    }
    // Cooldown (1..1440)
    if (config.cooldownMinutes !== undefined) {
      if (!Number.isFinite(config.cooldownMinutes) || config.cooldownMinutes < 1 || config.cooldownMinutes > 1440) {
        errors.push("Cooldown minutes must be between 1 and 1440");
      }
    }
    // Gate by Buy Now %
    if (config.gateByBuyNow) {
      if (config.gateBuyMin !== undefined && (config.gateBuyMin < 0 || config.gateBuyMin > 100)) {
        errors.push("Gate Buy min must be between 0 and 100");
      }
      if (config.gateSellMax !== undefined && (config.gateSellMax < 0 || config.gateSellMax > 100)) {
        errors.push("Gate Sell max must be between 0 and 100");
      }
    }

    // Validate alert frequency
    const validFrequencies = ['once', 'every_5min', 'every_15min', 'every_30min', 'every_hour'];
    if (config.alertFrequency && !validFrequencies.includes(config.alertFrequency)) {
      errors.push("Invalid alert frequency");
    }

    // Validate notification methods
    if (config.notificationMethods && Array.isArray(config.notificationMethods)) {
      const validMethods = ['email'];
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
   * Create a new heatmap alert
   * @param {Object} alertConfig - Alert configuration
   * @returns {Object} - Created alert or error
   */
  async createAlert(alertConfig) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Validate configuration
    const validation = this._validateAlertConfig(alertConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid alert configuration: ${validation.errors.join(', ')}`);
    }

    // Enforce global max tracked unique symbols (3) across all alert types
    const existingSymbols = await this._collectUserTrackedSymbols(user.id);
    const proposed = new Set(existingSymbols);
    (alertConfig.pairs || []).forEach(s => proposed.add(s));
    if (proposed.size > 3) {
      const remaining = Math.max(0, 3 - existingSymbols.size);
      throw new Error(`Adding these pairs exceeds the global limit of 3 unique symbols per user. Remaining slots: ${remaining}`);
    }

    // Map UI symbols to broker-specific symbols generically
    const mapSymbolsToBroker = (symbols) => symbols.map(s => toBrokerSymbol(s));

    // Normalize trading style to consolidated spec
    const normalizeTradingStyle = (style) => {
      if (style === 'dayTrader') return 'day';
      if (style === 'swingTrader') return 'swing';
      if (style === 'scalper') return 'scalper';
      return 'day';
    };

    // Prepare data for insertion
    const alertData = {
      user_id: user.id,
      user_email: user.email, // Add user email for backend notifications
      alert_name: alertConfig.alertName || `Heatmap Alert ${new Date().toLocaleString()}`,
      is_active: alertConfig.isActive !== undefined ? alertConfig.isActive : true,
      pairs: mapSymbolsToBroker(alertConfig.pairs),
      timeframes: alertConfig.timeframes,
      selected_indicators: alertConfig.selectedIndicators,
      trading_style: normalizeTradingStyle(alertConfig.tradingStyle || 'day'),
      buy_threshold_min: alertConfig.buyThresholdMin || 70,
      sell_threshold_max: alertConfig.sellThresholdMax || 30,
      min_alignment: alertConfig.minAlignment ?? 0,
      cooldown_minutes: alertConfig.cooldownMinutes ?? 30,
      gate_by_buy_now: alertConfig.gateByBuyNow ?? false,
      gate_buy_min: alertConfig.gateBuyMin ?? 60,
      gate_sell_max: alertConfig.gateSellMax ?? 40,
      notification_methods: alertConfig.notificationMethods || ['email'],
      alert_frequency: alertConfig.alertFrequency || 'once'
    };

    const { data, error } = await supabase
      .from('heatmap_alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return this._convertDbAlertToCamelCase(data);
  }

  /**
   * Get all alerts for current user
   * @returns {Array} - Array of alerts
   */
  async getAlerts() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('heatmap_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return (data || []).map(alert => this._convertDbAlertToCamelCase(alert));
  }

  /**
   * Get active alerts for current user
   * @returns {Array} - Array of active alerts
   */
  async getActiveAlerts() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('heatmap_alerts')
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
      .from('heatmap_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    
    // Convert response back to camelCase for caller
    return this._convertDbAlertToCamelCase(data);
  }

  /**
   * Update an existing alert
   * @param {string} alertId - Alert ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} - Updated alert
   */
  async updateAlert(alertId, updates) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Map UI symbols to broker-specific symbols if pairs are being updated
    if (updates.pairs) {
      updates.pairs = updates.pairs.map(s => toBrokerSymbol(s));
    }

    // Validate updates if they include configuration changes
    // Include all fields that _validateAlertConfig actually validates
    const configFields = [
      'pairs', 'timeframes', 'selectedIndicators', 'tradingStyle',
      'buyThresholdMin', 'buyThresholdMax', 'sellThresholdMin', 'sellThresholdMax',
      'notificationMethods', 'alertFrequency'
    ];
    
    const hasConfigChanges = configFields.some(field => updates.hasOwnProperty(field));
    
    if (hasConfigChanges) {
      const currentAlertDb = await this.getAlertById(alertId);
      const currentAlertCamelCase = this._convertDbAlertToCamelCase(currentAlertDb);
      const updatedConfig = { ...currentAlertCamelCase, ...updates };
      const validation = this._validateAlertConfig(updatedConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid alert configuration: ${validation.errors.join(', ')}`);
      }
    }

    // Convert camelCase updates to snake_case for database
    const dbUpdates = this._convertCamelCaseToDbFormat(updates);
    
    const { data, error } = await supabase
      .from('heatmap_alerts')
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
   * Delete an alert
   * @param {string} alertId - Alert ID
   * @returns {boolean} - Success status
   */
  async deleteAlert(alertId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('heatmap_alerts')
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
   * Get alert triggers for a specific alert
   * @param {string} alertId - Alert ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of triggers
   */
  async getAlertTriggers(alertId, options = {}) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from('heatmap_alert_triggers')
      .select(`
        *,
        heatmap_alerts!inner(user_id)
      `)
      .eq('alert_id', alertId)
      .eq('heatmap_alerts.user_id', user.id)
      .order('triggered_at', { ascending: false });

    // Apply filters
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    if (options.triggerType) {
      query = query.eq('trigger_type', options.triggerType);
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
   * Acknowledge an alert trigger
   * @param {string} triggerId - Trigger ID
   * @returns {Object} - Updated trigger
   */
  async acknowledgeTrigger(triggerId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // First, perform the UPDATE only by trigger ID (no joined-table filters)
    const { error: updateError } = await supabase
      .from('heatmap_alert_triggers')
      .update({ 
        is_acknowledged: true, 
        acknowledged_at: new Date().toISOString() 
      })
      .eq('id', triggerId);

    if (updateError) throw updateError;

    // Then, fetch the updated trigger with joined heatmap_alerts relation
    const { data, error } = await supabase
      .from('heatmap_alert_triggers')
      .select(`
        *,
        heatmap_alerts!inner(user_id)
      `)
      .eq('id', triggerId)
      .eq('heatmap_alerts.user_id', user.id)
      .single();

    if (error) throw error;
    
    // If no data returned, the trigger doesn't exist or user doesn't have access
    if (!data) {
      throw new Error("Trigger not found or access denied");
    }
    
    return data;
  }

  /**
   * Get recent triggers for all user alerts
   * @param {Object} options - Query options
   * @returns {Array} - Array of recent triggers
   */
  async getRecentTriggers(options = {}) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from('heatmap_alert_triggers')
      .select(`
        *,
        heatmap_alerts!inner(user_id, alert_name)
      `)
      .eq('heatmap_alerts.user_id', user.id)
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
   * Get alert statistics for current user
   * @returns {Object} - Alert statistics
   */
  async getAlertStats() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get total alerts
    const { count: totalAlerts, error: totalError } = await supabase
      .from('heatmap_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (totalError) throw totalError;

    // Get active alerts
    const { count: activeAlerts, error: activeError } = await supabase
      .from('heatmap_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeError) throw activeError;

    // Get total triggers
    const { count: totalTriggers, error: triggersError } = await supabase
      .from('heatmap_alert_triggers')
      .select(`
        *,
        heatmap_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('heatmap_alerts.user_id', user.id);

    if (triggersError) throw triggersError;

    // Get unacknowledged triggers
    const { count: unacknowledgedTriggers, error: unackError } = await supabase
      .from('heatmap_alert_triggers')
      .select(`
        *,
        heatmap_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('heatmap_alerts.user_id', user.id)
      .eq('is_acknowledged', false);

    if (unackError) throw unackError;

    // Get triggers in last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentTriggers, error: recentError } = await supabase
      .from('heatmap_alert_triggers')
      .select(`
        *,
        heatmap_alerts!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('heatmap_alerts.user_id', user.id)
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
   * Collect currently tracked unique symbols across all alert types for the user
   * Used to enforce the global max-3 unique pairs rule.
   */
  async _collectUserTrackedSymbols(userId) {
    const symbols = new Set();
    // Heatmap alerts
    const { data: heatmap, error: e1 } = await supabase
      .from('heatmap_alerts')
      .select('pairs')
      .eq('user_id', userId);
    if (!e1 && Array.isArray(heatmap)) {
      heatmap.forEach(r => (r.pairs || []).forEach(s => symbols.add(s)));
    }
    // Removed legacy correlation alerts aggregation: replaced by single-alert tracker without pair lists
    return Array.from(symbols);
  }

  /**
   * Check if alert should trigger based on current market data
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
    // 1. Calculate the actual heatmap scores for the alert's pairs/timeframes/indicators
    // 2. Compare against the alert thresholds
    // 3. Check if enough time has passed since last trigger (based on alert_frequency)
    // 4. Implement crossing detection to prevent spam
    
    // For now, return a placeholder structure
    return {
      shouldTrigger: false,
      reason: 'Market data analysis not implemented',
      alert,
      marketData
    };
  }

  /**
   * Check if a score crosses into a trigger condition (prevents spam)
   * @param {number} currentScore - Current heatmap score
   * @param {number} previousScore - Previous heatmap score
   * @param {number} threshold - Threshold to check against
   * @param {string} triggerType - 'buy' or 'sell'
   * @returns {Object} - Crossing detection result
   */
  _checkCrossingTrigger(currentScore, previousScore, threshold, triggerType) {
    if (previousScore === null || previousScore === undefined) {
      // First time check - no previous data, don't trigger
      return { 
        shouldTrigger: false, 
        reason: 'No previous data for crossing detection',
        crossingDirection: null 
      };
    }

    if (triggerType === 'buy') {
      // Buy trigger: score crosses INTO buy threshold (70-100)
      if (currentScore >= threshold && previousScore < threshold) {
        return { 
          shouldTrigger: true, 
          reason: 'Crossed into buy condition',
          crossingDirection: 'cross_into_buy',
          previousScore,
          crossingThreshold: threshold
        };
      }
    } else if (triggerType === 'sell') {
      // Sell trigger: score crosses INTO sell threshold (0-30)
      if (currentScore <= threshold && previousScore > threshold) {
        return { 
          shouldTrigger: true, 
          reason: 'Crossed into sell condition',
          crossingDirection: 'cross_into_sell',
          previousScore,
          crossingThreshold: threshold
        };
      }
    }

    // No crossing detected
    return { 
      shouldTrigger: false, 
      reason: 'No crossing detected - condition already met or not crossed',
      crossingDirection: null 
    };
  }

  /**
   * Process heatmap data and check for crossing triggers (for backend use)
   * @param {string} alertId - Alert ID
   * @param {Object} currentMarketData - Current market data with scores
   * @returns {Object} - Processing result with any triggers
   */
  async processHeatmapData(alertId, currentMarketData) {
    const alert = await this.getAlertById(alertId);
    if (!alert || !alert.is_active) {
      return { triggers: [], updated: false };
    }

    const previousValues = await this.getPreviousValues(alertId);
    const triggers = [];
    const newPreviousValues = {};

    // Process each pair and timeframe combination
    for (const pair of alert.pairs) {
      for (const timeframe of alert.timeframes) {
        const currentScore = currentMarketData[pair]?.[timeframe]?.score;
        if (currentScore === undefined) continue;

        const previousScore = previousValues?.[pair]?.[timeframe]?.score;
        
        // Check for buy crossing
        if (currentScore >= alert.buy_threshold_min && 
            (previousScore === undefined || previousScore < alert.buy_threshold_min)) {
          
          const crossingResult = this._checkCrossingTrigger(
            currentScore, 
            previousScore, 
            alert.buy_threshold_min, 
            'buy'
          );

          if (crossingResult.shouldTrigger) {
            triggers.push({
              alertId,
              triggerType: 'buy',
              triggerScore: currentScore,
              symbol: pair,
              timeframe,
              indicatorsData: currentMarketData[pair][timeframe].indicators,
              previousIndicatorsData: previousValues?.[pair]?.[timeframe]?.indicators,
              currentPrice: currentMarketData[pair][timeframe].price,
              priceChangePercent: currentMarketData[pair][timeframe].priceChange,
              crossingDirection: crossingResult.crossingDirection,
              previousScore: crossingResult.previousScore,
              crossingThreshold: crossingResult.crossingThreshold
            });
          }
        }

        // Check for sell crossing
        if (currentScore <= alert.sell_threshold_max && 
            (previousScore === undefined || previousScore > alert.sell_threshold_max)) {
          
          const crossingResult = this._checkCrossingTrigger(
            currentScore, 
            previousScore, 
            alert.sell_threshold_max, 
            'sell'
          );

          if (crossingResult.shouldTrigger) {
            triggers.push({
              alertId,
              triggerType: 'sell',
              triggerScore: currentScore,
              symbol: pair,
              timeframe,
              indicatorsData: currentMarketData[pair][timeframe].indicators,
              previousIndicatorsData: previousValues?.[pair]?.[timeframe]?.indicators,
              currentPrice: currentMarketData[pair][timeframe].price,
              priceChangePercent: currentMarketData[pair][timeframe].priceChange,
              crossingDirection: crossingResult.crossingDirection,
              previousScore: crossingResult.previousScore,
              crossingThreshold: crossingResult.crossingThreshold
            });
          }
        }

        // Store current values as new previous values
        if (!newPreviousValues[pair]) newPreviousValues[pair] = {};
        newPreviousValues[pair][timeframe] = {
          score: currentScore,
          indicators: currentMarketData[pair][timeframe].indicators,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Update previous values if we have new data
    if (Object.keys(newPreviousValues).length > 0) {
      // Merge newPreviousValues with existing previousValues to preserve other pairs/timeframes
      const existingPreviousValues = previousValues || {};
      const mergedPreviousValues = this._deepMergeObjects(existingPreviousValues, newPreviousValues);
      await this.updatePreviousValues(alertId, mergedPreviousValues);
    }

    return { triggers, updated: true };
  }

  /**
   * Update previous values for an alert (for crossing detection)
   * @param {string} alertId - Alert ID
   * @param {Object} newValues - New indicator values to store
   * @returns {Object} - Updated alert
   */
  async updatePreviousValues(alertId, newValues) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('heatmap_alerts')
      .update({ previous_values: newValues })
      .eq('id', alertId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get previous values for an alert (for crossing detection)
   * @param {string} alertId - Alert ID
   * @returns {Object} - Previous values or null
   */
  async getPreviousValues(alertId) {
    const alert = await this.getAlertById(alertId);
    return alert?.previous_values || null;
  }

  /**
   * Create a new alert trigger record (now secured by RLS policies)
   * @param {string} alertId - Alert ID
   * @param {Object} triggerData - Trigger data
   * @returns {Object} - Created trigger
   */
  async createAlertTrigger(alertId, triggerData) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('heatmap_alert_triggers')
      .insert({
        alert_id: alertId,
        trigger_type: triggerData.triggerType,
        trigger_score: triggerData.triggerScore,
        symbol: triggerData.symbol,
        timeframe: triggerData.timeframe,
        indicators_data: triggerData.indicatorsData,
        previous_indicators_data: triggerData.previousIndicatorsData,
        current_price: triggerData.currentPrice,
        price_change_percent: triggerData.priceChangePercent,
        crossing_direction: triggerData.crossingDirection,
        previous_score: triggerData.previousScore,
        crossing_threshold: triggerData.crossingThreshold
      })
      .select()
      .single();

    if (error) throw error;

    // Update last_triggered_at on the alert
    await supabase
      .from('heatmap_alerts')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', user.id);

    return data;
  }

  /**
   * Get default alert configuration
   * @returns {Object} - Default configuration
   */
  getDefaultAlertConfig() {
    return {
      alertName: '',
      isActive: true,
      pairs: ['EURUSD'],
      timeframes: ['1H'],
      selectedIndicators: ['RSI'],
      tradingStyle: 'day',
      buyThresholdMin: 70,
      sellThresholdMax: 30,
      minAlignment: 0,
      cooldownMinutes: 30,
      gateByBuyNow: false,
      gateBuyMin: 60,
      gateSellMax: 40,
      notificationMethods: ['email'],
      alertFrequency: 'once'
    };
  }

  /**
   * Get available options for alert configuration
   * @returns {Object} - Available options
   */
  getAlertOptions() {
    return {
      tradingStyles: [
        { value: 'scalper', label: '⚡ Scalper' },
        { value: 'day', label: '📈 Day' },
        { value: 'swing', label: '📊 Swing' }
      ],
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
      indicators: [
        { value: 'EMA21', label: 'EMA 21' },
        { value: 'EMA50', label: 'EMA 50' },
        { value: 'EMA200', label: 'EMA 200' },
        { value: 'MACD', label: 'MACD' },
        { value: 'RSI', label: 'RSI' },
        { value: 'UTBOT', label: 'UTBOT' },
        { value: 'IchimokuClone', label: 'Ichimoku Clone' }
      ],
      alertFrequencies: [
        { value: 'once', label: 'Once Only' },
        { value: 'every_5min', label: 'Every 5 Minutes' },
        { value: 'every_15min', label: 'Every 15 Minutes' },
        { value: 'every_30min', label: 'Every 30 Minutes' },
        { value: 'every_hour', label: 'Every Hour' }
      ],
      notificationMethods: [
        { value: 'email', label: 'Email' }
      ]
    };
  }
}

const heatmapAlertService = new HeatmapAlertService();
export default heatmapAlertService;
