import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useTheme } from '../contexts/ThemeContext';

const TradingViewWidget = ({ 
  initialSymbol = "OANDA:XAUUSD", 
  initialInterval = "60",
  height = "65vh",
  className = ""
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useTheme();

  // Controls removed: currency/timeframe dropdown and load button

  // Create TradingView widget
  const createWidget = useCallback((symbol, interval) => {
    if (!window.TradingView || !containerRef.current) return;

    setIsLoading(true);

    // Clear the container
    const container = containerRef.current;
    container.innerHTML = '';

    try {
      // Create new widget
      const widget = new window.TradingView.widget({
        container_id: container.id,
        symbol: symbol,
        interval: interval,
        autosize: true,
        theme: isDarkMode ? "dark" : "light",
        style: "1", // 1 = candles
        locale: "en",
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        studies: ["RSI@tv-basicstudies"],
        details: true,
        hotlist: false,
        calendar: false,
        toolbar_bg: isDarkMode ? "#19235d" : "#ffffff",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
      });

      widgetRef.current = widget;

      // Handle widget ready event
      widget.onChartReady(() => {
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error creating TradingView widget:', error);
      setIsLoading(false);
    }
  }, [isDarkMode]);

  // Load TradingView script
  useEffect(() => {
    const loadTradingViewScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (window.TradingView) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load TradingView script'));
        document.head.appendChild(script);
      });
    };

    loadTradingViewScript()
      .then(() => {
        createWidget(initialSymbol, initialInterval);
      })
      .catch((error) => {
        console.error('Error loading TradingView script:', error);
      });
  }, [initialSymbol, initialInterval, isDarkMode, createWidget]);

  // Controls removed: handleReload, handleSymbolChange, handleIntervalChange

  // Cleanup on unmount
  useEffect(() => {
    const container = containerRef.current;
    return () => {
      if (widgetRef.current && container) {
        container.innerHTML = '';
        widgetRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`tradingview-widget flex flex-col h-full ${className}`}>
      {/* Controls removed; widget is fully driven by props/state */}

      {/* Chart Container */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          id={`tradingview_${Math.random().toString(36).substr(2, 9)}`}
          style={{ height: height }}
          className={`w-full h-full rounded-lg border overflow-hidden ${
            isDarkMode 
              ? 'bg-[#19235d] border-[#19235d]' 
              : 'bg-white border-gray-300'
          }`}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className={`absolute inset-0 bg-opacity-75 flex items-center justify-center rounded-lg ${
            isDarkMode ? 'bg-[#19235d]' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>Loading chart...</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TradingViewWidget;
