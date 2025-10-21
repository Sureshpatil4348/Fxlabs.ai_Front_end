import React, { useState, useEffect, useRef } from 'react';

import { useChartStore } from '../stores/useChartStore';

export const TradingViewHeader = () => {
  const { settings, setSymbol, setTimeframe, setChartType, toggleIndicator } = useChartStore();
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [showSettings, setShowSettings] = useState(false);
  const [showChartTypes, setShowChartTypes] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const settingsRef = useRef(null);
  const chartTypesRef = useRef(null);
  const dropdownRef = useRef(null);

  const timeframes = ['1m', '30m', '1h'];
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (chartTypesRef.current && !chartTypesRef.current.contains(event.target)) {
        setShowChartTypes(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowIndicators(false);
      }
    };

    if (showSettings || showChartTypes || showIndicators) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings, showChartTypes, showIndicators]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleTimeframeChange = (timeframe) => {
    setActiveTimeframe(timeframe);
    setTimeframe(timeframe);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-1.5 h-10">
      <div className="flex items-center justify-between h-full">
        {/* Left Section */}
        <div className="flex items-center space-x-0.5">
          {/* Search Icon and Symbol Input */}
          <div className="flex items-center space-x-0.5">
            <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value="EURUSD"
              onChange={(e) => setSymbol(e.target.value)}
              className="w-20 text-xs font-medium text-gray-900 bg-transparent border-none outline-none"
              placeholder="EURUSD"
            />
            <button className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs">
              +
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center space-x-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                  activeTimeframe === tf
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-0.5">
          
          {/* Candlestick Chart Button */}
          <button 
            onClick={() => setChartType('candlestick')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              settings.chartType === 'candlestick'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Candlestick Chart"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          {/* Chart Type Dropdown */}
          <div className="relative" ref={chartTypesRef}>
            <button 
              onClick={() => setShowChartTypes(!showChartTypes)}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                showChartTypes
                  ? 'bg-blue-100 text-blue-700'
                  : settings.chartType === 'line'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Chart Types"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </button>

            {/* Chart Types Dropdown Menu */}
            {showChartTypes && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-2 py-1.5">Chart Type</div>
                  
                  <button
                    onClick={() => {
                      setChartType('candlestick');
                      setShowChartTypes(false);
                    }}
                    className={`w-full flex items-center space-x-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                      settings.chartType === 'candlestick'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-medium">Candlestick</span>
                    {settings.chartType === 'candlestick' && (
                      <svg className="w-2.5 h-2.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setChartType('line');
                      setShowChartTypes(false);
                    }}
                    className={`w-full flex items-center space-x-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                      settings.chartType === 'line'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <span className="text-xs font-medium">Line Chart</span>
                    {settings.chartType === 'line' && (
                      <svg className="w-2.5 h-2.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setChartType('area');
                      setShowChartTypes(false);
                    }}
                    className={`w-full flex items-center space-x-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                      settings.chartType === 'area'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M3 20l4-4 4 4 4-4 4 4" />
                    </svg>
                    <span className="text-xs font-medium">Area Chart</span>
                    {settings.chartType === 'area' && (
                      <svg className="w-2.5 h-2.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setChartType('bars');
                      setShowChartTypes(false);
                    }}
                    className={`w-full flex items-center space-x-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                      settings.chartType === 'bars'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="text-xs font-medium">Bars</span>
                    {settings.chartType === 'bars' && (
                      <svg className="w-2.5 h-2.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Indicators Button */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-3 py-1.5 text-xs rounded flex items-center space-x-0.5 transition-colors ${
                showIndicators 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span>Indicators</span>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Indicators Dropdown Panel */}
            {showIndicators && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
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

                    {/* RSI */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">RSI</p>
                          <p className="text-xs text-gray-500">Relative Strength Index (14-period)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleIndicator('rsi')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.indicators.rsi ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.indicators.rsi ? 'translate-x-6' : 'translate-x-1'
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
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button 
            onClick={toggleFullscreen}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              isFullscreen 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                showSettings 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Chart Settings"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Settings Dropdown Panel */}
            {showSettings && (
              <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Chart Settings</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Symbol Selection */}
                    <div>
                      <label htmlFor="header-symbol-select" className="block text-xs font-medium text-gray-700 mb-1">
                        Trading Pair
                      </label>
                      <select 
                        id="header-symbol-select"
                        value={settings.symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="EURUSD">EUR/USD - Euro / US Dollar</option>
                        <option value="GBPUSD">GBP/USD - British Pound / US Dollar</option>
                        <option value="USDJPY">USD/JPY - US Dollar / Japanese Yen</option>
                        <option value="AUDUSD">AUD/USD - Australian Dollar / US Dollar</option>
                        <option value="USDCAD">USD/CAD - US Dollar / Canadian Dollar</option>
                        <option value="USDCHF">USD/CHF - US Dollar / Swiss Franc</option>
                        <option value="NZDUSD">NZD/USD - New Zealand Dollar / US Dollar</option>
                        <option value="EURGBP">EUR/GBP - Euro / British Pound</option>
                        <option value="GBPJPY">GBP/JPY - British Pound / Japanese Yen</option>
                        <option value="AUDCAD">AUD/CAD - Australian Dollar / Canadian Dollar</option>
                        <option value="AUDCHF">AUD/CHF - Australian Dollar / Swiss Franc</option>
                        <option value="AUDJPY">AUD/JPY - Australian Dollar / Japanese Yen</option>
                        <option value="CADCHF">CAD/CHF - Canadian Dollar / Swiss Franc</option>
                        <option value="CADJPY">CAD/JPY - Canadian Dollar / Japanese Yen</option>
                      </select>
                    </div>

                    {/* Timeframe Selection */}
                    <div>
                      <label htmlFor="header-timeframe-select" className="block text-xs font-medium text-gray-700 mb-1">
                        Timeframe
                      </label>
                      <select 
                        id="header-timeframe-select"
                        value={settings.timeframe}
                        onChange={(e) => {
                          setTimeframe(e.target.value);
                          setActiveTimeframe(e.target.value);
                        }}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1m">1 Minute</option>
                        <option value="5m">5 Minutes</option>
                        <option value="15m">15 Minutes</option>
                        <option value="30m">30 Minutes</option>
                        <option value="1h">1 Hour</option>
                        <option value="4h">4 Hours</option>
                        <option value="1d">1 Day</option>
                        <option value="1w">1 Week</option>
                      </select>
                    </div>

                    {/* Chart Type */}
                    <div>
                      <span id="chart-type-label" className="block text-xs font-medium text-gray-700 mb-1">
                        Chart Type
                      </span>
                      <div className="grid grid-cols-2 gap-1" role="group" aria-labelledby="chart-type-label">
                        <button
                          onClick={() => setChartType('candlestick')}
                          className={`px-2 py-1.5 rounded-lg border transition-colors ${
                            settings.chartType === 'candlestick'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          📊 Candles
                        </button>
                        <button
                          onClick={() => setChartType('line')}
                          className={`px-2 py-1.5 rounded-lg border transition-colors ${
                            settings.chartType === 'line'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          📈 Line
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Current Settings Summary */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Current Symbol:</span>
                        <span className="font-medium text-gray-700">{settings.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timeframe:</span>
                        <span className="font-medium text-gray-700">{settings.timeframe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Indicators:</span>
                        <span className="font-medium text-gray-700">
                          {Object.values(settings.indicators).filter(Boolean).length} / 14
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};