import React, { useState } from 'react';

const FAQSection = () => {
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const faqData = [
    {
      question: "What is FxLabs Prime?",
      answer: "FxLabs Prime is a smart trading tool. It helps you see market signals, news impact, and analysis in one place. We do not trade for you. You use our tools to make your own trading choices."
    },
    {
      question: "On which email id i will receive the alerts?",
      answer: "You will receive the alerts to the registered mail id"
    },
    {
      question: "How can I start using FxLabs Prime?",
      answer: "Just sign up on our website, choose a plan (Free, Quarterly, or Yearly), and pay online. After payment, you will get login details by email."
    },
    {
      question: "Can I use FxLabs Prime on my phone?",
      answer: "Yes. FxLabs Prime works on mobile, tablet, and computer. You only need internet and a browser to use it."
    },
    {
      question: "What if my payment fails?",
      answer: "If payment fails, you will not get access. Try again or use another card/bank method. If money was taken but no access is given, contact our support team."
    },
    {
      question: "Do you give refunds?",
      answer: "No refunds for normal use. Refunds are only given if:\n\n1.You paid twice by mistake.\n\n2.There was a system error and you could not use the service."
    },
    {
      question: "Is my data safe with FxLabs Prime?",
      answer: "Yes. We use strong security, encryption, and do not sell your data. Your info is safe and private."
    },
    {
      question: "What happens if I cancel my plan?",
      answer: "If you cancel, your plan will stop auto-renew. You can still use it until the end of the period you paid for, but no money will be returned."
    }
  ];

  // Show only first 2 FAQs on mobile by default, all on desktop
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

        {/* Show More/Less button - only visible on mobile */}
        <div className="md:hidden mt-6 text-center">
          <button
            onClick={() => setShowAllFaqs(!showAllFaqs)}
            className="inline-flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition duration-300 font-medium text-sm"
          >
            {showAllFaqs ? 'Show Less' : 'Show More'}
            <i className={`ml-1 text-sm transition-transform duration-300 ${showAllFaqs ? 'rotate-180' : ''}`}>
              ▼
            </i>
          </button>
        </div>
        
        <div className="mt-8 md:mt-12 text-center">
          <p className="text-lg md:text-xl mb-4 md:mb-6 text-[#19235d] dark:text-white transition-colors duration-300">Still have questions?</p>
          <a 
            href="https://t.me/fxlabsprime" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition duration-300"
          >
            <i className="fab fa-telegram mr-2 text-xl"></i> Ask on Telegram
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
