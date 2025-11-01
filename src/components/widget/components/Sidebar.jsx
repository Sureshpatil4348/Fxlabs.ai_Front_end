import React from 'react';

import { useDrawingTools } from '../hooks/useDrawingTools';
import { useChartStore } from '../stores/useChartStore';

export const Sidebar = () => {
  const { 
    settings, 
    setCursorType,
    klineChartRef
  } = useChartStore();
  
  const {
    activeTool,
    setActiveTool
  } = useDrawingTools();

  // KLine drawing tools handlers
  const handleKLineToolSelect = (toolId) => {
    if (klineChartRef && klineChartRef._handleDrawingToolChange) {
      try {
        klineChartRef._handleDrawingToolChange(toolId);
        setActiveTool(toolId);
        console.log('📈 KLine Drawing tool activated:', toolId);
      } catch (error) {
        console.warn('📈 Error activating KLine drawing tool:', error);
      }
    }
  };
  
  const handleKLineClearAll = () => {
    if (!window.confirm('Clear all drawings? This cannot be undone.')) {
      return;
    }
    if (klineChartRef) {
      try {
        const overlays = klineChartRef.getAllOverlays();
        overlays.forEach(overlay => {
          klineChartRef.removeOverlay(overlay.id);
        });
        console.log('📈 All KLine drawings cleared');
      } catch (error) {
        console.warn('📈 Error clearing KLine drawings:', error);
      }
    }
  };
  
  return (
    <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2 h-full min-h-0 overflow-y-auto">
      {/* K-Line Tools: icon-only buttons */}
      <div className="relative group">
        <button
          onClick={() => handleKLineToolSelect('trendLine')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'trendLine' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Trend Line"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Trend Line
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => handleKLineToolSelect('horizontalLine')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'horizontalLine' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Horizontal Line"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 12h16" />
            </svg>
          </div>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Horizontal Line
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => handleKLineToolSelect('verticalLine')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'verticalLine' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Vertical Line"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-sky-700 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16" />
            </svg>
          </div>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Vertical Line
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => handleKLineToolSelect('fibonacci')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'fibonacci' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Fibonacci"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M3 4h18" />
            </svg>
          </div>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Fibonacci
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => handleKLineToolSelect('rectangle')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'rectangle' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Rectangle"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-700 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4h16v16H4z" />
            </svg>
          </div>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Rectangle
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => handleKLineToolSelect('text')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'text' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Text"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-700 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Text
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => handleKLineToolSelect('arrow')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'arrow' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Arrow"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Arrow
        </div>
      </div>

      {/* Clear All drawings icon */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleKLineClearAll}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all text-red-500 hover:text-red-600"
          title="Clear All"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Clear All
        </div>
      </div>

      {/* Divider between tools and cursor types */}
      <div className="w-8 border-t border-gray-200 my-1" />

      {/* Cursor Types: icon-only buttons */}
      <div className="relative group">
        <button
          onClick={() => setCursorType('crosshair')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            settings.cursorType === 'crosshair' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Crosshair"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Crosshair
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => setCursorType('pointer')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            settings.cursorType === 'pointer' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Pointer
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => setCursorType('grab')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            settings.cursorType === 'grab' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Grab"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Grab
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => setCursorType('text')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            settings.cursorType === 'text' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Text"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Text
        </div>
      </div>
    </div>
  );
};
