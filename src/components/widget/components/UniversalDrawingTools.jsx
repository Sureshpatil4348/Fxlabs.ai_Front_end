import React, { useRef, useMemo } from 'react';

import { useDrawingTools } from '../hooks/useDrawingTools';

export const UniversalDrawingTools = ({
  chartData,
  chartWidth,
  chartHeight,
  currentPrice,
  chartType,
  containerRef
}) => {
  const svgRef = useRef(null);
  const {
    activeTool,
    isDrawing,
    currentPoints,
    drawings,
    handleChartClick,
    cancelDrawing
  } = useDrawingTools();

  // Calculate chart dimensions
  const chartDimensions = useMemo(() => {
    if (chartData.length === 0) {
      return {
        width: chartWidth,
        height: chartHeight,
        minPrice: 0,
        maxPrice: 0,
        minTime: 0,
        maxTime: 0,
        priceRange: 0,
        timeRange: 0
      };
    }

    const prices = chartData.map(d => d.price).filter(p => p !== null && !isNaN(p));
    const times = chartData.map(d => d.timestamp).filter(t => t !== null && !isNaN(t));

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      width: chartWidth,
      height: chartHeight,
      minPrice,
      maxPrice,
      minTime,
      maxTime,
      priceRange: maxPrice - minPrice,
      timeRange: maxTime - minTime
    };
  }, [chartData, chartWidth, chartHeight]);

  // Handle mouse down for starting drawing
  const handleMouseDown = (event) => {
    if (!activeTool) return;

    let svgX, svgY;

    if (chartType === 'candlestick' && containerRef?.current) {
      // For candlestick charts, use the container's bounding rect
      const rect = containerRef.current.getBoundingClientRect();
      svgX = event.clientX - rect.left;
      svgY = event.clientY - rect.top;
    } else {
      // For recharts, use the SVG's bounding rect
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      svgX = event.clientX - rect.left;
      svgY = event.clientY - rect.top;
    }

    const pixelPoint = { x: svgX, y: svgY };

    // Handle the click through the drawing manager
    const success = handleChartClick(pixelPoint, chartDimensions, currentPrice);
    
    if (!success) {
      console.warn('Failed to process drawing click');
    }
  };

  // Handle escape key to cancel drawing
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && isDrawing) {
      cancelDrawing();
    }
  };

  // Convert chart coordinates to SVG coordinates
  const chartToSvg = (time, price) => {
    const { minPrice, maxPrice, minTime, maxTime } = chartDimensions;
    
    const x = ((time - minTime) / (maxTime - minTime)) * chartWidth;
    const y = chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    
    return { x, y };
  };

  // Render drawing based on type
  const renderDrawing = (drawing) => {
    const { toolType, start, end, meta } = drawing;
    const { color, strokeWidth, opacity } = meta;

    switch (toolType) {
      case 'TrendLine': {
        const svg1 = chartToSvg(start.time, start.price);
        const svg2 = chartToSvg(end.time, end.price);
        
        return (
          <line
            key={meta.id}
            x1={svg1.x}
            y1={svg1.y}
            x2={svg2.x}
            y2={svg2.y}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            strokeDasharray="none"
            className="drawing-line"
            data-drawing-id={meta.id}
          />
        );
      }

      case 'HorizontalLine': {
        const svg = chartToSvg(start.time, start.price);
        
        return (
          <line
            key={meta.id}
            x1={0}
            y1={svg.y}
            x2={chartWidth}
            y2={svg.y}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            strokeDasharray="5,5"
            className="drawing-line"
            data-drawing-id={meta.id}
          />
        );
      }

      case 'Fibonacci': {
        const svg1 = chartToSvg(start.time, start.price);
        const svg2 = chartToSvg(end.time, end.price);
        
        // Main trend line
        const mainLine = (
          <line
            key={`${meta.id}-main`}
            x1={svg1.x}
            y1={svg1.y}
            x2={svg2.x}
            y2={svg2.y}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            strokeDasharray="none"
            className="drawing-line"
            data-drawing-id={meta.id}
          />
        );

        // Fibonacci levels
        const levels = meta.retracementLevels ? Object.entries(meta.retracementLevels) : [];
        const fibonacciLines = levels.map(([level, price]) => {
          const levelSvg = chartToSvg(start.time, price);
          return (
            <line
              key={`${meta.id}-level-${level}`}
              x1={svg1.x}
              y1={levelSvg.y}
              x2={svg2.x}
              y2={levelSvg.y}
              stroke={color}
              strokeWidth={1}
              opacity={opacity * 0.7}
              strokeDasharray="2,2"
              className="drawing-line fibonacci-level"
              data-drawing-id={meta.id}
              data-level={level}
            />
          );
        });

        return (
          <g key={meta.id} data-drawing-id={meta.id}>
            {mainLine}
            {fibonacciLines}
          </g>
        );
      }

      default:
        return null;
    }
  };

  // Render current drawing in progress
  const renderCurrentDrawing = () => {
    if (!isDrawing || currentPoints.length === 0) return null;

    const colorMap = {
      TrendLine: '#8b5cf6',
      HorizontalLine: '#f97316',
      Fibonacci: '#6366f1'
    };
    const color = colorMap[activeTool] || '#000000';

    if (activeTool === 'TrendLine' || activeTool === 'Fibonacci') {
      if (currentPoints.length === 1) {
        return (
          <line
            x1={currentPoints[0].x}
            y1={currentPoints[0].y}
            x2={currentPoints[0].x}
            y2={currentPoints[0].y}
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            strokeDasharray="none"
            className="drawing-preview"
          />
        );
      }
    } else if (activeTool === 'HorizontalLine') {
      if (currentPoints.length === 1) {
        return (
          <line
            x1={0}
            y1={currentPoints[0].y}
            x2={chartWidth}
            y2={currentPoints[0].y}
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            strokeDasharray="5,5"
            className="drawing-preview"
          />
        );
      }
    }

    return null;
  };

  // For candlestick charts, render as div overlay
  if (chartType === 'candlestick') {
    return (
      <div
        role="button"
        className="absolute inset-0 z-10"
        style={{
          pointerEvents: activeTool ? 'all' : 'none',
          cursor: activeTool ? 'crosshair' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        tabIndex={activeTool ? 0 : -1}
        aria-label="Drawing canvas for chart annotations"
      >
        {/* Drawing instructions overlay */}
        {activeTool && (
          <div
            className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs"
            style={{ zIndex: 20 }}
          >
            {activeTool === 'TrendLine' && 'Click two points to draw trend line'}
            {activeTool === 'HorizontalLine' && 'Click to draw horizontal line'}
            {activeTool === 'Fibonacci' && 'Click two points to draw Fibonacci retracement'}
            {isDrawing && ' (Press ESC to cancel)'}
          </div>
        )}
      </div>
    );
  }

  // For recharts, render as SVG overlay
  return (
    <svg
      ref={svgRef}
      width={chartWidth}
      height={chartHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: activeTool ? 'all' : 'none',
        zIndex: 10,
        cursor: activeTool ? 'crosshair' : 'default'
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Render all completed drawings */}
      {drawings.map(renderDrawing)}
      
      {/* Render current drawing in progress */}
      {renderCurrentDrawing()}

      {/* Drawing instructions overlay */}
      {activeTool && (
        <text
          x={10}
          y={20}
          fill="#666"
          fontSize="12"
          className="drawing-instructions"
        >
          {activeTool === 'TrendLine' && 'Click two points to draw trend line'}
          {activeTool === 'HorizontalLine' && 'Click to draw horizontal line'}
          {activeTool === 'Fibonacci' && 'Click two points to draw Fibonacci retracement'}
          {isDrawing && ' (Press ESC to cancel)'}
        </text>
      )}
    </svg>
  );
};
