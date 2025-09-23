import { 
  CheckCircle, 
  Crown, 
  Sparkles,
  Gift,
  Award
} from 'lucide-react'
import React, { useState } from 'react'

const SubscriptionSection = () => {
  const [_hoveredCard, _setHoveredCard] = useState(null)

  const subscriptionPlans = [
    {
      id: 'pre-trial',
      name: 'Pre-Trial',
      title: 'Free 1 Month',
      subline: 'Perfect for first-time users',
      badge: {
        text: 'Best for First-Time Users',
        color: 'bg-gradient-to-r from-gray-500 to-blue-500',
        icon: Gift
      },
      price: 'Free',
      period: '1 Month',
      features: [
        'Basic RSI Analysis',
        '5 Currency Pairs',
        'Email Support',
        'Mobile Access',
        'Basic Alerts',
        'Community Access',
        'Tutorial Videos',
        '7-Day Refund'
      ],
      ctaButton: {
        text: 'Start Free Trial',
        color: 'bg-gradient-to-r from-gray-600 to-blue-600 hover:from-gray-700 hover:to-blue-700'
      }
    },
    {
      id: 'quarter',
      name: 'Quarter Plan',
      title: 'Most Popular',
      subline: 'Perfect for serious traders',
      badge: {
        text: 'Most Popular',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icon: Award
      },
      price: '$199',
      period: '3 Months',
      features: [
        'Advanced RSI Analysis',
        '25 Currency Pairs',
        'AI News Analysis',
        'Priority Support',
        'Real-Time Alerts',
        'Telegram Notifications',
        'Advanced Charts',
        'Risk Management Tools'
      ],
      ctaButton: {
        text: 'Choose Quarter Plan',
        color: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
      }
    },
    {
      id: 'annual',
      name: 'Annual Plan',
      title: 'Best Value',
      subline: 'Maximum savings & features',
      badge: {
        text: 'Best Value',
        color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        icon: Crown
      },
      price: '$599',
      period: '12 Months',
      originalPrice: '$799',
      savings: 'Save $200',
      features: [
        'Premium RSI Suite',
        'All 150+ Pairs',
        'AI Trading Bot',
        '24/7 VIP Support',
        'API Integration',
        'Personal Coach',
        'Advanced Analytics',
        'Priority Feature Access'
      ],
      ctaButton: {
        text: 'Choose Annual Plan',
        color: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700'
      }
    }
  ]

  return (
    <section className="relative py-24">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Premium Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>CHOOSE YOUR PLAN</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight font-poppins">
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
              Choose Your
            </span>
            <br />
            <span className="text-gray-600 dark:text-gray-300 text-2xl md:text-3xl font-normal">Trading Plan</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join <span className="text-emerald-600 dark:text-emerald-400 font-semibold">150+ successful traders</span> using our proven system
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {subscriptionPlans.map((plan, _index) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800/50 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer ${
                plan.id === 'quarter' ? 'ring-2 ring-green-500/30' : ''
              }`}
                onMouseEnter={() => _setHoveredCard(plan.id)}
                onMouseLeave={() => _setHoveredCard(null)}
            >
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className={`${plan.badge.color} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center space-x-1`}>
                  <plan.badge.icon className="w-4 h-4" />
                  <span>{plan.badge.text}</span>
                </div>
              </div>

              {/* Headline */}
              <div className="text-center mb-8 pt-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">{plan.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{plan.subline}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                {plan.savings && (
                  <div className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold mb-2">
                    {plan.savings}
                  </div>
                )}
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-gray-500 dark:text-gray-400 text-sm line-through mt-1">
                    {plan.originalPrice}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${plan.ctaButton.color}`}>
                {plan.ctaButton.text}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Line */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            7-day refund on paid plans · Cancel anytime · Trusted by traders worldwide
          </p>
        </div>
      </div>
    </section>
  )
}

export default SubscriptionSection
