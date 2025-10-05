import React, { useEffect, useRef, useState } from 'react';

const TradingViewWidget = ({ 
  initialSymbol = "OANDA:XAUUSD", 
  initialInterval = "60",
  height = "65vh",
  showControls = true,
  className = ""
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedInterval, setSelectedInterval] = useState(initialInterval);
  const [isLoading, setIsLoading] = useState(false);

  // Symbol options
  const symbolOptions = [
    { value: "OANDA:XAUUSD", label: "XAUUSD (OANDA)" },
    { value: "OANDA:EURUSD", label: "EURUSD (OANDA)" },
    { value: "NASDAQ:AAPL", label: "AAPL" },
    { value: "NASDAQ:TSLA", label: "TSLA" },
    { value: "BINANCE:BTCUSDT", label: "BTCUSDT (Binance)" },
    { value: "OANDA:GBPUSD", label: "GBPUSD (OANDA)" },
    { value: "OANDA:USDJPY", label: "USDJPY (OANDA)" },
    { value: "OANDA:AUDUSD", label: "AUDUSD (OANDA)" },
    { value: "OANDA:USDCAD", label: "USDCAD (OANDA)" },
    { value: "OANDA:NZDUSD", label: "NZDUSD (OANDA)" },
  ];

  // Interval options
  const intervalOptions = [
    { value: "1", label: "1m" },
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "60", label: "1h" },
    { value: "240", label: "4h" },
    { value: "D", label: "1D" },
    { value: "W", label: "1W" },
    { value: "M", label: "1M" },
  ];

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
        createWidget(selectedSymbol, selectedInterval);
      })
      .catch((error) => {
        console.error('Error loading TradingView script:', error);
      });
  }, [selectedSymbol, selectedInterval]);

  // Create TradingView widget
  const createWidget = (symbol, interval) => {
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
        theme: "dark",
        style: "1", // 1 = candles
        locale: "en",
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        studies: ["RSI@tv-basicstudies"],
        details: true,
        hotlist: false,
        calendar: false,
        toolbar_bg: "#0b0e11",
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
  };

  // Handle symbol/interval change
  const handleReload = () => {
    createWidget(selectedSymbol, selectedInterval);
  };

  // Handle symbol change
  const handleSymbolChange = (e) => {
    setSelectedSymbol(e.target.value);
  };

  // Handle interval change
  const handleIntervalChange = (e) => {
    setSelectedInterval(e.target.value);
  };

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
      {/* Controls */}
      {showControls && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Symbol Selector */}
            <select
              value={selectedSymbol}
              onChange={handleSymbolChange}
              className="flex-1 min-w-[200px] px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {symbolOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Interval Selector */}
            <select
              value={selectedInterval}
              onChange={handleIntervalChange}
              className="flex-1 min-w-[120px] px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {intervalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Load Button */}
            <button
              onClick={handleReload}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {isLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          id={`tradingview_${Math.random().toString(36).substr(2, 9)}`}
          style={{ height: height }}
          className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-white text-sm">Loading chart...</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TradingViewWidget;
