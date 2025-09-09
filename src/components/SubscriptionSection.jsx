import { 
  CheckCircle, 
  Star, 
  Crown, 
  Shield, 
  Users, 
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  Lock,
  Gift
} from 'lucide-react'
import React, { useState } from 'react'

const SubscriptionSection = () => {
  const [selectedPlan, setSelectedPlan] = useState('gold') // Default to gold
  const [isAnnual, setIsAnnual] = useState(true) // Default to annual billing

  const subscriptionPlans = [
    {
      id: 'silver',
      name: 'Silver',
      icon: Star,
      color: 'from-gray-400 to-gray-600',
      bgColor: 'from-gray-50 to-gray-100',
      borderColor: 'border-gray-300',
      price: { monthly: 29, annual: 290 },
      description: 'Perfect for beginners starting their trading journey',
      features: [
        'Basic RSI Analysis',
        '5 Currency Pairs',
        'Email Support',
        'Basic Risk Management',
        'Mobile App Access',
        'Weekly Market Updates'
      ],
      limitations: [
        'Limited AI Insights',
        'Standard Response Time',
        'Basic Community Access'
      ],
      popular: false
    },
    {
      id: 'gold',
      name: 'Gold',
      icon: Crown,
      color: 'from-yellow-500 to-amber-600',
      bgColor: 'from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-400',
      price: { monthly: 79, annual: 790 },
      description: 'Most popular choice for serious traders',
      features: [
        'Advanced RSI Correlation Analysis',
        '25 Currency Pairs',
        'AI-Powered News Analysis',
        'Priority Support',
        'Advanced Risk Management',
        'Real-Time Alerts',
        'Community Access',
        'Daily Market Insights',
        'Mobile & Desktop Access',
        'Custom Indicators'
      ],
      limitations: [
        'Limited API Access',
        'Standard Trading Hours'
      ],
      popular: true
    },
    {
      id: 'diamond',
      name: 'Diamond',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-600',
      bgColor: 'from-blue-50 to-purple-50',
      borderColor: 'border-blue-400',
      price: { monthly: 149, annual: 1490 },
      description: 'Ultimate package for professional traders',
      features: [
        'Premium RSI Analysis Suite',
        'All 150+ Currency Pairs',
        'Advanced AI Trading Bot',
        '24/7 VIP Support',
        'Professional Risk Management',
        'Instant Alerts & Notifications',
        'Exclusive Community Access',
        'Real-Time Market Analysis',
        'Multi-Platform Access',
        'Custom Trading Strategies',
        'API Integration',
        'Personal Trading Coach',
        'Advanced Backtesting',
        'White-Label Solutions'
      ],
      limitations: [],
      popular: false
    }
  ]

  const stats = [
    { icon: Users, value: "150+", label: "Active Traders", color: "text-green-400" },
    { icon: TrendingUp, value: "$230k+", label: "Profits Generated", color: "text-blue-400" },
    { icon: Target, value: "95%", label: "Success Rate", color: "text-purple-400" },
    { icon: Clock, value: "6+", label: "Months Track Record", color: "text-orange-400" }
  ]

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <Crown className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center animate-ping">
          <Star className="w-3 h-3 text-yellow-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-blue-400/30 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-6">
            <Gift className="w-4 h-4" />
            <span>CHOOSE YOUR TRADING EDGE</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Choose Your
            </span>
            <br />
            <span className="text-gray-300">Trading Edge</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
            Join <span className="text-green-400 font-semibold">150+ successful traders</span> using our proven system
          </p>

          {/* Success Badge */}
          <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Established system with proven track record - $230k+ profit generated by our active users</span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-600/50">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-full p-1 flex border border-gray-600/50">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isAnnual 
                  ? 'bg-gray-700 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
              role="switch"
              aria-checked={!isAnnual}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
                isAnnual 
                  ? 'bg-gray-700 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
              role="switch"
              aria-checked={isAnnual}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer border-2 ${
                selectedPlan === plan.id 
                  ? `${plan.borderColor} shadow-xl` 
                  : 'border-gray-600/50 hover:border-gray-500/50'
              } ${plan.popular ? 'ring-2 ring-yellow-400/50' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPlan(plan.id);
                }
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card Header */}
              <div className="text-center mb-8">
                <div className={`w-20 h-20 bg-gradient-to-br ${plan.color} rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-4`}>
                  <plan.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-gray-400 ml-2">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <div className="text-green-400 text-sm font-medium mt-1">
                      Save ${(plan.price.monthly * 12) - plan.price.annual}/year
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <div className="space-y-2 mb-8">
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Limitations</div>
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-500 text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                plan.id === 'silver' 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : plan.id === 'gold'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
              }`}>
                {plan.id === 'diamond' ? 'Get Diamond Access' : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Selected Plan Details */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-gray-600/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Plan Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${subscriptionPlans.find(p => p.id === selectedPlan)?.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  {React.createElement(subscriptionPlans.find(p => p.id === selectedPlan)?.icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {subscriptionPlans.find(p => p.id === selectedPlan)?.name} Plan Selected
                  </h3>
                  <p className="text-gray-400">
                    {subscriptionPlans.find(p => p.id === selectedPlan)?.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Monthly Price</span>
                  <span className="text-2xl font-bold text-white">
                    ${subscriptionPlans.find(p => p.id === selectedPlan)?.price.monthly}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Annual Price</span>
                  <span className="text-2xl font-bold text-white">
                    ${subscriptionPlans.find(p => p.id === selectedPlan)?.price.annual}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Features Included</span>
                  <span className="text-green-400 font-semibold">
                    {subscriptionPlans.find(p => p.id === selectedPlan)?.features.length} Features
                  </span>
                </div>
              </div>

              <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Start Your {subscriptionPlans.find(p => p.id === selectedPlan)?.name} Journey</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-600/50">
                <div className="space-y-6">
                  {/* Plan Icon Large */}
                  <div className="flex justify-center">
                    <div className={`w-24 h-24 bg-gradient-to-br ${subscriptionPlans.find(p => p.id === selectedPlan)?.color} rounded-3xl flex items-center justify-center shadow-2xl`}>
                      {React.createElement(subscriptionPlans.find(p => p.id === selectedPlan)?.icon, { className: "w-12 h-12 text-white" })}
                    </div>
                  </div>

                  {/* Plan Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {subscriptionPlans.find(p => p.id === selectedPlan)?.features.length}
                      </div>
                      <div className="text-gray-400 text-sm">Features</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {subscriptionPlans.find(p => p.id === selectedPlan)?.id === 'diamond' ? '24/7' : 'Business'}
                      </div>
                      <div className="text-gray-400 text-sm">Support</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Plan Value</span>
                      <span className="text-green-400 font-semibold">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className={`bg-gradient-to-r ${subscriptionPlans.find(p => p.id === selectedPlan)?.color} h-2 rounded-full w-4/5 animate-pulse`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6">
            Ready to join 150+ successful traders and start your profitable journey?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>View Success Stories</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SubscriptionSection
