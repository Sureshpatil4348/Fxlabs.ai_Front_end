import React from "react";

import { useAuth } from "../auth/AuthProvider";
import AINewsAnalysis from "../components/AINewsAnalysis";
import CurrencyStrengthMeter from "../components/CurrencyStrengthMeter";
import LoadingOverlay from "../components/LoadingOverlay";
import LotSizeCalculator from "../components/LotSizeCalculator";
import MultiIndicatorHeatmap from "../components/MultiIndicatorHeatmap";
import MultiTimeAnalysis from "../components/MultiTimeAnalysis";
import Navbar from "../components/Navbar";
// RSICorrelationDashboard removed per requirements; keep blank space instead
import RSIOverboughtOversoldTracker from "../components/RSIOverboughtOversoldTracker";
import TradingViewWidget from "../components/TradingViewWidget";
import TrendingPairs from "../components/TrendingParis";
import widgetTabRetentionService from "../services/widgetTabRetentionService";
import useBaseMarketStore from "../store/useBaseMarketStore";
import useMarketCacheStore from "../store/useMarketCacheStore";
import useMarketStore from "../store/useMarketStore";

const Dashboard = () => {
    const { user } = useAuth();
    const { retryAllConnections } = useMarketStore();
    const connectionInitiated = React.useRef(false);

    // Subscribe only to the specific parts we need for rendering
    const showLoader = useMarketStore(
        (state) => state.globalConnectionState.showLoader
    );
    const connectionStatus = useMarketStore(
        (state) => state.globalConnectionState.status
    );
    const connectionAttempts = useMarketStore(
        (state) => state.globalConnectionState.connectionAttempts
    );

    const { loadTabState, tabStateHasLoaded: _tabStateHasLoaded } =
        useBaseMarketStore();
    const [activeTab, setActiveTab] = React.useState(null); // Start with null to indicate loading
    const isInitialLoadRef = React.useRef(true); // Track if this is the initial load
    const hasLoadedFromDbRef = React.useRef(false); // Track if we've loaded from DB

    React.useEffect(() => {
        // Only reset if we're dealing with a different user
        if (user?.id && connectionInitiated.current !== user.id) {
            connectionInitiated.current = user.id;
            // Reset tab loading refs for new user
            isInitialLoadRef.current = true;
            hasLoadedFromDbRef.current = false;
            setActiveTab(null); // Reset to loading state
            useMarketStore.getState().initiateGlobalConnection();
            // Initialize centralized market cache (REST + WS)
            useMarketCacheStore.getState().initialize();
        }
    }, [user?.id]);

    // Load active tab from Supabase on mount (only run once when user is available)
    React.useEffect(() => {
        if (user?.id && !hasLoadedFromDbRef.current) {
            hasLoadedFromDbRef.current = true; // Mark to prevent multiple calls
            console.log("[Dashboard] Loading active tab from Supabase...");
            widgetTabRetentionService
                .getActiveTab()
                .then((savedTab) => {
                    console.log(
                        "[Dashboard] Loaded active tab from Supabase:",
                        savedTab
                    );
                    setActiveTab(savedTab); // This will always return a valid tab (defaults to 'analysis')
                    // Allow saves after a brief delay to ensure initial load is complete
                    setTimeout(() => {
                        isInitialLoadRef.current = false;
                        console.log(
                            "[Dashboard] Initial load complete, enabling auto-save"
                        );
                    }, 100);
                })
                .catch((error) => {
                    console.error(
                        "[Dashboard] Failed to load active tab:",
                        error
                    );
                    setActiveTab("analysis"); // Fallback to analysis on error
                    isInitialLoadRef.current = false;
                });
        } else if (!user?.id && !hasLoadedFromDbRef.current) {
            // If not logged in, default to analysis
            console.log(
                "[Dashboard] No user logged in, defaulting to analysis"
            );
            setActiveTab("analysis");
            isInitialLoadRef.current = false;
            hasLoadedFromDbRef.current = true;
        }
    }, [user?.id]); // Only depend on user?.id, not activeTab

    // Save active tab to Supabase whenever it changes (after initial load)
    React.useEffect(() => {
        // Only save if not initial load and tab is set
        if (!isInitialLoadRef.current && user?.id && activeTab !== null) {
            console.log(
                "[Dashboard] Saving active tab to Supabase:",
                activeTab
            );
            widgetTabRetentionService
                .setActiveTab(activeTab)
                .then(() => {
                    console.log("[Dashboard] Active tab saved successfully");
                })
                .catch((error) => {
                    console.error(
                        "[Dashboard] Failed to save active tab:",
                        error
                    );
                });
        } else {
            console.log(
                "[Dashboard] Skipping save - isInitial:",
                isInitialLoadRef.current,
                "user:",
                !!user?.id,
                "tab:",
                activeTab
            );
        }
    }, [activeTab, user?.id]);

    // Defer AI news fetch until after WS + state ready to reduce startup load
    React.useEffect(() => {
        let intervalId;
        const startNewsPolling = () => {
            useBaseMarketStore.getState().fetchNews();
            intervalId = setInterval(() => {
                useBaseMarketStore.getState().fetchNews();
            }, 5 * 60 * 1000);
        };
        // Start when global connection is CONNECTED and tab state loaded
        if (connectionStatus === "CONNECTED") {
            startNewsPolling();
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [connectionStatus]);

    // Load user tab states on dashboard mount (optional)
    React.useEffect(() => {
        loadTabState().catch((error) => {
            console.error("Failed to load tab states:", error);
        });
    }, [loadTabState]);

    return (
        <div className="relative min-h-screen max-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900 overflow-hidden flex flex-col transition-colors duration-300">
            {/* Loading Overlay - Render at root level to avoid layout constraints */}
            {showLoader && (
                <LoadingOverlay
                    status={connectionStatus}
                    connectionAttempts={connectionAttempts}
                    onRetry={retryAllConnections}
                />
            )}

            {/* Navbar - pass tab state for centered navbar buttons */}
            <Navbar
                activeTab={activeTab || "analysis"}
                onChangeTab={setActiveTab}
            />

            {/* Main Content - Takes remaining screen height */}
            <main className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-3 md:px-4 pt-4 pb-16 sm:pb-20 lg:pb-6 lg:mt-10 mt-6">
                {/* Mobile Tab Toggle - visible under navbar on small screens */}
                <div className="lg:hidden px-2 pt-4 mb-2 flex justify-center">
                    <div className="flex items-center gap-2 bg-emerald-500/15 dark:bg-emerald-400/15 border border-emerald-500/30 dark:border-emerald-400/30 rounded-full p-1 backdrop-blur-md shadow-sm">
                        <button
                            type="button"
                            onClick={() => setActiveTab("analysis")}
                            className={`px-5 py-1.5 rounded-full transition-all duration-200 ${
                                (activeTab || "analysis") === "analysis"
                                    ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white shadow-md"
                                    : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
                            }`}
                            style={{
                                WebkitBackdropFilter: "blur(6px)",
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            Analysis
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("tools")}
                            className={`px-5 py-1.5 rounded-full transition-all duration-200 ml-0.5 ${
                                (activeTab || "analysis") === "tools"
                                    ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white shadow-md"
                                    : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
                            }`}
                            style={{
                                WebkitBackdropFilter: "blur(6px)",
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            Tools
                        </button>
                    </div>
                </div>
                {/* Tabs moved to Navbar */}

                {/* Don't render content until activeTab is loaded */}
                {!activeTab ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 dark:text-gray-400">
                            Loading...
                        </div>
                    </div>
                ) : activeTab === "analysis" ? (
                    <>
                        {/* Mobile Layout - Stack vertically */}
                        <div className="block lg:hidden space-y-3">
                            {/* Section 1 - TradingView Widget */}
                            <div className="h-[calc(100vh-20rem)] min-h-[300px] max-h-[400px] bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                                <TradingViewWidget
                                    initialSymbol="OANDA:EURUSD"
                                    initialInterval="60"
                                    height="100%"
                                    className="w-full"
                                />
                            </div>

                            {/* Section 2 - Currency Strength Meter */}
                            <div className="h-[300px] bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <CurrencyStrengthMeter />
                            </div>

                            {/* Section 3 - Trending Pairs */}
                            <div className="h-[250px] bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <TrendingPairs />
                            </div>

                            {/* Section 4 - RSI Tracker */}
                            <div className="h-[250px] bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <RSIOverboughtOversoldTracker />
                            </div>

                            {/* Section 5 - AI News Analysis */}
                            <div className="h-[300px] bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <AINewsAnalysis />
                            </div>
                        </div>

                        {/* Desktop Layout - 12x12 grid */}
                        <div className="hidden lg:grid h-full grid-cols-12 grid-rows-12 gap-3">
                            {/* Section 1 - TradingView Widget (75% width - top left) */}
                            <div className="col-span-9 row-span-8 min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                                <TradingViewWidget
                                    initialSymbol="OANDA:EURUSD"
                                    initialInterval="60"
                                    height="100%"
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Right Top: Trending Pairs over RSI (combined height == TradingView) */}
                            <div className="col-span-3 row-span-8 min-h-0 flex flex-col gap-3">
                                <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 overflow-hidden">
                                    <TrendingPairs />
                                </div>
                                <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 overflow-hidden">
                                    <RSIOverboughtOversoldTracker />
                                </div>
                            </div>

                            {/* Section 2nd - Currency Strength Meter (75% width - bottom left) */}
                            <div className="col-span-9 row-span-4 row-start-9 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 overflow-hidden">
                                <CurrencyStrengthMeter />
                            </div>

                            {/* Right Bottom: AI News Analysis (height == Currency Strength Meter) */}
                            <div className="col-span-3 row-span-4 row-start-9 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 overflow-hidden">
                                <AINewsAnalysis />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Tools Tab Content */}
                        {/* Mobile: natural stacking, Desktop: h-full flex layout */}
                        <div className="lg:h-full flex flex-col gap-3">
                            {/* Two-column layout: Left stacks Lot Size + Heatmap; Right spans full height with Multi Time Analysis */}
                            {/* Mobile: grid auto-flow, Desktop: grid with flex-1 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:flex-1 lg:min-h-0 grid-flow-row-dense auto-rows-min">
                                {/* Left Column: Lot Size (top) */}
                                <div className="flex flex-col gap-3 lg:min-h-0">
                                    {/* Lot Size Calculator - responsive height with internal scroll when needed */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-3 h-[calc(100vh-26rem)] min-h-[400px] lg:min-h-[30rem]">
                                        <div className="h-full overflow-y-auto">
                                            <LotSizeCalculator />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Multi Time Analysis spanning full height */}
                                {/* Mobile: fixed height with internal scroll, Desktop: min-h-0 flex behavior */}
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-3 h-[calc(100vh-26rem)] min-h-[400px] lg:min-h-[30rem]">
                                    <div className="h-full overflow-y-auto overflow-x-hidden">
                                        <MultiTimeAnalysis />
                                    </div>
                                </div>

                                {/* Quantum Analysis (MultiIndicatorHeatmap) - full width on desktop */}
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-3 lg:col-span-2 lg:row-start-2 h-[500px] lg:h-auto">
                                    <div className="h-full overflow-x-auto">
                                        <MultiIndicatorHeatmap />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
