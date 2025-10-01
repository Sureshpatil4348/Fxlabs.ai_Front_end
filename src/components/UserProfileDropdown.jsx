import { Settings, LogOut } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import useMarketStore from '../store/useMarketStore'


const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const dropdownRef = useRef(null)
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      // Close all WebSocket connections before signing out
      const { disconnectAll } = useMarketStore.getState()
      if (disconnectAll) {
        disconnectAll()
      }
      
      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSettings = () => {
    setShowSettings(true)
    setIsOpen(false)
  }

  // Generate random avatar color based on user email
  const getAvatarColor = (email) => {
    const colors = [
      'bg-green-800', 'bg-green-700', 'bg-green-600', 'bg-green-500',
      'bg-green-400', 'bg-green-300', 'bg-green-200', 'bg-green-100'
    ]
    const index = email?.charCodeAt(0) % colors.length || 0
    return colors[index]
  }

  // Get user initials
  const getUserInitials = (email) => {
    if (!email) return 'U'
    const parts = email.split('@')[0]
    return parts.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 focus:ring-offset-gray-900' 
              : 'bg-gray-200 hover:bg-gray-300 focus:ring-offset-white'
          }`}
        >
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(user?.email)} flex items-center justify-center text-white font-semibold text-sm`}>
            {getUserInitials(user?.email)}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <button
              onClick={handleSettings}
              className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal - Rendered via Portal to avoid layout constraints */}
      {showSettings && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-8 max-w-md w-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-0">
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Account Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ×
              </button>
            </div>

            {/* Account Information */}
            <div className={`rounded-lg p-6 mb-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Email:</span>
                  <span className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Last Sign In:</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSettings(false)
                  navigate('/change-password')
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className={`flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 focus:ring-gray-400 focus:ring-offset-gray-800' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500 focus:ring-offset-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default UserProfileDropdown
