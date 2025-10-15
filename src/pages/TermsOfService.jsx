import { ArrowLeft } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

import InteractiveFooter from '../components/InteractiveFooter'
import Navbar from '../components/Navbar'
import { useTheme } from '../contexts/ThemeContext'

const TermsOfService = () => {
  const { isDarkMode } = useTheme()

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#19235d] text-white' : 'bg-gray-50 text-[#19235d]'}`}>
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link 
          to="/" 
          className={`inline-flex items-center mb-8 text-sm transition-colors ${
            isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-[#19235d]'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>
            Terms & Conditions
          </h1>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p><strong>Effective Date:</strong> 01/10/2025</p>
            <p><strong>Entity:</strong> HEXTECH ALGO - F.Z.C</p>
            <p><strong>Brand:</strong> FxLabs Prime</p>
          </div>
        </div>

        {/* Content */}
        <div className={`prose prose-lg max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
          
          {/* Table of Contents */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>Table of Contents</h2>
            <ol className={`list-decimal pl-6 space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Acceptance & Eligibility</li>
              <li>About FxLabs Prime (Nature of Services)</li>
              <li>Regulatory Notice (India & Other Jurisdictions)</li>
              <li>Account Registration & Security</li>
              <li>Plans, Billing, Taxes, Auto-Renewal, No Refunds</li>
              <li>Acceptable Use & Prohibited Conduct</li>
              <li>Third-Party Brokers, IB Links & Integrations</li>
              <li>Intellectual Property; Feedback</li>
              <li>Confidentiality</li>
              <li>No Investment / Financial Advice</li>
              <li>Risk Disclosure</li>
              <li>Availability, Support, and Modifications</li>
              <li>Indemnity</li>
              <li>Warranty Disclaimer</li>
              <li>Limitation of Liability</li>
              <li>Termination & Suspension</li>
              <li>Force Majeure</li>
              <li>Governing Law & Dispute Resolution (Arbitration)</li>
              <li>Export, Sanctions & Anti-Corruption</li>
              <li>Changes to Terms</li>
              <li>Notices & Contact</li>
            </ol>
          </section>

          {/* 1. Acceptance & Eligibility */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>1) Acceptance & Eligibility</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              By accessing or using FxLabs Prime, you agree to these Terms and our Privacy Policy. You must be <strong>18+</strong> and legally competent to contract.
            </p>
          </section>

          {/* 2. About FxLabs Prime */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>2) About FxLabs Prime (Nature of Services)</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              FxLabs Prime provides <strong>software, analytics dashboards, alerts, news analysis, charts, risk tools, and educational content</strong>. We <strong>do not</strong>: (a) execute trades, (b) manage money, or (c) give individualized financial advice.
            </p>
          </section>

          {/* 3. Regulatory Notice */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>3) Regulatory Notice (India & Other Jurisdictions)</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>India:</strong> Retail <strong>Forex trading in overseas pairs is restricted/illegal</strong> for Indian residents outside RBI-permitted channels. <strong>If you are an Indian resident, you may use FxLabs Prime only for education/research; you agree not to use it to violate Indian law.</strong></li>
              <li><strong>Your Responsibility:</strong> You must ensure your use complies with the laws of your jurisdiction.</li>
            </ul>
          </section>

          {/* 4. Account Registration */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>4) Account Registration & Security</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Provide accurate information, keep credentials confidential, and notify us of suspicious activity. You are responsible for actions under your account.
            </p>
          </section>

          {/* 5. Plans, Billing */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>5) Plans, Billing, Taxes, Auto-Renewal, No Refunds</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Fees:</strong> As displayed at checkout or in your order form. Prices may change on renewal.</li>
              <li><strong>Auto-Renewal:</strong> Subscriptions renew automatically unless cancelled before the cycle ends.</li>
              <li><strong>Taxes:</strong> Fees are <strong>exclusive of taxes</strong> (e.g., <strong>GST</strong>). Where applicable, we will collect and remit taxes; otherwise, you are responsible. Provide <strong>GSTIN</strong> if you need tax invoices.</li>
              <li><strong>No Refunds:</strong> All payments are <strong>final</strong> and <strong>non-refundable</strong> (see Refund Policy).</li>
              <li><strong>Chargebacks:</strong> Unwarranted chargebacks may lead to immediate suspension; you remain liable for amounts due plus reasonable recovery costs.</li>
            </ul>
          </section>

          {/* 6. Acceptable Use */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>6) Acceptable Use & Prohibited Conduct</h2>
            <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              You will <strong>not</strong>:
            </p>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Violate laws or third-party rights;</li>
              <li>Circumvent security, scrape excessively, or stress/attack the Services;</li>
              <li>Reverse-engineer, decompile, or create derivative works without permission;</li>
              <li>Upload malware, attempt unauthorized access, or interfere with other users;</li>
              <li>Use FxLabs Prime to signal or coordinate market manipulation, wash trading, or prohibited FX activity under your jurisdiction (including India).</li>
            </ul>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              We may throttle, suspend, or terminate accounts that breach this section.
            </p>
          </section>

          {/* 7. Third-Party Brokers */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>7) Third-Party Brokers, IB Links & Integrations</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              FxLabs Prime may provide <strong>introducing-broker (IB) or affiliate links</strong>. We do not control brokers, their pricing, swaps, or execution. Your relationship with a broker is governed by <strong>their</strong> terms. <strong>We are not a party</strong> to that contract, receive no trading credentials, and assume <strong>no liability</strong> for broker actions.
            </p>
          </section>

          {/* 8. Intellectual Property */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>8) Intellectual Property; Feedback</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              All Services, software, UI, content, and trademarks (including <strong>FxLabs Prime</strong>, a trademark of <strong>HEXTECH ALGO - F.Z.C</strong>) are our property or licensed. We grant you a <strong>limited, revocable, non-exclusive, non-transferable</strong> license to use the Services during your subscription.
            </p>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Feedback</strong> you provide may be used by us without restriction, without attribution or compensation.
            </p>
          </section>

          {/* 9. Confidentiality */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>9) Confidentiality</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Non-public information marked or reasonably understood as confidential that you disclose to us will be used only to provide Services and protected with reasonable safeguards. Exclusions: information that is public, independently developed, or lawfully obtained without confidentiality duties.
            </p>
          </section>

          {/* 10. No Investment Advice */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>10) No Investment / Financial Advice</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Content is <strong>educational</strong>. We are <strong>not</strong> a broker, RIA, or PMS/AIF. <strong>No signal, metric, backtest, or alert guarantees profit or suitability.</strong> You are solely responsible for decisions and outcomes.
            </p>
          </section>

          {/* 11. Risk Disclosure */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>11) Risk Disclosure</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              Trading financial markets involves substantial risk, including <strong>loss of principal</strong>. Volatility, slippage, outages, and news events can materially impact results. Historical performance is <strong>not</strong> indicative of future results.
            </p>
          </section>

          {/* 12. Availability */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>12) Availability, Support, and Modifications</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              We target high availability but <strong>do not guarantee</strong> uninterrupted or error-free service. We may modify, suspend, or discontinue features (including betas) with or without notice. Support channels and response times may vary by plan.
            </p>
          </section>

          {/* 13. Indemnity */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>13) Indemnity</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              You will indemnify and hold harmless <strong>HEXTECH ALGO - F.Z.C</strong>, its officers, employees, and agents from claims, damages, liabilities, costs, and expenses (including legal fees) arising from: (a) your use of the Services; (b) breach of these Terms; (c) violation of law or third-party rights.
            </p>
          </section>

          {/* 14. Warranty Disclaimer */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>14) Warranty Disclaimer</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              The Services are provided <strong>&quot;AS IS&quot; and &quot;AS AVAILABLE&quot;</strong>, without warranties of any kind, express or implied (merchantability, fitness, non-infringement, accuracy).
            </p>
          </section>

          {/* 15. Limitation of Liability */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>15) Limitation of Liability</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              To the maximum extent permitted by law, our <strong>aggregate liability</strong> arising out of or relating to the Services is limited to the <strong>fees you paid to us in the 12 months preceding the event giving rise to liability</strong>. We are <strong>not liable</strong> for indirect, incidental, special, consequential, punitive, or exemplary damages; loss of profits, revenue, data, or goodwill.
            </p>
          </section>

          {/* 16. Termination */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>16) Termination & Suspension</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              We may suspend or terminate access immediately for breaches or legal risk. You may cancel at any time; <strong>no refunds</strong> for amounts already paid. Upon termination, your license ends and access ceases, but sections reasonably intended to survive will survive.
            </p>
          </section>

          {/* 17. Force Majeure */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>17) Force Majeure</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              We are not responsible for delays or failures due to events beyond reasonable control (e.g., internet/hosting outages, cyberattacks, war, natural disasters, regulation).
            </p>
          </section>

          {/* 18. Governing Law */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>18) Governing Law & Dispute Resolution (Arbitration)</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              These Terms are governed by the laws of the <strong>United Arab Emirates</strong>. Disputes will be finally resolved by <strong>arbitration</strong> under the <strong>UAE Arbitration Law (Federal Law No. 6 of 2018)</strong> by a sole arbitrator appointed by mutual consent (or as per the applicable arbitration rules), <strong>seat and venue: Ajman, UAE</strong>, language English. Courts at <strong>Ajman, UAE</strong> have exclusive supervisory jurisdiction.
            </p>
          </section>

          {/* 19. Export */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>19) Export, Sanctions & Anti-Corruption</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              You represent you are not subject to sanctions and will not use the Services in sanctioned countries or for prohibited end-uses. You will comply with anti-bribery/anti-corruption laws (e.g., India&apos;s PCA, UK Bribery Act, FCPA).
            </p>
          </section>

          {/* 20. Changes */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>20) Changes to Terms</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              We may update these Terms; material updates will be notified in-app/email. Continued use after the Effective Date constitutes acceptance.
            </p>
          </section>

          {/* 21. Contact */}
          <section className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#19235d]'}`}>21) Notices & Contact</h2>
            <ul className={`list-disc pl-6 space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li><strong>Legal Notices / Arbitration Notices:</strong> <a href="mailto:support@fxlabsprime.com" className="text-blue-500 hover:underline">support@fxlabsprime.com</a></li>
              <li><strong>Registered Office:</strong> Ajman Free Zone C1 Building, Business District Ajman Free Zone, Premises Number B.C. 1301013, Makani No. 4442612247</li>
            </ul>
          </section>

        </div>
      </div>

      <InteractiveFooter />
    </div>
  )
}

export default TermsOfService
