import { BarChart3, Plus, X, Check, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import rsiCorrelationAlertService from '../services/rsiCorrelationAlertService';

const RSICorrelationAlertConfig = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState(() => {
    const defaultConfig = rsiCorrelationAlertService.getDefaultAlertConfig();
    // Ensure arrays are always defined
    return {
      ...defaultConfig,
      timeframes: defaultConfig.timeframes || ['1H'],
      correlationPairs: defaultConfig.correlationPairs || [['EURUSD', 'GBPUSD']],
      alertConditions: defaultConfig.alertConditions || ['positive_mismatch', 'negative_mismatch']
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
      const userAlerts = await rsiCorrelationAlertService.getAlerts();
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
      await rsiCorrelationAlertService.createAlert(newAlert);
      const defaultConfig = rsiCorrelationAlertService.getDefaultAlertConfig();
      setNewAlert({
        ...defaultConfig,
        timeframes: defaultConfig.timeframes || ['1H'],
        correlationPairs: defaultConfig.correlationPairs || [['EURUSD', 'GBPUSD']],
        alertConditions: defaultConfig.alertConditions || ['positive_mismatch', 'negative_mismatch']
      });
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
        await rsiCorrelationAlertService.deleteAlert(alertId);
        await loadAlerts(); // Reload alerts
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getAlertOptions = () => rsiCorrelationAlertService.getAlertOptions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">RSI Correlation Alerts</h2>
              <p className="text-sm text-gray-500">Configure RSI correlation and real correlation alerts</p>
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
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Create New RSI Correlation Alert</span>
              </button>
            </div>
          )}

          {/* Create Alert Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New RSI Correlation Alert</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    const defaultConfig = rsiCorrelationAlertService.getDefaultAlertConfig();
                    setNewAlert({
                      ...defaultConfig,
                      timeframes: defaultConfig.timeframes || ['1H'],
                      correlationPairs: defaultConfig.correlationPairs || [['EURUSD', 'GBPUSD']],
                      alertConditions: defaultConfig.alertConditions || ['positive_mismatch', 'negative_mismatch']
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
                  <label htmlFor="correlationAlertName" className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Name
                  </label>
                  <input
                    id="correlationAlertName"
                    type="text"
                    value={newAlert.alertName}
                    onChange={(e) => setNewAlert({ ...newAlert, alertName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter alert name"
                  />
                </div>

                {/* Calculation Mode */}
                <div>
                  <label htmlFor="calculationMode" className="block text-sm font-medium text-gray-700 mb-1">
                    Calculation Mode
                  </label>
                  <select
                    id="calculationMode"
                    value={newAlert.calculationMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setNewAlert({ 
                        ...newAlert, 
                        calculationMode: mode,
                        // Reset alert conditions when mode changes
                        alertConditions: mode === 'rsi_threshold' 
                          ? ['positive_mismatch', 'negative_mismatch']
                          : ['strong_positive', 'strong_negative']
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {getAlertOptions().calculationModes.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label} - {mode.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Correlation Pairs */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Correlation Pairs (1-5 pairs)
                    </legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {getAlertOptions().correlationPairs.map((pairOption, index) => {
                        const isSelected = (newAlert.correlationPairs || []).some(pair => 
                          pair[0] === pairOption.pair[0] && pair[1] === pairOption.pair[1]
                        );
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              const currentPairs = newAlert.correlationPairs || [];
                              const pairs = isSelected
                                ? currentPairs.filter(pair => 
                                    !(pair[0] === pairOption.pair[0] && pair[1] === pairOption.pair[1])
                                  )
                                : currentPairs.length < 5 
                                  ? [...currentPairs, pairOption.pair] 
                                  : currentPairs;
                              setNewAlert({ ...newAlert, correlationPairs: pairs });
                            }}
                            className={`p-2 rounded-lg text-sm font-medium transition-all text-left ${
                              isSelected
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <div className="font-semibold">{pairOption.description}</div>
                            <div className="text-xs opacity-75">
                              {pairOption.type === 'positive' ? 'Positive' : 'Negative'} Correlation
                            </div>
                          </button>
                        );
                      })}
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
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* RSI Settings (for RSI Threshold mode) */}
                {newAlert.calculationMode === 'rsi_threshold' && (
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Correlation Settings (for Real Correlation mode) */}
                {newAlert.calculationMode === 'real_correlation' && (
                  <div>
                    <label htmlFor="correlationWindow" className="block text-sm font-medium text-gray-700 mb-1">
                      Correlation Window
                    </label>
                    <select
                      id="correlationWindow"
                      value={newAlert.correlationWindow}
                      onChange={(e) => setNewAlert({ ...newAlert, correlationWindow: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {getAlertOptions().correlationWindows.map(window => (
                        <option key={window.value} value={window.value}>
                          {window.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Alert Conditions */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Alert Conditions (1-6 conditions)
                    </legend>
                    <div className="grid grid-cols-1 gap-2">
                      {(newAlert.calculationMode === 'rsi_threshold' 
                        ? getAlertOptions().rsiThresholdConditions 
                        : getAlertOptions().realCorrelationConditions
                      ).map(condition => (
                        <button
                          key={condition.value}
                          onClick={() => {
                            const currentConditions = newAlert.alertConditions || [];
                            const conditions = currentConditions.includes(condition.value)
                              ? currentConditions.filter(c => c !== condition.value)
                              : currentConditions.length < 6 ? [...currentConditions, condition.value] : currentConditions;
                            setNewAlert({ ...newAlert, alertConditions: conditions });
                          }}
                          className={`p-3 rounded-lg text-sm font-medium transition-all text-left ${
                            (newAlert.alertConditions || []).includes(condition.value)
                              ? 'bg-purple-500 text-white'
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

                {/* Correlation Thresholds (only show if Real Correlation mode and relevant conditions are selected) */}
                {newAlert.calculationMode === 'real_correlation' && 
                 (newAlert.alertConditions || []).some(c => ['strong_positive', 'strong_negative', 'weak_correlation'].includes(c)) && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="strongCorrelation" className="block text-sm font-medium text-gray-700 mb-1">
                        Strong Threshold (0.50-1.00)
                      </label>
                      <input
                        id="strongCorrelation"
                        type="number"
                        min="0.50"
                        max="1.00"
                        step="0.01"
                        value={newAlert.strongCorrelationThreshold}
                        onChange={(e) => setNewAlert({ ...newAlert, strongCorrelationThreshold: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="moderateCorrelation" className="block text-sm font-medium text-gray-700 mb-1">
                        Moderate Threshold (0.20-0.80)
                      </label>
                      <input
                        id="moderateCorrelation"
                        type="number"
                        min="0.20"
                        max="0.80"
                        step="0.01"
                        value={newAlert.moderateCorrelationThreshold}
                        onChange={(e) => setNewAlert({ ...newAlert, moderateCorrelationThreshold: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="weakCorrelation" className="block text-sm font-medium text-gray-700 mb-1">
                        Weak Threshold (0.05-0.50)
                      </label>
                      <input
                        id="weakCorrelation"
                        type="number"
                        min="0.05"
                        max="0.50"
                        step="0.01"
                        value={newAlert.weakCorrelationThreshold}
                        onChange={(e) => setNewAlert({ ...newAlert, weakCorrelationThreshold: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Alert Frequency */}
                <div>
                  <label htmlFor="correlationAlertFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Frequency
                  </label>
                  <select
                    id="correlationAlertFrequency"
                    value={newAlert.alertFrequency}
                    onChange={(e) => setNewAlert({ ...newAlert, alertFrequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    disabled={creating || !newAlert.alertName || (newAlert.correlationPairs || []).length === 0 || (newAlert.timeframes || []).length === 0 || (newAlert.alertConditions || []).length === 0}
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
                        <span>Create RSI Correlation Alert</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing Alerts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your RSI Correlation Alerts</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No RSI correlation alerts configured yet</p>
                <p className="text-sm">Create your first RSI correlation alert to get started</p>
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.calculationMode === 'rsi_threshold'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {alert.calculationMode === 'rsi_threshold' ? 'RSI Threshold' : 'Real Correlation'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Pairs:</span> {alert.correlationPairs?.map(pair => `${pair[0]}-${pair[1]}`).join(', ') || 'N/A'}</p>
                          <p><span className="font-medium">Timeframes:</span> {alert.timeframes?.join(', ') || 'N/A'}</p>
                          {alert.calculationMode === 'rsi_threshold' ? (
                            <>
                              <p><span className="font-medium">RSI Period:</span> {alert.rsiPeriod || 'N/A'}</p>
                              <p><span className="font-medium">Thresholds:</span> Overbought {alert.rsiOverboughtThreshold || 'N/A'}, Oversold {alert.rsiOversoldThreshold || 'N/A'}</p>
                            </>
                          ) : (
                            <p><span className="font-medium">Correlation Window:</span> {alert.correlationWindow || 'N/A'} periods</p>
                          )}
                          <p><span className="font-medium">Conditions:</span> {alert.alertConditions?.join(', ') || 'N/A'}</p>
                          {alert.calculationMode === 'real_correlation' && alert.alertConditions?.some(c => ['strong_positive', 'strong_negative', 'weak_correlation'].includes(c)) && (
                            <p><span className="font-medium">Correlation Thresholds:</span> Strong {alert.strongCorrelationThreshold || 'N/A'}, Moderate {alert.moderateCorrelationThreshold || 'N/A'}, Weak {alert.weakCorrelationThreshold || 'N/A'}</p>
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

export default RSICorrelationAlertConfig;
