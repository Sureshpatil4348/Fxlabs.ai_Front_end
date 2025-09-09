import { 
  Brain, 
  Zap, 
  Target, 
  Shield, 
  TrendingUp, 
  Clock, 
  Users, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Activity,
  Eye,
  Lock,
  Globe,
  Cpu
} from 'lucide-react'
import React, { useState } from 'react'

const WhySystemWorks = () => {
  const [activeCard, setActiveCard] = useState(0)

  const systemFeatures = [
    {
      id: 1,
      icon: Brain,
      title: "AI-Powered Analysis",
      subtitle: "Advanced Machine Learning",
      description: "Our proprietary AI algorithms analyze thousands of market data points in real-time, identifying patterns and opportunities that human traders often miss.",
      benefits: [
        "Pattern Recognition",
        "Predictive Analytics", 
        "Risk Assessment",
        "Market Sentiment Analysis"
      ],
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-500"
    },
    {
      id: 2,
      icon: Zap,
      title: "Lightning-Fast Execution",
      subtitle: "Real-Time Processing",
      description: "Get instant market updates and execute trades with millisecond precision. Our system processes data 100x faster than traditional methods.",
      benefits: [
        "Sub-second Latency",
        "Instant Alerts",
        "Real-Time Updates",
        "High-Frequency Trading"
      ],
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50",
      iconBg: "bg-yellow-500"
    },
    {
      id: 3,
      icon: Target,
      title: "Precision RSI Analysis",
      subtitle: "Technical Excellence",
      description: "Our advanced RSI correlation system identifies overbought/oversold conditions with 95% accuracy, giving you the edge in market timing.",
      benefits: [
        "95% Accuracy Rate",
        "Multi-Timeframe Analysis",
        "Correlation Detection",
        "Signal Confirmation"
      ],
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      iconBg: "bg-green-500"
    },
    
  ]

  const stats = [
    { icon: TrendingUp, value: "95%", label: "Success Rate", color: "text-green-400" },
    { icon: Clock, value: "<1ms", label: "Response Time", color: "text-blue-400" },
    { icon: BarChart3, value: "150+", label: "Currency Pairs", color: "text-purple-400" },
    { icon: Activity, value: "24/7", label: "Market Coverage", color: "text-orange-400" }
  ]

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <Brain className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center animate-ping">
          <Zap className="w-3 h-3 text-blue-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-purple-400/30 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>PROVEN SYSTEM ADVANTAGES</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Why Our Trading
            </span>
            <br />
            <span className="text-gray-300">System Works</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Discover the <span className="text-green-400 font-semibold">six core advantages</span> that make our 
            trading system <span className="text-blue-400 font-semibold">unbeatable</span> in the forex market
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-700/50">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {systemFeatures.map((feature, index) => (
            <div
              key={feature.id}
              className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer border-2 ${
                activeCard === index 
                  ? 'border-green-500 shadow-green-500/20' 
                  : 'border-gray-700/50 hover:border-gray-600/50'
              }`}
              onClick={() => setActiveCard(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveCard(index);
                }
              }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                  activeCard === index 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-500 group-hover:border-green-400'
                }`}>
                  {activeCard === index && (
                    <CheckCircle className="w-5 h-5 text-white -m-0.5" />
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-medium mb-3">{feature.subtitle}</p>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Benefits List */}
                <div className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="w-5 h-5 text-green-400" />
              </div>

              {/* Active Card Glow */}
              {activeCard === index && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>

        {/* Active Card Details */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 text-white border border-gray-600/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${systemFeatures[activeCard].color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  {React.createElement(systemFeatures[activeCard].icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {systemFeatures[activeCard].title}
                  </h3>
                  <p className="text-gray-400">{systemFeatures[activeCard].subtitle}</p>
                </div>
              </div>

              <p className="text-gray-300 text-lg leading-relaxed">
                {systemFeatures[activeCard].description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {systemFeatures[activeCard].benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Learn More</span>
              </button>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                <div className="space-y-6">
                  {/* Feature Icon Large */}
                  <div className="flex justify-center">
                    <div className={`w-24 h-24 bg-gradient-to-br ${systemFeatures[activeCard].color} rounded-3xl flex items-center justify-center shadow-2xl`}>
                      {React.createElement(systemFeatures[activeCard].icon, { className: "w-12 h-12 text-white" })}
                    </div>
                  </div>

                  {/* Feature Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">95%</div>
                      <div className="text-gray-400 text-sm">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">24/7</div>
                      <div className="text-gray-400 text-sm">Monitoring</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">System Performance</span>
                      <span className="text-green-400">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className={`bg-gradient-to-r ${systemFeatures[activeCard].color} h-2 rounded-full w-4/5 animate-pulse`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            Ready to experience the power of our proven trading system?
          </p>
          <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto">
            <Lock className="w-5 h-5" />
            <span>Get Started Today</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default WhySystemWorks
