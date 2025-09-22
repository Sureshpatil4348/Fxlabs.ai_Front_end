import { LogIn, BarChart3 } from 'lucide-react'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

import UserProfileDropdown from './UserProfileDropdown'
import { useAuth } from '../auth/AuthProvider'

const Navbar = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLoginClick = () => {
    navigate('/login')
  }


  return (
    <>
      <header className="bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-600/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section - Raw Logo */}
            <div className="flex items-center -ml-10 sm:-ml-16 lg:-ml-28 xl:-ml-36 2xl:-ml-36">
              <Link to="/" className="group">
                <img 
                  src={require('../assets/logo1.png')} 
                  alt="FXLabs Logo" 
                  className="w-48 h-48 object-contain filter brightness-110 contrast-110 transition-all duration-300 group-hover:scale-105"
                />
              </Link>
            </div>
            
            {/* Center Section - Dashboard */}
            <div className="flex-1 flex justify-center">
              {user && (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-300 group"
                >
                  <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium text-base">Dashboard</span>
                </Link>
              )}
            </div>
            
            {/* Right Section - Subtle Extreme Right - Account */}
            <div className="flex items-center space-x-4 -mr-8 sm:-mr-16 lg:-mr-20 xl:-mr-28 2xl:-mr-36">
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Account Button */}
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
    </>
  )
}

export default Navbar
