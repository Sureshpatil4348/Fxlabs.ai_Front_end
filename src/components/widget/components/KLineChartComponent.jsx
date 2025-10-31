import { init, registerOverlay, registerIndicator, getSupportedIndicators, IndicatorSeries } from 'klinecharts';
import { Trash2, Settings } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useChartStore } from '../stores/useChartStore';

export const KLineChartComponent = ({
  candles = [],
  settings = {},
  onLoadMoreHistory,
  isLoadingHistory = false,
  hasMoreHistory = true,
  panelSettings: _panelSettings = {}
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(null);
  const [_currentOHLC, setCurrentOHLC] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialBarSpaceRef = useRef(null);
  const [isHoveringBelowPanes, setIsHoveringBelowPanes] = useState(false);
  const [isHoveringOnChartOverlays, setIsHoveringOnChartOverlays] = useState(false);
  
  // Get the setter from store
  const { setKLineChartRef } = useChartStore();
  
  // Keep track of previous candle count and scroll position
  const prevCandleCountRef = useRef(0);
  const currentScrollIndexRef = useRef(null);
  const isLoadingRef = useRef(false);
  const scrollDebounceTimerRef = useRef(null);
  const lastLoadRequestTimeRef = useRef(0);
  const isAutoFollowRef = useRef(true);
  const lastManualVisibleRangeRef = useRef(null);
  const lastOffsetRightDistanceRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const prevFirstTimestampRef = useRef(null);
  const prevLastTimestampRef = useRef(null);
  const markProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 0);
  }, []);
  useEffect(() => {
    prevCandleCountRef.current = 0;
    prevFirstTimestampRef.current = null;
    prevLastTimestampRef.current = null;
    isAutoFollowRef.current = true;
    lastManualVisibleRangeRef.current = null;
    lastOffsetRightDistanceRef.current = null;
    currentScrollIndexRef.current = null;
    setIsInitialLoad(true);
  }, [settings.symbol, settings.timeframe]);
  
  // Keep latest candles for event handlers
  const candlesRef = useRef(candles);
  useEffect(() => { candlesRef.current = candles; }, [candles]);

  // Update grid visibility when settings change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setStyles({
        grid: {
          horizontal: { 
            show: settings.showGrid !== false,
            color: '#e5e7eb',
            size: 1
          },
          vertical: { 
            show: settings.showGrid !== false,
            color: '#e5e7eb',
            size: 1
          }
        }
      });
    }
  }, [settings.showGrid]);
  
  // Update current OHLC data when candles change
  useEffect(() => {
    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      // Ensure timestamp is in milliseconds
      const timestamp = latestCandle.time < 946684800000 ? latestCandle.time * 1000 : latestCandle.time;
      
      setCurrentOHLC({
        open: Number(latestCandle.open),
        high: Number(latestCandle.high),
        low: Number(latestCandle.low),
        close: Number(latestCandle.close),
        volume: Number(latestCandle.volume) || 0,
        time: timestamp,
        isBullish: latestCandle.close >= latestCandle.open
      });
    }
  }, [candles]);

  // Register drawing tools overlays
  useEffect(() => {
    // Register custom indicators once (e.g., ATR_ENH)
    try {
      const supported = typeof getSupportedIndicators === 'function' ? getSupportedIndicators() : [];
      if (Array.isArray(supported) && !supported.includes('ATR_ENH')) {
        registerIndicator({
          name: 'ATR_ENH',
          shortName: 'ATR',
          calcParams: [14],
          precision: 4,
          figures: [
            { key: 'atr', title: 'ATR: ', type: 'line' }
          ],
          calc: (dataList, indicator) => {
            const len = Array.isArray(indicator.calcParams) && indicator.calcParams.length > 0 ? Math.max(1, Number(indicator.calcParams[0]) || 14) : 14;
            let prevAtr = null;
            return dataList.map((k, i) => {
              const prev = dataList[i - 1] || k;
              const high = Number(k.high);
              const low = Number(k.low);
              const closePrev = Number(prev.close);
              const tr = Math.max(high - low, Math.abs(high - closePrev), Math.abs(low - closePrev));
              const out = {};
              if (i === 0) {
                prevAtr = tr;
                out.atr = tr;
              } else {
                // Wilder's RMA
                const atr = ((prevAtr * (len - 1)) + tr) / len;
                out.atr = atr;
                prevAtr = atr;
              }
              return out;
            });
          }
        });
      }
      // Register EMA_TOUCH_ENH (BB signals + ATR targets) — on chart
      if (Array.isArray(supported) && !supported.includes('EMA_TOUCH_ENH')) {
        registerIndicator({
          name: 'EMA_TOUCH_ENH',
          shortName: 'EMA Touch',
          series: IndicatorSeries.Price,
          precision: 4,
          // bbLen, bbMult, atrLen, tp1, tp2, tp3, slMult, horizonBars
          calcParams: [20, 2.0, 14, 1.0, 2.5, 4.0, 1.5, 25],
          figures: [
            { key: 'buySL', title: 'BUY SL: ', type: 'line' },
            { key: 'buyTP1', title: 'BUY TP1: ', type: 'line' },
            { key: 'buyTP2', title: 'BUY TP2: ', type: 'line' },
            { key: 'buyTP3', title: 'BUY TP3: ', type: 'line' },
            { key: 'sellSL', title: 'SELL SL: ', type: 'line' },
            { key: 'sellTP1', title: 'SELL TP1: ', type: 'line' },
            { key: 'sellTP2', title: 'SELL TP2: ', type: 'line' },
            { key: 'sellTP3', title: 'SELL TP3: ', type: 'line' },
          ],
          calc: (dataList, indicator) => {
            const p = Array.isArray(indicator.calcParams) ? indicator.calcParams : [20, 2.0, 14, 1.0, 2.5, 4.0, 1.5, 25];
            const bbLen = Math.max(1, Number(p[0]) || 20);
            const bbMult = Number(p[1]) || 2.0;
            const atrLen = Math.max(1, Number(p[2]) || 14);
            const m1 = Number(p[3]) || 1.0;
            const m2 = Number(p[4]) || 2.5;
            const m3 = Number(p[5]) || 4.0;
            const slMult = Number(p[6]) || 1.5;
            const horizon = Math.max(1, Number(p[7]) || 25);

            const len = dataList.length;
            // Rolling mean and std for BB
            const win = [];
            let sum = 0;
            let sumSq = 0;
            // Wilder ATR
            let prevAtr = null;

            // Output arrays initialized NaN
            const out = new Array(len).fill(null).map(() => ({ buySL: NaN, buyTP1: NaN, buyTP2: NaN, buyTP3: NaN, sellSL: NaN, sellTP1: NaN, sellTP2: NaN, sellTP3: NaN }));

            let lastSignal = '';

            for (let i = 0; i < len; i++) {
              const k = dataList[i];
              const close = k.close;
              // Update BB window
              win.push(close);
              sum += close;
              sumSq += close * close;
              if (win.length > bbLen) {
                const removed = win.shift();
                sum -= removed;
                sumSq -= removed * removed;
              }
              // ATR calc
              const prev = dataList[i - 1] || k;
              const tr = Math.max(k.high - k.low, Math.abs(k.high - prev.close), Math.abs(k.low - prev.close));
              let atr = tr;
              if (i > 0 && prevAtr != null) atr = ((prevAtr * (atrLen - 1)) + tr) / atrLen;
              prevAtr = atr;

              if (win.length === bbLen) {
                const mean = sum / bbLen;
                // variance
                const variance = Math.max(0, (sumSq / bbLen) - mean * mean);
                const stdev = Math.sqrt(variance);
                const upper = mean + bbMult * stdev;
                const lower = mean - bbMult * stdev;

                const sellSignal = close > upper && lastSignal !== 'SELL';
                const buySignal = close < lower && lastSignal !== 'BUY';

                if (sellSignal) {
                  lastSignal = 'SELL';
                  const sellSL = close + (slMult * atr);
                  const sellTP1 = close - (m1 * atr);
                  const sellTP2 = close - (m2 * atr);
                  const sellTP3 = close - (m3 * atr);
                  const end = Math.min(len - 1, i + horizon);
                  for (let j = i; j <= end; j++) {
                    out[j].sellSL = sellSL;
                    out[j].sellTP1 = sellTP1;
                    out[j].sellTP2 = sellTP2;
                    out[j].sellTP3 = sellTP3;
                  }
                }
                if (buySignal) {
                  lastSignal = 'BUY';
                  const buySL = close - (slMult * atr);
                  const buyTP1 = close + (m1 * atr);
                  const buyTP2 = close + (m2 * atr);
                  const buyTP3 = close + (m3 * atr);
                  const end = Math.min(len - 1, i + horizon);
                  for (let j = i; j <= end; j++) {
                    out[j].buySL = buySL;
                    out[j].buyTP1 = buyTP1;
                    out[j].buyTP2 = buyTP2;
                    out[j].buyTP3 = buyTP3;
                  }
                }
              }
            }
            return out;
          },
        });
      }
      // Register ORB_ENH (Opening Range Breakout - on chart)
      if (Array.isArray(supported) && !supported.includes('ORB_ENH')) {
        registerIndicator({
          name: 'ORB_ENH',
          shortName: 'ORB',
          series: IndicatorSeries.Price,
          precision: 2,
          calcParams: [9, 15, 1, 4.0], // hour, minute, period bars, RR
          figures: [
            { key: 'orHigh', title: 'OR High: ', type: 'line' },
            { key: 'orLow', title: 'OR Low: ', type: 'line' },
            { key: 'buyTP', title: 'Buy TP: ', type: 'line' },
            { key: 'sellTP', title: 'Sell TP: ', type: 'line' },
            { key: 'buySL', title: 'Buy SL: ', type: 'line' },
            { key: 'sellSL', title: 'Sell SL: ', type: 'line' },
          ],
          calc: (dataList, indicator) => {
            const [h, m, orPeriod, rr] = Array.isArray(indicator.calcParams) ? indicator.calcParams : [9, 15, 1, 4.0];
            let lastDay = null;
            let openingHigh = NaN;
            let openingLow = NaN;
            let orStartIdx = -1;
            let captured = false;
            let buyTaken = false;
            let sellTaken = false;
            let _buyEntry = NaN;
            let _sellEntry = NaN;
            let buyTP = NaN;
            let sellTP = NaN;
            let buySL = NaN;
            let sellSL = NaN;
            return dataList.map((k, i) => {
              const d = new Date(k.timestamp);
              const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              if (dayKey !== lastDay) {
                // reset for new day
                lastDay = dayKey;
                openingHigh = NaN;
                openingLow = NaN;
                orStartIdx = -1;
                captured = false;
                buyTaken = false;
                sellTaken = false;
                _buyEntry = NaN;
                _sellEntry = NaN;
                buyTP = NaN;
                sellTP = NaN;
                buySL = NaN;
                sellSL = NaN;
              }
              const isOpening = d.getHours() === Number(h) && d.getMinutes() === Number(m) && !captured;
              if (isOpening) {
                openingHigh = k.high;
                openingLow = k.low;
                orStartIdx = i;
                captured = true;
              }
              if (captured && orStartIdx >= 0 && (i - orStartIdx) < Number(orPeriod)) {
                openingHigh = Math.max(openingHigh, k.high);
                openingLow = Math.min(openingLow, k.low);
              }
              const range = isFinite(openingHigh) && isFinite(openingLow) ? (openingHigh - openingLow) : NaN;
              const prev = dataList[i - 1] || k;
              if (captured && isFinite(range) && !buyTaken && k.close > openingHigh && prev.close <= openingHigh) {
                buyTaken = true;
                _buyEntry = k.close;
                buyTP = openingHigh + range * Number(rr);
                buySL = openingLow;
              }
              if (captured && isFinite(range) && !sellTaken && k.close < openingLow && prev.close >= openingLow) {
                sellTaken = true;
                _sellEntry = k.close;
                sellTP = openingLow - range * Number(rr);
                sellSL = openingHigh;
              }
              return {
                orHigh: captured && isFinite(openingHigh) ? openingHigh : NaN,
                orLow: captured && isFinite(openingLow) ? openingLow : NaN,
                buyTP: buyTaken && isFinite(buyTP) ? buyTP : NaN,
                sellTP: sellTaken && isFinite(sellTP) ? sellTP : NaN,
                buySL: buyTaken && isFinite(buySL) ? buySL : NaN,
                sellSL: sellTaken && isFinite(sellSL) ? sellSL : NaN,
              };
            });
          },
        });
      }
      // Register ST_ENH (SuperTrend - on chart)
      if (Array.isArray(supported) && !supported.includes('ST_ENH')) {
        registerIndicator({
          name: 'ST_ENH',
          shortName: 'ST',
          series: IndicatorSeries.Price,
          precision: 4,
          calcParams: [10, 3.0], // atrPeriod, atrMultiplier
          figures: [
            { key: 'st', title: 'ST: ', type: 'line' },
          ],
          calc: (dataList, indicator) => {
            const [len, mult] = Array.isArray(indicator.calcParams) ? indicator.calcParams : [10, 3.0];
            const l = Math.max(1, Number(len) || 10);
            const m = Number(mult) || 3.0;
            let prevAtr = null;
            let prevFinalUpper = NaN;
            let prevFinalLower = NaN;
            let prevTrend = 1; // default bullish
            return dataList.map((k, i) => {
              const prev = dataList[i - 1] || k;
              const hl2 = (k.high + k.low) / 2;
              const tr = Math.max(k.high - k.low, Math.abs(k.high - prev.close), Math.abs(k.low - prev.close));
              let atr = tr;
              if (i > 0 && prevAtr != null) atr = ((prevAtr * (l - 1)) + tr) / l; // Wilder's RMA
              prevAtr = atr;
              const basicUpper = hl2 + m * atr;
              const basicLower = hl2 - m * atr;
              // final bands
              let finalUpper;
              if (!isFinite(prevFinalUpper) || prev.close > prevFinalUpper) finalUpper = basicUpper; else finalUpper = Math.min(basicUpper, prevFinalUpper);
              let finalLower;
              if (!isFinite(prevFinalLower) || prev.close < prevFinalLower) finalLower = basicLower; else finalLower = Math.max(basicLower, prevFinalLower);
              // trend decision using previous final bands
              let trend = prevTrend;
              if (i > 0) {
                if (k.close > prevFinalUpper) trend = 1; else if (k.close < prevFinalLower) trend = -1;
              }
              const st = trend === 1 ? finalLower : finalUpper;
              // persist for next step
              prevFinalUpper = finalUpper;
              prevFinalLower = finalLower;
              prevTrend = trend;
              return { st };
            });
          },
        });
      }
      // Register SR_ENH (Support/Resistance - on chart)
      if (Array.isArray(supported) && !supported.includes('SR_ENH')) {
        registerIndicator({
          name: 'SR_ENH',
          shortName: 'S/R',
          series: IndicatorSeries.Price,
          precision: 2,
          calcParams: [15, 15], // leftBars, rightBars
          figures: [
            { key: 'res', title: 'RES: ', type: 'line' },
            { key: 'sup', title: 'SUP: ', type: 'line' },
            { key: 'resTop', title: 'RES+: ', type: 'line' },
            { key: 'supBot', title: 'SUP-: ', type: 'line' },
          ],
          calc: (dataList, indicator) => {
            const [leftBars, rightBars] = Array.isArray(indicator.calcParams) ? indicator.calcParams : [15, 15];
            const l = Math.max(1, Number(leftBars) || 15);
            const r = Math.max(1, Number(rightBars) || 15);
            const len = dataList.length;
            const resAt = new Array(len).fill(NaN);
            const supAt = new Array(len).fill(NaN);
            for (let i = 0; i < len; i++) {
              const c = i - r;
              if (c >= l && i >= r && c >= 0 && c < len) {
                const start = Math.max(0, c - l);
                const end = Math.min(len - 1, c + r);
                let isHighPivot = true;
                let isLowPivot = true;
                const ch = dataList[c].high;
                const cl = dataList[c].low;
                for (let j = start; j <= end; j++) {
                  if (j === c) continue;
                  if (dataList[j].high > ch) isHighPivot = false;
                  if (dataList[j].low < cl) isLowPivot = false;
                  if (!isHighPivot && !isLowPivot) break;
                }
                if (isHighPivot) resAt[c] = ch;
                if (isLowPivot) supAt[c] = cl;
              }
            }
            let lastRes = NaN;
            let lastSup = NaN;
            return dataList.map((_k, idx) => {
              if (isFinite(resAt[idx])) lastRes = resAt[idx];
              if (isFinite(supAt[idx])) lastSup = supAt[idx];
              const res = isFinite(lastRes) ? lastRes : NaN;
              const sup = isFinite(lastSup) ? lastSup : NaN;
              const resTop = isFinite(res) ? res * 1.002 : NaN;
              const supBot = isFinite(sup) ? sup * 0.998 : NaN;
              return { res, sup, resTop, supBot };
            });
          },
        });
      }
      // Register MACD_ENH (below-chart)
      if (Array.isArray(supported) && !supported.includes('MACD_ENH')) {
        registerIndicator({
          name: 'MACD_ENH',
          shortName: 'MACD',
          precision: 4,
          calcParams: [12, 26, 9], // fast, slow, signal
          figures: [
            { key: 'macd', title: 'MACD: ', type: 'line' },
            { key: 'signal', title: 'SIGNAL: ', type: 'line' },
            { key: 'histPS', title: 'HPS: ', type: 'bar' }, // pos strong
            { key: 'histPW', title: 'HPW: ', type: 'bar' }, // pos weak
            { key: 'histNW', title: 'HNW: ', type: 'bar' }, // neg weak
            { key: 'histNS', title: 'HNS: ', type: 'bar' }, // neg strong
          ],
          calc: (dataList, indicator) => {
            const [fastLen, slowLen, sigLen] = Array.isArray(indicator.calcParams) ? indicator.calcParams : [12, 26, 9];
            const fl = Math.max(1, Number(fastLen) || 12);
            const sl = Math.max(1, Number(slowLen) || 26);
            const sg = Math.max(1, Number(sigLen) || 9);
            let emaFast = null;
            let emaSlow = null;
            let emaSignal = null;
            const kf = 2 / (fl + 1);
            const ks = 2 / (sl + 1);
            const ks2 = 2 / (sg + 1);
            return dataList.map((k, i, arr) => {
              const price = k.close; // source close
              emaFast = emaFast == null ? price : (price - emaFast) * kf + emaFast;
              emaSlow = emaSlow == null ? price : (price - emaSlow) * ks + emaSlow;
              const macd = (emaFast - emaSlow);
              emaSignal = emaSignal == null ? macd : (macd - emaSignal) * ks2 + emaSignal;
              const hist = macd - emaSignal;
              const prevHist = i > 0 ? ((arr[i - 1].__macdHist) ?? 0) : 0;
              // 4-level histogram splits
              const posStrong = hist > 0 && hist > prevHist ? hist : NaN;
              const posWeak = hist > 0 && hist <= prevHist ? hist : NaN;
              const negWeak = hist <= 0 && hist > prevHist ? hist : NaN;
              const negStrong = hist <= 0 && hist <= prevHist ? hist : NaN;
              // stash for next comparison
              k.__macdHist = hist;
              return {
                macd,
                signal: emaSignal,
                histPS: posStrong,
                histPW: posWeak,
                histNW: negWeak,
                histNS: negStrong,
              };
            });
          },
        });
      }
    } catch (e) {
      console.warn('📈 Failed to register custom indicators:', e);
    }

    // Register trend line overlay
    registerOverlay({
      name: 'trendLine',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#2962FF',
                size: 2,
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Trend line drawn:', overlay);
      },
    });

    // Register horizontal line overlay
    registerOverlay({
      name: 'horizontalLine',
      // Single click places a full-width horizontal line
      totalStep: 1,
      createPointFigures: ({ coordinates, bounding }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 1 || !coordinates[0]) return [];
        const y = coordinates[0].y;
        const x1 = 0;
        const x2 = (bounding && typeof bounding.width === 'number') ? bounding.width : 9999;
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [{ x: x1, y }, { x: x2, y }],
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Horizontal line drawn:', overlay);
      },
    });

    // Register rectangle overlay
    registerOverlay({
      name: 'rectangle',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'rect',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#4ECDC4',
                size: 1,
                style: 'solid',
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Rectangle drawn:', overlay);
      },
    });

    // Register text overlay
    registerOverlay({
      name: 'text',
      totalStep: 1,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 1) return [];
        return [
          {
            type: 'text',
            attrs: {
              coordinates: [coordinates[0]],
              styles: {
                color: '#333333',
                size: 12,
              },
              text: 'Text Annotation',
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Text annotation drawn:', overlay);
      },
    });

    // Register arrow overlay
    registerOverlay({
      name: 'arrow',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#FFA726',
                size: 3,
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Arrow drawn:', overlay);
      },
    });

    // Register Fibonacci overlay
    registerOverlay({
      name: 'fibonacci',
      totalStep: 2,
      createPointFigures: ({ coordinates }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [coordinates[0], coordinates[1]],
              styles: {
                color: '#9C27B0',
                size: 2,
                style: 'dash',
              },
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Fibonacci drawn:', overlay);
      },
    });
  }, []);

  // Initialize K-line chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || chartRef.current) return;

    try {
      setError(null);
      
      // Initialize chart with timezone awareness
      const tz = settings.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      const chart = init(container, { timezone: tz });

      // Configure chart styles using setStyles (not setStyleOptions)
      chart.setStyles({
        grid: {
          horizontal: { 
            show: settings.showGrid !== false,
            color: '#e5e7eb',
            size: 1
          },
          vertical: { 
            show: settings.showGrid !== false,
            color: '#e5e7eb',
            size: 1
          }
        },
        crosshair: {
          show: true,
          horizontal: {
            show: true,
            line: {
              show: true,
              style: 'dash',
              dashValue: [4, 2],
              color: '#758696',
              size: 1,
            },
            text: {
              show: true,
              color: '#ffffff',
              size: 12,
              borderColor: '#2962FF',
              borderSize: 1,
            },
          },
          vertical: {
            show: true,
            line: {
              show: true,
              style: 'dash',
              dashValue: [4, 2],
              color: '#758696',
              size: 1,
            },
            text: {
              show: true,
              color: '#ffffff',
              size: 12,
              borderColor: '#2962FF',
              borderSize: 1,
            },
          },
        },
        // Remove left/right gaps completely
        padding: {
          left: 0,
          right: 0,
          top: 5,
          bottom: 5
        },
        // Force chart to use full width - remove internal margins
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }
        },
        // Force full width usage
        width: '100%',
        height: '100%',
        // Remove axis gaps
        yAxis: {
          type: 'normal',
          position: 'right',
          inside: false,
          reverse: false,
          // Enable auto-scaling
          minSpan: 0.01, // Minimum span to prevent too tight scaling
          maxSpan: Infinity,
          axisLine: {
            show: true,
            color: '#e5e7eb',
            size: 1
          },
          tickLine: {
            show: true,
            length: 3,
            color: '#e5e7eb',
            size: 1
          },
          tickText: {
            show: true,
            color: '#6b7280',
            size: 11,
            family: 'Arial',
            weight: 'normal'
          }
        },
        axis: {
          right: {
            show: true,
            position: 'right',
            margin: 0,
            padding: 0
          },
          left: {
            show: false
          }
        },
        // Force candlesticks to use full width
        candle: {
          type: 'candle_solid',
          upColor: '#10b981',
          downColor: '#ef4444',
          noChangeColor: '#888888',
          margin: {
            left: 0,
            right: 0
          },
          // Force candlesticks to extend to edges
          extend: {
            left: 0,
            right: 0
          },
          // Hide the default 'Time' legend from candle tooltip
          // by overriding tooltip.custom without the '{time}' entry.
          tooltip: {
            custom: [
              { title: 'O:', value: '{open}' },
              { title: 'H:', value: '{high}' },
              { title: 'L:', value: '{low}' },
              { title: 'C:', value: '{close}' },
              { title: 'V:', value: '{volume}' }
            ]
          },
          priceMark: {
            show: true,
            high: {
              show: true,
              color: '#10b981',
              textColor: '#ffffff'
            },
            low: {
              show: true,
              color: '#ef4444',
              textColor: '#ffffff'
            },
            last: {
              show: true,
              upColor: '#10b981',
              downColor: '#ef4444',
              noChangeColor: '#888888',
              text: {
                show: true,
                color: '#ffffff'
              }
            }
          }
        },
        // Force data area to use full width
        data: {
          margin: {
            left: 0,
            right: 0
          }
        }
      });

      chartRef.current = chart;
      // Capture initial bar space for reset/reload behavior
      try {
        if (typeof chart.getBarSpace === 'function') {
          const bs = chart.getBarSpace();
          if (bs && typeof bs.bar === 'number') {
            initialBarSpaceRef.current = bs.bar;
          }
        }
      } catch (_e) {
        // no-op: optional API
      }
      
      // Register chart ref with store for sidebar access
      setKLineChartRef(chart);

      // Set up event listeners
      chart.subscribeAction('crosshair', (data) => {
        if (data && data.kLineData) {
          const candle = data.kLineData;
          setCurrentOHLC({
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
            volume: Number(candle.volume) || 0,
            time: candle.timestamp, // KLineChart uses 'timestamp' property
            isBullish: candle.close >= candle.open
          });
        }
      });

      // Drawing tool handler: start interactive overlay creation
      const handleDrawingToolChange = (toolType) => {
        try {
          if (!toolType) return; // deactivated
          if (typeof chart.createOverlay === 'function') {
            // Prefer built-in, battle-tested overlays where available
            const overlayMap = {
              trendLine: 'segment', // 2-point segment
              fibonacci: 'fibonacciLine',
              // Keep our custom horizontalLine because it is tuned for full-width
              // Optionally: horizontalLine: 'horizontalStraightLine',
            };
            const name = overlayMap[toolType] || toolType;
            try {
              // Preferred signature (v10+)
              chart.createOverlay({ name });
            } catch (_e) {
              // Fallback
              chart.createOverlay(name);
            }
            console.log('📈 Overlay creation started for tool:', name);
          }
        } catch (err) {
          console.warn('📈 Error activating drawing tool:', err);
        }
      };

      // Store the handler for external use
      chart._handleDrawingToolChange = handleDrawingToolChange;

      // Configure chart options for better auto-scaling
      chart.setOptions({
        // Auto-scale to visible data range
        yAxis: {
          autoMinMax: true, // Automatically adjust min/max based on visible data
        }
      });

          // Handle resize - FORCE FULL WIDTH
          const handleResize = () => {
            if (container && chart) {
              const width = container.clientWidth;
              const height = container.clientHeight;
              
              if (width > 0 && height > 0) {
                // Force chart to use full container width
                chart.resize(width, height);
                // Force chart to fill entire container
                chart.setStyles({
                  width: '100%',
                  height: '100%'
                });
              }
            }
          };

      window.addEventListener('resize', handleResize);
      
      // Initial resize
      setTimeout(() => handleResize(), 100);

      console.log('📈 K-line chart initialized successfully');

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          try {
            // KLineChart v10+ auto-cleanup - just nullify the reference
            // No need to call remove() as it doesn't exist in v10+
            chartRef.current = null;
            setKLineChartRef(null); // Clear from store
          } catch (error) {
            console.warn('📈 Error cleaning up K-line chart:', error);
          }
        }
        // No need to set isInitialized to false
      };
    } catch (error) {
      console.error('📈 Error initializing K-line chart:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize K-line chart');
    }
  }, [settings.showGrid, setKLineChartRef, settings.timezone]); // Include timezone for initial setup

  // Apply timezone changes to the chart dynamically
  useEffect(() => {
    if (!chartRef.current) return;
    try {
      const tz = settings.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      if (typeof chartRef.current.setTimezone === 'function') {
        chartRef.current.setTimezone(tz);
      }
    } catch (e) {
      console.warn('📈 Failed to apply chart timezone:', e);
    }
  }, [settings.timezone]);

  // Handle scroll/zoom events for pagination
  useEffect(() => {
    if (!chartRef.current || !onLoadMoreHistory) return;

    const handleScroll = (_data) => {
      if (!chartRef.current) return;

      const visibleRange = chartRef.current.getVisibleRange();

      if (visibleRange) {
        if (typeof visibleRange.from === 'number') {
          currentScrollIndexRef.current = visibleRange.from;
        }

        if (!isProgrammaticScrollRef.current) {
          lastManualVisibleRangeRef.current = visibleRange;

          if (typeof chartRef.current.getOffsetRightDistance === 'function') {
            lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          }

          const dataList = typeof chartRef.current.getDataList === 'function'
            ? chartRef.current.getDataList()
            : [];
          const totalCandles = Array.isArray(dataList) ? dataList.length : 0;

          if (totalCandles > 0 && typeof visibleRange.to === 'number') {
            const latestIndex = totalCandles - 1;
            const futureDistance = visibleRange.to - latestIndex;
            const nearRightEdge = futureDistance >= -1 && futureDistance <= 0;

            if (futureDistance > 0) {
              isAutoFollowRef.current = false;
            } else {
              isAutoFollowRef.current = nearRightEdge;
            }
          }
        }
      }

      // Check if we're near the left edge and should load more history
      if (visibleRange) {
        // Clear any existing debounce timer
        if (scrollDebounceTimerRef.current) {
          clearTimeout(scrollDebounceTimerRef.current);
        }
        
        // Debounce the load request - only trigger after user stops scrolling for 300ms
        scrollDebounceTimerRef.current = setTimeout(() => {
          const currentTime = Date.now();
          const timeSinceLastLoad = currentTime - lastLoadRequestTimeRef.current;
          
          // Trigger load more when we're within 20 candles of the start
          // and we're not already loading
          // and at least 2 seconds have passed since last load request
          if (visibleRange && visibleRange.from <= 20 && 
              hasMoreHistory && 
              !isLoadingHistory && 
              !isLoadingRef.current &&
              timeSinceLastLoad > 2000 &&
              onLoadMoreHistory) {
            console.log('📊 Near left edge, loading more history...', {
              from: visibleRange.from,
              to: visibleRange.to,
              currentCandles: candlesRef.current.length,
              timeSinceLastLoad
            });
            
            isLoadingRef.current = true;
            lastLoadRequestTimeRef.current = currentTime;
            onLoadMoreHistory();
          }
        }, 300);
      }
    };

    chartRef.current.subscribeAction('scroll', handleScroll);
    // Also trigger the same logic on zoom out since visibleRange can expand left
    chartRef.current.subscribeAction('zoom', handleScroll);

    return () => {
      // Clear debounce timer on cleanup
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
      }
    };
  }, [hasMoreHistory, isLoadingHistory, onLoadMoreHistory]);

  // Update chart with data
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    try {
      setError(null);
      
      // Filter and sort candles
      const validCandles = candles.filter(candle => 
        !isNaN(candle.time) && 
        !isNaN(candle.open) && 
        !isNaN(candle.high) && 
        !isNaN(candle.low) && 
        !isNaN(candle.close) &&
        candle.time > 0
      );
      // Sort by time (ascending)
      const sortedCandles = validCandles.sort((a, b) => a.time - b.time);

      // Convert to KLineChart format
      const rawKlineData = sortedCandles.map(candle => {
        // Ensure timestamp is in milliseconds (KLineChart requirement)
        // If timestamp is less than year 2000 in milliseconds (946684800000), it's likely in seconds
        const timestamp = candle.time < 946684800000 ? candle.time * 1000 : candle.time;
        
        return {
          timestamp: timestamp,
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
          volume: Number(candle.volume) || 0,
        };
      });

      // Deduplicate by timestamp to prevent duplicate candles (keep the latest occurrence)
      const dedupeMap = new Map();
      for (let i = rawKlineData.length - 1; i >= 0; i--) {
        const d = rawKlineData[i];
        if (!dedupeMap.has(d.timestamp)) {
          dedupeMap.set(d.timestamp, d);
        }
      }
      const klineData = Array.from(dedupeMap.values()).sort((a, b) => a.timestamp - b.timestamp);

      const previousVisibleRange = chartRef.current.getVisibleRange() || lastManualVisibleRangeRef.current;
      const previousOffsetRightDistance = typeof chartRef.current.getOffsetRightDistance === 'function'
        ? chartRef.current.getOffsetRightDistance()
        : lastOffsetRightDistanceRef.current;
      const shouldAutoFollow = isAutoFollowRef.current;

      const firstTimestamp = klineData.length > 0 ? klineData[0].timestamp : null;
      const lastTimestamp = klineData.length > 0 ? klineData[klineData.length - 1].timestamp : null;
      const prevFirstTimestamp = prevFirstTimestampRef.current;

      const dataLengthIncreased = klineData.length > prevCandleCountRef.current;
      const appendedCount = dataLengthIncreased ? klineData.length - prevCandleCountRef.current : 0;
      const hasOlderHistory = dataLengthIncreased &&
        prevFirstTimestamp !== null &&
        firstTimestamp !== null &&
        firstTimestamp < prevFirstTimestamp;
      const isPaginationLoad = hasOlderHistory;
      const handledWithIncrementalUpdate = !isInitialLoad && !isPaginationLoad;

      const restoreManualRange = (range, offsetRight, adjustForHistory = false, historyDelta = 0) => {
        if (!chartRef.current || !range || typeof range.from !== 'number' || typeof range.to !== 'number') {
          return;
        }

        const rangeSize = Math.max(0, range.to - range.from);
        let targetFrom = range.from + (adjustForHistory ? historyDelta : 0);
        const maxFrom = Math.max(0, klineData.length - Math.max(1, rangeSize));
        targetFrom = Math.max(0, Math.min(targetFrom, maxFrom));

        markProgrammaticScroll();
        chartRef.current.scrollToDataIndex(targetFrom);

        if (typeof chartRef.current.setOffsetRightDistance === 'function' && typeof offsetRight === 'number') {
          chartRef.current.setOffsetRightDistance(offsetRight);
        }

        const cappedLength = Math.max(0, klineData.length - 1);
        const targetTo = Math.min(cappedLength, targetFrom + rangeSize);
        lastManualVisibleRangeRef.current = {
          from: targetFrom,
          to: targetTo
        };
        currentScrollIndexRef.current = targetFrom;

        if (typeof chartRef.current.getOffsetRightDistance === 'function') {
          lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
        }

        isAutoFollowRef.current = false;
      };
      const maybeTriggerLeftEdgeBackfill = () => {
        try {
          if (!chartRef.current || !onLoadMoreHistory) return;
          const vr = chartRef.current.getVisibleRange();
          const dl = typeof chartRef.current.getDataList === 'function' ? chartRef.current.getDataList() : [];
          const total = Array.isArray(dl) ? dl.length : 0;
          if (vr && typeof vr.from === 'number' && total > 0) {
            const fromIdx = Math.max(0, Math.floor(vr.from));
            const nearLeft = fromIdx <= 2; // robust threshold
            const now = Date.now();
            const elapsed = now - lastLoadRequestTimeRef.current;
            if (nearLeft && hasMoreHistory && !isLoadingHistory && !isLoadingRef.current && elapsed > 2000) {
              console.log('📊 Left-edge backfill (post-update) triggering load more...', { fromIdx, total });
              isLoadingRef.current = true;
              lastLoadRequestTimeRef.current = now;
              onLoadMoreHistory();
            }
          }
        } catch (_e) {
          // no-op
        }
      };

      if (handledWithIncrementalUpdate) {
        const latestCandles = appendedCount > 0 ? klineData.slice(-appendedCount) : (klineData.length > 0 ? [klineData[klineData.length - 1]] : []);
        latestCandles.forEach((candle) => {
          chartRef.current.updateData(candle);
        });

        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }

        // When a new candle is added (appendedCount > 0), verify user is actually viewing latest candles
        // before auto-scrolling. This prevents unwanted scroll when user has manually scrolled to history.
        if (appendedCount > 0 && shouldAutoFollow) {
          // Check if user's visible range (before update) included the latest candle
          const prevDataLength = prevCandleCountRef.current;
          const wasViewingLatest = previousVisibleRange && 
            typeof previousVisibleRange.to === 'number' &&
            prevDataLength > 0 &&
            previousVisibleRange.to >= prevDataLength - 2; // Within 2 candles of the end
          
          console.log('📊 New candle formed - checking auto-scroll:', {
            appendedCount,
            prevDataLength,
            visibleRangeTo: previousVisibleRange?.to,
            wasViewingLatest,
            willAutoScroll: wasViewingLatest
          });
          
          if (wasViewingLatest) {
            // User was viewing the latest area, safe to auto-scroll
            markProgrammaticScroll();
            chartRef.current.scrollToRealTime();
            isAutoFollowRef.current = true;
            lastManualVisibleRangeRef.current = null;
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
          } else {
            // User was viewing historical data, maintain their position
            console.log('📊 User viewing history - maintaining scroll position');
            const maintainedRange = chartRef.current.getVisibleRange();
            if (maintainedRange) {
              lastManualVisibleRangeRef.current = maintainedRange;
            }
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
            isAutoFollowRef.current = false;
          }
        } else if (!shouldAutoFollow) {
          const maintainedRange = chartRef.current.getVisibleRange();
          if (maintainedRange) {
            lastManualVisibleRangeRef.current = maintainedRange;
          }
          if (typeof chartRef.current.getOffsetRightDistance === 'function') {
            lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          }
        } else if (typeof chartRef.current.getOffsetRightDistance === 'function') {
          lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          lastManualVisibleRangeRef.current = null;
        }

        isLoadingRef.current = false;
        // Fallback: if user is already at far left, trigger backfill
        maybeTriggerLeftEdgeBackfill();
      } else if (isPaginationLoad) {
        const newCandlesCount = appendedCount;
        
        console.log('📊 Pagination load detected:', {
          newCandles: newCandlesCount,
          totalCandles: klineData.length,
          previousTotal: prevCandleCountRef.current
        });

        chartRef.current.applyNewData(klineData);
        
        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }
        
        setTimeout(() => {
          if (!chartRef.current) return;

          if (shouldAutoFollow) {
            markProgrammaticScroll();
            chartRef.current.scrollToRealTime();
            isAutoFollowRef.current = true;
            lastManualVisibleRangeRef.current = null;
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
          } else {
            restoreManualRange(previousVisibleRange, previousOffsetRightDistance, true, newCandlesCount);
          }

          isLoadingRef.current = false;
          // After pagination load, check again in case user remains at left edge
          maybeTriggerLeftEdgeBackfill();
        }, 100);
      } else {
        chartRef.current.applyNewData(klineData);
        
        if (chartRef.current.setOptions) {
          chartRef.current.setOptions({
            yAxis: {
              autoMinMax: true
            }
          });
        }
        
        if (isInitialLoad && klineData.length > 0) {
          setTimeout(() => {
            if (!chartRef.current) return;

            console.log('📊 Initial load - scrolling to current candle (real-time)');
            markProgrammaticScroll();
            chartRef.current.scrollToRealTime();
            setIsInitialLoad(false);
            isAutoFollowRef.current = true;
            lastManualVisibleRangeRef.current = null;
            if (typeof chartRef.current.getOffsetRightDistance === 'function') {
              lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
            }
          }, 100);
        } else if (!shouldAutoFollow && previousVisibleRange) {
          setTimeout(() => {
            if (!chartRef.current) return;
            restoreManualRange(previousVisibleRange, previousOffsetRightDistance);
          }, 0);
        } else if (shouldAutoFollow) {
          markProgrammaticScroll();
          chartRef.current.scrollToRealTime();
          isAutoFollowRef.current = true;
          lastManualVisibleRangeRef.current = null;
          if (typeof chartRef.current.getOffsetRightDistance === 'function') {
            lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
          }
        }

        isLoadingRef.current = false;
        // Initial/full apply path: check left edge too
        maybeTriggerLeftEdgeBackfill();
      }

      // Update previous dataset metadata (after dedupe and chart updates)
      prevCandleCountRef.current = klineData.length;
      prevFirstTimestampRef.current = firstTimestamp;
      prevLastTimestampRef.current = lastTimestamp;
    } catch (error) {
      console.error('📈 Error updating K-line chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to update chart data');
      isLoadingRef.current = false;
    }
  }, [candles, isInitialLoad, isLoadingHistory, markProgrammaticScroll, hasMoreHistory, onLoadMoreHistory]);

  // Handle indicator visibility changes
  useEffect(() => {
    if (!chartRef.current) return;

    try {
      console.log('📈 KLineChart: Indicator settings changed', settings.indicators);

      // Support RSI Enhanced (pane), ATR Enhanced (pane), MACD Enhanced (pane). BOLL overlays are handled separately below.
      const indicatorMap = {
        rsiEnhanced: { name: 'RSI', params: { calcParams: [14] }, newPane: true },
        atrEnhanced: { name: 'ATR_ENH', params: { calcParams: [14] }, newPane: true },
        macdEnhanced: { name: 'MACD_ENH', params: { calcParams: [12, 26, 9] }, newPane: true },
      };

      // First, handle Bollinger overlays (shared by 'emaTouch' and 'bbPro')
      try {
        const wantBoll = Boolean(settings.indicators?.emaTouch) || Boolean(settings.indicators?.bbPro);
        const proStyles = settings.indicators?.bbPro
          ? {
              lines: [
                { color: '#2962FF', size: 2 }, // Upper
                { color: '#FF6D00', size: 1 }, // Middle
                { color: '#2962FF', size: 2 }, // Lower
              ],
            }
          : undefined;
        const existingBoll = typeof chartRef.current.getIndicators === 'function'
          ? chartRef.current.getIndicators({ name: 'BOLL' })
          : [];
        const hasBoll = Array.isArray(existingBoll) && existingBoll.length > 0;

        if (wantBoll) {
          // Always re-create on the candle pane to guarantee on-chart placement
          if (hasBoll && typeof chartRef.current.removeIndicator === 'function') {
            chartRef.current.removeIndicator({ name: 'BOLL' });
          }
          const indicatorArg = proStyles
            ? { name: 'BOLL', calcParams: [20, 2], styles: proStyles }
            : { name: 'BOLL', calcParams: [20, 2] };
          // Overlay on main price pane by targeting the candle pane id
          chartRef.current.createIndicator(indicatorArg, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: BOLL overlay added to candle pane', { mode: settings.indicators?.bbPro ? 'pro' : 'default' });

          // If EMA Touch is enabled, add ATR targets + signals lines
          const existingTouch = typeof chartRef.current.getIndicators === 'function'
            ? chartRef.current.getIndicators({ name: 'EMA_TOUCH_ENH' })
            : [];
          const hasTouch = Array.isArray(existingTouch) && existingTouch.length > 0;
          if (settings.indicators?.emaTouch) {
            if (hasTouch && typeof chartRef.current.removeIndicator === 'function') {
              chartRef.current.removeIndicator({ name: 'EMA_TOUCH_ENH' });
            }
            chartRef.current.createIndicator({ name: 'EMA_TOUCH_ENH', calcParams: [20, 2.0, 14, 1.0, 2.5, 4.0, 1.5, 25], styles: {
              lines: [
                { color: '#EF4444', size: 2 }, // buy SL
                { color: '#22C55E', size: 1 }, // buy TP1
                { color: '#22C55E', size: 1 }, // buy TP2
                { color: '#22C55E', size: 1 }, // buy TP3
                { color: '#EF4444', size: 2 }, // sell SL
                { color: '#22C55E', size: 1 }, // sell TP1
                { color: '#22C55E', size: 1 }, // sell TP2
                { color: '#22C55E', size: 1 }, // sell TP3
              ]
            } }, true, { id: 'candle_pane' });
            console.log('✅ KLineChart: EMA Touch targets overlay added');
          } else if (hasTouch) {
            chartRef.current.removeIndicator({ name: 'EMA_TOUCH_ENH' });
          }
        } else {
          if (hasBoll) {
            chartRef.current.removeIndicator({ name: 'BOLL' });
            console.log('📈 KLineChart: BOLL overlay removed');
          }
          // Remove EMA_TOUCH_ENH if present
          try {
            chartRef.current.removeIndicator({ name: 'EMA_TOUCH_ENH' });
          } catch (_) {}
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling BOLL overlay:', e);
      }

      // MA Enhanced (on-chart EMA multi-lines)
      try {
        const wantMa = Boolean(settings.indicators?.maEnhanced);
        const maParams = [9, 21, 50, 100, 200];
        const maStyles = {
          lines: [
            { color: '#2962FF', size: 2 }, // MA1 / EMA9
            { color: '#FF6D00', size: 2 }, // MA2 / EMA21
            { color: '#26A69A', size: 2 }, // MA3 / EMA50
            { color: '#9C27B0', size: 2 }, // MA4 / EMA100
            { color: '#F44336', size: 3 }, // MA5 / EMA200
          ],
        };
        const existingEma = typeof chartRef.current.getIndicators === 'function'
          ? chartRef.current.getIndicators({ name: 'EMA' })
          : [];
        const hasEma = Array.isArray(existingEma) && existingEma.length > 0;
        if (wantMa) {
          // Recreate on candle pane to guarantee on-chart placement
          if (hasEma && typeof chartRef.current.removeIndicator === 'function') {
            chartRef.current.removeIndicator({ name: 'EMA' });
          }
          const indicatorArg = { name: 'EMA', calcParams: maParams, styles: maStyles };
          chartRef.current.createIndicator(indicatorArg, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: MA Enhanced (EMA multi) overlay added to candle pane');
        } else if (hasEma) {
          chartRef.current.removeIndicator({ name: 'EMA' });
          console.log('📈 KLineChart: MA Enhanced (EMA) overlay removed');
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling MA Enhanced overlay:', e);
      }

      // ORB Enhanced (on-chart Opening Range Breakout)
      try {
        const wantOrb = Boolean(settings.indicators?.orbEnhanced);
        const orbStyles = {
          lines: [
            { color: '#26a69a', size: 3 }, // OR High
            { color: '#ef5350', size: 3 }, // OR Low
            { color: '#26a69a', size: 2, dashedValue: [4, 4] }, // Buy TP
            { color: '#ef5350', size: 2, dashedValue: [4, 4] }, // Sell TP
            { color: '#ef5350', size: 2, dashedValue: [2, 2] }, // Buy SL
            { color: '#26a69a', size: 2, dashedValue: [2, 2] }, // Sell SL
          ],
        };
        const existingOrb = typeof chartRef.current.getIndicators === 'function'
          ? chartRef.current.getIndicators({ name: 'ORB_ENH' })
          : [];
        const hasOrb = Array.isArray(existingOrb) && existingOrb.length > 0;
        if (wantOrb) {
          if (hasOrb && typeof chartRef.current.removeIndicator === 'function') {
            chartRef.current.removeIndicator({ name: 'ORB_ENH' });
          }
          const indicatorArg = { name: 'ORB_ENH', calcParams: [9, 15, 1, 4.0], styles: orbStyles };
          chartRef.current.createIndicator(indicatorArg, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: ORB Enhanced overlay added to candle pane');
        } else if (hasOrb) {
          chartRef.current.removeIndicator({ name: 'ORB_ENH' });
          console.log('📈 KLineChart: ORB Enhanced overlay removed');
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling ORB Enhanced overlay:', e);
      }

      // SuperTrend Enhanced (on-chart)
      try {
        const wantSt = Boolean(settings.indicators?.stEnhanced);
        const stStyles = {
          lines: [
            { color: '#26A69A', size: 2 }, // ST line (will be static color; dynamic color requires style callbacks)
          ],
        };
        const existingSt = typeof chartRef.current.getIndicators === 'function'
          ? chartRef.current.getIndicators({ name: 'ST_ENH' })
          : [];
        const hasSt = Array.isArray(existingSt) && existingSt.length > 0;
        if (wantSt) {
          if (hasSt && typeof chartRef.current.removeIndicator === 'function') {
            chartRef.current.removeIndicator({ name: 'ST_ENH' });
          }
          const indicatorArg = { name: 'ST_ENH', calcParams: [10, 3.0], styles: stStyles };
          chartRef.current.createIndicator(indicatorArg, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: SuperTrend Enhanced overlay added to candle pane');
        } else if (hasSt) {
          chartRef.current.removeIndicator({ name: 'ST_ENH' });
          console.log('📈 KLineChart: SuperTrend Enhanced overlay removed');
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling SuperTrend Enhanced overlay:', e);
      }

      // Support/Resistance Enhanced (on-chart)
      try {
        const wantSr = Boolean(settings.indicators?.srEnhanced);
        const srStyles = {
          lines: [
            { color: '#FF5252', size: 2 }, // Resistance
            { color: '#00BCD4', size: 2 }, // Support
            { color: '#FF5252', size: 1, dashedValue: [4, 4] }, // Resistance zone top
            { color: '#00BCD4', size: 1, dashedValue: [4, 4] }, // Support zone bottom
          ],
        };
        const existingSr = typeof chartRef.current.getIndicators === 'function'
          ? chartRef.current.getIndicators({ name: 'SR_ENH' })
          : [];
        const hasSr = Array.isArray(existingSr) && existingSr.length > 0;
        if (wantSr) {
          if (hasSr && typeof chartRef.current.removeIndicator === 'function') {
            chartRef.current.removeIndicator({ name: 'SR_ENH' });
          }
          const indicatorArg = { name: 'SR_ENH', calcParams: [15, 15], styles: srStyles };
          chartRef.current.createIndicator(indicatorArg, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: S/R Enhanced overlay added to candle pane');
        } else if (hasSr) {
          chartRef.current.removeIndicator({ name: 'SR_ENH' });
          console.log('📈 KLineChart: S/R Enhanced overlay removed');
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling S/R Enhanced overlay:', e);
      }

      // Process each indicator (pane indicators only)
      Object.entries(indicatorMap).forEach(([key, config]) => {
        if (!config.name) return; // Skip if not a KLineCharts indicator

        const isEnabled = settings.indicators?.[key];
        const indicatorName = config.name;

        // Create unique key for logs only
        const uniqueKey = indicatorName;

        if (isEnabled) {
          console.log(`📈 KLineChart: Adding ${key} (${uniqueKey}) indicator`);
          try {
            if (typeof chartRef.current.createIndicator === 'function') {
              // Correct API usage:
              // - Second arg is `isStack` (stack multiple indicators in same pane)
              // - Third arg is `paneOptions` (new pane descriptor when creating a separate pane)
              const isOverlayOnMain = !config.newPane;
              const paneOptions = config.newPane ? { id: `pane-${key}`, height: 120 } : undefined;
              // Enhance styles for known indicators
              let indicatorArg = indicatorName;
              if (config.params?.calcParams) {
                indicatorArg = { name: indicatorName, calcParams: config.params.calcParams };
              }
              if (key === 'macdEnhanced') {
                indicatorArg = {
                  name: indicatorName,
                  calcParams: config.params.calcParams,
                  styles: {
                    lines: [
                      { color: '#2962FF', size: 2 }, // MACD
                      { color: '#FF6D00', size: 2 }, // SIGNAL
                    ],
                    bars: [
                      { upColor: '#26A69A', downColor: '#26A69A' }, // strong bull
                      { upColor: 'rgba(38,166,154,0.5)', downColor: 'rgba(38,166,154,0.5)' }, // weak bull
                      { upColor: 'rgba(239,83,80,0.5)', downColor: 'rgba(239,83,80,0.5)' }, // weak bear
                      { upColor: '#EF5350', downColor: '#EF5350' }, // strong bear
                    ],
                  },
                };
              }
              chartRef.current.createIndicator(indicatorArg, isOverlayOnMain, paneOptions);
              console.log(`✅ KLineChart: ${key} indicator added`);
            } else {
              console.warn('📈 KLineChart: createIndicator method not available');
            }
          } catch (error) {
            console.warn(`⚠️ KLineChart: Error adding ${key}:`, error?.message);
          }
        } else {
          // Remove indicator by pane or by name
          try {
            if (typeof chartRef.current.removeIndicator === 'function') {
              if (config.newPane) {
                chartRef.current.removeIndicator({ paneId: `pane-${key}` });
              } else {
                chartRef.current.removeIndicator({ name: indicatorName });
              }
              console.log(`📈 KLineChart: ${key} indicator removed`);
            }
          } catch (_error) {
            // Silently ignore if indicator doesn't exist
          }
        }
      });
    } catch (error) {
      console.error('📈 KLineChart: Error handling indicator changes:', error);
    }
  }, [settings.indicators]);

  // Chart navigation methods
  const _scrollToLatest = useCallback(() => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollToRealTime();
      isAutoFollowRef.current = true;
      lastManualVisibleRangeRef.current = null;
      if (typeof chartRef.current.getOffsetRightDistance === 'function') {
        lastOffsetRightDistanceRef.current = chartRef.current.getOffsetRightDistance();
      }
    }
  }, [markProgrammaticScroll]);

  const _scrollLeft = useCallback((pixels = 100) => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollByDistance(-pixels);
      isAutoFollowRef.current = false;
    }
  }, [markProgrammaticScroll]);

  const _scrollRight = useCallback((pixels = 100) => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollByDistance(pixels);
      isAutoFollowRef.current = false;
    }
  }, [markProgrammaticScroll]);

  const _scrollToCandle = useCallback((index) => {
    if (chartRef.current) {
      markProgrammaticScroll();
      chartRef.current.scrollToDataIndex(index);
      isAutoFollowRef.current = false;
    }
  }, [markProgrammaticScroll]);

  const _getVisibleRange = useCallback(() => {
    if (chartRef.current) {
      return chartRef.current.getVisibleRange();
    }
    return null;
  }, []);

  // Drawing tools methods - Using correct KLineChart API
  const _setDrawingTool = useCallback((toolType) => {
    if (chartRef.current && chartRef.current._handleDrawingToolChange) {
      try {
        // Use the chart's built-in drawing tool handler
        chartRef.current._handleDrawingToolChange(toolType);
        console.log('📈 Drawing tool selected:', toolType);
      } catch (error) {
        console.warn('📈 Error setting drawing tool:', error);
      }
    }
  }, []);

  const _clearDrawings = useCallback(() => {
    if (chartRef.current) {
      try {
        // Clear all overlays using the correct API
        const overlays = chartRef.current.getAllOverlays();
        overlays.forEach(overlay => {
          chartRef.current.removeOverlay(overlay.id);
        });
        console.log('📈 All drawings cleared');
      } catch (error) {
        console.warn('📈 Error clearing drawings:', error);
      }
    }
  }, []);

  // Overlay control handlers
  const handleZoomIn = useCallback(() => {
    const chart = chartRef.current;
    const el = chartContainerRef.current;
    if (!chart || !el) return;
    const width = el.clientWidth || 0;
    const height = el.clientHeight || 0;
    // Zoom in around center
    chart.zoomAtCoordinate(1.2, { x: width / 2, y: height / 2 }, 120);
  }, []);

  const handleZoomOut = useCallback(() => {
    const chart = chartRef.current;
    const el = chartContainerRef.current;
    if (!chart || !el) return;
    const width = el.clientWidth || 0;
    const height = el.clientHeight || 0;
    // Zoom out around center
    chart.zoomAtCoordinate(0.83, { x: width / 2, y: height / 2 }, 120);
  }, []);

  const handleScrollLeft = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    let step = 160; // px fallback
    try {
      if (typeof chart.getBarSpace === 'function') {
        const bs = chart.getBarSpace();
        if (bs && typeof bs.bar === 'number') step = bs.bar * 18; // ~18 bars
      }
    } catch (_e) { /* ignore */ }
    chart.scrollByDistance(-step, 120);
    isAutoFollowRef.current = false;
  }, []);

  const handleScrollRight = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    let step = 160; // px fallback
    try {
      if (typeof chart.getBarSpace === 'function') {
        const bs = chart.getBarSpace();
        if (bs && typeof bs.bar === 'number') step = bs.bar * 18; // ~18 bars
      }
    } catch (_e) { /* ignore */ }
    chart.scrollByDistance(step, 120);
    isAutoFollowRef.current = false;
  }, []);

  const handleReload = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    try {
      // Reset bar space if available
      if (initialBarSpaceRef.current && typeof chart.setBarSpace === 'function') {
        chart.setBarSpace(initialBarSpaceRef.current);
      }
    } catch (_e) { /* ignore optional API */ }
    // Jump to latest and re-enable auto-follow
    chart.scrollToRealTime(150);
    isAutoFollowRef.current = true;
  }, []);

  const _exportDrawings = useCallback(() => {
    if (chartRef.current) {
      try {
        const drawings = chartRef.current.getAllOverlays();
        console.log('📈 Drawings exported:', drawings);
        return drawings;
      } catch (error) {
        console.warn('📈 Error exporting drawings:', error);
        return [];
      }
    }
    return [];
  }, []);

  const _importDrawings = useCallback((drawings) => {
    if (chartRef.current && Array.isArray(drawings)) {
      try {
        drawings.forEach(drawing => {
          chartRef.current.createOverlay(drawing.name, drawing.points);
        });
        console.log('📈 Drawings imported:', drawings.length);
      } catch (error) {
        console.warn('📈 Error importing drawings:', error);
      }
    }
  }, []);

  // Use container-driven sizing so the chart never overflows its slot.
  // Any indicator panes (RSI/MACD/etc.) must be managed within the chart
  // itself, not by expanding the DOM container height. This prevents the
  // chart from growing taller than its parent when extra panes are toggled.

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Chart Container - bounded height to prevent layout overflow */}
      <div className="flex-1 relative min-h-0 overflow-hidden" style={{ padding: '0', margin: '0' }}>
        <div
          ref={chartContainerRef}
          className="absolute inset-0"
          style={{
            backgroundColor: '#ffffff',
            height: '100%',
            width: '100%',
            left: '0',
            right: '0',
            top: '0',
            padding: '0',
            margin: '0'
          }}
          onMouseMove={(e) => {
            try {
              const container = chartContainerRef.current;
              if (!container) return;
              const rect = container.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const totalHeight = rect.height;
              // Determine active below-chart panes and their aggregate height (each pane created with height: 120)
              const BELOW_KEYS = ['rsiEnhanced', 'atrEnhanced', 'macdEnhanced'];
              const activeBelowCount = Array.isArray(BELOW_KEYS)
                ? BELOW_KEYS.reduce((acc, k) => acc + (settings?.indicators?.[k] ? 1 : 0), 0)
                : 0;
              const belowHeight = activeBelowCount * 120;
              const hovering = belowHeight > 0 && y >= Math.max(0, totalHeight - belowHeight);
              if (hovering !== isHoveringBelowPanes) setIsHoveringBelowPanes(hovering);
              // On-chart overlay hover detection (approximate: any hover in main pane and any on-chart overlay active)
              const ON_CHART_KEYS = ['emaTouch','bbPro','maEnhanced','orbEnhanced','stEnhanced','srEnhanced'];
              const hasOnChart = ON_CHART_KEYS.some((k) => settings?.indicators?.[k]);
              const mainPaneHeight = Math.max(0, totalHeight - belowHeight);
              const hoveringMain = hasOnChart && y >= 0 && y < mainPaneHeight;
              if (hoveringMain !== isHoveringOnChartOverlays) setIsHoveringOnChartOverlays(hoveringMain);
            } catch (_) {}
          }}
          onMouseLeave={() => { setIsHoveringBelowPanes(false); setIsHoveringOnChartOverlays(false); }}
        >
          {!chartRef.current && (
            <div className="absolute inset-0 flex items-start justify-center pt-16 bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-12 h-12 border-4 border-gray-300 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 mt-3 text-sm font-medium">Loading K-line Chart...</p>
              </div>
            </div>
          )}
          
          {error && chartRef.current && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4 z-10">
              <div className="text-center mb-4">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-700 mt-4 text-lg font-medium">Chart Error</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
              
              <button
                onClick={() => {
                  setError(null);
                  // Reset chart by clearing the ref
                  chartRef.current = null;
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry Chart
              </button>
            </div>
          )}
          
          {!chartRef.current && error && (
            <div className="absolute inset-0 flex items-start justify-center pt-16 bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-12 h-12 border-4 border-gray-300 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 mt-3 text-sm font-medium">Loading K-line Chart...</p>
              </div>
            </div>
          )}
          
          {/* Overlay Controls - centered above bottom panel */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '32px', zIndex: 50, pointerEvents: 'none' }}>
            <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
              {/* Zoom out card */}
              <button
                type="button"
                aria-label="Zoom out"
                onClick={handleZoomOut}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14"/></svg>
              </button>

              {/* Zoom in card */}
              <button
                type="button"
                aria-label="Zoom in"
                onClick={handleZoomIn}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14"/></svg>
              </button>

              {/* Pan left card */}
              <button
                type="button"
                aria-label="Scroll left"
                onClick={handleScrollRight}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </button>

              {/* Pan right card */}
              <button
                type="button"
                aria-label="Scroll right"
                onClick={handleScrollLeft}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>

              {/* Reload / reset card */}
              <button
                type="button"
                aria-label="Reload chart"
                onClick={handleReload}
                className="w-7 h-7 grid place-items-center rounded-lg bg-white bg-opacity-50 border border-gray-200 shadow-sm hover:bg-gray-50 hover:bg-opacity-70 active:bg-gray-100 active:bg-opacity-70 text-gray-700 transition-all duration-200"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.906-2M4 16a8 8 0 0014.906 2"/></svg>
              </button>
            </div>
          </div>

          {/* Hover actions for below-chart indicator panes */}
          {(() => {
            const BELOW_KEYS = ['rsiEnhanced', 'atrEnhanced', 'macdEnhanced'];
            const activeBelow = BELOW_KEYS.filter((k) => settings?.indicators?.[k]);
            if (activeBelow.length === 0) return null;
            return (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 60 }}>
                {activeBelow.map((key, idx) => {
                  const bottomOffset = idx * 120;
                  return (
                    <div
                      key={key}
                      className="absolute left-0 right-0"
                      style={{ height: 120, bottom: bottomOffset }}
                    >
                      {/* Action panel */}
                      <div
                        className={`absolute top-2 right-2 transition-opacity duration-150 ${isHoveringBelowPanes ? 'opacity-100' : 'opacity-0'}`}
                        style={{ pointerEvents: isHoveringBelowPanes ? 'auto' : 'none' }}
                      >
                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-transparent border border-gray-200 rounded-md">
                          <button
                            type="button"
                            title="Delete"
                            className="w-6 h-6 grid place-items-center text-gray-600 hover:text-red-600"
                            aria-label="Delete indicator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Configure"
                            className="w-6 h-6 grid place-items-center text-gray-600 hover:text-blue-600"
                            aria-label="Configure indicator"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Hover actions for on-chart overlay indicators (main price pane) */}
          {(() => {
            const ON_CHART_KEYS = ['emaTouch','bbPro','maEnhanced','orbEnhanced','stEnhanced','srEnhanced'];
            const LABELS = {
              emaTouch: 'EMA Touch',
              bbPro: 'Bollinger Bands Pro',
              maEnhanced: 'MA Enhanced',
              orbEnhanced: 'ORB Enhanced',
              stEnhanced: 'SuperTrend Enhanced',
              srEnhanced: 'S/R Enhanced'
            };
            const activeOnChart = ON_CHART_KEYS.filter((k) => settings?.indicators?.[k]);
            if (activeOnChart.length === 0) return null;
            return (
              <div className="absolute top-2 right-2 space-y-1 transition-opacity duration-150" style={{ zIndex: 60, pointerEvents: isHoveringOnChartOverlays ? 'auto' : 'none', opacity: isHoveringOnChartOverlays ? 1 : 0 }}>
                {activeOnChart.map((key) => (
                  <div key={key} className="flex items-center gap-2 px-2 py-1.5 bg-transparent border border-gray-200 rounded-md">
                    <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">{LABELS[key] || key}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Delete"
                        className="w-6 h-6 grid place-items-center text-gray-600 hover:text-red-600"
                        aria-label={`Delete ${LABELS[key] || key}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Configure"
                        className="w-6 h-6 grid place-items-center text-gray-600 hover:text-blue-600"
                        aria-label={`Configure ${LABELS[key] || key}`}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// Export navigation and drawing tools methods for external use
export const useKLineChartControls = (chartRef) => {
  const scrollToLatest = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.scrollToRealTime();
    }
  }, [chartRef]);

  const scrollLeft = useCallback((pixels = 100) => {
    if (chartRef.current) {
      chartRef.current.scrollByDistance(-pixels);
    }
  }, [chartRef]);

  const scrollRight = useCallback((pixels = 100) => {
    if (chartRef.current) {
      chartRef.current.scrollByDistance(pixels);
    }
  }, [chartRef]);

  const scrollToCandle = useCallback((index) => {
    if (chartRef.current) {
      chartRef.current.scrollToDataIndex(index);
    }
  }, [chartRef]);

  const getVisibleRange = useCallback(() => {
    if (chartRef.current) {
      return chartRef.current.getVisibleRange();
    }
    return null;
  }, [chartRef]);

  const setDrawingTool = useCallback((_toolType) => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
  }, []);

  const clearDrawings = useCallback(() => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
  }, []);

  const exportDrawings = useCallback(() => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
    return [];
  }, []);

  const importDrawings = useCallback((_drawings) => {
    console.warn('📈 Drawing tools not yet implemented in KLineChart integration');
  }, []);

  return {
    // Navigation methods
    scrollToLatest,
    scrollLeft,
    scrollRight,
    scrollToCandle,
    getVisibleRange,
    // Drawing tools (placeholder)
    setDrawingTool,
    clearDrawings,
    exportDrawings,
    importDrawings
  };
};
