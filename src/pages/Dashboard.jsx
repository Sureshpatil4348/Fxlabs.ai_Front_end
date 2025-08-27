import React from 'react'
import { useAuth } from '../auth/AuthProvider'
import RSICorrelationDashboard from '../components/RSICorrelationDashboard'
import RSIOverboughtOversoldTracker from '../components/RSIOverboughtOversoldTracker'
import CurrencyStrengthMeter from '../components/CurrencyStrengthMeter'
import AINewsAnalysis from '../components/AINewsAnalysis'
import WishlistPanel from '../components/WishlistPanel'
import LoadingOverlay from '../components/LoadingOverlay'
import UserProfileDropdown from '../components/UserProfileDropdown'
import useMarketStore from '../store/useMarketStore'
import useBaseMarketStore from '../store/useBaseMarketStore'

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
    <div className="min-h-screen bg-gray-100">
      {/* Loading Overlay - Render at root level to avoid layout constraints */}
      {showLoader && (
        <LoadingOverlay
          status={connectionStatus}
          connectionAttempts={connectionAttempts}
          dashboardConnections={dashboardConnections}
          onRetry={retryAllConnections}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col ml-2 items-center justify-center">
                <div className="text-green-500 font-bold text-2xl leading-none">FX<span className="text-gray-500 font-normal">LABS</span></div>
                <div className="text-gray-500 text-xs leading-none">Decode the market</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - RSI Correlation Dashboard */}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Section 3: Currency Strength Meter */}
          <CurrencyStrengthMeter />
          
          {/* Section 4: AI-Based News Analysis */}
          <AINewsAnalysis />
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>FXLabs.AI Dashboard v1.0 - Advanced Forex Analysis Platform</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
