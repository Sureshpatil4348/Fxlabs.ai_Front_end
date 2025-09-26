import { motion } from "framer-motion";
import { Trophy, Users } from "lucide-react";
import React from "react";

const SuccessStories = () => {
  return (
    <section className="relative py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Stories Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative mb-4 sm:mb-6"
        >
            <div className="bg-[#03c05d] rounded-2xl p-3 sm:p-4 shadow-xl overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-16 sm:w-20 h-16 sm:h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
                  🎉 Success Stories!
                </h2>
                <p className="text-white/90 text-sm sm:text-base mt-1">
                  150+ successful traders now using our proven system
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Community Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-3xl p-3 sm:p-4 md:p-6 shadow-2xl border border-blue-700/50 dark:border-blue-600/50">
            
            {/* Proven Track Record Label */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-[#03c05d] text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide">
                Proven Track Record
              </div>
            </div>

            {/* Main Title */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center mb-3 sm:mb-4 leading-tight">
              Join Our Established Trading Community
            </h3>

            {/* Description */}
            <p className="text-white text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed px-4">
              Our founding members have generated consistent profits using our proven system.{" "}
              <span className="text-[#03c05d] font-semibold">
                Join 150+ successful traders today!
              </span>
            </p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              
              {/* Active Traders */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-blue-800/50 dark:bg-blue-700/50 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center border border-blue-600/30 dark:border-blue-500/30"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#03c05d] mb-2">
                  150+
                </div>
                <div className="text-white text-sm sm:text-base font-medium">
                  Active Traders
                </div>
              </motion.div>

              {/* Track Record */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="bg-blue-800/50 dark:bg-blue-700/50 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center border border-blue-600/30 dark:border-blue-500/30"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#03c05d] mb-2">
                  6-months
                </div>
                <div className="text-white text-sm sm:text-base font-medium">
                  Track Record
                </div>
              </motion.div>

              {/* Total Profits */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
                className="bg-blue-800/50 dark:bg-blue-700/50 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center border border-blue-600/30 dark:border-blue-500/30"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#03c05d] mb-2">
                  $230k+
                </div>
                <div className="text-white text-sm sm:text-base font-medium">
                  Total Profits Generated
                </div>
              </motion.div>

            </div>

            {/* Join Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              viewport={{ once: true }}
              className="flex justify-center mb-3 sm:mb-4"
            >
              <button className="bg-[#03c05d] hover:bg-[#02a04a] text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-2xl text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-xl">
                Join Successful Traders
              </button>
            </motion.div>

            {/* Community Feature */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-white/80 dark:text-white/70 text-xs sm:text-sm text-center px-4"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Active community with daily support and results sharing</span>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default SuccessStories;
