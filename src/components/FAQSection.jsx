import React, { useState } from 'react';

const FAQSection = () => {
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const faqData = [
    {
      question: "What is FxLabs Prime?",
      answer: "FxLabs Prime is a smart trading tool designed to be the best forex trading platform for analysis. It uses artificial intelligence for forex trading to help you see precise market signals, high-impact news, and confluence analysis in one place. We do not trade for you; you use our advanced AI forex trading software and tools to make your own informed trading choices."
    },
    {
      question: "On which email ID will I receive the alerts from the Top forex trading platform?",
      answer: "You will receive the instant notifications and alerts to the registered email ID associated with your Top forex trading platform account."
    },
    {
      question: "What level of support and assistance is included after I purchase the Top forex trading platform?",
      answer: "When you choose our Top forex trading platform, you receive immediate value, including instant access to your system, a link to our private Telegram community for direct communication with experienced traders, and step-by-step setup assistance to get you trading within minutes."
    },
    {
      question: "Is the Multi-Time Frame Analysis feature powered by artificial intelligence for forex trading adaptable to all market conditions?",
      answer: "Yes. The core advantage of using artificial intelligence for forex trading is its adaptability. Our AI-based forex trading platforms continuously analyze complex data patterns to identify trends and opportunities, making the system effective and responsive across all market conditions, whether ranging or trending."
    },
    {
      question: "Can I calculate my lot size and manage risk with the smart money management tools on this Top forex trading platform?",
      answer: "Absolutely. Risk management is essential on the best forex trading platform. Our platform includes a precise Lotsize calculator and offers automated summaries with stop-loss guidance, ensuring disciplined risk control, which is a hallmark of the Top forex trading platform."
    }
  ];

  // Show only first 2 FAQs by default
  const visibleFaqs = showAllFaqs ? faqData : faqData.slice(0, 2);

  return (
    <section id="faq" className="py-12 md:py-16 px-4 md:px-6 w-full transition-colors duration-300">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16 text-[#19235d] dark:text-white transition-colors duration-300">
          Frequently Asked <span className="gold-text">Questions</span>
        </h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6">
          {visibleFaqs.map((faq, index) => (
            <div key={index} className="bg-white dark:bg-[#19235d] rounded-lg shadow-md p-6 transition-colors duration-300">
              <h3 className="text-xl font-bold mb-3 text-[#19235d] dark:text-white transition-colors duration-300">
                {faq.question}
              </h3>
              <p className="text-[#19235d] dark:text-gray-300 transition-colors duration-300 whitespace-pre-line">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Show More/Less button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAllFaqs(!showAllFaqs)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-full font-semibold text-base shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
          >
            {showAllFaqs ? 'Show Less' : 'Show More FAQs'}
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${showAllFaqs ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
