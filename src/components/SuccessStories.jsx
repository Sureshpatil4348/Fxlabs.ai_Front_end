import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Star,
  ArrowRight,
  Trophy,
  Target,
  Zap,
  CheckCircle,
  Sparkles
} from 'lucide-react'

const SuccessStories = () => {
  const { user } = useAuth()

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating Success Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <Trophy className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center animate-ping">
          <Star className="w-3 h-3 text-yellow-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-blue-400/30 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>TRADING EXCELLENCE ACHIEVED</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Success Stories
            </span>
            <br />
            <span className="text-gray-300">That Inspire</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Join our elite community of <span className="text-green-400 font-semibold">proven traders</span> who have 
            transformed their trading journey with our <span className="text-blue-400 font-semibold">AI-powered system</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Active Traders */}
          <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="mb-4">
              <div className="text-4xl font-bold text-white mb-2">150+</div>
              <div className="text-gray-400 text-sm font-medium">Active Traders</div>
            </div>
            <div className="text-green-400 text-sm">
              <span className="inline-flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Growing daily
              </span>
            </div>
          </div>

          {/* Track Record */}
          <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="mb-4">
              <div className="text-4xl font-bold text-white mb-2">6+</div>
              <div className="text-gray-400 text-sm font-medium">Months Track Record</div>
            </div>
            <div className="text-blue-400 text-sm">
              <span className="inline-flex items-center">
                <Target className="w-3 h-3 mr-1" />
                Consistent results
              </span>
            </div>
          </div>

          {/* Total Profits */}
          <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="mb-4">
              <div className="text-4xl font-bold text-white mb-2">$230k+</div>
              <div className="text-gray-400 text-sm font-medium">Total Profits Generated</div>
            </div>
            <div className="text-purple-400 text-sm">
              <span className="inline-flex items-center">
                <Trophy className="w-3 h-3 mr-1" />
                Community success
              </span>
            </div>
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Testimonial 1 */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <div className="text-white font-semibold">Marcus Chen</div>
                <div className="text-gray-400 text-sm">Forex Trader</div>
              </div>
              <div className="ml-auto flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-300 italic mb-4">
              "FXLabs.AI transformed my trading completely. The RSI correlation insights helped me 
              identify profitable opportunities I never saw before. My profits increased by 300% in just 4 months!"
            </p>
            <div className="text-green-400 text-sm font-medium">
              +$45,000 profit in 4 months
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <div className="text-white font-semibold">Sarah Rodriguez</div>
                <div className="text-gray-400 text-sm">Day Trader</div>
              </div>
              <div className="ml-auto flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-300 italic mb-4">
              "The AI news analysis feature is a game-changer. I can now predict market movements 
              with incredible accuracy. The community support is amazing too!"
            </p>
            <div className="text-blue-400 text-sm font-medium">
              +$28,000 profit in 3 months
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-12 border border-gray-600/50">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Join Our
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"> Success Stories?</span>
              </h3>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Don't miss out on the opportunity to transform your trading with our proven system. 
                Join 150+ successful traders who are already generating consistent profits.
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="flex items-center justify-center space-x-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm">Daily Community Support</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm">Proven Trading System</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm">Real Results Sharing</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="group relative inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Access Your Dashboard</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="group relative inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                  >
                    <Trophy className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Join Successful Traders</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                )}
                
                <button className="group inline-flex items-center justify-center px-10 py-4 border-2 border-gray-600 hover:border-green-400 text-gray-300 hover:text-white font-semibold text-lg rounded-xl transition-all duration-300 backdrop-blur-sm">
                  <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span>View Community</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center space-x-8 mt-8 pt-8 border-t border-gray-600/50">
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Community</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Proven Results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuccessStories
