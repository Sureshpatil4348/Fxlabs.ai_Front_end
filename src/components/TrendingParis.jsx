import { TrendingUp } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";

import useMarketCacheStore from "../store/useMarketCacheStore";
import useRSITrackerStore from "../store/useRSITrackerStore";
import { useChartStore } from "./widget/stores/useChartStore";
import {
    formatSymbolDisplay,
    formatPrice,
    formatPercentage,
} from "../utils/formatters";

// Shimmer Skeleton for Trending Pairs
const TrendingPairsSkeleton = () => (
    <table className="w-full">
        <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
                <th className="px-3 py-2 text-center text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide rounded-tl-lg">
                    Pair
                </th>
                <th className="px-3 py-2 text-center text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide">
                    Price
                </th>
                <th className="px-3 py-2 text-center text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide rounded-tr-lg">
                    Daily %
                </th>
            </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#19235d]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-slate-700">
                    <td className="px-2 py-2 text-center">
                        <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded mx-auto relative overflow-hidden">
                            <div className="absolute inset-0 shimmer-bg"></div>
                        </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                        <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded mx-auto relative overflow-hidden">
                            <div className="absolute inset-0 shimmer-bg"></div>
                        </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                        <div className="h-4 w-12 bg-gray-100 dark:bg-gray-800 rounded mx-auto relative overflow-hidden">
                            <div className="absolute inset-0 shimmer-bg"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const TrendingPairs = () => {
    // removed manual loading state for refresh
    
    // Track initial loading state
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // From centralized cache
    const { trendingSymbols, pricingBySymbol } =
        useMarketCacheStore();

    // For connection status and timeframe
    const isConnected = useRSITrackerStore((state) => state.isConnected);

    const rows = useMemo(() => {
        return (Array.isArray(trendingSymbols) ? trendingSymbols : []).map(
            (symbol) => {
                // Fix symbol case - trending symbols come as 'ETHUSDM' but data uses 'ETHUSDm'
                let key = symbol;
                if (key.toUpperCase().endsWith("M")) {
                    key = key.slice(0, -1) + "m";
                } else if (!key.toLowerCase().endsWith("m")) {
                    key = `${key}m`;
                }

                const pricing = pricingBySymbol.get(key) || {};
                const price =
                    typeof pricing.bid === "number" ? pricing.bid : null;
                const dailyPct =
                    typeof pricing.daily_change_pct === "number"
                        ? pricing.daily_change_pct
                        : 0;

                return { symbol, price, change: dailyPct };
            }
        );
    }, [trendingSymbols, pricingBySymbol]);

    const openInKLineChart = (symbolInput) => {
        try {
            let next = String(symbolInput || "").trim();
            if (!next) return;
            next = next.replace(/[\/\s]/g, "").toUpperCase();
            if (next.endsWith("M")) next = next.slice(0, -1);
            // Also handle lowercase just in case
            if (next.endsWith("m")) next = next.slice(0, -1);
            if (!next) return;
            const chartStore = useChartStore.getState();
            chartStore.setSymbol(next);
            try { chartStore.setWorkspaceHidden(false); } catch (_e) { /* ignore */ }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to open symbol in KLine chart:", symbolInput, e);
        }
    };
    
    // End initial loading after data is available or timeout
    useEffect(() => {
        if (rows.length > 0) {
            setTimeout(() => setIsInitialLoading(false), 500);
        } else {
            // End loading after 2 seconds even if no data
            setTimeout(() => setIsInitialLoading(false), 2000);
        }
    }, [rows.length]);

    // Manual refresh removed; trending updates driven by backend hydration elsewhere

    // Removed RFI from trending list view per spec

    return (
        <div className="widget-card px-4 pb-4 h-full flex flex-col z-1 relative">
            {/* Header */}
            <div className="flex-shrink-0">
                <div className="mb-3">
                    <div className="widget-header flex items-center justify-between text-[14px]">
                        <div>
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <div>
                                    <h2 className="text-base font-semibold text-[#19235d] dark:text-slate-100">
                                        Trending Pairs
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 text-[14px]"></div>
                    </div>
                </div>

                {/* Connection Status - Removed */}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 p-1">
                {isInitialLoading ? (
                    <TrendingPairsSkeleton />
                ) : rows.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-3 py-2 text-center text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide rounded-tl-lg">
                                    Pair
                                </th>
                                <th className="px-3 py-2 text-center text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide">
                                    Price
                                </th>
                                <th className="px-3 py-2 text-center text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide rounded-tr-lg">
                                    Daily %
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#19235d] text-sm text-left">
                            {rows.slice(0, 12).map((row) => (
                                <tr
                                    key={row.symbol}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openInKLineChart(row.symbol)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            openInKLineChart(row.symbol);
                                        }
                                    }}
                                >
                                    <td className="px-2 py-1 text-[13px] font-medium text-[#19235d] dark:text-slate-100 text-center">
                                        {formatSymbolDisplay(row.symbol)}
                                    </td>
                                    <td className="px-2 py-1 text-[13px] text-[#19235d] dark:text-slate-100 font-mono text-center">
                                        {row.price != null
                                            ? row.symbol.includes("JPY")
                                                ? formatPrice(row.price, 3)
                                                : formatPrice(row.price, 5)
                                            : "--"}
                                    </td>
                                    <td
                                        className={`px-2 py-1 text-[13px] font-medium text-center ${
                                            row.change >= 0
                                                ? "text-success-600"
                                                : "text-danger-600"
                                        }`}
                                    >
                                        {formatPercentage(row.change)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
                                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-medium text-[#19235d] dark:text-slate-100 mb-2">
                                No Trending Pairs
                            </h3>
                            <p className="text-gray-500 dark:text-slate-400 text-base">
                                {!isConnected
                                    ? "Waiting for market data connection..."
                                    : "Waiting for backend trending list..."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrendingPairs;
