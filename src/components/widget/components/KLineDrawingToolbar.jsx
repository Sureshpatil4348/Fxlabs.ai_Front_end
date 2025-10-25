import React, { useState, useCallback } from 'react';

export const KLineDrawingToolbar = ({ chartRef, onToolChange }) => {
  const [activeTool, setActiveTool] = useState(null);

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
      id: 'fibonacci',
      name: 'Fibonacci',
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
    <div className="flex flex-wrap gap-1 p-1 bg-gray-50 border-b border-gray-200">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-gray-600 mr-1">Tools:</span>
        {drawingTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className={`
              flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded border transition-colors
              ${activeTool === tool.id 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }
            `}
            title={tool.description}
          >
            <span>{tool.icon}</span>
            <span>{tool.name}</span>
          </button>
        ))}
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
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 rounded-b p-2 text-xs text-blue-700">
          <strong>{drawingTools.find(t => t.id === activeTool)?.name}:</strong>{' '}
          {drawingTools.find(t => t.id === activeTool)?.description}
        </div>
      )}
    </div>
  );
};
