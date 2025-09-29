import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import React, { useState } from 'react'

import { useTheme } from '../contexts/ThemeContext'

const faqs = [
  {
    question: 'How fast can our desk go live with FXLabs?',
    answer: 'Most teams complete onboarding within 5–7 business days. We configure data feeds, compliance policies and execution workflows alongside your team.'
  },
  {
    question: 'Can you integrate with our existing OMS / EMS stack?',
    answer: 'Yes. We integrate with leading brokers, MetaTrader, FIX APIs and internal OMS/EMS solutions. Bespoke connectors are available for enterprise plans.'
  },
  {
    question: 'What makes your AI market intelligence unique?',
    answer: 'We blend macro news cognition, technical pattern recognition and liquidity signals into a single probability layer. Traders receive context, not noise.'
  },
  {
    question: 'Is FXLabs suitable for regulated institutions?',
    answer: 'Absolutely. Role-based permissions, audit trails, encryption at rest and dedicated environments are all standard. We support SOC2 alignment for enterprise teams.'
  },
  {
    question: 'Do you provide human support?',
    answer: 'Our concierge desk is available 24/5 for institutional clients. You’ll work directly with our product specialists during onboarding and beyond.'
  }
]

const FAQSection = () => {
  const { isDarkMode } = useTheme()
  const [openIndex, setOpenIndex] = useState(0)

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index))
  }

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/70 px-5 py-2 text-xs uppercase tracking-[0.5em] text-gray-500 dark:border-white/10 dark:bg-gray-900/60 dark:text-gray-300">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            FAQs
          </div>
          <h2 className={`text-3xl font-semibold leading-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Answers to the questions desks ask most
          </h2>
          <p className={`mx-auto max-w-2xl text-base leading-relaxed sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            If you have specific integration, compliance or quant requirements, our team will provide detailed documentation during your consultation.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/70"
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-6 px-6 py-6 text-left"
                >
                  <div>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{faq.question}</p>
                    {isOpen && (
                      <p className={`mt-3 text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {faq.answer}
                      </p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-emerald-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FAQSection
