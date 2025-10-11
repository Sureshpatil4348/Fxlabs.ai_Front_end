import { Mail, MapPin, Hexagon, Twitter, Instagram, Linkedin, Youtube, MessageCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { useTheme } from '../contexts/ThemeContext'
import { formatPrice } from '../utils/formatters'

const InteractiveFooter = () => {
  const { isDarkMode } = useTheme()
  const [loading, setLoading] = useState(true)
  const [forexData, setForexData] = useState({
    EURUSD: { ask: 1.0850, bid: 1.0848, spread: 0.0002 },
    GBPUSD: { ask: 1.2650, bid: 1.2648, spread: 0.0002 },
    USDJPY: { ask: 149.25, bid: 149.23, spread: 0.02 },
    USDCHF: { ask: 0.8750, bid: 0.8748, spread: 0.0002 },
    XAUUSD: { ask: 2025.50, bid: 2025.30, spread: 0.20 }
  })
  
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Simulate loading and data updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    // Simulate real-time updates
    const updateInterval = setInterval(() => {
      setForexData(prev => ({
        EURUSD: { 
          ask: prev.EURUSD.ask + (Math.random() - 0.5) * 0.0001, 
          bid: prev.EURUSD.bid + (Math.random() - 0.5) * 0.0001, 
          spread: 0.0002 
        },
        GBPUSD: { 
          ask: prev.GBPUSD.ask + (Math.random() - 0.5) * 0.0001, 
          bid: prev.GBPUSD.bid + (Math.random() - 0.5) * 0.0001, 
          spread: 0.0002 
        },
        USDJPY: { 
          ask: prev.USDJPY.ask + (Math.random() - 0.5) * 0.01, 
          bid: prev.USDJPY.bid + (Math.random() - 0.5) * 0.01, 
          spread: 0.02 
        },
        USDCHF: { 
          ask: prev.USDCHF.ask + (Math.random() - 0.5) * 0.0001, 
          bid: prev.USDCHF.bid + (Math.random() - 0.5) * 0.0001, 
          spread: 0.0002 
        },
        XAUUSD: { 
          ask: prev.XAUUSD.ask + (Math.random() - 0.5) * 0.1, 
          bid: prev.XAUUSD.bid + (Math.random() - 0.5) * 0.1, 
          spread: 0.20 
        }
      }))
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearInterval(updateInterval)
    }
  }, [])
  
  return (
    <footer className={`relative py-8 sm:py-12 w-full ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        
        {/* Forex Ticker Tape */}
        <div className="ticker-tape border-y border-gray-200 dark:border-gray-700 py-2 md:py-3 overflow-hidden w-full transition-colors duration-300 mb-8">
          <div className="ticker-content flex items-center animate-scroll">
            {/* First Set */}
            {/* EUR/USD */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="EURUSD">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-800 dark:text-blue-300 transition-colors duration-300">€</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">EUR/USD</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.EURUSD?.ask || 0, 4)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.EURUSD?.bid || 0, 4)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.EURUSD?.spread || 0, 4)}
                </span>
              </div>
            </div>
            {/* GBP/USD */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="GBPUSD">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-800 dark:text-red-300 transition-colors duration-300">£</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">GBP/USD</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.GBPUSD?.ask || 0, 4)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.GBPUSD?.bid || 0, 4)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.GBPUSD?.spread || 0, 4)}
                </span>
              </div>
            </div>
            {/* USD/JPY */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="USDJPY">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-800 dark:text-green-300 transition-colors duration-300">¥</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">USD/JPY</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.00' : formatPrice(forexData.USDJPY?.ask || 0, 2)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.00' : formatPrice(forexData.USDJPY?.bid || 0, 2)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.USDJPY?.spread || 0, 2)}
                </span>
              </div>
            </div>
            {/* USD/CHF */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="USDCHF">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-800 dark:text-purple-300 transition-colors duration-300">₣</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">USD/CHF</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.USDCHF?.ask || 0, 4)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.USDCHF?.bid || 0, 4)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.USDCHF?.spread || 0, 4)}
                </span>
              </div>
            </div>
            {/* XAU/USD */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="XAUUSD">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-xs font-bold text-yellow-800 dark:text-yellow-300 transition-colors duration-300">Au</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">XAU/USD</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.XAUUSD?.ask || 0, 2)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.XAUUSD?.bid || 0, 2)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.XAUUSD?.spread || 0, 2)}
                </span>
              </div>
            </div>
            
            {/* Duplicate Set for Seamless Loop */}
            {/* EUR/USD */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="EURUSD">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-800 dark:text-blue-300 transition-colors duration-300">€</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">EUR/USD</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.EURUSD?.ask || 0, 4)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.EURUSD?.bid || 0, 4)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.EURUSD?.spread || 0, 4)}
                </span>
              </div>
            </div>
            {/* GBP/USD */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="GBPUSD">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-800 dark:text-red-300 transition-colors duration-300">£</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">GBP/USD</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.GBPUSD?.ask || 0, 4)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.GBPUSD?.bid || 0, 4)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.GBPUSD?.spread || 0, 4)}
                </span>
              </div>
            </div>
            {/* USD/JPY */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="USDJPY">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-800 dark:text-green-300 transition-colors duration-300">¥</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">USD/JPY</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.00' : formatPrice(forexData.USDJPY?.ask || 0, 2)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.00' : formatPrice(forexData.USDJPY?.bid || 0, 2)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.USDJPY?.spread || 0, 2)}
                </span>
              </div>
            </div>
            {/* USD/CHF */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="USDCHF">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-800 dark:text-purple-300 transition-colors duration-300">₣</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">USD/CHF</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.USDCHF?.ask || 0, 4)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.USDCHF?.bid || 0, 4)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.USDCHF?.spread || 0, 4)}
                </span>
              </div>
            </div>
            {/* XAU/USD */}
            <div className="ticker-item flex items-center mx-2 md:mx-6" data-pair="XAUUSD">
              <div className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-xs font-bold text-yellow-800 dark:text-yellow-300 transition-colors duration-300">Au</div>
              <div className="flex items-center text-sm md:text-base">
                <span className="font-semibold mr-1 md:mr-2 text-gray-900 dark:text-white transition-colors duration-300">XAU/USD</span>
                <span className="ask-value text-green-600 dark:text-green-400 transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.XAUUSD?.ask || 0, 2)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1 md:mx-2 bid-value transition-colors duration-300">
                  {loading ? '0.0000' : formatPrice(forexData.XAUUSD?.bid || 0, 2)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 spread-value hidden sm:inline transition-colors duration-300">
                  {loading ? '0.0' : formatPrice(forexData.XAUUSD?.spread || 0, 2)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
          
          {/* FxLabs Prime Column */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              FxLabs Prime
            </h3>
            <p className={`text-sm leading-relaxed max-w-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Empowering traders with cutting-edge AI technology for smarter market decisions.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex items-center flex-wrap gap-3 pt-2">
              <a 
                href="https://x.com/fxlabs_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-black text-gray-300 hover:text-white' 
                    : 'bg-gray-100 hover:bg-black text-gray-600 hover:text-white'
                }`}
                aria-label="X (Twitter)"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://www.instagram.com/thesureshpatil/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-pink-600 text-gray-300 hover:text-white' 
                    : 'bg-gray-100 hover:bg-pink-600 text-gray-600 hover:text-white'
                }`}
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://www.linkedin.com/company/fxlabs-ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-blue-700 text-gray-300 hover:text-white' 
                    : 'bg-gray-100 hover:bg-blue-700 text-gray-600 hover:text-white'
                }`}
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="https://www.youtube.com/@fx-labs" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white' 
                    : 'bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white'
                }`}
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a 
                href="https://t.me/fxlabsprime" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-blue-500 text-gray-300 hover:text-white' 
                    : 'bg-gray-100 hover:bg-blue-500 text-gray-600 hover:text-white'
                }`}
                aria-label="Telegram"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links and Legal - Side by Side on Mobile */}
          <div className="grid grid-cols-2 gap-6 sm:col-span-1 lg:col-span-2">
            {/* Quick Links Column */}
            <div className="space-y-4">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/" 
                    className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('subscription')}
                    className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('video-explanation')}
                    className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    About
                  </button>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className={`transition-colors duration-200 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="space-y-4">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Legal
              </h3>
              <ul className="space-y-3">
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
          </div>

          {/* Contact Us Column */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Contact Us
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  support@fxlabsprime.com
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <MessageCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <a 
                  href="https://t.me/fxlabsprime" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  t.me/fxlabsprime
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  253,Junnur, Mudhol - 587313 Karnataka, India
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Divider Line */}
        <div className={`border-t mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>

        {/* Copyright Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className={`text-sm text-center sm:text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            © 2025 FxLabs Prime. All rights reserved.
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
