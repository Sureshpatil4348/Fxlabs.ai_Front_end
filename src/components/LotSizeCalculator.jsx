import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { CORE_PAIRS, EXTENDED_PAIRS, PRECIOUS_METALS_PAIRS, CRYPTO_PAIRS, toBrokerSymbol } from '../constants/pairs';
import widgetTabRetentionService from '../services/widgetTabRetentionService';
import useRSITrackerStore from '../store/useRSITrackerStore';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

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
    <div className="h-full">
      <Card className="bg-transparent shadow-none border-0 relative">
        <CardHeader className="!px-2 !pt-3 !pb-2 relative">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center tools-heading">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Lot Size Calculator
            </CardTitle>
            
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
        </CardHeader>
        
        <CardContent className="!p-2 !pt-1">
          {/* Two Column Layout: Inputs Left, Results Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            
            {/* LEFT SIDE - Input Panel */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 shadow-lg p-3 backdrop-blur-sm">
              {/* Input Form */}
              <div className="space-y-2.5">
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
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 shadow-lg p-3 backdrop-blur-sm min-h-[400px] flex flex-col">
              {result ? (
                <div ref={resultRef} className="flex-1 flex flex-col justify-center">
                  <div className="space-y-2">
                    {/* Risk Amount Card */}
                    <div className="bg-white/90 dark:bg-gray-900/90 rounded-lg border border-red-200/50 dark:border-red-700/50 p-3 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Risk Amount</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        ${result.riskAmount.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Maximum amount you&apos;ll risk on this trade
                      </p>
                    </div>

                    {/* Position Size Card */}
                    <div className="bg-white/90 dark:bg-gray-900/90 rounded-lg border border-green-200/50 dark:border-green-700/50 p-3 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Position Size</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.lotSize.toFixed(result.instrumentType === 'crypto' ? 8 : 4)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {result.resultUnit} to trade for this position
                      </p>
                    </div>

                    {/* Calculation Formula */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200/50 dark:border-blue-700/50 p-3">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Formula Used:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                        {result.calculation}
                      </p>
                    </div>
                  </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default LotSizeCalculator;

