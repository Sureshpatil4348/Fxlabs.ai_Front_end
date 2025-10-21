// Core drawing types and interfaces converted to JavaScript
// Type annotations removed - use JSDoc comments for documentation if needed

/**
 * Drawing tool configuration
 */
export const DRAWING_TOOL_CONFIGS = {
  TrendLine: {
    color: '#8b5cf6',
    strokeWidth: 2,
    opacity: 1,
    dashArray: 'none'
  },
  HorizontalLine: {
    color: '#f97316',
    strokeWidth: 2,
    opacity: 1,
    dashArray: '5,5'
  },
  Fibonacci: {
    color: '#6366f1',
    strokeWidth: 2,
    opacity: 1,
    dashArray: 'none'
  }
};

// Fibonacci retracement levels
export const FIBONACCI_LEVELS = {
  '0.000': 0.000,
  '0.236': 0.236,
  '0.382': 0.382,
  '0.500': 0.500,
  '0.618': 0.618,
  '0.786': 0.786,
  '1.000': 1.000
};
