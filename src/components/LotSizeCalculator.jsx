import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { CORE_PAIRS, EXTENDED_PAIRS, PRECIOUS_METALS_PAIRS, CRYPTO_PAIRS, toBrokerSymbol } from '../constants/pairs';
import widgetTabRetentionService from '../services/widgetTabRetentionService';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { Button } from './ui/button';

const LotSizeCalculator = () => {
  const [formData, setFormData] = useState({
    accountBalance: '1000',
    riskPercentage: '1',
    stopLoss: '100',
    takeProfit: '200',
    instrumentType: 'forex',
    currencyPair: 'EURUSDm',
    contractSize: '100000',
    pipValue: '10',
    currentPrice: ''
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const resultRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Get real-time data from RSI tracker store
  const { 
    isConnected, 
    getLatestTickForSymbol
  } = useRSITrackerStore();

  // Instrument configurations with all available pairs
  const instrumentConfigs = useMemo(() => {
    // Helper function to format pair display name
    const formatPairDisplayName = (pair) => {
      // Format like EURUSD -> EUR/USD
      if (pair.length === 6) {
        return `${pair.slice(0, 3)}/${pair.slice(3, 6)}`;
      }
      return pair;
    };

    // Helper function to create forex pair config
    const createForexPairConfig = (pairSymbol) => {
      return {
        symbol: toBrokerSymbol(pairSymbol),
        pipValue: 10,
        contractSize: 100000,
        displayName: formatPairDisplayName(pairSymbol)
      };
    };

    // Create forex pairs from constants
    const allForexPairs = [...CORE_PAIRS, ...EXTENDED_PAIRS];
    const forexPairConfigs = allForexPairs.map(createForexPairConfig);
    
    return {
      forex: {
        name: 'Forex',
        pairs: forexPairConfigs,
        stopLossUnit: 'pips',
        resultUnit: 'lots'
      },
      commodities: {
        name: 'Commodities',
        pairs: PRECIOUS_METALS_PAIRS.map(pair => ({
          symbol: toBrokerSymbol(pair),
          pipValue: pair === 'XAUUSD' ? 100 : 50,
          contractSize: pair === 'XAUUSD' ? 100 : 5000,
          displayName: pair === 'XAUUSD' ? 'Gold (XAU/USD)' : 'Silver (XAG/USD)'
        })),
        stopLossUnit: 'price difference',
        resultUnit: 'contracts'
      },
      crypto: {
        name: 'Crypto',
        pairs: CRYPTO_PAIRS.map(pair => ({
          symbol: toBrokerSymbol(pair),
          pipValue: 1,
          contractSize: 1,
          displayName: pair === 'BTCUSD' ? 'BTC/USD' : 'ETH/USD'
        })),
        stopLossUnit: 'price difference',
        resultUnit: 'units'
      }
    };
  }, []);

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
  }, [isConnected, formData.currencyPair, getLatestTickForSymbol]);

  // Load saved widget state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedState = await widgetTabRetentionService.getWidgetState('LotSizeCalculator');
        if (savedState && Object.keys(savedState).length > 0) {
          // Only restore form inputs, not calculated results
          const { lastCalculation, ...restState } = savedState;
          setFormData(prev => ({ ...prev, ...restState }));
          
          // Restore last calculation if it exists
          if (lastCalculation) {
            setResult(lastCalculation);
          }
        }
      } catch (error) {
        console.error('Failed to load LotSizeCalculator state:', error);
      } finally {
        setIsStateLoaded(true);
      }
    };

    loadSavedState();
  }, []);

  // Debounced save function
  const debouncedSaveState = useCallback((data, calculationResult) => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      if (!isStateLoaded) return; // Don't save during initial load
      
      try {
        const stateToSave = {
          ...data,
          lastCalculation: calculationResult
        };
        await widgetTabRetentionService.saveWidgetState('LotSizeCalculator', stateToSave);
      } catch (error) {
        console.error('Failed to save LotSizeCalculator state:', error);
      }
    }, 1000);
  }, [isStateLoaded]);

  // Auto-save formData changes
  useEffect(() => {
    if (isStateLoaded) {
      debouncedSaveState(formData, result);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, result, debouncedSaveState, isStateLoaded]);

  const validateForm = useCallback(() => {
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

    if (!formData.takeProfit || parseFloat(formData.takeProfit) <= 0) {
      newErrors.takeProfit = 'Take profit must be greater than 0';
    }

    if ((formData.instrumentType === 'crypto' || formData.instrumentType === 'commodities') && (!formData.currentPrice || parseFloat(formData.currentPrice) <= 0)) {
      newErrors.currentPrice = `Current price is required for ${formData.instrumentType} calculations`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const calculateLotSize = useCallback(() => {
    if (!validateForm()) return;

    const accountBalance = parseFloat(formData.accountBalance);
    const riskPercentage = parseFloat(formData.riskPercentage) / 100;
    const stopLoss = parseFloat(formData.stopLoss);
    const takeProfit = parseFloat(formData.takeProfit);
    const pipValue = parseFloat(formData.pipValue);
    const contractSize = parseFloat(formData.contractSize);

    let lotSize = 0;
    let riskAmount = 0;
    let calculation = '';
    let riskRewardRatio = 0;

    // Calculate risk amount
    riskAmount = accountBalance * riskPercentage;

    // Calculate Risk:Reward Ratio
    riskRewardRatio = takeProfit / stopLoss;

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
      riskRewardRatio: riskRewardRatio,
      calculation: calculation,
      instrumentType: formData.instrumentType,
      resultUnit: instrumentConfigs[formData.instrumentType].resultUnit
    });

    // Scroll to result section after a brief delay to ensure DOM update
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  }, [formData, instrumentConfigs, validateForm]);

  // Auto-calculate with default values when no saved state exists
  useEffect(() => {
    if (isStateLoaded && !result) {
      // Check if we have default values (indicating no saved state was loaded)
      if (formData.accountBalance === '1000' && formData.riskPercentage === '1' && formData.stopLoss === '100' && formData.takeProfit === '200') {
        setTimeout(() => {
          calculateLotSize();
        }, 100);
      }
    }
  }, [isStateLoaded, result, formData.accountBalance, formData.riskPercentage, formData.stopLoss, formData.takeProfit, calculateLotSize]);

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
      accountBalance: '1000',
      riskPercentage: '1',
      stopLoss: '100',
      takeProfit: '200',
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
    <div className="space-y-3">
      {/* Header */}
      <div className="px-2 pt-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-start tools-heading">
            <svg className="w-5 h-5 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Lot Size Calculator
          </h3>
          
          {/* Instrument Type Selection */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-full p-0.5 border border-gray-200 dark:border-gray-700 whitespace-nowrap overflow-hidden shadow-sm">
            {Object.entries(instrumentConfigs).map(([key, config], idx) => (
              <button
                key={key}
                onClick={() => handleInputChange('instrumentType', key)}
                className={`${
                  formData.instrumentType === key
                    ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'bg-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                } px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 hover:scale-105 ${idx !== 0 ? 'ml-0.5' : ''}`}
                title={`${config.name} (${config.resultUnit})`}
              >
                {config.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Two Column Layout: Inputs Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            
            {/* LEFT SIDE - Input Panel */}
            <div className="flex flex-col pl-4">
              {/* Input Form */}
              <div className="space-y-2.5 flex-1">
            {/* Account Balance */}
            <div>
              <div className="flex items-center gap-3">
                <label htmlFor="accountBalance" className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap min-w-[120px]">
                  Account Balance
                </label>
                <div className="relative group flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                  <input
                    id="accountBalance"
                    type="number"
                    step="0.01"
                    value={formData.accountBalance}
                    onChange={(e) => handleInputChange('accountBalance', e.target.value)}
                    className={`w-full h-10 pl-8 pr-3 text-sm border rounded-lg shadow-sm placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                      errors.accountBalance ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10000"
                  />
                </div>
              </div>
              {errors.accountBalance && (
                <p className="text-red-500 text-xs mt-1 ml-[132px]">{errors.accountBalance}</p>
              )}
            </div>

            {/* Risk Percentage */}
            <div>
              <div className="flex items-center gap-3">
                <label htmlFor="riskPercentage" className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap min-w-[120px]">
                  Risk %
                </label>
                <div className="relative group flex-1">
                  <input
                    id="riskPercentage"
                    type="number"
                    step="0.1"
                    value={formData.riskPercentage}
                    onChange={(e) => handleInputChange('riskPercentage', e.target.value)}
                    className={`w-full h-10 pl-3 pr-8 text-sm border rounded-lg shadow-sm placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                      errors.riskPercentage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                </div>
              </div>
              {errors.riskPercentage && (
                <p className="text-red-500 text-xs mt-1 ml-[132px]">{errors.riskPercentage}</p>
              )}
            </div>

            {/* Currency Pair Selection */}
            <div>
              <div className="flex items-center gap-3">
                <label htmlFor="currencyPair" className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap min-w-[120px]">
                  {formData.instrumentType === 'forex' ? 'Pair' : 
                   formData.instrumentType === 'commodities' ? 'Commodity' : 'Crypto'}
                </label>
                <div className="relative group flex-1">
                  <select
                    id="currencyPair"
                    value={formData.currencyPair}
                    onChange={(e) => handleInputChange('currencyPair', e.target.value)}
                    className="w-full h-10 pl-3 pr-8 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 dark:bg-gray-700/90 dark:border-gray-600 dark:text-white appearance-none transition-all duration-200 group-hover:shadow-md"
                  >
                    {instrumentConfigs[formData.instrumentType].pairs.map((pair) => (
                      <option key={pair.symbol} value={pair.symbol}>
                        {pair.displayName || pair.symbol}
                      </option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stop Loss */}
            <div>
              <div className="flex items-center gap-3">
                <label htmlFor="stopLoss" className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap min-w-[120px]">
                  Stop Loss
                </label>
                <div className="relative group flex-1">
                  <input
                    id="stopLoss"
                    type="number"
                    step="0.01"
                    value={formData.stopLoss}
                    onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                    className={`w-full h-10 pl-3 pr-16 text-sm border rounded-lg shadow-sm placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                      errors.stopLoss ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={formData.instrumentType === 'forex' ? '50' : '100'}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{instrumentConfigs[formData.instrumentType].stopLossUnit}</span>
                </div>
              </div>
              {errors.stopLoss && (
                <p className="text-red-500 text-xs mt-1 ml-[132px]">{errors.stopLoss}</p>
              )}
            </div>

            {/* Take Profit */}
            <div>
              <div className="flex items-center gap-3">
                <label htmlFor="takeProfit" className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap min-w-[120px]">
                  Take Profit
                </label>
                <div className="relative group flex-1">
                  <input
                    id="takeProfit"
                    type="number"
                    step="0.01"
                    value={formData.takeProfit}
                    onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                    className={`w-full h-10 pl-3 pr-16 text-sm border rounded-lg shadow-sm placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                      errors.takeProfit ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={formData.instrumentType === 'forex' ? '100' : '200'}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{instrumentConfigs[formData.instrumentType].stopLossUnit}</span>
                </div>
              </div>
              {errors.takeProfit && (
                <p className="text-red-500 text-xs mt-1 ml-[132px]">{errors.takeProfit}</p>
              )}
            </div>

            {/* Current Price (for crypto and commodities) */}
            {(formData.instrumentType === 'crypto' || formData.instrumentType === 'commodities') && (
              <div>
                <div className="flex items-center gap-3">
                  <label htmlFor="currentPrice" className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap min-w-[120px] flex items-center gap-1">
                    Current Price
                    {isConnected && formData.currentPrice && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Live
                      </span>
                    )}
                  </label>
                  <div className="relative group flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      id="currentPrice"
                      type="number"
                      step="0.01"
                      value={formData.currentPrice}
                      onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                      className={`w-full h-10 pl-8 pr-10 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                        errors.currentPrice ? 'border-red-500' : 'border-gray-300'
                      } ${isConnected && formData.currentPrice ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                      placeholder={isConnected ? "Auto-populated" : "50000"}
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
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                        title="Refresh current price"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {errors.currentPrice && (
                  <p className="text-red-500 text-xs mt-1 ml-[132px]">{errors.currentPrice}</p>
                )}
                {isConnected && formData.currentPrice && !errors.currentPrice && (
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1 ml-[132px]">
                    Live price from market data
                  </p>
                )}
              </div>
            )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={calculateLotSize}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 hover:from-emerald-600 hover:via-emerald-500 hover:to-green-700 text-white font-semibold h-11 px-4 rounded-lg transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculate
                </Button>
                <Button
                  onClick={resetCalculator}
                  variant="outline"
                  className="px-6 h-11 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </Button>
              </div>
            </div>

            {/* RIGHT SIDE - Result Display */}
            <div className="flex flex-col pl-4">
              {result ? (
                <div ref={resultRef} className="space-y-2">
                    {/* Risk Amount Card */}
                    <div className="p-3">
                      <div className="mb-2">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Risk Amount</span>
                      </div>
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        ${result.riskAmount.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Maximum amount you&apos;ll risk on this trade
                      </p>
                    </div>

                    {/* Position Size Card */}
                    <div className="p-3">
                      <div className="mb-2">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Position Size</span>
                      </div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {result.lotSize.toFixed(result.instrumentType === 'crypto' ? 8 : 4)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {result.resultUnit} to trade for this position
                      </p>
                    </div>

                    {/* Risk:Reward Ratio Card */}
                    {result.riskRewardRatio !== undefined && (
                      <div className="p-3">
                        <div className="mb-2">
                          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Risk:Reward Ratio</span>
                        </div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          1:{result.riskRewardRatio.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Expected reward per unit of risk
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    No Calculation Yet
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    Enter your trading parameters on the left and click &quot;Calculate&quot; to see your optimal position size and risk amount.
                  </p>
                </div>
              )}
            </div>
          </div>
    </div>
  );
};

export default LotSizeCalculator;

