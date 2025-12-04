import React from 'react';

import { KLineChartComponent } from './KLineChartComponent';

export const EnhancedCandlestickChart = ({
  candles,
  settings,
  onLoadMoreHistory,
  isLoadingHistory = false,
  hasMoreHistory = true,
  isFullscreen = false,
  chartIndex = 1,
}) => {
  return (
    <KLineChartComponent
      candles={candles}
      settings={settings}
      onLoadMoreHistory={onLoadMoreHistory}
      isLoadingHistory={isLoadingHistory}
      hasMoreHistory={hasMoreHistory}
      isFullscreen={isFullscreen}
      chartIndex={chartIndex}
    />
  );
};
