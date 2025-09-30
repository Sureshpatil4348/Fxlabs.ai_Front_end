import { ArrowLeft } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

import InteractiveFooter from '../components/InteractiveFooter'
import Navbar from '../components/Navbar'
import { useTheme } from '../contexts/ThemeContext'

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p><strong>Effective Date:</strong> 01/10/2025</p>
            <p><strong>Entity:</strong> Pinaxa Labs LLP (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;)</p>
            <p><strong>Brand:</strong> FX Labs (&quot;FX Labs&quot;, &quot;Service&quot;, &quot;Platform&quot;)</p>
            <p><strong>Registered Office:</strong> #253, Junnur, Mudhol, Karnataka - 587204</p>
            <p><strong>Legal / Privacy Email:</strong> <a href="mailto:support@fxlabs.ai" className="text-blue-500 hover:underline">support@fxlabs.ai</a></p>
            <p><strong>Data Protection Contact:</strong> Suresh Patil, support@fxlabs.ai</p>
          </div>
        </div>

        {/* Content */}
        <div className={`prose prose-lg max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
          
          {/* Table of Contents */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Table of Contents</h2>
            <ol className={`list-decimal pl-6 space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Scope & Role</li>
              <li>Definitions</li>
              <li>Categories of Data We Process</li>
              <li>Sources of Data</li>
              <li>Legal Bases (India / GDPR / CCPA)</li>
              <li>Purposes of Processing</li>
              <li>Cookies & Tracking</li>
              <li>Disclosures (Who We Share With)</li>
              <li>Cross-Border Transfers</li>
              <li>Data Retention</li>
              <li>Security</li>
              <li>Your Rights (India—DPDP; EU/UK—GDPR; California—CCPA)</li>
              <li>Children</li>
              <li>Automated Decision-Making / Profiling</li>
              <li>Third-Party Links & Broker Integrations</li>
              <li>No Investment Advice</li>
              <li>Changes to this Policy</li>
              <li>Contact & Grievance Redressal</li>
            </ol>
          </section>

          {/* 1. Scope & Role */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1) Scope & Role</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              This Privacy Policy explains how <strong>Pinaxa Labs LLP</strong> processes personal data when you visit <strong>FX Labs</strong> websites, apps, dashboards, APIs, and communications (collectively, the <strong>Services</strong>). For Indian residents, we comply with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>IT Act 2000/Intermediary Rules 2021</strong>. For users in the EEA/UK we act as a <strong>data controller</strong> under <strong>GDPR/UK GDPR</strong>; for California residents we provide notices required by <strong>CCPA/CPRA</strong>.
            </p>
          </section>

          {/* 2. Definitions */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2) Definitions</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Personal Data / Personal Information:</strong> Information that identifies or relates to an identifiable individual.</li>
              <li><strong>Processing:</strong> Any operation on Personal Data (collection, storage, use, disclosure, deletion).</li>
              <li><strong>Sensitive Personal Data:</strong> As defined by applicable law. We <strong>do not intentionally collect</strong> health, biometric, sexual orientation, religious, or government-ID data unless you voluntarily supply it for KYC with brokers (handled by them).</li>
              <li><strong>You / User / Customer:</strong> A natural person using the Services. Where a corporate signs up, you confirm you have authority to share users&apos; details.</li>
            </ul>
          </section>

          {/* 3. Categories of Data We Process */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3) Categories of Data We Process</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Identity & Contact:</strong> Name, email, phone, country, organization, role.</li>
              <li><strong>Account & Billing:</strong> Username, hashed passwords, subscription plan, invoices, GSTIN/VAT (if provided), UPI/UPI-ID or masked card tokens via payment processors.</li>
              <li><strong>Usage & Device:</strong> IP, device/OS, browser, timestamps, pages viewed, feature clicks, crash logs.</li>
              <li><strong>Communications:</strong> Support tickets, emails, Telegram/WhatsApp messages if you contact us.</li>
              <li><strong>Partner/Broker Referral Data:</strong> If you register via our IB/affiliate links, we may receive referral identifiers and status from those partners (no card or trading credentials).</li>
              <li><strong>Marketing Preferences:</strong> Opt-ins/opt-outs, campaign engagement.</li>
              <li><strong>Do Not Intentionally Collect:</strong> Trading account passwords or private keys. If you submit them accidentally, we delete upon discovery.</li>
            </ul>
          </section>

          {/* 4. Sources of Data */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4) Sources of Data</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Directly from you (forms, checkout, support).</li>
              <li>Automatically (cookies, telemetry).</li>
              <li>Partners (e.g., brokers/IBs confirming referral status).</li>
              <li>Public sources (your company website/LinkedIn if you contact us in a business capacity).</li>
            </ul>
          </section>

          {/* 5. Legal Bases */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5) Legal Bases (India / GDPR / CCPA)</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Consent:</strong> For optional cookies/marketing; for non-essential data uses.</li>
              <li><strong>Contractual Necessity:</strong> To create your account, deliver paid features, billing.</li>
              <li><strong>Legitimate Interests:</strong> Product analytics, security, fraud prevention, improving Services.</li>
              <li><strong>Legal Obligation:</strong> Tax/GST compliance, responding to lawful requests.</li>
              <li><strong>CCPA/CPRA:</strong> We <strong>do not sell</strong> personal information. We may <strong>&quot;share&quot;</strong> limited data for cross-context behavioral advertising <strong>only with your consent</strong>; you may opt-out at any time.</li>
            </ul>
          </section>

          {/* 6. Purposes of Processing */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6) Purposes of Processing</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Provide and operate the Services; account management; technical support.</li>
              <li>Measure, maintain, and improve performance, safety, reliability.</li>
              <li>Billing, tax invoices, prevention of fraud/abuse.</li>
              <li>Communicate important notices, service updates, security alerts.</li>
              <li>With consent: product news, offers, educational content (unsubscribe anytime).</li>
              <li>Compliance with applicable laws and enforcing our Terms.</li>
            </ul>
          </section>

          {/* 7. Cookies & Tracking */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7) Cookies & Tracking</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Essential Cookies</strong> (auth, security, load balancing) – always on.</li>
              <li><strong>Analytics Cookies</strong> (usage metrics) – consent-based where required.</li>
              <li><strong>Marketing/Ads</strong> – used only if you opt in.</li>
            </ul>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              You can manage preferences via our cookie banner or browser settings.
            </p>
          </section>

          {/* 8. Disclosures */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8) Disclosures (Who We Share With)</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Sub-Processors / Vendors:</strong> Cloud hosting, CDNs, email, analytics, payment gateways.</li>
              <li><strong>Professional Advisors:</strong> Auditors, legal counsel (under confidentiality).</li>
              <li><strong>Corporate Transactions:</strong> M&A, financing, asset transfer—with continuity safeguards.</li>
              <li><strong>Legal/Compliance:</strong> Courts, regulators, law enforcement when lawfully required.</li>
            </ul>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              We do <strong>not</strong> sell personal data.
            </p>
          </section>

          {/* 9. Cross-Border Transfers */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>9) Cross-Border Transfers</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Data may be processed in or transferred to countries outside your own. Where laws require, we implement appropriate safeguards (e.g., SCCs or equivalent). By using the Services, you consent to such transfers.
            </p>
          </section>

          {/* 10. Data Retention */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>10) Data Retention</h2>
            <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              We retain data for as long as needed for the purposes above, typically:
            </p>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Account data: while your account is active and for up to <strong>7 years</strong> thereafter for tax/legal records.</li>
              <li>Telemetry/analytics: <strong>12–36 months</strong> (aggregated thereafter).</li>
              <li>Support tickets: <strong>3–7 years</strong> depending on issue type.</li>
            </ul>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              We may retain logs to investigate abuse or comply with law.
            </p>
          </section>

          {/* 11. Security */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>11) Security</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              We use industry-standard controls: encrypted transport (TLS), encrypted storage for secrets, role-based access, least-privilege, logging, and monitoring. No system is 100% secure; residual risk remains.
            </p>
          </section>

          {/* 12. Your Rights */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>12) Your Rights</h2>
            <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>India (DPDP 2023):</strong> Right to access, correction, erasure, grievance redressal, and to nominate a person to exercise rights on your behalf.
            </p>
            <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>EEA/UK (GDPR/UK GDPR):</strong> Access, rectification, erasure, restriction, portability, objection, and withdrawal of consent; lodge a complaint with a supervisory authority.
            </p>
            <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>California (CCPA/CPRA):</strong> Know, delete, correct, opt-out of sharing, and non-discrimination rights.
            </p>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              To exercise rights, email <a href="mailto:support@fxlabs.ai" className="text-blue-500 hover:underline">support@fxlabs.ai</a>. We will verify your request and respond within statutory timelines.
            </p>
          </section>

          {/* 13. Children */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>13) Children</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              The Services are <strong>not</strong> for individuals under <strong>18</strong>. We do not knowingly collect children&apos;s data. If you believe a minor has provided data, contact us for deletion.
            </p>
          </section>

          {/* 14. Automated Decision-Making */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>14) Automated Decision-Making / Profiling</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              We may compute anonymized model scores (e.g., feature usage propensity) to improve UX. We do <strong>not</strong> make legal or similarly significant decisions solely by automated means.
            </p>
          </section>

          {/* 15. Third-Party Links */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>15) Third-Party Links & Broker Integrations</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Third-party websites, brokers, and tools are governed by their own policies. We are <strong>not responsible</strong> for their practices. Review their privacy terms before use.
            </p>
          </section>

          {/* 16. No Investment Advice */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>16) No Investment Advice</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Analytics and content are <strong>educational</strong>. We do <strong>not</strong> provide investment advice, portfolio management, or brokerage services.
            </p>
          </section>

          {/* 17. Changes */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>17) Changes to this Policy</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              We may update this Policy. Material changes will be notified via email or in-app. Continued use after the Effective Date constitutes acceptance.
            </p>
          </section>

          {/* 18. Contact */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>18) Contact & Grievance Redressal</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Privacy / Data Protection:</strong> <a href="mailto:support@fxlabs.ai" className="text-blue-500 hover:underline">support@fxlabs.ai</a></li>
              <li><strong>Registered Office:</strong> #253, Junnur Mudhol, Karnataka - 587204</li>
            </ul>
          </section>

        </div>
      </div>

      <InteractiveFooter />
    </div>
  )
}

export default PrivacyPolicy
