import { 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight,
  Trophy,
  Zap,
  CheckCircle,
  Sparkles,
  MessageSquare,
  Smartphone,
  Mail,
  Quote
} from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'

const SuccessStories = () => {
  const { user } = useAuth()

  const successStories = [
    {
      id: 1,
      headline: "From Missed Trades to Daily Wins",
      trader: {
        name: "Raj Kumar",
        role: "Full-time trader, Mumbai",
        avatar: "R",
        rating: 5,
        verified: true
      },
      story: {
        before: "I used to miss out on moves because I wasn't glued to charts.",
        breakthrough: "With instant alerts on Telegram, I finally caught trades I would've missed.",
        after: "In my first month, I hit 3 trades that paid for my subscription."
      },
      visual: {
        type: "telegram",
        content: "EUR/USD Alert: Strong RSI divergence detected. Entry: 1.0850"
      },
      pullQuote: "FXLabs paid for itself in my first week.",
      profit: "+$12,500 in 30 days"
    },
    {
      id: 2,
      headline: "How Sarah Turned News Chaos Into Profits",
      trader: {
        name: "Sarah Chen",
        role: "Part-time trader, Singapore",
        avatar: "S",
        rating: 5,
        verified: true
      },
      story: {
        before: "I was overwhelmed by conflicting news and market noise.",
        breakthrough: "The AI news analysis gave me clear direction on what actually mattered.",
        after: "My win rate jumped from 45% to 78% in just 6 weeks."
      },
      visual: {
        type: "chart",
        content: "GBP/USD breakout after news analysis"
      },
      pullQuote: "I stopped second-guessing my trades.",
      profit: "+$8,200 in 6 weeks"
    },
    {
      id: 3,
      headline: "I Stopped Second-Guessing My Trades",
      trader: {
        name: "Marcus Johnson",
        role: "Day trader, London",
        avatar: "M",
        rating: 5,
        verified: true
      },
      story: {
        before: "I was constantly doubting my decisions and exiting trades too early.",
        breakthrough: "The correlation alerts gave me confidence to hold winning positions.",
        after: "Now I trust the system and let profits run naturally."
      },
      visual: {
        type: "email",
        content: "USD/JPY Correlation Alert: Strong momentum building"
      },
      pullQuote: "The system gave me the confidence I was missing.",
      profit: "+$15,800 in 2 months"
    }
  ]

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
      {/* Unique Background Elements */}
      <div className="absolute inset-0">
        {/* Animated Success Particles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating Success Icons */}
        <div className="absolute top-20 right-20 w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center animate-bounce">
          <Trophy className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-10 h-10 bg-yellow-500/20 rounded-2xl flex items-center justify-center animate-ping">
          <Star className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-blue-500/30 rounded-2xl animate-pulse"></div>
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="successGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#successGrid)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unique Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-full px-6 py-3 text-emerald-300 text-sm font-semibold mb-6 shadow-lg shadow-emerald-500/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>REAL TRADER SUCCESS STORIES</span>
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
              Success Stories
            </span>
            <br />
            <span className="text-gray-300 text-2xl md:text-3xl">That Inspire</span>
          </h2>
          
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            See how real traders transformed their results with <span className="text-emerald-400 font-bold">FXLabs.AI</span> - 
            from missed opportunities to <span className="text-green-400 font-bold">consistent profits</span>
          </p>
        </div>

        {/* Success Stories Grid */}
        <div className="space-y-12 mb-12">
          {successStories.map((story, index) => (
            <div key={story.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
              
              {/* Story Content */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                {/* Headline */}
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                  {story.headline}
                </h3>

                {/* Trader Snapshot */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                    <span className="text-white font-bold text-lg">{story.trader.avatar}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-bold text-white">{story.trader.name}</h4>
                      {story.trader.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-gray-300 font-semibold text-sm">{story.trader.role}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {[...Array(story.trader.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                      <span className="text-gray-400 text-xs ml-1 font-medium">Verified Trader</span>
                    </div>
                  </div>
                </div>

                {/* Before & After Story */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gradient-to-r from-red-500/10 to-red-600/5 border-l-4 border-red-400 p-4 rounded-r-xl backdrop-blur-sm">
                    <p className="text-gray-200 font-semibold text-sm">
                      <span className="text-red-400 font-bold">The Struggle:</span> {story.story.before}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-l-4 border-blue-400 p-4 rounded-r-xl backdrop-blur-sm">
                    <p className="text-gray-200 font-semibold text-sm">
                      <span className="text-blue-400 font-bold">The Breakthrough:</span> {story.story.breakthrough}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 border-l-4 border-green-400 p-4 rounded-r-xl backdrop-blur-sm">
                    <p className="text-gray-200 font-semibold text-sm">
                      <span className="text-green-400 font-bold">The Result:</span> {story.story.after}
                    </p>
                  </div>
                </div>

                {/* Pull Quote */}
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-gray-700/50 shadow-xl">
                  <Quote className="w-6 h-6 text-emerald-400 mb-4" />
                  <blockquote className="text-lg font-bold text-white leading-relaxed mb-4">
                    &ldquo;{story.pullQuote}&rdquo;
                  </blockquote>
                  <div className="text-emerald-400 font-bold text-base">
                    {story.profit}
                  </div>
                </div>
              </div>

              {/* Visual Element */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-700/50">
                  {story.visual.type === 'telegram' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Telegram Alert</h4>
                          <p className="text-xs text-gray-400">FXLabs.AI Bot</p>
                        </div>
                      </div>
                      <div className="bg-black/50 rounded-xl p-4 text-emerald-400 font-mono text-sm border border-gray-700/50">
                        {story.visual.content}
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400 text-xs">
                        <Smartphone className="w-4 h-4" />
                        <span>Instant notification</span>
                      </div>
                    </div>
                  )}

                  {story.visual.type === 'chart' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Trade Analysis</h4>
                          <p className="text-xs text-gray-400">AI News Impact</p>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-xl p-6 h-40 flex items-center justify-center border border-gray-700/50">
                        <div className="text-center">
                          <TrendingUp className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                          <p className="text-gray-200 font-semibold text-sm">{story.visual.content}</p>
                          <p className="text-xs text-gray-400 mt-2">Chart with highlighted entry point</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {story.visual.type === 'email' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Email Alert</h4>
                          <p className="text-xs text-gray-400">FXLabs.AI System</p>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 border border-gray-700/50">
                        <div className="text-sm text-gray-200 mb-2 font-semibold">Subject: {story.visual.content}</div>
                        <div className="text-xs text-gray-400">Correlation strength: 87% | Confidence: High</div>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400 text-xs">
                        <Mail className="w-4 h-4" />
                        <span>Email notification</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-12 shadow-xl border border-gray-700/50">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
              Ready to Write Your Own
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent"> Success Story?</span>
            </h3>
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              Join hundreds of traders who are already generating consistent profits with our proven system. 
              Start your free trial today and see the difference.
            </p>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center space-x-3 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-base">Instant Telegram Alerts</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-base">AI News Analysis</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-base">Proven Results</span>
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
                  <span>Start Your Free Trial</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              )}
              
              <button className="group inline-flex items-center justify-center px-10 py-4 border-2 border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-600 font-semibold text-lg rounded-xl transition-all duration-300">
                <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>View More Stories</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 mt-8 pt-8 border-t border-gray-600/50">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Live Community</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="font-medium">24/7 Support</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Proven Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuccessStories