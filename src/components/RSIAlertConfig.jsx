import React, { useState, useEffect } from 'react';

import { TrendingUp, Plus, Settings, X, Check, AlertCircle } from 'lucide-react';

import rsiAlertService from '../services/rsiAlertService';

const RSIAlertConfig = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState(() => {
    const defaultConfig = rsiAlertService.getDefaultAlertConfig();
    // Ensure timeframes is always an array
    return {
      ...defaultConfig,
      timeframes: defaultConfig.timeframes || ['1H']
    };
  });
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
      const userAlerts = await rsiAlertService.getAlerts();
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
      await rsiAlertService.createAlert(newAlert);
      const defaultConfig = rsiAlertService.getDefaultAlertConfig();
      setNewAlert({
        ...defaultConfig,
        timeframes: defaultConfig.timeframes || ['1H']
      });
      setShowCreateForm(false);
      await loadAlerts(); // Reload alerts
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAlert = async (alertId, isActive) => {
    try {
      await rsiAlertService.toggleAlert(alertId, !isActive);
      await loadAlerts(); // Reload alerts
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await rsiAlertService.deleteAlert(alertId);
        await loadAlerts(); // Reload alerts
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getAlertOptions = () => rsiAlertService.getAlertOptions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">RSI Tracker Alerts</h2>
              <p className="text-sm text-gray-500">Configure RSI overbought/oversold and RFI alerts</p>
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
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Create New RSI Alert</span>
              </button>
            </div>
          )}

          {/* Create Alert Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New RSI Alert</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    const defaultConfig = rsiAlertService.getDefaultAlertConfig();
                    setNewAlert({
                      ...defaultConfig,
                      timeframes: defaultConfig.timeframes || ['1H']
                    });
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
                  <label htmlFor="rsiAlertName" className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Name
                  </label>
                  <input
                    id="rsiAlertName"
                    type="text"
                    value={newAlert.alertName}
                    onChange={(e) => setNewAlert({ ...newAlert, alertName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter alert name"
                  />
                </div>

                {/* Trading Pairs */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Trading Pairs (1-5 pairs)
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD'].map(pair => (
                        <button
                          key={pair}
                          onClick={() => {
                            const pairs = newAlert.pairs.includes(pair)
                              ? newAlert.pairs.filter(p => p !== pair)
                              : newAlert.pairs.length < 5 ? [...newAlert.pairs, pair] : newAlert.pairs;
                            setNewAlert({ ...newAlert, pairs });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            newAlert.pairs.includes(pair)
                              ? 'bg-orange-500 text-white'
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
                            const currentTimeframes = newAlert.timeframes || ['1H'];
                            const timeframes = currentTimeframes.includes(tf.value)
                              ? currentTimeframes.filter(t => t !== tf.value)
                              : currentTimeframes.length < 3 ? [...currentTimeframes, tf.value] : currentTimeframes;
                            setNewAlert({ ...newAlert, timeframes });
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            (newAlert.timeframes || ['1H']).includes(tf.value)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* RSI Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="rsiPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                      RSI Period
                    </label>
                    <input
                      id="rsiPeriod"
                      type="number"
                      min="5"
                      max="50"
                      value={newAlert.rsiPeriod}
                      onChange={(e) => setNewAlert({ ...newAlert, rsiPeriod: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsiOverbought" className="block text-sm font-medium text-gray-700 mb-1">
                      Overbought (60-90)
                    </label>
                    <input
                      id="rsiOverbought"
                      type="number"
                      min="60"
                      max="90"
                      value={newAlert.rsiOverboughtThreshold}
                      onChange={(e) => setNewAlert({ ...newAlert, rsiOverboughtThreshold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsiOversold" className="block text-sm font-medium text-gray-700 mb-1">
                      Oversold (10-40)
                    </label>
                    <input
                      id="rsiOversold"
                      type="number"
                      min="10"
                      max="40"
                      value={newAlert.rsiOversoldThreshold}
                      onChange={(e) => setNewAlert({ ...newAlert, rsiOversoldThreshold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Alert Conditions */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Alert Conditions (1-6 conditions)
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {getAlertOptions().alertConditions.map(condition => (
                        <button
                          key={condition.value}
                          onClick={() => {
                            const conditions = newAlert.alertConditions.includes(condition.value)
                              ? newAlert.alertConditions.filter(c => c !== condition.value)
                              : newAlert.alertConditions.length < 6 ? [...newAlert.alertConditions, condition.value] : newAlert.alertConditions;
                            setNewAlert({ ...newAlert, alertConditions: conditions });
                          }}
                          className={`p-3 rounded-lg text-sm font-medium transition-all text-left ${
                            newAlert.alertConditions.includes(condition.value)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <div className="font-semibold">{condition.label}</div>
                          <div className="text-xs opacity-75">{condition.description}</div>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* RFI Thresholds (only show if RFI conditions are selected) */}
                {(newAlert.alertConditions.includes('rfi_strong') || newAlert.alertConditions.includes('rfi_moderate')) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rfiStrong" className="block text-sm font-medium text-gray-700 mb-1">
                        Strong RFI Threshold (0.50-1.00)
                      </label>
                      <input
                        id="rfiStrong"
                        type="number"
                        min="0.50"
                        max="1.00"
                        step="0.01"
                        value={newAlert.rfiStrongThreshold}
                        onChange={(e) => setNewAlert({ ...newAlert, rfiStrongThreshold: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="rfiModerate" className="block text-sm font-medium text-gray-700 mb-1">
                        Moderate RFI Threshold (0.30-0.80)
                      </label>
                      <input
                        id="rfiModerate"
                        type="number"
                        min="0.30"
                        max="0.80"
                        step="0.01"
                        value={newAlert.rfiModerateThreshold}
                        onChange={(e) => setNewAlert({ ...newAlert, rfiModerateThreshold: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}

                {/* Alert Frequency */}
                <div>
                  <label htmlFor="rsiAlertFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Frequency
                  </label>
                  <select
                    id="rsiAlertFrequency"
                    value={newAlert.alertFrequency}
                    onChange={(e) => setNewAlert({ ...newAlert, alertFrequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    disabled={creating || !newAlert.alertName || newAlert.pairs.length === 0 || (newAlert.timeframes || []).length === 0 || newAlert.alertConditions.length === 0}
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
                        <span>Create RSI Alert</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing Alerts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your RSI Alerts</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No RSI alerts configured yet</p>
                <p className="text-sm">Create your first RSI alert to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{alert.alert_name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Pairs:</span> {alert.pairs.join(', ')}</p>
                          <p><span className="font-medium">Timeframes:</span> {(alert.timeframes || ['1H']).join(', ')}</p>
                          <p><span className="font-medium">RSI Period:</span> {alert.rsi_period}</p>
                          <p><span className="font-medium">Thresholds:</span> Overbought {alert.rsi_overbought_threshold}, Oversold {alert.rsi_oversold_threshold}</p>
                          <p><span className="font-medium">Conditions:</span> {alert.alert_conditions.join(', ')}</p>
                          {alert.alert_conditions.some(c => c.includes('rfi')) && (
                            <p><span className="font-medium">RFI Thresholds:</span> Strong {alert.rfi_strong_threshold}, Moderate {alert.rfi_moderate_threshold}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleAlert(alert.id, alert.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            alert.is_active 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={alert.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
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

export default RSIAlertConfig;
