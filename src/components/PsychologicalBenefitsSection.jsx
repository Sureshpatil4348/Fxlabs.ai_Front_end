import { Heart, Target, Trophy } from 'lucide-react';
import React from 'react';

const PsychologicalBenefitsSection = () => {
  return (
    <section className="py-14 md:py-16 px-4 md:px-6 w-full transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 md:mb-16 text-gray-900 dark:text-white transition-colors duration-300">
          Built with <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent">Trader Psychology</span> in Mind
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 justify-items-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-7 feature-card transition-colors duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 sm:mb-6 mx-auto transition-colors duration-300">
              <Heart className="text-green-600 dark:text-green-400 w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300" />
            </div>
            <h3 className="text-sm sm:text-xl font-bold text-center mb-2 sm:mb-4 text-[#19235d] dark:text-white transition-colors duration-300">Reduce Emotional Trading</h3>
            <p className="hidden sm:block text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base transition-colors duration-300">
              Automation removes impulsive decisions and emotional responses that often lead to trading losses.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-7 feature-card transition-colors duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 sm:mb-6 mx-auto transition-colors duration-300">
              <Target className="text-green-600 dark:text-green-400 w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300" />
            </div>
            <h3 className="text-sm sm:text-xl font-bold text-center mb-2 sm:mb-4 text-[#19235d] dark:text-white transition-colors duration-300">Enhance Discipline</h3>
            <p className="hidden sm:block text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base transition-colors duration-300">
              Predefined strategies enforce consistent trading behavior and keep you aligned with your long-term goals.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-7 feature-card transition-colors duration-300 col-span-2 sm:col-span-2 md:col-span-1 justify-self-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 sm:mb-6 mx-auto transition-colors duration-300">
              <Trophy className="text-green-600 dark:text-green-400 w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300" />
            </div>
            <h3 className="text-sm sm:text-xl font-bold text-center mb-2 sm:mb-4 text-[#19235d] dark:text-white transition-colors duration-300">Build Confidence</h3>
            <p className="hidden sm:block text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base transition-colors duration-300">
              Transparent operations and real-time data foster trust in the system and your trading approach.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PsychologicalBenefitsSection;
