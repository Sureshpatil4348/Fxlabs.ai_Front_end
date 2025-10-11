import { motion } from 'framer-motion'
import { Quote, Sparkles } from 'lucide-react'
import React from 'react'

import { useTheme } from '../contexts/ThemeContext'

const testimonials = [
  {
    quote: 'FxLabs Prime gives our macro and quant teams a single view of the market. We&apos;ve cut mis-trades by 30% and improved execution alignment across desks.',
    name: 'Global Macro Lead',
    firm: 'Tier-1 Prop Fund'
  },
  {
    quote: 'The AI news engine flagged a policy shift two minutes before the wire. That early edge let us reposition ahead of the market — a difference worth millions.',
    name: 'Head of FX Trading',
    firm: 'International Bank'
  },
  {
    quote: 'From onboarding to first live trade took just 6 days. Compliance reports plugged straight into our system — no friction, no delays.',
    name: 'Chief Investment Officer',
    firm: 'Family Office'
  }
]

const SuccessStories = () => {
  const { isDarkMode } = useTheme()

  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/70 px-5 py-2 text-xs uppercase tracking-[0.5em] text-gray-500 dark:border-white/10 dark:bg-gray-900/60 dark:text-gray-300">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Results
            </div>
            <h2 className={`text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Trusted by desks moving billions every day
            </h2>
          </div>
          <p className={`max-w-xl text-base leading-relaxed sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Elite teams across FX, commodities and crypto rely on FxLabs Prime for decisive, real-time intelligence. Here&apos;s how they describe the shift.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.4 }}
              className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/80 p-8 shadow-[0_25px_70px_-40px_rgba(16,185,129,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/70"
            >
              <Quote className="h-12 w-12 text-emerald-500" />
              <p className={`mt-6 text-lg leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{testimonial.quote}</p>
              <div className="mt-8 space-y-1">
                <p className={`text-[11px] uppercase tracking-[0.45em] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {testimonial.name}
                </p>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{testimonial.firm}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SuccessStories
