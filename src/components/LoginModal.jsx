import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'

import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

const LoginModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const { user } = useAuth()

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container - Proper sizing without height restriction */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20 p-1 rounded-full hover:bg-gray-700/50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-gray-700/50">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm">
            Sign in to your trading dashboard
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg py-2 px-3">
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
                className="text-sm text-gray-400 hover:text-green-400 transition-colors"
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