import { BellRing, Inbox, MailCheck, Server, Zap } from 'lucide-react'
import React from 'react'

const workflow = [
  {
    title: 'Detect',
    description: '7-indicator core scans TradingView conditions for confluence across M1 to H4 timeframes.',
    icon: Zap
  },
  {
    title: 'Filter',
    description: 'High-impact calendar events and liquidity windows are cross-checked to avoid false triggers.',
    icon: Server
  },
  {
    title: 'Notify',
    description: 'Instant alerts route to email, mobile and desktop so your team never misses a signal.',
    icon: MailCheck
  },
  {
    title: 'Act',
    description: 'Automated summaries include entry zones, stop-loss guidance and current currency strength.',
    icon: Inbox
  }
]

const AutomationAlertsSection = () => {
  return (
    <section className="hidden sm:block py-12 sm:py-16 md:py-20 px-4 md:px-6 w-full transition-colors duration-300">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 xl:gap-16 items-center">
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-white/20 backdrop-blur border border-white/40 shadow-lg text-sm font-medium text-[#19235d]" style={{ fontFamily: 'Pier Sans, sans-serif' }}>
              <BellRing className="w-4 h-4 mr-2 text-emerald-500" />
              Automated intelligence pipeline
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-[#19235d]" style={{ fontFamily: 'Pier Sans, sans-serif' }}>
              Alerts hit your inbox <span className="text-emerald-500">before</span> the market moves
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#19235d]/80 leading-relaxed" style={{ fontFamily: 'Pier Sans, sans-serif' }}>
              HASHTAG watches global markets around the clock, combining news, indicators and currency strength to deliver precise trade plans right when you need them. No more refreshing screens or missing volatility.
            </p>
            <ul className="space-y-3 sm:space-y-4 text-[#19235d]/80" style={{ fontFamily: 'Pier Sans, sans-serif' }}>
              <li className="flex flex-col sm:flex-row sm:items-start sm:justify-center lg:justify-start text-center sm:text-left">
                <MailCheck className="w-5 h-5 text-emerald-500 mx-auto sm:mx-0 sm:mt-0.5 sm:mr-3" />
                <span className="mt-3 sm:mt-0">High-impact news, indicator confluence and volatility alerts delivered to email, SMS and webhook.</span>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-start sm:justify-center lg:justify-start text-center sm:text-left">
                <Inbox className="w-5 h-5 text-emerald-500 mx-auto sm:mx-0 sm:mt-0.5 sm:mr-3" />
                <span className="mt-3 sm:mt-0">Custom routing by asset class or session so your team receives only what matters.</span>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-start sm:justify-center lg:justify-start text-center sm:text-left">
                <Server className="w-5 h-5 text-emerald-500 mx-auto sm:mx-0 sm:mt-0.5 sm:mr-3" />
                <span className="mt-3 sm:mt-0">Secure Dubai-hosted infrastructure with redundancy for uninterrupted monitoring.</span>
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/20 blur-2xl rounded-3xl"></div>
            <div className="relative grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {workflow.map(({ title, description, icon: Icon }) => (
                <div key={title} className="rounded-2xl sm:rounded-3xl bg-white/60 backdrop-blur border border-white/40 p-4 sm:p-6 shadow-xl">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#19235d]" style={{ fontFamily: 'Pier Sans, sans-serif' }}>{title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#19235d]/70 leading-relaxed" style={{ fontFamily: 'Pier Sans, sans-serif' }}>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AutomationAlertsSection
