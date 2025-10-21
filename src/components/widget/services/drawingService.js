import {
  DRAWING_TOOL_CONFIGS,
  FIBONACCI_LEVELS
} from '../types/drawing.js';

export class DrawingService {
  static instance;
  drawings = [];
  storageKey = 'tradingview-drawings';

  constructor() {
    this.loadDrawings();
  }

  static getInstance() {
    if (!DrawingService.instance) {
      DrawingService.instance = new DrawingService();
    }
    return DrawingService.instance;
  }

  /**
   * Convert pixel coordinates to chart coordinates
   */
  pixelToChart(pixelPoint, dimensions) {
    const { x, y } = pixelPoint;
    const { width, height, minPrice, maxPrice, minTime, maxTime } = dimensions;

    // Convert X coordinate (time)
    const time = minTime + (x / width) * (maxTime - minTime);

    // Convert Y coordinate (price) - SVG Y is inverted
    const price = minPrice + ((height - y) / height) * (maxPrice - minPrice);

    return { time, price };
  }

  /**
   * Convert chart coordinates to pixel coordinates
   */
  chartToPixel(chartPoint, dimensions) {
    const { time, price } = chartPoint;
    const { width, height, minPrice, maxPrice, minTime, maxTime } = dimensions;

    // Convert time to X coordinate
    const x = ((time - minTime) / (maxTime - minTime)) * width;

    // Convert price to Y coordinate - SVG Y is inverted
    const y = height - ((price - minPrice) / (maxPrice - minPrice)) * height;

    return { x, y };
  }

  /**
   * Validate drawing coordinates
   */
  validateDrawing(start, end, toolType, dimensions) {
    // Check if coordinates are within chart bounds
    if (start.x < 0 || start.x > dimensions.width || 
        start.y < 0 || start.y > dimensions.height ||
        end.x < 0 || end.x > dimensions.width || 
        end.y < 0 || end.y > dimensions.height) {
      return {
        isValid: false,
        error: 'Coordinates are outside chart bounds'
      };
    }

    // Check for identical coordinates (zero-length drawings)
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    if (distance < 5) { // Minimum 5 pixel distance
      return {
        isValid: false,
        error: 'Drawing is too short (minimum 5 pixels required)'
      };
    }

    // Tool-specific validations
    switch (toolType) {
      case 'TrendLine':
        // Trend lines need two distinct points
        if (Math.abs(end.x - start.x) < 10) {
          return {
            isValid: false,
            error: 'Trend line must span at least 10 pixels horizontally'
          };
        }
        break;
      
      case 'HorizontalLine':
        // Horizontal lines can have same X coordinates
        break;
      
      case 'Fibonacci':
        // Fibonacci needs two distinct points with significant price difference
        const startChart = this.pixelToChart(start, dimensions);
        const endChart = this.pixelToChart(end, dimensions);
        const priceDiff = Math.abs(endChart.price - startChart.price);
        const priceRange = dimensions.maxPrice - dimensions.minPrice;
        
        if (priceDiff < priceRange * 0.05) { // At least 5% of price range
          return {
            isValid: false,
            error: 'Fibonacci retracement requires at least 5% price range'
          };
        }
        break;
      
      default:
        // No specific validation for other tools
        break;
    }

    return { isValid: true };
  }

  /**
   * Create Trend Line drawing
   */
  createTrendLine(start, end, dimensions) {
    const startChart = this.pixelToChart(start, dimensions);
    const endChart = this.pixelToChart(end, dimensions);

    // Calculate slope and angle
    const deltaX = endChart.time - startChart.time;
    const deltaY = endChart.price - startChart.price;
    const slope = deltaX !== 0 ? deltaY / deltaX : 0;
    const angle = Math.atan(slope) * (180 / Math.PI);

    // Determine trend direction
    let trendType;
    if (Math.abs(angle) < 5) {
      trendType = 'horizontal';
    } else if (angle > 0) {
      trendType = 'upward';
    } else {
      trendType = 'downward';
    }

    // Calculate length
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const metadata = {
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: DRAWING_TOOL_CONFIGS.TrendLine.color,
      strokeWidth: DRAWING_TOOL_CONFIGS.TrendLine.strokeWidth,
      opacity: DRAWING_TOOL_CONFIGS.TrendLine.opacity,
      toolType: 'TrendLine',
      slope,
      angle,
      trendType,
      length
    };

    return {
      toolType: 'TrendLine',
      start: startChart,
      end: endChart,
      meta: metadata
    };
  }

  /**
   * Create Horizontal Line drawing
   */
  createHorizontalLine(start, end, dimensions, currentPrice) {
    const startChart = this.pixelToChart(start, dimensions);
    const endChart = this.pixelToChart(end, dimensions);

    // Use the Y coordinate from start point as the price level
    const priceLevel = startChart.price;

    // Determine if it's support or resistance
    const levelType = currentPrice > priceLevel ? 'resistance' : 'support';

    const metadata = {
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: DRAWING_TOOL_CONFIGS.HorizontalLine.color,
      strokeWidth: DRAWING_TOOL_CONFIGS.HorizontalLine.strokeWidth,
      opacity: DRAWING_TOOL_CONFIGS.HorizontalLine.opacity,
      toolType: 'HorizontalLine',
      priceLevel,
      levelType
    };

    return {
      toolType: 'HorizontalLine',
      start: { time: startChart.time, price: priceLevel },
      end: { time: endChart.time, price: priceLevel },
      meta: metadata
    };
  }

