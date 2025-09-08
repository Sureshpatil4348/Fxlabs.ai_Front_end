import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { TrendingUp, BarChart3, Shield, Zap, Target, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import SuccessStories from '../components/SuccessStories'
import TradingCarousel from '../components/TradingCarousel'
import WhySystemWorks from '../components/WhySystemWorks'
import SubscriptionSection from '../components/SubscriptionSection'
import AfterPurchaseSection from '../components/AfterPurchaseSection'
import TradingFeaturesSection from '../components/TradingFeaturesSection'
import CTASection from '../components/CTASection'
import FAQSection from '../components/FAQSection'
import InteractiveFooter from '../components/InteractiveFooter'

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section id="hero">
        <HeroSection />
      </section>

      {/* Success Stories Section */}
      <section id="success-stories">
        <SuccessStories />
      </section>

      {/* Trading Charts Carousel */}
      <section id="trading-charts">
        <TradingCarousel />
      </section>

      {/* Why System Works Section */}
      <section id="why-system-works">
        <WhySystemWorks />
      </section>

      {/* Subscription Section */}
      <section id="subscription">
        <SubscriptionSection />
      </section>

      {/* After Purchase Section */}
      <section id="after-purchase">
        <AfterPurchaseSection />
      </section>

      {/* Trading Features Section */}
      <section id="features">
        <TradingFeaturesSection />
      </section>

      {/* CTA Section */}
      <section id="cta">
        <CTASection />
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <FAQSection />
      </section>

      {/* Interactive Footer */}
      <InteractiveFooter />
    </div>
  )
}

export default Home
