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
import useRSITrackerStore from '../store/useRSITrackerStore'

const HeroSection = () => {
  const { user } = useAuth()
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Text Content */}
          <div className="space-y-6">
            {/* Premium Badge */}
           

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-left font-poppins">
                <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 dark:from-green-400 dark:via-emerald-300 dark:to-teal-400 bg-clip-text text-transparent animate-pulse ml-10">
                  Decode the
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-600 dark:from-blue-400 dark:via-cyan-300 dark:to-green-400 bg-clip-text text-transparent">
                Market with AI
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-xl text-left transition-colors duration-300">
                Professional-grade AI tools for <span className="text-green-600 dark:text-green-400 font-semibold">market analysis</span>, 
                <span className="text-blue-600 dark:text-blue-400 font-semibold"> real-time insights</span>, and 
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> precision trading</span>
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-lg font-medium">AI Chart Analysis</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-lg font-medium">AI News Analysis</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-lg font-medium">Real-time RSI Updates</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-lg font-medium">Daily Market Overview</span>
              </div>
            </div>

            {/* Premium CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-base rounded-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                >
                  <BarChart3 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-base rounded-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                >
                  <Shield className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              )}
              
              <button className="group inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-white font-semibold text-base rounded-xl transition-all duration-300 backdrop-blur-sm">
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Premium Trust Indicators */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-500/20 dark:border-green-500/20 rounded-full px-4 py-2 text-green-600 dark:text-green-400 text-sm font-semibold shadow-lg shadow-green-500/20 dark:shadow-green-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <CheckCircle className="w-4 h-4" />
                <span>80% Accuracy</span>
              </div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-full px-4 py-2 text-blue-600 dark:text-blue-400 text-sm font-semibold shadow-lg shadow-blue-500/20 dark:shadow-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Clock className="w-4 h-4" />
                <span>24/7 Live Updates</span>
              </div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-500/20 dark:border-purple-500/20 rounded-full px-4 py-2 text-purple-600 dark:text-purple-400 text-sm font-semibold shadow-lg shadow-purple-500/20 dark:shadow-purple-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Sparkles className="w-4 h-4" />
                <span>10+ AI Analysis Tools</span>
              </div>
            </div>
          </div>

          {/* Right Side - Supreme Professional Visual */}
          <div className="relative group">
            {/* Master Trader AI Dashboard Container */}
            <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 backdrop-blur-xl rounded-3xl p-6 border border-green-500/20 shadow-2xl cursor-pointer transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1 group-hover:shadow-3xl overflow-hidden"
                 style={{
                   transformStyle: 'preserve-3d',
                   perspective: '1000px',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.2)'
                 }}>
              
              {/* Master Trader AI Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-800 dark:text-white text-lg font-bold font-poppins">Master Trader AI</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-500/20 backdrop-blur-md rounded-xl px-4 py-2 border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Live Analysis</span>
                </div>
              </div>

              {/* Cryptocurrency Analysis Cards */}
              <div className="space-y-4">
                {/* Bitcoin Analysis Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-4 border border-green-500/20 dark:border-green-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-gray-800 dark:text-white font-bold text-sm">BTC</span>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-white font-semibold">Bitcoin</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">BTC/USD</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold text-lg">
                        {isDataLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading...</span>
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
                  <div className="h-16 mb-3 relative">
                    <svg className="w-full h-full" viewBox="0 0 200 60">
                      <path
                        d="M0,45 L20,40 L40,35 L60,30 L80,25 L100,20 L120,25 L140,30 L160,35 L180,40 L200,45"
                        stroke="#10b981"
                        strokeWidth="2"
                        fill="none"
                        opacity="0.6"
                      />
                    </svg>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Success Probability</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="text-orange-600 dark:text-orange-400 text-xs mt-1">35%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-gray-800 dark:text-white text-sm">Weak Downtrend</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ethereum Analysis Card */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-4 border border-green-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-gray-800 dark:text-white font-bold text-sm">ETH</span>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-white font-semibold">Ethereum</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">ETH/USD</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold text-lg">
                        {isDataLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading...</span>
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
                  <div className="h-16 mb-3 relative">
                    <svg className="w-full h-full" viewBox="0 0 200 60">
                      <path
                        d="M0,50 L20,45 L40,40 L60,35 L80,30 L100,25 L120,30 L140,35 L160,40 L180,45 L200,50"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        fill="none"
                        opacity="0.6"
                      />
                    </svg>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Success Probability</div>
                      <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="text-orange-600 dark:text-orange-400 text-xs mt-1">35%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-gray-800 dark:text-white text-sm">Weak Downtrend</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Market Trend Section */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-4 border border-green-500/20 shadow-lg mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className={`font-semibold ${
                      marketTrend === 'Bullish' ? 'text-green-600 dark:text-green-400' : 
                      marketTrend === 'Bearish' ? 'text-red-600 dark:text-red-400' : 
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      Market Trend: {marketTrend}
                    </span>
                  </div>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ">
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
