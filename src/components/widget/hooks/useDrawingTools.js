import { useState, useEffect, useCallback } from 'react';

import { DrawingManager } from '../services/drawingManager.js';

export const useDrawingTools = () => {
  const [state, setState] = useState(() => {
    const manager = DrawingManager.getInstance();
    return manager.getState();
  });

  useEffect(() => {
    const manager = DrawingManager.getInstance();
    
    // Subscribe to state changes
    const unsubscribe = manager.addListener((newState) => {
      setState(newState);
    });

    // Initial state
    setState(manager.getState());

    return unsubscribe;
  }, []);

  const setActiveTool = useCallback((tool) => {
    const manager = DrawingManager.getInstance();
    manager.setActiveTool(tool);
  }, []);

  const handleChartClick = useCallback((
    pixelPoint,
    dimensions,
    currentPrice
  ) => {
    const manager = DrawingManager.getInstance();
    return manager.handleChartClick(pixelPoint, dimensions, currentPrice);
  }, []);

  const cancelDrawing = useCallback(() => {
    const manager = DrawingManager.getInstance();
    manager.cancelDrawing();
  }, []);

  const removeDrawing = useCallback((id) => {
    const manager = DrawingManager.getInstance();
    return manager.removeDrawing(id);
  }, []);

  const clearAllDrawings = useCallback(() => {
    const manager = DrawingManager.getInstance();
    manager.clearAllDrawings();
  }, []);

  const getDrawingsByType = useCallback((toolType) => {
    const manager = DrawingManager.getInstance();
    return manager.getDrawingsByType(toolType);
  }, []);

  const selectDrawing = useCallback((id) => {
    const manager = DrawingManager.getInstance();
    manager.selectDrawing(id);
  }, []);

  const updateDrawing = useCallback((id, updates) => {
    const manager = DrawingManager.getInstance();
    return manager.updateDrawing(id, updates);
  }, []);

  const getStatistics = useCallback(() => {
    const manager = DrawingManager.getInstance();
    return manager.getStatistics();
  }, []);

  const exportDrawings = useCallback(() => {
    const manager = DrawingManager.getInstance();
    return manager.exportDrawings();
  }, []);

  const importDrawings = useCallback((jsonData) => {
    const manager = DrawingManager.getInstance();
    return manager.importDrawings(jsonData);
  }, []);

  const getCurrentDrawingPoints = useCallback(() => {
    const manager = DrawingManager.getInstance();
    return manager.getCurrentDrawingPoints();
  }, []);

  const refreshDrawings = useCallback(() => {
    const manager = DrawingManager.getInstance();
    manager.refreshDrawings();
  }, []);

  return {
    // State
    activeTool: state.activeTool,
    isDrawing: state.isDrawing,
    currentPoints: state.currentPoints,
    drawings: state.drawings,
    selectedDrawing: state.selectedDrawing,

    // Actions
    setActiveTool,
    handleChartClick,
    cancelDrawing,
    removeDrawing,
    clearAllDrawings,
    getDrawingsByType,
    selectDrawing,
    updateDrawing,
    getStatistics,
    exportDrawings,
    importDrawings,
    getCurrentDrawingPoints,
    refreshDrawings,

    // Computed values
    hasActiveTool: state.activeTool !== null,
    canDraw: state.activeTool !== null && !state.isDrawing,
    drawingCount: state.drawings.length
  };
};
