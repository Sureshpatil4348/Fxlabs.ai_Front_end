import { Bell, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import rsiTrackerAlertService from '../services/rsiTrackerAlertService';
import NumericInput from './ui/NumericInput.jsx';
import useRSITrackerStore from '../store/useRSITrackerStore';

const RSITrackerAlertConfig = ({ isOpen, onClose }) => {
  const { timeframes, updateSettings } = useRSITrackerStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState(() => rsiTrackerAlertService.getDefaultAlertConfig());

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await rsiTrackerAlertService.getAlert();
        if (existing) {
          setAlert(existing);
          setForm({
            timeframe: existing.timeframe,
            rsiPeriod: existing.rsiPeriod,
            rsiOverbought: existing.rsiOverbought,
            rsiOversold: existing.rsiOversold,
            isActive: existing.isActive
          });
        } else {
          setAlert(null);
          setForm(rsiTrackerAlertService.getDefaultAlertConfig());
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
      const saved = await rsiTrackerAlertService.saveAlert(form);
      setAlert(saved);
      // Sync tracker settings so the UI view matches alert evaluation timeframe
      updateSettings({
        timeframe: saved.timeframe,
        rsiOverbought: saved.rsiOverbought,
        rsiOversold: saved.rsiOversold
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
      await rsiTrackerAlertService.deleteAlert();
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
      <div className="bg-white dark:bg-[#19235d] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#19235d] dark:text-slate-100">RSI Tracker Alert</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">Single alert, one timeframe, RSI thresholds</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-4">
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

              <div>
                <label htmlFor="rsi-tracker-timeframe" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Timeframe</label>
                <select
                  id="rsi-tracker-timeframe"
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {timeframes.filter(tf => tf !== '1M').map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="rsi-tracker-overbought" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Overbought</label>
                  <NumericInput
                    id="rsi-tracker-overbought"
                    min={60}
                    max={90}
                    value={form.rsiOverbought}
                    onChange={(n) => setForm({ ...form, rsiOverbought: n })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="rsi-tracker-oversold" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Oversold</label>
                  <NumericInput
                    id="rsi-tracker-oversold"
                    min={10}
                    max={40}
                    value={form.rsiOversold}
                    onChange={(n) => setForm({ ...form, rsiOversold: n })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  Only one alert per user. Checks all pairs and triggers on threshold cross.
                </div>
                <div className="flex items-center space-x-2">
                  {alert && (
                    <button onClick={handleDelete} className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">
                      Delete
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-2 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (
                      <span className="inline-flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSITrackerAlertConfig;

