import { 
  CheckCircle, 
  Crown, 
  Sparkles,
  Gift,
  Star
} from 'lucide-react'
import React from 'react'

const SubscriptionSection = () => {

  return (
    <section className="relative mt-12 py-4">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Premium Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 sm:px-6 py-2 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>CHOOSE YOUR PLAN</span>
          </div>
          
         
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            Join <span className="text-emerald-600 dark:text-emerald-400 font-semibold">150+ successful traders</span> using our proven system
          </p>
        </div>

        {/* Pricing Cards - Individual Designs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 items-stretch">
          
          {/* Pre-Trial Card */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
               style={{
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 20px rgba(156, 163, 175, 0.1)'
               }}>
              {/* Badge */}
            <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-xl flex items-center space-x-1 sm:space-x-2">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Best for First-Time Users</span>
                <span className="sm:hidden">First-Time Users</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 flex flex-col h-full">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 font-poppins text-lg sm:text-xl lg:text-2xl">
                  Free 1 Month
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  Perfect for first-time users
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <span className="font-bold text-gray-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl">
                    Free
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1 sm:ml-2 text-xs sm:text-sm lg:text-base">
                    /1 Month
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-4 sm:mb-6 lg:mb-8 flex-grow">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Basic RSI Analysis</span>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">5 Currency Pairs</span>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Email Support</span>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Mobile Access</span>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Basic Alerts</span>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Community Access</span>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Tutorial Videos</span>
                </div>
                <div className="flex items-start space-x-3">
                
                 
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-sm sm:text-base mt-auto">
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Quarter Plan Card - PREMIUM MIDDLE CARD */}
          <div className="relative md:col-span-2 lg:col-span-1 lg:scale-105 lg:-mt-2 lg:mb-2 z-10 transition-all duration-300">
            {/* Enhanced Glow Effect with #03c05d */}
            <div className="absolute -inset-1 bg-[#03c05d]/30 rounded-xl blur-md"></div>
            <div className="absolute -inset-0.5 bg-[#03c05d]/20 rounded-xl blur-sm"></div>
            
            {/* Card Container */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-[#03c05d]/40 shadow-[#03c05d]/20">
              
              {/* Premium Badge */}
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-[#03c05d] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 shadow-lg shadow-[#03c05d]/30">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Most Popular</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6 lg:p-8 pt-6 flex flex-col h-full lg:min-h-[700px]">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg sm:text-xl lg:text-2xl">
                    Most Popular
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                    Perfect for serious traders
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="font-bold text-gray-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl">
                      $199
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1 sm:ml-2 text-xs sm:text-sm lg:text-base">
                      /3 Months
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-4 sm:mb-6 lg:mb-8 flex-grow">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">Advanced RSI Analysis</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">25 Currency Pairs</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">AI News Analysis</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">Priority Support</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">Real-Time Alerts</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">Telegram Notifications</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">Advanced Charts</span>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[#03c05d]/10">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#03c05d]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">Risk Management Tools</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full py-3 sm:py-4 lg:py-5 px-4 sm:px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base lg:text-lg bg-[#03c05d] hover:bg-[#02a04a] shadow-[#03c05d]/30 mt-auto">
                  Choose Quarter Plan
                </button>
              </div>

              {/* Premium Corner Accent */}
              <div className="absolute top-0 right-0 w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px] border-t-[#03c05d] rounded-tr-2xl"></div>
            </div>
          </div>

          {/* Annual Plan Card */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
               style={{
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 20px rgba(156, 163, 175, 0.1)'
               }}>
            {/* Badge */}
            <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-xl flex items-center space-x-1 sm:space-x-2">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Best Value</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 sm:p-6 lg:p-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 flex flex-col h-full">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 font-poppins text-lg sm:text-xl lg:text-2xl">
                  Best Value
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  Maximum savings & features
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <span className="font-bold text-gray-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl">
                    $599
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1 sm:ml-2 text-xs sm:text-sm lg:text-base">
                    /12 Months
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">Premium RSI Suite</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">All 150+ Pairs</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">AI Trading Bot</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">24/7 VIP Support</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">API Integration</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">Personal Coach</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">Advanced Analytics</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">Priority Feature Access</span>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-sm sm:text-base mt-auto">
                Choose Annual Plan
              </button>
            </div>
          </div>

        </div>

       
      </div>
    </section>
  )
}

export default SubscriptionSection
