import { ArrowLeft } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

import InteractiveFooter from '../components/InteractiveFooter'
import Navbar from '../components/Navbar'
import { useTheme } from '../contexts/ThemeContext'

const RefundPolicy = () => {
  const { isDarkMode } = useTheme()

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link 
          to="/" 
          className={`inline-flex items-center mb-8 text-sm transition-colors ${
            isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Refund Policy
          </h1>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p><strong>Effective Date:</strong> 01/10/2025</p>
            <p><strong>Entity:</strong> Pinaxa Labs LLP (brand: FX Labs)</p>
          </div>
        </div>

        {/* Content */}
        <div className={`prose prose-lg max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
          
          {/* 1. General Principle */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1) General Principle</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              <strong>All fees are final and non-refundable.</strong> By purchasing or subscribing, you agree there are <strong>no refunds</strong>, <strong>no credits</strong>, and <strong>no pro-rata</strong> for partial periods, non-usage, or dissatisfaction.
            </p>
          </section>

          {/* 2. Free Trials */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2) Free Trials / IB Promotions</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              From time to time, we may offer <strong>trial access</strong> or <strong>promotions</strong> (e.g., via specific broker/IB registrations and qualifying deposits). Promotional access is discretionary and <strong>does not convert into a right to refunds</strong>. If promotional conditions are not met or reversed (e.g., deposit withdrawn or IB transfer fails), access may be limited or revoked.
            </p>
          </section>

          {/* 3. Auto-Renewals */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3) Auto-Renewals & Cancellations</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Subscriptions <strong>auto-renew</strong> unless cancelled <strong>before</strong> the renewal date. Cancelling stops future renewals; it <strong>does not</strong> trigger a refund for periods already charged. Access remains until the end of the then-current term.
            </p>
          </section>

          {/* 4. Billing Currency */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4) Billing Currency, Taxes & Price Changes</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Charges are in the currency shown at checkout; <strong>bank FX fees</strong> are your responsibility. <strong>Taxes (e.g., GST)</strong> are extra unless stated. We may change prices for renewals with prior notice.
            </p>
          </section>

          {/* 5. Duplicate Charges */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5) Duplicate Charges / Fraudulent Use</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              If you believe you were <strong>double-charged</strong> due to a technical error, contact <a href="mailto:support@fxlabsprime.com" className="text-blue-500 hover:underline">support@fxlabsprime.com</a> within <strong>15 days</strong> with evidence; upon verification, we may issue an <strong>account credit</strong> or <strong>corrective adjustment</strong> at our discretion. Suspicious or fraudulent use may result in immediate suspension without refund.
            </p>
          </section>

          {/* 6. Chargebacks */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6) Chargebacks</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Filing a chargeback without first contacting us to resolve a bona fide billing error may lead to <strong>account suspension</strong> and assessment of recovery costs. This policy does not waive any statutory rights that cannot be excluded.
            </p>
          </section>

          {/* 7. Service Availability */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7) Service Availability</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Temporary downtime, maintenance windows, or third-party outages <strong>do not</strong> entitle you to refunds or credits unless a <strong>separate written SLA</strong> with credit terms exists (rare; enterprise only).
            </p>
          </section>

          {/* 8. Contact */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8) Contact (Refund/Billing)</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Billing Support:</strong> <a href="mailto:support@fxlabsprime.com" className="text-blue-500 hover:underline">support@fxlabsprime.com</a></li>
              <li><strong>Registered Office:</strong> #253, Junnur Mudhol, Karnataka - 587204</li>
            </ul>
          </section>

        </div>
      </div>

      <InteractiveFooter />
    </div>
  )
}

export default RefundPolicy
