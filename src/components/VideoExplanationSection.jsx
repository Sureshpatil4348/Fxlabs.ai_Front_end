import { 
  Play,
  Bell,
  Filter,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import React, { useState } from 'react'

const VideoExplanationSection = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const features = [
    {
      id: 1,
      title: "Never Miss a Move",
      description: "Get instant alerts the moment opportunities appear.",
      icon: Bell,
      highlight: "Never"
    },
    {
      id: 2,
      title: "Cut the Noise",
      description: "Only the signals that matter, nothing extra.",
      icon: Filter,
      highlight: "Cut"
    },
    {
      id: 3,
      title: "Trade with Confidence",
      description: "AI-backed insights, zero guesswork.",
      icon: Target,
      highlight: "Trade"
    },
    {
      id: 4,
      title: "Stay Ahead of the Herd",
      description: "Spot moves before everyone else.",
      icon: TrendingUp,
      highlight: "Stay"
    }
  ]

  return (
    <section className="relative -mt-8 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>HOW IT WORKS</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8 font-poppins">
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
              Why Choose FXLabs.AI?
            </span>
          </h2>
          
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Experience the power of <span className="text-emerald-600 dark:text-emerald-400 font-semibold">AI-driven trading</span> with our proven system
          </p>
        </div>

        {/* Main Content - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Video Section */}
          <div className="relative">
            {!isVideoPlaying ? (
              <div 
                className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group cursor-pointer" 
                onClick={() => setIsVideoPlaying(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsVideoPlaying(true);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Play FXLabs.AI Demo Video"
              >
                {/* Video Thumbnail */}
                <div className="relative w-full h-full bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700">
                  <img 
                    src="https://img.youtube.com/vi/xH3vWTPYMsY/maxresdefault.jpg" 
                    alt="FXLabs.AI Demo Video Thumbnail"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="group/btn relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110">
                      <Play className="w-10 h-10 text-white ml-1 group-hover/btn:scale-110 transition-transform duration-300" />
                    </button>
                  </div>
                  
                  {/* Video Title Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1 font-poppins">FXLabs.AI Trading System Demo</h3>
                    <p className="text-white/80 text-sm">See how our AI-powered alerts work in real-time</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-black aspect-video overflow-hidden rounded-2xl shadow-2xl">
                <iframe
                  src="https://www.youtube.com/embed/xH3vWTPYMsY?autoplay=1&rel=0&modestbranding=1"
                  title="FXLabs.AI Demo Video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>

          {/* Features Section - Unique Design */}
          <div className="space-y-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              
              return (
                <div key={feature.id} className="relative group">
                  {/* Unique Progress Line */}
                  {index < features.length - 1 && (
                    <div className="absolute left-5 top-16 w-0.5 h-10 bg-gradient-to-b from-emerald-500 to-transparent opacity-30"></div>
                  )}
                  
                  <div className="flex items-start space-x-5">
                    {/* Unique Icon with Glow */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Content with Unique Styling */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight font-poppins">
                        <span className="relative">
                          <span className="text-emerald-600 dark:text-emerald-400">{feature.highlight}</span>
                          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-emerald-500/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </span>
                        <span className="text-gray-900 dark:text-white"> {feature.title.replace(feature.highlight, '')}</span>
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default VideoExplanationSection