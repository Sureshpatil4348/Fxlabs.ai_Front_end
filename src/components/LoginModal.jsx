import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabaseClient'

const LoginModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()

  // Close modal if user is already logged in
  React.useEffect(() => {
    if (user && isOpen) {
      onClose()
    }
  }, [user, isOpen, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Login successful! Redirecting...')
        setTimeout(() => {
          onClose()
          navigate('/dashboard')
        }, 1000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container - Proper sizing without height restriction */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700/50' 
          : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200/50'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 transition-colors z-20 p-1 rounded-full ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className={`px-8 pt-8 pb-6 text-center border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome Back
          </h2>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Sign in to your trading dashboard
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  id="email"
                  type="email"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-400' 
                      : 'bg-white/80 border border-gray-300/50 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-400' 
                      : 'bg-white/80 border border-gray-300/50 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className={`text-sm text-center rounded-lg py-2 px-3 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
                  : 'text-red-600 bg-red-50 border border-red-200'
              }`}>
                {error}
              </div>
            )}
            
            {success && (
              <div className={`text-sm text-center rounded-lg py-2 px-3 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                  : 'text-green-600 bg-green-50 border border-green-200'
              }`}>
                {success}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-green-500/25"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement forgot password functionality
                }}
                className={`text-sm transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-green-400' 
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default LoginModal