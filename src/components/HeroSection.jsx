import { Settings, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import PremiumHeroBackground from './PremiumHeroBackground'
import aiIcon from '../assets/artificial-intelligence.png'
import slideshowImage1 from '../assets/slideshow_image_1.png'
import slideshowImage2 from '../assets/slideshow_image_2.png'
import slideshowImage3 from '../assets/slideshow_image_3.png'
import useMarketCacheStore from '../store/useMarketCacheStore'
import useMarketStore from '../store/useMarketStore'
import { formatSymbolDisplay } from '../utils/formatters'

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(1)
  const { connect, isConnected } = useMarketStore()
  const { ticksBySymbol, pricingBySymbol, quantumBySymbol } = useMarketCacheStore()
  const [eurChangePct, setEurChangePct] = useState(null)
  const [xauChangePct, setXauChangePct] = useState(null)
  const [usOilChangePct, setUsOilChangePct] = useState(null)
  const [_isFreeTrialOpen, _setIsFreeTrialOpen] = useState(false)
  
  const [_marketTrend] = useState('Bearish')

  // Quantum analysis data for EUR/USD, XAU/USD, and OIL/USD
  const [eurQuantum, setEurQuantum] = useState(null)
  const [xauQuantum, setXauQuantum] = useState(null)
  const [usOilQuantum, setUsOilQuantum] = useState(null)

  // Ensure live connection for hero pricing
  useEffect(() => {
    if (!isConnected) {
      try { 
        connect() 
      } catch (error) {
        // Silent error handling
      }
    } else {
      // Subscribe to symbols when connected using market cache store
      try {
        const cacheStore = useMarketCacheStore.getState()
        // Use the ensureSubscriptionsForTrending method to subscribe
        cacheStore.ensureSubscriptionsForTrending(['EURUSDm', 'XAUUSDm', 'USOILm'])
        
        // Hydrate quantum data for all symbols
        cacheStore.hydrateQuantumForSymbol('EURUSDm')
        cacheStore.hydrateQuantumForSymbol('XAUUSDm')
        cacheStore.hydrateQuantumForSymbol('USOILm')
      } catch (error) {
        // Silent error handling
      }
    }
  }, [isConnected, connect])

  // Note: Only using live tick data, no fallback pricing

  // Track daily change % from latest ticks when available
  useEffect(() => {
    // Get pricing data from pricingBySymbol
    const eurPricing = pricingBySymbol?.get('EURUSDm')
    const xauPricing = pricingBySymbol?.get('XAUUSDm')
    const usOilPricing = pricingBySymbol?.get('USOILm')
    
    // Use pricing data for daily change percentage
    if (eurPricing && typeof eurPricing.daily_change_pct === 'number') {
      setEurChangePct(eurPricing.daily_change_pct)
    }
    
    if (xauPricing && typeof xauPricing.daily_change_pct === 'number') {
      setXauChangePct(xauPricing.daily_change_pct)
    }

    if (usOilPricing && typeof usOilPricing.daily_change_pct === 'number') {
      setUsOilChangePct(usOilPricing.daily_change_pct)
    }
  }, [ticksBySymbol, pricingBySymbol])

  // Track quantum analysis data for EUR/USD, XAU/USD, and OIL/USD
  useEffect(() => {
    const eurQuantumData = quantumBySymbol?.get('EURUSDm')
    const xauQuantumData = quantumBySymbol?.get('XAUUSDm')
    const usOilQuantumData = quantumBySymbol?.get('USOILm')
    
    if (eurQuantumData) {
      setEurQuantum(eurQuantumData)
    }
    
    if (xauQuantumData) {
      setXauQuantum(xauQuantumData)
    }

    if (usOilQuantumData) {
      setUsOilQuantum(usOilQuantumData)
    }
  }, [quantumBySymbol])

  // Helper function to calculate success probability and trend from quantum data
  const getQuantumAnalysis = (quantumData) => {
    if (!quantumData || !quantumData.overall) {
      return { successProbability: 35, trendText: 'Weak Downtrend', trendColor: 'text-red-500 dark:text-red-400' }
    }
    
    // Use swingTrader style for landing page display
    const styleData = quantumData.overall.swingtrader || quantumData.overall.scalper
    if (!styleData) {
      return { successProbability: 35, trendText: 'Weak Downtrend', trendColor: 'text-red-500 dark:text-red-400' }
    }
    
    const buyPct = typeof styleData.buy_percent === 'number' ? styleData.buy_percent : 50
    const sellPct = typeof styleData.sell_percent === 'number' ? styleData.sell_percent : 50
    
    // Success probability = whichever is above 50%
    const successProbability = Math.max(buyPct, sellPct)
    
    // Determine trend text and color
    let trendText = 'Neutral'
    let trendColor = 'text-gray-500 dark:text-gray-400'
    
    if (buyPct >= 70) {
      trendText = 'Strong Uptrend'
      trendColor = 'text-green-600 dark:text-green-400'
    } else if (sellPct >= 70) {
      trendText = 'Strong Downtrend'
      trendColor = 'text-red-600 dark:text-red-400'
    } else if (buyPct > sellPct && buyPct > 50) {
      trendText = 'Weak Uptrend'
      trendColor = 'text-green-500 dark:text-green-400'
    } else if (sellPct > buyPct && sellPct > 50) {
      trendText = 'Weak Downtrend'
      trendColor = 'text-red-500 dark:text-red-400'
    } else if (Math.abs(buyPct - sellPct) <= 5) {
      // If within 5% of each other, consider it neutral
      trendText = 'Neutral'
      trendColor = 'text-gray-500 dark:text-gray-400'
    }
    
    return { successProbability, trendText, trendColor }
  }

  const LivePrice = ({ symbol, precision = 5 }) => {
    // Get pricing data from market cache store
    const pricing = pricingBySymbol?.get(symbol)
    const price = pricing?.bid || null
    
    if (!(typeof price === 'number' && isFinite(price))) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading...</span>
        </div>
      )
    }
    const formatted = Number(price).toLocaleString('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision })
    return (
      <div className="flex items-center space-x-2">
        <span className="font-bold text-[#19235d] dark:text-white">${formatted}</span>
        <div className="w-2 h-2 bg-green-400 rounded-full" title="Live Data"></div>
      </div>
    )
  }

  const ChangeBadge = ({ value }) => {
    if (typeof value !== 'number' || !isFinite(value)) return null
    const isUp = value >= 0
    return (
      <div className={`text-sm flex items-center font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {isUp ? (
          <TrendingUp className="w-4 h-4 mr-1.5" />
        ) : (
          <TrendingDown className="w-4 h-4 mr-1.5" />
        )}
        <span className="font-semibold">{`${isUp ? '+' : ''}${value.toFixed(2)}%`}</span>
      </div>
    )
  }

  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => prev === 3 ? 1 : prev + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // remove legacy loading simulation (live data used)

  const showSlide = (n) => {
    setCurrentSlide(n)
  }

  const nextSlide = () => {
    setCurrentSlide(prev => prev === 3 ? 1 : prev + 1)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => prev === 1 ? 3 : prev - 1)
  }

  return (
    <section className="relative overflow-hidden pt-16 pb-16 px-4 sm:pt-20 sm:pb-20 md:px-6 w-full transition-colors duration-300">
      <PremiumHeroBackground />
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-0 lg:gap-12">
          <div className="w-full lg:w-1/2 text-center lg:text-left mb-8 lg:mb-0">
            {/* Premium Badges with Glassy Effect */}
            <div className="mb-6 flex flex-col items-center lg:items-start space-y-3">
              <div className="bg-white/60 dark:bg-[#19235d]/60 backdrop-blur-xl border border-white/30 dark:border-[#19235d]/30 rounded-full px-5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                  <i className="fas fa-check-circle mr-2 text-emerald-500"></i> 
                    AI Powered All-in-One Analysis Platform
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-[#19235d] dark:text-white transition-colors duration-300">
                Trade With The Power Of{' '}
              </span>
              <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 bg-clip-text text-transparent animate-gradient">
                AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Experience seamless, all-in-one Forex Trading Analysis intelligence—every tool and insight you need, unified in a single world-class platform.
            </p>

            {/* Premium Feature Highlights */}
            <div className="hidden md:block mb-10 sm:mb-12 relative p-[1.5px] rounded-3xl bg-gradient-to-br from-white/60 via-white/30 to-white/10 dark:from-white/20 dark:via-white/10 dark:to-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <div className="rounded-3xl bg-white/30 dark:bg-[#19235d]/30 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group flex items-center space-x-3 rounded-xl bg-white/10 dark:bg-white/[0.04] border border-white/20 dark:border-white/10 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-md flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                        <path d="M3 9h18"></path>
                        <circle cx="7" cy="7" r="1"></circle>
                        <circle cx="11" cy="7" r="1"></circle>
                        <circle cx="15" cy="7" r="1"></circle>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#19235d] dark:text-white text-sm">No Software Needed</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Analyse from any browser</p>
                    </div>
                  </div>
                  <div className="group flex items-center space-x-3 rounded-xl bg-white/10 dark:bg-white/[0.04] border border-white/20 dark:border-white/10 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-md flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"></path>
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#19235d] dark:text-white text-sm">Live Alerts</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Email notifications</p>
                    </div>
                  </div>
                  <div className="group flex items-center space-x-3 rounded-xl bg-white/10 dark:bg-white/[0.04] border border-white/20 dark:border-white/10 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="4" y="3" width="16" height="18" rx="2"></rect>
                        <path d="M8 7h8"></path>
                        <path d="M8 11h8M8 15h8"></path>
                        <path d="M12 11v8"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#19235d] dark:text-white text-sm">Pro Calculators</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Risk management tools</p>
                    </div>
                  </div>
                  <div className="group flex items-center space-x-3 rounded-xl bg-white/10 dark:bg-white/[0.04] border border-white/20 dark:border-white/10 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="8"></circle>
                        <path d="M12 8v4l3 2"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#19235d] dark:text-white text-sm">24/7 Access</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Analyse anytime, anywhere</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className=" lg:w-1/2 flex flex-col justify-center items-center relative">
            {/* Master Trader AI Dashboard Container */}
            <div className="relative w-full max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[650px] xl:max-w-[700px] mx-auto min-h-[300px] sm:min-h-[420px] md:min-h-[450px] lg:min-h-[480px] xl:min-h-[500px] bg-white dark:bg-[#19235d] backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 border border-[#03c05d]/20 shadow-2xl cursor-pointer transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1 group-hover:shadow-3xl overflow-hidden"
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
                  <span className="text-[#19235d] dark:text-white text-sm sm:text-base font-bold font-poppins">FxLabs Prime - decode the Market with AI</span>
                </div>
                <div className="flex items-center space-x-2 bg-[#03c05d]/20 backdrop-blur-md rounded-lg px-3 py-2 border border-[#03c05d]/30">
                  <div className="w-2 h-2 bg-[#03c05d] rounded-full animate-pulse"></div>
                  <span className="text-[#03c05d] text-xs sm:text-sm font-semibold">Live Analysis</span>
                </div>
              </div>

              {/* Live Symbol Analysis Cards */}
              <div className="space-y-2 sm:space-y-2">
                {/* EURUSD Analysis Card */}
                <div className="bg-white dark:bg-[#19235d] rounded-2xl p-3 sm:p-4 border border-[#03c05d]/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#03c05d]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#19235d] dark:text-white font-bold text-sm">EUR</span>
                      </div>
                      <div>
                        <div className="text-[#19235d] dark:text-white font-semibold text-sm sm:text-base">Euro vs US Dollar</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{formatSymbolDisplay('EURUSDm')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#19235d] dark:text-white font-bold text-base sm:text-lg">
                        <LivePrice symbol="EURUSDm" precision={5} />
                      </div>
                      <ChangeBadge value={eurChangePct} />
                    </div>
                  </div>
                  
                  
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    {(() => {
                      const { successProbability, trendText, trendColor } = getQuantumAnalysis(eurQuantum)
                      return (
                        <>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-0.5">Success Probability</div>
                            <div className="w-full bg-gray-200 dark:bg-[#19235d] rounded-full h-1.5">
                              <div className="bg-[#03c05d] h-1.5 rounded-full transition-all duration-500" style={{width: `${successProbability}%`}}></div>
                            </div>
                            <div className="text-[#03c05d] text-xs sm:text-sm mt-0.5">{Math.round(successProbability)}%</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-3.5 h-3.5 bg-[#03c05d] rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                              <span className={`${trendColor} text-xs sm:text-sm font-medium`}>{trendText}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Just now</span>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* XAUUSD Analysis Card */}
                <div className="bg-gray-50 dark:bg-[#19235d] rounded-2xl p-3 sm:p-4 border border-[#03c05d]/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#03c05d]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#19235d] dark:text-white font-bold text-sm">XAU</span>
                      </div>
                      <div>
                        <div className="text-[#19235d] dark:text-white font-semibold text-sm sm:text-base">Gold vs US Dollar</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{formatSymbolDisplay('XAUUSDm')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#19235d] dark:text-white font-bold text-base sm:text-lg">
                        <LivePrice symbol="XAUUSDm" precision={2} />
                      </div>
                      <ChangeBadge value={xauChangePct} />
                    </div>
                  </div>
                  
                  
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    {(() => {
                      const { successProbability, trendText, trendColor } = getQuantumAnalysis(xauQuantum)
                      return (
                        <>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-0.5">Success Probability</div>
                            <div className="w-full bg-gray-200 dark:bg-[#19235d] rounded-full h-1.5">
                              <div className="bg-[#03c05d] h-1.5 rounded-full transition-all duration-500" style={{width: `${successProbability}%`}}></div>
                            </div>
                            <div className="text-[#03c05d] text-xs sm:text-sm mt-0.5">{Math.round(successProbability)}%</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-3.5 h-3.5 bg-[#03c05d] rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                              <span className={`${trendColor} text-xs sm:text-sm font-medium`}>{trendText}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Just now</span>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* USOIL Analysis Card */}
                <div className="bg-gray-50 dark:bg-[#19235d] rounded-2xl p-3 sm:p-4 border border-[#03c05d]/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#03c05d]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#19235d] dark:text-white font-bold text-sm">OIL</span>
                      </div>
                      <div>
                        <div className="text-[#19235d] dark:text-white font-semibold text-sm sm:text-base">Crude Oil vs US Dollar</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{formatSymbolDisplay('USOILm')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#19235d] dark:text-white font-bold text-base sm:text-lg">
                        <LivePrice symbol="USOILm" precision={2} />
                      </div>
                      <ChangeBadge value={usOilChangePct} />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    {(() => {
                      const { successProbability, trendText, trendColor } = getQuantumAnalysis(usOilQuantum)
                      return (
                        <>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-0.5">Success Probability</div>
                            <div className="w-full bg-gray-200 dark:bg-[#19235d] rounded-full h-1.5">
                              <div className="bg-[#03c05d] h-1.5 rounded-full transition-all duration-500" style={{ width: `${successProbability}%` }}></div>
                            </div>
                            <div className="text-[#03c05d] text-xs sm:text-sm mt-0.5">{Math.round(successProbability)}%</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-3.5 h-3.5 bg-[#03c05d] rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                              <span className={`${trendColor} text-xs sm:text-sm font-medium`}>{trendText}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Just now</span>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
              
              
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8 w-full px-4">
              <a 
                href="#subscription" 
                className="relative bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 hover:from-emerald-500 hover:via-emerald-500 hover:to-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-[0_12px_40px_rgba(16,185,129,0.45)] hover:shadow-[0_16px_50px_rgba(16,185,129,0.55)] ring-1 ring-white/20 transition-all duration-300 transform hover:-translate-y-0.5 w-full sm:w-auto text-center flex items-center justify-center gap-2"
              >
                <span>Get Started Now</span>
                <i className="fas fa-arrow-right"></i>
              </a>
              <a 
                href="#Analysis-tools" 
                className="relative bg-white/10 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/10 text-[#19235d] dark:text-white px-8 py-4 rounded-full text-lg font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.16)] hover:bg-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 w-full sm:w-auto text-center flex items-center justify-center gap-2"
              >
                <i className="fas fa-play-circle"></i>
                <span>Explore Tools</span>
              </a>
            </div>
          </div>
              </div>

        {/* Premium Verified Results Section */}
        <div id="demo-video" className="mt-12 md:mt-16 mx-auto px-4 md:px-8 max-w-6xl">
          {/* Premium Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-6 py-3 bg-white/80 dark:bg-[#19235d]/80 backdrop-blur-sm border border-gray-200/50 dark:border-[#19235d]/50 rounded-full shadow-sm mb-4">
              <img src={aiIcon} alt="AI Analysis" className="w-6 h-6 mr-3" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm tracking-wide" style={{fontFamily: 'Pier Sans, sans-serif'}}>Unlock the Power of AI Analysis</span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-semibold text-[#19235d] dark:text-white mb-3" style={{fontFamily: 'Pier Sans, sans-serif'}}>
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"></span>
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          
            </p>
          </div>

          {/* Frameless Premium Carousel */}
          <div className="relative group">
            {/* Main Carousel Container */}
            <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-gray-50 to-white dark:from-[#19235d] dark:to-[#19235d] border border-gray-200/50 dark:border-gray-700/50">
              
              {/* Slides */}
              <div className="relative aspect-[1419/727] w-full">
                <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentSlide === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <img 
                    src={slideshowImage1} 
                    alt="Analysis Results 1"
                    className="w-full h-full object-contain object-center"
                  />
                </div>
                
                <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentSlide === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <img 
                    src={slideshowImage2} 
                    alt="Analysis Results 2"
                    className="w-full h-full object-contain object-center"
                  />
                </div>
                
                <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentSlide === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <img 
                    src={slideshowImage3} 
                    alt="Analysis Results 3"
                    className="w-full h-full object-contain object-center"
                  />
                </div>
              </div>

              {/* Premium Navigation Arrows - Hidden */}
              <button 
                type="button" 
                onClick={prevSlide} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-[#19235d]/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 opacity-0 z-20 border border-gray-200/50 dark:border-gray-700/50"
              >
                <i className="fas fa-chevron-left text-lg"></i>
              </button>
              
              <button 
                type="button" 
                onClick={nextSlide} 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-[#19235d]/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 opacity-0 z-20 border border-gray-200/50 dark:border-gray-700/50"
              >
                <i className="fas fa-chevron-right text-lg"></i>
              </button>

              {/* Premium Dots Indicator */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-white/90 dark:bg-[#19235d]/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <button 
                  type="button" 
                  onClick={() => showSlide(1)} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'bg-emerald-600 scale-125' : 'bg-gray-400 hover:bg-gray-500'}`}
                ></button>
                <button 
                  type="button" 
                  onClick={() => showSlide(2)} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 2 ? 'bg-emerald-600 scale-125' : 'bg-gray-400 hover:bg-gray-500'}`}
                ></button>
                <button 
                  type="button" 
                  onClick={() => showSlide(3)} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 3 ? 'bg-emerald-600 scale-125' : 'bg-gray-400 hover:bg-gray-500'}`}
                ></button>
              </div>

              {/* Premium Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Premium Stats Overlay */}
            <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#19235d]/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2.5 sm:py-4 shadow-xl w-auto max-w-[92%] sm:max-w-md">
              <div className="flex flex-row items-center justify-center gap-3 sm:gap-6 text-center whitespace-nowrap">
                <div className="flex flex-col items-center">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400" style={{fontFamily: 'Pier Sans, sans-serif'}}>80% +</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">Accuracy</p>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex flex-col items-center">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400" style={{fontFamily: 'Pier Sans, sans-serif'}}>14+</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">Analysis Tools</p>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex flex-col items-center">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400" style={{fontFamily: 'Pier Sans, sans-serif'}}>99.9%+</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">Up Time</p>
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
