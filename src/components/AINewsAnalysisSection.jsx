import { Sparkles, TrendingUp, Globe, Zap, Star, ArrowRight } from 'lucide-react'
import React, { useState, useEffect } from 'react'

const AINewsAnalysisSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentNews, setCurrentNews] = useState(0)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const newsData = [
    {
      title: "EUR/USD Bullish Trend",
      sentiment: "Bullish",
      impact: "High",
      source: "Reuters",
      time: "2 min ago",
      confidence: "87%"
    },
    {
      title: "GBP/USD Market Analysis",
      sentiment: "Neutral",
      impact: "Medium",
      source: "Bloomberg",
      time: "5 min ago",
      confidence: "92%"
    },
    {
      title: "USD/JPY Technical Outlook",
      sentiment: "Bearish",
      impact: "High",
      source: "MarketWatch",
      time: "8 min ago",
      confidence: "78%"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNews((prev) => (prev + 1) % newsData.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [newsData.length])

  return (
    <section className="relative py-12 overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-300">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-emerald-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-teal-400 rounded-full animate-ping opacity-50"></div>
        <div className="absolute top-60 right-40 w-5 h-5 bg-lime-400 rounded-full animate-pulse opacity-30"></div>
        
        {/* Matrix Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-500/20 dark:border-green-500/30 rounded-full px-6 py-3 mb-6">
            <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-600 dark:text-green-400 font-semibold text-sm">AI-Powered News Analysis</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 dark:from-green-400 dark:via-emerald-300 dark:to-teal-400 bg-clip-text text-transparent animate-pulse">
              Real-time Market Intelligence
            </span>
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Get instant AI-powered analysis of market news with sentiment scoring and impact assessment
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Large Frameless News Image */}
          <div className="relative flex justify-center items-center">
            {/* Extra Large News Image - Frameless */}
            <div className="relative group">
              <div className={`transition-all duration-700 transform ${
                isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}>
                {/* Massive Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full blur-3xl animate-pulse scale-150"></div>
                
                {/* Direct Image - No Container, No Borders */}
                <img 
                  src={require('../assets/news.png')} 
                  alt="AI News Analysis" 
                  className="w-96 h-96 object-contain filter brightness-125 contrast-125 drop-shadow-2xl hover:drop-shadow-green-500/50 transition-all duration-500 hover:scale-105"
                />
                
                {/* Floating Icons - Larger */}
                <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-bounce shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-8 -left-8 w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center animate-ping shadow-2xl">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="absolute top-1/2 -right-12 w-12 h-12 bg-gradient-to-r from-lime-500 to-yellow-500 rounded-full flex items-center justify-center animate-pulse shadow-2xl">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="absolute top-1/4 -left-10 w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center animate-bounce shadow-xl">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Frameless Premium News Feed */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl transition-colors duration-300"
                 style={{
                   boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.15)'
                 }}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Live News Analysis</h3>
              </div>
              
              {/* News Item - Frameless Premium */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-2xl p-8 backdrop-blur-sm"
                     style={{
                       background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)'
                     }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-800 dark:text-white font-semibold text-lg">{newsData[currentNews].title}</h4>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-500 dark:text-yellow-400 fill-current' : 'text-gray-400 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-xl p-4 backdrop-blur-sm">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Sentiment</span>
                      <div className={`font-bold text-xl ${
                        newsData[currentNews].sentiment === 'Bullish' ? 'text-green-600 dark:text-green-400' :
                        newsData[currentNews].sentiment === 'Bearish' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {newsData[currentNews].sentiment}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-xl p-4 backdrop-blur-sm">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Impact</span>
                      <div className="text-gray-800 dark:text-white font-bold text-xl">{newsData[currentNews].impact}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Source: {newsData[currentNews].source}</span>
                    <span className="text-blue-600 dark:text-blue-400">{newsData[currentNews].time}</span>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-semibold text-base">
                        AI Confidence: {newsData[currentNews].confidence}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA */}
            <div className="text-center">
              <button className="group inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:scale-105">
                <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>View All News Analysis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
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

export default AINewsAnalysisSection
