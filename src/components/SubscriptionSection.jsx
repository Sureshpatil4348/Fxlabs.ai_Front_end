import { ArrowRight, Check, Crown, Shield } from 'lucide-react'
import React, { useState } from 'react'

import FreeTrialPopup from './FreeTrialPopup'
import { useTheme } from '../contexts/ThemeContext'

const plans = [
  {
    name: 'Launch',
    price: 'Free/1 Month',
    cadence: '30 day experience',
    description: 'Best for desks validating our signal intelligence with minimal lift.',
    highlights: ['Basic RSI Analysis', '5 Currency Pairs', 'Email Support', 'Mobile Access', 'Basic Alerts', 'Community Access', 'Tutorial Videos'],
    cta: 'Start Trial Now',
    featured: true
  },
  {
    name: 'Signature',
    price: '$199/3 months',
    cadence: 'per quarter',
    description: 'Full-spectrum access across market, trade and AI modules for active teams.',
    highlights: ['Advanced RSI Analysis', '25 Currency Pairs', 'AI News Analysis', 'Priority Support', 'Real-Time Alerts', 'Telegram Notifications', 'Advanced Charts', 'Risk Management Tools'],
    cta: 'Buy Now',
    featured: true
  },
  {
    name: 'Bespoke',
    price: '$599/1 Year',
    cadence: 'enterprise',
    description: 'Custom integrations, white-glove quant services and dedicated infrastructure.',
    highlights: ['Premium RSI Suite', 'All 150+ Pairs', 'AI Trading Bot', '24/7 VIP Support', 'API Integration' , 'Personal Coach' , 'Advanced Analytics' , 'Priority Feature Access'],
    cta: 'Buy Now',
    featured: true
  }
]

const SubscriptionSection = () => {
  const { isDarkMode } = useTheme()
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  const handleLaunchPlanClick = () => {
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
  }

  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/70 px-6 py-2 text-xs uppercase tracking-[0.5em] text-gray-500 dark:border-white/10 dark:bg-gray-900/60 dark:text-gray-300">
            <Shield className="h-4 w-4 text-emerald-500" />
            Pricing
          </div>
          <h2 className={`text-3xl font-semibold sm:text-4xl lg:text-5xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Tailored access for premium trading teams
          </h2>
          <p className={`mx-auto max-w-2xl text-base leading-relaxed sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Transparent tiers that scale with your ambitions. Every engagement starts with curated onboarding and a dedicated success pod.
          </p>
        </div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl p-8 sm:p-10 transition-all duration-500 ${
                plan.featured
                  ? 'border-emerald-400/50 bg-white/85 shadow-[0_30px_120px_-60px_rgba(16,185,129,0.45)] dark:bg-gray-900/80'
                  : 'border-gray-200/70 bg-white/75 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-gray-900/65'
              }`}
            >
              {plan.featured && <div className="absolute inset-x-12 -top-12 h-28 bg-emerald-500/25 blur-3xl" />}
              <div className="relative z-10 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.45em] text-gray-400">{plan.cadence}</p>
                    {plan.featured && <Crown className="h-6 w-6 text-emerald-400" />}
                  </div>
                  <h3 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{plan.description}</p>
                </div>

                <div className="space-y-4">
                  <p className={`text-3xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.price}</p>
                  <div className="space-y-3">
                    {plan.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <p className={`text-sm leading-relaxed sm:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                          {highlight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {plan.name === 'Signature' ? (
                  <a
                    href="https://tagmango.app/0c590f2c10"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                      plan.featured
                        ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'border-gray-200/70 text-emerald-500 hover:border-emerald-400 hover:text-emerald-400 dark:border-white/10'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : plan.name === 'Bespoke' ? (
                  <a
                    href="https://tagmango.app/9c4d769ec5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                      plan.featured
                        ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'border-gray-200/70 text-emerald-500 hover:border-emerald-400 hover:text-emerald-400 dark:border-white/10'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <button
                    onClick={plan.name === 'Launch' ? handleLaunchPlanClick : undefined}
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                      plan.featured
                        ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'border-gray-200/70 text-emerald-500 hover:border-emerald-400 hover:text-emerald-400 dark:border-white/10'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Free Trial Popup */}
      <FreeTrialPopup isOpen={isPopupOpen} onClose={handleClosePopup} />
    </section>
  )
}

export default SubscriptionSection
