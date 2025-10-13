import React, { useState } from 'react'

import mainLogo from '../assets/main.png'
import { supabase } from '../lib/supabaseClient'

const ChangePassword = () => {
  const [step, setStep] = useState(1) // 1: new password, 2: OTP
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleStep1 = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password should be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Reauthenticate to trigger OTP
      const { error } = await supabase.auth.reauthenticate()
      
      if (error) {
        setError(error.message)
      } else {
        setStep(2)
        setSuccess('OTP sent to your email. Please check your inbox.')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 2: Update password with OTP
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword,
        nonce: otpCode 
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password updated successfully! Redirecting to home...')
        window.location.href = '/'
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setOtpCode('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen flex items-center flex-col justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center mb-8">
        <img src={mainLogo} alt="FxLabs Prime" className="h-16 w-auto" />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#19235d]">
            Change Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1 ? 'Enter your new password' : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>
        
        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleStep1}>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="sr-only">
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#19235d] focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#19235d] focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP to email'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleStep2}>
            {/* Show password fields as read-only for verification */}
            <div className="space-y-4 opacity-60">
              <div>
                <label htmlFor="newPasswordReadonly" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (set in previous step)
                </label>
                <input
                  id="newPasswordReadonly"
                  type="password"
                  disabled
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-[#19235d] sm:text-sm cursor-not-allowed"
                  value={newPassword}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="confirmPasswordReadonly" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password (set in previous step)
                </label>
                <input
                  id="confirmPasswordReadonly"
                  type="password"
                  disabled
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-[#19235d] sm:text-sm cursor-not-allowed"
                  value={confirmPassword}
                  readOnly
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter 6-digit OTP Code
              </label>
              <input
                id="otpCode"
                name="otpCode"
                type="text"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#19235d] focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            
            {success && (
              <div className="text-green-600 text-sm text-center">{success}</div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
              
              <button
                type="button"
                onClick={handleBackToStep1}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ChangePassword
