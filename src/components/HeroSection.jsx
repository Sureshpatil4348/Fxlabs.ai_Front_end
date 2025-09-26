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

import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../contexts/ThemeContext'
import useRSITrackerStore from '../store/useRSITrackerStore'

const HeroSection = () => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const { 
    ohlcData, 
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

  // Update chart data from real market data
  useEffect(() => {
    // Try OHLC data first
    const ohlcSymbolData = ohlcData.get(selectedSymbol)
    if (ohlcSymbolData && ohlcSymbolData.bars && ohlcSymbolData.bars.length > 0) {
      const bars = ohlcSymbolData.bars.slice(-30) // Get last 30 bars
      const data = bars.map((bar, index) => ({
        x: index,
        y: bar.close,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close
      }))
      _setChartData(data)
    } else {
      // Fallback to tick data for line chart
      const tickSymbolData = tickData.get(selectedSymbol)
      if (tickSymbolData && tickSymbolData.ticks && tickSymbolData.ticks.length > 0) {
        const ticks = tickSymbolData.ticks.slice(-30) // Get last 30 ticks
        const data = ticks.map((tick, index) => {
          const price = tick.bid || tick.ask || tick.price || tick.close || 0
          return {
            x: index,
            y: price,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: Math.abs(tick.change || 0) * 1000 || 0 // Calculate volume from price change
          }
        })
        _setChartData(data)
      } else {
        // No data available
        _setChartData([])
      }
    }
  }, [ohlcData, tickData, selectedSymbol])

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

  return (
    <section className="relative min-h-screen flex items-center">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-12 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ">
          
          {/* Left Side - Text Content */}
          <div className="space-y-4 sm:space-y-6 -ml-2 sm:-ml-4 lg:-ml-8">
            {/* Premium Badge */}
           

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-left font-poppins">
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Decode the
                </span>
                <br />
                <span className="text-[#03c05d]">
                Market with AI
                </span>
              </h1>
              
              <p className={`text-lg sm:text-xl md:text-2xl leading-relaxed max-w-xl text-left transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Professional-grade AI tools for <span className="text-[#03c05d] font-semibold">market analysis</span>, 
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}> real-time insights</span>, and 
                <span className="text-[#03c05d] font-semibold"> precision trading</span>
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-6 h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">AI Chart Analysis</span>
              </div>
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-6 h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">AI News Analysis</span>
              </div>
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-6 h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">Closed-Candle RSI Updates</span>
              </div>
              <div className={`flex items-center space-x-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                <CheckCircle className="w-6 h-6 text-[#03c05d] flex-shrink-0" />
                <span className="text-base sm:text-lg font-medium">Daily Market Overview</span>
              </div>
            </div>

            {/* Premium CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group relative inline-flex items-center justify-center px-6 py-3 bg-[#03c05d] hover:bg-[#02a04a] text-white font-semibold text-base rounded-xl transition-all duration-300 shadow-2xl hover:shadow-[#03c05d]/25 transform hover:scale-105"
                >
                  <BarChart3 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center px-6 py-3 bg-[#03c05d] hover:bg-[#02a04a] text-white font-semibold text-base rounded-xl transition-all duration-300 shadow-2xl hover:shadow-[#03c05d]/25 transform hover:scale-105"
                >
                  <Shield className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              )}
              
              <button className={`group inline-flex items-center justify-center px-6 py-3 border-2 font-semibold text-base rounded-xl transition-all duration-300 backdrop-blur-sm ${
                isDarkMode 
                  ? 'border-white hover:border-[#03c05d] text-white hover:text-[#03c05d]' 
                  : 'border-gray-700 hover:border-[#03c05d] text-gray-700 hover:text-[#03c05d]'
              }`}>
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Premium Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-4">
              <div className="inline-flex items-center space-x-3 bg-white/10 border border-[#03c05d]/30 rounded-md px-4 py-3 text-[#03c05d] text-sm font-semibold shadow-lg shadow-[#03c05d]/20 backdrop-blur-sm transition-all duration-300 hover:shadow-[#03c05d]/30">
                <CheckCircle className="w-5 h-5" />
                <span>80% Accuracy</span>
              </div>
              <div className="inline-flex items-center space-x-3 bg-white/10 border border-[#03c05d]/30 rounded-md px-4 py-3 text-[#03c05d] text-sm font-semibold shadow-lg shadow-[#03c05d]/20 backdrop-blur-sm transition-all duration-300 hover:shadow-[#03c05d]/30">
                <Clock className="w-5 h-5" />
                <span>24/7 Live Updates</span>
              </div>
              <div className="inline-flex items-center space-x-3 bg-white/10 border border-[#03c05d]/30 rounded-md px-4 py-3 text-[#03c05d] text-sm font-semibold shadow-lg shadow-[#03c05d]/20 backdrop-blur-sm transition-all duration-300 hover:shadow-[#03c05d]/30">
                <Sparkles className="w-5 h-5" />
                <span>10+ AI Analysis Tools</span>
              </div>
            </div>
          </div>

          {/* Right Side - Supreme Professional Visual */}
          <div className="relative group">
            {/* Master Trader AI Dashboard Container */}
            <div className="relative w-full max-w-[650px] mx-auto lg:w-[650px] bg-white dark:bg-slate-900 backdrop-blur-xl rounded-3xl p-3 sm:p-4 border border-[#03c05d]/20 shadow-2xl cursor-pointer transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1 group-hover:shadow-3xl overflow-hidden"
                 style={{
                   transformStyle: 'preserve-3d',
                   perspective: '1000px',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.2), 0 0 20px rgba(3, 192, 93, 0.1)'
                 }}>
              
              
              {/* Master Trader AI Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#03c05d]/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-3 h-3 text-[#03c05d]" />
                  </div>
                  <span className="text-gray-800 dark:text-white text-sm font-bold font-poppins">Master Trader AI</span>
                </div>
                <div className="flex items-center space-x-1 bg-[#03c05d]/20 backdrop-blur-md rounded-lg px-2 py-1 border border-[#03c05d]/30">
                  <div className="w-1.5 h-1.5 bg-[#03c05d] rounded-full animate-pulse"></div>
                  <span className="text-[#03c05d] text-xs font-semibold">Live Analysis</span>
                </div>
              </div>

              {/* Cryptocurrency Analysis Cards */}
              <div className="space-y-3">
                {/* Bitcoin Analysis Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-[#03c05d]/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-[#03c05d]/20 rounded-full flex items-center justify-center">
                        <span className="text-gray-800 dark:text-white font-bold text-xs">BTC</span>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-white font-semibold text-sm">Bitcoin</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">BTC/USD</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold text-base">
                        {isDataLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span>${btcData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" title="Real Data (Static)"></div>
                          </div>
                        )}
                      </div>
                      <div className={`text-xs flex items-center ${btcData.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {!isDataLoading && (
                          <>
                            {btcData.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                            {`${btcData.changePercent >= 0 ? '+' : ''}${btcData.changePercent.toFixed(2)}%`}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bitcoin Price Chart */}
                  <div className="h-12 mb-2 relative">
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
                  
                  <div className="space-y-1.5">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs mb-0.5">Success Probability</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-[#03c05d] h-1.5 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="text-[#03c05d] text-xs mt-0.5">35%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-3 h-3 bg-[#03c05d] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-red-500 text-xs">Weak Downtrend</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-xs">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ethereum Analysis Card */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 border border-[#03c05d]/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-[#03c05d]/20 rounded-full flex items-center justify-center">
                        <span className="text-gray-800 dark:text-white font-bold text-xs">ETH</span>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-white font-semibold text-sm">Ethereum</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">ETH/USD</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold text-base">
                        {isDataLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span>${ethData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" title="Real Data (Static)"></div>
                          </div>
                        )}
                      </div>
                      <div className={`text-xs flex items-center ${ethData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {!isDataLoading && (
                          <>
                            {ethData.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                            {`${ethData.changePercent >= 0 ? '+' : ''}${ethData.changePercent.toFixed(2)}%`}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ethereum Price Chart */}
                  <div className="h-12 mb-2 relative">
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
                        <span className="text-red-500 text-xs">Weak Downtrend</span>
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
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-[#03c05d]/20 shadow-lg mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#03c05d]/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#03c05d]" />
                    </div>
                    <span className={`font-semibold ${
                      marketTrend === 'Bullish' ? 'text-[#03c05d]' : 
                      marketTrend === 'Bearish' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      Market Trend: {marketTrend}
                    </span>
                  </div>
                  <button className="bg-[#03c05d] hover:bg-[#02a04a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ">
                    View Full Analysis
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
