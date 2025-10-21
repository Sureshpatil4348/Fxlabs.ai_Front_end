import React from 'react';

import { ChartPanel } from './ChartPanel';
import { UnifiedChart } from './UnifiedChart';
import { useChartStore } from '../stores/useChartStore';

export const ChartLayout = () => {
  const { layoutType, chartPanels, updateChartPanel } = useChartStore();

  // Defensive guard helper function
  const hasPanels = (n) => Array.isArray(chartPanels) && chartPanels.length >= n;

  // Single layout - use the existing UnifiedChart
  if (layoutType === 'single') {
    return <UnifiedChart />;
  }

  // Horizontal split - 2 charts side by side
  if (layoutType === 'horizontal') {
    if (!hasPanels(2)) return <UnifiedChart />;
    return (
      <div className="w-full h-full flex gap-1 p-1 overflow-hidden">
        <div className="flex-1">
          <ChartPanel
            panelSettings={chartPanels[0]}
            onSettingsChange={(updates) => updateChartPanel(chartPanels[0].id, updates)}
          />
        </div>
        <div className="flex-1">
          <ChartPanel
            panelSettings={chartPanels[1]}
            onSettingsChange={(updates) => updateChartPanel(chartPanels[1].id, updates)}
          />
        </div>
      </div>
    );
  }

  // Vertical split - 2 charts top/bottom
  if (layoutType === 'vertical') {
    if (!hasPanels(2)) return <UnifiedChart />;
    return (
      <div className="w-full h-full flex flex-col gap-1 p-1 overflow-hidden">
        <div className="flex-1">
          <ChartPanel
            panelSettings={chartPanels[0]}
            onSettingsChange={(updates) => updateChartPanel(chartPanels[0].id, updates)}
          />
        </div>
        <div className="flex-1">
          <ChartPanel
            panelSettings={chartPanels[1]}
            onSettingsChange={(updates) => updateChartPanel(chartPanels[1].id, updates)}
          />
        </div>
      </div>
    );
  }

  // Grid 2x2 - 4 charts in a grid
  if (layoutType === 'grid') {
    if (!hasPanels(4)) return <UnifiedChart />;
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 p-1 overflow-hidden">
        <ChartPanel
          panelSettings={chartPanels[0]}
          onSettingsChange={(updates) => updateChartPanel(chartPanels[0].id, updates)}
        />
        <ChartPanel
          panelSettings={chartPanels[1]}
          onSettingsChange={(updates) => updateChartPanel(chartPanels[1].id, updates)}
        />
        <ChartPanel
          panelSettings={chartPanels[2]}
          onSettingsChange={(updates) => updateChartPanel(chartPanels[2].id, updates)}
        />
        <ChartPanel
          panelSettings={chartPanels[3]}
          onSettingsChange={(updates) => updateChartPanel(chartPanels[3].id, updates)}
        />
      </div>
    );
  }

  // Triple left - 1 large left + 2 small right
  if (layoutType === 'triple-left') {
    if (!hasPanels(3)) return <UnifiedChart />;
    return (
      <div className="w-full h-full flex gap-1 p-1 overflow-hidden">
        <div className="flex-[2]">
          <ChartPanel
            panelSettings={chartPanels[0]}
            onSettingsChange={(updates) => updateChartPanel(chartPanels[0].id, updates)}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex-1">
            <ChartPanel
              panelSettings={chartPanels[1]}
              onSettingsChange={(updates) => updateChartPanel(chartPanels[1].id, updates)}
            />
          </div>
          <div className="flex-1">
            <ChartPanel
              panelSettings={chartPanels[2]}
              onSettingsChange={(updates) => updateChartPanel(chartPanels[2].id, updates)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Triple top - 1 large top + 2 small bottom
  if (layoutType === 'triple-top') {
    if (!hasPanels(3)) return <UnifiedChart />;
    return (
      <div className="w-full h-full flex flex-col gap-1 p-1 overflow-hidden">
        <div className="flex-[2]">
          <ChartPanel
            panelSettings={chartPanels[0]}
            onSettingsChange={(updates) => updateChartPanel(chartPanels[0].id, updates)}
          />
        </div>
        <div className="flex-1 flex gap-1">
          <div className="flex-1">
            <ChartPanel
              panelSettings={chartPanels[1]}
              onSettingsChange={(updates) => updateChartPanel(chartPanels[1].id, updates)}
            />
          </div>
          <div className="flex-1">
            <ChartPanel
              panelSettings={chartPanels[2]}
              onSettingsChange={(updates) => updateChartPanel(chartPanels[2].id, updates)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Picture-in-Picture - 1 large + 1 small overlay
  if (layoutType === 'pip') {
    if (!hasPanels(2)) return <UnifiedChart />;
    return (
      <div className="w-full h-full relative p-1 overflow-hidden">
        <ChartPanel
          panelSettings={chartPanels[0]}
          onSettingsChange={(updates) => updateChartPanel(chartPanels[0].id, updates)}
        />
        <div className="absolute bottom-2 right-2 w-64 h-48 shadow-2xl rounded-lg overflow-hidden border-2 border-white">
          <ChartPanel
            panelSettings={chartPanels[1]}
            onSettingsChange={(updates) => updateChartPanel(chartPanels[1].id, updates)}
          />
        </div>
      </div>
    );
  }

  // Default fallback
  return <UnifiedChart />;
};

