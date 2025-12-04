import { 
  ArrowRight, 
  Shield, 
  TrendingUp,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'

const CTASection = () => {
  const { user } = useAuth()

  return (
    <section className="relative py-20 md:py-24 px-4 md:px-6 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#19235d] dark:via-black dark:to-[#19235d] transition-colors duration-300">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Main Content Card with Glassmorphism */}
        <div className="relative">
          {/* Gradient Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-blue-500/10 blur-3xl rounded-3xl"></div>
          
          {/* Glass Card */}
          <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 md:p-12 lg:p-16">
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative space-y-8 md:space-y-10 text-center">
              {/* Headline with Gradient Text */}
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#19235d] dark:text-white leading-tight">
                  Ready to 10x your trading{' '}
                  <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 bg-clip-text text-transparent">
                    with advanced tools?
                  </span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  Start trading with FXLabs Prime trading suite.
                </p>
              </div>

              {/* Trust Indicators with Enhanced Design */}
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
                {[
                  { icon: CheckCircle, text: 'Live Notification' },
                  { icon: CheckCircle, text: 'Advance Charts' },
                  { icon: CheckCircle, text: 'Ai Analysis' }
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 rounded-full border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm md:text-base font-medium text-[#19235d] dark:text-gray-200">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons with Enhanced Styling */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="group relative bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50"
                  >
                    <TrendingUp className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      const subscriptionSection = document.getElementById('subscription')
                      if (subscriptionSection) {
                        subscriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className="group relative bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50"
                  >
                    <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Get Started Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                )}
                
                <button className="group relative bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 hover:border-emerald-500 dark:hover:border-emerald-400 text-[#19235d] dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Learn More</span>
                </button>
              </div>

              {/* Bottom Badge */}
              <div className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-white/5 dark:to-white/10 rounded-full border border-gray-200 dark:border-white/10 shadow-sm mx-auto">
                <Shield className="w-4 h-4 text-emerald-500 mr-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Join the Community of pro traders across the globe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection
