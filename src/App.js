import React, { useEffect } from 'react';
import useBaseMarketStore from './store/useBaseMarketStore';
import useMarketStore from './store/useMarketStore';
import RSICorrelationDashboard from './components/RSICorrelationDashboard';
import RSIOverboughtOversoldTracker from './components/RSIOverboughtOversoldTracker';
import CurrencyStrengthMeter from './components/CurrencyStrengthMeter';
import AINewsAnalysis from './components/AINewsAnalysis';
import WishlistPanel from './components/WishlistPanel';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const { fetchNews } = useBaseMarketStore();
  const { 
    globalConnectionState, 
    initiateGlobalConnection, 
    retryAllConnections 
  } = useMarketStore();

  useEffect(() => {
    // Fetch news data on app start and every 5 minutes
    fetchNews();
    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, [fetchNews]);

  useEffect(() => {
    // Initiate global connection on app start
    initiateGlobalConnection();
  }, [initiateGlobalConnection]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {globalConnectionState.showLoader && (
        <LoadingOverlay
          status={globalConnectionState.status}
          connectionAttempts={globalConnectionState.connectionAttempts}
          dashboardConnections={globalConnectionState.dashboardConnections}
          onRetry={retryAllConnections}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex flex-cols items-center space-x-2">
                <div className="flex flex-col ml-2 items-center justify-center">
                  <div className="text-green-500 font-bold text-2xl leading-none">FX<span className="text-gray-500 font-normal">LABS</span></div>
                  <div className="text-gray-500 text-xs leading-none">Decode the market</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Row - RSI Correlation Dashboard & RSI Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Section 1: RSI Correlation Dashboard */}
          <div className="lg:col-span-2">
            <RSICorrelationDashboard />
          </div>
          
          {/* Section 2: RSI Oversold/Overbought Tracker + Section 5: Wishlist */}
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>FXLabs.AI Dashboard v1.0 - Advanced Forex Analysis Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
