import { Calendar, FileText, Users, Zap } from 'lucide-react';
import React from 'react';

import earningImage from '../earning-and-spending-money-in-internet-concept.svg';

const CommunitySection = () => {
  const benefits = [
    {
      icon: Users,
      title: 'Private Community',
      description: 'Direct access to experienced traders within the community of the best forex trading platform.',
    },
    {
      icon: Calendar,
      title: 'Monthly Live Webinars',
      description: 'Learn advanced strategies powered by AI-based forex trading platforms.',
    },
    {
      icon: FileText,
      title: 'Market Analysis Reports',
      description: 'Weekly insights on major pairs, enhanced by advanced AI forex trading software.',
    },
    {
      icon: Zap,
      title: 'System Updates',
      description: 'Get all future upgrades and enhancements to keep your Top forex trading platform operating at peak performance.',
    },
  ];

  return (
    <section id="community" className="py-14 md:py-16 px-4 md:px-6 w-full transition-colors duration-300">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12">
          <div className="w-full lg:w-1/2 flex flex-col text-center lg:text-left">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[#19235d] dark:text-white">
              Join The Community of <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 bg-clip-text text-transparent">Pro Traders </span>
            </h2>
           

            <div className="bg-white/50 dark:bg-[#19235d]/50 rounded-2xl p-6 mb-8 backdrop-blur-sm border border-gray-200/50 dark:border-[#19235d]/50 flex-grow">
              <h3 className="text-2xl font-bold mb-6 text-[#19235d] dark:text-white">What You Get:</h3>
              <ul className="space-y-4 text-left">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mt-1">
                        <IconComponent className="text-emerald-600 dark:text-emerald-400" size={16} />
                      </div>
                      <p className="ml-4 text-gray-700 dark:text-gray-300">
                        <strong className="text-[#19235d] dark:text-white">{benefit.title}</strong> – {benefit.description}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div>
              <a
                href="https://t.me/fxlabsprime"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 hover:from-emerald-500 hover:via-emerald-500 hover:to-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-[0_12px_40px_rgba(16,185,129,0.45)] hover:shadow-[0_16px_50px_rgba(16,185,129,0.55)] ring-1 ring-white/20 transition-all duration-300 transform hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Join the Community <i className="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <div className="w-full max-w-[600px] lg:max-w-full">
              <img 
                src={earningImage} 
                alt="Join the Community of Pro Traders Forex Trading Platform" 
                className="w-full h-auto hidden md:block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
