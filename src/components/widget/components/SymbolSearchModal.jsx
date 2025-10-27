import React, { useState, useEffect, useRef } from 'react';

import { CORE_PAIRS, EXTENDED_PAIRS, PRECIOUS_METALS_PAIRS, CRYPTO_PAIRS } from '../../../constants/pairs';
import { formatSymbolDisplay } from '../../../utils/formatters';

const SymbolSearchModal = ({ isOpen, onClose, onSymbolSelect, currentSymbol }) => {
  const [searchQuery, setSearchQuery] = useState(currentSymbol || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All sources');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Helper function to create symbol descriptions
  const getSymbolDescription = (symbol) => {
    const descriptions = {
      // Major pairs (7)
      'EURUSD': 'Euro / U.S. Dollar',
      'GBPUSD': 'British Pound / U.S. Dollar',
      'USDJPY': 'U.S. Dollar / Japanese Yen',
      'USDCHF': 'U.S. Dollar / Swiss Franc',
      'AUDUSD': 'Australian Dollar / U.S. Dollar',
      'USDCAD': 'U.S. Dollar / Canadian Dollar',
      'NZDUSD': 'New Zealand Dollar / U.S. Dollar',
      
      // EUR Crosses (6)
      'EURGBP': 'Euro / British Pound',
      'EURJPY': 'Euro / Japanese Yen',
      'EURCHF': 'Euro / Swiss Franc',
      'EURAUD': 'Euro / Australian Dollar',
      'EURCAD': 'Euro / Canadian Dollar',
      'EURNZD': 'Euro / New Zealand Dollar',
      
      // GBP Crosses (5)
      'GBPJPY': 'British Pound / Japanese Yen',
      'GBPCHF': 'British Pound / Swiss Franc',
      'GBPAUD': 'British Pound / Australian Dollar',
      'GBPCAD': 'British Pound / Canadian Dollar',
      'GBPNZD': 'British Pound / New Zealand Dollar',
      
      // AUD Crosses (4)
      'AUDJPY': 'Australian Dollar / Japanese Yen',
      'AUDCHF': 'Australian Dollar / Swiss Franc',
      'AUDCAD': 'Australian Dollar / Canadian Dollar',
      'AUDNZD': 'Australian Dollar / New Zealand Dollar',
      
      // NZD Crosses (3)
      'NZDJPY': 'New Zealand Dollar / Japanese Yen',
      'NZDCHF': 'New Zealand Dollar / Swiss Franc',
      'NZDCAD': 'New Zealand Dollar / Canadian Dollar',
      
      // CAD Crosses (2)
      'CADJPY': 'Canadian Dollar / Japanese Yen',
      'CADCHF': 'Canadian Dollar / Swiss Franc',
      
      // CHF Crosses (1)
      'CHFJPY': 'Swiss Franc / Japanese Yen',
      
      // Precious Metals (2)
      'XAUUSD': 'Gold / U.S. Dollar',
      'XAGUSD': 'Silver / U.S. Dollar',
      
      // Cryptocurrencies (2)
      'BTCUSD': 'Bitcoin / U.S. Dollar',
      'ETHUSD': 'Ethereum / U.S. Dollar',
    };
    return descriptions[symbol] || symbol;
  };

  // Helper function to get symbol type
  const getSymbolType = (symbol) => {
    if (PRECIOUS_METALS_PAIRS.includes(symbol)) return 'precious metal';
    if (CRYPTO_PAIRS.includes(symbol)) return 'cryptocurrency';
    return 'forex';
  };

  // Helper function to get symbol source
  const getSymbolSource = (_symbol) => {
    const sources = ['OANDA', 'FOREXCOM', 'FXCM', 'Pepperstone', 'FXOpen'];
    return sources[Math.floor(Math.random() * sources.length)];
  };

  // All available symbols from the system (32 total)
  const ALL_SYMBOLS = [...CORE_PAIRS, ...EXTENDED_PAIRS, ...PRECIOUS_METALS_PAIRS, ...CRYPTO_PAIRS];
  
  // Generate symbols data from constants with proper categorization
  const symbolsData = {
    All: ALL_SYMBOLS.map(symbol => ({
      symbol,
      description: getSymbolDescription(symbol),
      source: getSymbolSource(symbol),
      type: getSymbolType(symbol)
    })),
    Forex: [...CORE_PAIRS, ...EXTENDED_PAIRS].map(symbol => ({
      symbol,
      description: getSymbolDescription(symbol),
      source: getSymbolSource(symbol),
      type: 'forex'
    })),
    CFD: PRECIOUS_METALS_PAIRS.map(symbol => ({
      symbol,
      description: getSymbolDescription(symbol),
      source: getSymbolSource(symbol),
      type: 'precious metal'
    })),
    Crypto: CRYPTO_PAIRS.map(symbol => ({
      symbol,
      description: getSymbolDescription(symbol),
      source: getSymbolSource(symbol),
      type: 'cryptocurrency'
    })),
  };

  const categories = ['All', 'Forex', 'CFD', 'Crypto'];
  const sources = ['All sources', 'OANDA', 'FOREXCOM', 'FXCM', 'Pepperstone', 'FXOpen', 'Binance', 'Coinbase', 'Kraken', 'NASDAQ'];

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter symbols based on search query and category
  // Supports queries like "eurusd" and "eur/usd"
  const normalize = (s = '') => String(s).toLowerCase().replace(/\//g, '');
  const filteredSymbols = symbolsData[selectedCategory]?.filter((symbol) => {
    const queryLc = String(searchQuery || '').toLowerCase();
    const queryNorm = normalize(searchQuery || '');
    const symLc = symbol.symbol.toLowerCase();
    const symNorm = normalize(symbol.symbol);
    const displayLc = formatSymbolDisplay(symbol.symbol).toLowerCase();
    return (
      symLc.includes(queryLc) ||
      symNorm.includes(queryNorm) ||
      displayLc.includes(queryLc) ||
      symbol.description.toLowerCase().includes(queryLc)
    );
  }) || [];

  const handleSymbolClick = (symbol) => {
    onSymbolSelect(symbol.symbol);
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[80vh] max-h-[600px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Symbol Search</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for symbols..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <span className="text-sm font-medium text-gray-500">SYMBOL</span>
              <span className="text-sm font-medium text-gray-500">DESCRIPTION</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{selectedSource}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showSourceDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {sources.map((source) => (
                      <button
                        key={source}
                        onClick={() => {
                          setSelectedSource(source);
                          setShowSourceDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-2">
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map((symbol, index) => (
                <div
                  key={`${symbol.symbol}-${symbol.source}-${index}`}
                  onClick={() => handleSymbolClick(symbol)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSymbolClick(symbol);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-8">
                    <span className="text-blue-600 font-medium text-sm">{formatSymbolDisplay(symbol.symbol)}</span>
                    <span className="text-gray-700 text-sm">{symbol.description}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{symbol.type}</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {symbol.source.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">{symbol.source}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No symbols found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            Simply start typing while on the chart to pull up this search box
          </p>
        </div>
      </div>
    </div>
  );
};

export default SymbolSearchModal;
