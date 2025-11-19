import { Download, MessageCircle, Rocket, Settings } from 'lucide-react';
import React from 'react';

const AfterPurchaseSection = () => {
  const steps = [
    {
      icon: Download,
      title: 'Instant Access',
      description: "You'll receive login details to start using your system immediately."
    },
    {
      icon: MessageCircle,
      title: 'Telegram Support',
      description: "You will receive the link to join our private community group for the Top forex trading platform.",
    },
    {
      icon: Settings,
      title: 'Setup Assistance',
      description: 'Follow our step-by-step guide or get personal help to quickly set up your AI forex trading software.',
    },
    {
      icon: Rocket,
      title: 'Start Trading',
      description: 'Be up and running within 2 minutes on your preferred device, leveraging artificial intelligence for forex trading.',
    },
  ];

  return (
    <section className="py-14 md:py-16 px-4 md:px-6 w-full">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white dark:bg-[#19235d] rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center p-8 sm:p-10 text-white text-center">
            <div>

              <h3 className="text-2xl font-bold">What Happens Next?</h3>
            </div>
          </div>
          <div className="p-8 md:p-10 md:w-2/3">
            <h3 className="text-2xl font-bold mb-6 text-[#19235d] dark:text-white text-center md:text-left">After You Purchase the Best Forex Trading Platform:</h3>
            <ol className="space-y-4">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mr-4 mt-1 shadow-md">
                    <step.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-left">
                    <strong className="text-[#19235d] dark:text-white">{step.title}:</strong> {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AfterPurchaseSection;
