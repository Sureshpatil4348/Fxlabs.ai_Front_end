import { X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { TradingViewHeader } from './components/TradingViewHeader.jsx';
import { UnifiedChart } from './components/UnifiedChart';
import { useChartStore } from './stores/useChartStore';

function TradingChart() {
  const { settings, toggleGrid, setIndicatorsPreset } = useChartStore();
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const presetDropdownRef = useRef(null);
  const presetButtonRef = useRef(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target)) {
        setShowPresetDropdown(false);
      }
    };

    if (showPresetDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPresetDropdown]);

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

  const calculateDropdownPosition = () => {
    if (presetButtonRef.current) {
      const rect = presetButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top + window.scrollY - 4,
        left: rect.left + window.scrollX
      });
    }
  };

  const handlePresetSelect = (preset) => {
    setIndicatorsPreset(preset.indicators);
    setShowPresetDropdown(false);
  };

  const handlePresetToggle = () => {
    if (!showPresetDropdown) {
      calculateDropdownPosition();
    }
    setShowPresetDropdown(!showPresetDropdown);
  };

  // Render the main widget content
  const renderWidgetContent = () => (
    <div className="h-full bg-white flex flex-col overflow-hidden border border-gray-200 shadow-lg rounded-lg">
      {/* Header */}
      <TradingViewHeader />
      
      {/* Main Content with Sidebar */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          onFullscreenToggle={() => setIsFullscreen(!isFullscreen)} 
          isFullscreen={isFullscreen}
        />
        
        {/* Chart Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <UnifiedChart />
          </div>
          
          {/* Bottom Bar */}
          <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-3 py-1">
            <div className="flex items-center justify-between">
              {/* Left Side - Session & Preset */}
              <div className="flex items-center space-x-2">
                
                
                {/* Preset Dropdown */}
                <div className="relative" ref={presetDropdownRef}>
                  <button 
                    ref={presetButtonRef}
                    onClick={handlePresetToggle}
                    className={`flex items-center space-x-1 px-2 py-1 border rounded text-xs transition-colors ${
                      showPresetDropdown 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Preset</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                </div>
              </div>

              {/* Right Side - Alert & Grid */}
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17H12l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z" />
                  </svg>
                  <span>Alert</span>
                </button>
                <button 
                  onClick={toggleGrid}
                  className={`flex items-center space-x-1 px-2 py-1 border rounded text-xs transition-colors ${
                    settings.showGrid 
                      ? 'bg-white border-emerald-500 text-emerald-700 hover:bg-gray-50' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Grid</span>
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

      {/* Portal-based Preset Dropdown */}
      {showPresetDropdown && createPortal(
        <div 
          className="fixed w-64 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="p-2">
            <div className="space-y-1">
              {indicatorPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{preset.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">{preset.name}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

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
