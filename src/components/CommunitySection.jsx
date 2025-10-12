import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Calendar, FileText, Users, Zap } from 'lucide-react';
import React from 'react';

const CommunitySection = () => {
  const benefits = [
    {
      icon: Users,
      title: 'Private Community',
      description: 'Direct access to experienced traders',
    },
    {
      icon: Calendar,
      title: 'Monthly Live Webinars',
      description: 'Learn advanced strategies',
    },
    {
      icon: FileText,
      title: 'Market Analysis Reports',
      description: 'Weekly insights on major pairs',
    },
    {
      icon: Zap,
      title: 'System Updates',
      description: 'Get all future upgrades',
    },
  ];

  return (
    <section id="community" className="py-14 md:py-16 px-4 md:px-6 w-full transition-colors duration-300">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Join 250+ <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 bg-clip-text text-transparent">Successful Traders</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">

            </p>

            <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">What You Get:</h3>
              <ul className="space-y-4 text-left">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mt-1">
                        <IconComponent className="text-emerald-600 dark:text-emerald-400" size={16} />
                      </div>
                      <p className="ml-4 text-gray-700 dark:text-gray-300">
                        <strong className="text-gray-900 dark:text-white">{benefit.title}</strong> – {benefit.description}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div className="mt-auto">
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
            <div style={{
              width: '100%',
              maxWidth: '800px',
              height: 'auto',
              aspectRatio: '1'
            }}>
              <DotLottieReact
                src="https://lottie.host/5aac16a1-7616-456a-b1e9-b23092a2e61a/qzjLKUxjiD.lottie"
                loop
                autoplay
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
