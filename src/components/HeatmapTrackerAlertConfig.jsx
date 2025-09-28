import { Bell, Check, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import heatmapTrackerAlertService from '../services/heatmapTrackerAlertService';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { formatSymbolDisplay } from '../utils/formatters';

const HeatmapTrackerAlertConfig = ({ isOpen, onClose }) => {
  const { settings } = useRSITrackerStore();
  const availablePairs = useMemo(() => (settings?.autoSubscribeSymbols || []).map(s => s.replace(/m$/,'').toUpperCase()), [settings?.autoSubscribeSymbols]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState(() => heatmapTrackerAlertService.getDefaultAlertConfig());

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await heatmapTrackerAlertService.getAlert();
        if (existing) {
          setAlert(existing);
          setForm({
            pairs: (existing.pairs || []).map(p => p.toUpperCase()),
            tradingStyle: ['scalper','swingTrader'].includes(existing.tradingStyle) ? existing.tradingStyle : 'swingTrader',
            buyThreshold: existing.buyThreshold,
            sellThreshold: existing.sellThreshold,
            isActive: existing.isActive
          });
        } else {
          setAlert(null);
          setForm(heatmapTrackerAlertService.getDefaultAlertConfig());
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePair = (pair) => {
    setForm(prev => {
      const exists = prev.pairs.includes(pair);
      if (exists) return { ...prev, pairs: prev.pairs.filter(p => p !== pair) };
      if (prev.pairs.length >= 3) return prev;
      return { ...prev, pairs: [...prev.pairs, pair] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await heatmapTrackerAlertService.saveAlert(form);
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
      await heatmapTrackerAlertService.deleteAlert();
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Quantum Analysis Alert</h2>
              <p className="text-xs text-gray-500">Up to 3 pairs. One alert. Threshold triggers.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <>
              {error && <div className="text-sm text-red-600">{error}</div>}

              <div>
                <p className="block text-xs font-medium text-gray-700 mb-1">Pairs (up to 3)</p>
                <div className="flex flex-wrap gap-2">
                  {availablePairs.map(pair => (
                    <button
                      key={pair}
                      onClick={() => togglePair(pair)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${form.pairs.includes(pair) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      {formatSymbolDisplay(pair)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="heatmap-tracker-mode" className="block text-xs font-medium text-gray-700 mb-1">Mode</label>
                <select
                  id="heatmap-tracker-mode"
                  value={form.tradingStyle}
                  onChange={(e) => setForm({ ...form, tradingStyle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scalper">Scalper</option>
                  <option value="swingTrader">Swing Trader</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="heatmap-tracker-buy-threshold" className="block text-xs font-medium text-gray-700 mb-1">Buy Threshold (%)</label>
                  <input id="heatmap-tracker-buy-threshold" type="number" min="0" max="100" value={form.buyThreshold} onChange={(e) => setForm({ ...form, buyThreshold: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label htmlFor="heatmap-tracker-sell-threshold" className="block text-xs font-medium text-gray-700 mb-1">Sell Threshold (%)</label>
                  <input id="heatmap-tracker-sell-threshold" type="number" min="0" max="100" value={form.sellThreshold} onChange={(e) => setForm({ ...form, sellThreshold: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Triggers when Buy% or Sell% crosses threshold.</div>
                <div className="flex items-center space-x-2">
                  {alert && (
                    <button onClick={handleDelete} className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Delete</button>
                  )}
                  <button onClick={handleSave} disabled={saving} className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
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

export default HeatmapTrackerAlertConfig;


