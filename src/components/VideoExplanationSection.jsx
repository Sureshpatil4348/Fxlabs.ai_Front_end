import { Play, Zap, Target, Compass, LineChart } from 'lucide-react'
import React, { useState } from 'react'

import { useTheme } from '../contexts/ThemeContext'

const pillars = [
  {
    title: 'Signal clarity',
    description: 'Multi-timeframe RSI, liquidity and sentiment fused into a single probability score for every asset.',
    icon: Target
  },
  {
    title: 'Decision intelligence',
    description: 'Context-aware narratives give your desk the why behind the move in moments, not hours.',
    icon: Compass
  },
  {
    title: 'Execution mastery',
    description: 'Automated playbooks, smart alerting and frictionless routing keep your team ahead of the curve.',
    icon: LineChart
  }
]

const VideoExplanationSection = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const { isDarkMode } = useTheme()

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/70 px-5 py-2 text-xs uppercase tracking-[0.5em] text-gray-500 dark:border-white/10 dark:bg-gray-900/60 dark:text-gray-300">
              <Zap className="h-4 w-4 text-emerald-500" />
              Live walkthrough
            </div>
            <h2 className={`text-3xl font-semibold leading-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              See how FXLabs unifies intelligence, execution and performance in minutes
            </h2>
            <p className={`text-base leading-relaxed sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Our guided experience shows the journey from raw signal to executed trade. Every screen is designed for premium clarity, so your team focuses on conviction—not systems.
            </p>

            <div className="space-y-6">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-500">
                    <pillar.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{pillar.title}</h3>
                    <p className={`text-sm leading-relaxed sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {!isVideoPlaying ? (
              <button
                type="button"
                onClick={() => setIsVideoPlaying(true)}
                className="group relative block aspect-[16/10] w-full overflow-hidden rounded-3xl border border-gray-200/70 bg-gray-900/85 shadow-[0_30px_120px_-60px_rgba(16,185,129,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-white/10"
              >
                <img
                  src="https://img.youtube.com/vi/e9yQcDzqHTU/maxresdefault.jpg"
                  alt="FXLabs demo"
                  className="h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-emerald-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/85 text-gray-900 shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Play className="h-8 w-8" />
                  </span>
                </div>
                <div className="absolute bottom-8 left-8 right-8 space-y-2 text-left text-white">
                  <p className="text-[11px] uppercase tracking-[0.5em] text-white/70">Platform tour</p>
                  <p className="text-xl font-semibold">Experience the premium trading cockpit</p>
                </div>
              </button>
            ) : (
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-gray-200/70 shadow-2xl dark:border-white/10">
                <iframe
                  src="https://www.youtube.com/embed/e9yQcDzqHTU?autoplay=1&rel=0&modestbranding=1"
                  title="FXLabs demo"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default VideoExplanationSection
