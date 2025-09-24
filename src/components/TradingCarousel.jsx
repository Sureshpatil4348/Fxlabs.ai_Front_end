import { 
  TrendingUp, 
  BarChart3, 
  Activity,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Maximize2,
  Eye
} from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'

const TradingCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef(null)

  // Trading chart data for the carousel
  const tradingCharts = [
    {
      id: 1,
      title: "EUR/USD Analysis",
      subtitle: "Closed-candle RSI Correlation",
      type: "line",
      data: [
        { x: 0, y: 1.0850 },
        { x: 1, y: 1.0865 },
        { x: 2, y: 1.0872 },
        { x: 3, y: 1.0880 },
        { x: 4, y: 1.0868 },
        { x: 5, y: 1.0875 },
        { x: 6, y: 1.0885 },
        { x: 7, y: 1.0890 },
        { x: 8, y: 1.0882 },
        { x: 9, y: 1.0878 }
      ],
      rsi: 67.8,
      trend: "bullish",
      color: "from-green-400 to-emerald-500"
    },
    {
      id: 2,
      title: "GBP/USD Momentum",
      subtitle: "Currency Strength Meter",
      type: "candlestick",
      data: [
        { x: 0, y: 1.2650, high: 1.2670, low: 1.2630 },
        { x: 1, y: 1.2665, high: 1.2685, low: 1.2645 },
        { x: 2, y: 1.2672, high: 1.2692, low: 1.2652 },
        { x: 3, y: 1.2680, high: 1.2700, low: 1.2660 },
        { x: 4, y: 1.2668, high: 1.2688, low: 1.2648 },
        { x: 5, y: 1.2675, high: 1.2695, low: 1.2655 },
        { x: 6, y: 1.2685, high: 1.2705, low: 1.2665 },
        { x: 7, y: 1.2690, high: 1.2710, low: 1.2670 },
        { x: 8, y: 1.2682, high: 1.2702, low: 1.2662 },
        { x: 9, y: 1.2678, high: 1.2698, low: 1.2658 }
      ],
      rsi: 72.3,
      trend: "bullish",
      color: "from-blue-400 to-cyan-500"
    },
    {
      id: 3,
      title: "USD/JPY Volatility",
      subtitle: "AI News Impact Analysis",
      type: "area",
      data: [
        { x: 0, y: 149.20 },
        { x: 1, y: 149.35 },
        { x: 2, y: 149.42 },
        { x: 3, y: 149.50 },
        { x: 4, y: 149.38 },
        { x: 5, y: 149.45 },
        { x: 6, y: 149.55 },
        { x: 7, y: 149.60 },
        { x: 8, y: 149.52 },
        { x: 9, y: 149.48 }
      ],
      rsi: 45.2,
      trend: "bearish",
      color: "from-purple-400 to-pink-500"
    },
    {
      id: 4,
      title: "AUD/USD Breakout",
      subtitle: "Market Sentiment Analysis",
      type: "line",
      data: [
        { x: 0, y: 0.6580 },
        { x: 1, y: 0.6595 },
        { x: 2, y: 0.6602 },
        { x: 3, y: 0.6610 },
        { x: 4, y: 0.6598 },
        { x: 5, y: 0.6605 },
        { x: 6, y: 0.6615 },
        { x: 7, y: 0.6620 },
        { x: 8, y: 0.6612 },
        { x: 9, y: 0.6608 }
      ],
      rsi: 58.7,
      trend: "neutral",
      color: "from-orange-400 to-red-500"
    },
    {
      id: 5,
      title: "USD/CAD Correlation",
      subtitle: "Cross-Currency Analysis",
      type: "candlestick",
      data: [
        { x: 0, y: 1.3520, high: 1.3540, low: 1.3500 },
        { x: 1, y: 1.3535, high: 1.3555, low: 1.3515 },
        { x: 2, y: 1.3542, high: 1.3562, low: 1.3522 },
        { x: 3, y: 1.3550, high: 1.3570, low: 1.3530 },
        { x: 4, y: 1.3538, high: 1.3558, low: 1.3518 },
        { x: 5, y: 1.3545, high: 1.3565, low: 1.3525 },
        { x: 6, y: 1.3555, high: 1.3575, low: 1.3535 },
        { x: 7, y: 1.3560, high: 1.3580, low: 1.3540 },
        { x: 8, y: 1.3552, high: 1.3572, low: 1.3532 },
        { x: 9, y: 1.3548, high: 1.3568, low: 1.3528 }
      ],
      rsi: 63.1,
      trend: "bullish",
      color: "from-teal-400 to-green-500"
    }
  ]

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoPlaying && !isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === tradingCharts.length - 1 ? 0 : prevIndex + 1
        )
      }, 4000) // Change slide every 4 seconds
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isAutoPlaying, isHovered, tradingCharts.length])

  const nextSlide = () => {
    setCurrentIndex(currentIndex === tradingCharts.length - 1 ? 0 : currentIndex + 1)
  }

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? tradingCharts.length - 1 : currentIndex - 1)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  const renderChart = (chart) => {
    const maxY = Math.max(...chart.data.map(d => d.y))
    const minY = Math.min(...chart.data.map(d => d.y))
    const range = maxY - minY
    const padding = range * 0.1

    return (
      <div className="relative w-full h-64 bg-gray-800/80 rounded-xl p-4">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <linearGradient id={`gradient-${chart.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={chart.trend === 'bullish' ? '#10b981' : chart.trend === 'bearish' ? '#ef4444' : '#6b7280'} />
              <stop offset="100%" stopColor={chart.trend === 'bullish' ? '#059669' : chart.trend === 'bearish' ? '#dc2626' : '#4b5563'} />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1="0"
              y1={40 + ratio * 120}
              x2="400"
              y2={40 + ratio * 120}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Chart path */}
          <path
            d={chart.data.map((point, index) => {
              const x = 40 + (index * 360) / (chart.data.length - 1)
              const y = 40 + 120 - ((point.y - minY + padding) / (range + 2 * padding)) * 120
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
            }).join(' ')}
            stroke={`url(#gradient-${chart.id})`}
            strokeWidth="3"
            fill="none"
            className="animate-pulse"
          />
          
          {/* Data points */}
          {chart.data.map((point, index) => {
            const x = 40 + (index * 360) / (chart.data.length - 1)
            const y = 40 + 120 - ((point.y - minY + padding) / (range + 2 * padding)) * 120
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={chart.trend === 'bullish' ? '#10b981' : chart.trend === 'bearish' ? '#ef4444' : '#6b7280'}
                className="animate-ping"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            )
          })}
        </svg>
        
        {/* Chart overlay info */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div>
            <div className="text-white font-semibold text-sm">{chart.title}</div>
            <div className="text-gray-400 text-xs">{chart.subtitle}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-mono ${chart.trend === 'bullish' ? 'text-green-400' : chart.trend === 'bearish' ? 'text-red-400' : 'text-gray-400'}`}>
              RSI: {chart.rsi}
            </div>
            <div className="text-xs text-gray-500">
              {chart.trend === 'bullish' ? '↗ Bullish' : chart.trend === 'bearish' ? '↘ Bearish' : '→ Neutral'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Chart Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <BarChart3 className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center animate-ping">
          <TrendingUp className="w-3 h-3 text-blue-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-purple-400/30 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-6">
            <Activity className="w-4 h-4" />
            <span>LIVE TRADING CHARTS</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Real-Time
            </span>
            <br />
            <span className="text-gray-300">Market Analysis</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Explore our <span className="text-green-400 font-semibold">live trading charts</span> and 
            <span className="text-blue-400 font-semibold"> AI-powered insights</span> that drive successful trades
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Carousel */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30">
            
            {/* Slides Container */}
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {tradingCharts.map((chart) => (
                <div key={chart.id} className="w-full flex-shrink-0 p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Chart Display */}
                    <div className="space-y-4">
                      {renderChart(chart)}
                      
                      {/* Chart Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-green-400 font-mono text-sm">+2.34%</div>
                          <div className="text-gray-400 text-xs">24h Change</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-blue-400 font-mono text-sm">{chart.rsi}</div>
                          <div className="text-gray-400 text-xs">RSI Level</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-purple-400 font-mono text-sm">High</div>
                          <div className="text-gray-400 text-xs">Volatility</div>
                        </div>
                      </div>
                    </div>

                    {/* Chart Info */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{chart.title}</h3>
                        <p className="text-gray-400 mb-4">{chart.subtitle}</p>
                        <div className="flex items-center space-x-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            chart.trend === 'bullish' ? 'bg-green-500/20 text-green-400' :
                            chart.trend === 'bearish' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {chart.trend === 'bullish' ? '↗ Bullish Trend' :
                             chart.trend === 'bearish' ? '↘ Bearish Trend' :
                             '→ Neutral Trend'}
                          </div>
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Live</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Current Price</span>
                          <span className="text-white font-mono text-lg">
                            {chart.data[chart.data.length - 1].y.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">RSI Indicator</span>
                          <span className="text-green-400 font-mono">{chart.rsi}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Market Sentiment</span>
                          <span className="text-blue-400 capitalize">{chart.trend}</span>
                        </div>
                      </div>

                      <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2">
                        <Maximize2 className="w-4 h-4" />
                        <span>View Full Analysis</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Auto-play Toggle */}
            <button
              onClick={toggleAutoPlay}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300"
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-3 mt-8">
            {tradingCharts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(Number(index))}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-green-400 scale-125' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-700/50 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / tradingCharts.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TradingCarousel
