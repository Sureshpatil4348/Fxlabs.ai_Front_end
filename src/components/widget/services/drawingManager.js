import { DrawingService } from './drawingService.js';

export class DrawingManager {
  static instance;
  drawingService;
  state;
  listeners = [];

  constructor() {
    this.drawingService = DrawingService.getInstance();
    this.state = {
      activeTool: null,
      isDrawing: false,
      currentPoints: [],
      drawings: this.drawingService.getDrawings(),
      selectedDrawing: null
    };
  }

  static getInstance() {
    if (!DrawingManager.instance) {
      DrawingManager.instance = new DrawingManager();
    }
    return DrawingManager.instance;
  }

  /**
   * Set active drawing tool
   */
  setActiveTool(tool) {
    this.state.activeTool = tool;
    this.state.isDrawing = false;
    this.state.currentPoints = [];
    this.state.selectedDrawing = null;
    this.notifyListeners();
    console.log('Active tool set:', tool);
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Handle mouse click on chart
   */
  handleChartClick(pixelPoint, dimensions, currentPrice) {
    if (!this.state.activeTool) {
      console.log('No active tool selected');
      return false;
    }

    // Add point to current drawing
    this.state.currentPoints.push(pixelPoint);
    
    // Check if we have enough points for the current tool
    const requiredPoints = this.getRequiredPoints(this.state.activeTool);
    
    if (this.state.currentPoints.length >= requiredPoints) {
      // Complete the drawing
      return this.completeDrawing(dimensions, currentPrice);
    } else {
      // Continue drawing
      this.state.isDrawing = true;
      this.notifyListeners();
      console.log(`Point ${this.state.currentPoints.length}/${requiredPoints} added`);
      return true;
    }
  }

  /**
   * Complete the current drawing
   */
  completeDrawing(dimensions, currentPrice) {
    if (this.state.currentPoints.length < 2) {
      console.warn('Not enough points to complete drawing');
      return false;
    }

    const start = this.state.currentPoints[0];
    const end = this.state.currentPoints[this.state.currentPoints.length - 1];

    // Create drawing using the service
    const drawing = this.drawingService.createDrawing(
      this.state.activeTool,
      start,
      end,
      dimensions,
      currentPrice
    );

    if (drawing) {
      // Add to service and update state
      this.drawingService.addDrawing(drawing);
      this.state.drawings = this.drawingService.getDrawings();
      console.log('Drawing completed:', drawing);
    }

    // Reset drawing state
    this.state.isDrawing = false;
    this.state.currentPoints = [];
    this.notifyListeners();

    return drawing !== null;
  }

  /**
   * Cancel current drawing
   */
  cancelDrawing() {
    this.state.isDrawing = false;
    this.state.currentPoints = [];
    this.notifyListeners();
    console.log('Drawing cancelled');
  }

  /**
   * Get required points for each tool type
   */
  getRequiredPoints(toolType) {
    switch (toolType) {
      case 'TrendLine':
      case 'Fibonacci':
        return 2;
      case 'HorizontalLine':
        return 1; // Only need one point for horizontal line
      default:
        return 2;
    }
  }

  /**
   * Remove drawing by ID
   */
  removeDrawing(id) {
    const success = this.drawingService.removeDrawing(id);
    if (success) {
      this.state.drawings = this.drawingService.getDrawings();
      this.notifyListeners();
    }
    return success;
  }

  /**
   * Clear all drawings
   */
  clearAllDrawings() {
    this.drawingService.clearAllDrawings();
    this.state.drawings = [];
    this.notifyListeners();
    console.log('All drawings cleared');
  }

  /**
   * Get drawings by type
   */
  getDrawingsByType(toolType) {
    return this.drawingService.getDrawingsByType(toolType);
  }

  /**
   * Select drawing
   */
  selectDrawing(id) {
    this.state.selectedDrawing = id;
    this.notifyListeners();
  }

  /**
   * Update drawing
   */
  updateDrawing(id, updates) {
    const success = this.drawingService.updateDrawing(id, updates);
    if (success) {
      this.state.drawings = this.drawingService.getDrawings();
      this.notifyListeners();
    }
    return success;
  }

  /**
   * Get drawing statistics
   */
  getStatistics() {
    return this.drawingService.getStatistics();
  }

  /**
   * Export drawings
   */
  exportDrawings() {
    return this.drawingService.exportDrawings();
  }

  /**
   * Import drawings
   */
  importDrawings(jsonData) {
    const success = this.drawingService.importDrawings(jsonData);
    if (success) {
      this.state.drawings = this.drawingService.getDrawings();
      this.notifyListeners();
    }
    return success;
  }

  /**
   * Add state change listener
   */
  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Error in drawing state listener:', error);
      }
    });
  }

  /**
   * Get current drawing points for preview
   */
  getCurrentDrawingPoints() {
    return [...this.state.currentPoints];
  }

  /**
   * Check if currently drawing
   */
  isDrawing() {
    return this.state.isDrawing;
  }

  /**
   * Get active tool
   */
  getActiveTool() {
    return this.state.activeTool;
  }

  /**
   * Refresh drawings from storage
   */
  refreshDrawings() {
    this.state.drawings = this.drawingService.getDrawings();
    this.notifyListeners();
  }
}
