import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Zap, 
  Target, 
  ArrowRight,
  Play,
  Star,
  CheckCircle,
  Sparkles
} from 'lucide-react'

const HeroSection = () => {
  const { user } = useAuth()
  const [currentPrice, setCurrentPrice] = useState(1.2345)
  const [priceChange, setPriceChange] = useState(0.0023)
  const [chartData, setChartData] = useState([])
  const [activeChart, setActiveChart] = useState(0)

  // Generate initial chart data
  useEffect(() => {
    const generateData = () => {
      const data = []
      let basePrice = 1.2300
      for (let i = 0; i < 30; i++) {
        const change = (Math.random() - 0.5) * 0.01
        const newPrice = basePrice + change
        
        // Generate proper OHLC data
        const open = basePrice
        const close = newPrice
        const high = Math.max(open, close) + Math.random() * 0.005
        const low = Math.min(open, close) - Math.random() * 0.005
        
        data.push({
          x: i,
          y: close,
          open: open,
          high: high,
          low: low,
          close: close
        })
        basePrice = newPrice
      }
      return data
    }
    setChartData(generateData())
  }, [])

  // Update price and chart data
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.002
        const newPrice = prev + change
        setPriceChange(change)
        return newPrice
      })

      // Update chart data
      setChartData(prev => {
        const newData = [...prev]
        const lastCandle = newData[newData.length - 1]
        const change = (Math.random() - 0.5) * 0.01
        
        // Generate new candle with proper OHLC
        const open = lastCandle.close
        const close = open + change
        const high = Math.max(open, close) + Math.random() * 0.005
        const low = Math.min(open, close) - Math.random() * 0.005
        
        newData.shift() // Remove first point
        newData.push({
          x: newData.length,
          y: close,
          open: open,
          high: high,
          low: low,
          close: close
        })
        return newData
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Trading Symbols */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-blue-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-50"></div>
        <div className="absolute top-60 right-40 w-5 h-5 bg-purple-400 rounded-full animate-pulse opacity-30"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Text Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-green-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Trading Intelligence</span>
            </div>

            {/* Main Headline with Gradient */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent animate-pulse">
                  Decode
                </span>
                <br />
                <span className="text-white">
                  the Market
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-green-400 bg-clip-text text-transparent">
                  with AI
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl">
                Transform your forex trading with <span className="text-green-400 font-semibold">real-time RSI analysis</span>, 
                <span className="text-blue-400 font-semibold"> AI-powered insights</span>, and 
                <span className="text-purple-400 font-semibold"> professional-grade tools</span>
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Real-time RSI Correlation</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>AI News Analysis</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Currency Strength Meter</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Professional Dashboard</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                >
                  <BarChart3 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                >
                  <Shield className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Start Trading Now</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              )}
              
              <button className="group inline-flex items-center justify-center px-8 py-4 border-2 border-gray-600 hover:border-green-400 text-gray-300 hover:text-white font-semibold text-lg rounded-xl transition-all duration-300 backdrop-blur-sm">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="text-gray-400 text-sm ml-2">4.9/5 Rating</span>
              </div>
              <div className="text-gray-400 text-sm">
                <span className="text-green-400 font-semibold">10,000+</span> Active Traders
              </div>
            </div>
          </div>

          {/* Right Side - Visual Element */}
          <div className="relative">
            {/* Main Trading Visual Container */}
            <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-600/50 shadow-2xl">
              
              {/* Animated Trading Dashboard Mockup */}
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-gray-400 text-sm font-mono">FXLabs.AI Dashboard</div>
                </div>

                {/* Chart Tabs */}
                <div className="flex space-x-2 mb-4">
                  {['Line Chart', 'Candlestick', 'Volume'].map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setActiveChart(index)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                        activeChart === index
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Trading Chart Area */}
                <div className="bg-gray-800/90 rounded-2xl p-6 border border-gray-600/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-white font-semibold">EUR/USD</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className={`font-mono text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentPrice.toFixed(4)} {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}
                    </div>
                  </div>
                  
                  {/* Working Line Chart */}
                  {activeChart === 0 && (
                    <div className="relative h-40 bg-gray-700/70 rounded-lg p-4">
                      <svg className="w-full h-full" viewBox="0 0 300 120">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="30" height="24" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 24" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* Line chart */}
                        {chartData.length > 1 && (
                          <path
                            d={`M ${chartData[0].x * 10},${120 - ((chartData[0].y - 1.2) * 1000)} ${chartData.slice(1).map(point => 
                              `L ${point.x * 10},${120 - ((point.y - 1.2) * 1000)}`
                            ).join(' ')}`}
                            stroke="url(#lineGradient)"
                            strokeWidth="2"
                            fill="none"
                            className="animate-pulse"
                          />
                        )}
                        
                        {/* Data points */}
                        {chartData.map((point, index) => (
                          <circle
                            key={index}
                            cx={point.x * 10}
                            cy={120 - ((point.y - 1.2) * 1000)}
                            r="2"
                            fill="#10b981"
                            className="animate-pulse"
                          />
                        ))}
                        
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

                  {/* Working Candlestick Chart */}
                  {activeChart === 1 && (
                    <div className="relative h-40 bg-gray-700/70 rounded-lg p-4">
                      <svg className="w-full h-full" viewBox="0 0 300 120">
                        {chartData.slice(-20).map((candle, index) => {
                          const x = index * 14 + 15
                          const isGreen = candle.close > candle.open
                          
                          // Scale values to fit the chart
                          const scale = 1000
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

                  {/* Volume Chart */}
                  {activeChart === 2 && (
                    <div className="relative h-40 bg-gray-700/70 rounded-lg p-4">
                      <svg className="w-full h-full" viewBox="0 0 300 120">
                        {chartData.slice(-20).map((point, index) => {
                          const x = index * 15 + 10
                          const volume = Math.random() * 100
                          const height = volume * 0.8
                          
                          return (
                            <rect
                              key={index}
                              x={x - 3}
                              y={120 - height}
                              width="6"
                              height={height}
                              fill="#06b6d4"
                              opacity="0.7"
                              className="animate-pulse"
                            />
                          )
                        })}
                      </svg>
                    </div>
                  )}
                </div>

                {/* Dynamic Indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-600/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">RSI</span>
                    </div>
                    <div className="text-green-400 font-mono text-lg">
                      {(30 + Math.random() * 40).toFixed(1)}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${30 + Math.random() * 40}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-600/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">Volume</span>
                    </div>
                    <div className="text-purple-400 font-mono text-lg">
                      {(Math.random() * 1000).toFixed(0)}K
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.random() * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Live Data Feed */}
                <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-600/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">Live Market Data</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { pair: 'GBP/USD', price: 1.2650 + (Math.random() - 0.5) * 0.01, change: (Math.random() - 0.5) * 0.005 },
                      { pair: 'USD/JPY', price: 149.50 + (Math.random() - 0.5) * 0.5, change: (Math.random() - 0.5) * 0.1 },
                      { pair: 'AUD/USD', price: 0.6580 + (Math.random() - 0.5) * 0.005, change: (Math.random() - 0.5) * 0.002 }
                    ].map((item, index) => {
                      const isPositive = item.change >= 0
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-400">{item.pair}</span>
                          <div className="text-right">
                            <div className="text-white font-mono">{item.price.toFixed(4)}</div>
                            <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{item.change.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <BarChart3 className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
    </section>
  )
}

export default HeroSection
