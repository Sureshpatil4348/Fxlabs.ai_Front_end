  import React from 'react'

  import { useAuth } from '../auth/AuthProvider'
  import AINewsAnalysis from '../components/AINewsAnalysis'
  import LoadingOverlay from '../components/LoadingOverlay'
  import MultiIndicatorHeatmap from '../components/MultiIndicatorHeatmap'
  import Navbar from '../components/Navbar'
  import RSICorrelationDashboard from '../components/RSICorrelationDashboard'
  import RSIOverboughtOversoldTracker from '../components/RSIOverboughtOversoldTracker'
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

  const { loadTabState, tabStateHasLoaded: _tabStateHasLoaded } = useBaseMarketStore();

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

    // Load user tab states on dashboard mount (optional)
    React.useEffect(() => {
      loadTabState().catch(error => {
        console.error('Failed to load tab states:', error);
      });
    }, [loadTabState]);

  return (
    <div className="relative h-screen bg-[#0A0E27] overflow-hidden flex flex-col transition-colors duration-300">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F1629] via-[#0A0E27] to-[#080B1E] pointer-events-none"></div>
      
      {/* Grid pattern overlay for premium feel */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>

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
      <main className="relative flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-5">
        {/* Mobile Layout - Stack vertically */}
        <div className="block lg:hidden space-y-4">
          {/* Section 1 - Multi Indicator Heatmap */}
          <div className="h-96 overflow-hidden">
            <MultiIndicatorHeatmap selectedSymbol="EURUSDm" />
          </div>

          {/* Section 2 - AI News Analysis */}
          <div className="h-80">
            <AINewsAnalysis />
          </div>

          {/* Section 3 - RSI Correlation Dashboard */}
          <div className="h-80">
            <RSICorrelationDashboard />
          </div>

          {/* Section 4 - RSI Tracker */}
          <div className="h-64">
            <RSIOverboughtOversoldTracker />
          </div>
        </div>

        {/* Desktop Layout - Enhanced grid with better spacing */}
        <div className="hidden lg:grid h-full grid-cols-12 grid-rows-12 gap-4">
          
          {/* Section 1 - Multi Indicator Heatmap (largest area - top left) */}
          <div className="col-span-7 row-span-7 min-h-0">
            <MultiIndicatorHeatmap selectedSymbol="EURUSDm" />
          </div>

          {/* Section 3rd - AI News Analysis (top right) */}
          <div className="col-span-5 row-span-7">
            <AINewsAnalysis />
          </div>

          {/* Section 2nd - RSI Correlation Dashboard (bottom left) */}
          <div className="col-span-7 row-span-5 row-start-8">
            <RSICorrelationDashboard />
          </div>

          {/* Section 5th - RSI Tracker (bottom right) */}
          <div className="col-span-5 row-span-5 row-start-8">
            <RSIOverboughtOversoldTracker />
          </div>

        </div>

      </main>
    </div>
  )
  }

  export default Dashboard
