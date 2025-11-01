import { X, Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { TradingViewHeader } from './components/TradingViewHeader.jsx';
import { UnifiedChart } from './components/UnifiedChart';
import { useChartStore } from './stores/useChartStore';

function TradingChart() {
  const { settings, toggleGrid, setIndicatorsPreset } = useChartStore();
  const [activePreset, setActivePreset] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Carefully selected indicator presets (2-3 pairs only)
  const indicatorPresets = [
    {
      id: 'trend-momentum',
      name: 'Trend + Momentum',
      description: 'EMA 20/200 + RSI + MACD',
      icon: '📈',
      indicators: {
        ema20: true,
        ema200: true,
        rsi: true,
        macd: true,
        atr: false,
        sma50: false,
        sma100: false,
        bollinger: false,
        stoch: false,
        williams: false,
        cci: false,
        obv: false,
        vwap: false,
        change24h: true,
      }
    },
    {
      id: 'volatility-volume',
      name: 'Volatility + Volume',
      description: 'Bollinger Bands + VWAP + ATR',
      icon: '🌊',
      indicators: {
        ema20: false,
        ema200: false,
        rsi: false,
        macd: false,
        atr: true,
        sma50: false,
        sma100: false,
        bollinger: true,
        stoch: false,
        williams: false,
        cci: false,
        obv: false,
        vwap: true,
        change24h: true,
      }
    },
    {
      id: 'complete-analysis',
      name: 'Complete Analysis',
      description: 'EMA 20 + RSI + MACD + Bollinger + VWAP',
      icon: '🎯',
      indicators: {
        ema20: true,
        ema200: false,
        rsi: true,
        macd: true,
        atr: false,
        sma50: false,
        sma100: false,
        bollinger: true,
        stoch: false,
        williams: false,
        cci: false,
        obv: false,
        vwap: true,
        change24h: true,
      }
    }
  ];


  // Handle Escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen]);

  // Prevent body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handlePresetSelect = (preset) => {
    // Toggle: if clicking the same preset, deselect it
    if (activePreset === preset.id) {
      // Reset all preset indicators to false
      const resetIndicators = Object.keys(preset.indicators).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      setIndicatorsPreset(resetIndicators);
      setActivePreset(null);
    } else {
      // Select new preset
      setIndicatorsPreset(preset.indicators);
      setActivePreset(preset.id);
    }
  };

  // Render the main widget content
  const renderWidgetContent = () => (
    <div className="h-full bg-white flex flex-col overflow-hidden border border-gray-200 shadow-lg rounded-lg">
      {/* Header */}
      <TradingViewHeader onFullscreenToggle={() => setIsFullscreen(!isFullscreen)} />
      
      {/* Main Content with Sidebar */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Chart Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <UnifiedChart />
          </div>
          
          {/* Bottom Bar */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 py-1">
            <div className="flex items-center justify-between">
              {/* Left Side - Preset Buttons */}
              <div className="flex items-center">
                <div className="flex items-center gap-1 bg-white">
                  {indicatorPresets.map((preset, index) => (
                    <React.Fragment key={preset.id}>
                      {index > 0 && <div className="h-6 w-px bg-gray-300 mx-2"></div>}
                      <button
                        onClick={() => handlePresetSelect(preset)}
                        className={`px-2.5 py-1 text-[13px] font-medium transition-all duration-200 ${
                          activePreset === preset.id
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-105 rounded-lg'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                        title={preset.description}
                      >
                        {preset.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Right Side - Alert & Grid */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors duration-300 group" title="Alert">
                  <Bell className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                </button>
                <button 
                  onClick={toggleGrid}
                  className={`p-2 transition-colors duration-300 group ${
                    settings.showGrid 
                      ? 'text-emerald-600' 
                      : 'text-gray-400 hover:text-emerald-600'
                  }`}
                  title="Grid"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      {/* Normal view */}
      {!isFullscreen && renderWidgetContent()}

      {/* Fullscreen Modal */}
      {isFullscreen && createPortal(
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="TradingView chart fullscreen"
          onClick={(e) => {
            // Close on backdrop click (but not on widget content)
            if (e.target === e.currentTarget) {
              setIsFullscreen(false);
            }
          }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-3 rounded-lg bg-white/90 text-gray-700 hover:bg-white shadow-lg z-[20000] transition-all hover:scale-110"
            aria-label="Close fullscreen"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Fullscreen Widget Container */}
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full max-w-[100vw] max-h-[100vh]">
              {renderWidgetContent()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </ErrorBoundary>
  );
}

export default TradingChart;
