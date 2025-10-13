import { 
  Mail, 
  MapPin, 
  Clock,
  Send
} from 'lucide-react'
import React, { useState } from 'react'

import { useTheme } from '../contexts/ThemeContext'

const GetInTouchSection = () => {
  const { isDarkMode } = useTheme()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    // TODO: Implement form submission logic
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })
  }

  return (
    <section className="relative py-24">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#03c05d] mb-6 font-poppins">
            Get in Touch
          </h2>
          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Our team of experts is ready to answer your questions and help you discover how FxLabs Prime can transform your trading.
          </p>
        </div>

        {/* Contact Form and Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Contact Form */}
          <div className={`${isDarkMode ? 'bg-[#19235d]' : 'bg-white'} rounded-2xl p-8 shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Full Name */}
              <div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c05d] focus:border-transparent transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-[#19235d] placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              {/* Email Address */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your email address"
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c05d] focus:border-transparent transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-[#19235d] placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c05d] focus:border-transparent transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-[#19235d] placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Subject */}
              <div>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="How can we help?"
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c05d] focus:border-transparent transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-[#19235d] placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please provide details about your inquiry..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03c05d] focus:border-transparent transition-all duration-300 resize-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-[#19235d] placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              {/* Send Message Button */}
              <button
                type="submit"
                className="w-full bg-[#03c05d] hover:bg-[#02a04a] text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className={`${isDarkMode ? 'bg-[#19235d]' : 'bg-white'} rounded-2xl p-8 shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-2xl font-bold mb-8 font-poppins ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
              Contact Information
            </h3>
            
            <div className="space-y-8">
              

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#03c05d] rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>Email</h4>
                  <div className="space-y-1">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>info@fxlabsprime.com</p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>support@fxlabsprime.com</p>
                  </div>
                </div>
              </div>

              {/* Office Location */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#03c05d] rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>Office Location</h4>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    253, SMT Rukkavva Junnur, Mudhol - 587313 Karnataka, India
                  </p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#03c05d] rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>Business Hours</h4>
                  <div className="space-y-1">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Monday - Friday: 9:00 AM - 7:00 PM EST</p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default GetInTouchSection
