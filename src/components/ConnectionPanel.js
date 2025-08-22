import React from 'react';
import useMarketStore from '../store/useMarketStore';
import { Wifi, WifiOff, Loader } from 'lucide-react';

const ConnectionPanel = () => {
  const { 
    isConnected, 
    isConnecting, 
    connectionError, 
    connect, 
    disconnect 
  } = useMarketStore();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Connection</h2>
        <div className="flex items-center space-x-2">
          {isConnecting ? (
            <Loader className="w-4 h-4 text-primary-600 animate-spin" />
          ) : isConnected ? (
            <Wifi className="w-4 h-4 text-success-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-danger-600" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className={`p-3 rounded-md border ${
          isConnected 
            ? 'status-connected' 
            : isConnecting 
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'status-disconnected'
        }`}>
          <div className="text-sm font-medium">
            {isConnecting 
              ? 'Connecting...' 
              : isConnected 
                ? 'Connected to MT5 Server' 
                : 'Disconnected'
            }
          </div>
          {connectionError && (
            <div className="text-xs mt-1 text-danger-600">
              {connectionError}
            </div>
          )}
        </div>

        {/* Server Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div><strong>Server:</strong> localhost:8000</div>
          <div><strong>Protocol:</strong> WebSocket</div>
          <div><strong>Endpoint:</strong> /ws/market</div>
        </div>

        {/* Connection Controls */}
        <div className="flex space-x-2">
          {isConnected ? (
            <button 
              onClick={disconnect}
              className="btn-danger flex-1"
            >
              Disconnect
            </button>
          ) : (
            <button 
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary flex-1"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;
