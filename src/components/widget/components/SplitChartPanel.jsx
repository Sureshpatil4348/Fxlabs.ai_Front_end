import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import SymbolSearchModal from './SymbolSearchModal';
import { formatSymbolDisplay } from '../../../utils/formatters';
import { useChartStore } from '../stores/useChartStore';

export const SplitChartPanel = ({ chartIndex = 1 }) => {
  const isMainChart = chartIndex === 1;
  const { 
    settings, 
    setSymbol, 
    setTimeframe, 
    toggleIndicator,
    setSplitChartSymbol,
    setSplitChartTimeframe,
    toggleSplitChartIndicator,
    setChartType,
  } = useChartStore();

  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showMoreTimeframesDropdown, setShowMoreTimeframesDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  
  const indicatorsButtonRef = useRef(null);
  const moreTimeframesDropdownRef = useRef(null);
  const indicatorsPanelRef = useRef(null);

  // Get current settings based on chart index (with fallbacks matching main chart)
  const currentSymbol = isMainChart 
    ? settings.symbol 
    : (settings.splitChart?.symbol || settings.symbol);
  const currentTimeframe = isMainChart 
    ? settings.timeframe 
    : (settings.splitChart?.timeframe || settings.timeframe);
  const currentIndicators = isMainChart 
    ? settings.indicators 
    : (settings.splitChart?.indicators || settings.indicators);

  // Indicator groups and limits
  // Note: 'emaTouch' (Trend Strategy) implementation is kept for future use but removed from dropdown
  const ON_CHART_KEYS = ['bbPro','maEnhanced','orbEnhanced','stEnhanced'];
  const BELOW_CHART_KEYS = ['rsiEnhanced','atrEnhanced','macdEnhanced'];
  const ON_CHART_LIMIT = 3;
  const BELOW_CHART_LIMIT = 2;

  const showToast = (msg) => {
    try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch (_) {}
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2000);
  };

  const countActive = (keys) => keys.reduce((acc, k) => acc + (currentIndicators?.[k] ? 1 : 0), 0);
  const activeOnChart = countActive(ON_CHART_KEYS);
  const activeBelowChart = countActive(BELOW_CHART_KEYS);
  const totalActiveIndicators = activeOnChart + activeBelowChart;

  const handleToggleIndicator = (key) => {
    const isOn = !!currentIndicators?.[key];
    const toggleFn = isMainChart ? toggleIndicator : toggleSplitChartIndicator;
    
    if (isOn) {
      toggleFn(key);
      return;
    }
    if (ON_CHART_KEYS.includes(key)) {
      if (activeOnChart >= ON_CHART_LIMIT) {
        showToast(`Limit reached: max ${ON_CHART_LIMIT} on-chart indicators`);
        return;
      }
    } else if (BELOW_CHART_KEYS.includes(key)) {
      if (activeBelowChart >= BELOW_CHART_LIMIT) {
        showToast(`Limit reached: max ${BELOW_CHART_LIMIT} below-chart indicators`);
        return;
      }
    }
    toggleFn(key);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideIndicators = (
        indicatorsButtonRef.current &&
        !indicatorsButtonRef.current.contains(event.target) &&
        (!indicatorsPanelRef.current || !indicatorsPanelRef.current.contains(event.target))
      );
      if (clickedOutsideIndicators) {
        setShowIndicators(false);
      }
      if (moreTimeframesDropdownRef.current && !moreTimeframesDropdownRef.current.contains(event.target)) {
        setShowMoreTimeframesDropdown(false);
      }
    };

    if (showIndicators || showMoreTimeframesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndicators, showMoreTimeframesDropdown]);

  const handleSymbolSelect = (symbol) => {
    if (isMainChart) {
      setSymbol(symbol);
    } else {
      setSplitChartSymbol(symbol);
    }
  };

  const handleTimeframeSelect = (timeframe) => {
    if (isMainChart) {
      setTimeframe(timeframe);
    } else {
      setSplitChartTimeframe(timeframe);
    }
    setShowMoreTimeframesDropdown(false);
  };

  const calculateDropdownPosition = () => {
    if (indicatorsButtonRef.current) {
      const rect = indicatorsButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right - window.scrollX
      });
    }
  };

  const handleIndicatorsToggle = () => {
    if (!showIndicators) {
      calculateDropdownPosition();
    }
    setShowIndicators(!showIndicators);
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Symbol Search Button */}
          <button
            onClick={() => setShowSymbolSearch(true)}
            className="px-2 py-1 text-[13px] font-medium bg-white hover:bg-gray-50 transition-colors min-w-[80px] flex items-center justify-between"
          >
            <span>{currentSymbol ? formatSymbolDisplay(currentSymbol) : 'Select Symbol'}</span>
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Chart Type Switch (Candlestick / Line) */}
          <div className="ml-2">
            <button
              onClick={() => {
                const currentType = settings.chartType || 'candlestick';
                const newType = currentType === 'line' ? 'candlestick' : 'line';
                try {
                  setChartType(newType);
                } catch (_) {
                  // best-effort; ignore if store not ready
                }
              }}
              className="px-2 py-1 text-[13px] font-medium text-gray-700 bg-transparent hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {settings.chartType === 'line' ? 'Line' : 'Candlestick'}
            </button>
          </div>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-white">
            {['1m', '5m', '15m'].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeSelect(tf)}
                className={`px-2.5 py-1 text-[13px] font-medium transition-all duration-200 ${
                  currentTimeframe === tf
                    ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white transform scale-105 rounded-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tf}
              </button>
            ))}

            {/* More Timeframes Button */}
            <div className="relative" ref={moreTimeframesDropdownRef}>
              <button
                onClick={() => setShowMoreTimeframesDropdown(!showMoreTimeframesDropdown)}
                className={`px-2.5 py-1 text-[13px] font-medium transition-all duration-200 flex items-center gap-1 ${
                  showMoreTimeframesDropdown || ['30m', '1h', '4h', '1d', '1w', '1mo'].includes(currentTimeframe)
                    ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white rounded-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                More
                <svg className={`w-3 h-3 transition-transform ${showMoreTimeframesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* More Timeframes Dropdown Menu */}
              {showMoreTimeframesDropdown && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] overflow-hidden">
                  {['30m', '1h', '4h', '1d', '1w', '1mo'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => handleTimeframeSelect(tf)}
                      className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-all ${
                        currentTimeframe === tf
                          ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Indicators Button */}
          <div className="relative flex-1">
            <button 
              ref={indicatorsButtonRef}
              onClick={handleIndicatorsToggle}
              className="px-3 py-1.5 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <span>Indicators{totalActiveIndicators > 0 ? ` ( ${totalActiveIndicators} )` : ''}</span>
              <svg className={`w-3 h-3 transition-transform ${showIndicators ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Symbol Search Modal */}
      <SymbolSearchModal
        isOpen={showSymbolSearch}
        onClose={() => setShowSymbolSearch(false)}
        onSymbolSelect={handleSymbolSelect}
        currentSymbol={currentSymbol}
      />

      {/* Indicators Dropdown Panel */}
      {showIndicators && createPortal(
        <div 
          className="fixed w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[15000]"
          style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
          ref={indicatorsPanelRef}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Technical Indicators</h3>
              <button onClick={() => setShowIndicators(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto relative" style={{ maxHeight: '400px', scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6', scrollBehavior: 'smooth' }}>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">RSI - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('rsiEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentIndicators.rsiEnhanced ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentIndicators.rsiEnhanced ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Bollinger Bands - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('bbPro')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentIndicators.bbPro ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentIndicators.bbPro ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">ATR - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('atrEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentIndicators.atrEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentIndicators.atrEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Moving Average - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('maEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentIndicators.maEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentIndicators.maEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Breakout Strategy</p>
                </div>
                <button onClick={() => handleToggleIndicator('orbEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentIndicators.orbEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentIndicators.orbEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Super Trend - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('stEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentIndicators.stEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentIndicators.stEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">MACD - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('macdEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentIndicators.macdEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentIndicators.macdEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {toastMessage && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-2 px-3 py-1.5 rounded-md bg-gray-900 text-white text-[13px] shadow-md">
                {toastMessage}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
