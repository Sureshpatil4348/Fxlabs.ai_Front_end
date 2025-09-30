import React from 'react'

import { useTheme } from '../contexts/ThemeContext'

const partners = [
  { name: 'Meta Quotes', tag: 'Data partner' },
  { name: 'MetaTrader 5', tag: 'Execution' },
  { name: 'TradingView', tag: 'Charting' },
  { name: 'AI News Analysis', tag: 'Sentiment' },
  { name: 'Azure', tag: 'Infrastructure' }
]

const PartnersSection = () => {
  const { isDarkMode } = useTheme()

  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-gray-200/70 bg-white/70 p-10 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/60">
          <div className="flex flex-col gap-6 border-b border-gray-200/70 pb-8 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.5em] text-gray-500">Trusted by elite desks</p>
              <h3 className={`text-2xl font-semibold sm:text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Built on deep institutional partnerships
              </h3>
              <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enterprise connectivity with the platforms and providers you already rely on.
              </p>
            </div>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Zero switching cost—FXLabs syncs with existing OMS, EMS and analytics vendors for a seamless rollout.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/80 p-6 text-left transition hover:border-emerald-400 hover:shadow-lg dark:border-white/10 dark:bg-gray-900/70"
              >
                <span className="text-[10px] uppercase tracking-[0.45em] text-gray-400">{partner.tag}</span>
                <p className={`mt-4 text-base font-semibold sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {partner.name}
                </p>
                <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PartnersSection
