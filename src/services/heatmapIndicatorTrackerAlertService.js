import { supabase } from '../lib/supabaseClient';

class HeatmapIndicatorTrackerAlertService {
  async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session?.user ?? null;
  }

  getDefaultAlertConfig() {
    return {
      pairs: [], // up to 3 base symbols like 'EURUSD'
      timeframe: '1H',
      indicator: 'MACD', // 'EMA21'|'EMA50'|'EMA200'|'MACD'|'RSI'|'UTBOT'|'IchimokuClone'
      isActive: true
    };
  }

  _validate(cfg) {
    const errors = [];
    if (!Array.isArray(cfg.pairs) || cfg.pairs.length === 0 || cfg.pairs.length > 3) errors.push('Select 1-3 pairs');
    const validTimeframes = ['5M','15M','30M','1H','4H','1D','1W'];
    if (!validTimeframes.includes(cfg.timeframe)) errors.push('Invalid timeframe');
    const validIndicators = ['EMA21','EMA50','EMA200','MACD','RSI','UTBOT','IchimokuClone'];
    if (!validIndicators.includes(cfg.indicator)) errors.push('Invalid indicator');
    return { isValid: errors.length === 0, errors };
  }

  async getAlert() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('heatmap_indicator_tracker_alerts')
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
      .from('heatmap_indicator_tracker_alerts')
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
      timeframe: merged.timeframe,
      indicator: merged.indicator,
      is_active: merged.isActive ?? true
    };

    const { data, error } = await supabase
      .from('heatmap_indicator_tracker_alerts')
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
      .from('heatmap_indicator_tracker_alerts')
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
      .from('heatmap_indicator_tracker_alerts')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    return true;
  }

  _toCamel(row) {
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      pairs: row.pairs,
      timeframe: row.timeframe,
      indicator: row.indicator,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const heatmapIndicatorTrackerAlertService = new HeatmapIndicatorTrackerAlertService();
export default heatmapIndicatorTrackerAlertService;

