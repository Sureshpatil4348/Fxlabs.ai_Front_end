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
  import useBaseMarketStore from '../store/useBaseMarketStore'
  import useMarketCacheStore from '../store/useMarketCacheStore'
  import useMarketStore from '../store/useMarketStore'

  const Dashboard = () => {
    const { user } = useAuth()
    const { retryAllConnections } = useMarketStore()
    const connectionInitiated = React.useRef(false)
    
    // Subscribe only to the specific parts we need for rendering
    const showLoader = useMarketStore(state => state.globalConnectionState.showLoader)
    const connectionStatus = useMarketStore(state => state.globalConnectionState.status)
    const connectionAttempts = useMarketStore(state => state.globalConnectionState.connectionAttempts)

  const { loadTabState, tabStateHasLoaded: _tabStateHasLoaded } = useBaseMarketStore();
  const [activeTab, setActiveTab] = React.useState('analysis') // 'analysis' | 'tools'

    React.useEffect(() => {
      // Only reset if we're dealing with a different user
      if (user?.id && connectionInitiated.current !== user.id) {
        connectionInitiated.current = user.id
        useMarketStore.getState().initiateGlobalConnection()
        // Initialize centralized market cache (REST + WS)
        useMarketCacheStore.getState().initialize()
      }
    }, [user?.id])

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
      <div className="relative h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900 overflow-hidden flex flex-col transition-colors duration-300">
        {/* Loading Overlay - Render at root level to avoid layout constraints */}
        {showLoader && (
          <LoadingOverlay
            status={connectionStatus}
            connectionAttempts={connectionAttempts}
            onRetry={retryAllConnections}
          />
        )}

        {/* Navbar */}
        <Navbar />

        {/* Main Content - Takes remaining screen height */}
        <main className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 mt-10">
          {/* Tabs - centered */}
          <div className="mb-3 flex items-center gap-2 justify-center">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                activeTab === 'analysis'
                  ? 'bg-blue-500/30 text-blue-800 dark:text-blue-300 border-blue-400/50'
                  : 'bg-white/20 dark:bg-gray-800/20 text-black dark:text-white hover:bg-white/30 dark:hover:bg-gray-700/30 border-white/30 dark:border-gray-700/40'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                activeTab === 'tools'
                  ? 'bg-purple-500/30 text-purple-800 dark:text-purple-300 border-purple-400/50'
                  : 'bg-white/20 dark:bg-gray-800/20 text-black dark:text-white hover:bg-white/30 dark:hover:bg-gray-700/30 border-white/30 dark:border-gray-700/40'
              }`}
            >
              Tools
            </button>
          </div>

          {activeTab === 'analysis' ? (
            <>
              {/* Mobile Layout - Stack vertically */}
              <div className="block lg:hidden ">
                {/* Section 1 - TradingView Widget */}
                <div className="h-96 overflow-hidden">
                  <TradingViewWidget
                    initialSymbol="OANDA:EURUSD"
                    initialInterval="60"
                    height="100%"
                    showControls={true}
                    className="w-full"
                  />
                </div>

                {/* Section 2 - AI News Analysis */}
                <div className="h-80">
                  <AINewsAnalysis />
                </div>

                {/* Section 3 - Currency Strength Meter */}
                <div className="h-80">
                  <CurrencyStrengthMeter />
                </div>

                {/* Section 4 - RSI Tracker */}
                <div className="h-64">
                  <RSIOverboughtOversoldTracker />
                </div>
              </div>

              {/* Desktop Layout - 12x12 grid */}
              <div className="hidden lg:grid h-full grid-cols-12 grid-rows-12 gap-2">
                {/* Section 1 - TradingView Widget (75% width - top left) */}
                <div className="col-span-9 row-span-8 min-h-0 flex flex-col">
                  <TradingViewWidget
                    initialSymbol="OANDA:EURUSD"
                    initialInterval="60"
                    height="100%"
                    showControls={true}
                    className="w-full flex-1"
                  />
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
              <div className="h-full flex flex-col gap-2">
                {/* Grid Layout - Top Two Sections (Trending moved to Analysis) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-0">
                  {/* Top Left - Lot Size Calculator */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-2">
                    <div className="h-full overflow-y-auto">
                      <LotSizeCalculator />
                    </div>
                  </div>

                  {/* Top Right - Multi Time Analysis */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-2">
                    <div className="h-full overflow-y-auto overflow-x-hidden">
                      <MultiTimeAnalysis />
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Multi-Indicator Heatmap */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-shrink-0 p-2" style={{ height: 'calc(60vh - 0.5rem)' }}>
                  <div className="h-full overflow-x-auto">
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
