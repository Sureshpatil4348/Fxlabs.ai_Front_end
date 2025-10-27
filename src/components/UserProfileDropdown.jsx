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


  // Get user initials
  const getUserInitials = (email) => {
    if (!email) return 'U'
    const parts = email.split('@')[0]
    return parts.substring(0, 2).toUpperCase()
  }

  // Connection status for showing connecting animation on avatar
  const connectionStatus = useMarketStore(state => state.globalConnectionState.status)
  const isConnecting = connectionStatus === 'CONNECTING' || connectionStatus === 'RETRYING'

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#19235d] hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
          aria-label="Account menu"
        >
          {/* Spinning ring when connecting */}
          {isConnecting && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-full border-2 border-emerald-500/70 border-t-transparent animate-spin"
            />
          )}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg border-2 border-white/20">
            {getUserInitials(user?.email)}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-1 z-50 transition-all duration-300 bg-white/95 dark:bg-[#19235d]/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50">
            <button
              onClick={handleSettings}
              className="flex items-center w-full px-4 py-3 text-sm transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg mx-1"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-lg mx-1"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal - Rendered via Portal to avoid layout constraints */}
      {showSettings && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl p-8 max-w-md w-full transition-all duration-300 bg-white/95 dark:bg-[#19235d]/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-0">
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#19235d]'
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
            <div className="rounded-xl p-6 mb-6 transition-all duration-300 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/50">
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#19235d]'
              }`}>Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Email:</span>
                  <span className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-[#19235d]'
                  }`}>{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Last Sign In:</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-[#19235d]'
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
                    ? 'bg-[#19235d] text-gray-200 hover:bg-[#19235d] focus:ring-gray-400 focus:ring-offset-[#19235d]' 
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
