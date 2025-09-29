import { motion } from "framer-motion";
import { X, Rocket, Link as LinkIcon, Gift, Send } from "lucide-react";
import React, { useEffect } from "react";

import { useTheme } from "../contexts/ThemeContext";

const FreeTrialPopup = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  
  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-lg w-full p-8 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition`}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Rocket className="w-10 h-10 text-[#03c05d]" />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Get Your Free Trial of <span className="text-[#03c05d]">FXLAB</span>
          </h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mt-2`}>
            Unlock premium trading insights with just a quick registration.
          </p>
        </div>

        {/* Registration Links */}
        <div className="space-y-3">
          <a
            href="https://mycms.cmsprime.com/links/go/1487"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-[#03c05d]/10'} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} px-4 py-3 rounded-xl transition border ${isDarkMode ? 'border-gray-600' : 'border-[#03c05d]/20'}`}
          >
            <LinkIcon className="w-5 h-5 text-[#03c05d]" /> CMSPrime Registration
          </a>
          <a
            href="https://one.exnessonelink.com/a/ltmmprf9v8"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-[#03c05d]/10'} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} px-4 py-3 rounded-xl transition border ${isDarkMode ? 'border-gray-600' : 'border-[#03c05d]/20'}`}
          >
            <LinkIcon className="w-5 h-5 text-[#03c05d]" /> Exness Registration
          </a>
        </div>

        {/* Benefits */}
        <div className={`mt-6 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-[#03c05d]/10 to-[#03c05d]/5'} rounded-xl p-5 border ${isDarkMode ? 'border-gray-600' : 'border-[#03c05d]/20'}`}>
          <h3 className={`flex items-center gap-2 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
            <Gift className="w-5 h-5 text-[#03c05d]" /> Trial Benefits
          </h3>
          <ul className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
            <li>
              <span className="font-bold text-[#03c05d]">$1,000+</span> Deposit →{" "}
              <span className="font-semibold">1 Month Free Trial</span>
            </li>
            <li>
              <span className="font-bold text-[#03c05d]">$5,000+</span> Deposit →{" "}
              <span className="font-semibold">3 Months Free Trial</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.open('https://t.me/Fxlabs_ai', '_blank')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#03c05d] hover:bg-[#02a04a] text-white font-semibold shadow-lg hover:shadow-[#03c05d]/25 transition-all duration-300 transform hover:scale-105"
          >
            <Send className="w-5 h-5" /> Message Us on Telegram
          </button>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Telegram: Fxlabs_ai</p>
        </div>
      </motion.div>
    </div>
  );
};

export default FreeTrialPopup;