  /**
   * Create Fibonacci Retracement drawing
   */
  createFibonacci(start, end, dimensions) {
    const startChart = this.pixelToChart(start, dimensions);
    const endChart = this.pixelToChart(end, dimensions);

    // Determine high and low points
    const highPoint = startChart.price > endChart.price ? startChart : endChart;
    const lowPoint = startChart.price > endChart.price ? endChart : startChart;
    
    // Determine retracement direction
    const retracementDirection = startChart.price > endChart.price ? 'down' : 'up';

    // Calculate price range
    const priceRange = highPoint.price - lowPoint.price;

    // Calculate Fibonacci retracement levels
    const retracementLevels = {};
    Object.entries(FIBONACCI_LEVELS).forEach(([level, ratio]) => {
      const levelPrice = highPoint.price - (priceRange * ratio);
      retracementLevels[level] = levelPrice;
    });

    const metadata = {
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: DRAWING_TOOL_CONFIGS.Fibonacci.color,
      strokeWidth: DRAWING_TOOL_CONFIGS.Fibonacci.strokeWidth,
      opacity: DRAWING_TOOL_CONFIGS.Fibonacci.opacity,
      toolType: 'Fibonacci',
      retracementLevels,
      highPoint,
      lowPoint,
      retracementDirection
    };

    return {
      toolType: 'Fibonacci',
      start: startChart,
      end: endChart,
      meta: metadata
    };
  }

  /**
   * Create drawing based on tool type
   */
  createDrawing(toolType, start, end, dimensions, currentPrice) {
    // Validate drawing
    const validation = this.validateDrawing(start, end, toolType, dimensions);
    if (!validation.isValid) {
      console.warn('Drawing validation failed:', validation.error);
      return null;
    }

    // Create drawing based on tool type
    switch (toolType) {
      case 'TrendLine':
        return this.createTrendLine(start, end, dimensions);
      
      case 'HorizontalLine':
        if (currentPrice === undefined) {
          console.warn('Current price required for horizontal line');
          return null;
        }
        return this.createHorizontalLine(start, end, dimensions, currentPrice);
      
      case 'Fibonacci':
        return this.createFibonacci(start, end, dimensions);
      
      default:
        console.warn('Unknown tool type:', toolType);
        return null;
    }
  }

  /**
   * Add drawing to collection
   */
  addDrawing(drawing) {
    this.drawings.push(drawing);
    this.saveDrawings();
    console.log('Drawing added:', drawing);
  }

  /**
   * Remove drawing by ID
   */
  removeDrawing(id) {
    const index = this.drawings.findIndex(d => d.meta.id === id);
    if (index !== -1) {
      this.drawings.splice(index, 1);
      this.saveDrawings();
      console.log('Drawing removed:', id);
      return true;
    }
    return false;
  }

  /**
   * Get all drawings
   */
  getDrawings() {
    return [...this.drawings];
  }

  /**
   * Clear all drawings
   */
  clearAllDrawings() {
    this.drawings = [];
    this.saveDrawings();
    console.log('All drawings cleared');
  }

  /**
   * Get drawings by tool type
   */
  getDrawingsByType(toolType) {
    return this.drawings.filter(d => d.toolType === toolType);
  }

  /**
   * Update drawing
   */
  updateDrawing(id, updates) {
    const drawing = this.drawings.find(d => d.meta.id === id);
    if (drawing) {
      Object.assign(drawing.meta, updates, { updatedAt: Date.now() });
      this.saveDrawings();
      console.log('Drawing updated:', id);
      return true;
    }
    return false;
  }

  /**
   * Save drawings to localStorage
   */
  saveDrawings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.drawings));
    } catch (error) {
      console.error('Failed to save drawings:', error);
    }
  }

  /**
   * Load drawings from localStorage
   */
  loadDrawings() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.drawings = JSON.parse(saved);
        console.log('Drawings loaded:', this.drawings.length);
      }
    } catch (error) {
      console.error('Failed to load drawings:', error);
      this.drawings = [];
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export drawings as JSON
   */
  exportDrawings() {
    return JSON.stringify(this.drawings, null, 2);
  }

  /**
   * Import drawings from JSON
   */
  importDrawings(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        this.drawings = imported;
        this.saveDrawings();
        console.log('Drawings imported:', imported.length);
        return true;
      }
    } catch (error) {
      console.error('Failed to import drawings:', error);
    }
    return false;
  }

  /**
   * Get drawing statistics
   */
  getStatistics() {
    const byType = {
      TrendLine: 0,
      HorizontalLine: 0,
      Fibonacci: 0
    };

    let oldest = Date.now();
    let newest = 0;

    this.drawings.forEach(drawing => {
      byType[drawing.toolType]++;
      if (drawing.meta.createdAt < oldest) oldest = drawing.meta.createdAt;
      if (drawing.meta.createdAt > newest) newest = drawing.meta.createdAt;
    });

    return {
      total: this.drawings.length,
      byType,
      oldest,
      newest
    };
  }
}
