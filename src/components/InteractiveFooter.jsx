import { 
  TrendingUp, 
  Mail, 
  Phone, 
  MapPin,
  Twitter,
  Linkedin,
  Youtube,
  ArrowRight,
  CheckCircle,
  Shield,
  Users,
  BarChart3,
  Zap,
  Send,
  Star,
  Award,
  Heart
} from 'lucide-react'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const InteractiveFooter = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail('')
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  const footerLinks = {
    product: [
      { name: 'Trading Dashboard', href: '/dashboard' },
      { name: 'RSI Analysis', href: '/features' },
      { name: 'AI News Analysis', href: '/features' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' }
    ]
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-700' },
    { name: 'YouTube', icon: Youtube, href: '#', color: 'hover:text-red-600' }
  ]

  const features = [
    { icon: BarChart3, text: 'Advanced Analytics', color: 'text-green-400' },
    { icon: Zap, text: 'Real-time Alerts', color: 'text-blue-400' }
  ]

  return (
    <footer className="relative text-gray-800 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center animate-ping">
          <Star className="w-3 h-3 text-blue-400" />
        </div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            
            {/* Company Info */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-poppins">FX<span className="text-gray-600 dark:text-gray-400">LABS</span></div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Decode the Market</div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Advanced forex analysis platform with AI-powered insights, real-time RSI analysis, and professional trading tools for serious traders.
              </p>

              {/* Key Features */}
              <div className="space-y-2 sm:space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <feature.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${feature.color}`} />
                    <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs sm:text-sm">support@fxlabs.ai</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs sm:text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs sm:text-sm">New York, NY</span>
                </div>
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-3 grid grid-cols-2 gap-6 sm:gap-8">
              {/* Product Links */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6 font-poppins">Product</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {footerLinks.product.map((link, index) => (
                    <li key={index}>
                      <Link 
                        to={link.href}
                        className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 text-xs sm:text-sm flex items-center group"
                      >
                        <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6 font-poppins">Company</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {footerLinks.company.map((link, index) => (
                    <li key={index}>
                      <Link 
                        to={link.href}
                        className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-xs sm:text-sm flex items-center group"
                      >
                        <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-300 dark:border-gray-600/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800/80 dark:to-gray-900/80 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-300 dark:border-gray-600/50 transition-colors duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
                    Stay Updated with Market Insights
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                    Get the latest trading signals, market analysis, and exclusive insights delivered to your inbox.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                      <span>Daily Market Updates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                      <span>No Spam, Ever</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      {isSubscribed ? (
                        <>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Subscribed!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Subscribe</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social & Stats Section */}
        <div className="border-t border-gray-300 dark:border-gray-600/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 sm:space-y-6 md:space-y-0">
              
              {/* Social Links */}
              <div className="flex items-center space-x-4 sm:space-x-6">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">Follow Us:</span>
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className={`text-gray-600 dark:text-gray-400 ${social.color} transition-colors duration-200 hover:scale-110 transform`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                ))}
              </div>

              {/* Stats */}
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 lg:space-x-8 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                  <span>150+ Active Traders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  <span>95% Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-300 dark:border-gray-600/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-3 sm:space-y-4 md:space-y-0">
              <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm text-center md:text-left">
                © 2024 FXLabs.AI. All rights reserved. Professional trading tools for serious traders.
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                <span>Made with</span>
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 dark:text-red-400" />
                <span>for traders worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default InteractiveFooter
