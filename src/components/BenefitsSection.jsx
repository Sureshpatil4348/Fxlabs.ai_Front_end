import {
    Cpu,
    LineChart,
    Activity,
    ShieldCheck,
    BarChart3,
    Clock
  } from 'lucide-react'
  import React from 'react'
  
  import { useTheme } from '../contexts/ThemeContext'
  
  const benefits = [
    {
      icon: Cpu,
      title: 'AI-guided execution',
      description: 'Adaptive decisioning engine translates complex market context into precise, risk-aware trades.'
    },
    {
      icon: LineChart,
      title: 'Institutional analytics',
      description: 'Proprietary correlation, momentum and liquidity layers built for macro desks and prop funds.'
    },
    {
      icon: Activity,
      title: 'Live macro intelligence',
      description: 'Streaming signal intelligence, economic catalysts and news sentiment in a single, orchestrated feed.'
    },
    {
      icon: ShieldCheck,
      title: 'Compliance ready',
      description: 'Encrypted audit trail, role-based access and SOC2-ready infrastructure from day one.'
    },
    {
      icon: BarChart3,
      title: '360° performance',
      description: 'Holistic monitoring of P&L, exposure and volatility across desks with real-time attribution.'
    },
    {
      icon: Clock,
      title: 'Time-to-alpha in days',
      description: 'Pre-trained models, curated playbooks and concierge onboarding accelerate deployment.'
    }
  ]
  
  const BenefitsSection = () => {
    const { isDarkMode } = useTheme()
  
    return (
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 pb-16 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-[11px] uppercase tracking-[0.5em] text-gray-500">The FxLabs Prime edge</p>
              <h2 className={`text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
                Precision infrastructure for trading leaders
              </h2>
            </div>
            <p className={`max-w-xl text-base leading-relaxed sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Every workflow is distilled to the essentials—clarity, speed and confidence. FxLabs Prime orchestrates your data, signals and execution into a single, premium surface.
            </p>
          </div>
  
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/75 p-8 backdrop-blur-xl shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#19235d]/70"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/8 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
  
                <benefit.icon className="relative z-10 mb-6 h-10 w-10 text-emerald-500" />
                <h3 className={`relative z-10 text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>{benefit.title}</h3>
                <p className={`relative z-10 mt-3 text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  
  export default BenefitsSection
  