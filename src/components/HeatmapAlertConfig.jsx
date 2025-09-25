import { Bell, Plus, X, Check, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import heatmapAlertService from '../services/heatmapAlertService';

const HeatmapAlertConfig = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState(heatmapAlertService.getDefaultAlertConfig());
  const [creating, setCreating] = useState(false);

  // Load alerts when component opens
  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const userAlerts = await heatmapAlertService.getAlerts();
      setAlerts(userAlerts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    try {
      setCreating(true);
      setError(null);
      await heatmapAlertService.createAlert(newAlert);
      setNewAlert(heatmapAlertService.getDefaultAlertConfig());
      setShowCreateForm(false);
      await loadAlerts(); // Reload alerts
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };


  const handleDeleteAlert = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await heatmapAlertService.deleteAlert(alertId);
        await loadAlerts(); // Reload alerts
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getAlertOptions = () => heatmapAlertService.getAlertOptions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Heatmap Alerts</h2>
              <p className="text-sm text-gray-500">Configure trading alerts for multi-indicator heatmap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Create New Alert Button */}
          {!showCreateForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Alert</span>
              </button>
            </div>
          )}

          {/* Create Alert Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Alert</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewAlert(heatmapAlertService.getDefaultAlertConfig());
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Alert Name */}
                <div>
                  <label htmlFor="alertName" className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Name
                  </label>
                  <input
                    id="alertName"
                    type="text"
                    value={newAlert.alertName}
                    onChange={(e) => setNewAlert({ ...newAlert, alertName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter alert name"
                  />
                </div>

                {/* Trading Pairs */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Trading Pairs (1-3 pairs)
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'].map(pair => (
                        <button
                          key={pair}
                          onClick={() => {
                            const pairs = newAlert.pairs.includes(pair)
                              ? newAlert.pairs.filter(p => p !== pair)
                              : newAlert.pairs.length < 3 ? [...newAlert.pairs, pair] : newAlert.pairs;
                            setNewAlert({ ...newAlert, pairs });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            newAlert.pairs.includes(pair)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pair}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* Timeframes */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Timeframes (1-3 timeframes)
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {getAlertOptions().timeframes.map(tf => (
                        <button
                          key={tf.value}
                          onClick={() => {
                            const timeframes = newAlert.timeframes.includes(tf.value)
                              ? newAlert.timeframes.filter(t => t !== tf.value)
                              : newAlert.timeframes.length < 3 ? [...newAlert.timeframes, tf.value] : newAlert.timeframes;
                            setNewAlert({ ...newAlert, timeframes });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            newAlert.timeframes.includes(tf.value)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* Indicators */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Indicators (1-2 indicators)
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {getAlertOptions().indicators.map(indicator => (
                        <button
                          key={indicator.value}
                          onClick={() => {
                            const indicators = newAlert.selectedIndicators.includes(indicator.value)
                              ? newAlert.selectedIndicators.filter(i => i !== indicator.value)
                              : newAlert.selectedIndicators.length < 2 ? [...newAlert.selectedIndicators, indicator.value] : newAlert.selectedIndicators;
                            setNewAlert({ ...newAlert, selectedIndicators: indicators });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            newAlert.selectedIndicators.includes(indicator.value)
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {indicator.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* Trading Style */}
                <div>
                  <label htmlFor="tradingStyle" className="block text-sm font-medium text-gray-700 mb-1">
                    Trading Style
                  </label>
                  <select
                    id="tradingStyle"
                    value={newAlert.tradingStyle}
                    onChange={(e) => setNewAlert({ ...newAlert, tradingStyle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getAlertOptions().tradingStyles.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Thresholds */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="buyThresholdMin" className="block text-sm font-medium text-gray-700 mb-1">
                      Buy ≥ Threshold (70-100)
                    </label>
                    <input
                      id="buyThresholdMin"
                      type="number"
                      min="70"
                      max="100"
                      value={newAlert.buyThresholdMin}
                      onChange={(e) => setNewAlert({ ...newAlert, buyThresholdMin: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label htmlFor="sellThresholdMax" className="block text-sm font-medium text-gray-700 mb-1">
                      Sell ≤ Threshold (0-30)
                    </label>
                    <input
                      id="sellThresholdMax"
                      type="number"
                      min="0"
                      max="30"
                      value={newAlert.sellThresholdMax}
                      onChange={(e) => setNewAlert({ ...newAlert, sellThresholdMax: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Advanced Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="minAlignment" className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Aligned TF Cells (0-5)
                    </label>
                    <input
                      id="minAlignment"
                      type="number"
                      min="0"
                      max="5"
                      value={newAlert.minAlignment}
                      onChange={(e) => setNewAlert({ ...newAlert, minAlignment: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="cooldownMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                      Cooldown (minutes)
                    </label>
                    <input
                      id="cooldownMinutes"
                      type="number"
                      min="1"
                      max="1440"
                      value={newAlert.cooldownMinutes}
                      onChange={(e) => setNewAlert({ ...newAlert, cooldownMinutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Gate by Buy Now % */}
                <div className="p-3 border border-gray-200 rounded-lg bg-white">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={newAlert.gateByBuyNow}
                      onChange={(e) => setNewAlert({ ...newAlert, gateByBuyNow: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Gate by Buy Now %</span>
                  </label>
                  {newAlert.gateByBuyNow && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label htmlFor="gateBuyMin" className="block text-sm font-medium text-gray-700 mb-1">
                          Buy gate ≥ (%)
                        </label>
                        <input
                          id="gateBuyMin"
                          type="number"
                          min="0"
                          max="100"
                          value={newAlert.gateBuyMin}
                          onChange={(e) => setNewAlert({ ...newAlert, gateBuyMin: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="gateSellMax" className="block text-sm font-medium text-gray-700 mb-1">
                          Sell gate ≤ (%)
                        </label>
                        <input
                          id="gateSellMax"
                          type="number"
                          min="0"
                          max="100"
                          value={newAlert.gateSellMax}
                          onChange={(e) => setNewAlert({ ...newAlert, gateSellMax: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Alert Frequency */}
                <div>
                  <label htmlFor="alertFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Frequency
                  </label>
                  <select
                    id="alertFrequency"
                    value={newAlert.alertFrequency}
                    onChange={(e) => setNewAlert({ ...newAlert, alertFrequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getAlertOptions().alertFrequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Create Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateAlert}
                    disabled={creating || !newAlert.alertName || newAlert.pairs.length === 0 || newAlert.timeframes.length === 0 || newAlert.selectedIndicators.length === 0}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Create Alert</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing Alerts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Alerts</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No alerts configured yet</p>
                <p className="text-sm">Create your first alert to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{alert.alertName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Pairs:</span> {alert.pairs?.join(', ') || 'N/A'}</p>
                          <p><span className="font-medium">Timeframes:</span> {alert.timeframes?.join(', ') || 'N/A'}</p>
                          <p><span className="font-medium">Indicators:</span> {alert.selectedIndicators?.join(', ') || 'N/A'}</p>
                          <p><span className="font-medium">Style:</span> {alert.tradingStyle || 'N/A'}</p>
                          <p><span className="font-medium">Buy ≥</span> {alert.buyThresholdMin ?? 'N/A'}% | <span className="font-medium">Sell ≤</span> {alert.sellThresholdMax ?? 'N/A'}%</p>
                          <p><span className="font-medium">Min Align:</span> {alert.minAlignment ?? 0} · <span className="font-medium">Cooldown:</span> {alert.cooldownMinutes ?? 30}m</p>
                          {alert.gateByBuyNow && (
                            <p><span className="font-medium">Gate:</span> Buy ≥ {alert.gateBuyMin ?? 60}% · Sell ≤ {alert.gateSellMax ?? 40}%</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapAlertConfig;
