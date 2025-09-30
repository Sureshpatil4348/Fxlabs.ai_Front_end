import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'
import Orb from '../components/ui/Orb'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabaseClient'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

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
        setSuccess('Login successful! Redirecting to dashboard...')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative min-h-screen flex items-center flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Orb background - pointer-events-none is handled by the Orb component itself */}
      <div className="absolute inset-0 z-0">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={100}
          forceHoverState={false}
        />
      </div>
      
      {/* Content with proper z-index to be above Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">
          <span className="text-green-600">FX</span>
          <span className={`font-light transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-500'
          }`}>LABS</span>
        </div>
        <div className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>Decode the Market</div>
      </div>
      
      {/* Form content with proper z-index */}
      <div className="relative z-10 max-w-md w-full space-y-8">
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Sign in to your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 placeholder-gray-400 text-white bg-gray-800' 
                    : 'border-gray-300 placeholder-gray-500 text-gray-900 bg-white'
                }`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 placeholder-gray-400 text-white bg-gray-800' 
                    : 'border-gray-300 placeholder-gray-500 text-gray-900 bg-white'
                }`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className={`text-sm text-center transition-colors duration-300 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>{error}</div>
          )}
          
          {success && (
            <div className={`text-sm text-center transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>{success}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Forgot password link outside form with proper z-index */}
        <div className="text-center">
          <Link
            to="/forgot"
            className={`font-medium text-sm transition-colors cursor-pointer relative z-10 inline-block px-4 py-2 ${
              isDarkMode 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-green-600 hover:text-green-500'
            }`}
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
