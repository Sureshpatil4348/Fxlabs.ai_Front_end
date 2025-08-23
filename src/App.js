import React, { useEffect } from 'react';
import useMarketStore from './store/useMarketStore';
import ConnectionPanel from './components/ConnectionPanel';
import SubscriptionPanel from './components/SubscriptionPanel';
import MarketDataPanel from './components/MarketDataPanel';
import LogsPanel from './components/LogsPanel';
import { Activity } from 'lucide-react';
import navLogo from './assets/nav-logo.jpeg';

function App() {
  const { connect, isConnected } = useMarketStore();

  useEffect(() => {
    // Auto-connect on app start
    if (!isConnected) {
      setTimeout(() => connect(), 1000);
    }
  }, [connect, isConnected]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className='w-40 h-10'>
                <img src={navLogo} alt="Market Data Dashboard" className='w-full h-full object-contain' />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Market Data Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time Forex data visualization
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
        {/* Top Section - Controls and Market Data */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <ConnectionPanel />
            <SubscriptionPanel />
          </div>

          {/* Expanded Market Data Panel */}
          <div className="lg:col-span-3">
            <MarketDataPanel />
          </div>
        </div>

        {/* Bottom Section - Activity Logs (on large screens) */}
        <div className="lg:block">
          <LogsPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>MT5 Market Data Dashboard v1.0</p>
            <p className="mt-1">
              Connected to: <code className="bg-gray-100 px-2 py-1 rounded">wss://localhost:8000/ws/market</code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
