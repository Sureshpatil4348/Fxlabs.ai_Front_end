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

                    // Restore last calculation if it exists and has expected shape
                    if (
                        lastCalculation &&
                        typeof lastCalculation === "object" &&
                        lastCalculation.input &&
                        typeof lastCalculation.input === "object"
                    ) {
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

        // Calculate risk amount
        riskAmount = accountBalance * riskPercentage;

        if (formData.instrumentType === "forex") {
            // Forex calculation: Lot Size = (Account Balance × Risk %) / (Stop Loss (pips) × Pip Value)
            lotSize = riskAmount / (stopLoss * pipValue);
        } else if (formData.instrumentType === "commodities") {
            // Commodities calculation: Lot Size = (Account Balance × Risk %) / (Stop Loss (price difference) × Contract Size)
            lotSize = riskAmount / (stopLoss * contractSize);
        } else if (formData.instrumentType === "crypto") {
            // Crypto calculation: Position Size = (Account Balance × Risk %) / Stop Loss (price difference)
            lotSize = riskAmount / stopLoss;
        }

        setResult({
            lotSize: lotSize,
            riskAmount: riskAmount,
            instrumentType: formData.instrumentType,
            resultUnit: instrumentConfigs[formData.instrumentType].resultUnit,
            input: {
                accountBalance,
                riskPercentage: riskPercentage * 100,
                stopLoss,
                currencyPair: formData.currencyPair,
                stopLossUnit:
                    instrumentConfigs[formData.instrumentType].stopLossUnit,
                currentPrice: formData.currentPrice
                    ? parseFloat(formData.currentPrice)
                    : null,
            },
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
            <Card className="bg-transparent shadow-none border-0">
                <CardHeader className="p-2 pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center tools-heading">
                            <svg
                                className="w-4 h-4 mr-1.5 text-blue-600"
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
                        {/* Instrument Type Selection */}
                        <div className="flex gap-1 bg-emerald-500/15 dark:bg-emerald-400/15 border border-emerald-500/30 dark:border-emerald-400/30 rounded-full p-0.5">
                            {Object.entries(instrumentConfigs).map(
                                ([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() =>
                                            handleInputChange(
                                                "instrumentType",
                                                key
                                            )
                                        }
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                            formData.instrumentType === key
                                                ? "bg-emerald-500 text-white"
                                                : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
                                        }`}
                                    >
                                        {config.name}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-2 pt-2">
                    {/* Two-column layout: Left (calculator), Right (results) */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
                        {/* Left: Calculator Panel - 3 columns */}
                        <div className="lg:col-span-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                            {/* Input Form */}
                            <div className="space-y-2">
                                {/* Row 1: Account Balance & Risk Percentage */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {/* Account Balance */}
                                    <div>
                                        <label
                                            htmlFor="accountBalance"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >
                                            Account Balance ($)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                                                className={`w-full h-10 pl-7 pr-3 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                                                    errors.accountBalance
                                                        ? "border-red-500"
                                                        : "border-gray-300 dark:border-gray-600"
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
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >
                                            Risk Percentage (%)
                                        </label>
                                        <div className="relative">
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
                                                className={`w-full h-10 pl-3 pr-7 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                                                    errors.riskPercentage
                                                        ? "border-red-500"
                                                        : "border-gray-300 dark:border-gray-600"
                                                }`}
                                                placeholder="2"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                %
                                            </span>
                                        </div>
                                        {errors.riskPercentage && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.riskPercentage}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Currency Pair & Stop Loss */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {/* Currency Pair Selection */}
                                    <div>
                                        <label
                                            htmlFor="currencyPair"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >
                                            {formData.instrumentType === "forex"
                                                ? "Currency Pair"
                                                : formData.instrumentType ===
                                                  "commodities"
                                                ? "Commodity"
                                                : "Cryptocurrency"}
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="currencyPair"
                                                value={formData.currencyPair}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "currencyPair",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full h-10 pl-3 pr-8 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 appearance-none"
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
                                                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
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
                                    </div>

                                    {/* Stop Loss */}
                                    <div>
                                        <label
                                            htmlFor="stopLoss"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >
                                            Stop Loss (
                                            {
                                                instrumentConfigs[
                                                    formData.instrumentType
                                                ].stopLossUnit
                                            }
                                            )
                                        </label>
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
                                            className={`w-full h-10 px-3 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                                                errors.stopLoss
                                                    ? "border-red-500"
                                                    : "border-gray-300 dark:border-gray-600"
                                            }`}
                                            placeholder={
                                                formData.instrumentType ===
                                                "forex"
                                                    ? "50"
                                                    : "100"
                                            }
                                        />
                                        {errors.stopLoss && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.stopLoss}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3: Current Price (for crypto and commodities only) */}
                                {(formData.instrumentType === "crypto" ||
                                    formData.instrumentType ===
                                        "commodities") && (
                                    <div>
                                        <label
                                            htmlFor="currentPrice"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >
                                            Current Price ($)
                                            {isConnected &&
                                                formData.currentPrice && (
                                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                        Live
                                                    </span>
                                                )}
                                        </label>
                                        <div className="relative">
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
                                                className={`w-full h-10 pl-3 pr-10 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                                                    errors.currentPrice
                                                        ? "border-red-500"
                                                        : "border-gray-300 dark:border-gray-600"
                                                }`}
                                                placeholder="50000"
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
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                        title="Refresh"
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
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-3 flex gap-2">
                                <Button
                                    onClick={calculateLotSize}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-9 rounded-lg text-sm"
                                >
                                    Calculate
                                </Button>
                                <Button
                                    onClick={resetCalculator}
                                    variant="outline"
                                    className="px-3 h-9 border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>

                        {/* Right: Calculation Result Panel - 2 columns */}
                        <div className="lg:col-span-2" ref={resultRef}>
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/10 p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                                        ✓
                                    </span>
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                                        {result ? "Your Calculation" : "Result"}
                                    </h3>
                                </div>

                                {result ? (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-start gap-2 p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                                                Account Balance
                                            </span>
                                            <span className="text-xs font-medium text-gray-900 dark:text-white text-right">
                                                $
                                                {result?.input
                                                    ?.accountBalance != null
                                                    ? result.input.accountBalance.toLocaleString()
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2 p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                                                Risk Percentage
                                            </span>
                                            <span className="text-xs font-medium text-gray-900 dark:text-white text-right">
                                                {result?.input
                                                    ?.riskPercentage != null
                                                    ? `${result.input.riskPercentage}%`
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2 p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                                                Stop Loss
                                            </span>
                                            <span className="text-xs font-medium text-gray-900 dark:text-white text-right break-words">
                                                {result?.input?.stopLoss != null
                                                    ? `${
                                                          result.input.stopLoss
                                                      } ${
                                                          result?.input
                                                              ?.stopLossUnit ??
                                                          ""
                                                      }`
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2 p-1.5 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                            <span className="text-xs font-medium text-red-700 dark:text-red-400 leading-tight">
                                                Risk Amount
                                            </span>
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 text-right">
                                                {typeof result?.riskAmount ===
                                                "number"
                                                    ? `$${result.riskAmount.toFixed(
                                                          2
                                                      )}`
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2 p-1.5 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                            <span className="text-xs font-medium text-green-700 dark:text-green-400 leading-tight">
                                                {result?.instrumentType ===
                                                "crypto"
                                                    ? "Position Size"
                                                    : result?.instrumentType ===
                                                      "commodities"
                                                    ? "Contract Size"
                                                    : "Position Size"}
                                            </span>
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400 text-right break-words">
                                                {result?.instrumentType ===
                                                "crypto"
                                                    ? result?.lotSize != null &&
                                                      result?.input
                                                          ?.currencyPair
                                                        ? `${result.lotSize.toFixed(
                                                              6
                                                          )} ${result.input.currencyPair
                                                              .replace(
                                                                  "USDm",
                                                                  ""
                                                              )
                                                              .replace(
                                                                  "USD",
                                                                  ""
                                                              )}`
                                                        : "-"
                                                    : result?.lotSize != null
                                                    ? `${result.lotSize.toFixed(
                                                          2
                                                      )} ${
                                                          result?.resultUnit ??
                                                          ""
                                                      }`
                                                    : "-"}
                                            </span>
                                        </div>
                                        {result?.instrumentType !== "forex" &&
                                            result?.input?.currentPrice !=
                                                null && (
                                                <div className="flex justify-between items-start gap-2 p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                                                        Current Price
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-900 dark:text-white text-right">
                                                        $
                                                        {Number(
                                                            result.input
                                                                .currentPrice
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                        <p className="text-xs">
                                            Enter details and click Calculate
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LotSizeCalculator;
