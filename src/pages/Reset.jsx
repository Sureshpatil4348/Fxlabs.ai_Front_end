import React, { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

const Reset = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  
  const { user } = useAuth()
  const navigate = useNavigate()

  // Handle URL parameters and authenticate user
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse both search parameters and hash fragment
        const searchParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1)) // Remove leading '#'
        
        // Merge parameters with hash taking precedence over search
        const urlParams = new URLSearchParams()
        
        // Add search parameters first
        for (const [key, value] of searchParams.entries()) {
          urlParams.set(key, value)
        }
        
        // Override with hash parameters (hash takes precedence)
        for (const [key, value] of hashParams.entries()) {
          urlParams.set(key, value)
        }
        
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        const type = urlParams.get('type')

        // Handle password recovery callback
        if (type === 'recovery') {
          // Attempt to obtain tokens (already parsed from both search and hash)
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (error) {
              // Surface provider error details if available
              const errorMessage = error.error_description || error.message || 'Invalid or expired reset link. Please request a new one.'
              setError(errorMessage)
              setIsProcessing(false)
              return
            }
            
            // Clean tokens from URL after successful authentication
            const cleanUrl = new URL(window.location.href)
            cleanUrl.searchParams.delete('access_token')
            cleanUrl.searchParams.delete('refresh_token')
            cleanUrl.searchParams.delete('type')
            cleanUrl.hash = ''
            window.history.replaceState({}, '', cleanUrl.toString())
            
            setIsAuthenticated(true)
            setSuccess('Reset link verified. You can now set your new password.')
          } else {
            setError('Invalid reset link. Please request a new password reset.')
            setIsProcessing(false)
            return
          }
        } else if (!type) {
          setError('Invalid link. Please use the password reset link from your email.')
          setIsProcessing(false)
          return
        }
      } catch (err) {
        setError('Failed to process reset link. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [])

  // If user is already logged in and not from reset flow, redirect
  // Guard against race conditions: only redirect when not processing and not in recovery flow
  if (user && !isAuthenticated && !isProcessing) {
    // Check if this is a recovery link to prevent premature redirect
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = searchParams.get('type') || hashParams.get('type')
    
    if (type !== 'recovery') {
      return <Navigate to="/dashboard" replace />
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password updated successfully! Signing you out...')
        
        // Sign out the user explicitly to clear the reset session
        await supabase.auth.signOut()
        
        // Redirect to home page after a brief delay
        setTimeout(() => {
          navigate('/')
        }, 1500)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while processing URL parameters
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated and no valid reset token
  if (!isAuthenticated && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
            <div className="mt-6">
              <Link
                to="/forgot"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          {success && (
            <div className="text-green-600 text-sm text-center">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Reset