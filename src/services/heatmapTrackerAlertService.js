import { supabase } from '../lib/supabaseClient';

class HeatmapTrackerAlertService {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  }

  getDefaultAlertConfig() {
    return {
      pairs: [], // up to 3 base symbols like 'EURUSD'
      tradingStyle: 'dayTrader', // 'scalper' | 'dayTrader' | 'swingTrader'
      buyThreshold: 70,
      sellThreshold: 70,
      isActive: true
    };
  }

  _validate(cfg) {
    const errors = [];
    if (!Array.isArray(cfg.pairs) || cfg.pairs.length === 0 || cfg.pairs.length > 3) errors.push('Select 1-3 pairs');
    const styleOk = ['scalper','dayTrader','swingTrader'].includes(cfg.tradingStyle);
    if (!styleOk) errors.push('Invalid trading style');
    if (!Number.isFinite(cfg.buyThreshold) || cfg.buyThreshold < 0 || cfg.buyThreshold > 100) errors.push('Buy threshold 0-100');
    if (!Number.isFinite(cfg.sellThreshold) || cfg.sellThreshold < 0 || cfg.sellThreshold > 100) errors.push('Sell threshold 0-100');
    return { isValid: errors.length === 0, errors };
  }

  async getAlert() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('heatmap_tracker_alerts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle?.() ?? { data: null, error: null };
    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._toCamel(data) : null;
  }

  async getActiveAlert() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('heatmap_tracker_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle?.() ?? { data: null, error: null };
    if (error && error.code !== 'PGRST116') throw error;
    return data ? this._toCamel(data) : null;
  }

  async saveAlert(config) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const merged = { ...this.getDefaultAlertConfig(), ...config };
    const { isValid, errors } = this._validate(merged);
    if (!isValid) throw new Error(errors.join(', '));

    const payload = {
      user_id: user.id,
      user_email: user.email,
      pairs: (merged.pairs || []).map(p => p?.toUpperCase?.() || p),
      trading_style: merged.tradingStyle,
      buy_threshold: merged.buyThreshold,
      sell_threshold: merged.sellThreshold,
      is_active: merged.isActive ?? true
    };

    const { data, error } = await supabase
      .from('heatmap_tracker_alerts')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return this._toCamel(data);
  }

  async toggleActive(isActive) {
    const alert = await this.getAlert();
    if (!alert) throw new Error('No alert configured');
    const { data, error } = await supabase
      .from('heatmap_tracker_alerts')
      .update({ is_active: !!isActive })
      .eq('id', alert.id)
      .select()
      .single();
    if (error) throw error;
    return this._toCamel(data);
  }

  async deleteAlert() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('heatmap_tracker_alerts')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    return true;
  }

  async createTrigger({ alertId, symbol, triggerType, buyPercent, sellPercent, finalScore }) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const payload = { alert_id: alertId, symbol, trigger_type: triggerType, buy_percent: buyPercent, sell_percent: sellPercent, final_score: finalScore };
    const { data, error } = await supabase
      .from('heatmap_tracker_alert_triggers')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  _toCamel(row) {
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      pairs: row.pairs,
      tradingStyle: row.trading_style,
      buyThreshold: row.buy_threshold,
      sellThreshold: row.sell_threshold,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const heatmapTrackerAlertService = new HeatmapTrackerAlertService();
export default heatmapTrackerAlertService;


