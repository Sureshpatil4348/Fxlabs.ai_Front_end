import { Sliders, Check, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import heatmapIndicatorTrackerAlertService from '../services/heatmapIndicatorTrackerAlertService';
import useRSITrackerStore from '../store/useRSITrackerStore';

const INDICATORS = ['EMA21','EMA50','EMA200','MACD','RSI','UTBOT','IchimokuClone'];

const HeatmapIndicatorTrackerAlertConfig = ({ isOpen, onClose }) => {
  const { settings, timeframes } = useRSITrackerStore();
  const availablePairs = useMemo(() => (settings?.autoSubscribeSymbols || []).map(s => s.replace(/m$/,'').toUpperCase()), [settings?.autoSubscribeSymbols]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState(() => heatmapIndicatorTrackerAlertService.getDefaultAlertConfig());

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await heatmapIndicatorTrackerAlertService.getAlert();
        if (existing) {
          setAlert(existing);
          setForm({
            pairs: (existing.pairs || []).map(p => p.toUpperCase()),
            timeframe: existing.timeframe,
            indicator: existing.indicator,
            isActive: existing.isActive
          });
        } else {
          setAlert(null);
          setForm(heatmapIndicatorTrackerAlertService.getDefaultAlertConfig());
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
      await heatmapIndicatorTrackerAlertService.saveAlert(form);
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
      await heatmapIndicatorTrackerAlertService.deleteAlert();
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
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Custom Indicator Alert</h2>
              <p className="text-xs text-gray-500">One indicator, one timeframe, up to 3 pairs.</p>
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
                      className={`px-2 py-1 rounded-full text-xs font-medium ${form.pairs.includes(pair) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      {pair}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="heatmap-indicator-timeframe" className="block text-xs font-medium text-gray-700 mb-1">Timeframe</label>
                <select
                  id="heatmap-indicator-timeframe"
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="heatmap-indicator-select" className="block text-xs font-medium text-gray-700 mb-1">Indicator</label>
                <select
                  id="heatmap-indicator-select"
                  value={form.indicator}
                  onChange={(e) => setForm({ ...form, indicator: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {INDICATORS.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Triggers when selected indicator flips Buy/Sell.</div>
                <div className="flex items-center space-x-2">
                  {alert && (
                    <button onClick={handleDelete} className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Delete</button>
                  )}
                  <button onClick={handleSave} disabled={saving} className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
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

export default HeatmapIndicatorTrackerAlertConfig;


