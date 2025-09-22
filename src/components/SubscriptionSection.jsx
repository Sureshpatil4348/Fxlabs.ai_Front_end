import { 
  CheckCircle, 
  Crown, 
  ArrowRight,
  Star,
  Sparkles,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

const SubscriptionSection = () => {
  const [isAnnual, setIsAnnual] = useState(true)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const subscriptionPlans = [
    {
      id: 'silver',
      name: 'Silver',
      icon: Star,
      gradient: 'from-gray-400 via-gray-500 to-gray-600',
      price: { monthly: 29, annual: 290 },
      description: 'Perfect for beginners',
      features: [
        'Basic RSI Analysis',
        '5 Currency Pairs',
        'Email Support',
        'Mobile Access'
      ]
    },
    {
      id: 'gold',
      name: 'Gold',
      icon: Crown,
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      price: { monthly: 79, annual: 790 },
      description: 'Most popular choice',
      features: [
        'Advanced RSI Analysis',
        '25 Currency Pairs',
        'AI News Analysis',
        'Priority Support',
        'Real-Time Alerts',
        'Community Access'
      ],
      popular: true
    },
    {
      id: 'diamond',
      name: 'Diamond',
      icon: Sparkles,
      gradient: 'from-blue-400 via-purple-500 to-pink-500',
      price: { monthly: 149, annual: 1490 },
      description: 'For professionals',
      features: [
        'Premium RSI Suite',
        'All 150+ Pairs',
        'AI Trading Bot',
        '24/7 VIP Support',
        'API Integration',
        'Personal Coach'
      ]
    }
  ]

  return (
    <section className="relative py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center animate-ping">
          <Zap className="w-3 h-3 text-yellow-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-blue-400/30 rounded-full animate-pulse"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Animation */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo Section */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src={require('../assets/logo1.png')} 
                alt="FXLabs Logo" 
                className="w-32 h-32 object-contain filter brightness-110 contrast-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
          
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-4 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>CHOOSE YOUR TRADING EDGE</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent animate-pulse">
              Choose Your
            </span>
            <br />
            <span className="text-gray-300">Trading Edge</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Join <span className="text-green-400 font-semibold animate-pulse">150+ successful traders</span> using our proven system
          </p>
        </div>

        {/* Billing Toggle with Premium Animation */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-full p-1 flex border border-gray-600/50 shadow-2xl">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                !isAnnual 
                  ? 'bg-gradient-to-r from-white to-gray-100 text-gray-900 shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 relative ${
                isAnnual 
                  ? 'bg-gradient-to-r from-white to-gray-100 text-gray-900 shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full animate-bounce shadow-lg">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Cards with Premium Animations */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {subscriptionPlans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-3xl cursor-pointer border-2 ${
                plan.popular 
                  ? 'ring-2 ring-yellow-400/50 border-yellow-400/30 hover:border-yellow-400/50' 
                  : 'border-gray-600/50 hover:border-gray-500/50'
              } ${hoveredCard === plan.id ? 'scale-105 shadow-3xl' : ''}`}
              onMouseEnter={() => setHoveredCard(plan.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                animationDelay: `${index * 200}ms`
              }}
            >
              {/* Popular Badge with Animation */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                    <Crown className="w-4 h-4 inline mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Icon with Gradient Animation */}
              <div className="text-center mb-8">
                <div className={`w-20 h-20 bg-gradient-to-br ${plan.gradient} rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-4 transform transition-all duration-300 hover:scale-110 hover:rotate-6`}>
                  <plan.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                
                {/* Price with Animation */}
                <div className="mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white transition-all duration-300 hover:scale-110">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-gray-400 ml-2">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <div className="text-green-400 text-sm font-medium mt-1 animate-pulse">
                      Save ${(plan.price.monthly * 12) - plan.price.annual}/year
                    </div>
                  )}
                </div>
              </div>

              {/* Features with Staggered Animation */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div 
                    key={featureIndex} 
                    className="flex items-center space-x-3 transition-all duration-300 hover:translate-x-2"
                    style={{
                      animationDelay: `${(index * 200) + (featureIndex * 100)}ms`
                    }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 animate-pulse" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button with Premium Effects */}
              <button className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden ${
                plan.popular 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white'
              }`}>
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Choose {plan.name}</span>
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom CTA with Premium Animation */}
        <div className={`text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-gray-400 mb-8 text-lg">
            Ready to start your <span className="text-green-400 font-semibold animate-pulse">profitable trading journey</span>?
          </p>
          <button className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-12 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2 mx-auto relative overflow-hidden">
            <Shield className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            <span>Start Free Trial</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>
      </div>
    </section>
  )
}

export default SubscriptionSection
