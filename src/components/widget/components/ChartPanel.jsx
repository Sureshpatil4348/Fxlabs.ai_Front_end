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
  
  // Match initial bars with UnifiedChart behavior per timeframe
  const getInitialBarsForTimeframe = (tf) => {
    const key = String(tf || '').toLowerCase();
    switch (key) {
      case '1m':
        return 6 * 60; // 6 hours
      case '5m':
        return (24 * 60) / 5; // 24h
      case '15m':
        return (72 * 60) / 15; // 72h
      case '30m':
        return Math.round((7 * 24 * 60) / 30); // ~1 week
      case '1h':
        return 14 * 24; // ~2 weeks
      case '4h':
        return 60 * 6; // ~2 months (~60 days)
      case '1d':
        return 180; // ~6 months
      case '1w':
        return 2 * 52; // ~2 years
      default:
        return 500; // fallback
    }
  };
  
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
        
        // Determine desired number of initial bars for timeframe
        const desiredBars = getInitialBarsForTimeframe(panelSettings.timeframe);
        const PER_PAGE = 200; // Always fetch 200 candles per page regardless of timeframe
        const pagesNeeded = Math.max(1, Math.ceil(desiredBars / PER_PAGE));

        console.log('📡 Loading initial OHLC data (ChartPanel)', { desiredBars, pagesNeeded, perPage: PER_PAGE });

        let combined = [];
        let lastHasMore = true;
        for (let page = 1; page <= pagesNeeded; page++) {
          const perPageForThisCall = 200; // Always use 200 candles per page
          // eslint-disable-next-line no-await-in-loop
          const res = await realMarketService.getHistoricalDataWithPage(
            panelSettings.symbol,
            panelSettings.timeframe,
            page,
            perPageForThisCall
          );
          combined = combined.concat(res.candles || []);
          lastHasMore = !!res.hasMore;
        }

        // Deduplicate by time and sort ascending, slice to desiredBars
        const seen = new Set();
        const unique = [];
        for (let i = 0; i < combined.length; i++) {
          const c = combined[i];
          if (!seen.has(c.time)) {
            seen.add(c.time);
            unique.push(c);
          }
        }
        unique.sort((a, b) => a.time - b.time);
        const sliced = unique.length > desiredBars ? unique.slice(-desiredBars) : unique;

        console.log('✅ Initial data prepared (ChartPanel):', {
          received: combined.length,
          unique: unique.length,
          used: sliced.length,
        });

        setCandles(sliced);
        setHasMoreHistory(lastHasMore);

        if (sliced.length > 0) {
          setOldestLoadedTime(sliced[0].time);
        }

        setCurrentPage(pagesNeeded);
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
        200 // Load max candles per page for efficiency
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
