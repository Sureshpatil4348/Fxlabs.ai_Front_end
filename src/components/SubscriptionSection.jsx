import React, { useState, useEffect } from 'react'

import FreeTrialPopup from './FreeTrialPopup'

const SubscriptionSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [_userLocation, setUserLocation] = useState(null)
  
  // Fetch user's IP and location information
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        console.log('🌍 Fetching user IP and location information...')
        
        // Using ipapi.co for IP geolocation with cache busting
        const timestamp = Date.now()
        const response = await fetch(`https://ipapi.co/json/?t=${timestamp}`)
        const data = await response.json()
        
        console.log('📍 User Location Data:', {
          ip: data.ip,
          country: data.country,
          country_code: data.country_code,
          country_name: data.country_name,
          region: data.region,
          city: data.city,
          timezone: data.timezone,
          currency: data.currency,
          currency_name: data.currency_name,
          languages: data.languages,
          org: data.org,
          asn: data.asn
        })
        
        setUserLocation(data)
        
        // Check if user is from India
        if (data.country_code === 'IN') {
          console.log('🇮🇳 User is from India - India specific pricing should be shown')
        } else {
          console.log(`🌎 User is from ${data.country_name} (${data.country_code}) - Standard pricing should be shown`)
        }
        
      } catch (error) {
        console.error('❌ Error fetching user location:', error)
        
        // Fallback: Try another IP service
        try {
          console.log('🔄 Trying fallback IP service...')
          const fallbackTimestamp = Date.now()
          const fallbackResponse = await fetch(`https://ipinfo.io/json?t=${fallbackTimestamp}`)
          const fallbackData = await fallbackResponse.json()
          
          console.log('📍 Fallback Location Data:', fallbackData)
          setUserLocation(fallbackData)
          
          if (fallbackData.country === 'IN') {
            console.log('🇮🇳 User is from India (fallback) - India specific pricing should be shown')
          } else {
            console.log(`🌎 User is from ${fallbackData.country} (fallback) - Standard pricing should be shown`)
          }
          
        } catch (fallbackError) {
          console.error('❌ Fallback IP service also failed:', fallbackError)
        }
      }
    }
    
    fetchUserLocation()
  }, [])
  
  // Get pricing based on user location
  const getPricingPlans = () => {
    const isIndianUser = _userLocation?.country_code === 'IN'
    
    if (isIndianUser) {
      // Indian pricing (INR)
      return [
        {
          id: 'free',
          name: 'Free Trial',
          duration: '1 Month',
          price: '0',
          period: 'Free for 1 month',
          popular: false,
          description: 'Experience the full power of our platform',
          features: [
            'TradingView Integration',
            'RSI Analysis & Tracking',
            'Currency Strength Meter',
            'Lot Size Calculator',
            'All-in-One Indicator Analysis',
            'Market Session Tracker',
            'Live Email Notifications',
            'News & Market Alerts',
            'Multi-Timeframe Analysis',
            'Professional Dashboard'
          ]
        },
        {
          id: 'quarterly',
          name: '3 Months Plan',
          duration: '3 Months',
          originalPrice: '25000',
          price: '16999',
          period: 'for 3 months',
          savings: 'SAVE ₹8,001',
          popular: false,
          description: 'Best value for serious traders',
          link: 'https://tagmango.app/0c590f2c10',
          features: [
            'TradingView Integration',
            'RSI Analysis & Tracking',
            'Currency Strength Meter',
            'Lot Size Calculator',
            'All-in-One Indicator Analysis',
            'Market Session Tracker',
            'Live Email Notifications',
            'News & Market Alerts',
            'Multi-Timeframe Analysis',
            'Professional Dashboard'
          ]
        },
        {
          id: 'yearly',
          name: '1 Year Plan',
          duration: '12 Months',
          originalPrice: '79999',
          price: '49999',
          period: 'for 1 year',
          savings: 'SAVE ₹30,000',
          popular: true,
          badge: 'MOST POPULAR',
          description: 'Maximum savings for committed traders',
          link: 'https://tagmango.app/9c4d769ec5',
          features: [
            'TradingView Integration',
            'RSI Analysis & Tracking',
            'Currency Strength Meter',
            'Lot Size Calculator',
            'All-in-One Indicator Analysis',
            'Market Session Tracker',
            'Live Email Notifications',
            'News & Market Alerts',
            'Multi-Timeframe Analysis',
            'Professional Dashboard'
          ]
        }
      ]
    } else {
      // Non-Indian pricing (USD) - Only 2 options
      return [
        {
          id: 'quarterly',
          name: '3 Months Plan',
          duration: '3 Months',
          price: '199',
          period: 'for 3 months',
          popular: false,
          description: 'Best value for serious traders',
          link: 'https://buy.stripe.com/28EdR9aYHg8ja11gwG57W0d',
          features: [
            'TradingView Integration',
            'RSI Analysis & Tracking',
            'Currency Strength Meter',
            'Lot Size Calculator',
            'All-in-One Indicator Analysis',
            'Market Session Tracker',
            'Live Email Notifications',
            'News & Market Alerts',
            'Multi-Timeframe Analysis',
            'Professional Dashboard'
          ]
        },
        {
          id: 'yearly',
          name: '1 Year Plan',
          duration: '12 Months',
          price: '499',
          period: 'for 1 year',
          popular: true,
          badge: 'MOST POPULAR',
          description: 'Maximum savings for committed traders',
          link: 'https://buy.stripe.com/28EfZh7Mv1dpc994NY57W0e',
          features: [
            'TradingView Integration',
            'RSI Analysis & Tracking',
            'Currency Strength Meter',
            'Lot Size Calculator',
            'All-in-One Indicator Analysis',
            'Market Session Tracker',
            'Live Email Notifications',
            'News & Market Alerts',
            'Multi-Timeframe Analysis',
            'Professional Dashboard'
          ]
        }
      ]
    }
  }
  
  const pricingPlans = getPricingPlans()
  const isIndianUser = _userLocation?.country_code === 'IN'
  
  // Debug logging
  console.log('🔍 Debug Info:', {
    _userLocation,
    isIndianUser,
    pricingPlansCount: pricingPlans.length,
    pricingPlans: pricingPlans.map(p => ({ id: p.id, name: p.name, price: p.price })),
    timestamp: new Date().toISOString()
  })

  return (
    <section className="py-12 md:py-16 px-4 md:px-6 w-full transition-colors duration-300">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Premium Badge */}
          <div className="inline-flex items-center justify-center px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 rounded-full shadow-sm mb-6">
            <i className="fas fa-crown text-emerald-500 mr-2"></i>
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm tracking-wide">Get Your AI Trading Edge</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Choose Your <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 bg-clip-text text-transparent">Trading Plan</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            All plans include every feature. Choose based on your commitment level and save more with longer subscriptions.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex justify-center">
          <div className={`grid grid-cols-1 items-center ${
            isIndianUser ? 'md:grid-cols-3 gap-6 lg:gap-4 max-w-5xl' : 'md:grid-cols-2 gap-6 lg:gap-4 max-w-4xl'
          }`}>
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className="relative transition-all duration-500"
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-xs font-bold tracking-wider shadow-lg whitespace-nowrap">
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Card Container with Gradient Border Effect */}
              <div className={`relative rounded-3xl transition-all duration-300 h-full ${
                plan.popular 
                  ? 'p-[3px] bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.4)] hover:shadow-[0_25px_70px_-15px_rgba(16,185,129,0.5)]' 
                  : 'p-[2px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-1'
              }`}>
                <div className={`relative rounded-3xl p-12 h-full backdrop-blur-xl transition-all duration-300 flex flex-col ${
                  plan.popular
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-white/90 dark:bg-gray-800/90'
                }`}>
                  
                  {/* Plan Name & Badge */}
                  <div className="text-center mb-8">
                    {!plan.popular && plan.badge && (
                      <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 rounded-full mb-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{plan.badge}</span>
                      </div>
                    )}
                    
                    <h3 className={`text-3xl font-bold mb-3 ${
                      plan.popular 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-800 dark:text-gray-100'
                    }`}>
                      {plan.name}
                    </h3>
                    
                    <p className="text-base text-gray-600 dark:text-gray-400">{plan.description}</p>
                  </div>

                  {/* Price Display */}
                  <div className="text-center mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                    {/* Original Price (if exists) */}
                    {plan.originalPrice && (
                      <div className="mb-2">
                        <span className="text-lg text-gray-400 dark:text-gray-500 line-through">{isIndianUser ? '₹' : '$'}{plan.originalPrice}</span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-center gap-1 mb-1">
                      <span className={`text-2xl font-bold mt-1 ${
                        plan.popular 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-200'
                      }`}>{isIndianUser ? '₹' : '$'}</span>
                      <span className={`text-5xl font-bold ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent' 
                          : 'text-gray-900 dark:text-white'
                      }`}>{plan.price}</span>
                    </div>
                    
                    <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-0.5">/{plan.period}</div>
                    <div className={`text-base font-semibold ${
                      plan.popular 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {plan.duration}
                    </div>
                    
                    {plan.savings && (
                      <div className="mt-2 inline-flex items-center px-3 py-1 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{plan.savings}</span>
                      </div>
                    )}
                    
                    {plan.period === 'lifetime' && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        One-time payment, no recurring fees
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2.5">
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.popular 
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600'
                        }`}>
                          <i className="fas fa-check text-white text-[9px]"></i>
                        </div>
                        <span className={`text-xs leading-relaxed ${
                          plan.popular 
                            ? 'text-gray-700 dark:text-gray-200 font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                    
                    {/* Not Included Features (for non-Indian pricing) */}
                    {plan.notIncluded && plan.notIncluded.map((feature, index) => (
                      <div key={`not-${index}`} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mt-0.5">
                          <i className="fas fa-times text-red-600 dark:text-red-400 text-[9px]"></i>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-through">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {plan.link ? (
                    <a
                      href={plan.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform hover:-translate-y-1 inline-block text-center ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40'
                          : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md'
                      }`}
                    >
                      Get Started Now
                    </a>
                  ) : (
                    <button
                      onClick={() => plan.id === 'free' && setIsModalOpen(true)}
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform hover:-translate-y-1 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40'
                          : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md'
                      }`}
                    >
                      {plan.id === 'free' ? 'Start My Trial' : 'Get Started Now'}
                    </button>
                  )}

                  {/* Money Back Guarantee */}
                  {plan.id !== 'free' && (
                    <div className="text-center mt-3">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                        <i className="fas fa-shield-alt text-emerald-500"></i>
                        propiority support Via Email and Telegram
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Free Trial Popup */}
      <FreeTrialPopup 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  )
}

export default SubscriptionSection;

