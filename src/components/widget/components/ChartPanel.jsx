import React, { useEffect, useState } from 'react';

import { KLineChartComponent } from './KLineChartComponent';
import useMarketCacheStore from '../../../store/useMarketCacheStore';
import { realMarketService } from '../services/realMarketService';
import { useChartStore } from '../stores/useChartStore';

export const ChartPanel = ({ panelSettings }) => {
  const [candles, setCandles] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [oldestLoadedTime, setOldestLoadedTime] = useState(null);
  
  // Get market cache store for consistent pricing
  const { pricingBySymbol } = useMarketCacheStore();
  
  // Get cursor settings from chart store
  const { settings: _settings } = useChartStore();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingHistory(true);
        setIsInitialLoad(true);
        setCurrentPage(1);
        setOldestLoadedTime(null);
        
        console.log('📊 Loading initial data:', {
          symbol: panelSettings.symbol,
          timeframe: panelSettings.timeframe
        });
        
        // Use the new pagination method - load more initial candles
        const result = await realMarketService.getHistoricalDataWithPage(
          panelSettings.symbol,
          panelSettings.timeframe,
          1,
          500 // Load 500 candles initially
        );
        
        console.log('📊 Initial data loaded:', {
          candlesCount: result.candles.length,
          hasMore: result.hasMore,
          firstCandle: result.candles[0],
          lastCandle: result.candles[result.candles.length - 1]
        });
        
        // Deduplicate any duplicate timestamps within the initial page
        const seenInit = new Set();
        const uniqueInitial = [];
        for (const c of result.candles) {
          if (!seenInit.has(c.time)) {
            seenInit.add(c.time);
            uniqueInitial.push(c);
          }
        }
        setCandles(uniqueInitial);
        setHasMoreHistory(result.hasMore);
        
        // Track the oldest loaded timestamp
        if (result.candles.length > 0) {
          setOldestLoadedTime(result.candles[0].time);
        }
        
        setIsInitialLoad(false);
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
        setHasMoreHistory(false);
        setIsInitialLoad(false);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (panelSettings.symbol && panelSettings.timeframe) {
      loadData();
    }
  }, [panelSettings.symbol, panelSettings.timeframe]);

  // Load more history
  const handleLoadMoreHistory = async () => {
    if (isLoadingHistory || !hasMoreHistory || isInitialLoad) {
      console.log('📊 Skipping load more:', { isLoadingHistory, hasMoreHistory, isInitialLoad });
      return;
    }
    
    try {
      setIsLoadingHistory(true);
      const nextPage = currentPage + 1;
      
      console.log('📊 Loading more history:', {
        symbol: panelSettings.symbol,
        timeframe: panelSettings.timeframe,
        page: nextPage,
        currentCandles: candles.length,
        oldestLoadedTime
      });
      
      // Load next page
      const result = await realMarketService.getHistoricalDataWithPage(
        panelSettings.symbol,
        panelSettings.timeframe,
        nextPage,
        500 // Load 500 candles per page
      );
      
      console.log('📊 More history loaded:', {
        newCandlesCount: result.candles.length,
        hasMore: result.hasMore,
        page: nextPage,
        firstNewCandle: result.candles[0],
        lastNewCandle: result.candles[result.candles.length - 1]
      });
      
      if (result.candles.length > 0) {
        // Filter out any duplicate candles based on timestamp, including duplicates within the new page
        const seenTimes = new Set(candles.map(c => c.time));
        const newCandles = [];
        for (const c of result.candles) {
          if (!seenTimes.has(c.time)) {
            seenTimes.add(c.time);
            newCandles.push(c);
          }
        }
        
        if (newCandles.length > 0) {
          // Prepend new historical candles to the beginning
          setCandles(prevCandles => {
            const combined = [...newCandles, ...prevCandles];
            console.log('📊 Combined candles:', {
              previous: prevCandles.length,
              new: newCandles.length,
              filtered: result.candles.length - newCandles.length,
              total: combined.length
            });
            return combined;
          });
          
          // Update oldest loaded time
          setOldestLoadedTime(newCandles[0].time);
          setCurrentPage(nextPage);
        } else {
          console.log('📊 All loaded candles were duplicates');
        }
        
        setHasMoreHistory(result.hasMore);
      } else {
        console.log('📊 No more historical data available');
        setHasMoreHistory(false);
      }
    } catch (error) {
      console.error('❌ Error loading more history:', error);
      setHasMoreHistory(false);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Use same data source as Trending Pairs for consistency
  const currentSymbol = panelSettings.symbol ? `${panelSettings.symbol}m` : null;
  const pricing = currentSymbol ? pricingBySymbol.get(currentSymbol) || {} : {};
  const _latestPrice = typeof pricing.bid === 'number' ? pricing.bid : (candles.length > 0 ? candles[candles.length - 1].close : 0);

  return (
    <KLineChartComponent
      candles={candles}
      settings={{
        symbol: panelSettings.symbol,
        timeframe: panelSettings.timeframe,
        chartType: panelSettings.chartType || 'candlestick',
        showGrid: _settings.showGrid,
        timezone: _settings.timezone
      }}
      panelSettings={panelSettings}
      onLoadMoreHistory={handleLoadMoreHistory}
      isLoadingHistory={isLoadingHistory}
      hasMoreHistory={hasMoreHistory}
    />
  );
};
