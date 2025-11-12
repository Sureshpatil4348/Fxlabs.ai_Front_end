import { X, Bell } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { TradingViewHeader } from './components/TradingViewHeader.jsx';
import { UnifiedChart } from './components/UnifiedChart';
import { useChartStore } from './stores/useChartStore';

function TradingChart() {
  const { settings, toggleGrid, toggleIndicator } = useChartStore();
  const [activePreset, setActivePreset] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorTimeoutRef = useRef(null);

  // Indicator groups and limits (same as in TradingViewHeader)
  const ON_CHART_KEYS = ['emaTouch', 'bbPro', 'maEnhanced', 'orbEnhanced', 'stEnhanced', 'srEnhanced'];
  const BELOW_CHART_KEYS = ['rsiEnhanced', 'atrEnhanced', 'macdEnhanced'];
  const ON_CHART_LIMIT = 3;
  const BELOW_CHART_LIMIT = 2;

  // Carefully selected indicator presets (respecting limits: 3 on-chart, 2 below-chart)
  const indicatorPresets = [
    {
      id: 'moneytize',
      name: 'Moneytize',
      description: 'Moving Average Pro + RSI - Pro + MACD - Pro',
      icon: '📈',
      indicators: ['maEnhanced', 'rsiEnhanced', 'macdEnhanced']
    },
    {
      id: 'trend-scalper',
      name: 'Trend Scalper',
      description: 'Super Trend - Pro + MACD - Pro',
      icon: '🌊',
      indicators: ['stEnhanced', 'macdEnhanced']
    },
    {
      id: 'buy-sell-signal',
      name: 'Buy / Sell Signal',
      description: 'Trend Strategy + ATR - Pro',
      icon: '🎯',
      indicators: ['emaTouch', 'atrEnhanced']
    }
  ];

  const showError = (msg) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorMessage(msg);
    errorTimeoutRef.current = setTimeout(() => setErrorMessage(''), 3000);
  };

  const countActive = (keys) => keys.reduce((acc, k) => acc + (settings.indicators?.[k] ? 1 : 0), 0);

  // Check if a preset is currently active
  const isPresetActive = (preset) => {
    return preset.indicators.every((ind) => settings.indicators?.[ind]);
  };

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

  // Sync active preset state based on current indicators
  useEffect(() => {
    const matchingPreset = indicatorPresets.find(preset => isPresetActive(preset));
    setActivePreset(matchingPreset?.id || null);
  }, [settings.indicators]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePresetSelect = (preset) => {
    const presetIsActive = activePreset === preset.id;

    if (presetIsActive) {
      // Clicking active preset: remove only preset indicators, keeping extras
      preset.indicators.forEach((ind) => {
        if (settings.indicators?.[ind]) {
          toggleIndicator(ind);
        }
      });
      setActivePreset(null);
      return;
    }

    // If switching from another preset, remove the previous preset's indicators first
    if (activePreset && activePreset !== preset.id) {
      const previousPreset = indicatorPresets.find(p => p.id === activePreset);
      if (previousPreset) {
        // Remove all indicators from previous preset
        previousPreset.indicators.forEach((ind) => {
          if (settings.indicators?.[ind]) {
            toggleIndicator(ind);
          }
        });
        console.log(`🔄 Switching presets: removed "${previousPreset.name}" indicators`);
      }
    }

    // Check which indicators from preset are already active
    const alreadyActive = preset.indicators.filter((ind) => settings.indicators?.[ind]);
    const needToActivate = preset.indicators.filter((ind) => !settings.indicators?.[ind]);

    // Check limits for indicators we need to activate
    const needOnChart = needToActivate.filter((ind) => ON_CHART_KEYS.includes(ind));
    const needBelowChart = needToActivate.filter((ind) => BELOW_CHART_KEYS.includes(ind));

    const currentOnChart = countActive(ON_CHART_KEYS);
    const currentBelowChart = countActive(BELOW_CHART_KEYS);

    const newOnChart = currentOnChart + needOnChart.length;
    const newBelowChart = currentBelowChart + needBelowChart.length;

    // Check if limits would be exceeded
    if (newOnChart > ON_CHART_LIMIT) {
      showError(`Cannot apply preset: would exceed on-chart indicator limit (${ON_CHART_LIMIT} max). Currently ${currentOnChart}/3, preset needs ${needOnChart.length} more.`);
      return;
    }

    if (newBelowChart > BELOW_CHART_LIMIT) {
      showError(`Cannot apply preset: would exceed below-chart indicator limit (${BELOW_CHART_LIMIT} max). Currently ${currentBelowChart}/2, preset needs ${needBelowChart.length} more.`);
      return;
    }

    // Apply preset: only activate indicators that aren't already active
    needToActivate.forEach((ind) => {
      toggleIndicator(ind);
    });

    // Log for debugging
    if (alreadyActive.length > 0) {
      console.log(`✅ Preset "${preset.name}": kept ${alreadyActive.length} existing indicator(s), activated ${needToActivate.length} new`);
    } else {
      console.log(`✅ Preset "${preset.name}": activated all ${needToActivate.length} indicators`);
    }

    setActivePreset(preset.id);
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
            <UnifiedChart isFullscreen={isFullscreen} />
          </div>
          
          {/* Bottom Bar */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 py-1 relative">
            {/* Error Message Toast */}
            {errorMessage && (
              <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-[10000]">
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-md">
                  {errorMessage}
                </div>
              </div>
            )}

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
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white transform scale-105 rounded-lg'
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
