import { Mail, Phone, MapPin, Hexagon } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

import { useTheme } from '../contexts/ThemeContext'

const InteractiveFooter = () => {
  const { isDarkMode } = useTheme()
  
  return (
    <footer className={`relative py-16 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Pinaxa Labs Column */}
          <div className="space-y-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              FX Labs
            </h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Empowering traders with cutting-edge AI technology for smarter market decisions.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/technology" 
                  className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Technology
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacy-policy" 
                  className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/refund-policy" 
                  className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div className="space-y-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Contact Us
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Mail className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  support@Pinaxalabs.com
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  +91 6361156726
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  253, SMT Rukkavva Junnur, Mudhol - 587313 Karnataka, India
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Divider Line */}
        <div className={`border-t mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>

        {/* Copyright Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className={`text-sm text-center md:text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            © 2025 FX Labs. All rights reserved.
          </div>
          
          {/* Geometric Icon */}
          <div className="flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-300'
            }`}>
              <Hexagon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default InteractiveFooter
