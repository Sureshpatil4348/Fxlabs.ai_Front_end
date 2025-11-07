import { init, registerOverlay, registerIndicator, getSupportedIndicators } from 'klinecharts';
import { Trash2, Settings } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useChartStore } from '../stores/useChartStore';
import { calculateRSI } from '../utils/indicators';

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
  const [selectedOverlayPanel, setSelectedOverlayPanel] = useState(null);
  const inlineEditorActiveRef = useRef(false);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, confirmText, cancelText, onConfirm }
  // RSI enhanced UI state
  const [_rsiValue, setRsiValue] = useState(null);
  const [_rsiStatus, setRsiStatus] = useState('NEUTRAL');
  const [rsiAlert, setRsiAlert] = useState(null); // { type: 'overbought'|'oversold', ts }
  const [showRsiSettings, setShowRsiSettings] = useState(false);
  const rsiPrevRef = useRef(null);
  const [localRsiSettings, setLocalRsiSettings] = useState(() => ({
    length: 14,
    source: 'close',
    overbought: 70,
    oversold: 30,
    rsiLineColor: '#2962FF',
  }));

  useEffect(() => {
    if (!showRsiSettings) return;
    const cfg = settings?.indicatorSettings?.rsiEnhanced || {};
    setLocalRsiSettings({
      length: Number(cfg.length) || 14,
      source: cfg.source || 'close',
      overbought: Number(cfg.overbought ?? 70),
      oversold: Number(cfg.oversold ?? 30),
      rsiLineColor: cfg.rsiLineColor || '#2962FF',
    });
  }, [showRsiSettings, settings?.indicatorSettings?.rsiEnhanced]);
  
  // Get the setter from store
  const { setKLineChartRef, toggleIndicator, isWorkspaceHidden, updateIndicatorSettings } = useChartStore();
  
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

  // Compute RSI (enhanced) for status/alerts from selected source
  useEffect(() => {
    try {
      const cfg = settings?.indicatorSettings?.rsiEnhanced || {};
      const len = Math.max(1, Number(cfg.length) || 14);
      const src = (cfg.source || 'close').toLowerCase();
      if (!Array.isArray(candles) || candles.length < len + 2) {
        setRsiValue(null);
        setRsiStatus('NEUTRAL');
        return;
      }
      const mapped = candles.map((c) => {
        const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close);
        let v = cl;
        if (src === 'open') v = o;
        else if (src === 'high') v = h;
        else if (src === 'low') v = l;
        else if (src === 'hl2') v = (h + l) / 2;
        else if (src === 'hlc3') v = (h + l + cl) / 3;
        else if (src === 'ohlc4') v = (o + h + l + cl) / 4;
        return { ...c, close: v };
      });
      const rsiSeries = calculateRSI(mapped, len);
      if (!Array.isArray(rsiSeries) || rsiSeries.length < 2) return;
      const last = Number(rsiSeries[rsiSeries.length - 1]?.value);
      const prev = Number(rsiSeries[rsiSeries.length - 2]?.value);
      if (!Number.isFinite(last) || !Number.isFinite(prev)) return;
      setRsiValue(last);
      const ob = Number(cfg.overbought ?? 70);
      const os = Number(cfg.oversold ?? 30);
      const status = last >= ob ? 'OVERBOUGHT' : last <= os ? 'OVERSOLD' : 'NEUTRAL';
      setRsiStatus(status);
      const p = rsiPrevRef.current;
      rsiPrevRef.current = last;
      if (Number.isFinite(p)) {
        if (p < ob && last >= ob) setRsiAlert({ type: 'overbought', ts: Date.now() });
        if (p > os && last <= os) setRsiAlert({ type: 'oversold', ts: Date.now() });
      }
    } catch (_e) {
      // silent
    }
  }, [candles, settings?.indicatorSettings?.rsiEnhanced]);

  useEffect(() => {
    if (!rsiAlert) return;
    const t = setTimeout(() => setRsiAlert(null), 3000);
    return () => clearTimeout(t);
  }, [rsiAlert]);

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
          shortName: 'Trend Strategy',
          series: 'price',
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
          series: 'price',
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
          series: 'price',
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
          series: 'price',
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

    // Register horizontal line overlay (custom; prefer built-in on create)
    registerOverlay({
      name: 'horizontalLine',
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

    // Register vertical line overlay (custom; prefer built-in on create)
    registerOverlay({
      name: 'verticalLine',
      totalStep: 1,
      createPointFigures: ({ coordinates, bounding }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 1 || !coordinates[0]) return [];
        const x = coordinates[0].x;
        const y1 = 0;
        const y2 = (bounding && typeof bounding.height === 'number') ? bounding.height : 9999;
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [{ x, y: y1 }, { x, y: y2 }],
            },
          },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Vertical line drawn:', overlay);
      },
    });

    // Helper: open inline text editor centered at (x,y) inside the chart container
    const openInlineTextEditor = (x, y, initialText, onCommit, overlayMeta) => {
      try {
        const container = chartContainerRef.current;
        if (!container) return;
        // Remove any existing editor (guard against races)
        const prev = container.querySelector('.kv-inline-rect-editor');
        try {
          if (prev && prev.isConnected) prev.remove();
        } catch (_) {
          if (prev && prev.parentNode) {
            try { prev.parentNode.removeChild(prev); } catch (_) { /* ignore */ }
          }
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.value = initialText || '';
        input.className = 'kv-inline-rect-editor';
        const leftVal = Math.max(0, Math.round(x - 80));
        const topVal = Math.max(0, Math.round(y - 10));
        Object.assign(input.style, {
          position: 'absolute',
          left: `${leftVal}px`,
          top: `${topVal}px`,
          width: '200px',
          padding: '4px 6px',
          fontSize: '12px',
          lineHeight: '16px',
          border: '1px solid #9CA3AF',
          borderRadius: '4px',
          background: '#ffffff',
          color: '#111827',
          zIndex: 80,
        });
        container.appendChild(input);
        inlineEditorActiveRef.current = true;
        input.focus();
        input.select();

        // Show delete popup near the inline input (to the right side)
        if (overlayMeta && overlayMeta.id) {
          try {
            setSelectedOverlayPanel({
              id: overlayMeta.id,
              name: overlayMeta.name,
              paneId: overlayMeta.paneId,
              x: leftVal + 200,
              y: topVal + 10,
            });
          } catch (_) { /* ignore */ }
        }

        let finalized = false;
        const cleanup = () => {
          if (finalized) return;
          finalized = true;
          try { input.removeEventListener('keydown', onKeyDown); } catch (_) { /* ignore */ }
          try { input.removeEventListener('blur', onBlur); } catch (_) { /* ignore */ }
          try {
            if (input.isConnected) input.remove();
            else if (input.parentNode) input.parentNode.removeChild(input);
          } catch (_) { /* ignore */ }
          inlineEditorActiveRef.current = false;
          try { setSelectedOverlayPanel(null); } catch (_) { /* ignore */ }
        };

        const finalize = (ok) => {
          if (finalized) return;
          const val = input.value;
          cleanup();
          if (ok && typeof onCommit === 'function') onCommit(val);
        };

        const onKeyDown = (e) => {
          if (e.key === 'Enter') { e.preventDefault(); finalize(true); }
          if (e.key === 'Escape') { e.preventDefault(); finalize(false); }
        };
        const onBlur = () => { finalize(true); };
        input.addEventListener('keydown', onKeyDown);
        input.addEventListener('blur', onBlur);
      } catch (_) { /* ignore */ }
    };

    // Register rectangle overlay (2 anchors, finalize on 3rd step)
    registerOverlay({
      name: 'rectangle',
      totalStep: 3,
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ chart, coordinates, overlay }) => {
        const points = overlay?.points || [];
        if (!Array.isArray(points) || points.length === 0) return [];

        // Convert to pixels for robust rendering
        let px = [];
        try {
          if (typeof chart.convertToPixel === 'function') {
            px = chart.convertToPixel(points) || [];
          }
        } catch (_) { px = []; }
        const c0 = px[0] || coordinates[0];
        const c1 = px[1] || coordinates[1];
        if (!c0) return [];

        // If only one point, show a tiny preview dot/zero-size rect via default point figure
        if (!c1) return [];

        const x = Math.min(c0.x, c1.x);
        const y = Math.min(c0.y, c1.y);
        const width = Math.abs((c1.x || 0) - (c0.x || 0));
        const height = Math.abs((c1.y || 0) - (c0.y || 0));

        const fillFromStyles = (overlay && overlay.styles && overlay.styles.rect && overlay.styles.rect.color) || overlay?.fillColor || 'rgba(78,205,196,0.3)';
        const borderFromStyles = (overlay && overlay.styles && overlay.styles.rect && overlay.styles.rect.borderColor) || overlay?.borderColor || '#4ECDC4';

        const figures = [
          {
            type: 'rect',
            attrs: { x, y, width, height },
            styles: {
              // 30% transparent fill with a border
              style: 'fill',
              color: fillFromStyles,
              borderColor: borderFromStyles,
              borderSize: 1,
            },
          },
        ];

        // Centered label. If none set, show editable placeholder.
        const labelText = (overlay && typeof overlay.text === 'string' && overlay.text.trim().length > 0)
          ? overlay.text
          : 'Add a text';
        const isPlaceholder = !(overlay && typeof overlay.text === 'string' && overlay.text.trim().length > 0);
        figures.push({
          type: 'text',
          attrs: {
            x: x + width / 2,
            y: y + height / 2,
            text: labelText,
            align: 'center',
            baseline: 'middle',
          },
          styles: {
            // Remove default blue background/border from overlay text
            backgroundColor: 'transparent',
            borderSize: 0,
            borderColor: 'transparent',
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            // Text color: muted when placeholder, darker when set
            color: isPlaceholder ? '#6B7280' : '#111827',
          },
        });

        return figures;
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Rectangle drawn:', overlay);
      },
      onClick: ({ chart, overlay, figure }) => {
        try {
          if (!overlay || !figure || figure.type !== 'text') return;
          // Recompute center from current points in pixels
          const pts = Array.isArray(overlay.points) ? overlay.points : [];
          const px = (typeof chart.convertToPixel === 'function') ? (chart.convertToPixel(pts) || []) : [];
          const c0 = px[0];
          const c1 = px[1];
          if (!c0 || !c1) return;
          const x = Math.min(c0.x, c1.x);
          const y = Math.min(c0.y, c1.y);
          const width = Math.abs((c1.x || 0) - (c0.x || 0));
          const height = Math.abs((c1.y || 0) - (c0.y || 0));
          const cx = x + width / 2;
          const cy = y + height / 2;
          const current = (overlay && typeof overlay.text === 'string') ? overlay.text : '';
          openInlineTextEditor(cx, cy, current, (val) => {
            chart.overrideOverlay({ id: overlay.id, text: String(val || '') });
          }, { id: overlay.id, name: overlay.name, paneId: overlay.paneId || overlay.pane?.id });
        } catch (_) { /* ignore */ }
      },
    });

    // Register text overlay (single click to place, click to edit)
    registerOverlay({
      name: 'text',
      totalStep: 1,
      createPointFigures: ({ coordinates, overlay }) => {
        if (!Array.isArray(coordinates) || coordinates.length < 1 || !coordinates[0]) return [];
        const c0 = coordinates[0];
        const label = (overlay && typeof overlay.text === 'string' && overlay.text.trim().length > 0)
          ? overlay.text
          : 'Text Annotation';
        return [
          {
            type: 'text',
            attrs: {
              x: c0.x,
              y: c0.y,
              text: label,
              align: 'left',
              baseline: 'bottom',
            },
            styles: {
              backgroundColor: 'transparent',
              borderSize: 0,
              borderColor: 'transparent',
              color: '#333333',
              size: 12,
              paddingLeft: 0,
              paddingRight: 0,
              paddingTop: 0,
              paddingBottom: 0,
            },
          },
        ];
      },
      onClick: ({ chart, overlay }) => {
        try {
          if (!chart || !overlay) return;
          const pts = Array.isArray(overlay.points) ? overlay.points : [];
          const px = (typeof chart.convertToPixel === 'function') ? (chart.convertToPixel(pts) || []) : [];
          const c0 = px[0];
          if (!c0) return;
          const current = (overlay && typeof overlay.text === 'string') ? overlay.text : '';
          openInlineTextEditor(c0.x, c0.y, current, (val) => {
            chart.overrideOverlay({ id: overlay.id, text: String(val || '') });
          }, { id: overlay.id, name: overlay.name, paneId: overlay.paneId || overlay.pane?.id });
        } catch (_) { /* ignore */ }
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Text annotation drawn:', overlay);
      },
    });

    // Register RSI zone fill overlay (pane-aware; aligns to indicator y-axis)
    registerOverlay({
      name: 'rsiBands',
      // No interactive drawing required
      totalStep: 0,
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: false,
      createPointFigures: ({ bounding, overlay, yAxis }) => {
        if (!bounding) return [];
        const left = Number(bounding.left) || 0;
        const top = Number(bounding.top) || 0;
        const width = Number(bounding.width) || 0;
        const height = Number(bounding.height) || 0;

        const ob = Number(overlay?.overbought ?? overlay?.ob ?? 70);
        const os = Number(overlay?.oversold ?? overlay?.os ?? 30);
        const obFill = overlay?.obFillColor || 'rgba(242,54,69,0.10)';
        const osFill = overlay?.osFillColor || 'rgba(8,153,129,0.10)';

        const toY = (val) => {
          try {
            if (yAxis && typeof yAxis.convertToPixel === 'function') {
              // Library-aware conversion within the RSI pane
              return yAxis.convertToPixel(val);
            }
          } catch (_) { /* ignore */ }
          // Fallback to simple linear mapping assuming 0..100 range
          const v = Math.max(0, Math.min(100, Number(val)));
          return top + (1 - v / 100) * height;
        };

        const yTop = toY(100);
        const yOb = toY(ob);
        const yOs = toY(os);
        const yBottom = toY(0);

        const topY = Math.min(yTop, yOb);
        const topH = Math.max(0, Math.abs(yOb - yTop));
        const botY = Math.min(yOs, yBottom);
        const botH = Math.max(0, Math.abs(yBottom - yOs));

        return [
          {
            type: 'rect',
            attrs: { x: left, y: topY, width, height: topH },
            styles: { style: 'fill', color: obFill },
          },
          {
            type: 'rect',
            attrs: { x: left, y: botY, width, height: botH },
            styles: { style: 'fill', color: osFill },
          },
        ];
      },
    });

    // Register a custom Fibonacci overlay that extends levels to the RIGHT only
    // (instead of both left and right like the built-in 'fibonacciLine')
    registerOverlay({
      name: 'fibonacciRightLine',
      totalStep: 3, // 2-point tool, finalize on 3rd step like built-in fibonacciLine
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ chart, coordinates, bounding, overlay, yAxis }) => {
        const points = overlay?.points || [];
        if (!Array.isArray(points) || points.length === 0) return [];

        // Determine price precision (follow built-in behavior)
        let precision = 0;
        try {
          const inCandle = (yAxis?.isInCandle?.() ?? true);
          if (inCandle) {
            precision = chart.getPrecision().price;
          } else {
            const indicators = chart.getIndicators({ paneId: overlay.paneId }) || [];
            indicators.forEach((ind) => {
              const p = Number(ind?.precision) || 0;
              precision = Math.max(precision, p);
            });
          }
        } catch (_e) {
          precision = 2;
        }

        // Robustly get pixel coordinates from overlay points
        let px = [];
        try {
          if (typeof chart.convertToPixel === 'function') {
            px = chart.convertToPixel(points) || [];
          }
        } catch (_) { px = []; }
        const c0 = px[0] || coordinates[0];
        const c1 = px[1] || coordinates[1];
        if (!c0) return [];

        // Preview main line after 2nd step if c1 exists
        const preview = [];
        if (c0 && c1) {
          preview.push({ coordinates: [c0, c1] });
        }

        // Only render fib levels when both point values are available
        const lines = [];
        const texts = [];
        // Get color from overlay styles, fallback to default
        const lineColor = overlay?.styles?.line?.color || overlay?.color || '#9C27B0';
        if (c1 && Number.isFinite(points?.[0]?.value) && Number.isFinite(points?.[1]?.value)) {
          const percents = [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0];
          const endX = (bounding && typeof bounding.width === 'number') ? bounding.width : Math.max(c0.x || 0, c1.x || 0);
          const startX = Math.min(c0.x || 0, c1.x || 0);
          const yDif = c0.y - c1.y;
          const valueDif = (points[0].value ?? 0) - (points[1].value ?? 0);

          percents.forEach((percent) => {
            const y = c1.y + yDif * percent;
            const rawValue = ((points[1].value ?? 0) + valueDif * percent);
            let displayValue = String(rawValue);
            try {
              displayValue = chart
                .getDecimalFold()
                .format(chart.getThousandsSeparator().format(rawValue.toFixed(precision)));
            } catch (_e) {
              displayValue = rawValue.toFixed(precision);
            }
            lines.push({ coordinates: [{ x: startX, y }, { x: endX, y }] });
            texts.push({ x: startX, y, text: `${displayValue} (${(percent * 100).toFixed(1)}%)`, baseline: 'bottom' });
          });
        }

        return [
          { type: 'line', attrs: preview, styles: { size: 1, style: 'dash', color: lineColor } },
          { type: 'line', attrs: lines, styles: { size: 1, color: lineColor } },
          { type: 'text', isCheckEvent: false, attrs: texts },
        ];
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Fibonacci (right-only) drawn:', overlay);
      },
    });

    // Register Trend-based Fibonacci Extension (3 points), right-only projections
    registerOverlay({
      name: 'fibonacciTrendExtensionRight',
      totalStep: 4, // Collect 3 anchors (A,B,C); 4th step finalizes, matching built-ins that use 3 anchors
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ chart, coordinates, bounding, overlay, yAxis }) => {
        try {
          const points = overlay?.points || [];
          if (!Array.isArray(points) || points.length === 0) return [];

          // Always derive pixel coordinates from points for reliability,
          // then fall back to provided `coordinates` if needed.
          let px = [];
          try {
            if (typeof chart.convertToPixel === 'function') {
              px = chart.convertToPixel(points) || [];
            }
          } catch (_) {
            px = [];
          }
          const c0 = px[0] || coordinates[0];
          const c1 = px[1] || coordinates[1];
          const c2 = px[2] || coordinates[2];
          if (!c0 || !c1) return [];

          // Determine price precision
          let precision = 0;
          try {
            const inCandle = (yAxis?.isInCandle?.() ?? true);
            if (inCandle) {
              precision = chart.getPrecision().price;
            } else {
              const indicators = chart.getIndicators({ paneId: overlay.paneId }) || [];
              indicators.forEach((ind) => {
                const p = Number(ind?.precision) || 0;
                precision = Math.max(precision, p);
              });
            }
          } catch (_e) {
            precision = 2;
          }

          const coordsForWidth = [c0, c1, c2].filter(Boolean);
          const width = (bounding && typeof bounding.width === 'number')
            ? bounding.width
            : Math.max(0, Math.max(...coordsForWidth.map(c => c.x || 0)) + 1);

          // Guide lines visible during drawing
          const guideLines = [];
          if (c0 && c1) {
            guideLines.push({ coordinates: [c0, c1] });
          }
          if (c1 && c2) {
            guideLines.push({ coordinates: [c1, c2] });
          }

          // With fewer than 3 points, only show guides and default points
          if (!c2) {
            return [
              { type: 'line', attrs: guideLines },
            ];
          }

          // Use common extension ratios
          const ratios = [0.618, 1.0, 1.272, 1.618, 2.0, 2.618];

          // Leg AB in price and pixels
          const v0 = Number(points?.[0]?.value);
          const v1 = Number(points?.[1]?.value);
          const v2 = Number(points?.[2]?.value);
          const deltaPrice = (Number.isFinite(v1) && Number.isFinite(v0)) ? (v1 - v0) : 0;
          const deltaY = (c1.y - c0.y);

          // Start drawing to the right of the rightmost anchor
          const startX = Math.max(c0.x, c1.x, c2.x);
          const endX = width;

          const lines = [];
          const texts = [];
          // Get color from overlay styles, fallback to default
          const lineColor = overlay?.styles?.line?.color || overlay?.color || '#9C27B0';

          ratios.forEach((r) => {
            const rawValue = (Number.isFinite(v2) ? v2 : 0) + deltaPrice * r;
            let displayValue = String(rawValue);
            try {
              displayValue = chart
                .getDecimalFold()
                .format(chart.getThousandsSeparator().format(rawValue.toFixed(precision)));
            } catch (_e) {
              displayValue = rawValue.toFixed(precision);
            }

            const y = c2.y + deltaY * r;
            lines.push({ coordinates: [{ x: startX, y }, { x: endX, y }] });
            texts.push({ x: startX, y, text: `${displayValue} (${(r * 100).toFixed(1)}%)`, baseline: 'bottom' });
          });

          return [
            { type: 'line', attrs: guideLines, styles: { size: 1, style: 'dash', color: lineColor } },
            { type: 'line', attrs: lines, styles: { size: 1, color: lineColor } },
            { type: 'text', isCheckEvent: false, attrs: texts },
          ];
        } catch (_err) {
          // On any error, return at least the default points/empty figures to avoid overlay removal
          return [];
        }
      },
      onDrawEnd: ({ overlay }) => {
        console.log('📈 Trend Fib Extension (right-only) drawn:', overlay);
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
              // Use custom right-only fibonacci overlay
              fibonacci: 'fibonacciRightLine',
              // Trend-based Fibonacci Extension (3 points), right-only
              fibExtension: 'fibonacciTrendExtensionRight',
              // Prefer built-ins for robust multi-instance behavior
              horizontalLine: 'horizontalStraightLine',
              verticalLine: 'verticalStraightLine',
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

      // Store handlers for external use
      chart._handleDrawingToolChange = handleDrawingToolChange;
      chart._dismissSelectedOverlayPanel = () => {
        try { setSelectedOverlayPanel(null); } catch (_) { /* ignore */ }
        try {
          const container = chartContainerRef.current;
          const prev = container?.querySelector('.kv-inline-rect-editor');
          if (prev && prev.isConnected) prev.remove();
        } catch (_) { /* ignore */ }
      };
      chart._openConfirmModal = (opts) => {
        try {
          const { title, message, confirmText, cancelText, onConfirm } = opts || {};
          setConfirmModal({
            title: title || 'Confirm',
            message: message || 'Are you sure?',
            confirmText: confirmText || 'Confirm',
            cancelText: cancelText || 'Cancel',
            onConfirm: typeof onConfirm === 'function' ? onConfirm : null,
          });
        } catch (_) { /* ignore */ }
      };
      chart._closeConfirmModal = () => setConfirmModal(null);

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
        try { if (chart && chart._dismissSelectedOverlayPanel) delete chart._dismissSelectedOverlayPanel; } catch (_) { /* ignore */ }
        try { if (chart && chart._handleDrawingToolChange) delete chart._handleDrawingToolChange; } catch (_) { /* ignore */ }
        try { if (chart && chart._openConfirmModal) delete chart._openConfirmModal; } catch (_) { /* ignore */ }
        try { if (chart && chart._closeConfirmModal) delete chart._closeConfirmModal; } catch (_) { /* ignore */ }
        // No need to set isInitialized to false
      };
    } catch (error) {
      console.error('📈 Error initializing K-line chart:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize K-line chart');
    }
  }, [settings.showGrid, setKLineChartRef, settings.timezone]); // Include timezone for initial setup

  // Apply cursor mode (crosshair, pointer, grab) for KLine chart
  // - Crosshair: enable chart crosshair and set cursor to crosshair
  // - Pointer: disable crosshair and set cursor to pointer
  // - Grab: disable crosshair and set cursor to grab/grabbing during drag
  useEffect(() => {
    const container = chartContainerRef.current;
    const chart = chartRef.current;
    if (!container) return;

    const mode = settings?.cursorType ?? 'crosshair';
    const baseCursor = mode === 'grab' ? 'grab' : mode; // 'crosshair' | 'pointer' | 'grab'

    // Ensure base cursor via style (fallback) and via CSS class from JSX
    try { container.style.cursor = baseCursor; } catch (_) { /* ignore style errors */ }
    try { container.classList.remove('kline-cursor-grabbing'); } catch (_) { /* ignore */ }

    try {
      if (chart && typeof chart.setStyles === 'function') {
        chart.setStyles({
          crosshair: { show: mode === 'crosshair' }
        });
      }
    } catch (_) { /* optional API differences */ }

    // For grab mode, switch to 'grabbing' during mouse drag
    const handleMouseDown = () => {
      if (mode === 'grab') {
        try { container.style.cursor = 'grabbing'; } catch (_) { /* ignore */ }
        try { container.classList.add('kline-cursor-grabbing'); } catch (_) { /* ignore */ }
      }
    };
    const handleMouseUp = () => {
      try { container.style.cursor = baseCursor; } catch (_) { /* ignore */ }
      try { container.classList.remove('kline-cursor-grabbing'); } catch (_) { /* ignore */ }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [settings]);

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
      // While workspace is hidden, ensure indicators are not drawn even if switches are on
      if (isWorkspaceHidden) {
        try {
          const chart = chartRef.current;
          const tryRemoveByList = (list) => {
            if (!Array.isArray(list)) return;
            list.forEach((ind) => {
              try { chart.removeIndicator({ id: ind?.id, name: ind?.name, paneId: ind?.paneId }); } catch (_) {}
              try { chart.removeIndicator({ name: ind?.name }); } catch (_) {}
              try { chart.removeIndicator(ind?.id); } catch (_) {}
            });
          };
          let inds = [];
          try { inds = chart.getIndicators?.() || []; } catch (_) { inds = []; }
          if (!Array.isArray(inds) || inds.length === 0) {
            const panes = ['candle_pane', 'pane_0', 'pane_1', 'pane_2', 'pane-rsiEnhanced', 'pane-atrEnhanced', 'pane-macdEnhanced'];
            panes.forEach((pid) => {
              try { tryRemoveByList(chart.getIndicators?.({ paneId: pid }) || []); } catch (_) {}
            });
          } else {
            tryRemoveByList(inds);
          }
        } catch (_) { /* ignore */ }
        return; // Skip creating indicators while hidden
      }

      console.log('📈 KLineChart: Indicator settings changed', settings.indicators);

      // Support RSI Enhanced (pane), ATR Enhanced (pane), MACD Enhanced (pane). BOLL overlays are handled separately below.
      const rsiCfg = settings?.indicatorSettings?.rsiEnhanced || {};
      const indicatorMap = {
        rsiEnhanced: { name: 'RSI', params: { calcParams: [Math.max(1, Number(rsiCfg.length) || 14)] }, newPane: true },
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
              if (key === 'rsiEnhanced') {
                // Remove any existing RSI pane before re-adding to avoid duplicates on settings change
                try { chartRef.current.removeIndicator({ paneId: `pane-${key}` }); } catch (_) {}
                try { chartRef.current.removeIndicator({ name: indicatorName }); } catch (_) {}
                const lineColor = rsiCfg.rsiLineColor || '#2962FF';
                indicatorArg = {
                  name: indicatorName,
                  calcParams: config.params.calcParams,
                  styles: {
                    lines: [
                      { color: lineColor, size: 1 }
                    ]
                  }
                };
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
              // Ensure RSI zone fill overlay is present and synced
              if (key === 'rsiEnhanced') {
                try { chartRef.current.removeOverlay({ name: 'rsiBands', paneId: `pane-${key}` }); } catch (_) {}
                try { chartRef.current.removeOverlay({ name: 'rsiBands' }); } catch (_) {}
                try {
                  chartRef.current.createOverlay({
                    name: 'rsiBands',
                    paneId: `pane-${key}`,
                    overbought: Number(rsiCfg.overbought ?? 70),
                    oversold: Number(rsiCfg.oversold ?? 30),
                    obFillColor: rsiCfg.obFillColor || 'rgba(242,54,69,0.10)',
                    osFillColor: rsiCfg.osFillColor || 'rgba(8,153,129,0.10)'
                  });
                } catch (_) { /* ignore */ }
              }
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
            if (key === 'rsiEnhanced') {
              try { chartRef.current.removeOverlay({ name: 'rsiBands', paneId: `pane-${key}` }); } catch (_) {}
              try { chartRef.current.removeOverlay({ name: 'rsiBands' }); } catch (_) {}
            }
          } catch (_error) {
            // Silently ignore if indicator doesn't exist
          }
        }
      });
    } catch (error) {
      console.error('📈 KLineChart: Error handling indicator changes:', error);
    }
  }, [settings.indicators, settings?.indicatorSettings?.rsiEnhanced, isWorkspaceHidden]);

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
        {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
        <div
          ref={chartContainerRef}
          className={`absolute inset-0 ${
            settings?.cursorType === 'grab'
              ? 'kline-cursor-grab'
              : settings?.cursorType === 'pointer'
              ? 'kline-cursor-pointer'
              : 'kline-cursor-crosshair'
          }`}
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
          role="application"
          aria-label="Trading chart with drawing tools"
          tabIndex={0}
          onClick={(e) => {
            try {
              const chart = chartRef.current;
              const container = chartContainerRef.current;
              if (!chart || !container) return;
              // Ignore clicks on overlay action panel or color palettes so chart doesn't handle them
              const target = e.target;
              if (target) {
                const overlayPanel = target.closest('[role="dialog"][aria-label="Drawing actions"]');
                const colorPalette = target.closest('.kv-rect-color-palette, .kv-trendline-color-palette, .kv-horizline-color-palette, .kv-vertline-color-palette, .kv-fib-color-palette, .kv-fibext-color-palette');
                if (overlayPanel || colorPalette) {
                  return;
                }
              }
              // When workspace is hidden, suppress overlay selection UI entirely
              if (isWorkspaceHidden) { setSelectedOverlayPanel(null); return; }
              if (inlineEditorActiveRef.current) {
                // Do not alter selection while inline editor is open
                return;
              }
              const rect = container.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;

              // Fetch overlays; support both getOverlays and getAllOverlays for lib compatibility
              let overlays = [];
              try {
                if (typeof chart.getOverlays === 'function') overlays = chart.getOverlays();
                else if (typeof chart.getAllOverlays === 'function') overlays = chart.getAllOverlays();
              } catch (_) {}
              if (!Array.isArray(overlays) || overlays.length === 0) {
                setSelectedOverlayPanel(null);
                return;
              }

              // Consider trend/horizontal/vertical, both Fibonacci tools, rectangle, and text
              const candidateOverlays = overlays.filter((ov) => ov && ov.visible !== false && (
                ov.name === 'segment' || ov.name === 'trendLine' ||
                ov.name === 'horizontalStraightLine' || ov.name === 'horizontalLine' ||
                ov.name === 'verticalStraightLine' || ov.name === 'verticalLine' ||
                ov.name === 'fibonacciRightLine' || ov.name === 'fibonacciTrendExtensionRight' ||
                ov.name === 'rectangle' || ov.name === 'text'
              ));
              if (candidateOverlays.length === 0) {
                setSelectedOverlayPanel(null);
                return;
              }

              // Utility: point-line distance
              const distancePointToSegment = (px, py, x1, y1, x2, y2) => {
                const dx = x2 - x1;
                const dy = y2 - y1;
                if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
                const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
                const cx = x1 + t * dx;
                const cy = y1 + t * dy;
                return { dist: Math.hypot(px - cx, py - cy), cx, cy };
              };

              let best = { dist: Infinity, overlay: null, cx: 0, cy: 0 };
              candidateOverlays.forEach((ov) => {
                try {
                  const name = ov.name;
                  const pts = Array.isArray(ov.points) ? ov.points : [];
                  const pxPts = Array.isArray(pts) && pts.length > 0 ? chart.convertToPixel(pts) : [];
                  const c1 = Array.isArray(pxPts) && pxPts[0] ? pxPts[0] : null;
                  const c2 = Array.isArray(pxPts) && pxPts[1] ? pxPts[1] : null;
                  const c3 = Array.isArray(pxPts) && pxPts[2] ? pxPts[2] : null;

                  // Trend/segment: need two points
                  if ((name === 'segment' || name === 'trendLine') && c1 && c2 && typeof c1.x === 'number' && typeof c1.y === 'number' && typeof c2.x === 'number' && typeof c2.y === 'number') {
                    const res = distancePointToSegment(clickX, clickY, c1.x, c1.y, c2.x, c2.y);
                    if (res.dist < best.dist) best = { dist: res.dist, overlay: ov, cx: res.cx, cy: res.cy };
                    return;
                  }

                  // Horizontal: use y distance to infinite-width line
                  if ((name === 'horizontalStraightLine' || name === 'horizontalLine') && c1 && typeof c1.y === 'number') {
                    const y = c1.y;
                    const dist = Math.abs(clickY - y);
                    const cx = Math.max(0, Math.min(clickX, (chartContainerRef.current?.clientWidth || 0)));
                    if (dist < best.dist) best = { dist, overlay: ov, cx, cy: y };
                    return;
                  }

                  // Vertical: use x distance to infinite-height line
                  if ((name === 'verticalStraightLine' || name === 'verticalLine') && c1 && typeof c1.x === 'number') {
                    const x = c1.x;
                    const dist = Math.abs(clickX - x);
                    const cy = Math.max(0, Math.min(clickY, (chartContainerRef.current?.clientHeight || 0)));
                    if (dist < best.dist) best = { dist, overlay: ov, cx: x, cy };
                    return;
                  }

                  // Rectangle: select if click is inside or near any edge
                  if (name === 'rectangle' && c1 && c2) {
                    const x1 = Math.min(c1.x, c2.x);
                    const x2 = Math.max(c1.x, c2.x);
                    const y1 = Math.min(c1.y, c2.y);
                    const y2 = Math.max(c1.y, c2.y);

                    const inside = clickX >= x1 && clickX <= x2 && clickY >= y1 && clickY <= y2;

                    // Edge distances
                    const resTop = distancePointToSegment(clickX, clickY, x1, y1, x2, y1);
                    const resBottom = distancePointToSegment(clickX, clickY, x1, y2, x2, y2);
                    const resLeft = distancePointToSegment(clickX, clickY, x1, y1, x1, y2);
                    const resRight = distancePointToSegment(clickX, clickY, x2, y1, x2, y2);
                    const bestEdge = [resTop, resBottom, resLeft, resRight].reduce((a, b) => (a.dist < b.dist ? a : b));

                    // Prefer inside hits as strongest selection
                    const dist = inside ? 0 : bestEdge.dist;
                    const cx = inside ? Math.min(Math.max(clickX, x1), x2) : bestEdge.cx;
                    const cy = inside ? Math.min(Math.max(clickY, y1), y2) : bestEdge.cy;
                    if (dist < best.dist) best = { dist, overlay: ov, cx, cy };
                    return;
                  }

                  // Fibonacci Retracement (right-only): test distance to each horizontal level
                  if (name === 'fibonacciRightLine' && c1 && c2 && Number.isFinite(pts?.[0]?.value) && Number.isFinite(pts?.[1]?.value)) {
                    const containerW = (chartContainerRef.current?.clientWidth || 0);
                    const startX = Math.min(c1.x, c2.x);
                    const endX = containerW;
                    const yDif = c1.y - c2.y;
                    const percents = [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0];
                    percents.forEach((p) => {
                      const y = c2.y + yDif * p;
                      const res = distancePointToSegment(clickX, clickY, startX, y, endX, y);
                      if (res.dist < best.dist) best = { dist: res.dist, overlay: ov, cx: Math.min(Math.max(clickX, startX), endX), cy: y };
                    });
                    return;
                  }

                  // Trend-based Fibonacci Extension (right-only): distance to each projected level
                  if (name === 'fibonacciTrendExtensionRight' && c1 && c2 && c3 && Number.isFinite(pts?.[0]?.value) && Number.isFinite(pts?.[1]?.value) && Number.isFinite(pts?.[2]?.value)) {
                    const containerW = (chartContainerRef.current?.clientWidth || 0);
                    const startX = Math.max(c1.x, c2.x, c3.x);
                    const endX = containerW;
                    const deltaY = (c2.y - c1.y);
                    const ratios = [0.618, 1.0, 1.272, 1.618, 2.0, 2.618];
                    ratios.forEach((r) => {
                      const y = c3.y + deltaY * r;
                      const res = distancePointToSegment(clickX, clickY, startX, y, endX, y);
                      if (res.dist < best.dist) best = { dist: res.dist, overlay: ov, cx: Math.min(Math.max(clickX, startX), endX), cy: y };
                    });
                    return;
                  }
                } catch (_) { /* ignore overlay */ }
              });

              // Threshold in pixels to count as clicking on the line
              const THRESHOLD = 8;
              if (best.overlay && best.dist <= THRESHOLD) {
                setSelectedOverlayPanel({
                  id: best.overlay.id,
                  name: best.overlay.name,
                  paneId: best.overlay.paneId || best.overlay.pane?.id,
                  x: best.cx,
                  y: best.cy
                });
              } else {
                setSelectedOverlayPanel(null);
              }
            } catch (_) {}
          }}
          onKeyDown={(e) => {
            // Handle keyboard interaction for accessibility
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // For keyboard users, trend line selection is primarily mouse-driven
              // This handler satisfies accessibility requirements
            }
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
          
          {/* RSI Enhanced alerts (top-right) */}
          {settings?.indicators?.rsiEnhanced && (
            <div className="absolute top-2 right-2 z-50 space-y-1 pointer-events-none">
              {/* Transient alert chip */}
              {rsiAlert && (
                <div
                  className="rounded-md shadow text-[11px] font-medium px-2 py-1 text-white inline-block pointer-events-auto"
                  style={{
                    backgroundColor: rsiAlert.type === 'overbought' ? '#f23645' : '#089981'
                  }}
                >
                  {rsiAlert.type === 'overbought' ? 'RSI Overbought' : 'RSI Oversold'}
                </div>
              )}
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
            if (activeBelow.length === 0 || isWorkspaceHidden) return null;
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
                      {/* RSI zone fills are drawn by overlay 'rsiBands' on the RSI pane */}

                      {/* Action panel */}
                      <div
                        className={`absolute top-2 left-2 transition-opacity duration-150 ${isHoveringBelowPanes ? 'opacity-100' : 'opacity-0'}`}
                        style={{ pointerEvents: isHoveringBelowPanes ? 'auto' : 'none' }}
                      >
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-transparent border border-gray-200 rounded-md">
              {key === 'rsiEnhanced' && (
                <label
                  className="w-4 h-4 rounded border border-gray-200 overflow-hidden cursor-pointer"
                  title="RSI Line Color"
                >
                  <input
                    type="color"
                    value={settings?.indicatorSettings?.rsiEnhanced?.rsiLineColor || '#2962FF'}
                    onChange={(e) => { try { updateIndicatorSettings('rsiEnhanced', { rsiLineColor: e.target.value }); } catch (_) {} }}
                    className="w-0 h-0 opacity-0 absolute"
                    aria-label="RSI Line Color"
                  />
                  <span
                    className="block w-4 h-4"
                    style={{ backgroundColor: settings?.indicatorSettings?.rsiEnhanced?.rsiLineColor || '#2962FF' }}
                  />
                </label>
              )}
                          <button
                            type="button"
                            title="Delete"
                            className="w-6 h-6 grid place-items-center text-gray-600 hover:text-red-600"
                            aria-label="Delete indicator"
                            onClick={() => toggleIndicator(key)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Configure"
                            className="w-6 h-6 grid place-items-center text-gray-600 hover:text-blue-600"
                            aria-label="Configure indicator"
                            onClick={() => { if (key === 'rsiEnhanced') setShowRsiSettings(true); }}
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

          {/* RSI Enhanced Settings Modal (moved outside of below-panes map) */}
          {showRsiSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#19235d]">RSI Settings</h3>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowRsiSettings(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="rsi-length" className="block text-sm text-gray-700 mb-1">RSI Length</label>
                    <input
                      id="rsi-length"
                      type="number"
                      min={1}
                      max={100}
                      value={localRsiSettings.length}
                      onChange={(e) => setLocalRsiSettings((p) => ({ ...p, length: Math.max(1, parseInt(e.target.value || '14', 10)) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsi-source" className="block text-sm text-gray-700 mb-1">Source</label>
                    <select
                      id="rsi-source"
                      value={localRsiSettings.source}
                      onChange={(e) => setLocalRsiSettings((p) => ({ ...p, source: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="close">Close</option>
                      <option value="open">Open</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                      <option value="hl2">HL2 (avg high/low)</option>
                      <option value="hlc3">HLC3 (avg high/low/close)</option>
                      <option value="ohlc4">OHLC4 (avg open/high/low/close)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rsi-overbought" className="block text-sm text-gray-700 mb-1">Overbought</label>
                      <input
                        id="rsi-overbought"
                        type="number"
                        min={50}
                        max={100}
                        value={localRsiSettings.overbought}
                        onChange={(e) => setLocalRsiSettings((p) => ({ ...p, overbought: parseInt(e.target.value || '70', 10) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="rsi-oversold" className="block text-sm text-gray-700 mb-1">Oversold</label>
                      <input
                        id="rsi-oversold"
                        type="number"
                        min={0}
                        max={50}
                        value={localRsiSettings.oversold}
                        onChange={(e) => setLocalRsiSettings((p) => ({ ...p, oversold: parseInt(e.target.value || '30', 10) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
              {/* Line color moved to pane color picker; width setting removed */}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                    onClick={() => setShowRsiSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    onClick={() => {
                      const payload = {
                        length: Math.max(1, Number(localRsiSettings.length) || 14),
                        source: String(localRsiSettings.source || 'close'),
                        overbought: Math.min(100, Math.max(50, Number(localRsiSettings.overbought) || 70)),
                        oversold: Math.max(0, Math.min(50, Number(localRsiSettings.oversold) || 30)),
                        rsiLineColor: localRsiSettings.rsiLineColor || '#2962FF',
                        rsiLineWidth: Math.max(1, Number(localRsiSettings.rsiLineWidth) || 2),
                      };
                      try { updateIndicatorSettings('rsiEnhanced', payload); } catch (_) {}
                      setShowRsiSettings(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hover actions for on-chart overlay indicators (main price pane) */}
          {(() => {
            const ON_CHART_KEYS = ['emaTouch','bbPro','maEnhanced','orbEnhanced','stEnhanced','srEnhanced'];
            const LABELS = {
              emaTouch: 'Trend Strategy',
              bbPro: 'Bollinger Bands - Pro',
              maEnhanced: 'MA Enhanced',
              orbEnhanced: 'ORB Enhanced',
              stEnhanced: 'SuperTrend Enhanced',
              srEnhanced: 'S/R Enhanced'
            };
            const activeOnChart = ON_CHART_KEYS.filter((k) => settings?.indicators?.[k]);
            if (activeOnChart.length === 0 || isWorkspaceHidden) return null;
            return (
              <div className="absolute top-2 left-2 space-y-1 transition-opacity duration-150" style={{ zIndex: 60, pointerEvents: isHoveringOnChartOverlays ? 'auto' : 'none', opacity: isHoveringOnChartOverlays ? 1 : 0 }}>
                {activeOnChart.map((key) => (
                  <div key={key} className="flex items-center gap-2 px-2 py-1.5 bg-transparent border border-gray-200 rounded-md">
                    <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">{LABELS[key] || key}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Delete"
                        className="w-6 h-6 grid place-items-center text-gray-600 hover:text-red-600"
                        aria-label={`Delete ${LABELS[key] || key}`}
                        onClick={() => toggleIndicator(key)}
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

          {/* Selected drawing action panel (trend line delete) */}
          {selectedOverlayPanel && !isWorkspaceHidden && (
            <div
              className="absolute"
              style={{
                left: Math.max(4, Math.min(selectedOverlayPanel.x + 6, (chartContainerRef.current?.clientWidth || 0) - 40)),
                top: Math.max(4, Math.min(selectedOverlayPanel.y - 10, (chartContainerRef.current?.clientHeight || 0) - 30)),
                zIndex: 70
              }}
              role="dialog"
              aria-label="Drawing actions"
              onMouseDown={(e) => { e.stopPropagation(); }}
              onPointerDown={(e) => { e.stopPropagation(); }}
              onTouchStart={(e) => { e.stopPropagation(); }}
            >
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-transparent border border-gray-200 rounded-md shadow-sm">
                <button
                  type="button"
                  title="Delete"
                  className="w-6 h-6 grid place-items-center text-gray-600 hover:text-red-600"
                  aria-label="Delete drawing"
                  onMouseDown={(e) => {
                    // Use mousedown so deletion occurs before input blur cleanup
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const chart = chartRef.current;
                      const id = selectedOverlayPanel?.id;
                      const paneId = selectedOverlayPanel?.paneId;
                      if (!chart || !id) {
                        setSelectedOverlayPanel(null);
                        return;
                      }

                      // Only remove the exact overlay by id; do NOT pass name
                      // Try object form with paneId first (most specific), then fallback to id string
                      let removed = false;
                      try {
                        chart.removeOverlay({ id, paneId });
                        removed = true;
                      } catch (_) { /* ignore */ }
                      if (!removed) {
                        try {
                          chart.removeOverlay({ id });
                          removed = true;
                        } catch (_) { /* ignore */ }
                      }
                      if (!removed) {
                        try {
                          chart.removeOverlay(id);
                          removed = true;
                        } catch (_) { /* ignore */ }
                      }
                    } catch (_) { /* ignore */ }
                    // Also remove any inline editor if open
                    try {
                      const container = chartContainerRef.current;
                      if (container) {
                        const editor = container.querySelector('.kv-inline-rect-editor');
                        if (editor && editor.parentNode) editor.parentNode.removeChild(editor);
                      }
                    } catch (_) { /* ignore */ }
                    inlineEditorActiveRef.current = false;
                    setSelectedOverlayPanel(null);
                  }}
                  onClick={(e) => {
                    // Fallback for keyboard users (Enter/Space)
                    e.stopPropagation();
                    try {
                      const chart = chartRef.current;
                      const id = selectedOverlayPanel?.id;
                      const paneId = selectedOverlayPanel?.paneId;
                      if (!chart || !id) {
                        setSelectedOverlayPanel(null);
                        return;
                      }
                      let removed = false;
                      try { chart.removeOverlay({ id, paneId }); removed = true; } catch (_) {}
                      if (!removed) { try { chart.removeOverlay({ id }); removed = true; } catch (_) {} }
                      if (!removed) { try { chart.removeOverlay(id); removed = true; } catch (_) {} }
                    } catch (_) { /* ignore */ }
                    try {
                      const container = chartContainerRef.current;
                      if (container) {
                        const editor = container.querySelector('.kv-inline-rect-editor');
                        if (editor && editor.parentNode) editor.parentNode.removeChild(editor);
                      }
                    } catch (_) { /* ignore */ }
                    inlineEditorActiveRef.current = false;
                    setSelectedOverlayPanel(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {selectedOverlayPanel?.name === 'rectangle' && (
                  <div className="relative ml-1 flex items-center">
                    <button
                      type="button"
                      title="Change color"
                      className="w-[18px] h-[18px] rounded border border-gray-300"
                      aria-label="Change rectangle color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      style={{ backgroundColor: (() => {
                        try {
                          const chart = chartRef.current;
                          const id = selectedOverlayPanel?.id;
                          if (chart && id) {
                            let overlays = [];
                            try {
                              if (typeof chart.getOverlays === 'function') overlays = chart.getOverlays();
                              else if (typeof chart.getAllOverlays === 'function') overlays = chart.getAllOverlays();
                            } catch (_) {}
                            const ov = Array.isArray(overlays) ? overlays.find(o => o && o.id === id) : null;
                            const hex = ov?.styles?.rect?.borderColor || ov?.borderColor;
                            if (typeof hex === 'string') return hex;
                          }
                        } catch (_) { /* ignore */ }
                        return '#4ECDC4';
                      })() }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const triggerBtn = e.currentTarget;
                        // toggle palette via simple DOM flag by injecting/removing a small panel
                        const host = e.currentTarget.parentElement;
                        if (!host) return;
                        const existing = host.querySelector('.kv-rect-color-palette');
                        if (existing) { existing.remove(); return; }
                        const palette = document.createElement('div');
                        palette.className = 'kv-rect-color-palette';
                        Object.assign(palette.style, {
                          position: 'absolute',
                          top: '28px',
                          left: '0',
                          background: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 18px)',
                          gap: '6px',
                          zIndex: 80,
                        });
                        // Prevent chart from entering grab-pan when interacting with palette
                        try {
                          palette.addEventListener('mousedown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { capture: true, passive: true });
                        } catch (_) { /* ignore */ }
                        const COLORS = ['#4ECDC4','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#22C55E','#06B6D4','#A855F7'];
                        COLORS.forEach((hex) => {
                          const sw = document.createElement('button');
                          sw.type = 'button';
                          sw.title = hex;
                          sw.setAttribute('aria-label', `Pick ${hex}`);
                          Object.assign(sw.style, {
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            border: '1px solid #D1D5DB',
                            background: hex,
                            cursor: 'pointer',
                          });
                          try {
                            sw.addEventListener('mousedown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { passive: true });
                          } catch (_) { /* ignore */ }
                          sw.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            try {
                              const chart = chartRef.current;
                              const id = selectedOverlayPanel?.id;
                              if (!chart || !id) return;
                              // apply 30% alpha for fill; keep border as solid hex
                              const rgba = hex.match(/^#([0-9a-f]{6})$/i) ? hex : '#4ECDC4';
                              // convert hex to rgba with 0.3
                              const r = parseInt(rgba.slice(1,3),16);
                              const g = parseInt(rgba.slice(3,5),16);
                              const b = parseInt(rgba.slice(5,7),16);
                              const fill = `rgba(${r},${g},${b},0.3)`;
                              chart.overrideOverlay({ id, styles: { rect: { color: fill, borderColor: hex } } });
                              // reflect change on the trigger button immediately
                              try { triggerBtn.style.backgroundColor = hex; } catch (_) {}
                              // force a light re-render so other UI can pick up new color
                              try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                            } catch (_) { /* ignore */ }
                            palette.remove();
                          });
                          palette.appendChild(sw);
                        });
                        host.appendChild(palette);
                        const cleanup = (evt) => {
                          if (!host.contains(evt.target)) {
                            palette.remove();
                            window.removeEventListener('mousedown', cleanup);
                          }
                        };
                        setTimeout(() => window.addEventListener('mousedown', cleanup), 0);
                      }}
                    />
                  </div>
                )}
                {(selectedOverlayPanel?.name === 'segment' || selectedOverlayPanel?.name === 'trendLine') && (
                  <div className="relative ml-1 flex items-center">
                    <button
                      type="button"
                      title="Change color"
                      className="w-[18px] h-[18px] rounded border border-gray-300"
                      aria-label="Change trend line color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      style={{ backgroundColor: (() => {
                        try {
                          const chart = chartRef.current;
                          const id = selectedOverlayPanel?.id;
                          if (chart && id) {
                            let overlays = [];
                            try {
                              if (typeof chart.getOverlays === 'function') overlays = chart.getOverlays();
                              else if (typeof chart.getAllOverlays === 'function') overlays = chart.getAllOverlays();
                            } catch (_) {}
                            const ov = Array.isArray(overlays) ? overlays.find(o => o && o.id === id) : null;
                            const hex = ov?.styles?.line?.color || ov?.color || ov?.styles?.color;
                            if (typeof hex === 'string') return hex;
                          }
                        } catch (_) { /* ignore */ }
                        return '#2962FF';
                      })() }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const triggerBtn = e.currentTarget;
                        // toggle palette via simple DOM flag by injecting/removing a small panel
                        const host = e.currentTarget.parentElement;
                        if (!host) return;
                        const existing = host.querySelector('.kv-trendline-color-palette');
                        if (existing) { existing.remove(); return; }
                        const palette = document.createElement('div');
                        palette.className = 'kv-trendline-color-palette';
                        Object.assign(palette.style, {
                          position: 'absolute',
                          top: '28px',
                          left: '0',
                          background: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 18px)',
                          gap: '6px',
                          zIndex: 80,
                        });
                        // Prevent chart from entering grab-pan when interacting with palette
                        try {
                          palette.addEventListener('mousedown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { capture: true, passive: true });
                        } catch (_) { /* ignore */ }
                        const COLORS = ['#4ECDC4','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#22C55E','#06B6D4','#A855F7'];
                        COLORS.forEach((hex) => {
                          const sw = document.createElement('button');
                          sw.type = 'button';
                          sw.title = hex;
                          sw.setAttribute('aria-label', `Pick ${hex}`);
                          Object.assign(sw.style, {
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            border: '1px solid #D1D5DB',
                            background: hex,
                            cursor: 'pointer',
                          });
                          try {
                            sw.addEventListener('mousedown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { passive: true });
                          } catch (_) { /* ignore */ }
                          sw.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            try {
                              const chart = chartRef.current;
                              const id = selectedOverlayPanel?.id;
                              if (!chart || !id) return;
                              // apply color to trend line/segment
                              const rgba = hex.match(/^#([0-9a-f]{6})$/i) ? hex : '#2962FF';
                              chart.overrideOverlay({ id, styles: { line: { color: rgba } } });
                              // reflect change on the trigger button immediately
                              try { triggerBtn.style.backgroundColor = rgba; } catch (_) {}
                              // force a light re-render so other UI can pick up new color
                              try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                            } catch (_) { /* ignore */ }
                            palette.remove();
                          });
                          palette.appendChild(sw);
                        });
                        host.appendChild(palette);
                        const cleanup = (evt) => {
                          if (!host.contains(evt.target)) {
                            palette.remove();
                            window.removeEventListener('mousedown', cleanup);
                          }
                        };
                        setTimeout(() => window.addEventListener('mousedown', cleanup), 0);
                      }}
                    />
                  </div>
                )}
                {(selectedOverlayPanel?.name === 'horizontalStraightLine' || selectedOverlayPanel?.name === 'horizontalLine') && (
                  <div className="relative ml-1 flex items-center">
                    <button
                      type="button"
                      title="Change color"
                      className="w-[18px] h-[18px] rounded border border-gray-300"
                      aria-label="Change horizontal line color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      style={{ backgroundColor: (() => {
                        try {
                          const chart = chartRef.current;
                          const id = selectedOverlayPanel?.id;
                          if (chart && id) {
                            let overlays = [];
                            try {
                              if (typeof chart.getOverlays === 'function') overlays = chart.getOverlays();
                              else if (typeof chart.getAllOverlays === 'function') overlays = chart.getAllOverlays();
                            } catch (_) {}
                            const ov = Array.isArray(overlays) ? overlays.find(o => o && o.id === id) : null;
                            const hex = ov?.styles?.line?.color || ov?.color || ov?.styles?.color;
                            if (typeof hex === 'string') return hex;
                          }
                        } catch (_) { /* ignore */ }
                        return '#f97316';
                      })() }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const triggerBtn = e.currentTarget;
                        // toggle palette via simple DOM flag by injecting/removing a small panel
                        const host = e.currentTarget.parentElement;
                        if (!host) return;
                        const existing = host.querySelector('.kv-horizline-color-palette');
                        if (existing) { existing.remove(); return; }
                        const palette = document.createElement('div');
                        palette.className = 'kv-horizline-color-palette';
                        Object.assign(palette.style, {
                          position: 'absolute',
                          top: '28px',
                          left: '0',
                          background: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 18px)',
                          gap: '6px',
                          zIndex: 80,
                        });
                        // Prevent chart from entering grab-pan when interacting with palette
                        try {
                          palette.addEventListener('mousedown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { capture: true, passive: true });
                        } catch (_) { /* ignore */ }
                        const COLORS = ['#4ECDC4','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#22C55E','#06B6D4','#A855F7'];
                        COLORS.forEach((hex) => {
                          const sw = document.createElement('button');
                          sw.type = 'button';
                          sw.title = hex;
                          sw.setAttribute('aria-label', `Pick ${hex}`);
                          Object.assign(sw.style, {
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            border: '1px solid #D1D5DB',
                            background: hex,
                            cursor: 'pointer',
                          });
                          try {
                            sw.addEventListener('mousedown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { passive: true });
                          } catch (_) { /* ignore */ }
                          sw.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            try {
                              const chart = chartRef.current;
                              const id = selectedOverlayPanel?.id;
                              if (!chart || !id) return;
                              // apply color to horizontal line
                              const rgba = hex.match(/^#([0-9a-f]{6})$/i) ? hex : '#f97316';
                              chart.overrideOverlay({ id, styles: { line: { color: rgba } } });
                              // reflect change on the trigger button immediately
                              try { triggerBtn.style.backgroundColor = rgba; } catch (_) {}
                              // force a light re-render so other UI can pick up new color
                              try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                            } catch (_) { /* ignore */ }
                            palette.remove();
                          });
                          palette.appendChild(sw);
                        });
                        host.appendChild(palette);
                        const cleanup = (evt) => {
                          if (!host.contains(evt.target)) {
                            palette.remove();
                            window.removeEventListener('mousedown', cleanup);
                          }
                        };
                        setTimeout(() => window.addEventListener('mousedown', cleanup), 0);
                      }}
                    />
                  </div>
                )}
                {(selectedOverlayPanel?.name === 'verticalStraightLine' || selectedOverlayPanel?.name === 'verticalLine') && (
                  <div className="relative ml-1 flex items-center">
                    <button
                      type="button"
                      title="Change color"
                      className="w-[18px] h-[18px] rounded border border-gray-300"
                      aria-label="Change vertical line color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      style={{ backgroundColor: (() => {
                        try {
                          const chart = chartRef.current;
                          const id = selectedOverlayPanel?.id;
                          if (chart && id) {
                            let overlays = [];
                            try {
                              if (typeof chart.getOverlays === 'function') overlays = chart.getOverlays();
                              else if (typeof chart.getAllOverlays === 'function') overlays = chart.getAllOverlays();
                            } catch (_) {}
                            const ov = Array.isArray(overlays) ? overlays.find(o => o && o.id === id) : null;
                            const hex = ov?.styles?.line?.color || ov?.color || ov?.styles?.color;
                            if (typeof hex === 'string') return hex;
                          }
                        } catch (_) { /* ignore */ }
                        return '#f97316';
                      })() }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const triggerBtn = e.currentTarget;
                        // toggle palette via simple DOM flag by injecting/removing a small panel
                        const host = e.currentTarget.parentElement;
                        if (!host) return;
                        const existing = host.querySelector('.kv-vertline-color-palette');
                        if (existing) { existing.remove(); return; }
                        const palette = document.createElement('div');
                        palette.className = 'kv-vertline-color-palette';
                        Object.assign(palette.style, {
                          position: 'absolute',
                          top: '28px',
                          left: '0',
                          background: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 18px)',
                          gap: '6px',
                          zIndex: 80,
                        });
                        // Prevent chart from entering grab-pan when interacting with palette
                        try {
                          palette.addEventListener('mousedown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { capture: true, passive: true });
                        } catch (_) { /* ignore */ }
                        const COLORS = ['#4ECDC4','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#22C55E','#06B6D4','#A855F7'];
                        COLORS.forEach((hex) => {
                          const sw = document.createElement('button');
                          sw.type = 'button';
                          sw.title = hex;
                          sw.setAttribute('aria-label', `Pick ${hex}`);
                          Object.assign(sw.style, {
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            border: '1px solid #D1D5DB',
                            background: hex,
                            cursor: 'pointer',
                          });
                          try {
                            sw.addEventListener('mousedown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { passive: true });
                          } catch (_) { /* ignore */ }
                          sw.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            try {
                              const chart = chartRef.current;
                              const id = selectedOverlayPanel?.id;
                              if (!chart || !id) return;
                              // apply color to vertical line
                              const rgba = hex.match(/^#([0-9a-f]{6})$/i) ? hex : '#f97316';
                              chart.overrideOverlay({ id, styles: { line: { color: rgba } } });
                              // reflect change on the trigger button immediately
                              try { triggerBtn.style.backgroundColor = rgba; } catch (_) {}
                              // force a light re-render so other UI can pick up new color
                              try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                            } catch (_) { /* ignore */ }
                            palette.remove();
                          });
                          palette.appendChild(sw);
                        });
                        host.appendChild(palette);
                        const cleanup = (evt) => {
                          if (!host.contains(evt.target)) {
                            palette.remove();
                            window.removeEventListener('mousedown', cleanup);
                          }
                        };
                        setTimeout(() => window.addEventListener('mousedown', cleanup), 0);
                      }}
                    />
                  </div>
                )}
                {selectedOverlayPanel?.name === 'fibonacciRightLine' && (
                  <div className="relative ml-1 flex items-center">
                    <button
                      type="button"
                      title="Change color"
                      className="w-[18px] h-[18px] rounded border border-gray-300"
                      aria-label="Change Fibonacci retracement color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      style={{ backgroundColor: (() => {
                        try {
                          const chart = chartRef.current;
                          const id = selectedOverlayPanel?.id;
                          if (chart && id) {
                            let overlays = [];
                            try {
                              if (typeof chart.getOverlays === 'function') overlays = chart.getOverlays();
                              else if (typeof chart.getAllOverlays === 'function') overlays = chart.getAllOverlays();
                            } catch (_) {}
                            const ov = Array.isArray(overlays) ? overlays.find(o => o && o.id === id) : null;
                            const hex = ov?.styles?.line?.color || ov?.color || ov?.styles?.color;
                            if (typeof hex === 'string') return hex;
                          }
                        } catch (_) { /* ignore */ }
                        return '#9C27B0';
                      })() }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const triggerBtn = e.currentTarget;
                        // toggle palette via simple DOM flag by injecting/removing a small panel
                        const host = e.currentTarget.parentElement;
                        if (!host) return;
                        const existing = host.querySelector('.kv-fib-color-palette');
                        if (existing) { existing.remove(); return; }
                        const palette = document.createElement('div');
                        palette.className = 'kv-fib-color-palette';
                        Object.assign(palette.style, {
                          position: 'absolute',
                          top: '28px',
                          left: '0',
                          background: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 18px)',
                          gap: '6px',
                          zIndex: 80,
                        });
                        // Prevent chart from entering grab-pan when interacting with palette
                        try {
                          palette.addEventListener('mousedown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { capture: true, passive: true });
                        } catch (_) { /* ignore */ }
                        const COLORS = ['#4ECDC4','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#22C55E','#06B6D4','#A855F7'];
                        COLORS.forEach((hex) => {
                          const sw = document.createElement('button');
                          sw.type = 'button';
                          sw.title = hex;
                          sw.setAttribute('aria-label', `Pick ${hex}`);
                          Object.assign(sw.style, {
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            border: '1px solid #D1D5DB',
                            background: hex,
                            cursor: 'pointer',
                          });
                          try {
                            sw.addEventListener('mousedown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { passive: true });
                          } catch (_) { /* ignore */ }
                          sw.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            try {
                              const chart = chartRef.current;
                              const id = selectedOverlayPanel?.id;
                              if (!chart || !id) return;
                              // apply color to Fibonacci retracement lines
                              const rgba = hex.match(/^#([0-9a-f]{6})$/i) ? hex : '#9C27B0';
                              chart.overrideOverlay({ id, styles: { line: { color: rgba } } });
                              // reflect change on the trigger button immediately
                              try { triggerBtn.style.backgroundColor = rgba; } catch (_) {}
                              // force a light re-render so other UI can pick up new color
                              try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                            } catch (_) { /* ignore */ }
                            palette.remove();
                          });
                          palette.appendChild(sw);
                        });
                        host.appendChild(palette);
                        const cleanup = (evt) => {
                          if (!host.contains(evt.target)) {
                            palette.remove();
                            window.removeEventListener('mousedown', cleanup);
                          }
                        };
                        setTimeout(() => window.addEventListener('mousedown', cleanup), 0);
                      }}
                    />
                  </div>
                )}
                {selectedOverlayPanel?.name === 'fibonacciTrendExtensionRight' && (
                  <div className="relative ml-1 flex items-center">
                    <button
                      type="button"
                      title="Change color"
                      className="w-[18px] h-[18px] rounded border border-gray-300"
                      aria-label="Change Fibonacci extension color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      style={{ backgroundColor: (() => {
                        try {
                          const chart = chartRef.current;
                          const id = selectedOverlayPanel?.id;
                          if (chart && id) {
                            let overlays = [];
                            try {
                              if (typeof chart.getOverlays === 'function') overlays = chart.getOverlays();
                              else if (typeof chart.getAllOverlays === 'function') overlays = chart.getAllOverlays();
                            } catch (_) {}
                            const ov = Array.isArray(overlays) ? overlays.find(o => o && o.id === id) : null;
                            const hex = ov?.styles?.line?.color || ov?.color || ov?.styles?.color;
                            if (typeof hex === 'string') return hex;
                          }
                        } catch (_) { /* ignore */ }
                        return '#9C27B0';
                      })() }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const triggerBtn = e.currentTarget;
                        // toggle palette via simple DOM flag by injecting/removing a small panel
                        const host = e.currentTarget.parentElement;
                        if (!host) return;
                        const existing = host.querySelector('.kv-fibext-color-palette');
                        if (existing) { existing.remove(); return; }
                        const palette = document.createElement('div');
                        palette.className = 'kv-fibext-color-palette';
                        Object.assign(palette.style, {
                          position: 'absolute',
                          top: '28px',
                          left: '0',
                          background: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 18px)',
                          gap: '6px',
                          zIndex: 80,
                        });
                        // Prevent chart from entering grab-pan when interacting with palette
                        try {
                          palette.addEventListener('mousedown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); }, { capture: true });
                          palette.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { capture: true, passive: true });
                        } catch (_) { /* ignore */ }
                        const COLORS = ['#4ECDC4','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#22C55E','#06B6D4','#A855F7'];
                        COLORS.forEach((hex) => {
                          const sw = document.createElement('button');
                          sw.type = 'button';
                          sw.title = hex;
                          sw.setAttribute('aria-label', `Pick ${hex}`);
                          Object.assign(sw.style, {
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            border: '1px solid #D1D5DB',
                            background: hex,
                            cursor: 'pointer',
                          });
                          try {
                            sw.addEventListener('mousedown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); });
                            sw.addEventListener('touchstart', (ev) => { ev.stopPropagation(); }, { passive: true });
                          } catch (_) { /* ignore */ }
                          sw.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            try {
                              const chart = chartRef.current;
                              const id = selectedOverlayPanel?.id;
                              if (!chart || !id) return;
                              // apply color to Fibonacci extension lines
                              const rgba = hex.match(/^#([0-9a-f]{6})$/i) ? hex : '#9C27B0';
                              chart.overrideOverlay({ id, styles: { line: { color: rgba } } });
                              // reflect change on the trigger button immediately
                              try { triggerBtn.style.backgroundColor = rgba; } catch (_) {}
                              // force a light re-render so other UI can pick up new color
                              try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                            } catch (_) { /* ignore */ }
                            palette.remove();
                          });
                          palette.appendChild(sw);
                        });
                        host.appendChild(palette);
                        const cleanup = (evt) => {
                          if (!host.contains(evt.target)) {
                            palette.remove();
                            window.removeEventListener('mousedown', cleanup);
                          }
                        };
                        setTimeout(() => window.addEventListener('mousedown', cleanup), 0);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Custom center modal for confirmations */}
        {confirmModal && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center" role="dialog" aria-modal="true">
            <div 
              className="absolute inset-0 bg-black bg-opacity-40" 
              onClick={() => setConfirmModal(null)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setConfirmModal(null);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Close modal"
            />
            <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-[320px] max-w-[90%] p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{confirmModal.title}</h3>
              <p className="text-xs text-gray-600 mb-4">{confirmModal.message}</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => setConfirmModal(null)}
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                  onClick={() => {
                    try { if (confirmModal.onConfirm) confirmModal.onConfirm(); } catch (_) { /* ignore */ }
                    setConfirmModal(null);
                  }}
                >
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
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
