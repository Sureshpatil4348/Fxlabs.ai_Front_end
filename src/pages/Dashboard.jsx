  import React from 'react'

  import { useAuth } from '../auth/AuthProvider'
  import AINewsAnalysis from '../components/AINewsAnalysis'
  import CurrencyStrengthMeter from '../components/CurrencyStrengthMeter'
  import LoadingOverlay from '../components/LoadingOverlay'
  import LotSizeCalculator from '../components/LotSizeCalculator'
  import MultiIndicatorHeatmap from '../components/MultiIndicatorHeatmap'
  import MultiTimeAnalysis from '../components/MultiTimeAnalysis'
  import Navbar from '../components/Navbar'
  // RSICorrelationDashboard removed per requirements; keep blank space instead
  import RSIOverboughtOversoldTracker from '../components/RSIOverboughtOversoldTracker'
  import TradingViewWidget from '../components/TradingViewWidget'
  import TrendingPairs from '../components/TrendingParis'
  import TradingChart from '../components/widget/TradingChart'
  import defaultAlertsService from '../services/defaultAlertsService'
  import widgetTabRetentionService from '../services/widgetTabRetentionService'
  import useBaseMarketStore from '../store/useBaseMarketStore'
  import useMarketCacheStore from '../store/useMarketCacheStore'
  import useMarketStore from '../store/useMarketStore'

  // Feature flag for advanced TradingView widget
  const useAdvancedTradingViewWidget = process.env.REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET === 'true'

  const Dashboard = () => {
    const { user } = useAuth()
    const { retryAllConnections } = useMarketStore()
    const connectionInitiated = React.useRef(false)
    
    // Subscribe only to the specific parts we need for rendering
    const showLoader = useMarketStore(state => state.globalConnectionState.showLoader)
    const connectionStatus = useMarketStore(state => state.globalConnectionState.status)
    const connectionAttempts = useMarketStore(state => state.globalConnectionState.connectionAttempts)

  const { loadTabState, tabStateHasLoaded: _tabStateHasLoaded } = useBaseMarketStore();
  const [activeTab, setActiveTab] = React.useState(null) // Start with null to indicate loading
  const isInitialLoadRef = React.useRef(true) // Track if this is the initial load
  const hasLoadedFromDbRef = React.useRef(false) // Track if we've loaded from DB
  const defaultAlertsInitializedRef = React.useRef(false) // Track if default alerts check has been done

    React.useEffect(() => {
      // Only reset if we're dealing with a different user
      if (user?.id && connectionInitiated.current !== user.id) {
        connectionInitiated.current = user.id
        // Reset tab loading refs for new user
        isInitialLoadRef.current = true
        hasLoadedFromDbRef.current = false
        defaultAlertsInitializedRef.current = false
        setActiveTab(null) // Reset to loading state
        useMarketStore.getState().initiateGlobalConnection()
        // Initialize centralized market cache (REST + WS)
        useMarketCacheStore.getState().initialize()
      }
    }, [user?.id])

  // Initialize default alerts for first-time users
  React.useEffect(() => {
    if (user?.id && !defaultAlertsInitializedRef.current) {
      defaultAlertsInitializedRef.current = true;
      console.log('[Dashboard] Checking if user needs default alerts initialization...');
      
      defaultAlertsService.checkAndInitialize()
        .then(result => {
          if (result.initialized) {
            console.log('[Dashboard] ✓ Default alerts initialized for first-time user');
            console.log('[Dashboard] Initialization results:', result.results);
          } else {
            console.log('[Dashboard] User already has alerts or initialization skipped');
          }
        })
        .catch(error => {
          console.error('[Dashboard] Failed to initialize default alerts:', error);
        });
    }
  }, [user?.id])

  // Load active tab from Supabase on mount (only run once when user is available)
  React.useEffect(() => {
    if (user?.id && !hasLoadedFromDbRef.current) {
      hasLoadedFromDbRef.current = true; // Mark to prevent multiple calls
      console.log('[Dashboard] Loading active tab from Supabase...');
      widgetTabRetentionService.getActiveTab()
        .then(savedTab => {
          console.log('[Dashboard] Loaded active tab from Supabase:', savedTab);
          setActiveTab(savedTab); // This will always return a valid tab (defaults to 'analysis')
          // Allow saves after a brief delay to ensure initial load is complete
          setTimeout(() => {
            isInitialLoadRef.current = false;
            console.log('[Dashboard] Initial load complete, enabling auto-save');
          }, 100);
        })
        .catch(error => {
          console.error('[Dashboard] Failed to load active tab:', error);
          setActiveTab('analysis'); // Fallback to analysis on error
          isInitialLoadRef.current = false;
        });
    } else if (!user?.id && !hasLoadedFromDbRef.current) {
      // If not logged in, default to analysis
      console.log('[Dashboard] No user logged in, defaulting to analysis');
      setActiveTab('analysis');
      isInitialLoadRef.current = false;
      hasLoadedFromDbRef.current = true;
    }
  }, [user?.id]); // Only depend on user?.id, not activeTab

  // Save active tab to Supabase whenever it changes (after initial load)
  React.useEffect(() => {
    // Only save if not initial load and tab is set
    if (!isInitialLoadRef.current && user?.id && activeTab !== null) {
      console.log('[Dashboard] Saving active tab to Supabase:', activeTab);
      widgetTabRetentionService.setActiveTab(activeTab)
        .then(() => {
          console.log('[Dashboard] Active tab saved successfully');
        })
        .catch(error => {
          console.error('[Dashboard] Failed to save active tab:', error);
        });
    } else {
      console.log('[Dashboard] Skipping save - isInitial:', isInitialLoadRef.current, 'user:', !!user?.id, 'tab:', activeTab);
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
    if (connectionStatus === 'CONNECTED') {
      startNewsPolling();
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connectionStatus])

    // Load user tab states on dashboard mount (optional)
    React.useEffect(() => {
      loadTabState().catch(error => {
        console.error('Failed to load tab states:', error);
      });
    }, [loadTabState]);

    return (
      <div className="relative h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-gradient-to-br dark:from-[#19235d] dark:via-black dark:to-[#19235d] overflow-hidden flex flex-col transition-colors duration-300">
        {/* Loading Overlay - Render at root level to avoid layout constraints */}
        {showLoader && (
          <LoadingOverlay
            status={connectionStatus}
            connectionAttempts={connectionAttempts}
            onRetry={retryAllConnections}
          />
        )}

        {/* Navbar - pass tab state for centered navbar buttons */}
        <Navbar activeTab={activeTab || 'analysis'} onChangeTab={setActiveTab} />

        {/* Main Content - Takes remaining screen height */}
        <main className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 mt-10">
          {/* Tabs moved to Navbar */}

          {/* Don't render content until activeTab is loaded */}
          {!activeTab ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : activeTab === 'analysis' ? (
            <>
              {/* Mobile Layout - Stack vertically */}
              <div className="block lg:hidden space-y-4">
                {/* Section 1 - Trending Pairs */}
                <div className="h-64">
                  <TrendingPairs />
                </div>

                {/* Section 2 - RSI Tracker */}
                <div className="h-64">
                  <RSIOverboughtOversoldTracker />
                </div>

                {/* Section 3 - Currency Strength Meter */}
                <div className="h-80">
                  <CurrencyStrengthMeter />
                </div>

                {/* Section 4 - AI News Analysis */}
                <div className="h-80">
                  <AINewsAnalysis />
                </div>
              </div>

              {/* Desktop Layout - 12x12 grid */}
              <div className="hidden lg:grid h-full grid-cols-12 grid-rows-12 gap-2">
                {/* Section 1 - TradingChart Widget (75% width - top left) */}
                <div className="col-span-9 row-span-8 min-h-0 flex flex-col">
                  {useAdvancedTradingViewWidget ? (
                    <TradingChart />
                  ) : (
                    <TradingViewWidget 
                      initialSymbol="OANDA:XAUUSD" 
                      initialInterval="60"
                      height="100%"
                      className="h-full"
                    />
                  )}
                </div>

                {/* Right Top: Trending Pairs over RSI (combined height == TradingView) */}
                <div className="col-span-3 row-span-8 min-h-0 flex flex-col gap-2">
                  <div className="flex-1 min-h-0">
                    <TrendingPairs />
                  </div>
                  <div className="flex-1 min-h-0">
                    <RSIOverboughtOversoldTracker />
                  </div>
                </div>

                {/* Section 2nd - Currency Strength Meter (75% width - bottom left) */}
                <div className="col-span-9 row-span-4 row-start-9">
                  <CurrencyStrengthMeter />
                </div>

                {/* Right Bottom: AI News Analysis (height == Currency Strength Meter) */}
                <div className="col-span-3 row-span-4 row-start-9">
                  <AINewsAnalysis />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tools Tab Content */}
              {/* Mobile: natural stacking, Desktop: 55/45 height distribution */}
              <div className="tools-container gap-2">
                {/* Upper Row: Lot Size + Multi Time Analysis (55% height) */}
                {/* Mobile: order-1 (Lot Size), order-3 (Multi Time), Desktop: side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:h-[55%] lg:min-h-0">
                  {/* Left: Lot Size Calculator */}
                  <div className="widget-card p-2 tools-card-upper order-1">
                    <div className="tools-scroll-container">
                      <LotSizeCalculator />
                    </div>
                  </div>

                  {/* Right: Multi Time Analysis */}
                  <div className="widget-card p-2 tools-card-upper order-3 lg:order-2">
                    <div className="tools-scroll-container">
                      <MultiTimeAnalysis />
                    </div>
                  </div>
                </div>

                {/* Lower Row: Quantum Analysis (45% height) */}
                {/* Mobile: order-2 (second), Desktop: spans full width */}
                <div className="widget-card p-1 tools-card-lower order-2 lg:order-3">
                  <div className="tools-scroll-container">
                    <MultiIndicatorHeatmap />
                  </div>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    )
  }

  export default Dashboard
