import { 
  Play,
  Bell,
  Filter,
  Target,
  TrendingUp,
  Zap,
  Eye,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import React, { useState } from 'react'

const VideoExplanationSection = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const benefits = [
    {
      id: 1,
      title: "Never Miss a Move",
      description: "Get instant alerts the moment opportunities appear.",
      icon: Bell,
      color: "emerald",
      highlight: null
    },
    {
      id: 2,
      title: "Cut the Noise",
      description: "Only the signals that matter, nothing extra.",
      icon: Filter,
      color: "blue",
      highlight: "Cut"
    },
    {
      id: 3,
      title: "Trade with Confidence",
      description: "AI-backed insights, zero guesswork.",
      icon: Target,
      color: "emerald",
      highlight: "Trade"
    },
    {
      id: 4,
      title: "Stay Ahead of the Herd",
      description: "Spot moves before everyone else.",
      icon: TrendingUp,
      color: "teal",
      highlight: "Stay"
    }
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      emerald: {
        bg: 'from-emerald-500/20 to-green-500/20',
        border: 'border-emerald-500/30',
        icon: 'text-emerald-400',
        highlight: 'text-emerald-400'
      },
      blue: {
        bg: 'from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-500/30',
        icon: 'text-blue-400',
        highlight: 'text-blue-400'
      },
      teal: {
        bg: 'from-teal-500/20 to-cyan-500/20',
        border: 'border-teal-500/30',
        icon: 'text-teal-400',
        highlight: 'text-teal-400'
      }
    }
    return colorMap[color] || colorMap.emerald
  }

  return (
    <section className="relative py-24 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
      {/* Unique Background Elements */}
      <div className="absolute inset-0">
        {/* Animated Video Particles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating Video Icons */}
        <div className="absolute top-20 right-20 w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center animate-bounce">
          <Play className="w-6 h-6 text-blue-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-10 h-10 bg-green-500/20 rounded-2xl flex items-center justify-center animate-ping">
          <Zap className="w-5 h-5 text-green-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-emerald-500/30 rounded-2xl animate-pulse"></div>
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="videoGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#videoGrid)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unique Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/30 rounded-full px-6 py-3 text-blue-300 text-sm font-semibold mb-6 shadow-lg shadow-blue-500/20 backdrop-blur-sm">
            <Play className="w-4 h-4 animate-pulse" />
            <span>SEE HOW IT WORKS</span>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-green-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
              My Explanation
            </span>
            <br />
            <span className="text-gray-300 text-2xl md:text-3xl">Video</span>
          </h2>
          
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Watch how <span className="text-blue-400 font-bold">FXLabs.AI</span> transforms your trading with 
            <span className="text-green-400 font-bold"> instant insights</span> and 
            <span className="text-emerald-400 font-bold"> zero guesswork</span>
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Video Section */}
          <div className="relative group">
            {/* Frameless Premium Video Container */}
            <div className="relative overflow-hidden"
                 style={{
                   transformStyle: 'preserve-3d',
                   perspective: '1000px'
                 }}>
              
              {/* Frameless Video Placeholder */}
              <div className="relative bg-black rounded-3xl shadow-2xl overflow-hidden aspect-video border border-gray-800/50">
                {!isVideoPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    {/* Play Button */}
                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className="group relative w-20 h-20 bg-gradient-to-r from-blue-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-110"
                    >
                      <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-green-500/30 rounded-full animate-ping"></div>
                    </button>
                    
                    {/* Video Title Overlay */}
                    <div className="absolute bottom-8 left-8 right-8">
                      <h3 className="text-xl font-bold text-white mb-2">My Explanation Video</h3>
                      <p className="text-gray-300 text-sm">See how FXLabs.AI works in action</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Video Playing</h3>
                      <p className="text-gray-300 text-sm">Experience the power of FXLabs.AI</p>
                    </div>
                  </div>
                )}
                
                {/* Video Controls Overlay */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-blue-500/30 shadow-lg animate-bounce">
                <Eye className="w-4 h-4 text-blue-400" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-green-500/30 shadow-lg animate-pulse">
                <Sparkles className="w-3 h-3 text-green-400" />
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight">
                Why Choose
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent"> FXLabs.AI?</span>
              </h3>
              <p className="text-base text-gray-300 leading-relaxed">
                Discover the key advantages that make our platform the preferred choice for successful traders worldwide.
              </p>
            </div>

            {/* Compact Benefits List */}
            <div className="space-y-3">
              {benefits.map((benefit, _index) => {
                const colors = getColorClasses(benefit.color)
                const IconComponent = benefit.icon
                
                return (
                  <div
                    key={benefit.id}
                    className="group relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/40 hover:border-gray-600/60 transition-all duration-500 hover:scale-105 hover:shadow-lg"
                  >
                    
                    
                    {/* Benefit Content */}
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 bg-gradient-to-br ${colors.bg} rounded-lg flex items-center justify-center border ${colors.border} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      
                      {/* Text Content */}
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-white mb-1 leading-tight">
                          {benefit.highlight ? (
                            <>
                              <span className={colors.highlight}>{benefit.highlight}</span>
                              <span className="text-white"> {benefit.title.replace(benefit.highlight, '')}</span>
                            </>
                          ) : (
                            benefit.title
                          )}
                        </h4>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-green-500/5 to-emerald-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                )
              })}
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 text-white font-bold text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105">
                <Play className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span>Watch Full Demo</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VideoExplanationSection
