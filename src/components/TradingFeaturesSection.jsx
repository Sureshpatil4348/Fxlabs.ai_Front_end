import { 
  BarChart3, 
  Target, 
  Zap, 
  TrendingUp,
  Shield,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Eye,
  Settings
} from 'lucide-react'
import React from 'react'

const TradingFeaturesSection = () => {
  const tradingFeatures = [
    // Removed RSI Correlation Dashboard feature
    {
      id: 2,
      icon: Target,
      title: "Currency Strength Meter",
      description: "Real-time currency strength analysis to identify the strongest and weakest currencies across all major pairs.",
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      features: ["Live Strength Calculation", "Visual Indicators", "Multi-Currency Analysis", "Trend Identification"],
      stats: "150+ Pairs"
    },
    {
      id: 3,
      icon: Zap,
      title: "AI News Analysis",
      description: "AI-powered news analysis to understand market sentiment and potential impacts on currency movements.",
      color: "from-purple-500 to-pink-600",
      bgColor: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      features: ["Sentiment Analysis", "Impact Assessment", "Real-time Processing", "Market Predictions"],
      stats: "24/7 Monitoring"
    },
    
  ]

  const keyStats = [
    { icon: TrendingUp, value: "95%", label: "Success Rate", color: "text-green-400" },
    { icon: Clock, value: "<1ms", label: "Response Time", color: "text-blue-400" },
    { icon: Users, value: "150+", label: "Active Users", color: "text-purple-400" },
    { icon: Shield, value: "100%", label: "Secure", color: "text-orange-400" }
  ]

  return (
    <section className="relative py-20 bg-gradient-to-br from-[#19235d] via-[#19235d] to-[#19235d] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <BarChart3 className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center animate-ping">
          <Target className="w-3 h-3 text-blue-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-purple-400/30 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>POWERFUL TRADING FEATURES</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Powerful Trading
            </span>
            <br />
            <span className="text-gray-300">Features</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Everything you need for <span className="text-green-400 font-semibold">professional forex analysis</span> and 
            <span className="text-blue-400 font-semibold"> profitable trading decisions</span>
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {keyStats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#19235d]/80 to-[#19235d]/80 backdrop-blur-sm rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-gray-600/50">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {tradingFeatures.map((feature) => (
            <div
              key={feature.id}
              className="group relative bg-gradient-to-br from-[#19235d]/80 to-[#19235d]/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 transform hover:scale-105 border border-gray-600/50 hover:border-gray-500/50"
            >
              {/* Feature Icon */}
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:rotate-12 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Feature Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Feature List */}
                <div className="space-y-2">
                  {feature.features.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Stats Badge */}
                <div className="pt-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${feature.color} text-white`}>
                    <Eye className="w-3 h-3 mr-1" />
                    {feature.stats}
                  </div>
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="w-5 h-5 text-green-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="bg-gradient-to-br from-[#19235d]/80 to-[#19235d]/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-gray-600/50">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg">
                <Settings className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Experience These
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"> Powerful Features?</span>
            </h3>
            
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of traders who are already using our advanced trading system to maximize their profits
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Start Trading Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>View Live Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TradingFeaturesSection
