import { Home, LogIn, User, BarChart3, TrendingUp, Users, Target, Zap, HelpCircle, Gift } from 'lucide-react'
import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import UserProfileDropdown from './UserProfileDropdown'
import { useAuth } from '../auth/AuthProvider'

const Navbar = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleDashboardClick = () => {
    navigate('/dashboard')
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  // Check if we're on the dashboard page
  const isDashboard = location.pathname === '/dashboard'
  
  const navbarLinks = [
    { id: 'hero', label: 'Home', icon: Home },
    { id: 'trading-charts', label: 'Trading Charts', icon: BarChart3 },
    { id: 'subscription', label: 'Pricing', icon: Gift },
    { id: 'features', label: 'Features', icon: TrendingUp },
    { id: 'faq', label: 'FAQ', icon: HelpCircle }
  ]

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-600/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <div className="text-green-400 font-bold text-xl leading-none group-hover:text-green-300 transition-colors duration-300">
                  FX<span className="text-gray-300 font-normal">LABS</span>
                </div>
                <div className="text-gray-400 text-xs leading-none">Decode the Market</div>
              </div>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6">
            {!isDashboard ? (
              // Show all navigation links on home page
              <>
                {navbarLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-300 group"
                  >
                    <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-sm">{link.label}</span>
                  </button>
                ))}
                
                {user && (
                  <button
                    onClick={handleDashboardClick}
                    className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-300 group ml-4 pl-4 border-l border-gray-600"
                  >
                    <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-sm">Dashboard</span>
                  </button>
                )}
              </>
            ) : (
              // Show only Home and Dashboard links on dashboard page
              <>
                <Link 
                  to="/" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-300 group"
                >
                  <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium text-sm">Home</span>
                </Link>
                
                <div className="flex items-center space-x-2 text-green-400 ml-4 pl-4 border-l border-gray-600">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium text-sm">Dashboard</span>
                </div>
              </>
            )}
          </nav>
          
          {/* Right Section - Login/User */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <UserProfileDropdown />
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
