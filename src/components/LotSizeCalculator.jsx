import React, { useState, useEffect, useMemo } from 'react';

import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import useRSITrackerStore from '../store/useRSITrackerStore';

const LotSizeCalculator = () => {
  const [formData, setFormData] = useState({
    accountBalance: '',
    riskPercentage: '',
    stopLoss: '',
    instrumentType: 'forex',
    currencyPair: 'EURUSDm',
    contractSize: '100000',
    pipValue: '10',
    currentPrice: ''
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Get real-time data from RSI tracker store
  const { 
    isConnected, 
    getAllPairsWithRFI, 
    getLatestTickForSymbol
  } = useRSITrackerStore();

  // Get real-time pairs from RSI tracker store
  const realTimePairs = useMemo(() => {
    if (!isConnected) return [];
    return getAllPairsWithRFI();
  }, [isConnected, getAllPairsWithRFI]);

  // Instrument configurations with real-time data
  const instrumentConfigs = useMemo(() => {
    // Get available symbols from real-time data
    const availableSymbols = realTimePairs.map(pair => pair.symbol);
    
    return {
      forex: {
        name: 'Forex',
        pairs: [
          { symbol: 'EURUSDm', pipValue: 10, contractSize: 100000, displayName: 'EUR/USD' },
          { symbol: 'GBPUSDm', pipValue: 10, contractSize: 100000, displayName: 'GBP/USD' },
          { symbol: 'USDJPYm', pipValue: 10, contractSize: 100000, displayName: 'USD/JPY' },
          { symbol: 'USDCHFm', pipValue: 10, contractSize: 100000, displayName: 'USD/CHF' },
          { symbol: 'AUDUSDm', pipValue: 10, contractSize: 100000, displayName: 'AUD/USD' },
          { symbol: 'USDCADm', pipValue: 10, contractSize: 100000, displayName: 'USD/CAD' },
          { symbol: 'NZDUSDm', pipValue: 10, contractSize: 100000, displayName: 'NZD/USD' },
          { symbol: 'EURGBPm', pipValue: 10, contractSize: 100000, displayName: 'EUR/GBP' },
          { symbol: 'EURJPYm', pipValue: 10, contractSize: 100000, displayName: 'EUR/JPY' },
          { symbol: 'EURCHFm', pipValue: 10, contractSize: 100000, displayName: 'EUR/CHF' },
          { symbol: 'EURAUDm', pipValue: 10, contractSize: 100000, displayName: 'EUR/AUD' },
          { symbol: 'EURCADm', pipValue: 10, contractSize: 100000, displayName: 'EUR/CAD' },
          { symbol: 'EURNZDm', pipValue: 10, contractSize: 100000, displayName: 'EUR/NZD' },
          { symbol: 'GBPJPYm', pipValue: 10, contractSize: 100000, displayName: 'GBP/JPY' },
          { symbol: 'GBPCHFm', pipValue: 10, contractSize: 100000, displayName: 'GBP/CHF' },
          { symbol: 'GBPAUDm', pipValue: 10, contractSize: 100000, displayName: 'GBP/AUD' },
          { symbol: 'GBPCADm', pipValue: 10, contractSize: 100000, displayName: 'GBP/CAD' },
          { symbol: 'GBPNZDm', pipValue: 10, contractSize: 100000, displayName: 'GBP/NZD' },
          { symbol: 'AUDJPYm', pipValue: 10, contractSize: 100000, displayName: 'AUD/JPY' },
          { symbol: 'AUDCHFm', pipValue: 10, contractSize: 100000, displayName: 'AUD/CHF' },
          { symbol: 'AUDCADm', pipValue: 10, contractSize: 100000, displayName: 'AUD/CAD' },
          { symbol: 'AUDNZDm', pipValue: 10, contractSize: 100000, displayName: 'AUD/NZD' },
          { symbol: 'CADJPYm', pipValue: 10, contractSize: 100000, displayName: 'CAD/JPY' },
          { symbol: 'CADCHFm', pipValue: 10, contractSize: 100000, displayName: 'CAD/CHF' },
          { symbol: 'CHFJPYm', pipValue: 10, contractSize: 100000, displayName: 'CHF/JPY' },
          { symbol: 'NZDJPYm', pipValue: 10, contractSize: 100000, displayName: 'NZD/JPY' },
          { symbol: 'NZDCHFm', pipValue: 10, contractSize: 100000, displayName: 'NZD/CHF' },
          { symbol: 'NZDCADm', pipValue: 10, contractSize: 100000, displayName: 'NZD/CAD' }
        ].filter(pair => availableSymbols.includes(pair.symbol)),
        stopLossUnit: 'pips',
        resultUnit: 'lots'
      },
      commodities: {
        name: 'Commodities',
        pairs: [
          { symbol: 'XAUUSDm', pipValue: 100, contractSize: 100, displayName: 'Gold (XAU/USD)' },
          { symbol: 'XAGUSDm', pipValue: 50, contractSize: 5000, displayName: 'Silver (XAG/USD)' }
        ].filter(pair => availableSymbols.includes(pair.symbol)),
        stopLossUnit: 'price difference',
        resultUnit: 'contracts'
      },
      crypto: {
        name: 'Crypto',
        pairs: [
          { symbol: 'BTCUSDm', pipValue: 1, contractSize: 1, displayName: 'BTC/USD' },
          { symbol: 'ETHUSDm', pipValue: 1, contractSize: 1, displayName: 'ETH/USD' }
        ].filter(pair => availableSymbols.includes(pair.symbol)),
        stopLossUnit: 'price difference',
        resultUnit: 'units'
      }
    };
  }, [realTimePairs]);

  // Update pip value, contract size, and current price when currency pair changes
  useEffect(() => {
    const config = instrumentConfigs[formData.instrumentType];
    const selectedPair = config.pairs.find(pair => pair.symbol === formData.currencyPair);
    if (selectedPair) {
      // Get real-time price for the selected pair
      const latestTick = getLatestTickForSymbol(formData.currencyPair);
      const currentPrice = latestTick?.bid || 0;
      
      setFormData(prev => ({
        ...prev,
        pipValue: selectedPair.pipValue.toString(),
        contractSize: selectedPair.contractSize.toString(),
        currentPrice: currentPrice > 0 ? currentPrice.toFixed(5) : ''
      }));
    }
  }, [formData.currencyPair, formData.instrumentType, instrumentConfigs, getLatestTickForSymbol]);

  // Auto-update current price when real-time data changes
  useEffect(() => {
    if (isConnected && formData.currencyPair) {
      const latestTick = getLatestTickForSymbol(formData.currencyPair);
      const currentPrice = latestTick?.bid || 0;
      
      if (currentPrice > 0) {
        setFormData(prev => ({
          ...prev,
          currentPrice: currentPrice.toFixed(5)
        }));
      }
    }
  }, [isConnected, formData.currencyPair, getLatestTickForSymbol, realTimePairs]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountBalance || parseFloat(formData.accountBalance) <= 0) {
      newErrors.accountBalance = 'Account balance must be greater than 0';
    }

    if (!formData.riskPercentage || parseFloat(formData.riskPercentage) <= 0 || parseFloat(formData.riskPercentage) > 100) {
      newErrors.riskPercentage = 'Risk percentage must be between 0.1% and 100%';
    }

    if (!formData.stopLoss || parseFloat(formData.stopLoss) <= 0) {
      newErrors.stopLoss = 'Stop loss must be greater than 0';
    }

    if ((formData.instrumentType === 'crypto' || formData.instrumentType === 'commodities') && (!formData.currentPrice || parseFloat(formData.currentPrice) <= 0)) {
      newErrors.currentPrice = `Current price is required for ${formData.instrumentType} calculations`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLotSize = () => {
    if (!validateForm()) return;

    const accountBalance = parseFloat(formData.accountBalance);
    const riskPercentage = parseFloat(formData.riskPercentage) / 100;
    const stopLoss = parseFloat(formData.stopLoss);
    const pipValue = parseFloat(formData.pipValue);
    const contractSize = parseFloat(formData.contractSize);

    let lotSize = 0;
    let riskAmount = 0;
    let calculation = '';

    // Calculate risk amount
    riskAmount = accountBalance * riskPercentage;

    if (formData.instrumentType === 'forex') {
      // Forex calculation: Lot Size = (Account Balance × Risk %) / (Stop Loss (pips) × Pip Value)
      lotSize = riskAmount / (stopLoss * pipValue);
      calculation = `(${accountBalance.toFixed(2)} × ${(riskPercentage * 100).toFixed(1)}%) / (${stopLoss} pips × $${pipValue}) = ${lotSize.toFixed(4)} lots`;
    } else if (formData.instrumentType === 'commodities') {
      // Commodities calculation: Lot Size = (Account Balance × Risk %) / (Stop Loss (price difference) × Contract Size)
      lotSize = riskAmount / (stopLoss * contractSize);
      calculation = `(${accountBalance.toFixed(2)} × ${(riskPercentage * 100).toFixed(1)}%) / (${stopLoss} × ${contractSize}) = ${lotSize.toFixed(4)} contracts`;
    } else if (formData.instrumentType === 'crypto') {
      // Crypto calculation: Position Size = (Account Balance × Risk %) / Stop Loss (price difference)
      lotSize = riskAmount / stopLoss;
      const currentPrice = parseFloat(formData.currentPrice) || 0;
      const baseCurrency = formData.currencyPair.replace('USDm', '').replace('USD', '');
      calculation = `(${accountBalance.toFixed(2)} × ${(riskPercentage * 100).toFixed(1)}%) / ${stopLoss} = ${lotSize.toFixed(8)} ${baseCurrency}`;
      if (currentPrice > 0) {
        calculation += ` (at $${currentPrice.toFixed(2)})`;
      }
    }

    setResult({
      lotSize: lotSize,
      riskAmount: riskAmount,
      calculation: calculation,
      instrumentType: formData.instrumentType,
      resultUnit: instrumentConfigs[formData.instrumentType].resultUnit
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const resetCalculator = () => {
    setFormData({
      accountBalance: '',
      riskPercentage: '',
      stopLoss: '',
      instrumentType: 'forex',
      currencyPair: 'EURUSDm',
      contractSize: '100000',
      pipValue: '10',
      currentPrice: ''
    });
    setResult(null);
    setErrors({});
  };

  return (
    <div className=" h-full">
      <Card className="bg-transparent shadow-none border-none">
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Lot Size Calculator
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
            Calculate optimal position size based on account balance, risk tolerance, and stop-loss level
          </CardDescription>
          {/* Live Status in top right corner */}
          <div className="absolute top-2 right-2">
            {isConnected ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                Live
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></span>
                Offline
              </span>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Instrument Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(instrumentConfigs).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleInputChange('instrumentType', key)}
                className={`relative p-2 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  formData.instrumentType === key
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{config.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
                    {config.resultUnit}
                  </p>
                </div>
                {formData.instrumentType === key && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Account Balance */}
            <div>
              <label htmlFor="accountBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Balance ($)
              </label>
              <input
                id="accountBalance"
                type="number"
                step="0.01"
                value={formData.accountBalance}
                onChange={(e) => handleInputChange('accountBalance', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.accountBalance ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10000"
              />
              {errors.accountBalance && (
                <p className="text-red-500 text-sm mt-1">{errors.accountBalance}</p>
              )}
            </div>

            {/* Risk Percentage */}
            <div>
              <label htmlFor="riskPercentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Risk Percentage (%)
              </label>
              <input
                id="riskPercentage"
                type="number"
                step="0.1"
                value={formData.riskPercentage}
                onChange={(e) => handleInputChange('riskPercentage', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.riskPercentage ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="2"
              />
              {errors.riskPercentage && (
                <p className="text-red-500 text-sm mt-1">{errors.riskPercentage}</p>
              )}
            </div>

            {/* Currency Pair Selection */}
            <div>
              <label htmlFor="currencyPair" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {formData.instrumentType === 'forex' ? 'Currency Pair' : 
                 formData.instrumentType === 'commodities' ? 'Commodity' : 'Cryptocurrency'}
              </label>
              <select
                id="currencyPair"
                value={formData.currencyPair}
                onChange={(e) => handleInputChange('currencyPair', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={!isConnected}
              >
                {instrumentConfigs[formData.instrumentType].pairs.length > 0 ? (
                  instrumentConfigs[formData.instrumentType].pairs.map((pair) => (
                    <option key={pair.symbol} value={pair.symbol}>
                      {pair.displayName || pair.symbol}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {isConnected ? 'No pairs available' : 'Connecting to market data...'}
                  </option>
                )}
              </select>
              {!isConnected && (
                <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                  ⚠️ Connect to market data to see live prices
                </p>
              )}
            </div>

            {/* Stop Loss */}
            <div>
              <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stop Loss ({instrumentConfigs[formData.instrumentType].stopLossUnit})
              </label>
              <input
                id="stopLoss"
                type="number"
                step="0.01"
                value={formData.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.stopLoss ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.instrumentType === 'forex' ? '50' : '100'}
              />
              {errors.stopLoss && (
                <p className="text-red-500 text-sm mt-1">{errors.stopLoss}</p>
              )}
            </div>

            {/* Current Price (for crypto and commodities) */}
            {(formData.instrumentType === 'crypto' || formData.instrumentType === 'commodities') && (
              <div className="md:col-span-2">
                <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Price ($)
                  {isConnected && formData.currentPrice && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      Auto
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    value={formData.currentPrice}
                    onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.currentPrice ? 'border-red-500' : 'border-gray-300'
                    } ${isConnected && formData.currentPrice ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                    placeholder={isConnected ? "Auto-populated from live data" : "50000"}
                    readOnly={isConnected && formData.currentPrice}
                  />
                  {isConnected && formData.currentPrice && (
                    <button
                      type="button"
                      onClick={() => {
                        const latestTick = getLatestTickForSymbol(formData.currencyPair);
                        const currentPrice = latestTick?.bid || 0;
                        if (currentPrice > 0) {
                          handleInputChange('currentPrice', currentPrice.toFixed(5));
                        }
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Refresh current price"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
                {errors.currentPrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentPrice}</p>
                )}
                {isConnected && formData.currentPrice && (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    ✓ Live price from market data
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={calculateLotSize}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Calculate Lot Size
            </Button>
            <Button
              onClick={resetCalculator}
              variant="outline"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Reset
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Results
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Risk Amount:</span>
                    <span className="font-semibold text-red-600">${result.riskAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Position Size:</span>
                    <span className="font-semibold text-green-600">
                      {result.lotSize.toFixed(result.instrumentType === 'crypto' ? 8 : 4)} {result.resultUnit}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Calculation:</strong>
                    <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded border font-mono text-xs">
                      {result.calculation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Management Tips */}
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1 text-sm">💡 Risk Tips:</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-0.5">
                  <li>• Risk 2-3% max per trade</li>
                  <li>• Always use stop-loss orders</li>
                  <li>• Consider market volatility</li>
                </ul>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default LotSizeCalculator;

