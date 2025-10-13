import React, { useEffect, useRef } from 'react'

const PremiumHeroBackground = () => {
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const particlesRef = useRef([])
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    let width, height

    function getThemeColors() {
      const isDark = document.documentElement.classList.contains('dark')
      const primary = 'rgba(16,185,129,1)' // emerald-500
      const secondary = isDark ? 'rgba(59,130,246,1)' : 'rgba(2,132,199,1)' // blue-500 / cyan-600
      const dotAlpha = 0.9
      const lineAlphaNear = isDark ? 0.25 : 0.18
      const lineAlphaFar = isDark ? 0.04 : 0.03
      const bgGradientStart = isDark ? '#19235d' : '#f8fafc'
      const bgGradientEnd = isDark ? '#19235d' : '#e8fff4'
      return { isDark, primary, secondary, dotAlpha, lineAlphaNear, lineAlphaFar, bgGradientStart, bgGradientEnd }
    }

    let theme = getThemeColors()

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      width = Math.floor(rect.width)
      height = Math.floor(rect.height)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function initParticles() {
      const count = Math.round(Math.min(120, Math.max(60, (width * height) / 18000)))
      particlesRef.current = Array.from({ length: count }, () => {
        const speed = 0.1 + Math.random() * 0.2 // Slightly faster: 0.1-0.3 for better balance
        const angle = Math.random() * Math.PI * 2
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1.2 + Math.random() * 1.8,
          hue: Math.random()
        }
      })
    }

    function drawBackgroundGradient() {
      const g = ctx.createLinearGradient(0, 0, width, height)
      g.addColorStop(0, theme.bgGradientStart)
      g.addColorStop(1, theme.bgGradientEnd)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, width, height)

      // crisp accent lines
      ctx.save()
      const lines = 6
      for (let i = 0; i < lines; i++) {
        const y = (height / (lines + 1)) * (i + 1)
        const lg = ctx.createLinearGradient(0, y, width, y)
        lg.addColorStop(0, 'rgba(3, 192, 93, 0)')
        lg.addColorStop(0.5, 'rgba(3, 192, 93, 0.08)')
        lg.addColorStop(1, 'rgba(3, 192, 93, 0)')
        ctx.fillStyle = lg
        ctx.fillRect(0, y - 0.5, width, 1)
      }
      ctx.restore()
    }

    function draw() {
      drawBackgroundGradient()

      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5)
        grad.addColorStop(0, theme.primary)
        grad.addColorStop(1, theme.secondary)
        ctx.fillStyle = grad
        ctx.globalAlpha = theme.dotAlpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // connective lines
      const maxDist = Math.min(160, Math.max(100, Math.min(width, height) * 0.28))
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist2 = dx * dx + dy * dy
          if (dist2 < maxDist * maxDist) {
            const dist = Math.sqrt(dist2)
            const t = 1 - dist / maxDist
            ctx.strokeStyle = 'rgba(3,192,93,' + (theme.lineAlphaFar + t * (theme.lineAlphaNear - theme.lineAlphaFar)) + ')'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animationRef.current = window.requestAnimationFrame(draw)
    }

    function start() {
      resize()
      initParticles()
      if (reducedMotionRef.current) {
        // draw once without animation
        drawBackgroundGradient()
        const particles = particlesRef.current
        particles.forEach((p) => {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5)
          grad.addColorStop(0, theme.primary)
          grad.addColorStop(1, theme.secondary)
          ctx.fillStyle = grad
          ctx.globalAlpha = theme.dotAlpha
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.globalAlpha = 1
        return
      }
      draw()
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = mql.matches
    const handleMql = (e) => {
      reducedMotionRef.current = e.matches
      window.cancelAnimationFrame(animationRef.current)
      start()
    }
    mql.addEventListener?.('change', handleMql)

    const handleResize = () => {
      window.cancelAnimationFrame(animationRef.current)
      theme = getThemeColors()
      start()
    }
    window.addEventListener('resize', handleResize)

    const observer = new MutationObserver(() => {
      const next = getThemeColors()
      if (next.isDark !== theme.isDark) {
        theme = next
        window.cancelAnimationFrame(animationRef.current)
        start()
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    start()

    return () => {
      window.removeEventListener('resize', handleResize)
      mql.removeEventListener?.('change', handleMql)
      observer.disconnect()
      window.cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none select-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 600px at 10% 10%, rgba(16,185,129,0.10), rgba(16,185,129,0) 60%), radial-gradient(1000px 600px at 90% 20%, rgba(59,130,246,0.10), rgba(59,130,246,0) 60%)'
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}

export default PremiumHeroBackground


