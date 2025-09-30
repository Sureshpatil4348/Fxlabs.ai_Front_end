import { ArrowRight, Check, Crown, Shield } from 'lucide-react'
import React, { useState } from 'react'

import FreeTrialPopup from './FreeTrialPopup'
import { useTheme } from '../contexts/ThemeContext'

const plans = [
  {
    name: 'Launch',
    price: 'Free/1 Month',
    cadence: '30 day experience',
    description: 'Good for testing the waters',
    highlights: ['Full feature preview with broker registration', 'No credit card required', 'Community & tutorial access included', 'Live Notifications', 'Mobile-friendly setup (trade on the go)'],
    cta: 'Start Trial Now',
    featured: false,
    mostPopular: false
  },
  {
    name: 'Signature',
    price: '$199/3 Months',
    cadence: '⭐ Pro Trader',
    description: 'Best balance of cost & performance',
    highlights: ['Full access to all trading & AI modules', 'Covers 25+ major & minor FX pairs + gold/silver', 'Priority support & faster onboarding', 'Real-time alerts + Telegram push', 'Risk management suite included'],
    cta: 'Buy Now',
    featured: true,
    mostPopular: true
  },
  {
    name: 'Bespoke',
    price: '$599/Year',
    cadence: 'enterprise',
    description: 'Best long-term value for active desks',
    highlights: ['All Signature features', 'Premium trading tools unlocked', 'Early access to new AI modules & beta features', 'Dedicated priority support (24/5 human desk)', 'Special "power user" webinars & insights'],
    cta: 'Buy Now',
    featured: false,
    mostPopular: false
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
    <section id="pricing" className="relative py-12">
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
            Unlock the profits with Advance AI Analysis Tool
          </p>
        </div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3 lg:items-center">
          {plans.map((plan) => (
            <div key={plan.name} className="relative">
              {plan.mostPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                </div>
              )}
              <div
                className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl p-8 sm:p-10 transition-all duration-500 flex flex-col ${
                  plan.mostPopular
                    ? 'border-emerald-400 bg-white/90 shadow-[0_40px_140px_-60px_rgba(16,185,129,0.6)] dark:bg-gray-900/90 lg:scale-105 pt-12 ring-2 ring-emerald-400/30'
                    : 'border-gray-200/70 bg-white/75 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-gray-900/65'
                }`}
              >
                {plan.mostPopular && (
                  <div className="absolute inset-x-12 -top-12 h-28 bg-emerald-500/30 blur-3xl" />
                )}
              <div className="relative z-10 space-y-6 flex flex-col flex-grow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] uppercase tracking-[0.45em] ${plan.mostPopular ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>{plan.cadence}</p>
                    {plan.mostPopular && <Crown className="h-6 w-6 text-emerald-400" />}
                  </div>
                  <h3 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{plan.description}</p>
                </div>

                <div className="space-y-4 flex-grow">
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

                <div className="mt-auto">
                {plan.name === 'Signature' ? (
                  <a
                    href="https://tagmango.app/0c590f2c10"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3.5 text-sm font-bold transition-all duration-300 shadow-xl shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105"
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
                      isDarkMode
                        ? 'border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400'
                        : 'border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <button
                    onClick={plan.name === 'Launch' ? handleLaunchPlanClick : undefined}
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                      isDarkMode
                        ? 'border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400'
                        : 'border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                </div>
              </div>
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
