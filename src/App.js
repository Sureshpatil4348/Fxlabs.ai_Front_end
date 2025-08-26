import React, { useEffect } from 'react';
import useMarketStore from './store/useMarketStore';
import RSICorrelationDashboard from './components/RSICorrelationDashboard';
import RSIOverboughtOversoldTracker from './components/RSIOverboughtOversoldTracker';
import CurrencyStrengthMeter from './components/CurrencyStrengthMeter';
import AINewsAnalysis from './components/AINewsAnalysis';
import WishlistPanel from './components/WishlistPanel';
import GlobalSettingsPanel from './components/GlobalSettingsPanel';
import { Activity } from 'lucide-react';

function App() {
  const { connect, isConnected, fetchNews } = useMarketStore();

  useEffect(() => {
    // Auto-connect on app start
    if (!isConnected) {
      setTimeout(() => connect(), 1000);
    }
  }, [connect, isConnected]);

  useEffect(() => {
    // Fetch news data on app start and every 5 minutes
    fetchNews();
    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, [fetchNews]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  FXLabs.AI Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Advanced Forex Analysis & RSI Correlation Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className={`w-5 h-5 ${isConnected ? 'text-success-500' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isConnected ? 'text-success-700' : 'text-gray-500'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Settings Panel */}
        <GlobalSettingsPanel />
        {/* Top Row - RSI Correlation Dashboard & RSI Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Section 1: RSI Correlation Dashboard */}
          <div className="lg:col-span-2">
            <RSICorrelationDashboard />
          </div>
          
          {/* Section 2: RSI Oversold/Overbought Tracker + Section 5: Wishlist */}
          <div className="space-y-6">
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
            <p>FXLabs.AI Dashboard v2.0 - Advanced Forex Analysis Platform</p>
            <p className="mt-1">
              Connected to: <code className="bg-gray-100 px-2 py-1 rounded">wss://api.fxlabs.ai/ws/market</code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
