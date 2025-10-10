import React, {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
} from "react";

import {
    CRYPTO_PAIRS,
    PRECIOUS_METALS_PAIRS,
    CORE_PAIRS,
    EXTENDED_PAIRS,
} from "../constants/pairs";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import widgetTabRetentionService from "../services/widgetTabRetentionService";
import useRSITrackerStore from "../store/useRSITrackerStore";

const LotSizeCalculator = () => {
    const [formData, setFormData] = useState({
        accountBalance: "",
        riskPercentage: "",
        stopLoss: "",
        instrumentType: "forex",
        currencyPair: "EURUSDm",
        contractSize: "100000",
        pipValue: "10",
        currentPrice: "",
    });

    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState({});
    const [isStateLoaded, setIsStateLoaded] = useState(false);
    const resultRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    // Get real-time data from RSI tracker store
    const { isConnected, getAllPairsWithRFI, getLatestTickForSymbol } =
        useRSITrackerStore();

    // Get real-time pairs from RSI tracker store
    const realTimePairs = useMemo(() => {
        if (!isConnected) return [];
        return getAllPairsWithRFI();
    }, [isConnected, getAllPairsWithRFI]);

    // Instrument configurations with real-time data and fallbacks
    const instrumentConfigs = useMemo(() => {
        // Get available symbols from real-time data
        const availableSymbols = realTimePairs.map((pair) => pair.symbol);

        // Helper function to get pairs with fallbacks
        const getPairsWithFallback = (
            pairs,
            fallbackPairs,
            fallbackDisplayNames = {}
        ) => {
            const filteredPairs = pairs.filter((pair) =>
                availableSymbols.includes(pair.symbol)
            );
            if (filteredPairs.length > 0) {
                return filteredPairs;
            }
            // Fallback to static pairs when no real-time data available
            return fallbackPairs.map((symbol) => ({
                symbol: symbol + "m", // Add broker suffix
                pipValue:
                    pairs.find((p) => p.symbol === symbol + "m")?.pipValue ||
                    10,
                contractSize:
                    pairs.find((p) => p.symbol === symbol + "m")
                        ?.contractSize || 100000,
                displayName: fallbackDisplayNames[symbol] || symbol,
            }));
        };

        return {
            forex: {
                name: "Forex",
                pairs: getPairsWithFallback(
                    [
                        {
                            symbol: "EURUSDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "EUR/USD",
                        },
                        {
                            symbol: "GBPUSDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "GBP/USD",
                        },
                        {
                            symbol: "USDJPYm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "USD/JPY",
                        },
                        {
                            symbol: "USDCHFm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "USD/CHF",
                        },
                        {
                            symbol: "AUDUSDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "AUD/USD",
                        },
                        {
                            symbol: "USDCADm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "USD/CAD",
                        },
                        {
                            symbol: "NZDUSDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "NZD/USD",
                        },
                        {
                            symbol: "EURGBPm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "EUR/GBP",
                        },
                        {
                            symbol: "EURJPYm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "EUR/JPY",
                        },
                        {
                            symbol: "EURCHFm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "EUR/CHF",
                        },
                        {
                            symbol: "EURAUDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "EUR/AUD",
                        },
                        {
                            symbol: "EURCADm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "EUR/CAD",
                        },
                        {
                            symbol: "EURNZDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "EUR/NZD",
                        },
                        {
                            symbol: "GBPJPYm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "GBP/JPY",
                        },
                        {
                            symbol: "GBPCHFm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "GBP/CHF",
                        },
                        {
                            symbol: "GBPAUDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "GBP/AUD",
                        },
                        {
                            symbol: "GBPCADm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "GBP/CAD",
                        },
                        {
                            symbol: "GBPNZDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "GBP/NZD",
                        },
                        {
                            symbol: "AUDJPYm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "AUD/JPY",
                        },
                        {
                            symbol: "AUDCHFm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "AUD/CHF",
                        },
                        {
                            symbol: "AUDCADm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "AUD/CAD",
                        },
                        {
                            symbol: "AUDNZDm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "AUD/NZD",
                        },
                        {
                            symbol: "CADJPYm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "CAD/JPY",
                        },
                        {
                            symbol: "CADCHFm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "CAD/CHF",
                        },
                        {
                            symbol: "CHFJPYm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "CHF/JPY",
                        },
                        {
                            symbol: "NZDJPYm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "NZD/JPY",
                        },
                        {
                            symbol: "NZDCHFm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "NZD/CHF",
                        },
                        {
                            symbol: "NZDCADm",
                            pipValue: 10,
                            contractSize: 100000,
                            displayName: "NZD/CAD",
                        },
                    ],
                    [...CORE_PAIRS, ...EXTENDED_PAIRS],
                    {
                        EURUSD: "EUR/USD",
                        GBPUSD: "GBP/USD",
                        USDJPY: "USD/JPY",
                        USDCHF: "USD/CHF",
                        AUDUSD: "AUD/USD",
                        USDCAD: "USD/CAD",
                        NZDUSD: "NZD/USD",
                        EURGBP: "EUR/GBP",
                        EURJPY: "EUR/JPY",
                        EURCHF: "EUR/CHF",
                        EURAUD: "EUR/AUD",
                        EURCAD: "EUR/CAD",
                        EURNZD: "EUR/NZD",
                        GBPJPY: "GBP/JPY",
                        GBPCHF: "GBP/CHF",
                        GBPAUD: "GBP/AUD",
                        GBPCAD: "GBP/CAD",
                        GBPNZD: "GBP/NZD",
                        AUDJPY: "AUD/JPY",
                        AUDCHF: "AUD/CHF",
                        AUDCAD: "AUD/CAD",
                        AUDNZD: "AUD/NZD",
                        CADJPY: "CAD/JPY",
                        CADCHF: "CAD/CHF",
                        CHFJPY: "CHF/JPY",
                        NZDJPY: "NZD/JPY",
                        NZDCHF: "NZD/CHF",
                        NZDCAD: "NZD/CAD",
                    }
                ),
                stopLossUnit: "pips",
                resultUnit: "lots",
            },
            commodities: {
                name: "Commodities",
                pairs: getPairsWithFallback(
                    [
                        {
                            symbol: "XAUUSDm",
                            pipValue: 100,
                            contractSize: 100,
                            displayName: "Gold (XAU/USD)",
                        },
                        {
                            symbol: "XAGUSDm",
                            pipValue: 50,
                            contractSize: 5000,
                            displayName: "Silver (XAG/USD)",
                        },
                    ],
                    PRECIOUS_METALS_PAIRS,
                    {
                        XAUUSD: "Gold (XAU/USD)",
                        XAGUSD: "Silver (XAG/USD)",
                    }
                ),
                stopLossUnit: "price difference",
                resultUnit: "contracts",
            },
            crypto: {
                name: "Crypto",
                pairs: getPairsWithFallback(
                    [
                        {
                            symbol: "BTCUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "BTC/USD",
                        },
                        {
                            symbol: "ETHUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "ETH/USD",
                        },
                        {
                            symbol: "BNBUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "BNB/USD",
                        },
                        {
                            symbol: "ADAUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "ADA/USD",
                        },
                        {
                            symbol: "SOLUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "SOL/USD",
                        },
                        {
                            symbol: "DOTUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "DOT/USD",
                        },
                        {
                            symbol: "DOGEUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "DOGE/USD",
                        },
                        {
                            symbol: "AVAXUSDm",
                            pipValue: 1,
                            contractSize: 1,
                            displayName: "AVAX/USD",
                        },
                    ],
                    [
                        ...CRYPTO_PAIRS,
                        "BNBUSD",
                        "ADAUSD",
                        "SOLUSD",
                        "DOTUSD",
                        "DOGEUSD",
                        "AVAXUSD",
                    ],
                    {
                        BTCUSD: "BTC/USD",
                        ETHUSD: "ETH/USD",
                        BNBUSD: "BNB/USD",
                        ADAUSD: "ADA/USD",
                        SOLUSD: "SOL/USD",
                        DOTUSD: "DOT/USD",
                        DOGEUSD: "DOGE/USD",
                        AVAXUSD: "AVAX/USD",
                    }
                ),
                stopLossUnit: "price difference",
                resultUnit: "units",
            },
        };
    }, [realTimePairs]);

    // Update pip value, contract size, and current price when currency pair changes
    useEffect(() => {
        const config = instrumentConfigs[formData.instrumentType];
        const selectedPair = config.pairs.find(
            (pair) => pair.symbol === formData.currencyPair
        );
        if (selectedPair) {
            // Get real-time price for the selected pair
            const latestTick = getLatestTickForSymbol(formData.currencyPair);
            const currentPrice = latestTick?.bid || 0;

            setFormData((prev) => ({
                ...prev,
                pipValue: selectedPair.pipValue.toString(),
                contractSize: selectedPair.contractSize.toString(),
                currentPrice: currentPrice > 0 ? currentPrice.toFixed(5) : "",
            }));
        }
    }, [
        formData.currencyPair,
        formData.instrumentType,
        instrumentConfigs,
        getLatestTickForSymbol,
    ]);

    // Auto-update current price when real-time data changes
    useEffect(() => {
        if (isConnected && formData.currencyPair) {
            const latestTick = getLatestTickForSymbol(formData.currencyPair);
            const currentPrice = latestTick?.bid || 0;

            if (currentPrice > 0) {
                setFormData((prev) => ({
                    ...prev,
                    currentPrice: currentPrice.toFixed(5),
                }));
            }
        }
    }, [
        isConnected,
        formData.currencyPair,
        getLatestTickForSymbol,
        realTimePairs,
    ]);

    // Load saved widget state on mount
    useEffect(() => {
        const loadSavedState = async () => {
            try {
                const savedState =
                    await widgetTabRetentionService.getWidgetState(
                        "LotSizeCalculator"
                    );
                if (savedState && Object.keys(savedState).length > 0) {
                    // Only restore form inputs, not calculated results
                    const { lastCalculation, ...restState } = savedState;
                    setFormData((prev) => ({ ...prev, ...restState }));

                    // Restore last calculation if it exists
                    if (lastCalculation) {
                        setResult(lastCalculation);
                    }
                }
            } catch (error) {
                console.error("Failed to load LotSizeCalculator state:", error);
            } finally {
                setIsStateLoaded(true);
            }
        };

        loadSavedState();
    }, []);

    // Debounced save function
    const debouncedSaveState = useCallback(
        (data, calculationResult) => {
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
                        lastCalculation: calculationResult,
                    };
                    await widgetTabRetentionService.saveWidgetState(
                        "LotSizeCalculator",
                        stateToSave
                    );
                } catch (error) {
                    console.error(
                        "Failed to save LotSizeCalculator state:",
                        error
                    );
                }
            }, 1000);
        },
        [isStateLoaded]
    );

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

        if (
            !formData.accountBalance ||
            parseFloat(formData.accountBalance) <= 0
        ) {
            newErrors.accountBalance = "Account balance must be greater than 0";
        }

        if (
            !formData.riskPercentage ||
            parseFloat(formData.riskPercentage) <= 0 ||
            parseFloat(formData.riskPercentage) > 100
        ) {
            newErrors.riskPercentage =
                "Risk percentage must be between 0.1% and 100%";
        }

        if (!formData.stopLoss || parseFloat(formData.stopLoss) <= 0) {
            newErrors.stopLoss = "Stop loss must be greater than 0";
        }

        if (
            (formData.instrumentType === "crypto" ||
                formData.instrumentType === "commodities") &&
            (!formData.currentPrice || parseFloat(formData.currentPrice) <= 0)
        ) {
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
        let calculation = "";

        // Calculate risk amount
        riskAmount = accountBalance * riskPercentage;

        if (formData.instrumentType === "forex") {
            // Forex calculation: Lot Size = (Account Balance × Risk %) / (Stop Loss (pips) × Pip Value)
            lotSize = riskAmount / (stopLoss * pipValue);
            calculation = `(${accountBalance.toFixed(2)} × ${(
                riskPercentage * 100
            ).toFixed(
                1
            )}%) / (${stopLoss} pips × $${pipValue}) = ${lotSize.toFixed(
                4
            )} lots`;
        } else if (formData.instrumentType === "commodities") {
            // Commodities calculation: Lot Size = (Account Balance × Risk %) / (Stop Loss (price difference) × Contract Size)
            lotSize = riskAmount / (stopLoss * contractSize);
            calculation = `(${accountBalance.toFixed(2)} × ${(
                riskPercentage * 100
            ).toFixed(
                1
            )}%) / (${stopLoss} × ${contractSize}) = ${lotSize.toFixed(
                4
            )} contracts`;
        } else if (formData.instrumentType === "crypto") {
            // Crypto calculation: Position Size = (Account Balance × Risk %) / Stop Loss (price difference)
            lotSize = riskAmount / stopLoss;
            const currentPrice = parseFloat(formData.currentPrice) || 0;
            const baseCurrency = formData.currencyPair
                .replace("USDm", "")
                .replace("USD", "");
            calculation = `(${accountBalance.toFixed(2)} × ${(
                riskPercentage * 100
            ).toFixed(1)}%) / ${stopLoss} = ${lotSize.toFixed(
                8
            )} ${baseCurrency}`;
            if (currentPrice > 0) {
                calculation += ` (at $${currentPrice.toFixed(2)})`;
            }
        }

        setResult({
            lotSize: lotSize,
            riskAmount: riskAmount,
            calculation: calculation,
            instrumentType: formData.instrumentType,
            resultUnit: instrumentConfigs[formData.instrumentType].resultUnit,
        });

        // Scroll to result section after a brief delay to ensure DOM update
        setTimeout(() => {
            if (resultRef.current) {
                resultRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest",
                });
            }
        }, 100);
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    const resetCalculator = () => {
        setFormData({
            accountBalance: "",
            riskPercentage: "",
            stopLoss: "",
            instrumentType: "forex",
            currencyPair: "EURUSDm",
            contractSize: "100000",
            pipValue: "10",
            currentPrice: "",
        });
        setResult(null);
        setErrors({});
    };

    return (
        <div className="h-full">
            <Card className="bg-transparent shadow-none border-0 relative">
                <CardHeader className="p-4 pt-3 pb-2 space-y-2 relative">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center tools-heading">
                            <svg
                                className="w-5 h-5 mr-2 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                            Lot Size Calculator
                        </CardTitle>
                        {/* Instrument Type Selection moved to header right */}
                        <div className="-mt-1">
                            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-full p-0.5 border border-gray-200 dark:border-gray-700 whitespace-nowrap overflow-hidden shadow-sm">
                                {Object.entries(instrumentConfigs).map(
                                    ([key, config], idx) => (
                                        <button
                                            key={key}
                                            onClick={() =>
                                                handleInputChange(
                                                    "instrumentType",
                                                    key
                                                )
                                            }
                                            className={`${
                                                formData.instrumentType === key
                                                    ? "bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm"
                                                    : "bg-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                            } px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 hover:scale-105 ${
                                                idx !== 0 ? "ml-0.5" : ""
                                            }`}
                                            title={`${config.name} (${config.resultUnit})`}
                                        >
                                            {config.name}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-1">
                    {/* Two-column layout: Left (calculator), Right (examples + results) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left: Calculator Panel */}
                        <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 shadow-lg p-4 md:p-5 backdrop-blur-sm">
                            {/* Input Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Account Balance */}
                                <div>
                                    <label
                                        htmlFor="accountBalance"
                                        className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
                                    >
                                        Account Balance ($)
                                    </label>
                                    <div className="relative group">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base font-medium">
                                            $
                                        </span>
                                        <input
                                            id="accountBalance"
                                            type="number"
                                            step="0.01"
                                            value={formData.accountBalance}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "accountBalance",
                                                    e.target.value
                                                )
                                            }
                                            className={`w-full h-11 pl-8 pr-3 text-base border rounded-xl shadow-sm placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                                                errors.accountBalance
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="10000"
                                        />
                                    </div>
                                    {errors.accountBalance && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.accountBalance}
                                        </p>
                                    )}
                                </div>

                                {/* Risk Percentage */}
                                <div>
                                    <label
                                        htmlFor="riskPercentage"
                                        className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
                                    >
                                        Risk Percentage (%)
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="riskPercentage"
                                            type="number"
                                            step="0.1"
                                            value={formData.riskPercentage}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "riskPercentage",
                                                    e.target.value
                                                )
                                            }
                                            className={`w-full h-11 pl-3 pr-8 text-base border rounded-xl shadow-sm placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                                                errors.riskPercentage
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="2"
                                        />
                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base font-medium">
                                            %
                                        </span>
                                    </div>
                                    {errors.riskPercentage && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.riskPercentage}
                                        </p>
                                    )}
                                </div>

                                {/* Currency Pair Selection */}
                                <div>
                                    <label
                                        htmlFor="currencyPair"
                                        className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
                                    >
                                        {formData.instrumentType === "forex"
                                            ? "Currency Pair"
                                            : formData.instrumentType ===
                                              "commodities"
                                            ? "Commodity"
                                            : "Cryptocurrency"}
                                    </label>
                                    <div className="relative group">
                                        <select
                                            id="currencyPair"
                                            value={formData.currencyPair}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "currencyPair",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full h-11 pl-3 pr-8 text-base border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 dark:bg-gray-700/90 dark:border-gray-600 dark:text-white appearance-none transition-all duration-200 group-hover:shadow-md"
                                            disabled={!isConnected}
                                        >
                                            {instrumentConfigs[
                                                formData.instrumentType
                                            ].pairs.length > 0 ? (
                                                instrumentConfigs[
                                                    formData.instrumentType
                                                ].pairs.map((pair) => (
                                                    <option
                                                        key={pair.symbol}
                                                        value={pair.symbol}
                                                    >
                                                        {pair.displayName ||
                                                            pair.symbol}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>
                                                    {isConnected
                                                        ? "No pairs available"
                                                        : "Connecting to market data..."}
                                                </option>
                                            )}
                                        </select>
                                        <svg
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                    {!isConnected && (
                                        <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                                            Connect to market data to see live
                                            prices
                                        </p>
                                    )}
                                </div>

                                {/* Stop Loss */}
                                <div>
                                    <label
                                        htmlFor="stopLoss"
                                        className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
                                    >
                                        Stop Loss (
                                        {
                                            instrumentConfigs[
                                                formData.instrumentType
                                            ].stopLossUnit
                                        }
                                        )
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="stopLoss"
                                            type="number"
                                            step="0.01"
                                            value={formData.stopLoss}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "stopLoss",
                                                    e.target.value
                                                )
                                            }
                                            className={`w-full h-11 pl-3 pr-12 text-base border rounded-xl shadow-sm placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                                                errors.stopLoss
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder={
                                                formData.instrumentType ===
                                                "forex"
                                                    ? "50"
                                                    : "100"
                                            }
                                        />
                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base capitalize font-medium">
                                            {
                                                instrumentConfigs[
                                                    formData.instrumentType
                                                ].stopLossUnit
                                            }
                                        </span>
                                    </div>
                                    {errors.stopLoss && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.stopLoss}
                                        </p>
                                    )}
                                </div>

                                {/* Current Price (for crypto and commodities) */}
                                {(formData.instrumentType === "crypto" ||
                                    formData.instrumentType ===
                                        "commodities") && (
                                    <div className="md:col-span-2">
                                        <label
                                            htmlFor="currentPrice"
                                            className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-2"
                                        >
                                            Current Price ($)
                                            {isConnected &&
                                                formData.currentPrice && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                        Live
                                                    </span>
                                                )}
                                        </label>
                                        <div className="relative group">
                                            <input
                                                id="currentPrice"
                                                type="number"
                                                step="0.01"
                                                value={formData.currentPrice}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "currentPrice",
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full h-11 pl-3 pr-8 text-base border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 bg-white/90 dark:bg-gray-700/90 dark:border-gray-600 dark:text-white transition-all duration-200 group-hover:shadow-md ${
                                                    errors.currentPrice
                                                        ? "border-red-500"
                                                        : "border-gray-300"
                                                } ${
                                                    isConnected &&
                                                    formData.currentPrice
                                                        ? "bg-green-50 dark:bg-green-900/10"
                                                        : ""
                                                }`}
                                                placeholder={
                                                    isConnected
                                                        ? "Auto-populated from live data"
                                                        : "50000"
                                                }
                                                readOnly={
                                                    isConnected &&
                                                    formData.currentPrice
                                                }
                                            />
                                            {isConnected &&
                                                formData.currentPrice && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const latestTick =
                                                                getLatestTickForSymbol(
                                                                    formData.currencyPair
                                                                );
                                                            const currentPrice =
                                                                latestTick?.bid ||
                                                                0;
                                                            if (
                                                                currentPrice > 0
                                                            ) {
                                                                handleInputChange(
                                                                    "currentPrice",
                                                                    currentPrice.toFixed(
                                                                        5
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                                        title="Refresh current price"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                        </div>
                                        {errors.currentPrice && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.currentPrice}
                                            </p>
                                        )}
                                        {isConnected &&
                                            formData.currentPrice && (
                                                <p className="text-green-600 dark:text-green-400 text-xs mt-1">
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
                                    className="flex-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 hover:from-emerald-600 hover:via-emerald-500 hover:to-green-700 text-white font-semibold h-11 px-4 rounded-xl transition-all duration-300 ease-in-out text-base shadow-lg hover:shadow-xl transform hover:scale-105 hover:brightness-110"
                                >
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                        />
                                    </svg>
                                    Calculate Lot Size
                                </Button>
                                <Button
                                    onClick={resetCalculator}
                                    variant="outline"
                                    className="px-6 h-11 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-base shadow-sm hover:shadow-md transform hover:scale-105"
                                >
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    Reset
                                </Button>
                            </div>
                        </div>

                        {/* Right: Default Calculation Result */}
                        <div className="space-y-4">
                            {/* Default Calculation Display */}
                            <div className="rounded-2xl border border-green-200/60 dark:border-green-700/50 bg-gradient-to-br from-green-50/80 to-white/80 dark:from-green-900/20 dark:to-gray-800/80 shadow-lg p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm font-bold">
                                        ✓
                                    </span>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Sample Calculation
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex justify-between items-center bg-white/90 dark:bg-gray-900/90 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                            Account Balance
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                            $10,000
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/90 dark:bg-gray-900/90 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                            Risk Percentage
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                            2%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/90 dark:bg-gray-900/90 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                            Stop Loss
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                            50 pips
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/90 dark:bg-gray-900/90 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                            Risk Amount
                                        </span>
                                        <span className="font-bold text-red-600 text-lg">
                                            $200
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/90 dark:bg-gray-900/90 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                            Position Size
                                        </span>
                                        <span className="font-bold text-green-600 text-lg">
                                            0.40 lots
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white/90 dark:bg-gray-900/90 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 text-sm text-gray-600 dark:text-gray-300 mt-3">
                                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                        Formula
                                    </div>
                                    <div className="font-mono text-xs break-words">
                                        ($10,000 × 2%) / (50 pips × $10) = 0.40
                                        lots
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LotSizeCalculator;
