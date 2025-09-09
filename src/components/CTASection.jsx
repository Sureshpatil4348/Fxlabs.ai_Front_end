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
    <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Main CTA Content */}
        <div className="space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Start Your
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"> Profitable Journey?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Join 150+ successful traders who are already generating consistent profits with our proven system
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No Setup Fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>30-Day Money Back</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant Access</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/dashboard"
                className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <TrendingUp className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            )}
            
            <button className="group border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Learn More</span>
            </button>
          </div>

          {/* Bottom Text */}
          <p className="text-sm text-gray-400">
            Start your free trial today. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}

export default CTASection
