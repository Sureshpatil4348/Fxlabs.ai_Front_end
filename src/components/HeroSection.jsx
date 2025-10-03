import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Shield, 
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
  Settings,
  Clock
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import FreeTrialPopup from './FreeTrialPopup'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../contexts/ThemeContext'
import useRSITrackerStore from '../store/useRSITrackerStore'

const HeroSection = () => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const { 
    tickData, 
    isConnected,
    connect,
    subscribe
  } = useRSITrackerStore()
  
  const [_currentPrice, _setCurrentPrice] = useState(0)
  const [_priceChange, _setPriceChange] = useState(0)
  const [_chartData, _setChartData] = useState([])
  const [_activeChart, _setActiveChart] = useState(0)
  const [selectedSymbol] = useState('EURUSDm')
  // Static real data to prevent flickering - using actual values from console logs
  const [btcData, setBtcData] = useState({ price: 112874.66, change: 0, changePercent: 0 })
  const [ethData, setEthData] = useState({ price: 0, change: 0, changePercent: 0 })
  const [marketTrend, setMarketTrend] = useState('Neutral')
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [_hasRealData, _setHasRealData] = useState(true)
  const [dataInitialized, setDataInitialized] = useState(false)
  const _scale = 1
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [isFreeTrialOpen, setIsFreeTrialOpen] = useState(false)

  // Connect to real market data
  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [isConnected, connect])

  // Set loading state based on connection and data availability
  useEffect(() => {
    if (isConnected && (btcData.price > 0 || ethData.price > 0)) {
      setIsDataLoading(false)
    } else if (!isConnected) {
      setIsDataLoading(true)
    }
  }, [isConnected, btcData.price, ethData.price])

  // Subscribe to market data
  useEffect(() => {
    if (isConnected) {
      // Subscribe to main symbol for chart
      subscribe(selectedSymbol, '1H', ['ticks', 'ohlc'])
      
      // Subscribe to additional pairs for live data
      const livePairs = ['GBPUSDm', 'USDJPYm', 'AUDUSDm', 'BTCUSDm', 'ETHUSDm']
      livePairs.forEach(symbol => {
        subscribe(symbol, '1H', ['ticks', 'ohlc'])
      })
    }
  }, [isConnected, selectedSymbol, subscribe])

  // Update chart data from real market data (tick-only)
  useEffect(() => {
    const tickSymbolData = tickData.get(selectedSymbol)
    if (tickSymbolData && tickSymbolData.ticks && tickSymbolData.ticks.length > 0) {
      const ticks = tickSymbolData.ticks.slice(-30)
      const data = ticks.map((tick, index) => {
        const price = tick.bid || tick.ask || tick.price || tick.close || 0
        return {
          x: index,
          y: price,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: Math.abs(tick.change || 0) * 1000 || 0
        }
      })
      _setChartData(data)
    } else {
      _setChartData([])
    }
  }, [tickData, selectedSymbol])

  // Update price from real tick data
  useEffect(() => {
    const symbolData = tickData.get(selectedSymbol)
    if (symbolData && symbolData.ticks && symbolData.ticks.length > 0) {
      // Get the latest tick (last element in the array)
      const latestTick = symbolData.ticks[symbolData.ticks.length - 1]
      if (latestTick && latestTick.bid) {
        const newPrice = latestTick.bid
        _setCurrentPrice(prev => {
          const change = newPrice - prev
          _setPriceChange(change)
          return newPrice
        })
      }
    }
  }, [tickData, selectedSymbol])

  // Update Bitcoin data from real market data - only once to prevent flickering
  useEffect(() => {
    const btcSymbolData = tickData.get('BTCUSDm')
    
    if (btcSymbolData && btcSymbolData.ticks && btcSymbolData.ticks.length > 0 && !dataInitialized) {
      const latestTick = btcSymbolData.ticks[btcSymbolData.ticks.length - 1]
      
      if (latestTick && latestTick.bid) {
        const newPrice = latestTick.bid
        // console.log('💰 BTC Static Price Set:', newPrice)
        
        setBtcData({
          price: newPrice,
          change: 0,
          changePercent: 0
        })
        setDataInitialized(true)
        _setHasRealData(true)
      }
    }
  }, [tickData, dataInitialized])

  // Update Ethereum data from real market data - only once to prevent flickering
  useEffect(() => {
    const ethSymbolData = tickData.get('ETHUSDm')
    
    if (ethSymbolData && ethSymbolData.ticks && ethSymbolData.ticks.length > 0 && !dataInitialized) {
      const latestTick = ethSymbolData.ticks[ethSymbolData.ticks.length - 1]
      
      if (latestTick && latestTick.bid) {
        const newPrice = latestTick.bid
        // console.log('💰 ETH Static Price Set:', newPrice)
        
        setEthData({
          price: newPrice,
          change: 0,
          changePercent: 0
        })
      }
    }
  }, [tickData, dataInitialized])

  // Set static market trend to prevent flickering
  useEffect(() => {
    if (dataInitialized) {
      setMarketTrend('Neutral')
    }
  }, [dataInitialized])

  // Close video modal on Escape key
  useEffect(() => {
    if (!showVideoModal) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowVideoModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showVideoModal])

  // Scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center pt-16 sm:pt-20 md:pt-24 lg:pt-16 pb-8 sm:pb-12 lg:pb-16">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          {/* Left Side - Text Content */}
          <div className="space-y-6 sm:space-y-7 md:space-y-8 lg:space-y-9 lg:-mt-16">
            {/* Main Headline */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-left font-poppins">
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">FX Labs</span>{' '} - Decode the Market with AI
                </span>
              </h1>

              <p className={`text-lg sm:text-xl md:text-2xl lg:text-2xl leading-relaxed max-w-2xl text-left transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                Professional-grade AI tools for <span className="text-[#03c05d] font-semibold">market analysis</span>,
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}> real-time insights</span>, and
                <span className="text-[#03c05d] font-semibold"> precision trading</span>
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">AI Chart Analysis</span>
              </div>
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">AI News Analysis</span>
              </div>
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">Closed-Candle RSI Updates</span>
              </div>
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">Daily Market Overview</span>
              </div>
            </div>

            {/* Premium CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-4 sm:py-4 bg-[#03c05d] hover:bg-[#02a04a] text-white font-semibold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-[#03c05d]/25 transform hover:scale-105"
                >
                  <BarChart3 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ) : (
                <button
                  onClick={scrollToPricing}
                  className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-4 sm:py-4 bg-[#03c05d] hover:bg-[#02a04a] text-white font-semibold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-[#03c05d]/25 transform hover:scale-105"
                >
                  <Shield className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Get Started Now</span>
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              )}

              <button 
                onClick={() => setShowVideoModal(true)}
                className={`group inline-flex items-center justify-center px-6 sm:px-8 py-4 sm:py-4 border-2 font-semibold text-base sm:text-lg rounded-xl transition-all duration-300 backdrop-blur-sm ${
                  isDarkMode
                    ? 'border-white hover:border-[#03c05d] text-white hover:text-[#03c05d]'
                    : 'border-gray-700 hover:border-[#03c05d] text-gray-700 hover:text-[#03c05d]'
                }`}>
                <Play className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Premium Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 md:gap-6 pt-4 sm:pt-5">
              <div className="inline-flex items-center space-x-2 bg-white/10 border border-[#03c05d]/30 rounded-lg px-4 py-3 text-[#03c05d] text-sm font-semibold shadow-lg shadow-[#03c05d]/20 backdrop-blur-sm transition-all duration-300 hover:shadow-[#03c05d]/30">
                <CheckCircle className="w-5 h-5" />
                <span>80% Accuracy</span>
              </div>
              <div className="inline-flex items-center space-x-2 bg-white/10 border border-[#03c05d]/30 rounded-lg px-4 py-3 text-[#03c05d] text-sm font-semibold shadow-lg shadow-[#03c05d]/20 backdrop-blur-sm transition-all duration-300 hover:shadow-[#03c05d]/30">
                <Clock className="w-5 h-5" />
                <span>24/7 Live Updates</span>
              </div>
              <div className="inline-flex items-center space-x-2 bg-white/10 border border-[#03c05d]/30 rounded-lg px-4 py-3 text-[#03c05d] text-sm font-semibold shadow-lg shadow-[#03c05d]/20 backdrop-blur-sm transition-all duration-300 hover:shadow-[#03c05d]/30">
                <Sparkles className="w-5 h-5" />
                <span>10+ AI Analysis Tools</span>
              </div>
            </div>
          </div>

          {/* Right Side - Supreme Professional Visual */}
          <div className="relative group mt-8 lg:mt-0">
            {/* Master Trader AI Dashboard Container */}
            <div className="relative w-full max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[650px] xl:max-w-[700px] mx-auto min-h-[550px] sm:min-h-[500px] md:min-h-[580px] lg:min-h-[650px] xl:min-h-[700px] bg-white dark:bg-slate-900 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 border border-[#03c05d]/20 shadow-2xl cursor-pointer transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1 group-hover:shadow-3xl overflow-hidden"
                 style={{
                   transformStyle: 'preserve-3d',
                   perspective: '1000px',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.2), 0 0 20px rgba(3, 192, 93, 0.1)'
                 }}>
              
              
              {/* Master Trader AI Header */}
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#03c05d]/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#03c05d]" />
                  </div>
                  <span className="text-gray-800 dark:text-white text-sm sm:text-base font-bold font-poppins">FXLabs - decode the Market with AI</span>
                </div>
                <div className="flex items-center space-x-2 bg-[#03c05d]/20 backdrop-blur-md rounded-lg px-3 py-2 border border-[#03c05d]/30">
                  <div className="w-2 h-2 bg-[#03c05d] rounded-full animate-pulse"></div>
                  <span className="text-[#03c05d] text-xs sm:text-sm font-semibold">Live Analysis</span>
                </div>
              </div>

              {/* Cryptocurrency Analysis Cards */}
              <div className="space-y-4 sm:space-y-5">
                {/* Bitcoin Analysis Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#03c05d]/20 shadow-lg">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#03c05d]/20 rounded-full flex items-center justify-center">
                        <span className="text-gray-800 dark:text-white font-bold text-sm">BTC</span>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-white font-semibold text-base sm:text-lg">Bitcoin</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">BTC/USD</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl">
                        {isDataLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>${btcData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full" title="Real Data (Static)"></div>
                          </div>
                        )}
                      </div>
                      <div className={`text-sm flex items-center ${btcData.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {!isDataLoading && (
                          <>
                            {btcData.changePercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {`${btcData.changePercent >= 0 ? '+' : ''}${btcData.changePercent.toFixed(2)}%`}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bitcoin Price Chart */}
                  <div className="h-16 sm:h-20 mb-3 sm:mb-4 relative">
                    <svg className="w-full h-full" viewBox="0 0 700 60">
                      <path
                        d="M0,35 Q175,20 350,25 Q525,30 700,28"
                        stroke="#03c05d"
                        strokeWidth="2"
                        fill="none"
                        opacity="0.6"
                      />
                    </svg>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Success Probability</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-[#03c05d] h-2 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="text-[#03c05d] text-sm mt-1">35%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-[#03c05d] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-red-500 dark:text-red-400 text-sm">Weak Downtrend</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-sm">
                        <Clock className="w-3 h-3" />
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ethereum Analysis Card */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#03c05d]/20 shadow-lg">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#03c05d]/20 rounded-full flex items-center justify-center">
                        <span className="text-gray-800 dark:text-white font-bold text-sm">ETH</span>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-white font-semibold text-base sm:text-lg">Ethereum</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">ETH/USD</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold text-lg sm:text-xl">
                        {isDataLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>${ethData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full" title="Real Data (Static)"></div>
                          </div>
                        )}
                      </div>
                      <div className={`text-sm flex items-center ${ethData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {!isDataLoading && (
                          <>
                            {ethData.changePercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {`${ethData.changePercent >= 0 ? '+' : ''}${ethData.changePercent.toFixed(2)}%`}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ethereum Price Chart */}
                  <div className="h-16 sm:h-20 mb-3 sm:mb-4 relative">
                    <svg className="w-full h-full" viewBox="0 0 700 60">
                      <path
                        d="M0,40 Q175,25 350,30 Q525,35 700,32"
                        stroke="#03c05d"
                        strokeWidth="2"
                        fill="none"
                        opacity="0.6"
                      />
                    </svg>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs mb-0.5">Success Probability</div>
                      <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-[#03c05d] h-1.5 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="text-[#03c05d] text-xs mt-0.5">35%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-3 h-3 bg-[#03c05d] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-red-500 dark:text-red-400 text-xs">Weak Downtrend</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-xs">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Market Trend Section */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#03c05d]/20 shadow-lg mt-4 sm:mt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#03c05d]/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-[#03c05d]" />
                    </div>
                    <span className={`font-semibold text-base sm:text-lg ${
                      marketTrend === 'Bullish' ? 'text-[#03c05d]' : 
                      marketTrend === 'Bearish' ? 'text-red-500 dark:text-red-400' : 
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      Market Trend: {marketTrend}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsFreeTrialOpen(true)}
                    className="bg-[#03c05d] hover:bg-[#02a04a] text-white px-5 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors">
                    View Full Analysis
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* YouTube Video Modal */}
      {showVideoModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          {/* Full-screen close target behind dialog (click outside to close) */}
          <button
            type="button"
            aria-label="Close video modal overlay"
            onClick={() => setShowVideoModal(false)}
            className="absolute inset-0 w-full h-full"
            tabIndex={-1}
          />

          <div 
            role="document"
            className="relative w-full max-w-4xl mx-4 z-10"
          >
            <h2 id="video-modal-title" className="sr-only">Demo Video</h2>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-[#03c05d] transition-colors duration-300"
              aria-label="Close video modal"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* YouTube Video */}
            <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden shadow-2xl">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1"
                title="Demo Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Free Trial Popup (same as Start Free Trial) */}
      <FreeTrialPopup isOpen={isFreeTrialOpen} onClose={() => setIsFreeTrialOpen(false)} />
    </section>
  )
}

export default HeroSection
