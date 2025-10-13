import { Bell, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import currencyStrengthAlertService from '../services/currencyStrengthAlertService';
import useCurrencyStrengthStore from '../store/useCurrencyStrengthStore';

const CurrencyStrengthAlertConfig = ({ isOpen, onClose }) => {
  const { timeframes, updateSettings } = useCurrencyStrengthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState(() => currencyStrengthAlertService.getDefaultAlertConfig());

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await currencyStrengthAlertService.getAlert();
        if (existing) {
          setAlert(existing);
          setForm({
            timeframe: existing.timeframe,
            isActive: existing.isActive
          });
        } else {
          setAlert(null);
          setForm(currencyStrengthAlertService.getDefaultAlertConfig());
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
      const saved = await currencyStrengthAlertService.saveAlert(form);
      setAlert(saved);
      // Sync the CSM store timeframe with saved alert timeframe
      updateSettings({ timeframe: saved.timeframe });
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
      await currencyStrengthAlertService.deleteAlert();
      setAlert(null);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        isolation: 'isolate'
      }}
    >
      <div className="bg-white dark:bg-[#19235d] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#19235d] dark:text-slate-100">Currency Strength Alert</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">Single alert, one timeframe</p>
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
                <label htmlFor="cs-alert-timeframe" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Timeframe</label>
                <select
                  id="cs-alert-timeframe"
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {timeframes
                    .filter(tf => String(tf).toUpperCase() !== '1M' && String(tf).toUpperCase() !== 'M1')
                    .map((tf) => (
                      <option key={tf} value={tf}>{tf}</option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-slate-400">Evaluates currency strength at selected timeframe.</div>
                <div className="flex items-center space-x-2">
                  {alert && (
                    <button onClick={handleDelete} className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">Delete</button>
                  )}
                  <button onClick={handleSave} disabled={saving} className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                    {saving ? 'Saving...' : (<span className="inline-flex items-center space-x-1"><Check className="w-3 h-3" /><span>Save</span></span>)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CurrencyStrengthAlertConfig;

