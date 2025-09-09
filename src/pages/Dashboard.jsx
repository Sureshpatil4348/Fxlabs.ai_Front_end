  import React from 'react'

  import { useAuth } from '../auth/AuthProvider'
  import AINewsAnalysis from '../components/AINewsAnalysis'
  import CurrencyStrengthMeter from '../components/CurrencyStrengthMeter'
  import LoadingOverlay from '../components/LoadingOverlay'
  import Navbar from '../components/Navbar'
  import RSICorrelationDashboard from '../components/RSICorrelationDashboard'
  import RSIOverboughtOversoldTracker from '../components/RSIOverboughtOversoldTracker'
  import UserProfileDropdown from '../components/UserProfileDropdown'
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column - RSI Correlation Dashboard (2 columns) */}
            <div className="lg:col-span-2">
              <RSICorrelationDashboard />
            </div>

            {/* Right Column - RSI Tracker and Wishlist */}
            <div className="flex flex-col space-y-7 h-full">
              <RSIOverboughtOversoldTracker />
              <WishlistPanel />
            </div>
          </div>

          {/* Bottom Row - Currency Strength & News Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-[700px]">
            {/* Section 3: Currency Strength Meter (2 columns) */}
            <div className="lg:col-span-2">
              <CurrencyStrengthMeter />
            </div>
            
            {/* Section 4: AI-Based News Analysis (1 column) */}
            <div>
              <AINewsAnalysis />
            </div>
          </div>

          {/* Footer */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-16 z-9 relative">
            <div className="text-center text-sm text-white">
              <p>FXLabs.AI Dashboard v1.0 - Advanced Forex Analysis Platform</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  export default Dashboard
