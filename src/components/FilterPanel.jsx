import { Filter, SortAsc, SortDesc, X, RotateCcw } from 'lucide-react';
import React, { useState, useEffect } from 'react';

/**
 * Comprehensive Filter Panel Component
 * Provides filtering and sorting options for trading data
 */
const FilterPanel = ({ 
  onFilterChange, 
  onSortChange, 
  initialFilters = {},
  initialSort = { by: 'rsi', order: 'desc' },
  className = ""
}) => {
  const [filters, setFilters] = useState({
    rsiRange: { min: 0, max: 100 },
    rfiRange: { min: -1, max: 1 },
    pairType: 'all', // 'core', 'extended', 'all'
    signal: 'all', // 'bullish', 'bearish', 'neutral', 'all'
    volume: 'all', // 'high', 'medium', 'low', 'all'
    ...initialFilters
  });

  const [sortBy, setSortBy] = useState(initialSort.by);
  const [sortOrder, setSortOrder] = useState(initialSort.order);
  const [isExpanded, setIsExpanded] = useState(false);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange && onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Notify parent of sort changes
  useEffect(() => {
    onSortChange && onSortChange({ by: sortBy, order: sortOrder });
  }, [sortBy, sortOrder, onSortChange]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleRangeChange = (filterType, rangeType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        [rangeType]: parseInt(value)
      }
    }));
  };

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setFilters({
      rsiRange: { min: 0, max: 100 },
      rfiRange: { min: -1, max: 1 },
      pairType: 'all',
      signal: 'all',
      volume: 'all'
    });
    setSortBy('rsi');
    setSortOrder('desc');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.rsiRange.min !== 0 || filters.rsiRange.max !== 100) count++;
    if (filters.rfiRange.min !== -1 || filters.rfiRange.max !== 1) count++;
    if (filters.pairType !== 'all') count++;
    if (filters.signal !== 'all') count++;
    if (filters.volume !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters & Sorting</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetFilters}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Sort Options */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'rsi', label: 'RSI' },
            { key: 'rfi', label: 'RFI Score' },
            { key: 'change', label: 'Price Change' },
            { key: 'volume', label: 'Volume' },
            { key: 'symbol', label: 'Symbol' }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => handleSortChange(option.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 ${
                sortBy === option.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{option.label}</span>
              {sortBy === option.key && (
                sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* RSI Range Filter */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              RSI Range: {filters.rsiRange.min} - {filters.rsiRange.max}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rsi-min-range" className="block text-xs text-gray-500 mb-1">Min RSI</label>
                <input
                  id="rsi-min-range"
                  type="range"
                  min="0"
                  max="100"
                  value={filters.rsiRange.min}
                  onChange={(e) => handleRangeChange('rsiRange', 'min', e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">{filters.rsiRange.min}</div>
              </div>
              <div>
                <label htmlFor="rsi-max-range" className="block text-xs text-gray-500 mb-1">Max RSI</label>
                <input
                  id="rsi-max-range"
                  type="range"
                  min="0"
                  max="100"
                  value={filters.rsiRange.max}
                  onChange={(e) => handleRangeChange('rsiRange', 'max', e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">{filters.rsiRange.max}</div>
              </div>
            </div>
          </div>

          {/* RFI Range Filter */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              RFI Range: {filters.rfiRange.min.toFixed(2)} - {filters.rfiRange.max.toFixed(2)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rfi-min-range" className="block text-xs text-gray-500 mb-1">Min RFI</label>
                <input
                  id="rfi-min-range"
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={filters.rfiRange.min}
                  onChange={(e) => handleRangeChange('rfiRange', 'min', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">{filters.rfiRange.min.toFixed(2)}</div>
              </div>
              <div>
                <label htmlFor="rfi-max-range" className="block text-xs text-gray-500 mb-1">Max RFI</label>
                <input
                  id="rfi-max-range"
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={filters.rfiRange.max}
                  onChange={(e) => handleRangeChange('rfiRange', 'max', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">{filters.rfiRange.max.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Pair Type Filter */}
          <div>
            <label htmlFor="pair-type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Pair Type
            </label>
            <select
              id="pair-type-filter"
              value={filters.pairType}
              onChange={(e) => handleFilterChange('pairType', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Pairs</option>
              <option value="core">Core Pairs (Major)</option>
              <option value="extended">Extended Pairs (Crosses)</option>
            </select>
          </div>

          {/* Signal Filter */}
          <div>
            <label htmlFor="signal-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Signal Type
            </label>
            <select
              id="signal-filter"
              value={filters.signal}
              onChange={(e) => handleFilterChange('signal', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Signals</option>
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Volume Filter */}
          <div>
            <label htmlFor="volume-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Volume Level
            </label>
            <select
              id="volume-filter"
              value={filters.volume}
              onChange={(e) => handleFilterChange('volume', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Volumes</option>
              <option value="high">High Volume</option>
              <option value="medium">Medium Volume</option>
              <option value="low">Low Volume</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
