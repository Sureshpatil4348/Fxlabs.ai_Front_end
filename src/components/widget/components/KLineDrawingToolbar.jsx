import React, { useState, useCallback } from 'react';

export const KLineDrawingToolbar = ({ chartRef, onToolChange }) => {
  const [activeTool, setActiveTool] = useState(null);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  const drawingTools = [
    {
      id: 'trendLine',
      name: 'Trend Line',
      icon: '📈',
      description: 'Draw trend lines between two points'
    },
    {
      id: 'horizontalLine',
      name: 'Horizontal Line',
      icon: '➖',
      description: 'Draw horizontal support/resistance lines'
    },
    {
      id: 'verticalLine',
      name: 'Vertical Line',
      icon: '⬆️',
      description: 'Draw vertical time markers'
    },
    {
      id: 'fibonacci',
      name: 'Fib Retracement',
      icon: '🌀',
      description: 'Draw Fibonacci retracement levels'
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      icon: '⬜',
      description: 'Draw rectangular zones'
    },
    {
      id: 'text',
      name: 'Text',
      icon: '📝',
      description: 'Add text annotations'
    },
    {
      id: 'arrow',
      name: 'Arrow',
      icon: '➡️',
      description: 'Draw arrows for annotations'
    }
  ];

  const handleToolSelect = useCallback((toolId) => {
    if (activeTool === toolId) {
      // Deselect if already active
      setActiveTool(null);
      if (chartRef.current && chartRef.current._handleDrawingToolChange) {
        try {
          // Use the chart's built-in drawing tool handler
          chartRef.current._handleDrawingToolChange(null);
          console.log('📈 Drawing tool deactivated');
        } catch (error) {
          console.warn('📈 Error deactivating drawing tool:', error);
        }
      }
      if (onToolChange) {
        onToolChange(null);
      }
    } else {
      // Select new tool
      setActiveTool(toolId);
      if (chartRef.current && chartRef.current._handleDrawingToolChange) {
        try {
          // Use the chart's built-in drawing tool handler
          chartRef.current._handleDrawingToolChange(toolId);
          console.log('📈 Drawing tool activated:', toolId);
        } catch (error) {
          console.warn('📈 Error activating drawing tool:', error);
        }
      }
      if (onToolChange) {
        onToolChange(toolId);
      }
    }
    setIsToolsDropdownOpen(false); // Close dropdown after selection
  }, [activeTool, chartRef, onToolChange]);

  const clearAllDrawings = useCallback(() => {
    if (chartRef.current) {
      try {
        // Clear all overlays using the correct API
        const overlays = chartRef.current.getAllOverlays();
        overlays.forEach(overlay => {
          chartRef.current.removeOverlay(overlay.id);
        });
        setActiveTool(null); // Clear active tool after removing all drawings
        console.log('📈 All drawings cleared');
      } catch (error) {
        console.warn('📈 Error clearing drawings:', error);
      }
    }
  }, [chartRef]);

  const exportDrawings = useCallback(() => {
    if (chartRef.current) {
      try {
        const drawings = chartRef.current.getAllOverlays();
        const dataStr = JSON.stringify(drawings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `drawings_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('📈 Drawings exported:', drawings.length);
      } catch (error) {
        console.warn('📈 Error exporting drawings:', error);
      }
    }
  }, [chartRef]);

  return (
    <div className="relative flex items-center gap-1 p-1 bg-gray-50 border-b border-gray-200">
      {/* Drawing Tools Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
          className={`
            flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border transition-colors
            ${activeTool 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }
          `}
          title="Select drawing tool"
        >
          <span className="text-xs">🛠️</span>
          <span>
            {activeTool 
              ? drawingTools.find(t => t.id === activeTool)?.name 
              : 'Drawing Tools'
            }
          </span>
          <svg 
            className={`w-3 h-3 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isToolsDropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsToolsDropdownOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsToolsDropdownOpen(false);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Close dropdown"
            />
            
            {/* Dropdown Content */}
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-64 overflow-y-auto">
              {drawingTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
                    ${activeTool === tool.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  </div>
                  {activeTool === tool.id && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={clearAllDrawings}
          className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded border border-red-500 hover:bg-red-600 transition-colors"
          title="Clear all drawings"
        >
          🗑️ Clear
        </button>
        
        <button
          onClick={exportDrawings}
          className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-green-500 text-white rounded border border-green-500 hover:bg-green-600 transition-colors"
          title="Export drawings"
        >
          💾 Export
        </button>
      </div>

      {/* Instructions */}
      {activeTool && (
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 rounded-b p-2 text-xs text-blue-700 z-10">
          <strong>{drawingTools.find(t => t.id === activeTool)?.name}:</strong>{' '}
          {drawingTools.find(t => t.id === activeTool)?.description}
        </div>
      )}
    </div>
  );
};
