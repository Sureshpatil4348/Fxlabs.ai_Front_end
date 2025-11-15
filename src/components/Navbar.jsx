import { LogIn, BarChart3, Cpu, Users, DollarSign } from 'lucide-react'
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import LoginModal from './LoginModal'
import UserProfileDropdown from './UserProfileDropdown'
import { useAuth } from '../auth/AuthProvider'

const Navbar = ({ activeTab, onChangeTab }) => {
  const { user } = useAuth()
  const location = useLocation()
  const isOnDashboard = location.pathname === '/dashboard'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [_liveMarketData, _setLiveMarketData] = useState({
    eurUsd: { price: '1.0850', change: '+0.12%', trend: 'up' },
    gbpUsd: { price: '1.2650', change: '-0.08%', trend: 'down' },
    usdJpy: { price: '149.25', change: '+0.15%', trend: 'up' }
  })

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }


  return (
    <>
      {/* Top spacing for content to scroll under navbar */}
      <div className="h-6 sm:h-8"></div>
      
      <header className={`fixed z-50 transition-all duration-300 ${isOnDashboard ? 'top-4 left-0 right-0' : 'top-4 left-4 right-4'}`}>
        <div className={isOnDashboard ? 'px-2 sm:px-3' : 'max-w-7xl mx-auto'}>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl shadow-black/10">
            <div className="px-4 sm:px-6 lg:px-8 relative">
              <div className="flex justify-between items-center h-[45px] sm:h-[55px] gap-2 sm:gap-4 lg:gap-8">
                {/* Logo Section - Raw Logo */}
                <div className="flex items-center flex-shrink-0">
                  <a 
                    href="/" 
                    className="group" 
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <img 
                      src={require('../assets/blacklogo.png')} 
                      alt="FxLabs Prime Logo" 
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain transition-all duration-300 group-hover:scale-105"
                    />
                  </a>
                  <span
                    className="ml-2 sm:ml-3 text-base sm:text-base md:text-xl text-emerald-700"
                    style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive', transform: 'translateY(6px)' }}
                  >
                    by Hextech 
                  </span>
                </div>
                {/* Center Section - Navigation Links / Dashboard Tabs */}
                <div className="flex flex-1 justify-center items-center">
                  {/* Show landing links when NOT on dashboard - All screen sizes */}
                  {!isOnDashboard && (
                    <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 xl:space-x-8">
                      {/* About Us */}
                      <button
                        onClick={() => scrollToSection('why-system-works')}
                        className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-2 sm:px-3 py-2 rounded-lg hover:bg-white/50"
                        title="About Us"
                      >
                        <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-xs sm:text-sm hidden sm:inline">About Us</span>
                      </button>

                      {/* Technology */}
                      <button
                        onClick={() => scrollToSection('video-explanation')}
                        className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-2 sm:px-3 py-2 rounded-lg hover:bg-white/50"
                        title="Technology"
                      >
                        <Cpu className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-xs sm:text-sm hidden sm:inline">Technology</span>
                      </button>

                      {/* Pricing */}
                      <button
                        onClick={() => scrollToSection('subscription')}
                        className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-2 sm:px-3 py-2 rounded-lg hover:bg-white/50"
                        title="Pricing"
                      >
                        <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-xs sm:text-sm hidden sm:inline">Pricing</span>
                      </button>

                      {/* Dashboard (for logged in users) */}
                      {user && (
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-2 sm:px-3 py-2 rounded-lg hover:bg-white/50"
                          title="Dashboard"
                        >
                          <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium text-xs sm:text-sm hidden sm:inline">Dashboard</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Show Analysis/Tools tabs centered when ON dashboard - Now visible on all screen sizes */}
                  {isOnDashboard && (
                    <div className="flex items-center gap-1 sm:gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full p-0.5 sm:p-1 backdrop-blur-md shadow-sm">
                      <button
                        onClick={() => onChangeTab && onChangeTab('analysis')}
                        className={`px-3 sm:px-5 py-1.5 sm:py-1.5 rounded-full transition-all duration-200 text-sm sm:text-base ${
                          activeTab === 'analysis'
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white shadow-md'
                            : 'text-emerald-800 hover:bg-emerald-500/20'
                        }`}
                        style={{ WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}
                      >
                        Analysis
                      </button>
                      <button
                        onClick={() => onChangeTab && onChangeTab('tools')}
                        className={`px-3 sm:px-5 py-1.5 sm:py-1.5 rounded-full transition-all duration-200 text-sm sm:text-base ${
                          activeTab === 'tools'
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white shadow-md'
                            : 'text-emerald-800 hover:bg-emerald-500/20'
                        }`}
                        style={{ WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}
                      >
                        Tools
                      </button>
                    </div>
                  )}
                </div>
            
                {/* Right Section - Account & Login */}
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  {/* Market is Live component removed */}

                  {/* User Section - Now visible on all screen sizes */}
                  <div className="flex items-center">
                    {user ? (
                      <UserProfileDropdown />
                    ) : (
                      <button
                        onClick={handleLoginClick}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm lg:text-base backdrop-blur-sm"
                      >
                        <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Login</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  )
}

export default Navbar
