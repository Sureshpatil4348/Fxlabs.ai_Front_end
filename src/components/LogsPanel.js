import React, { useEffect, useRef } from 'react';
import useMarketStore from '../store/useMarketStore';
import { ScrollText, Trash2, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const LogsPanel = () => {
  const { logs, clearLogs } = useMarketStore();
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  const scrollToBottom = () => {
    // Only scroll within the logs container, not the entire page
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-primary-600" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-success-700 bg-success-50 border-success-200';
      case 'error':
        return 'text-danger-700 bg-danger-50 border-danger-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-primary-700 bg-primary-50 border-primary-200';
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ScrollText className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {logs.length}
          </span>
        </div>
        
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="text-gray-500 hover:text-danger-600 p-1"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <ScrollText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No activity logs yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Connect to start seeing logs
            </p>
          </div>
        ) : (
          <div ref={logsContainerRef} className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-md border text-sm ${getLogColor(log.type)}`}
              >
                <div className="flex items-start space-x-2">
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium break-words">
                      {log.message}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Log Statistics */}
      {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Success:</span>
              <span className="text-success-600 font-medium">
                {logs.filter(log => log.type === 'success').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Errors:</span>
              <span className="text-danger-600 font-medium">
                {logs.filter(log => log.type === 'error').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Warnings:</span>
              <span className="text-yellow-600 font-medium">
                {logs.filter(log => log.type === 'warning').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Info:</span>
              <span className="text-primary-600 font-medium">
                {logs.filter(log => log.type === 'info').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPanel;
