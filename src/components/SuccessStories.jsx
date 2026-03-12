import { motion } from 'framer-motion'
import { Quote, Sparkles } from 'lucide-react'
import React from 'react'

import { useTheme } from '../contexts/ThemeContext'

const testimonials = [
  {
    quote:
      "I lost ₹14,000 in 30 seconds because a UK news release dropped while I was in a GBPUSD trade. I didn't even know it was coming. Since I started checking FXLabs economic calendar and AI news summary before every session, I haven't been caught off guard once.",
    name: 'Muzamil A.',
    firm: 'Professional Trader'
  },
  {
    quote:
      'I was monitoring 12 pairs at once and trading none of them properly. Always second guessing, always switching charts, always missing entries. The Currency Strength Meter showed me the strongest vs weakest pair in 2 minutes. I closed everything else and just focused on that. My results improved just from having focus',
    name: 'Marcus.',
    firm: 'Prop Trader'
  },
  {
    quote:
      "I'm a software engineer with a full time job and a family. I cannot spend 3 hours on analysis every day — something always suffers. Now I open FXLabs for 15 minutes before I leave for office, set my alerts, identify one or two pairs and close the app. The alerts do the rest. I haven't missed a solid setup since and my work hasn't suffered either.",
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
