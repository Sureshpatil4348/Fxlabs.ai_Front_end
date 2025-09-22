import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  ArrowRight,
  Play,
  Star,
  CheckCircle,
  Sparkles
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
  
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)
  const [chartData, setChartData] = useState([])
  const [activeChart, setActiveChart] = useState(0)
  const [selectedSymbol] = useState('EURUSDm')
  const _scale = 1

  // Connect to real market data
  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [isConnected, connect])

  // Subscribe to market data
  useEffect(() => {
    if (isConnected) {
      // Subscribe to main symbol for chart
      subscribe(selectedSymbol, '1H', ['ticks', 'ohlc'])
      
      // Subscribe to additional pairs for live data
      const livePairs = ['GBPUSDm', 'USDJPYm', 'AUDUSDm']
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
      setChartData(data)
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
        setChartData(data)
      } else {
        // No data available
        setChartData([])
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
        setCurrentPrice(prev => {
          const change = newPrice - prev
          setPriceChange(change)
          return newPrice
        })
      }
    }
  }, [tickData, selectedSymbol])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Matrix-Style Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-blue-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-50"></div>
        <div className="absolute top-60 right-40 w-5 h-5 bg-purple-400 rounded-full animate-pulse opacity-30"></div>
        
        {/* Matrix Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>
        
        {/* Matrix-Style Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        
        {/* Matrix Code Rain Effect */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400 font-mono text-xs animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {Math.random().toString(36).substring(2, 8)}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Text Content */}
          <div className="space-y-6">
            {/* Premium Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-semibold shadow-lg shadow-green-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Trading Intelligence</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-left">
                <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent animate-pulse">
                  Advanced Trading
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-green-400 bg-clip-text text-transparent">
                  Intelligence Platform
                </span>
              </h1>
              
              <p className="text-lg text-gray-300 leading-relaxed max-w-xl text-left">
                Professional-grade AI tools for <span className="text-green-400 font-semibold">market analysis</span>, 
                <span className="text-blue-400 font-semibold"> real-time insights</span>, and 
                <span className="text-emerald-400 font-semibold"> precision trading</span>
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>AI Chart Analysis</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>AI News Analysis</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Real-time RSI Updates</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Daily Market Overview</span>
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
              
              <button className="group inline-flex items-center justify-center px-6 py-3 border-2 border-gray-600 hover:border-green-400 text-gray-300 hover:text-white font-semibold text-base rounded-xl transition-all duration-300 backdrop-blur-sm">
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Premium Trust Indicators */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                ))}
                <span className="text-gray-400 text-xs ml-2">4.9/5 Rating</span>
              </div>
              <div className="text-gray-400 text-xs">
                <span className="text-green-400 font-semibold">10,000+</span> Active Traders
              </div>
            </div>
          </div>

          {/* Right Side - Supreme Professional Visual */}
          <div className="relative group">
            {/* Matrix-Style Trading Visual Container */}
            <div className="relative bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-green-500/20 shadow-2xl cursor-pointer transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1 group-hover:shadow-3xl overflow-hidden"
                 style={{
                   transformStyle: 'preserve-3d',
                   perspective: '1000px',
                   background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(16,185,129,0.1) 50%, rgba(0,0,0,0.2) 100%)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.2)'
                 }}>
              
              {/* Matrix Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="matrixGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#10b981" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#matrixGrid)" />
                </svg>
              </div>
              
              {/* Matrix Corner Accents */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-green-500/30 to-transparent rounded-br-3xl"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-emerald-500/30 to-transparent rounded-tl-3xl"></div>
              
              {/* Matrix Professional Dashboard */}
              <div className="relative space-y-4 z-10">
                {/* Compact Matrix Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-500/10 backdrop-blur-md rounded-xl px-4 py-2 border border-green-500/20">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-semibold tracking-wide">FXLabs.AI</span>
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
                </div>

                {/* Compact Chart Tabs */}
                <div className="flex space-x-2 mb-4">
                  {['Line Chart', 'Candlestick'].map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setActiveChart(index)}
                      className={`relative px-4 py-2 rounded-lg text-xs font-medium transition-all duration-500 ${
                        activeChart === index
                          ? 'bg-green-500/20 text-white border border-green-500/30 shadow-lg backdrop-blur-md'
                          : 'bg-white/5 text-gray-300 hover:bg-green-500/10 hover:text-white border border-white/10 backdrop-blur-sm'
                      }`}
                      style={{
                        background: activeChart === index 
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="text-xs">{index === 0 ? '📈' : '🕯️'}</span>
                        <span className="tracking-wide">{tab}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Matrix Chart Area */}
                <div className="bg-black/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/20 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-white font-bold text-sm tracking-wide">EUR/USD</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-emerald-300 text-xs font-medium tracking-wider">LIVE</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currentPrice.toFixed(4)}
                      </div>
                      <div className={`text-xs font-medium ${priceChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Matrix Line Chart */}
                  {activeChart === 0 && (
                    <div className="relative h-32 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-green-500/10">
                      <svg className="w-full h-full" viewBox="0 0 300 120">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="30" height="24" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 24" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* Line chart */}
                        {chartData.length > 1 && (() => {
                          // Calculate proper scaling for real market data
                          const prices = chartData.map(point => point.y)
                          const minPrice = Math.min(...prices)
                          const maxPrice = Math.max(...prices)
                          const priceRange = maxPrice - minPrice || 0.01 // Avoid division by zero
                          
                          // Scale prices to fit in the chart area (10 to 110 pixels)
                          const scaleY = (price) => 110 - ((price - minPrice) / priceRange) * 100
                          const scaleX = (index) => (index / (chartData.length - 1)) * 280 + 10
                          
                          const pathData = chartData.map((point, index) => 
                            `${index === 0 ? 'M' : 'L'} ${scaleX(index)},${scaleY(point.y)}`
                          ).join(' ')
                          
                          return (
                            <path
                              d={pathData}
                              stroke="url(#lineGradient)"
                              strokeWidth="2"
                              fill="none"
                              className="animate-pulse"
                            />
                          )
                        })()}
                        
                        {/* Data points */}
                        {chartData.length > 0 && (() => {
                          const prices = chartData.map(point => point.y)
                          const minPrice = Math.min(...prices)
                          const maxPrice = Math.max(...prices)
                          const priceRange = maxPrice - minPrice || 0.01
                          
                          const scaleY = (price) => 110 - ((price - minPrice) / priceRange) * 100
                          const scaleX = (index) => (index / (chartData.length - 1)) * 280 + 10
                          
                          return chartData.map((point, index) => (
                            <circle
                              key={index}
                              cx={scaleX(index)}
                              cy={scaleY(point.y)}
                              r="2"
                              fill="#10b981"
                              className="animate-pulse"
                            />
                          ))
                        })()}
                        
                        <defs>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}

                  {/* Matrix Candlestick Chart */}
                  {activeChart === 1 && (
                    <div className="relative h-32 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-green-500/10">
                      <svg className="w-full h-full" viewBox="0 0 300 120">
                        {chartData.slice(-20).map((candle, index) => {
                          const x = index * 14 + 15
                          const isGreen = candle.close > candle.open
                          
                          // Scale values to fit the chart
                          const _scale2 = 1000
                          const minPrice = Math.min(...chartData.slice(-20).map(c => c.low))
                          const maxPrice = Math.max(...chartData.slice(-20).map(c => c.high))
                          const priceRange = maxPrice - minPrice
                          
                          const normalize = (price) => ((price - minPrice) / priceRange) * 100 + 10
                          
                          const openY = normalize(candle.open)
                          const closeY = normalize(candle.close)
                          const highY = normalize(candle.high)
                          const lowY = normalize(candle.low)
                          
                          const bodyHeight = Math.abs(closeY - openY)
                          const bodyY = Math.min(openY, closeY)
                          
                          return (
                            <g key={index}>
                              {/* Wick */}
                              <line
                                x1={x}
                                y1={120 - highY}
                                x2={x}
                                y2={120 - lowY}
                                stroke={isGreen ? '#10b981' : '#ef4444'}
                                strokeWidth="1.5"
                              />
                              {/* Body */}
                              <rect
                                x={x - 4}
                                y={120 - bodyY - bodyHeight}
                                width="8"
                                height={Math.max(bodyHeight, 1)}
                                fill={isGreen ? '#10b981' : '#ef4444'}
                                stroke={isGreen ? '#059669' : '#dc2626'}
                                strokeWidth="0.5"
                                className="animate-pulse"
                              />
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  )}

                  
                </div>

               

                {/* Compact Live Data Feed */}
                <div className="bg-black/20 rounded-lg p-3 border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-xs font-medium">Live Market Data</span>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const livePairs = [
                        { symbol: 'GBPUSDm', display: 'GBP/USD' },
                        { symbol: 'USDJPYm', display: 'USD/JPY' },
                        { symbol: 'AUDUSDm', display: 'AUD/USD' }
                      ]
                      
                      // Filter pairs that have real data
                      const pairsWithData = livePairs.filter(pair => {
                        const symbolData = tickData.get(pair.symbol)
                        if (!symbolData || !symbolData.ticks || symbolData.ticks.length === 0) return false
                        
                        // Get the latest tick
                        const latestTick = symbolData.ticks[symbolData.ticks.length - 1]
                        if (!latestTick) return false
                        
                        const price = latestTick.bid || latestTick.ask || latestTick.price || latestTick.close || 0
                        return price > 0
                      })
                      
                      // If no pairs have data, show a message
                      if (pairsWithData.length === 0) {
                        return (
                          <div className="text-center text-gray-400 text-sm py-4">
                            Waiting for market data...
                          </div>
                        )
                      }
                      
                      return pairsWithData.map((pair, index) => {
                        const symbolData = tickData.get(pair.symbol)
                        // Get the latest tick
                        const latestTick = symbolData.ticks[symbolData.ticks.length - 1]
                        
                        // We know this pair has data, so extract it
                        const price = latestTick.bid || latestTick.ask || latestTick.price || latestTick.close || 0
                        const change = latestTick.change || latestTick.point || 0
                        const isPositive = change >= 0
                        
                        return (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-400 font-medium">{pair.display}</span>
                            <div className="text-right">
                              <div className="text-white font-mono font-bold text-sm">
                                {price.toFixed(4)}
                              </div>
                              <div className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {change !== 0 ? (isPositive ? '+' : '') + change.toFixed(4) : '0.0000'}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>

              {/* Matrix Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-green-500/20 shadow-lg animate-bounce">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-7 h-7 bg-green-500/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-green-500/20 shadow-lg animate-pulse">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="absolute top-1/2 -right-6 w-6 h-6 bg-green-500/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-green-500/20 shadow-lg animate-ping">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
      
      {/* Matrix CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `
      }} />
    </section>
  )
}

export default HeroSection
