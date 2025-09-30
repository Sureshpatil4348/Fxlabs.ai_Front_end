import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import React, { useState } from 'react'

import { useTheme } from '../contexts/ThemeContext'

const faqs = [
  {
    question: 'What is FX Labs AI?',
    answer: 'An institutional-grade trade-intelligence dashboard that scores signals (RSI, correlation, AI news) across 25 FX pairs with real-time alerts and risk tools. We provide analytics only—no guaranteed returns or financial advice.'
  },
  {
    question: 'Does it place trades automatically?',
    answer: 'By default, it gives signals and alerts. If you want, you can connect MT4/MT5 to automate entries—your broker, rules, and risk remain under your control.'
  },
  {
    question: 'Which platforms/brokers are supported?',
    answer: 'Any broker that supports MT4/MT5. FX Labs is broker-agnostic; just connect via our bridge and select your accounts/pairs.'
  },
  {
    question: 'How do alerts work?',
    answer: 'You get real-time alerts on the web app and Telegram. Choose pairs and timeframes, and pick update mode (on tick or candle close) to match your style.'
  },
  {
    question: 'Is there a free trial and what about pricing?',
    answer: 'Yes—short trial and monthly/annual plans are available, with occasional partner-broker promos. Ping us on Telegram for current offers and activation. Use is subject to your local laws.'
  }
]

const FAQSection = () => {
  const { isDarkMode } = useTheme()
  const [openIndex, setOpenIndex] = useState(0)

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index))
  }

  return (
    <section className="relative py-12">
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
