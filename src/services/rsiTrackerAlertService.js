import { supabase } from '../lib/supabaseClient';

class RSITrackerAlertService {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  }

  getDefaultAlertConfig() {
    return {
      timeframe: '1H',
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      isActive: true
    };
  }

  _validate(config) {
    const errors = [];
    const validTimeframes = ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];

    if (!validTimeframes.includes(config.timeframe)) {
      errors.push('Invalid timeframe');
    }
    if (!Number.isFinite(config.rsiPeriod) || config.rsiPeriod < 5 || config.rsiPeriod > 50) {
      errors.push('RSI period must be 5-50');
    }
    if (!Number.isFinite(config.rsiOverbought) || config.rsiOverbought < 60 || config.rsiOverbought > 90) {
      errors.push('Overbought must be 60-90');
    }
    if (!Number.isFinite(config.rsiOversold) || config.rsiOversold < 10 || config.rsiOversold > 40) {
      errors.push('Oversold must be 10-40');
    }
    if (config.rsiOversold >= config.rsiOverbought) {
      errors.push('Oversold must be less than Overbought');
    }
    return { isValid: errors.length === 0, errors };
  }

  async getAlert() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('rsi_tracker_alerts')
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
      .from('rsi_tracker_alerts')
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
      timeframe: merged.timeframe,
      rsi_period: merged.rsiPeriod,
      rsi_overbought: merged.rsiOverbought,
      rsi_oversold: merged.rsiOversold,
      is_active: merged.isActive ?? true
    };

    const { data, error } = await supabase
      .from('rsi_tracker_alerts')
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
      .from('rsi_tracker_alerts')
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
      .from('rsi_tracker_alerts')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    return true;
  }

  async createTrigger({ alertId, symbol, timeframe, rsiValue, triggerCondition }) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const payload = {
      alert_id: alertId,
      symbol,
      timeframe,
      rsi_value: rsiValue,
      trigger_condition: triggerCondition
    };

    const { data, error } = await supabase
      .from('rsi_tracker_alert_triggers')
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
      rsiPeriod: row.rsi_period,
      rsiOverbought: row.rsi_overbought,
      rsiOversold: row.rsi_oversold,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const rsiTrackerAlertService = new RSITrackerAlertService();
export default rsiTrackerAlertService;


