import {
  Grid3x3,
  Wallet,
  TrendingUp,
  Shield
} from 'lucide-react';
import React from 'react';

const VideoExplanationSection = () => {
  const features = [
    {
      icon: Grid3x3,
      title: "Multi-Time Frame Analysis",
      description: "Analyze the market from multiple time frames to identify trends and opportunities"
    },
    {
      icon: Wallet,
      title: "Smart money management",
      description: "Use Lotsize calculator to calculate the optimal lot size for your account"
    },
    {
      icon: TrendingUp,
      title: "News Alerts",
      description: "Get instant notifications for high-impact news events and indicator signals directly via email"
    },
    {
      icon: Shield,
      title: "Trading View Integration",
      description: "Access professional-grade charting tools with no software installation required. Trade directly from your browser with real-time data."
    }
  ];

  return (
    <section className="py-12 md:py-16 px-4 md:px-6 w-full transition-colors duration-300 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-full px-6 py-3 shadow-lg">
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent font-semibold text-sm uppercase tracking-wider">
                Advanced Technology
              </span>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Advanced{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
              Trading Technology
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Years of refinement through thousands of trades. Here&apos;s what makes it different from everything else you&apos;ve tried.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
          {/* Features Column */}
          <div className="lg:w-1/2 space-y-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Video Column */}
          <div className="lg:w-1/2 w-full">
            <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden p-2">
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-50"></div>
              
              {/* Video Container */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/1CcpagwYKNQ" 
                  title="FxLabs Algo Trading System" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                  className="aspect-video w-full h-full"
                ></iframe>
              </div>

              {/* Video Badge */}
              <div className="absolute top-6 left-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-full px-4 py-2 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Live Demo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoExplanationSection;