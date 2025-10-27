import React, { useState } from 'react';

import { useDrawingTools } from '../hooks/useDrawingTools';
import { useChartStore } from '../stores/useChartStore';

export const Sidebar = () => {
  const { 
    settings, 
    setChartType,
    setCursorType,
    klineChartRef
  } = useChartStore();
  
  const {
    activeTool,
    setActiveTool,
    clearAllDrawings
  } = useDrawingTools();
  
  const [activeSection, setActiveSection] = useState(null);
  
  // Check if we're in candlestick mode
  const isCandlestickMode = settings.chartType === 'candlestick';

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };
  
  // KLine drawing tools handlers
  const handleKLineToolSelect = (toolId) => {
    if (klineChartRef && klineChartRef._handleDrawingToolChange) {
      try {
        klineChartRef._handleDrawingToolChange(toolId);
        console.log('📈 KLine Drawing tool activated:', toolId);
        setActiveSection(null);
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
        setActiveSection(null);
      } catch (error) {
        console.warn('📈 Error clearing KLine drawings:', error);
      }
    }
  };

  return (
    <div className="w-12 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
      {/* Chart Type Button */}
      <div className="relative">
        <button
          onClick={() => toggleSection('chartTypes')}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
            activeSection === 'chartTypes'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Chart Types"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[10px] mt-1">Type</span>
        </button>

        {/* Chart Types Dropdown */}
        {activeSection === 'chartTypes' && (
          <div className="absolute left-12 top-0 ml-2 w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 mb-1">Chart Type</div>
              
              <button
                onClick={() => { setChartType('candlestick'); setActiveSection(null); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  settings.chartType === 'candlestick' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium">Candlestick</span>
                {settings.chartType === 'candlestick' && (
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => { 
                  console.log('🖱️ Sidebar: Line Chart button clicked'); 
                  setChartType('line'); 
                  setActiveSection(null); 
                  console.log('✅ Sidebar: Chart type set to line');
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  settings.chartType === 'line' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-sm font-medium">Line Chart</span>
                {settings.chartType === 'line' && (
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Drawing Tools Button */}
      <div className="relative">
        <button
          onClick={() => toggleSection('drawing')}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
            activeSection === 'drawing'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Drawing Tools"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="text-[10px] mt-1">Draw</span>
        </button>

        {/* Drawing Tools Dropdown */}
        {activeSection === 'drawing' && (
          <div className="absolute left-12 top-0 ml-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 sticky top-0 bg-white z-10 pb-1.5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-900">
                  {isCandlestickMode ? 'K-Line Tools' : 'Drawing Tools'}
                </h3>
                <button
                  onClick={() => setActiveSection(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isCandlestickMode ? (
                // KLine-specific drawing tools
                <div className="space-y-1">
                  {/* Trend Line Tool */}
                  <button
                    onClick={() => handleKLineToolSelect('trendLine')}
                    className="w-full p-2 rounded-lg border transition-all hover:shadow-md border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">Trend Line</p>
                        <p className="text-[9px] text-gray-500">Draw trend lines</p>
                      </div>
                    </div>
                  </button>

                  {/* Horizontal Line Tool */}
                  <button
                    onClick={() => handleKLineToolSelect('horizontalLine')}
                    className="w-full p-2 rounded-lg border transition-all hover:shadow-md border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-md flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 12h16" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">Horizontal Line</p>
                        <p className="text-[9px] text-gray-500">Support/resistance</p>
                      </div>
                    </div>
                  </button>

                  {/* Fibonacci Tool */}
                  <button
                    onClick={() => handleKLineToolSelect('fibonacci')}
                    className="w-full p-2 rounded-lg border transition-all hover:shadow-md border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-md flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M3 4h18" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">Fibonacci</p>
                        <p className="text-[9px] text-gray-500">Retracement levels</p>
                      </div>
                    </div>
                  </button>

                  {/* Rectangle Tool */}
                  <button
                    onClick={() => handleKLineToolSelect('rectangle')}
                    className="w-full p-2 rounded-lg border transition-all hover:shadow-md border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-700 rounded-md flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4h16v16H4z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">Rectangle</p>
                        <p className="text-[9px] text-gray-500">Draw zones</p>
                      </div>
                    </div>
                  </button>

                  {/* Text Tool */}
                  <button
                    onClick={() => handleKLineToolSelect('text')}
                    className="w-full p-2 rounded-lg border transition-all hover:shadow-md border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-700 rounded-md flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">Text</p>
                        <p className="text-[9px] text-gray-500">Add annotations</p>
                      </div>
                    </div>
                  </button>

                  {/* Arrow Tool */}
                  <button
                    onClick={() => handleKLineToolSelect('arrow')}
                    className="w-full p-2 rounded-lg border transition-all hover:shadow-md border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-md flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">Arrow</p>
                        <p className="text-[9px] text-gray-500">Point directions</p>
                      </div>
                    </div>
                  </button>

                  {/* Clear All KLine Drawings */}
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={handleKLineClearAll}
                      className="w-full p-1.5 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-center space-x-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-[11px] font-semibold">Clear All</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                // Original drawing tools for non-candlestick charts
                <div className="space-y-1">
                {/* Trend Line Tool */}
                <button
                  onClick={() => { 
                    setActiveTool('TrendLine'); 
                    setActiveSection(null);
                    console.log('🎨 Drawing Tool: Trend Line selected');
                  }}
                  className={`w-full p-2 rounded-lg border transition-all hover:shadow-md ${
                    activeTool === 'TrendLine' ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[11px] font-semibold text-gray-900 leading-tight">Trend Line</p>
                    </div>
                  </div>
                </button>

                {/* Horizontal Line Tool */}
                <button
                  onClick={() => { 
                    setActiveTool('HorizontalLine'); 
                    setActiveSection(null);
                    console.log('🎨 Drawing Tool: Horizontal Line selected');
                  }}
                  className={`w-full p-2 rounded-lg border transition-all hover:shadow-md ${
                    activeTool === 'HorizontalLine' ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-md flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 12h16" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[11px] font-semibold text-gray-900 leading-tight">Horizontal Line</p>
                    </div>
                  </div>
                </button>

                {/* Rectangle Tool */}
                <button
                  onClick={() => { 
                    setActiveTool('Rectangle');
                    setActiveSection(null);
                    console.log('🎨 Drawing Tool: Rectangle selected');
                  }}
                  className={`w-full p-2 rounded-lg border transition-all hover:shadow-md ${
                    activeTool === 'Rectangle' ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-700 rounded-md flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4h16v16H4z" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[11px] font-semibold text-gray-900 leading-tight">Rectangle</p>
                    </div>
                  </div>
                </button>

                {/* Fibonacci Tool */}
                <button
                  onClick={() => { 
                    setActiveTool('Fibonacci'); 
                    setActiveSection(null);
                    console.log('🎨 Drawing Tool: Fibonacci selected');
                  }}
                  className={`w-full p-2 rounded-lg border transition-all hover:shadow-md ${
                    activeTool === 'Fibonacci' ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-md flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M3 4h18" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[11px] font-semibold text-gray-900 leading-tight">Fibonacci</p>
                    </div>
                  </div>
                </button>

                {/* Clear All Drawings */}
                <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Clear all drawings? This cannot be undone.')) {
                        return;
                      }
                      clearAllDrawings(); 
                      setActiveSection(null);
                      console.log('🎨 Drawing Tool: Clear all drawings');
                    }}
                    className="w-full p-1.5 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-[11px] font-semibold">Clear All</span>
                    </div>
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cursor Selector Button */}
      <div className="relative">
        <button
          onClick={() => toggleSection('cursor')}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
            activeSection === 'cursor'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Cursor Type"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span className="text-[10px] mt-1">Cursor</span>
        </button>

        {/* Cursor Selector Dropdown */}
        {activeSection === 'cursor' && (
          <div className="absolute left-12 top-0 ml-2 w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 mb-1">Cursor Type</div>
              
              <button
                onClick={() => {
                  setCursorType('crosshair');
                  setActiveSection(null);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  settings.cursorType === 'crosshair' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span className="text-sm font-medium">Crosshair</span>
                {settings.cursorType === 'crosshair' && (
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  setCursorType('pointer');
                  setActiveSection(null);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  settings.cursorType === 'pointer' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span className="text-sm font-medium">Pointer</span>
                {settings.cursorType === 'pointer' && (
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  setCursorType('grab');
                  setActiveSection(null);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  settings.cursorType === 'grab' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
                <span className="text-sm font-medium">Grab</span>
                {settings.cursorType === 'grab' && (
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  setCursorType('text');
                  setActiveSection(null);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  settings.cursorType === 'text' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-sm font-medium">Text</span>
                {settings.cursorType === 'text' && (
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-gray-300 my-2"></div>

      {/* Fullscreen Button */}
      <button
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
        className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
        title="Fullscreen"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-[10px] mt-1">Full</span>
      </button>
    </div>
  );
};

