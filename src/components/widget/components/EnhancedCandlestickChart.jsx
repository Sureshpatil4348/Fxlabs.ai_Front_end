import React from 'react';

import { KLineChartComponent } from './KLineChartComponent';

export const EnhancedCandlestickChart = ({
  candles,
  settings,
  onLoadMoreHistory,
  isLoadingHistory = false,
  hasMoreHistory = true
}) => {
  return (
    <KLineChartComponent
      candles={candles}
      settings={settings}
      onLoadMoreHistory={onLoadMoreHistory}
      isLoadingHistory={isLoadingHistory}
      hasMoreHistory={hasMoreHistory}
    />
  );
};
