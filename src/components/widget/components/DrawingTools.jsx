import React, { useRef, useState } from 'react';

import { useChartStore } from '../stores/useChartStore';

export const DrawingTools = ({
  chartData,
  chartWidth,
  chartHeight
}) => {
  const { activeDrawingTool, drawings, addDrawing } = useChartStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const svgRef = useRef(null);

  // Generate unique ID for drawings
  const generateId = () => `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Convert chart coordinates to SVG coordinates (for future use)
  // const chartToSvg = (chartX: number, chartY: number) => {
  //   const svgX = (chartX / chartData.length) * chartWidth;
  //   const svgY = chartHeight - ((chartY - Math.min(...chartData.map(d => d.price))) / 
  //     (Math.max(...chartData.map(d => d.price)) - Math.min(...chartData.map(d => d.price)))) * chartHeight;
  //   return { x: svgX, y: svgY };
  // };

  // Get chart dimensions and price range
  const chartDimensions = React.useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 0, minTime: 0, maxTime: 0 };
    
    const prices = chartData.map(d => d.price).filter(p => p !== null && !isNaN(p));
    const times = chartData.map(d => d.timestamp).filter(t => t !== null && !isNaN(t));
    
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }, [chartData]);

  // Convert SVG coordinates to chart coordinates
  const svgToChart = (svgX, svgY) => {
    const { minPrice, maxPrice, minTime, maxTime } = chartDimensions;
    
    // Convert X coordinate (time)
    const chartX = minTime + (svgX / chartWidth) * (maxTime - minTime);
    
    // Convert Y coordinate (price) - SVG Y is inverted
    const chartY = minPrice + ((chartHeight - svgY) / chartHeight) * (maxPrice - minPrice);
    
    return { x: chartX, y: chartY };
  };

  // Convert chart coordinates to SVG coordinates
  const chartToSvg = (chartX, chartY) => {
    const { minPrice, maxPrice, minTime, maxTime } = chartDimensions;
    
    // Convert time to X coordinate
    const svgX = ((chartX - minTime) / (maxTime - minTime)) * chartWidth;
    
    // Convert price to Y coordinate - SVG Y is inverted
    const svgY = chartHeight - ((chartY - minPrice) / (maxPrice - minPrice)) * chartHeight;
    
    return { x: svgX, y: svgY };
  };

  // Handle mouse down for starting drawing
  const handleMouseDown = (event) => {
    if (!activeDrawingTool) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;
    const chartCoords = svgToChart(svgX, svgY);

    const newPoint = {
      x: svgX,
      y: svgY,
      time: chartCoords.x,
      price: chartCoords.y
    };

    if (activeDrawingTool === 'trendline' || activeDrawingTool === 'fibonacci') {
      // Need 2 points for trend line and fibonacci
      if (currentPoints.length === 0) {
        setCurrentPoints([newPoint]);
        setIsDrawing(true);
      } else if (currentPoints.length === 1) {
        const finalPoints = [...currentPoints, newPoint];
        setCurrentPoints([]);
        setIsDrawing(false);
        createDrawing(finalPoints);
      }
    } else if (activeDrawingTool === 'horizontal') {
      // Horizontal line needs only 1 point
      setCurrentPoints([newPoint]);
      setIsDrawing(false);
      createDrawing([newPoint]);
    } else if (activeDrawingTool === 'rectangle') {
      // Rectangle needs 2 points
      if (currentPoints.length === 0) {
        setCurrentPoints([newPoint]);
        setIsDrawing(true);
      } else if (currentPoints.length === 1) {
        const finalPoints = [...currentPoints, newPoint];
        setCurrentPoints([]);
        setIsDrawing(false);
        createDrawing(finalPoints);
      }
    }
  };

  // Create drawing object
  const createDrawing = (points) => {
    const colors = {
      trendline: '#8b5cf6',
      horizontal: '#f97316',
      rectangle: '#14b8a6',
      fibonacci: '#6366f1'
    };

    const drawing = {
      id: generateId(),
      type: activeDrawingTool,
      points,
      color: colors[activeDrawingTool] || '#000000',
      strokeWidth: 2,
      createdAt: Date.now()
    };

    addDrawing(drawing);
  };

  // Render drawing based on type
  const renderDrawing = (drawing) => {
    const { type, points, color, strokeWidth } = drawing;

    switch (type) {
      case 'trendline':
        if (points.length >= 2) {
          const svg1 = chartToSvg(points[0].time, points[0].price);
          const svg2 = chartToSvg(points[1].time, points[1].price);
          return (
            <line
              key={drawing.id}
              x1={svg1.x}
              y1={svg1.y}
              x2={svg2.x}
              y2={svg2.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="none"
            />
          );
        }
        break;

      case 'horizontal':
        if (points.length >= 1) {
          const svg = chartToSvg(points[0].time, points[0].price);
          return (
            <line
              key={drawing.id}
              x1={0}
              y1={svg.y}
              x2={chartWidth}
              y2={svg.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="5,5"
            />
          );
        }
        break;

      case 'rectangle':
        if (points.length >= 2) {
          const svg1 = chartToSvg(points[0].time, points[0].price);
          const svg2 = chartToSvg(points[1].time, points[1].price);
          const x = Math.min(svg1.x, svg2.x);
          const y = Math.min(svg1.y, svg2.y);
          const width = Math.abs(svg2.x - svg1.x);
          const height = Math.abs(svg2.y - svg1.y);
          
          return (
            <rect
              key={drawing.id}
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="none"
            />
          );
        }
        break;

      case 'fibonacci':
        if (points.length >= 2) {
          const svg1 = chartToSvg(points[0].time, points[0].price);
          const svg2 = chartToSvg(points[1].time, points[1].price);
          const startY = svg1.y;
          const endY = svg2.y;
          const diff = endY - startY;
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          
          return (
            <g key={drawing.id}>
              {/* Main trend line */}
              <line
                x1={svg1.x}
                y1={svg1.y}
                x2={svg2.x}
                y2={svg2.y}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray="none"
              />
              {/* Fibonacci levels */}
              {levels.map((level, index) => {
                const levelY = startY + (diff * level);
                return (
                  <line
                    key={`${drawing.id}-level-${index}`}
                    x1={svg1.x}
                    y1={levelY}
                    x2={svg2.x}
                    y2={levelY}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    opacity={0.7}
                  />
                );
              })}
            </g>
          );
        }
        break;

      default:
        return null;
    }
    return null;
  };

  // Render current drawing in progress
  const renderCurrentDrawing = () => {
    if (!isDrawing || currentPoints.length === 0) return null;

    const colorMap = {
      trendline: '#8b5cf6',
      horizontal: '#f97316',
      rectangle: '#14b8a6',
      fibonacci: '#6366f1'
    };
    const color = colorMap[activeDrawingTool || ''] || '#000000';
    const type = activeDrawingTool;

    if (type === 'trendline' || type === 'fibonacci') {
      if (currentPoints.length === 1) {
        const svg = chartToSvg(currentPoints[0].time, currentPoints[0].price);
        return (
          <line
            x1={svg.x}
            y1={svg.y}
            x2={svg.x}
            y2={svg.y}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="none"
            opacity={0.5}
          />
        );
      }
    } else if (type === 'rectangle') {
      if (currentPoints.length === 1) {
        const svg = chartToSvg(currentPoints[0].time, currentPoints[0].price);
        return (
          <rect
            x={svg.x}
            y={svg.y}
            width={0}
            height={0}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="none"
            opacity={0.5}
          />
        );
      }
    }

    return null;
  };

  return (
    <svg
      ref={svgRef}
      width={chartWidth}
      height={chartHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: activeDrawingTool ? 'all' : 'none',
        zIndex: 10
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Render all completed drawings */}
      {drawings.map(renderDrawing)}
      
      {/* Render current drawing in progress */}
      {renderCurrentDrawing()}
    </svg>
  );
};
