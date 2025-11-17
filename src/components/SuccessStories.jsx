import { motion } from 'framer-motion'
import { Quote, Sparkles } from 'lucide-react'
import React from 'react'

import { useTheme } from '../contexts/ThemeContext'

const testimonials = [
  {
    quote: 'FxLabs Prime unifies my 7-in-1 indicator analysis so every timeframe agrees, making it the best forex trading platform for precise execution.',
    name: 'Muzamil A.',
    firm: 'Professional Trader'
  },
  {
    quote: 'Real-time news and smart alerts from this Top forex trading platform hit my inbox before the market moves, so I never miss high-impact events.',
    name: 'Marcus.',
    firm: 'Prop Trader'
  },
  {
    quote: 'Smart money management tools and currency strength data keep my trading disciplined and confident across sessions.',
    name: 'Prajwla Naik.',
    firm: 'Portfolio Manager'
  }
]

const SuccessStories = () => {
  const { isDarkMode } = useTheme()

  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/70 px-5 py-2 text-xs uppercase tracking-[0.5em] text-gray-500 dark:border-white/10 dark:bg-[#19235d]/60 dark:text-gray-300">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Results
            </div>
            <h2 className={`text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
              Hear From Our Users: Success with the Best AI Trading Tools
            </h2>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.4 }}
              className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/80 p-8 shadow-[0_25px_70px_-40px_rgba(16,185,129,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[#19235d]/70"
            >
              <Quote className="h-12 w-12 text-emerald-500" />
              <p className={`mt-6 text-lg leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-[#19235d]'}`}>{testimonial.quote}</p>
              <div className="mt-8 space-y-1">
                <p className={`text-[11px] uppercase tracking-[0.45em] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {testimonial.name}
                </p>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>{testimonial.firm}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SuccessStories
