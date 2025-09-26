import { BarChart3, Bell, Mail, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowRight, Zap, Shield } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { useAuth } from '../auth/AuthProvider'
import useBaseMarketStore from '../store/useBaseMarketStore'
import useMarketStore from '../store/useMarketStore'
import useRSITrackerStore from '../store/useRSITrackerStore'

const TradingDashboardSection = () => {
  const { user } = useAuth()
  const { } = useMarketStore()
  const { 
    tickData, 
    ohlcData, 
    isConnected,
    connect,
    subscribe
  } = useRSITrackerStore()
  const connectionInitiated = useRef(false)
  const [showAlertDemo, setShowAlertDemo] = useState(false)
  const [_currentAlertStep, _setCurrentAlertStep] = useState(0)
  const [_isHovered] = useState(false)
  const [_mousePosition, _setMousePosition] = useState({ x: 0, y: 0 })
  const [_cursorTrail, _setCursorTrail] = useState([])
  const [activeFilter, setActiveFilter] = useState('All Pairs')
  const [currentNewsSlide, setCurrentNewsSlide] = useState(0)
  const [currencyPairs, setCurrencyPairs] = useState([
    { symbol: 'BTC/USD', name: 'Bitcoin', price: '112874.66', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'B' },
    { symbol: 'ETH/USD', name: 'Ethereum', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'E' },
    { symbol: 'XRP/USD', name: 'Ripple', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'X' },
    { symbol: 'SOL/USD', name: 'Solana', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'S' },
    { symbol: 'EUR/USD', name: 'Euro', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'forex', icon: 'E' },
    { symbol: 'GBP/USD', name: 'British Pound', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'forex', icon: 'G' },
    { symbol: 'XAU/USD', name: 'Gold', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'forex', icon: 'X' },
    { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'forex', icon: 'U' }
  ])
  const [dataInitialized, setDataInitialized] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  
  // Filter currency pairs based on active filter
  const filteredPairs = activeFilter === 'All Pairs' 
    ? currencyPairs 
    : currencyPairs.filter(pair => pair.type === activeFilter.toLowerCase())
  
  // Subscribe only to the specific parts we need for rendering
  const _showLoader = useMarketStore(state => state.globalConnectionState.showLoader)
  const _connectionStatus = useMarketStore(state => state.globalConnectionState.status)
  const _connectionAttempts = useMarketStore(state => state.globalConnectionState.connectionAttempts)
  const _dashboardConnections = useMarketStore(state => state.globalConnectionState.dashboardConnections)

  const { loadTabState } = useBaseMarketStore()

  useEffect(() => {
    // Only reset if we're dealing with a different user (or no user for public access)
    if (user?.id && connectionInitiated.current !== user.id) {
      connectionInitiated.current = user.id
      useMarketStore.getState().initiateGlobalConnection()
    } else if (!user && !connectionInitiated.current) {
      // For public access, initialize connection once
      connectionInitiated.current = 'public'
      useMarketStore.getState().initiateGlobalConnection()
    }
  }, [user])

  // Connect to real market data for TradingDashboardSection
  useEffect(() => {
    if (!isConnected) {
      // console.log('🔌 TradingDashboardSection - Connecting to WebSocket...')
      connect()
    }
  }, [isConnected, connect])

  // Subscribe to market data for TradingDashboardSection
  useEffect(() => {
    if (isConnected) {
      // console.log('📡 TradingDashboardSection - Subscribing to market data...')
      const symbols = ['BTCUSDm', 'ETHUSDm', 'XRPUSDm', 'SOLUSDm', 'EURUSDm', 'GBPUSDm', 'XAUUSDm', 'USDJPYm']
      symbols.forEach(symbol => {
        subscribe(symbol, '1H', ['ticks', 'ohlc'])
      })
    }
  }, [isConnected, subscribe])

  useEffect(() => {
    useBaseMarketStore.getState().fetchNews()
    const newsInterval = setInterval(() => {
      useBaseMarketStore.getState().fetchNews()
    }, 5 * 60 * 1000)
    return () => clearInterval(newsInterval)
  }, [])

  // Console log real data for TradingDashboardSection
  useEffect(() => {
    // console.log('🔍 TradingDashboardSection - Real Data Check:', {
    //   isConnected,
    //   tickDataSize: tickData.size,
    //   ohlcDataSize: ohlcData.size,
    //   allTickData: tickData,
    //   allOhlcData: ohlcData
    // })
    
    // Log specific currency pairs data
    const symbols = ['BTCUSDm', 'ETHUSDm', 'XRPUSDm', 'SOLUSDm', 'EURUSDm', 'GBPUSDm', 'XAUUSDm', 'USDJPYm']
    symbols.forEach(symbol => {
      const tickSymbolData = tickData.get(symbol)
      const ohlcSymbolData = ohlcData.get(symbol)
      
      if (tickSymbolData || ohlcSymbolData) {
        // console.log(`📊 ${symbol} Data:`, {
        //   tickData: tickSymbolData,
        //   ohlcData: ohlcSymbolData,
        //   latestTick: tickSymbolData?.ticks?.[tickSymbolData.ticks.length - 1],
        //   latestOhlc: ohlcSymbolData?.bars?.[ohlcSymbolData.bars.length - 1]
        // })
      }
    })
  }, [tickData, ohlcData, isConnected])

  // Update currency pairs with real dynamic data (throttled to every 3 seconds)
  useEffect(() => {
    if (tickData.size > 0) {
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateTime
      
      // Only update every 3 seconds to avoid too frequent changes
      if (timeSinceLastUpdate < 3000) {
        return
      }
      
      // console.log('🔄 TradingDashboardSection - Updating currency pairs with real data:', {
      //   tickDataSize: tickData.size,
      //   allSymbols: Array.from(tickData.keys()),
      //   timeSinceLastUpdate: `${timeSinceLastUpdate}ms`
      // })
      
      setLastUpdateTime(now)

      const symbolMapping = {
        'BTCUSDm': { symbol: 'BTC/USD', name: 'Bitcoin', icon: 'B', type: 'crypto' },
        'ETHUSDm': { symbol: 'ETH/USD', name: 'Ethereum', icon: 'E', type: 'crypto' },
        'XRPUSDm': { symbol: 'XRP/USD', name: 'Ripple', icon: 'X', type: 'crypto' },
        'SOLUSDm': { symbol: 'SOL/USD', name: 'Solana', icon: 'S', type: 'crypto' },
        'EURUSDm': { symbol: 'EUR/USD', name: 'Euro', icon: 'E', type: 'forex' },
        'GBPUSDm': { symbol: 'GBP/USD', name: 'British Pound', icon: 'G', type: 'forex' },
        'XAUUSDm': { symbol: 'XAU/USD', name: 'Gold', icon: 'X', type: 'forex' },
        'USDJPYm': { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', icon: 'U', type: 'forex' }
      }

      setCurrencyPairs(prevPairs => {
        return prevPairs.map(pair => {
          const symbolKey = Object.keys(symbolMapping).find(key => 
            symbolMapping[key].symbol === pair.symbol
          )
          
          if (symbolKey) {
            const tickSymbolData = tickData.get(symbolKey)
            
            if (tickSymbolData && tickSymbolData.ticks && tickSymbolData.ticks.length > 0) {
              const ticks = tickSymbolData.ticks
              const latestTick = ticks[ticks.length - 1]
              
              if (latestTick && latestTick.bid) {
                const currentPrice = latestTick.bid
                
                // Calculate percentage change from previous price
                let changePercent = 0
                let trend = 'Neutral'
                let probability = 50
                
                if (ticks.length > 1) {
                  const previousTick = ticks[ticks.length - 2]
                  if (previousTick && previousTick.bid) {
                    const previousPrice = previousTick.bid
                    changePercent = ((currentPrice - previousPrice) / previousPrice) * 100
                    
                    // Determine trend based on percentage change - very sensitive thresholds for real market data
                    if (changePercent > 0.005) {
                      trend = 'Strong Uptrend'
                      probability = 75
                    } else if (changePercent > 0.0005) {
                      trend = 'Uptrend'
                      probability = 65
                    } else if (changePercent > -0.0005) {
                      trend = 'Neutral'
                      probability = 50
                    } else if (changePercent > -0.005) {
                      trend = 'Weak Downtrend'
                      probability = 35
                    } else {
                      trend = 'Downtrend'
                      probability = 25
                    }
                  }
                }
                
                const changeSign = changePercent >= 0 ? '+' : ''
                const changeText = `${changeSign}${changePercent.toFixed(4)}%`
                
                // console.log(`🔄 ${pair.symbol} Final Data:`, {
                //   price: currentPrice.toFixed(2),
                //   change: changeText,
                //   trend,
                //   probability
                // })
                
                return {
                  ...pair,
                  price: currentPrice.toFixed(2),
                  change: changeText,
                  trend: trend,
                  probability: probability
                }
              }
            }
          }
          return pair
        })
      })

      if (!dataInitialized) {
        setDataInitialized(true)
      }
    }
  }, [tickData, dataInitialized, lastUpdateTime])

  // Load user tab states on dashboard mount
  useEffect(() => {
    loadTabState().catch(_error => {
      // console.error('Failed to load tab states:', _error);
    });
  }, [loadTabState]);

  // Alert Demo Animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAlertDemo(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showAlertDemo) {
      const stepTimer = setInterval(() => {
        _setCurrentAlertStep(prev => (prev + 1) % 4)
      }, 3000)

      return () => clearInterval(stepTimer)
    }
  }, [showAlertDemo])

  // Auto-rotate news carousel
  useEffect(() => {
    const carouselTimer = setInterval(() => {
      setCurrentNewsSlide(prev => (prev + 1) % 3)
    }, 5000)

    return () => clearInterval(carouselTimer)
  }, [])


  // Premium Cursor Trail Animation
  useEffect(() => {
    const handleMouseMove = (e) => {
      _setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Add new trail point
      const newTrail = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      }
      
      _setCursorTrail(prev => {
        const updated = [newTrail, ...prev].slice(0, 8) // Keep only 8 trail points
        return updated
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])


  // Load tab state in background (optional for public access)
  React.useEffect(() => {
    if (user) {
      loadTabState().catch(_error => {
        // console.error('Failed to load tab states:', _error);
      });
    }
  }, [user, loadTabState]);


  return (
    <section className="relative py-16">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
       

        {/* Unified Master Trader AI & Premium Intelligence Section */}
        <div className="relative mb-16 w-full">
          <div className="w-full">
            <div className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-lg p-6 border border-[#03c05d]/20 shadow-2xl relative overflow-hidden"
                 style={{
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.2)'
                 }}>
              
              {/* Clean Background Effects */}
              <div className="absolute inset-0 bg-[#03c05d]/5"></div>
             
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#03c05d]/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#03c05d]/10 rounded-full blur-2xl"></div>
              
              {/* Master Trader AI Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#03c05d]/20 rounded-lg flex items-center justify-center border border-[#03c05d]/30 shadow-lg">
                    <BarChart3 className="w-5 h-5 text-[#03c05d]" />
                  </div>
                  <div>
                    <h2 className="text-gray-800 dark:text-white text-2xl font-bold font-poppins">
                      Master Trader AI
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Advanced multi-timeframe analysis & AI Intelligence
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-[#03c05d]/20 backdrop-blur-md rounded-full px-4 py-2 border border-[#03c05d]/30 shadow-lg">
                  <div className="w-1.5 h-1.5 bg-[#03c05d] rounded-full"></div>
                  <span className="text-[#03c05d] text-xs font-semibold">Live Analysis</span>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex space-x-3 mb-6 relative z-10">
                {['All Pairs', 'Crypto', 'Forex'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      activeFilter === filter
                        ? 'bg-[#03c05d] text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-slate-700/80 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600/80'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Currency Pairs Grid - Exact Image Design */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {filteredPairs.map((pair, _index) => {
                  const isPositive = pair.change.startsWith('+')
                  const _isNegative = pair.change.startsWith('-')
                  
                  return (
                    <div 
                      key={pair.symbol}
                      className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-[#03c05d]/50 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group min-h-[100px]"
                    >
                      {/* Card Background Effect */}
                      <div className="absolute inset-0 bg-[#03c05d]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10 h-full flex flex-col">
                        {/* Top Section - Icon, Symbol, Trend */}
                        <div className="flex items-start justify-between ">
                          {/* Left Side - Icon and Symbol */}
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg bg-[#03c05d]/20 border border-[#03c05d]/30"
                            >
                              <span className="text-gray-800 dark:text-white font-bold text-sm">{pair.icon}</span>
                            </div>
                            <div>
                              <div className="text-gray-800 dark:text-white font-bold text-sm leading-tight">{pair.symbol}</div>
                              <div className="text-[#03c05d] text-xs font-medium leading-tight">{pair.trend}</div>
                            </div>
                          </div>
                          
                          {/* Right Side - Price and Change */}
                          <div className="text-right">
                            <div className="text-gray-800 dark:text-white font-bold text-lg leading-tight">{pair.price}</div>
                            <div className={`text-xs flex items-center justify-end ${
                              isPositive ? 'text-[#03c05d]' : 'text-red-400'
                            }`}>
                              {pair.change}
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3 ml-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bottom Section - Success Probability */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-gray-600 dark:text-gray-400 text-xs font-medium">Success Probability</div>
                            <div className="text-gray-800 dark:text-white text-xs font-medium">{pair.probability}%</div>
                          </div>
                          <div 
                            className="w-full rounded-full h-1.5 overflow-hidden bg-gray-300 dark:bg-gray-700"
                          >
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                pair.probability <= 35 ? 'bg-red-500' : 'bg-[#03c05d]'
                              }`}
                              style={{
                                width: `${pair.probability}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Premium AI Intelligence Section */}
              <div className="mt-8 relative z-10">
                {/* Premium AI Intelligence Sub-Header */}
                <div className="flex flex-col items-center justify-center mb-6">
                 
                  
                </div>

              {/* Premium News Analysis Image Carousel */}
              <div className="relative z-10 mb-6">
                <div className="relative overflow-hidden rounded-2xl">
                  {/* Carousel Container */}
                  <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentNewsSlide * 100}%)` }}>
                    
                    {/* Slide 1 - Fed Rate Decision */}
                    <div className="w-full flex-shrink-0">
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-red-500/30 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5"></div>
                        
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                          {/* News Image/Icon */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 flex-shrink-0">
                            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-400" />
                          </div>
                          
                          {/* News Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold w-fit">HIGH IMPACT</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">2 min ago</span>
                            </div>

                            <h4 className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl md:text-2xl mb-3 leading-tight">
                              Federal Reserve Rate Decision
                            </h4>
                            
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4 leading-relaxed">
                              Fed maintains rates at 5.25-5.50%, signals potential cuts in Q2 2024. Market sentiment turns bullish on USD pairs.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                              <div className="text-center sm:text-left">
                                <div className="text-red-400 font-bold text-lg sm:text-xl">9.2/10</div>
                                <div className="text-gray-400 text-xs sm:text-sm">Impact Score</div>
                              </div>
                              <div className="text-center sm:text-left">
                                <div className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl">USD/JPY</div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Primary Pair</div>
                              </div>
                              <div className="text-center sm:text-left">
                                <div className="text-green-400 font-bold text-lg sm:text-xl">Bullish</div>
                                <div className="text-gray-400 text-xs sm:text-sm">Sentiment</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 2 - ECB Report */}
                    <div className="w-full flex-shrink-0">
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-yellow-500/30 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5"></div>
                        
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                          {/* News Image/Icon */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30 flex-shrink-0">
                            <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-400" />
                          </div>
                          
                          {/* News Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold w-fit">MEDIUM IMPACT</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">15 min ago</span>
                            </div>
                            
                            <h4 className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl md:text-2xl mb-3 leading-tight">
                              ECB Economic Outlook
                            </h4>
                            
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4 leading-relaxed">
                              European Central Bank revises growth forecasts upward, hints at continued hawkish stance on inflation.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                              <div className="text-center sm:text-left">
                                <div className="text-yellow-400 font-bold text-lg sm:text-xl">6.8/10</div>
                                <div className="text-gray-400 text-xs sm:text-sm">Impact Score</div>
                              </div>
                              <div className="text-center sm:text-left">
                                <div className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl">EUR/USD</div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Primary Pair</div>
                              </div>
                              <div className="text-center sm:text-left">
                                <div className="text-yellow-400 font-bold text-lg sm:text-xl">Neutral</div>
                                <div className="text-gray-400 text-xs sm:text-sm">Sentiment</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 3 - UK PMI */}
                    <div className="w-full flex-shrink-0">
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-[#03c05d]/30 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#03c05d]/5"></div>
                        
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                          {/* News Image/Icon */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-[#03c05d]/20 rounded-2xl flex items-center justify-center border border-[#03c05d]/30 flex-shrink-0">
                            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#03c05d]" />
                          </div>
                          
                          {/* News Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                              <span className="bg-[#03c05d]/20 text-[#03c05d] px-3 py-1 rounded-full text-xs sm:text-sm font-semibold w-fit">LOW IMPACT</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">1 hour ago</span>
                            </div>
                            
                            <h4 className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl md:text-2xl mb-3 leading-tight">
                              UK Manufacturing PMI
                            </h4>
                            
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4 leading-relaxed">
                              Manufacturing PMI shows slight improvement to 48.2, still in contraction but better than expected.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                              <div className="text-center sm:text-left">
                                <div className="text-[#03c05d] font-bold text-lg sm:text-xl">4.1/10</div>
                                <div className="text-gray-400 text-xs sm:text-sm">Impact Score</div>
                              </div>
                              <div className="text-center sm:text-left">
                                <div className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl">GBP/USD</div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Primary Pair</div>
                              </div>
                              <div className="text-center sm:text-left">
                                <div className="text-[#03c05d] font-bold text-lg sm:text-xl">Bullish GBP</div>
                                <div className="text-gray-400 text-xs sm:text-sm">Sentiment</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carousel Navigation */}
                  <div className="flex items-center justify-center space-x-3 mt-6">
                    {[0, 1, 2].map((index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentNewsSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          currentNewsSlide === index 
                            ? 'bg-[#03c05d] w-8' 
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

             

              {/* Email & Telegram Alert Flow Section */}
              <div className="mt-6 relative z-10">
             
             {/* Flow Steps */}
             <div className="relative z-10">
               <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">
                 
                 {/* Step 1: Market Condition */}
                 <div className="flex flex-col items-center text-center group">
                   <div className="w-20 h-20 bg-[#03c05d]/20 rounded-2xl flex items-center justify-center border border-[#03c05d]/30 mb-4 relative">
                     <TrendingUp className="w-10 h-10 text-[#03c05d]" />
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#03c05d] rounded-full flex items-center justify-center shadow-lg">
                       <span className="text-white text-xs font-bold">1</span>
                     </div>
                   </div>
                   <h3 className="text-gray-800 dark:text-white font-semibold text-lg mb-2 font-poppins">Market Condition</h3>
                   <p className="text-gray-600 dark:text-gray-400 text-sm">RSI &gt; 70 on EUR/USD</p>
                 </div>

                 {/* Arrow 1 */}
                 <div className="hidden lg:block">
                   <div className="flex items-center space-x-2 group">
                     <div className="w-8 h-0.5 bg-[#03c05d]"></div>
                     <ArrowRight className="w-5 h-5 text-[#03c05d]" />
                   </div>
                 </div>

                 {/* Step 2: Alert Triggered */}
                 <div className="flex flex-col items-center text-center group">
                   <div className="w-20 h-20 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30 mb-4 relative">
                     <Bell className="w-10 h-10 text-yellow-400" />
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                       <span className="text-white text-xs font-bold">2</span>
                     </div>
                   </div>
                   <h3 className="text-gray-800 dark:text-white font-semibold text-lg mb-2 font-poppins">Alert Triggered</h3>
                   <p className="text-gray-600 dark:text-gray-400 text-sm">Condition met instantly</p>
                 </div>

                 {/* Arrow 2 */}
                 <div className="hidden lg:block">
                   <div className="flex items-center space-x-2 group">
                     <div className="w-8 h-0.5 bg-yellow-500"></div>
                     <ArrowRight className="w-5 h-5 text-yellow-500" />
                   </div>
                 </div>

                 {/* Step 3: Notifications Sent */}
                 <div className="flex flex-col items-center text-center group">
                   <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 mb-4 relative">
                     <Zap className="w-10 h-10 text-purple-400" />
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                       <span className="text-white text-xs font-bold">3</span>
                     </div>
                     {/* Success checkmark */}
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#03c05d] rounded-full flex items-center justify-center">
                       <CheckCircle className="w-2.5 h-2.5 text-white" />
                     </div>
                   </div>
                   <h3 className="text-gray-800 dark:text-white font-semibold text-lg mb-2 font-poppins">Notifications Sent</h3>
                   <p className="text-gray-600 dark:text-gray-400 text-sm">Email + Telegram</p>
                 </div>
               </div>

               {/* Notification Channels */}
               <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                 
                 {/* Email Notification */}
                 <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-6 border border-blue-500/30 relative overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/5"></div>
                   
                   <div className="relative z-10">
                     <div className="flex items-center space-x-4 mb-4">
                       <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                         <Mail className="w-6 h-6 text-white" />
                       </div>
                       <div>
                         <h4 className="text-gray-800 dark:text-white font-bold text-lg font-poppins">Email Alert</h4>
                         <p className="text-gray-600 dark:text-gray-400 text-sm">Instant delivery</p>
                       </div>
                     </div>
                     
                     <div className="space-y-3">
                       <div className="bg-gray-200 dark:bg-slate-700/50 rounded-lg p-3">
                         <div className="text-blue-600 text-sm font-semibold">Subject: 🚨 EUR/USD RSI Alert</div>
                         <div className="text-gray-700 dark:text-gray-300 text-sm mt-1">RSI: 72.5 (Above 70 threshold)</div>
                       </div>
                       <div className="flex items-center space-x-2 text-[#03c05d] text-sm">
                         <div className="w-2 h-2 bg-[#03c05d] rounded-full"></div>
                         <span>Delivered instantly</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Telegram Notification */}
                 <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-6 border border-cyan-500/30 relative overflow-hidden">
                   <div className="absolute inset-0 bg-cyan-500/5"></div>
                   
                   <div className="relative z-10">
                     <div className="flex items-center space-x-4 mb-4">
                       <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
                         <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                         </svg>
                       </div>
                       <div>
                         <h4 className="text-gray-800 dark:text-white font-bold text-lg font-poppins">Telegram Bot</h4>
                         <p className="text-gray-600 dark:text-gray-400 text-sm">Push notification</p>
                       </div>
                     </div>
                     
                     <div className="space-y-3">
                       <div className="bg-gray-200 dark:bg-slate-700/50 rounded-lg p-3">
                         <div className="text-cyan-600 text-sm font-semibold">📊 EUR/USD Alert</div>
                         <div className="text-gray-700 dark:text-gray-300 text-sm mt-1">RSI: 72.5 ⚠️ Overbought</div>
                       </div>
                       <div className="flex items-center space-x-2 text-[#03c05d] text-sm">
                         <div className="w-2 h-2 bg-[#03c05d] rounded-full"></div>
                         <span>Sent to your device</span>
                       </div>
                     </div>
                   </div>
                 </div>
           </div>

               {/* CTA */}
               <div className="text-center mt-8">
                 <div className="inline-flex items-center space-x-3 bg-[#03c05d]/10 border border-[#03c05d]/20 rounded-full px-6 py-3">
                   <Shield className="w-5 h-5 text-[#03c05d]" />
                   <span className="text-[#03c05d] font-semibold">Free Setup • 24/7 Monitoring</span>
                   <ArrowRight className="w-4 h-4 text-[#03c05d]" />
                 </div>
               </div>
             </div>
           </div>
          </div>
        </div>
        </div>

        

      </div>
      </div>
    </section>
  )
}

export default TradingDashboardSection
