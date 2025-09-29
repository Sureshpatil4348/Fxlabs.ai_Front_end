import { motion } from "framer-motion";
import { X, Rocket, Link as LinkIcon, Gift, Send } from "lucide-react";
import React, { useEffect } from "react";

const FreeTrialPopup = ({ isOpen, onClose }) => {
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
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Rocket className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Get Your Free Trial of <span className="text-indigo-600">FXLAB</span>
          </h2>
          <p className="text-gray-500 mt-2">
            Unlock premium trading insights with just a quick registration.
          </p>
        </div>

        {/* Registration Links */}
        <div className="space-y-3">
          <a
            href="https://mycms.cmsprime.com/links/go/1487"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-100 hover:bg-indigo-50 text-gray-800 px-4 py-3 rounded-xl transition"
          >
            <LinkIcon className="w-5 h-5 text-indigo-600" /> CMSPrime Registration
          </a>
          <a
            href="https://one.exnessonelink.com/a/ltmmprf9v8"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-100 hover:bg-indigo-50 text-gray-800 px-4 py-3 rounded-xl transition"
          >
            <LinkIcon className="w-5 h-5 text-indigo-600" /> Exness Registration
          </a>
        </div>

        {/* Benefits */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
            <Gift className="w-5 h-5 text-indigo-600" /> Trial Benefits
          </h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>
              <span className="font-bold text-indigo-600">$1,000+</span> Deposit →{" "}
              <span className="font-semibold">1 Month Free Trial</span>
            </li>
            <li>
              <span className="font-bold text-indigo-600">$5,000+</span> Deposit →{" "}
              <span className="font-semibold">3 Months Free Trial</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.open('https://t.me/Fxlabs_ai', '_blank')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 transition"
          >
            <Send className="w-5 h-5" /> Message Us on Telegram
          </button>
          <p className="mt-2 text-sm text-gray-500">Telegram: Fxlabs_ai</p>
        </div>
      </motion.div>
    </div>
  );
};

export default FreeTrialPopup;
