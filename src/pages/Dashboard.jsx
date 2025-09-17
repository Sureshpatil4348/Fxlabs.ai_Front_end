  import React from 'react'

  import { useAuth } from '../auth/AuthProvider'
  import AINewsAnalysis from '../components/AINewsAnalysis'
  import LoadingOverlay from '../components/LoadingOverlay'
  import MultiIndicatorHeatmap from '../components/MultiIndicatorHeatmap'
  import Navbar from '../components/Navbar'
  import RSICorrelationDashboard from '../components/RSICorrelationDashboard'
  import RSIOverboughtOversoldTracker from '../components/RSIOverboughtOversoldTracker'
  import WishlistPanel from '../components/WishlistPanel'
  import useBaseMarketStore from '../store/useBaseMarketStore'
  import useMarketStore from '../store/useMarketStore'

  const Dashboard = () => {
    const { user } = useAuth()
    const { retryAllConnections } = useMarketStore()
    const connectionInitiated = React.useRef(false)
    
    // Subscribe only to the specific parts we need for rendering
    const showLoader = useMarketStore(state => state.globalConnectionState.showLoader)
    const connectionStatus = useMarketStore(state => state.globalConnectionState.status)
    const connectionAttempts = useMarketStore(state => state.globalConnectionState.connectionAttempts)
    const dashboardConnections = useMarketStore(state => state.globalConnectionState.dashboardConnections)

  const { loadTabState, tabStateHasLoaded } = useBaseMarketStore();

    React.useEffect(() => {
      // Only reset if we're dealing with a different user
      if (user?.id && connectionInitiated.current !== user.id) {
        connectionInitiated.current = user.id
        useMarketStore.getState().initiateGlobalConnection()
      }
    }, [user?.id])

    React.useEffect(() => {
      useBaseMarketStore.getState().fetchNews()
      const newsInterval = setInterval(() => {
        useBaseMarketStore.getState().fetchNews()
      }, 5 * 60 * 1000)
      return () => clearInterval(newsInterval)
    }, [])

    // Load user tab states on dashboard mount
    React.useEffect(() => {
      loadTabState().catch(error => {
        console.error('Failed to load tab states:', error);
      });
    }, [loadTabState]);

    // Wait for user tab state to load before rendering widgets so their initial state matches persisted preferences
    if (!tabStateHasLoaded) {
      return (
        <div className="relative h-screen bg-gray-100 overflow-hidden flex items-center justify-center">
          <div className="text-center text-sm text-gray-600">Loading your dashboard preferences…</div>
        </div>
      )
    }

    return (
      <div className="relative h-screen bg-gray-100 overflow-hidden flex flex-col">
        {/* Loading Overlay - Render at root level to avoid layout constraints */}
        {showLoader && (
          <LoadingOverlay
            status={connectionStatus}
            connectionAttempts={connectionAttempts}
            dashboardConnections={dashboardConnections}
            onRetry={retryAllConnections}
          />
        )}

        {/* Navbar */}
        <Navbar />

        {/* Main Content - Takes remaining screen height */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3">
          {/* Dashboard Grid - Original layout restored */}
          <div className="h-full grid grid-cols-12 grid-rows-12 gap-2">
            
            {/* Section 1 - Multi Indicator Heatmap (largest area - top left) */}
            <div className="col-span-7 row-span-7 min-h-0">
              <MultiIndicatorHeatmap selectedSymbol="EURUSDm" />
            </div>

            {/* Section 3rd - RSI Tracker (top right) */}
            <div className="col-span-5 row-span-4">
              <RSIOverboughtOversoldTracker />
            </div>

            {/* Section 4th - Wishlist Panel (middle right) */}
            <div className="col-span-5 row-span-3">
              <WishlistPanel />
            </div>

            {/* Section 2nd - RSI Correlation Dashboard (bottom left) */}
            <div className="col-span-7 row-span-5 row-start-8">
              <RSICorrelationDashboard />
            </div>

            {/* Section 5th - AI News Analysis (bottom right) - Increased height */}
            <div className="col-span-5 row-span-5 row-start-8">
              <AINewsAnalysis />
            </div>

          </div>

        </main>
      </div>
    )
  }

  export default Dashboard
