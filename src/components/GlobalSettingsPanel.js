import { Settings, Clock, BarChart3, TrendingUp } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import userStateService from '../services/userStateService';
import useBaseMarketStore from '../store/useBaseMarketStore';
import useMarketStore from '../store/useMarketStore';

const GlobalSettingsPanel = () => {
  const { globalSettings, rsiSettings, strengthSettings, updateGlobalSettings, updateRsiSettings, updateStrengthSettings, timeframes } = useMarketStore();
  const { updateRSIThreshold, loadTabState } = useBaseMarketStore();
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    timeframe: globalSettings.timeframe,
    rsiPeriod: rsiSettings.period,
    rsiOverbought: rsiSettings.overbought,
    rsiOversold: rsiSettings.oversold,
    strengthMode: strengthSettings.mode
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboardSettings = useCallback(async () => {
    try {
      const settings = await userStateService.getUserDashboardSettings();
      
      // Update local settings state
      const newLocalSettings = {
        timeframe: settings.global.timeframe,
        rsiPeriod: settings.rsiCorrelation.rsiPeriod,
        rsiOverbought: settings.rsiCorrelation.rsiOverbought,
        rsiOversold: settings.rsiCorrelation.rsiOversold,
        strengthMode: settings.currencyStrength.mode
      };
      
      setLocalSettings(newLocalSettings);

      // Update store settings
      updateGlobalSettings({ timeframe: settings.global.timeframe });
      updateRsiSettings({
        period: settings.rsiCorrelation.rsiPeriod,
        overbought: settings.rsiCorrelation.rsiOverbought,
        oversold: settings.rsiCorrelation.rsiOversold
      });
      updateStrengthSettings({ mode: settings.currencyStrength.mode });
      
    } catch (error) {
      console.error('❌ Failed to load dashboard settings:', error);
    }
  }, [updateGlobalSettings, updateRsiSettings, updateStrengthSettings]);

  // Load settings from database on component mount
  useEffect(() => {
    loadTabState();
    loadDashboardSettings();
  }, [loadTabState, loadDashboardSettings]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      
      // Update stores (for immediate UI response)
      updateGlobalSettings({ timeframe: localSettings.timeframe });
      updateRsiSettings({
        period: localSettings.rsiPeriod,
        overbought: localSettings.rsiOverbought,
        oversold: localSettings.rsiOversold
      });
      updateStrengthSettings({ mode: localSettings.strengthMode });


      // Persist to database
      const settingsToSave = {
        global: { timeframe: localSettings.timeframe },
        rsiCorrelation: {
          timeframe: localSettings.timeframe,
          rsiPeriod: localSettings.rsiPeriod,
          rsiOverbought: localSettings.rsiOverbought,
          rsiOversold: localSettings.rsiOversold
        },
        rsiTracker: {
          timeframe: localSettings.timeframe,
          rsiPeriod: localSettings.rsiPeriod,
          rsiOverbought: localSettings.rsiOverbought,
          rsiOversold: localSettings.rsiOversold
        },
        currencyStrength: {
          timeframe: localSettings.timeframe,
          mode: localSettings.strengthMode
        }
      };
      
      await userStateService.updateUserDashboardSettings(settingsToSave);

      // Update RSI threshold in user state (legacy support)
      await updateRSIThreshold(localSettings.rsiOverbought, localSettings.rsiOversold);
      
      setShowSettings(false);
      
    } catch (error) {
      console.error('❌ Failed to save dashboard settings:', error);
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLocalSettings({
      timeframe: globalSettings.timeframe,
      rsiPeriod: rsiSettings.period,
      rsiOverbought: rsiSettings.overbought,
      rsiOversold: rsiSettings.oversold,
      strengthMode: strengthSettings.mode
    });
  };

  return (
    <>
      {/* Global Settings Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dashboard Settings</h3>
              <p className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                Timeframe: <span className="font-medium">{globalSettings.timeframe}</span>
                <span className="mx-2">•</span>
                <BarChart3 className="w-4 h-4 inline mr-1" />
                RSI Period: <span className="font-medium">{rsiSettings.period}</span>
                <span className="mx-2">•</span>
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Strength Mode: <span className="font-medium capitalize">{strengthSettings.mode}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setShowSettings(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-90vw max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Global Dashboard Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Global Timeframe */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Global Timeframe
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  This timeframe applies to all indicators (RSI Correlation, Currency Strength)
                </p>
                <select
                  id="global-timeframe"
                  value={localSettings.timeframe}
                  onChange={(e) => setLocalSettings({...localSettings, timeframe: e.target.value})}
                  className="input-field w-full"
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              {/* RSI Settings */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-lg font-medium text-green-900 mb-3 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  RSI Indicator Settings
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="rsi-period" className="block text-sm font-medium text-green-700 mb-1">
                      Period
                    </label>
                    <input
                      id="rsi-period"
                      type="number"
                      min="5"
                      max="50"
                      value={localSettings.rsiPeriod}
                      onChange={(e) => setLocalSettings({...localSettings, rsiPeriod: parseInt(e.target.value)})}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsi-overbought" className="block text-sm font-medium text-green-700 mb-1">
                      Overbought
                    </label>
                    <input
                      id="rsi-overbought"
                      type="number"
                      min="60"
                      max="90"
                      value={localSettings.rsiOverbought}
                      onChange={(e) => setLocalSettings({...localSettings, rsiOverbought: parseInt(e.target.value)})}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsi-oversold" className="block text-sm font-medium text-green-700 mb-1">
                      Oversold
                    </label>
                    <input
                      id="rsi-oversold"
                      type="number"
                      min="10"
                      max="40"
                      value={localSettings.rsiOversold}
                      onChange={(e) => setLocalSettings({...localSettings, rsiOversold: parseInt(e.target.value)})}
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Currency Strength Settings */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-lg font-medium text-purple-900 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Currency Strength Settings
                </h4>
                <div>
                  <label htmlFor="strength-mode" className="block text-sm font-medium text-purple-700 mb-1">
                    Calculation Mode
                  </label>
                  <select
                    id="strength-mode"
                    value={localSettings.strengthMode}
                    onChange={(e) => setLocalSettings({...localSettings, strengthMode: e.target.value})}
                    className="input-field w-full"
                  >
                    <option value="closed">Closed (Last Completed Candle)</option>
                    <option value="live">Live (Real-time Updates)</option>
                  </select>
                  <p className="text-xs text-purple-600 mt-1">
                    Closed mode uses completed candles, Live mode includes current candle data
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between space-x-3 mt-8">
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Reset to Current
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSave();
                  }}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSettingsPanel;
