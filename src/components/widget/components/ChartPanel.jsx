import React, { useEffect, useState, useRef } from 'react';

import { KLineChartComponent } from './KLineChartComponent';
import useMarketCacheStore from '../../../store/useMarketCacheStore';
import { realMarketService } from '../services/realMarketService';
import { useChartStore } from '../stores/useChartStore';

export const ChartPanel = ({ panelSettings }) => {
  const [candles, setCandles] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [oldestLoadedTime, setOldestLoadedTime] = useState(null);
  const olderCursorRef = useRef(null); // next_before cursor for paging older
  
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
        setOldestLoadedTime(null);
        olderCursorRef.current = null;
        
        console.log('📊 Loading initial data:', {
          symbol: panelSettings.symbol,
          timeframe: panelSettings.timeframe
        });
        
        // Determine desired number of initial bars for timeframe
        const desiredBars = getInitialBarsForTimeframe(panelSettings.timeframe);
        const MAX_PER_CALL = 1000;
        const combined = [];
        let keepFetching = true;
        let before = null; // no cursor on first call
        while (keepFetching && combined.length < desiredBars) {
          const limit = Math.min(MAX_PER_CALL, desiredBars - combined.length);
          // eslint-disable-next-line no-await-in-loop
          const { candles, nextBefore, count } = await realMarketService.fetchOhlcSlice(
            panelSettings.symbol,
            panelSettings.timeframe,
            { limit, before }
          );
          if (candles.length > 0) {
            combined.push(...candles);
          }
          if (!nextBefore || !count) {
            keepFetching = false;
          } else {
            before = nextBefore;
            olderCursorRef.current = nextBefore;
          }
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
        // We have more history if the last response provided a next_before cursor
        setHasMoreHistory(Boolean(olderCursorRef.current));

        if (sliced.length > 0) {
          setOldestLoadedTime(sliced[0].time);
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
      console.log('📊 Loading more history:', {
        symbol: panelSettings.symbol,
        timeframe: panelSettings.timeframe,
        currentCandles: candles.length,
        oldestLoadedTime,
        beforeCursor: olderCursorRef.current
      });
      
      const { candles: newSlice, nextBefore, count } = await realMarketService.fetchOhlcSlice(
        panelSettings.symbol,
        panelSettings.timeframe,
        { limit: 300, before: olderCursorRef.current || (oldestLoadedTime ? oldestLoadedTime * 1000 : null) }
      );

      console.log('📊 More history loaded:', {
        newCandlesCount: newSlice.length,
        hasMore: Boolean(nextBefore && count > 0),
        firstNewCandle: newSlice[0],
        lastNewCandle: newSlice[newSlice.length - 1]
      });
      
      if (newSlice.length > 0) {
        // Filter out any duplicate candles based on timestamp, including duplicates within the new page
        const seenTimes = new Set(candles.map(c => c.time));
        const newCandles = [];
        for (const c of newSlice) {
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
              filtered: newSlice.length - newCandles.length,
              total: combined.length
            });
            return combined;
          });
          
          // Update oldest loaded time
          setOldestLoadedTime(newCandles[0].time);
          olderCursorRef.current = nextBefore || null;
        } else {
          console.log('📊 All loaded candles were duplicates');
        }
        
        setHasMoreHistory(Boolean(nextBefore && count > 0));
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
