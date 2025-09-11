import React from 'react';

/**
 * Sparkline Chart Component
 * Displays a simple line chart for price visualization
 */
const SparklineChart = ({ 
  data = [], 
  width = 60, 
  height = 20, 
  color = '#3B82F6',
  className = '' 
}) => {
  if (!data || data.length < 2) {
    return (
      <div 
        className={`flex items-center justify-center text-gray-400 text-xs ${className}`}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  // Extract price values and normalize them
  const prices = data.map(point => point.price || point.value || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // If all prices are the same, show a flat line
  if (priceRange === 0) {
    const y = height / 2;
    return (
      <svg width={width} height={height} className={className}>
        <line
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    );
  }

  // Create path points
  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * width;
    const y = height - ((price - minPrice) / priceRange) * height;
    return `${x},${y}`;
  }).join(' ');

  // Determine if the trend is up or down
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isUpward = lastPrice > firstPrice;
  const lineColor = isUpward ? '#10B981' : '#EF4444'; // Green for up, red for down

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Mini Sparkline for compact display
 */
export const MiniSparkline = ({ data, className = '' }) => (
  <SparklineChart 
    data={data} 
    width={40} 
    height={16} 
    className={className}
  />
);

/**
 * Standard Sparkline for normal display
 */
export const StandardSparkline = ({ data, className = '' }) => (
  <SparklineChart 
    data={data} 
    width={60} 
    height={20} 
    className={className}
  />
);

export default SparklineChart;
