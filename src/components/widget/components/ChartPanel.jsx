import { createChart } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';

import { realMarketService } from '../services/realMarketService';

export const ChartPanel = ({ panelSettings }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [candles, setCandles] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Price series refs
  const candlestickSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const barSeriesRef = useRef(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || isInitialized) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 400,
      height: chartContainerRef.current.clientHeight || 300,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      grid: {
        vertLines: { color: '#e5e7eb' },
        horzLines: { color: '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 3,
      },
    });

    chartRef.current = chart;

    // Create initial series based on chart type
    if (panelSettings.chartType === 'candlestick') {
      candlestickSeriesRef.current = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      });
    } else if (panelSettings.chartType === 'line') {
      lineSeriesRef.current = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
      });
    } else if (panelSettings.chartType === 'area') {
      areaSeriesRef.current = chart.addAreaSeries({
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: 'rgba(41, 98, 255, 1)',
        lineWidth: 2,
      });
    } else if (panelSettings.chartType === 'bars') {
      barSeriesRef.current = chart.addBarSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
      });
    }

    setIsInitialized(true);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        try {
          // Remove all series before disposing chart
          if (candlestickSeriesRef.current) {
            chart.removeSeries(candlestickSeriesRef.current);
            candlestickSeriesRef.current = null;
          }
          if (lineSeriesRef.current) {
            chart.removeSeries(lineSeriesRef.current);
            lineSeriesRef.current = null;
          }
          if (areaSeriesRef.current) {
            chart.removeSeries(areaSeriesRef.current);
            areaSeriesRef.current = null;
          }
          if (barSeriesRef.current) {
            chart.removeSeries(barSeriesRef.current);
            barSeriesRef.current = null;
          }
          chart.remove();
        } catch (error) {
          console.warn('Chart cleanup warning:', error);
        }
      }
    };
  }, [isInitialized, panelSettings.chartType]);

  // Handle chart type changes - recreate series when chartType changes
  useEffect(() => {
    if (!isInitialized || !chartRef.current) return;

    // Helper function to remove all existing series
    const removeAllSeries = () => {
      if (candlestickSeriesRef.current) {
        try {
          chartRef.current.removeSeries(candlestickSeriesRef.current);
        } catch (error) {
          console.warn('Error removing candlestick series:', error);
        }
        candlestickSeriesRef.current = null;
      }
      if (lineSeriesRef.current) {
        try {
          chartRef.current.removeSeries(lineSeriesRef.current);
        } catch (error) {
          console.warn('Error removing line series:', error);
        }
        lineSeriesRef.current = null;
      }
      if (areaSeriesRef.current) {
        try {
          chartRef.current.removeSeries(areaSeriesRef.current);
        } catch (error) {
          console.warn('Error removing area series:', error);
        }
        areaSeriesRef.current = null;
      }
      if (barSeriesRef.current) {
        try {
          chartRef.current.removeSeries(barSeriesRef.current);
        } catch (error) {
          console.warn('Error removing bar series:', error);
        }
        barSeriesRef.current = null;
      }
    };

    // Remove all existing series
    removeAllSeries();

    // Create new series based on current chart type
    if (panelSettings.chartType === 'candlestick') {
      candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      });
    } else if (panelSettings.chartType === 'line') {
      lineSeriesRef.current = chartRef.current.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
      });
    } else if (panelSettings.chartType === 'area') {
      areaSeriesRef.current = chartRef.current.addAreaSeries({
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: 'rgba(41, 98, 255, 1)',
        lineWidth: 2,
      });
    } else if (panelSettings.chartType === 'bars') {
      barSeriesRef.current = chartRef.current.addBarSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
      });
    }

    // Propagate existing data to the new series
    if (candles.length > 0) {
      const validCandles = candles.filter(candle =>
        !isNaN(candle.time) &&
        !isNaN(candle.open) &&
        !isNaN(candle.high) &&
        !isNaN(candle.low) &&
        !isNaN(candle.close) &&
        candle.time > 0
      );

      const sortedCandles = validCandles.sort((a, b) => a.time - b.time);

      try {
        if (panelSettings.chartType === 'candlestick' && candlestickSeriesRef.current) {
          const candlestickData = sortedCandles.map(candle => ({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }));
          candlestickSeriesRef.current.setData(candlestickData);
        } else if (panelSettings.chartType === 'line' && lineSeriesRef.current) {
          const lineData = sortedCandles.map(candle => ({
            time: candle.time,
            value: candle.close,
          }));
          lineSeriesRef.current.setData(lineData);
        } else if (panelSettings.chartType === 'area' && areaSeriesRef.current) {
          const areaData = sortedCandles.map(candle => ({
            time: candle.time,
            value: candle.close,
          }));
          areaSeriesRef.current.setData(areaData);
        } else if (panelSettings.chartType === 'bars' && barSeriesRef.current) {
          const barData = sortedCandles.map(candle => ({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }));
          barSeriesRef.current.setData(barData);
        }

        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Error updating chart data after series recreation:', error);
      }
    }
  }, [panelSettings.chartType, isInitialized, candles]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await realMarketService.getHistoricalData(
          panelSettings.symbol,
          panelSettings.timeframe,
          200
        );
        setCandles(data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, panelSettings.symbol, panelSettings.timeframe]);

  // Update chart data
  useEffect(() => {
    if (!isInitialized || candles.length === 0) return;

    const activeSeries = candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current || barSeriesRef.current;
    if (!activeSeries) return;

    const validCandles = candles.filter(candle =>
      !isNaN(candle.time) &&
      !isNaN(candle.open) &&
      !isNaN(candle.high) &&
      !isNaN(candle.low) &&
      !isNaN(candle.close) &&
      candle.time > 0
    );

    const sortedCandles = validCandles.sort((a, b) => a.time - b.time);

    try {
      if (panelSettings.chartType === 'candlestick' && candlestickSeriesRef.current) {
        const candlestickData = sortedCandles.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        candlestickSeriesRef.current.setData(candlestickData);
      } else if (panelSettings.chartType === 'line' && lineSeriesRef.current) {
        const lineData = sortedCandles.map(candle => ({
          time: candle.time,
          value: candle.close,
        }));
        lineSeriesRef.current.setData(lineData);
      } else if (panelSettings.chartType === 'area' && areaSeriesRef.current) {
        const areaData = sortedCandles.map(candle => ({
          time: candle.time,
          value: candle.close,
        }));
        areaSeriesRef.current.setData(areaData);
      } else if (panelSettings.chartType === 'bars' && barSeriesRef.current) {
        const barData = sortedCandles.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        barSeriesRef.current.setData(barData);
      }

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [candles, panelSettings.chartType, isInitialized]);

  const latestPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

  return (
    <div className="relative w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {/* Chart Header */}
      <div className="flex-shrink-0 bg-gradient-to-b from-white/95 to-transparent backdrop-blur-sm z-10 px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900">{panelSettings.symbol}</span>
            <span className="text-xs text-gray-500">{panelSettings.timeframe}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-900">${latestPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Chart Container - Responsive Height */}
      <div 
        ref={chartContainerRef} 
        className="flex-1 w-full" 
        style={{ 
          minHeight: '300px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }} 
      />
    </div>
  );
};

