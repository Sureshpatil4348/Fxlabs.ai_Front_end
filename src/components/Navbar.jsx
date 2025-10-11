import { LogIn, BarChart3, Cpu, Users, DollarSign, Menu, X } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    setIsMobileMenuOpen(false) // Close mobile menu after navigation
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }


  return (
    <>
      {/* Top spacing for content to scroll under navbar */}
      <div className="h-6 sm:h-8"></div>
      
      <header className="fixed top-4 left-4 right-4 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl shadow-black/10">
            <div className="px-4 sm:px-6 lg:px-8 relative">
              <div className="flex justify-between items-center h-[45px] sm:h-[55px] gap-4 sm:gap-6 lg:gap-8">
                {/* Logo Section - Raw Logo */}
                <div className="flex items-center">
                  <a 
                    href="/" 
                    className="group" 
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <img 
                      src={require('../assets/blacklogo.png')} 
                      alt="FXLabs Logo" 
                      className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 object-contain transition-all duration-300 group-hover:scale-105"
                    />
                  </a>
                </div>
            
                {/* Center Section - Navigation Links / Dashboard Tabs */}
                <div className="hidden lg:flex flex-1 justify-center items-center space-x-6 xl:space-x-8">
                  {/* Show landing links when NOT on dashboard */}
                  {!isOnDashboard && (
                    <>
                      {/* About Us */}
                      <button
                        onClick={() => scrollToSection('why-system-works')}
                        className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-3 py-2 rounded-lg hover:bg-white/50"
                      >
                        <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-sm">About Us</span>
                      </button>

                      {/* Technology */}
                      <button
                        onClick={() => scrollToSection('video-explanation')}
                        className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-3 py-2 rounded-lg hover:bg-white/50"
                      >
                        <Cpu className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-sm">Technology</span>
                      </button>

                      {/* Pricing */}
                      <button
                        onClick={() => scrollToSection('subscription')}
                        className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-3 py-2 rounded-lg hover:bg-white/50"
                      >
                        <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-sm">Pricing</span>
                      </button>

                      {/* Dashboard (for logged in users) */}
                      {user && (
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 group px-3 py-2 rounded-lg hover:bg-white/50"
                        >
                          <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium text-sm">Dashboard</span>
                        </Link>
                      )}
                    </>
                  )}

                  {/* Show Analysis/Tools tabs centered when ON dashboard */}
                  {isOnDashboard && (
                    <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full p-1 backdrop-blur-md shadow-sm">
                      <button
                        onClick={() => onChangeTab && onChangeTab('analysis')}
                        className={`px-5 py-1.5 rounded-full transition-all duration-200 ${
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
                        className={`px-5 py-1.5 rounded-full transition-all duration-200 ${
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
            
                {/* Right Section - Live Market & Controls */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  
                  {/* Market is Live Pill - Only show on landing page */}
                  {!isOnDashboard && (
                    <div className="hidden sm:flex items-center space-x-2">
                      <div className="flex items-center space-x-2 bg-green-100/80 text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-green-200/50 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-normal">Market is Live</span>
                      </div>
                    </div>
                  )}


                  {/* Desktop User Section - Hidden on mobile */}
                  <div className="hidden lg:flex items-center">
                    {user ? (
                      <div className="flex items-center space-x-2">
                        {/* Account Button */}
                        <UserProfileDropdown />
                      </div>
                      ) : (
                        <button
                          onClick={handleLoginClick}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 text-sm sm:text-base backdrop-blur-sm"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Login</span>
                        </button>
                      )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={toggleMobileMenu}
                    className="lg:hidden p-2 rounded-xl bg-white/50 hover:bg-white/70 text-gray-700 transition-all duration-300 border border-white/20 backdrop-blur-sm"
                    aria-label="Toggle mobile menu"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute right-0 mt-2 w-[280px] sm:w-[320px] bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl shadow-black/10">
              <div className="px-6 py-6">
                {/* Simple Menu List */}
                <div className="space-y-3">
                  {/* Show Analysis/Tools tabs when ON dashboard */}
                  {isOnDashboard && (
                    <div className="space-y-2 mb-3">
                      <button
                        onClick={() => {
                          onChangeTab && onChangeTab('analysis')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full px-5 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === 'analysis'
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white shadow-md'
                            : 'text-emerald-800 bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                        style={{ WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}
                      >
                        Analysis
                      </button>
                      <button
                        onClick={() => {
                          onChangeTab && onChangeTab('tools')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full px-5 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === 'tools'
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white shadow-md'
                            : 'text-emerald-800 bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                        style={{ WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}
                      >
                        Tools
                      </button>
                    </div>
                  )}

                  {!isOnDashboard && (
                    <>
                      <button
                        onClick={() => scrollToSection('why-system-works')}
                        className="flex items-center space-x-3 w-full text-left text-gray-700 hover:text-emerald-600 transition-all duration-300 py-3 px-4 rounded-xl hover:bg-white/50"
                      >
                        <Users className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">About Us</span>
                      </button>

                      <button
                        onClick={() => scrollToSection('video-explanation')}
                        className="flex items-center space-x-3 w-full text-left text-gray-700 hover:text-emerald-600 transition-all duration-300 py-3 px-4 rounded-xl hover:bg-white/50"
                      >
                        <Cpu className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">Technology</span>
                      </button>

                      <button
                        onClick={() => scrollToSection('subscription')}
                        className="flex items-center space-x-3 w-full text-left text-gray-700 hover:text-emerald-600 transition-all duration-300 py-3 px-4 rounded-xl hover:bg-white/50"
                      >
                        <DollarSign className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">Pricing</span>
                      </button>
                    </>
                  )}

                  {user && !isOnDashboard && (
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-3 w-full text-left text-gray-700 hover:text-emerald-600 transition-all duration-300 py-3 px-4 rounded-xl hover:bg-white/50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BarChart3 className="w-6 h-6 flex-shrink-0" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  )}

                  {/* Profile Section */}
                  <div className="pt-3 border-t border-gray-200/50">
                    {user ? (
                      <div className="flex justify-center">
                        <UserProfileDropdown />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          handleLoginClick()
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center space-x-3 w-full text-left text-gray-700 hover:text-emerald-600 transition-all duration-300 py-3 px-4 rounded-xl hover:bg-white/50 text-sm sm:text-base"
                      >
                        <LogIn className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">Login</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
