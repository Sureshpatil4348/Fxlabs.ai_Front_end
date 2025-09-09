  import React from 'react'

  import { useAuth } from '../auth/AuthProvider'
  import AINewsAnalysis from '../components/AINewsAnalysis'
  import CurrencyStrengthMeter from '../components/CurrencyStrengthMeter'
  import LoadingOverlay from '../components/LoadingOverlay'
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

    return (
      <div className="relative min-h-screen bg-gray-100">
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

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-3">

          {/* Dashboard Grid - Responsive columns based on screen width */}
          <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 lg:gap-3">
            {/* Left Column - RSI Correlation Dashboard and Currency Strength Meter stacked */}
            <div className="lg:col-span-4 xl:col-span-5 2xl:col-span-6 space-y-1">
              <RSICorrelationDashboard />
              <CurrencyStrengthMeter />
            </div>

            {/* Right Column - RSI Tracker, Wishlist, and AI News stacked (even slimmer) */}
            <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2 flex flex-col space-y-1 h-full">
              <RSIOverboughtOversoldTracker />
              <WishlistPanel />
              <AINewsAnalysis />
            </div>
          </div>

          
        </main>
      </div>
    )
  }

  export default Dashboard
