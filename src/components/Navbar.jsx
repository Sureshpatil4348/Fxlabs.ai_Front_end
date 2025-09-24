import { LogIn, BarChart3, Sun, Moon, Cpu, Users, DollarSign, Menu, X } from 'lucide-react'
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import LoginModal from './LoginModal'
import UserProfileDropdown from './UserProfileDropdown'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../contexts/ThemeContext'

const Navbar = () => {
  const { user } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
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
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section - Raw Logo */}
            <div className="flex items-center -ml-2 sm:-ml-4 md:-ml-6 lg:-ml-8 xl:-ml-10 2xl:-ml-12">
              <a 
                href="/" 
                className="group" 
                onClick={() => window.scrollTo(0, 0)}
              >
                <img 
                  src={require('../assets/logo1.png')} 
                  alt="FXLabs Logo" 
                  className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-48 lg:h-48 object-contain transition-all duration-300 group-hover:scale-105 ${
                    isDarkMode 
                      ? 'filter brightness-110 contrast-110' 
                      : 'filter brightness-0 contrast-100'
                  }`}
                />
              </a>
            </div>
            
            {/* Center Section - Navigation Links */}
            <div className="hidden lg:flex flex-1 justify-center items-center space-x-8">
              {/* Only show these navigation items when NOT on dashboard */}
              {!isOnDashboard && (
                <>
                  {/* Technology */}
                  <button
                    onClick={() => scrollToSection('trading-dashboard')}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 group"
                  >
                    <Cpu className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-sm">Technology</span>
                  </button>

                  {/* About Us */}
                  <button
                    onClick={() => scrollToSection('video-explanation')}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 group"
                  >
                    <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-sm">About Us</span>
                  </button>

                  {/* Pricing */}
                  <button
                    onClick={() => scrollToSection('subscription')}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 group"
                  >
                    <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-sm">Pricing</span>
                  </button>
                </>
              )}

              {/* Dashboard (for logged in users) - only show when NOT on dashboard */}
              {user && !isOnDashboard && (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 group"
                >
                  <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium text-sm">Dashboard</span>
                </Link>
              )}
            </div>
            
            {/* Right Section - Live Market & Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4 -mr-2 sm:-mr-4 md:-mr-6 lg:-mr-8 xl:-mr-10 2xl:-mr-12 mr-2">
              
              {/* Market is Live Pill - Only show on landing page */}
              {!isOnDashboard && (
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="flex items-center space-x-2 bg-green-100 dark:bg-slate-800 text-green-800 dark:text-green-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-green-200 dark:border-green-700">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-normal">Market is Live</span>
                  </div>
                </div>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/70 dark:hover:bg-gray-600/70 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 border border-gray-300/30 dark:border-gray-600/30"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

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
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 text-sm sm:text-base"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </button>
                  )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 mr-2 sm:mr-4 rounded-lg bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/70 dark:hover:bg-gray-600/70 text-gray-700 dark:text-gray-300 transition-all duration-300"
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

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="px-6 py-4">
              {/* Simple Menu List */}
              <div className="space-y-3">
                {!isOnDashboard && (
                  <>
                    <button
                      onClick={() => scrollToSection('trading-dashboard')}
                      className="flex items-center space-x-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 py-2"
                    >
                      <Cpu className="w-5 h-5" />
                      <span className="font-medium">Technology</span>
                    </button>

                    <button
                      onClick={() => scrollToSection('video-explanation')}
                      className="flex items-center space-x-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 py-2"
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-medium">About Us</span>
                    </button>

                    <button
                      onClick={() => scrollToSection('subscription')}
                      className="flex items-center space-x-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 py-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="font-medium">Pricing</span>
                    </button>
                  </>
                )}

                {user && !isOnDashboard && (
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                )}

                {/* Profile Section */}
                <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
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
                      className="flex items-center space-x-3 w-full text-left text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 py-2 text-sm sm:text-base"
                    >
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium">Login</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
