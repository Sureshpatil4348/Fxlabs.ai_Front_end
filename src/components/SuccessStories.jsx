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
    <section className="relative py-20">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Premium Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>REAL TRADER SUCCESS STORIES</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight font-poppins">
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
              Success Stories
            </span>
            <br />
            <span className="text-gray-600 dark:text-gray-300 text-2xl md:text-3xl font-normal">That Inspire</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            See how real traders transformed their results with <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FXLabs.AI</span> - 
            from missed opportunities to <span className="text-green-600 dark:text-green-400 font-semibold">consistent profits</span>
          </p>
        </div>

        {/* Success Stories Grid */}
        <div className="space-y-20 mb-20">
          {successStories.map((story, index) => (
            <div key={story.id} className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              
              {/* Story Content - Left Side */}
              <div className="flex-1 space-y-8">
                {/* Headline */}
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight font-poppins">
                  {story.headline}
                </h3>

                {/* Trader Snapshot */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{story.trader.avatar}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{story.trader.name}</h4>
                      {story.trader.verified && (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{story.trader.role}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {[...Array(story.trader.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Story Flow */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
                      <span className="font-semibold text-gray-900 dark:text-white">Before:</span> {story.story.before}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
                      <span className="font-semibold text-gray-900 dark:text-white">Breakthrough:</span> {story.story.breakthrough}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
                      <span className="font-semibold text-gray-900 dark:text-white">Result:</span> {story.story.after}
                    </p>
                  </div>
                </div>

                {/* Pull Quote */}
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700/50">
                  <Quote className="w-8 h-8 text-emerald-500 mb-4" />
                  <blockquote className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed italic mb-4">
                    &ldquo;{story.pullQuote}&rdquo;
                  </blockquote>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                    {story.profit}
                  </div>
                </div>
              </div>

              {/* Visual Element - Right Side */}
              <div className="flex-1">
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 h-96 flex items-center justify-center">
                  {story.visual.type === 'telegram' && (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <MessageSquare className="w-10 h-10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">Telegram Alert</h4>
                        <p className="text-gray-600 dark:text-gray-300">Instant notifications</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4 text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        {story.visual.content}
                      </div>
                    </div>
                  )}

                  {story.visual.type === 'chart' && (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <TrendingUp className="w-10 h-10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">Trade Analysis</h4>
                        <p className="text-gray-600 dark:text-gray-300">AI-powered insights</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-6">
                        <TrendingUp className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                        <p className="text-gray-700 dark:text-gray-200 font-semibold">{story.visual.content}</p>
                      </div>
                    </div>
                  )}

                  {story.visual.type === 'email' && (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Mail className="w-10 h-10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">Email Alert</h4>
                        <p className="text-gray-600 dark:text-gray-300">Detailed analysis</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 font-semibold">Subject: {story.visual.content}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Correlation strength: 87% | Confidence: High</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl rounded-2xl p-12 shadow-xl border border-gray-300 dark:border-gray-700/50 transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6 leading-tight">
              Ready to Write Your Own
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Success Story?</span>
            </h3>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              Join hundreds of traders who are already generating consistent profits with our proven system. 
              Start your free trial today and see the difference.
            </p>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-base">Instant Telegram Alerts</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-base">AI News Analysis</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
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
              
              <button className="group inline-flex items-center justify-center px-10 py-4 border-2 border-gray-400 dark:border-gray-300 hover:border-green-500 text-gray-700 dark:text-gray-300 hover:text-green-600 font-semibold text-lg rounded-xl transition-all duration-300">
                <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>View More Stories</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 mt-8 pt-8 border-t border-gray-400 dark:border-gray-600/50">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Live Community</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                <span className="font-medium">24/7 Support</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse"></div>
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