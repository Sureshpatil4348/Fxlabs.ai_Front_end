import React from 'react'

import { useAuth } from '../auth/AuthProvider'
import HeroSection from '../components/HeroSection'
import InteractiveFooter from '../components/InteractiveFooter'
import Navbar from '../components/Navbar'
import SubscriptionSection from '../components/SubscriptionSection'
import SuccessStories from '../components/SuccessStories'
import TradingDashboardSection from '../components/TradingDashboardSection'
import VideoExplanationSection from '../components/VideoExplanationSection'


const Home = () => {
  const { user: _user } = useAuth()

  // Allow users to access home page even when logged in

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-300">
      {/* Matrix-Style Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-blue-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-50"></div>
        <div className="absolute top-60 right-40 w-5 h-5 bg-purple-400 rounded-full animate-pulse opacity-30"></div>
        
        {/* Matrix Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>
        
        {/* Light Mode Matrix Grid Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-0">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(75, 85, 99, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(75, 85, 99, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>
        
        {/* Matrix-Style Gradient Orbs - Dark Mode */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse dark:block hidden"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000 dark:block hidden"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-full blur-2xl animate-pulse delay-500 dark:block hidden"></div>
        
        {/* Matrix-Style Gradient Orbs - Light Mode */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-gray-300/20 to-gray-400/20 rounded-full blur-3xl animate-pulse block dark:hidden"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-full blur-3xl animate-pulse delay-1000 block dark:hidden"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-gray-300/15 to-gray-400/15 rounded-full blur-2xl animate-pulse delay-500 block dark:hidden"></div>
        
        {/* Matrix Code Rain Effect - Dark Mode */}
        <div className="absolute inset-0 opacity-5 dark:block hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400 font-mono text-xs animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {Math.random().toString(36).substring(2, 8)}
            </div>
          ))}
        </div>
        
        {/* Matrix Code Rain Effect - Light Mode */}
        <div className="absolute inset-0 opacity-5 block dark:hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-gray-500 font-mono text-xs animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {Math.random().toString(36).substring(2, 8)}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full">
        <Navbar />
        
        {/* Hero Section */}
        <div id="hero">
          <HeroSection />
        </div>

        {/* Trading Dashboard Section */}
        <div id="trading-dashboard">
          <TradingDashboardSection />
        </div>

        {/* Video Explanation Section */}
        <div id="video-explanation">
          <VideoExplanationSection />
        </div>

        {/* Subscription Section */}
        <div id="subscription">
          <SubscriptionSection />
        </div>

        {/* Success Stories Section */}
        <div id="success-stories">
          <SuccessStories />
        </div>

        {/* Interactive Footer */}
        <InteractiveFooter />
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-100 dark:from-gray-900 to-transparent transition-colors duration-300"></div>
      
      {/* Matrix CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `
      }} />
    </div>
  )
}

export default Home
