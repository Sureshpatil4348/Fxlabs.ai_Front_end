import { Bell, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../contexts/ThemeContext'
import useBaseMarketStore from '../store/useBaseMarketStore'
import useMarketStore from '../store/useMarketStore'
import useRSITrackerStore from '../store/useRSITrackerStore'

const TradingDashboardSection = () => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const { } = useMarketStore()
  const { 
    tickData, 
    isConnected,
    connect,
    subscribe
  } = useRSITrackerStore()
  const connectionInitiated = useRef(false)
  const [showAlertDemo, setShowAlertDemo] = useState(false)
  const [_currentAlertStep, _setCurrentAlertStep] = useState(0)
  const [currentNewsSlide, setCurrentNewsSlide] = useState(0)
  const [_currencyPairs, setCurrencyPairs] = useState([
    { symbol: 'BTC/USD', name: 'Bitcoin', price: '112874.66', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'B' },
    { symbol: 'ETH/USD', name: 'Ethereum', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'E' },
    { symbol: 'EUR/USD', name: 'Euro', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'forex', icon: 'E' },
    { symbol: 'GBP/USD', name: 'British Pound', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'forex', icon: 'G' },
    { symbol: 'SOL/USD', name: 'Solana', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'S' },
    { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'forex', icon: 'U' },
    { symbol: 'XAU/USD', name: 'Gold', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'commodity', icon: 'X' },
    { symbol: 'OIL/USD', name: 'Crude Oil', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'commodity', icon: 'O' },
    { symbol: 'XRP/USD', name: 'Ripple', price: '0.00', change: '0.00%', trend: 'Neutral', probability: 50, type: 'crypto', icon: 'X' }
  ])
  const [dataInitialized, setDataInitialized] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  
  // Removed unused active filter for consistent design
  
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
      const symbols = ['BTCUSDm', 'ETHUSDm', 'XRPUSDm', 'SOLUSDm', 'EURUSDm', 'GBPUSDm', 'XAUUSDm', 'USOILm', 'USDJPYm']
      symbols.forEach(symbol => {
        subscribe(symbol, '1H', ['ticks', 'ohlc'])
      })
    }
  }, [isConnected, subscribe])

  // News fetching centralized in Dashboard; remove duplicate here

  // Console log real data for TradingDashboardSection (tick-only)
  useEffect(() => {
    const symbols = ['BTCUSDm', 'ETHUSDm', 'XRPUSDm', 'SOLUSDm', 'EURUSDm', 'GBPUSDm', 'XAUUSDm', 'USOILm', 'USDJPYm']
    symbols.forEach(symbol => {
      const tickSymbolData = tickData.get(symbol)
      if (tickSymbolData) {
        // Optional debug retained but commented to avoid noise
      }
    })
  }, [tickData, isConnected])

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
        'XAUUSDm': { symbol: 'XAU/USD', name: 'Gold', icon: 'X', type: 'commodity' },
        'USOILm': { symbol: 'OIL/USD', name: 'Crude Oil', icon: 'O', type: 'commodity' },
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

  // Load user tab state once via Dashboard (avoid duplicate here)

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


  // Removed cursor trail effect for design consistency


  // Load tab state in background (optional for public access)
  React.useEffect(() => {
    if (user) {
      loadTabState().catch(_error => {
        // console.error('Failed to load tab states:', _error);
      });
    }
  }, [user, loadTabState]);


  return (
    <section className="relative py-12 overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Premium Intelligence Section */}
        <div className="space-y-12">
          
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20">
              <Zap className="w-4 h-4 text-[#03c05d]" />
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>Real-Time Market Intelligence</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
              AI News Updates
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Get instant alerts on high-impact news and market conditions that matter to your trades
            </p>
          </div>

          {/* News Carousel */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <div className="flex transition-all duration-700 ease-out" style={{ transform: `translateX(-${currentNewsSlide * 100}%)` }}>
                
                {/* Slide 1 - Fed Rate Decision */}
                <div className="w-full flex-shrink-0 px-2">
                  <div className={`relative group ${isDarkMode ? 'bg-gradient-to-br from-[#19235d]/90 to-[#19235d]/90' : 'bg-gradient-to-br from-white to-gray-50/50'} backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border ${isDarkMode ? 'border-[#19235d]/50' : 'border-gray-200/50'} transition-all duration-500`}>
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#03c05d]/5 via-transparent to-emerald-500/5 rounded-3xl"></div>
                    
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#03c05d]/5 to-transparent"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
                      {/* Icon with animation */}
                      <div className="relative">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 shadow-lg shadow-red-500/10 group-hover:scale-110 transition-transform duration-500">
                          <AlertTriangle className="w-10 h-10 lg:w-12 lg:h-12 text-red-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-500 font-bold text-sm shadow-lg shadow-red-500/10">
                            HIGH IMPACT
                          </span>
                          <span className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="w-2 h-2 bg-[#03c05d] rounded-full animate-pulse"></div>
                            2 min ago
                          </span>
                        </div>

                        <h3 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'} leading-tight`}>
                          Federal Reserve Rate Decision
                        </h3>
                        
                        <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                          Fed maintains rates at 5.25-5.50%, signals potential cuts in Q2 2024. Market sentiment turns bullish on USD pairs.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 pt-4">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold bg-gradient-to-r from-[#03c05d] to-emerald-500 bg-clip-text text-transparent">9.2/10</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Impact Score</div>
                          </div>
                          <div className="space-y-1">
                            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>USD/JPY</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Primary Pair</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-[#03c05d]">Bullish</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Sentiment</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 2 - ECB Report */}
                <div className="w-full flex-shrink-0 px-2">
                  <div className={`relative group ${isDarkMode ? 'bg-gradient-to-br from-[#19235d]/90 to-[#19235d]/90' : 'bg-gradient-to-br from-white to-gray-50/50'} backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border ${isDarkMode ? 'border-[#19235d]/50' : 'border-gray-200/50'} transition-all duration-500`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#03c05d]/5 via-transparent to-emerald-500/5 rounded-3xl"></div>
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#03c05d]/5 to-transparent"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
                      <div className="relative">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30 shadow-lg shadow-yellow-500/10 group-hover:scale-110 transition-transform duration-500">
                          <TrendingUp className="w-10 h-10 lg:w-12 lg:h-12 text-yellow-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full animate-pulse shadow-lg"></div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-500 font-bold text-sm shadow-lg shadow-yellow-500/10">
                            MEDIUM IMPACT
                          </span>
                          <span className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="w-2 h-2 bg-[#03c05d] rounded-full animate-pulse"></div>
                            15 min ago
                          </span>
                        </div>

                        <h3 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'} leading-tight`}>
                          ECB Economic Outlook
                        </h3>
                        
                        <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                          European Central Bank revises growth forecasts upward, hints at continued hawkish stance on inflation.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 pt-4">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold bg-gradient-to-r from-[#03c05d] to-emerald-500 bg-clip-text text-transparent">6.8/10</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Impact Score</div>
                          </div>
                          <div className="space-y-1">
                            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>EUR/USD</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Primary Pair</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-[#03c05d]">Neutral</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Sentiment</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 3 - UK PMI */}
                <div className="w-full flex-shrink-0 px-2">
                  <div className={`relative group ${isDarkMode ? 'bg-gradient-to-br from-[#19235d]/90 to-[#19235d]/90' : 'bg-gradient-to-br from-white to-gray-50/50'} backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border ${isDarkMode ? 'border-[#19235d]/50' : 'border-gray-200/50'} transition-all duration-500`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#03c05d]/5 via-transparent to-emerald-500/5 rounded-3xl"></div>
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#03c05d]/5 to-transparent"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
                      <div className="relative">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[#03c05d]/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-[#03c05d]/30 shadow-lg shadow-[#03c05d]/10 group-hover:scale-110 transition-transform duration-500">
                          <CheckCircle className="w-10 h-10 lg:w-12 lg:h-12 text-[#03c05d]" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#03c05d] to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-[#03c05d]/20 to-emerald-500/20 border border-[#03c05d]/30 text-[#03c05d] font-bold text-sm shadow-lg shadow-[#03c05d]/10">
                            LOW IMPACT
                          </span>
                          <span className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="w-2 h-2 bg-[#03c05d] rounded-full animate-pulse"></div>
                            1 hour ago
                          </span>
                        </div>

                        <h3 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'} leading-tight`}>
                          UK Manufacturing PMI
                        </h3>
                        
                        <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                          Manufacturing PMI shows slight improvement to 48.2, still in contraction but better than expected.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 pt-4">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold bg-gradient-to-r from-[#03c05d] to-emerald-500 bg-clip-text text-transparent">4.1/10</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Impact Score</div>
                          </div>
                          <div className="space-y-1">
                            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>GBP/USD</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Primary Pair</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-[#03c05d]">Bullish GBP</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wide`}>Sentiment</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Carousel Navigation */}
              <div className="flex items-center justify-center gap-3 mt-8">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentNewsSlide(index)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      currentNewsSlide === index 
                        ? 'bg-gradient-to-r from-[#03c05d] to-emerald-500 w-12' 
                        : `${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} w-2`
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Alert Flow Section - Minimalist Premium Design */}
          <div className="relative">
            {/* Section Title */}
            <div className="text-center mb-12 sm:mb-16">
              <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19235d]'} mb-4`}>
                How Alerts Work
              </h3>
              <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto px-4`}>
                Instant notifications delivered right to your inbox and Telegram
              </p>
            </div>

            {/* Flow Steps - Clean Horizontal Layout */}
            <div className="relative max-w-5xl mx-auto">
              {/* Connection Line - Desktop Only */}
              <div className="hidden md:block absolute top-16 sm:top-18 md:top-20 left-0 right-0 h-0.5 z-0">
                <div className={`h-full ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-700 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'}`}></div>
              </div>

              {/* Steps Grid */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-8 lg:gap-8">
                
                {/* Step 1: Market Condition */}
                <div className="flex flex-col items-center text-center group">
                  {/* Icon Container */}
                  <div className="relative mb-6 sm:mb-8">
                    {/* Subtle glow effect */}
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#03c05d]/10' : 'bg-[#03c05d]/5'} rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                    
                    {/* Main circle */}
                    <div className={`relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-[#19235d]/80 to-[#19235d]/80 border border-[#19235d]/50' 
                        : 'bg-white border border-gray-200'
                    } shadow-lg group-hover:shadow-xl transition-all duration-500`}>
                      <TrendingUp className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-[#03c05d]" />
                      
                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-[#03c05d] rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm sm:text-base">1</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
                      Market Condition
                    </h4>
                    <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-xs mx-auto leading-relaxed px-2`}>
                      RSI exceeds 70 on EUR/USD
                    </p>
                  </div>
                </div>

                {/* Step 2: Alert Triggered */}
                <div className="flex flex-col items-center text-center group">
                  {/* Icon Container */}
                  <div className="relative mb-6 sm:mb-8">
                    {/* Subtle glow effect */}
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#03c05d]/10' : 'bg-[#03c05d]/5'} rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                    
                    {/* Main circle */}
                    <div className={`relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-[#19235d]/80 to-[#19235d]/80 border border-[#19235d]/50' 
                        : 'bg-white border border-gray-200'
                    } shadow-lg group-hover:shadow-xl transition-all duration-500`}>
                      <Bell className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-[#03c05d]" />
                      
                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-[#03c05d] rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm sm:text-base">2</span>
                      </div>

                      {/* Subtle pulse indicator */}
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-2 h-2 bg-[#03c05d] rounded-full animate-ping"></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
                      Alert Triggered
                    </h4>
                    <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-xs mx-auto leading-relaxed px-2`}>
                      Condition met instantly
                    </p>
                  </div>
                </div>

                {/* Step 3: Notifications Sent */}
                <div className="flex flex-col items-center text-center group">
                  {/* Icon Container */}
                  <div className="relative mb-6 sm:mb-8">
                    {/* Subtle glow effect */}
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#03c05d]/10' : 'bg-[#03c05d]/5'} rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                    
                    {/* Main circle */}
                    <div className={`relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-[#19235d]/80 to-[#19235d]/80 border border-[#19235d]/50' 
                        : 'bg-white border border-gray-200'
                    } shadow-lg group-hover:shadow-xl transition-all duration-500`}>
                      <Zap className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-[#03c05d]" />
                      
                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-[#03c05d] rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm sm:text-base">3</span>
                      </div>

                      {/* Success indicator */}
                      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-5 h-5 sm:w-6 sm:h-6 bg-[#03c05d] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
                      Notifications Sent
                    </h4>
                    <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-xs mx-auto leading-relaxed px-2`}>
                      Email + Telegram
                    </p>
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
