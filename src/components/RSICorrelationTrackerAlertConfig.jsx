import { BarChart3, Activity, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import rsiCorrelationTrackerAlertService from '../services/rsiCorrelationTrackerAlertService';
import useRSICorrelationStore from '../store/useRSICorrelationStore';

const RSICorrelationTrackerAlertConfig = ({ isOpen, onClose }) => {
  const { timeframes, correlationWindows, updateSettings } = useRSICorrelationStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState(() => rsiCorrelationTrackerAlertService.getDefaultAlertConfig());

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await rsiCorrelationTrackerAlertService.getAlert();
        if (existing) {
          setAlert(existing);
          setForm({
            timeframe: existing.timeframe,
            mode: existing.mode,
            rsiPeriod: existing.rsiPeriod,
            rsiOverbought: existing.rsiOverbought,
            rsiOversold: existing.rsiOversold,
            correlationWindow: existing.correlationWindow,
            isActive: existing.isActive
          });
        } else {
          setAlert(null);
          setForm(rsiCorrelationTrackerAlertService.getDefaultAlertConfig());
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await rsiCorrelationTrackerAlertService.saveAlert(form);
      setAlert(saved);
      updateSettings({
        timeframe: saved.timeframe,
        calculationMode: saved.mode === 'real_correlation' ? 'real_correlation' : 'rsi_threshold',
        rsiPeriod: saved.rsiPeriod,
        rsiOverbought: saved.rsiOverbought,
        rsiOversold: saved.rsiOversold,
        correlationWindow: saved.correlationWindow
      });
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!alert) return onClose?.();
    try {
      setSaving(true);
      await rsiCorrelationTrackerAlertService.deleteAlert();
      setAlert(null);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              {form.mode === 'real_correlation' ? <Activity className="w-4 h-4 text-white" /> : <BarChart3 className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">RSI Correlation Alert</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">Single alert, one timeframe. Choose mode.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-slate-400">Loading...</div>
          ) : (
            <>
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

              <div>
                <label htmlFor="rsi-corr-timeframe" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Timeframe</label>
                <select
                  id="rsi-corr-timeframe"
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {timeframes.filter(tf => tf !== '1M').map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rsi-corr-mode" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Mode</label>
                <select
                  id="rsi-corr-mode"
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="rsi_threshold">RSI Threshold</option>
                  <option value="real_correlation">Real Correlation</option>
                </select>
              </div>

              {form.mode === 'rsi_threshold' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="rsi-corr-period" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">RSI Period</label>
                    <input id="rsi-corr-period" type="number" min="5" max="50" value={form.rsiPeriod} onChange={(e) => setForm({ ...form, rsiPeriod: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                  <div>
                    <label htmlFor="rsi-corr-overbought" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Overbought</label>
                    <input id="rsi-corr-overbought" type="number" min="60" max="90" value={form.rsiOverbought} onChange={(e) => setForm({ ...form, rsiOverbought: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                  <div>
                    <label htmlFor="rsi-corr-oversold" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Oversold</label>
                    <input id="rsi-corr-oversold" type="number" min="10" max="40" value={form.rsiOversold} onChange={(e) => setForm({ ...form, rsiOversold: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                </div>
              )}

              {form.mode === 'real_correlation' && (
                <div>
                  <label htmlFor="rsi-corr-window" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Correlation Window</label>
                  <select
                    id="rsi-corr-window"
                    value={form.correlationWindow}
                    onChange={(e) => setForm({ ...form, correlationWindow: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {correlationWindows.map(w => (
                      <option key={w} value={w}>{w} periods</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-slate-400">Only one alert per user. Checks all correlation pairs; triggers on mismatches.</div>
                <div className="flex items-center space-x-2">
                  {alert && (
                    <button onClick={handleDelete} className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">Delete</button>
                  )}
                  <button onClick={handleSave} disabled={saving} className="px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    {saving ? 'Saving...' : (<span className="inline-flex items-center space-x-1"><Check className="w-3 h-3" /><span>Save</span></span>)}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSICorrelationTrackerAlertConfig;


