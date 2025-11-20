import { Maximize2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import SymbolSearchModal from './SymbolSearchModal';
import { formatSymbolDisplay } from '../../../utils/formatters';
import { listTimezonesWithOffsets } from '../../../utils/marketHoursEngine';
import { watchlistService } from '../services/watchlistService';
import { useChartStore } from '../stores/useChartStore';

export const TradingViewHeader = ({ onFullscreenToggle, isFullscreen = false }) => {
  const { settings, setSymbol, setTimeframe, _setCursorType, toggleIndicator, setTimezone, toggleSplitMode, setChartType } = useChartStore();
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);
  const [_activeTimeframe, setActiveTimeframe] = useState('1m');
  const [showIndicators, setShowIndicators] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showMoreTimeframesDropdown, setShowMoreTimeframesDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  
  const dropdownRef = useRef(null);
  const timezoneDropdownRef = useRef(null);
  const indicatorsButtonRef = useRef(null);
  const moreTimeframesDropdownRef = useRef(null);
  const indicatorsPanelRef = useRef(null);

  // Handle Split button click: if not fullscreen, first enter fullscreen then enable split
  const handleSplitClick = () => {
    // If already in split mode, just toggle it off/on based on current state
    if (settings.isSplitMode) {
      toggleSplitMode();
      return;
    }
    // When not in fullscreen, enter fullscreen first, then enable split mode
    if (!isFullscreen && typeof onFullscreenToggle === 'function') {
      try {
        onFullscreenToggle();
      } catch (_) { /* noop */ }
      // Defer enabling split to ensure fullscreen layout has mounted
      setTimeout(() => {
        try { toggleSplitMode(); } catch (_) { /* noop */ }
      }, 0);
      return;
    }
    // Already fullscreen: enable split immediately
    toggleSplitMode();
  };

  // Indicator groups and limits
  // Note: 'emaTouch' (Trend Strategy) implementation is kept for future use but removed from dropdown
  const ON_CHART_KEYS = ['bbPro','maEnhanced','orbEnhanced','stEnhanced','srEnhanced'];
  const BELOW_CHART_KEYS = ['rsiEnhanced','atrEnhanced','macdEnhanced'];
  const ON_CHART_LIMIT = 3;
  const BELOW_CHART_LIMIT = 2;

  const showToast = (msg) => {
    try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch (_) {}
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2000);
  };

  const countActive = (keys) => keys.reduce((acc, k) => acc + (settings.indicators?.[k] ? 1 : 0), 0);
  const activeOnChart = countActive(ON_CHART_KEYS);
  const activeBelowChart = countActive(BELOW_CHART_KEYS);
  const totalActiveIndicators = activeOnChart + activeBelowChart;

  const handleToggleIndicator = (key) => {
    const isOn = !!settings.indicators?.[key];
    if (isOn) {
      toggleIndicator(key);
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
    toggleIndicator(key);
  };

  // Quick-access timeframes default: 1m, 5m, 15m; remaining in dropdown
  const _timeframes = ['1m', '5m', '15m'];
  const DEFAULT_QUICK_TFS = ['1m', '5m', '15m'];
  const DEFAULT_MORE_TFS = ['30m', '1h', '4h', '1d', '1w'];

  // Dynamic quick and more lists to support swapping 15m with a selected "More" timeframe
  const [quickTimeframes, setQuickTimeframes] = useState(DEFAULT_QUICK_TFS);
  const [moreTimeframes, setMoreTimeframes] = useState(DEFAULT_MORE_TFS);
  const [swappedFromMore, setSwappedFromMore] = useState(null); // tracks which timeframe replaced 15m

  const isSwapped = swappedFromMore !== null;

  const resetQuickTimeframes = () => {
    setQuickTimeframes(DEFAULT_QUICK_TFS);
    setMoreTimeframes(DEFAULT_MORE_TFS);
    setSwappedFromMore(null);
  };

  const swapFifteenWith = (tf) => {
    // If user selects 15m from dropdown, revert to defaults
    if (tf === '15m') {
      resetQuickTimeframes();
      return;
    }
    // Move selected tf to the 3rd quick slot, move 15m into more list
    setQuickTimeframes(['1m', '5m', tf]);
    setMoreTimeframes((prev) => {
      const withoutSelected = prev.filter((t) => t !== tf);
      // Ensure 15m exists in the more list when swapped
      if (!withoutSelected.includes('15m')) withoutSelected.unshift('15m');
      // If previously swapped, also ensure the previous is present in More (it should already be, but guard anyway)
      if (swappedFromMore && !withoutSelected.includes(swappedFromMore)) {
        withoutSelected.push(swappedFromMore);
      }
      return withoutSelected;
    });
    setSwappedFromMore(tf);
  };

  const handleQuickTimeframeSelect = (tf) => {
    if (settings.timeframe === tf) return;
    if ((tf === '1m' || tf === '5m') && isSwapped) {
      resetQuickTimeframes();
    }
    setTimeframe(tf);
    setActiveTimeframe(tf);
  };

  const handleMoreTimeframeSelect = (tf) => {
    if (settings.timeframe === tf) {
      setShowMoreTimeframesDropdown(false);
      return;
    }
    if (tf === '15m') {
      resetQuickTimeframes();
    } else {
      swapFifteenWith(tf);
    }
    setTimeframe(tf);
    setActiveTimeframe(tf);
    setShowMoreTimeframesDropdown(false);
  };
  // Comprehensive timezone list + Auto(System)
  const [timezones, setTimezones] = useState(() => listTimezonesWithOffsets(new Date()));
  const systemTz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
  const systemTzItem = (() => {
    const nowList = listTimezonesWithOffsets(new Date());
    const match = nowList.find(z => z.value === systemTz);
    return match ? { ...match, label: `${match.label} (Auto)` } : { value: systemTz, label: `${systemTz} (Auto)`, gmt: '+00:00', offsetMinutes: 0 };
  })();
  useEffect(() => {
    const refresh = () => setTimezones(listTimezonesWithOffsets(new Date()));
    const id = setInterval(refresh, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  
  // Check if current symbol is in watchlist
  useEffect(() => {
    if (settings.symbol) {
      setIsInWatchlist(watchlistService.isInWatchlist(settings.symbol));
    }
  }, [settings.symbol]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Indicators only if click is outside BOTH the button container AND the portal panel
      const clickedOutsideIndicators = (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        (!indicatorsPanelRef.current || !indicatorsPanelRef.current.contains(event.target))
      );
      if (clickedOutsideIndicators) {
        setShowIndicators(false);
      }
      // Close timezone dropdown on outside click
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target)) {
        setShowTimezoneDropdown(false);
      }
      // Close more timeframes dropdown on outside click
      if (moreTimeframesDropdownRef.current && !moreTimeframesDropdownRef.current.contains(event.target)) {
        setShowMoreTimeframesDropdown(false);
      }
    };

    if (showIndicators || showTimezoneDropdown || showMoreTimeframesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndicators, showTimezoneDropdown, showMoreTimeframesDropdown]);



  const handleWatchlistToggle = () => {
    if (settings.symbol) {
      const wasAdded = watchlistService.toggleWatchlist(settings.symbol);
      setIsInWatchlist(wasAdded);
      
      // Track view if added to watchlist
      if (wasAdded) {
        watchlistService.trackView(settings.symbol);
      }
    }
  };

  const handleSymbolSelect = (symbol) => {
    setSymbol(symbol);
  };

  const handleTimezoneSelect = (timezone) => {
    setTimezone(timezone);
    setShowTimezoneDropdown(false);
  };

  const getCurrentTimezoneInfo = () => {
    const match = timezones.find(tz => tz.value === settings.timezone);
    return match || systemTzItem;
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
    <div className="bg-white border-b border-gray-200 px-3 py-2 h-11 shadow-sm">
      <div className="flex items-center justify-between h-full">
        {/* Left Section - Conditionally rendered based on split mode */}
        {!settings.isSplitMode && (
        <div className="flex items-center">
          {/* Symbol Search Button */}
          <div className="flex items-center">
            <button
              onClick={() => setShowSymbolSearch(true)}
              className="px-2 py-1 text-[13px] font-medium bg-white hover:bg-gray-50 transition-colors min-w-[80px] flex items-center justify-between"
            >
              <span>{settings.symbol ? formatSymbolDisplay(settings.symbol) : 'Select Symbol'}</span>
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Watchlist Star Button - Premium Style - Hidden from UI */}
            {false && settings.symbol && (
              <button
                onClick={handleWatchlistToggle}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                  isInWatchlist
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-400 hover:border-yellow-400 hover:text-yellow-500 shadow-sm hover:shadow-md'
                }`}
                title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <svg className="w-3.5 h-3.5" fill={isInWatchlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
          </div>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

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
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          {/* Timeframe Buttons + Dropdown */}
          <div className="flex items-center">
            {/* Quick Timeframe Buttons - Premium Style */}
          <div className="flex items-center gap-1 bg-white">
              {quickTimeframes.map((tf) => (
              <button
                key={tf}
                  onClick={() => handleQuickTimeframeSelect(tf)}
                  className={`px-2.5 py-1 text-[13px] font-medium transition-all duration-200 ${
                    settings.timeframe === tf
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
                  showMoreTimeframesDropdown || moreTimeframes.includes(settings.timeframe)
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
                  {moreTimeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => handleMoreTimeframeSelect(tf)}
                      className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-all ${
                        settings.timeframe === tf
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
          </div>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          {/* Indicators Button */}
          <div className="relative" ref={dropdownRef}>
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
        )}

        {/* Right Section - Split/Unsplit + Timezone + Fullscreen */
        }
        <div className="flex items-center ml-auto">
          {/* Split/Unsplit Button - now visible in both modes */}
          <>
            <button
              onClick={handleSplitClick}
              className="px-3 py-1.5 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded"
              title={settings.isSplitMode ? "Exit Split View" : (isFullscreen ? "Split Graph View" : "Go Fullscreen & Split")}
            >
              <span>{settings.isSplitMode ? 'Unsplit' : 'Split'}</span>
            </button>
            {/* Vertical Separator */}
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
          </>

          {/* Premium Timezone Dropdown */}
          <div className="flex items-center space-x-2">
            <div className="relative" ref={timezoneDropdownRef}>
              <button
                onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                className="px-3 py-1.5 bg-white text-[13px] font-medium hover:bg-blue-50 transition-all duration-200 min-w-[120px] flex items-center gap-1"
              >
                <span className="text-gray-700">{`GMT${getCurrentTimezoneInfo().gmt}`}</span>
                <svg className={`w-3 h-3 transition-transform ${showTimezoneDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Premium Timezone Dropdown Panel */}
              {showTimezoneDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden">
                  <div className="bg-white px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">Timezone</h3>
                      </div>
                      <button
                        onClick={() => setShowTimezoneDropdown(false)}
                        className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: '320px' }}>
                    {/* Auto (System) */}
                    <button
                      key={`auto-${systemTzItem.value}`}
                      onClick={() => handleTimezoneSelect(systemTzItem.value)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        settings.timezone === systemTzItem.value
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md transform scale-[1.02]'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${settings.timezone === systemTzItem.value ? 'text-white' : 'text-gray-900'}`}>{systemTzItem.label}</span>
                          <span className={`text-xs ${settings.timezone === systemTzItem.value ? 'text-blue-100' : 'text-gray-500'}`}>GMT{systemTzItem.gmt}</span>
                        </div>
                        {settings.timezone === systemTzItem.value && (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {/* All supported timezones */}
                    {timezones.map((timezone) => (
                      <button
                        key={timezone.value}
                        onClick={() => handleTimezoneSelect(timezone.value)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          settings.timezone === timezone.value
                            ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md transform scale-[1.02]'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${settings.timezone === timezone.value ? 'text-white' : 'text-gray-900'}`}>{timezone.label}</span>
                            <span className={`text-xs ${settings.timezone === timezone.value ? 'text-blue-100' : 'text-gray-500'}`}>GMT{timezone.gmt}</span>
                          </div>
                          {settings.timezone === timezone.value && (
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}

                    {/* Current Time Display */}
                    <div className="mt-3 pt-3 border-t border-gray-200 px-3 pb-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Current Time:</span>
                        <span className="font-bold text-blue-600">
                          {new Date().toLocaleString('en-US', {
                            timeZone: settings.timezone,
                            hour12: false,
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fullscreen Button */}
          {onFullscreenToggle && (
            <button
              type="button"
              onClick={onFullscreenToggle}
              className="p-2 text-gray-600 hover:text-[#19235d] hover:bg-gray-100 rounded-md transition-colors ml-2"
              title="Fullscreen"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Symbol Search Modal */}
    <SymbolSearchModal
        isOpen={showSymbolSearch}
        onClose={() => setShowSymbolSearch(false)}
        onSymbolSelect={handleSymbolSelect}
        currentSymbol={settings.symbol}
      />

      {/* Portal-based Indicators Dropdown */}
      {false && showIndicators && createPortal(
        <div 
          className="fixed w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right
          }}
          ref={indicatorsPanelRef}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Technical Indicators</h3>
              <button
                onClick={() => setShowIndicators(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div 
              className="space-y-2 overflow-y-auto" 
              style={{ 
                maxHeight: '400px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6',
                scrollBehavior: 'smooth'
              }}
            >
              {/* EMA 20 */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">EMA 20</p>
                    <p className="text-xs text-gray-500">20-period Exponential Moving Average</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('ema20')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.ema20 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.ema20 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* EMA 200 */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">EMA 200</p>
                    <p className="text-xs text-gray-500">200-period Exponential Moving Average</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('ema200')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.ema200 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.ema200 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* RSI - Pro */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">RSI - Pro</p>
                    <p className="text-xs text-gray-500">Clean RSI (14) — OB/OS panel</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('rsiEnhanced')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.rsiEnhanced ? 'bg-blue-400' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.rsiEnhanced ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* MACD */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">MACD</p>
                    <p className="text-xs text-gray-500">Moving Average Convergence Divergence</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('macd')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.macd ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.macd ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* ATR */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">ATR</p>
                    <p className="text-xs text-gray-500">Average True Range (14-period)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('atr')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.atr ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.atr ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMA 50 */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">SMA 50</p>
                    <p className="text-xs text-gray-500">Simple Moving Average (50-period)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('sma50')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.sma50 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.sma50 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMA 100 */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">SMA 100</p>
                    <p className="text-xs text-gray-500">Simple Moving Average (100-period)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('sma100')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.sma100 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.sma100 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Bollinger Bands */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">Bollinger Bands</p>
                    <p className="text-xs text-gray-500">Price volatility bands (20-period)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('bollinger')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.bollinger ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.bollinger ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Stochastic */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">Stochastic</p>
                    <p className="text-xs text-gray-500">Momentum oscillator (14,3)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('stoch')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.stoch ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.stoch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Williams %R */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">Williams %R</p>
                    <p className="text-xs text-gray-500">Momentum indicator (14-period)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('williams')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.williams ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.williams ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* CCI */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">CCI</p>
                    <p className="text-xs text-gray-500">Commodity Channel Index (20-period)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('cci')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.cci ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.cci ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* OBV */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">OBV</p>
                    <p className="text-xs text-gray-500">On-Balance Volume</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('obv')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.obv ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.obv ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* VWAP */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">VWAP</p>
                    <p className="text-xs text-gray-500">Volume Weighted Average Price</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('vwap')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.vwap ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.vwap ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 24h Change */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">24h Change</p>
                    <p className="text-xs text-gray-500">24-hour price change percentage</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIndicator('change24h')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.indicators.change24h ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.indicators.change24h ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Active Indicators Summary */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Active Indicators:</span>
                <span className="font-bold text-blue-600">
                  {Object.values(settings.indicators).filter(Boolean).length} / 14
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* New minimal Indicators panel (RSI Enhanced + EMA Touch + ATR Enhanced + BB Pro + MA Enhanced + ORB Enhanced + ST Enhanced + SR Enhanced + MACD Enhanced) */}
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
                <button onClick={() => handleToggleIndicator('rsiEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.indicators.rsiEnhanced ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.indicators.rsiEnhanced ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Bollinger Bands - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('bbPro')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.indicators.bbPro ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.indicators.bbPro ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">ATR - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('atrEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.indicators.atrEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.indicators.atrEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Moving Average - Pro */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Moving Average - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('maEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.indicators.maEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.indicators.maEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Breakout Strategy */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Breakout Strategy</p>
                </div>
                <button onClick={() => handleToggleIndicator('orbEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.indicators.orbEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.indicators.orbEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Super Trend - Pro */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Super Trend - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('stEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.indicators.stEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.indicators.stEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Support/Resistance Enhanced */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">Support Resitance - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('srEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.indicators.srEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.indicators.srEnhanced ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* MACD - Pro (below chart) */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <p className="text-xs font-medium text-gray-900">MACD - Pro</p>
                </div>
                <button onClick={() => handleToggleIndicator('macdEnhanced')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.indicators.macdEnhanced ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.indicators.macdEnhanced ? 'translate-x-6' : 'translate-x-1'
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
