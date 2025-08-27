import React from 'react';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const LoadingOverlay = ({ status, connectionAttempts, onRetry, dashboardConnections }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'INITIALIZING':
        return {
          title: 'Initializing FXLabs Dashboard',
          message: 'Preparing to connect to market data servers...',
          icon: <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />,
          showProgress: false
        };
      case 'CONNECTING':
        return {
          title: 'Connecting to Servers',
          message: 'Establishing connections to market data feeds...',
          icon: <Wifi className="w-8 h-8 text-blue-500 animate-pulse" />,
          showProgress: true
        };
      case 'RETRYING':
        return {
          title: 'Server Connection Timeout',
          message: `Retrying connection... (Attempt ${connectionAttempts}/2)`,
          icon: <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />,
          showProgress: true
        };
      case 'FAILED':
        return {
          title: 'Connection Failed',
          message: 'Unable to connect to market data servers. Please check your connection or contact administrator.',
          icon: <WifiOff className="w-8 h-8 text-red-500" />,
          showProgress: false
        };
      default:
        return {
          title: 'Loading',
          message: 'Please wait...',
          icon: <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />,
          showProgress: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  const getDashboardStatus = (dashboardKey, dashboardName) => {
    const dashboard = dashboardConnections[dashboardKey];
    if (!dashboard) return { icon: '⚪', status: 'Waiting', color: 'text-gray-500' };
    
    if (dashboard.connected) {
      return { icon: '✅', status: 'Connected', color: 'text-green-600' };
    } else if (dashboard.connecting) {
      return { icon: '🔄', status: 'Connecting...', color: 'text-blue-600' };
    } else if (dashboard.error) {
      return { icon: '❌', status: 'Failed', color: 'text-red-600' };
    } else {
      return { icon: '⚪', status: 'Waiting', color: 'text-gray-500' };
    }
  };

  const connectedCount = Object.values(dashboardConnections).filter(d => d.connected).length;
  const totalCount = Object.keys(dashboardConnections).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            {statusInfo.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {statusInfo.title}
          </h2>
          <p className="text-gray-600 text-sm">
            {statusInfo.message}
          </p>
        </div>

        {/* Progress Bar */}
        {statusInfo.showProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Connection Progress</span>
              <span>{connectedCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(connectedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Dashboard Connection Status */}
        {statusInfo.showProgress && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dashboard Connections:</h3>
            
            {[
              { key: 'rsiCorrelation', name: 'Securing connection 1' },
              { key: 'rsiTracker', name: 'Securing connection 2' },
              { key: 'currencyStrength', name: 'Securing connection 3' }
            ].map(({ key, name }) => {
              const dashboardStatus = getDashboardStatus(key, name);
              return (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{dashboardStatus.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                  </div>
                  <span className={`text-xs font-medium ${dashboardStatus.color}`}>
                    {dashboardStatus.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {status === 'FAILED' && (
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
            
            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {(status === 'CONNECTING' || status === 'RETRYING') && (
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {status === 'FAILED' && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <p className="font-medium mb-1">Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your internet connection</li>
                  <li>Verify server status</li>
                  <li>Try refreshing the page</li>
                  <li>Contact support if issue persists</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
