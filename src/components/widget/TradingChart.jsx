import React from 'react';

import { ChartLayout } from './components/ChartLayout.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { SymbolSelector } from './components/SymbolSelector.jsx';
import { TradingViewHeader } from './components/TradingViewHeader.jsx';

function TradingChart() {
  return (
    <ErrorBoundary>
      <div className="h-screen bg-white flex flex-col overflow-hidden border border-gray-200 shadow-lg rounded-lg">
        {/* Header */}
        <TradingViewHeader />
        
        {/* Main Content with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar />
          
          {/* Chart Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Symbol and Timeframe Selector */}
            <SymbolSelector />
            
            {/* Chart Layout - Renders different layouts based on user selection */}
            <div className="flex-1 overflow-hidden">
              <ChartLayout />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default TradingChart;
