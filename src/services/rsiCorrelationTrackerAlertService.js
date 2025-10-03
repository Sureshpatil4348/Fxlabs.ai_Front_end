import { supabase } from '../lib/supabaseClient';

class RSICorrelationTrackerAlertService {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  }

  getDefaultAlertConfig() {
    return {
      timeframe: '4H',
      mode: 'rsi_threshold', // 'rsi_threshold' | 'real_correlation'
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      correlationWindow: 50,
      isActive: true
    };
  }

  _validate(cfg) {
    const errors = [];
    const validTimeframes = ['5M','15M','30M','1H','4H','1D','1W'];
    if (!validTimeframes.includes(cfg.timeframe)) errors.push('Invalid timeframe');
    if (!['rsi_threshold','real_correlation'].includes(cfg.mode)) errors.push('Invalid mode');
    if (cfg.mode === 'rsi_threshold') {
      // RSI period is fixed at 14; no validation required beyond enforcement
      if (!Number.isFinite(cfg.rsiOverbought) || cfg.rsiOverbought < 60 || cfg.rsiOverbought > 90) errors.push('Overbought 60-90');
      if (!Number.isFinite(cfg.rsiOversold) || cfg.rsiOversold < 10 || cfg.rsiOversold > 40) errors.push('Oversold 10-40');
      if (cfg.rsiOversold >= cfg.rsiOverbought) errors.push('Oversold < Overbought');
    }
    // Correlation window is fixed at 50; no validation required
    return { isValid: errors.length === 0, errors };
  }

  async getAlert() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('rsi_correlation_tracker_alerts')
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
      .from('rsi_correlation_tracker_alerts')
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
    // Enforce RSI period to 14 and correlation window to 50 globally
    merged.rsiPeriod = 14;
    merged.correlationWindow = 50;
    const { isValid, errors } = this._validate(merged);
    if (!isValid) throw new Error(errors.join(', '));

    const payload = {
      user_id: user.id,
      user_email: user.email,
      timeframe: merged.timeframe,
      mode: merged.mode,
      rsi_period: 14,
      rsi_overbought: merged.rsiOverbought,
      rsi_oversold: merged.rsiOversold,
      correlation_window: 50,
      is_active: merged.isActive ?? true
    };

    const { data, error } = await supabase
      .from('rsi_correlation_tracker_alerts')
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
      .from('rsi_correlation_tracker_alerts')
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
      .from('rsi_correlation_tracker_alerts')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    return true;
  }

  async createTrigger({ alertId, pairKey, timeframe, mode, triggerType, value }) {
    // triggerType: 'rsi_mismatch' | 'real_mismatch'
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const payload = { alert_id: alertId, pair_key: pairKey, timeframe, mode, trigger_type: triggerType, value };
    const { data, error } = await supabase
      .from('rsi_correlation_tracker_alert_triggers')
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
      timeframe: row.timeframe,
      mode: row.mode,
      rsiPeriod: row.rsi_period,
      rsiOverbought: row.rsi_overbought,
      rsiOversold: row.rsi_oversold,
      correlationWindow: row.correlation_window,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const rsiCorrelationTrackerAlertService = new RSICorrelationTrackerAlertService();
export default rsiCorrelationTrackerAlertService;

