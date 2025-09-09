import { 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  Shield,
  Clock,
  Users,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import React, { useState } from 'react'

const FAQSection = () => {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const faqCategories = [
    {
      title: "Getting Started",
      icon: HelpCircle,
      color: "from-green-500 to-emerald-600",
      questions: [
        {
          question: "How quickly can I start trading after purchase?",
          answer: "You can start trading within 20 minutes of purchase. Our system provides instant access to download links, setup guides, and immediate community access to get you up and running quickly."
        },
        {
          question: "Do I need any prior trading experience?",
          answer: "No prior experience is required. Our system is designed for both beginners and experienced traders. We provide comprehensive guides, video tutorials, and community support to help you succeed regardless of your experience level."
        },
        {
          question: "What trading platforms are supported?",
          answer: "Our system works with all major trading platforms including MetaTrader 4, MetaTrader 5, TradingView, and most popular forex brokers. We provide specific setup guides for each platform."
        },
        {
          question: "Is there a mobile app available?",
          answer: "Yes, our system includes mobile access through web-based dashboards that work perfectly on all mobile devices. You can monitor your trades and receive alerts on the go."
        }
      ]
    },
    {
      title: "System Features",
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-600",
      questions: [
        {
          question: "How accurate is the RSI analysis system?",
          answer: "Our RSI correlation analysis system has a proven 95% accuracy rate. It uses advanced algorithms to analyze multiple timeframes and currency correlations to provide highly reliable trading signals."
        },
        {
          question: "What makes your AI news analysis different?",
          answer: "Our AI news analysis processes thousands of news sources in real-time, analyzing sentiment, impact, and market correlation. It provides actionable insights that help predict market movements before they happen."
        },
        {
          question: "How often are the signals updated?",
          answer: "All signals are updated in real-time, 24/7. You'll receive instant notifications for new opportunities, and our dashboard refreshes continuously to show the latest market conditions and trading opportunities."
        },
        {
          question: "Can I customize the trading parameters?",
          answer: "Absolutely! Our system allows full customization of risk parameters, timeframes, currency pairs, and alert settings. You can tailor the system to match your trading style and risk tolerance."
        }
      ]
    },
    {
      title: "Support & Community",
      icon: Users,
      color: "from-purple-500 to-pink-600",
      questions: [
        {
          question: "What kind of support do you provide?",
          answer: "We provide comprehensive support including 24/7 community access, personal setup assistance, video tutorials, written guides, and direct access to our team of trading experts. Premium users get priority support."
        },
        {
          question: "How active is the trading community?",
          answer: "Our community is very active with 150+ successful traders sharing insights daily. You'll find real-time discussions, strategy sharing, success stories, and collaborative analysis of market conditions."
        },
        {
          question: "Do you offer personal coaching or mentorship?",
          answer: "Yes, our Diamond plan includes personal trading coaching and mentorship. We also have regular group sessions, webinars, and one-on-one consultations available for all premium members."
        },
        {
          question: "What if I need help with setup or have technical issues?",
          answer: "We provide step-by-step setup assistance and have a dedicated technical support team. Most issues are resolved within hours, and we offer screen sharing sessions for complex setups."
        }
      ]
    },
    {
      title: "Pricing & Guarantees",
      icon: Shield,
      color: "from-orange-500 to-red-600",
      questions: [
        {
          question: "What's included in each subscription plan?",
          answer: "Silver includes basic features for beginners, Gold provides advanced tools for serious traders, and Diamond offers the complete suite with personal coaching. All plans include community access and support."
        },
        {
          question: "Do you offer a money-back guarantee?",
          answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with the system's performance or support, we'll provide a full refund, no questions asked."
        },
        {
          question: "Are there any hidden fees or additional costs?",
          answer: "No hidden fees. The subscription price includes everything - the trading system, community access, support, and all updates. The only additional cost would be your broker's trading fees."
        },
        {
          question: "Can I upgrade or downgrade my plan anytime?",
          answer: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, and downgrades take effect at your next billing cycle. We'll prorate any differences."
        }
      ]
    }
  ]

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <HelpCircle className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center animate-ping">
          <Shield className="w-3 h-3 text-blue-400" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Got Questions?
            </span>
            <br />
            <span className="text-gray-300">We Have Answers</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Find answers to the most common questions about our <span className="text-green-400 font-semibold">trading system</span>, 
            <span className="text-blue-400 font-semibold"> features</span>, and <span className="text-purple-400 font-semibold">support</span>
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-600/50 overflow-hidden">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 px-8 py-6 border-b border-gray-600/50">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                </div>
              </div>

              {/* Questions */}
              <div className="divide-y divide-gray-600/50">
                {category.questions.map((item, questionIndex) => {
                  const globalIndex = `${categoryIndex}-${questionIndex}`
                  const isOpen = openItems[globalIndex]
                  
                  return (
                    <div key={questionIndex} className="transition-all duration-300">
                      {/* Question */}
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full px-8 py-6 text-left hover:bg-gray-800/50 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <h4 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors duration-200 pr-4">
                          {item.question}
                        </h4>
                        <div className="flex-shrink-0">
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors duration-200" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors duration-200" />
                          )}
                        </div>
                      </button>

                      {/* Answer */}
                      <div className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-8 pb-6">
                          <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-gray-600/50">
                            <p className="text-gray-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-gray-600/50">
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <HelpCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Still Have Questions?
              </h3>
              
              <p className="text-gray-400 mb-6">
                Our support team is here to help. Get in touch and we&apos;ll answer any questions you have about our trading system.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Contact Support</span>
                </button>
                <button className="border-2 border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Schedule Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQSection
