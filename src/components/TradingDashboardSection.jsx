import { BarChart3, Bell, Mail, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Zap, Shield, Target, Rocket, Star, Crown, Sparkles } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import RSICorrelationDashboard from './RSICorrelationDashboard'
import { useAuth } from '../auth/AuthProvider'
import useBaseMarketStore from '../store/useBaseMarketStore'
import useMarketStore from '../store/useMarketStore'

const TradingDashboardSection = () => {
  const { user } = useAuth()
  const { } = useMarketStore()
  const connectionInitiated = useRef(false)
  const [showAlertDemo, setShowAlertDemo] = useState(false)
  const [currentAlertStep, setCurrentAlertStep] = useState(0)
  const [particles, setParticles] = useState([])
  const [_isHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorTrail, setCursorTrail] = useState([])
  
  // Subscribe only to the specific parts we need for rendering
  const _showLoader = useMarketStore(state => state.globalConnectionState.showLoader)
  const _connectionStatus = useMarketStore(state => state.globalConnectionState.status)
  const _connectionAttempts = useMarketStore(state => state.globalConnectionState.connectionAttempts)
  const _dashboardConnections = useMarketStore(state => state.globalConnectionState.dashboardConnections)

  const { loadTabState } = useBaseMarketStore()

  useEffect(() => {
    // Only reset if we're dealing with a different user (or no user for public access)
    if (user?.id && connectionInitiated.current !== user.id) {
      connectionInitiated.current = user.id
      useMarketStore.getState().initiateGlobalConnection()
    } else if (!user && !connectionInitiated.current) {
      // For public access, initialize connection once
      connectionInitiated.current = 'public'
      useMarketStore.getState().initiateGlobalConnection()
    }
  }, [user])

  useEffect(() => {
    useBaseMarketStore.getState().fetchNews()
    const newsInterval = setInterval(() => {
      useBaseMarketStore.getState().fetchNews()
    }, 5 * 60 * 1000)
    return () => clearInterval(newsInterval)
  }, [])

  // Load user tab states on dashboard mount
  useEffect(() => {
    loadTabState().catch(error => {
      console.error('Failed to load tab states:', error);
    });
  }, [loadTabState]);

  // Alert Demo Animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAlertDemo(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showAlertDemo) {
      const stepTimer = setInterval(() => {
        setCurrentAlertStep(prev => (prev + 1) % 4)
      }, 3000)

      return () => clearInterval(stepTimer)
    }
  }, [showAlertDemo])

  // Particle System
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = []
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 4 + 1,
          color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
          opacity: Math.random() * 0.5 + 0.2
        })
      }
      setParticles(newParticles)
    }

    generateParticles()
  }, [])

  // Premium Cursor Trail Animation
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Add new trail point
      const newTrail = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      }
      
      setCursorTrail(prev => {
        const updated = [newTrail, ...prev].slice(0, 8) // Keep only 8 trail points
        return updated
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])


  // Load tab state in background (optional for public access)
  React.useEffect(() => {
    if (user) {
      loadTabState().catch(error => {
        console.error('Failed to load tab states:', error);
      });
    }
  }, [user, loadTabState]);


  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 py-16 overflow-hidden">
      {/* Extraordinary Particle System */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: `translate(${particle.vx}px, ${particle.vy}px)`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Premium Cursor Trail Animation */}
        {cursorTrail.map((point, index) => (
          <div
            key={point.id}
            className="absolute pointer-events-none"
            style={{
              left: point.x - 4,
              top: point.y - 4,
              width: 8 - index,
              height: 8 - index,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(16, 185, 129, ${0.8 - index * 0.1}) 0%, transparent 70%)`,
              animation: `trailFade ${1 + index * 0.2}s ease-out forwards`,
              zIndex: 1000 - index
            }}
          />
        ))}

        {/* Dynamic Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />

        {/* Premium Mouse Follower Effect */}
        <div
          className="absolute w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{
            left: mousePosition.x - 128,
            top: mousePosition.y - 128,
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
            transition: 'all 0.3s ease-out',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
        
        {/* Secondary Glow Effect */}
        <div
          className="absolute w-32 h-32 rounded-full opacity-30 pointer-events-none"
          style={{
            left: mousePosition.x - 64,
            top: mousePosition.y - 64,
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, transparent 70%)',
            transition: 'all 0.2s ease-out'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Extraordinary Header with 3D Effects */}
        <div className="text-center mb-16">
          <div className="relative">
            {/* 3D Floating Icons */}
            <div className="absolute -top-8 -left-8 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-2xl shadow-yellow-500/50">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-4 -right-12 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-ping">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-3 h-3 text-white" />
            </div>

          <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-2xl transform transition-all duration-500 hover:scale-105">
                  <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent animate-pulse">
                    RSI Correlation
                  </span>
                </h1>
                <p className="text-gray-300 text-lg font-light mt-2">Advanced market correlation analysis</p>
              </div>
            </div>
          </div>

          {/* Extraordinary Status Badge */}
          <div className="relative inline-block">
            <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full px-8 py-3 shadow-2xl shadow-emerald-500/30 backdrop-blur-sm transform transition-all duration-500 hover:scale-105">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
              <span className="text-emerald-300 text-lg font-semibold">Real-time Correlation Data</span>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-full blur-xl opacity-50"></div>
          </div>
        </div>

        {/* RSI Correlation Dashboard Section - Now at Top */}
        <div className="relative mb-16">
          <div className="max-w-6xl mx-auto">
            <RSICorrelationDashboard />
          </div>
        </div>

        {/* Extraordinary Interactive Market Experience - Now Below RSI */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 transform transition-all duration-500 hover:scale-105">
                <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent animate-pulse">
                  Real-time
                </span>
                <br />
                <span className="text-gray-300">Market Alerts</span>
              </h2>
              
              {/* Floating Action Icons */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-bounce shadow-2xl shadow-red-500/50">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center animate-ping">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Create custom alerts and receive <span className="text-green-400 font-bold animate-pulse">instant email notifications</span> when market conditions match your criteria
            </p>
          </div>

          {/* Alert Demo Animation */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Left Side - Alert Creation Demo */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Create Your Alert</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Alert Steps */}
                    <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-500 ${
                      currentAlertStep >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentAlertStep >= 0 ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {currentAlertStep >= 0 ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs text-gray-400">1</span>}
                      </div>
                      <span className="text-gray-300 text-sm">Select Currency Pair: EUR/USD</span>
                    </div>

                    <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-500 ${
                      currentAlertStep >= 1 ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentAlertStep >= 1 ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {currentAlertStep >= 1 ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs text-gray-400">2</span>}
                      </div>
                      <span className="text-gray-300 text-sm">Set RSI Threshold: Above 70</span>
                    </div>

                    <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-500 ${
                      currentAlertStep >= 2 ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentAlertStep >= 2 ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {currentAlertStep >= 2 ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs text-gray-400">3</span>}
                      </div>
                      <span className="text-gray-300 text-sm">Choose Notification: Email</span>
                    </div>

                    <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-500 ${
                      currentAlertStep >= 3 ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentAlertStep >= 3 ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {currentAlertStep >= 3 ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs text-gray-400">4</span>}
                      </div>
                      <span className="text-gray-300 text-sm">Alert Created Successfully!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Email Notification Demo */}
              <div className="relative">
                {/* Email Icon with Animation */}
                <div className="flex justify-center mb-6">
                  <div className={`w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
                    showAlertDemo ? 'animate-bounce shadow-green-500/50' : ''
                  }`}>
                    <Mail className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Email Notification Card */}
                <div className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 shadow-2xl transition-all duration-500 transform ${
                  showAlertDemo ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Market Alert Triggered!</h4>
                      <p className="text-gray-400 text-xs">EUR/USD RSI Alert</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Currency Pair:</span>
                      <span className="text-white font-semibold text-xs">EUR/USD</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Current RSI:</span>
                      <span className="text-red-400 font-bold text-xs">72.5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Threshold:</span>
                      <span className="text-white text-xs">Above 70</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Time:</span>
                      <span className="text-green-400 text-xs">Just Now</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-xs font-medium">
                      <Zap className="w-3 h-3 inline mr-1" />
                      Alert sent to your email instantly!
                    </p>
                  </div>
                </div>

                {/* Floating Notification Icons */}
                {showAlertDemo && (
                  <>
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full px-8 py-4">
                <Shield className="w-6 h-6 text-green-400" />
                <span className="text-green-300 font-semibold text-sm">Never Miss a Trading Opportunity</span>
                <ArrowRight className="w-5 h-5 text-green-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Custom CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes floatData {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
            25% { transform: translateY(-10px) translateX(5px) rotate(90deg); }
            50% { transform: translateY(-5px) translateX(-5px) rotate(180deg); }
            75% { transform: translateY(-15px) translateX(3px) rotate(270deg); }
          }
          
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); }
            25% { transform: translateY(-8px) translateX(3px) rotate(90deg) scale(1.05); }
            50% { transform: translateY(-4px) translateX(-3px) rotate(180deg) scale(0.95); }
            75% { transform: translateY(-12px) translateX(2px) rotate(270deg) scale(1.02); }
          }
          
          @keyframes drift {
            0%, 100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
            33% { transform: translateX(15px) translateY(-5px) rotate(120deg); }
            66% { transform: translateX(-10px) translateY(8px) rotate(240deg); }
          }
          
          @keyframes sway {
            0%, 100% { transform: translateX(0px) rotate(0deg); }
            50% { transform: translateX(20px) rotate(5deg); }
          }
          
          @keyframes bob {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-15px) scale(1.1); }
          }
          
          @keyframes glide {
            0%, 100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
            25% { transform: translateX(12px) translateY(-8px) rotate(90deg); }
            50% { transform: translateX(-8px) translateY(-12px) rotate(180deg); }
            75% { transform: translateX(-12px) translateY(8px) rotate(270deg); }
          }
          
          @keyframes hover {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-10px) scale(1.05); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          
          @keyframes wave {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-6px) rotate(2deg); }
            50% { transform: translateY(-12px) rotate(0deg); }
            75% { transform: translateY(-6px) rotate(-2deg); }
          }
          
          @keyframes glow {
            0% { opacity: 0.1; transform: scale(1); }
            100% { opacity: 0.3; transform: scale(1.1); }
          }
          
          @keyframes trailFade {
            0% { 
              opacity: 0.8; 
              transform: scale(1); 
            }
            100% { 
              opacity: 0; 
              transform: scale(0.3); 
            }
          }
          
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes ping {
            0% { transform: scale(1); opacity: 1; }
            75%, 100% { transform: scale(2); opacity: 0; }
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
          .animate-floatData {
            animation: floatData 5s ease-in-out infinite;
          }
          
          .animate-gridMove {
            animation: gridMove 20s linear infinite;
          }
        `
      }} />
    </section>
  )
}

export default TradingDashboardSection
