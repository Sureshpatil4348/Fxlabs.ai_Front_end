import { 
  Download, 
  Users, 
  Settings, 
  Play,
  CheckCircle,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  Target,
  Sparkles,
  MessageCircle,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import React, { useState } from 'react'

const AfterPurchaseSection = () => {
  const [activeStep, setActiveStep] = useState(0)

  const onboardingSteps = [
    {
      id: 1,
      title: "Instant Access",
      subtitle: "Immediate System Download",
      description: "You'll receive login details to download your system immediately",
      icon: Download,
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-400",
      details: [
        "Secure login credentials sent to your email",
        "Direct download link to trading system",
        "No waiting time - access within minutes",
        "Full system documentation included"
      ],
      timeEstimate: "2 minutes",
      status: "instant"
    },
    {
      id: 2,
      title: "Telegram Support",
      subtitle: "Private Community Access",
      description: "I'll personally add you to our private community group",
      icon: Users,
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-400",
      details: [
        "Personal invitation to exclusive Telegram group",
        "Direct access to 150+ successful traders",
        "Real-time market discussions and insights",
        "24/7 community support and mentorship"
      ],
      timeEstimate: "5 minutes",
      status: "personal"
    },
    {
      id: 3,
      title: "Setup Assistance",
      subtitle: "Complete Installation Guide",
      description: "Follow our step-by-step installation guide or get personal help",
      icon: Settings,
      color: "from-purple-500 to-pink-600",
      bgColor: "from-purple-50 to-pink-50",
      borderColor: "border-purple-400",
      details: [
        "Comprehensive video installation guide",
        "Step-by-step written instructions",
        "Personal setup assistance if needed",
        "Troubleshooting support and FAQ"
      ],
      timeEstimate: "10 minutes",
      status: "guided"
    },
    {
      id: 4,
      title: "Start Trading",
      subtitle: "Live Trading Ready",
      description: "Be up and running within 5 minutes on your preferred broker",
      icon: Play,
      color: "from-orange-500 to-red-600",
      bgColor: "from-orange-50 to-red-50",
      borderColor: "border-orange-400",
      details: [
        "Connect to your preferred broker",
        "Configure trading parameters",
        "Start receiving live signals",
        "Begin profitable trading immediately"
      ],
      timeEstimate: "5 minutes",
      status: "live"
    }
  ]

  const benefits = [
    { icon: Clock, text: "Total Setup Time: Under 20 Minutes", color: "text-green-600" },
    { icon: Shield, text: "100% Secure & Encrypted Access", color: "text-blue-600" },
    { icon: Zap, text: "Instant Support Response", color: "text-purple-600" },
    { icon: Target, text: "Guaranteed Working System", color: "text-orange-600" }
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'instant':
        return <Zap className="w-4 h-4 text-green-500" />
      case 'personal':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'guided':
        return <BookOpen className="w-4 h-4 text-purple-500" />
      case 'live':
        return <TrendingUp className="w-4 h-4 text-orange-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <section className="relative py-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center animate-bounce">
          <Download className="w-4 h-4 text-green-400" />
        </div>
        <div className="absolute bottom-32 left-16 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center animate-ping">
          <Users className="w-3 h-3 text-blue-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-purple-400/30 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AFTER YOU PURCHASE</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Get Started
            </span>
            <br />
            <span className="text-gray-300">In Minutes</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Your journey to profitable trading begins <span className="text-green-400 font-semibold">immediately after purchase</span>. 
            Follow our simple 4-step process to be trading within <span className="text-blue-400 font-semibold">20 minutes</span>
          </p>
        </div>

        {/* Benefits Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-600/50">
                <benefit.icon className={`w-8 h-8 ${benefit.color}`} />
              </div>
              <div className={`text-sm font-medium ${benefit.color}`}>{benefit.text}</div>
            </div>
          ))}
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {onboardingSteps.map((step, index) => (
            <div
              key={step.id}
              className={`group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border-2 transition-all duration-500 transform hover:scale-105 cursor-pointer ${
                activeStep === index 
                  ? `${step.borderColor} shadow-2xl shadow-green-500/20` 
                  : 'border-gray-600/50 hover:border-gray-500/50'
              }`}
              role="button"
              tabIndex={0}
              onClick={() => setActiveStep(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveStep(index)
                }
              }}
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border-2 border-gray-500">
                <span className="text-white font-bold text-lg">{step.id}</span>
              </div>

              {/* Status Icon */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border border-gray-500">
                {getStatusIcon(step.status)}
              </div>

              {/* Card Content */}
              <div className="space-y-6">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-medium mb-3">{step.subtitle}</p>
                  <p className="text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Time Estimate */}
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">{step.timeEstimate}</span>
                </div>

                {/* Hover Arrow */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-5 h-5 text-green-400" />
                </div>
              </div>

              {/* Active Card Glow */}
              {activeStep === index && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>

        {/* Active Step Details */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-gray-700/40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${onboardingSteps[activeStep].color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  {React.createElement(onboardingSteps[activeStep].icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Step {onboardingSteps[activeStep].id}: {onboardingSteps[activeStep].title}
                  </h3>
                  <p className="text-gray-400">{onboardingSteps[activeStep].subtitle}</p>
                </div>
              </div>

              <p className="text-gray-300 text-lg leading-relaxed">
                {onboardingSteps[activeStep].description}
              </p>

              <div className="space-y-3">
                {onboardingSteps[activeStep].details.map((detail, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Estimated Time: {onboardingSteps[activeStep].timeEstimate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(onboardingSteps[activeStep].status)}
                  <span className="text-gray-300 capitalize">{onboardingSteps[activeStep].status} Process</span>
                </div>
              </div>

              <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Get Started Now</span>
              </button>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50">
                <div className="space-y-6">
                  {/* Step Icon Large */}
                  <div className="flex justify-center">
                    <div className={`w-24 h-24 bg-gradient-to-br ${onboardingSteps[activeStep].color} rounded-3xl flex items-center justify-center shadow-2xl`}>
                      {React.createElement(onboardingSteps[activeStep].icon, { className: "w-12 h-12 text-white" })}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">Step {onboardingSteps[activeStep].id}</div>
                      <div className="text-gray-400 text-sm">of 4</div>
                    </div>
                    
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className={`bg-gradient-to-r ${onboardingSteps[activeStep].color} h-2 rounded-full transition-all duration-500`} 
                           style={{ width: `${((activeStep + 1) / 4) * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {onboardingSteps[activeStep].timeEstimate}
                    </div>
                    <div className="text-gray-400 text-sm">Estimated Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6">
            Ready to start your profitable trading journey? Get instant access and be trading within 20 minutes!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Purchase & Get Instant Access</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Ask Questions</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AfterPurchaseSection
