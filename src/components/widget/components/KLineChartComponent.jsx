import { init, registerOverlay, registerIndicator, getSupportedIndicators } from 'klinecharts';
import { Trash2, Settings } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import { formatPrice } from '../../../utils/formatters';
import { useChartStore } from '../stores/useChartStore';
import { calculateRSI, calculateEMA, calculateSMA, calculateBollingerBands } from '../utils/indicators';

// MA colors by index (stable references for hook dependencies)
const MA_COLORS_BY_INDEX = {
  1: '#2962FF',
  2: '#FF6D00',
  3: '#26A69A',
  4: '#9C27B0',
};

export const KLineChartComponent = ({
  candles = [],
  settings = {},
  onLoadMoreHistory,
  isLoadingHistory = false,
  hasMoreHistory = true,
  panelSettings: _panelSettings = {},
  isFullscreen = false,
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

  // ATR enhanced UI state
  const [showAtrSettings, setShowAtrSettings] = useState(false);
  const [localAtrSettings, setLocalAtrSettings] = useState(() => ({
    length: 14,
    smoothingMethod: 'RMA',
  }));

  // MACD - Pro (MACD Enhanced) UI state
  const [showMacdSettings, setShowMacdSettings] = useState(false);
  const [localMacdSettings, setLocalMacdSettings] = useState(() => ({
    fastLength: 12,
    slowLength: 26,
    signalLength: 9,
    source: 'close',
  }));

  // Trend Strategy (EMA Touch) UI state
  const [showEmaTouchSettings, setShowEmaTouchSettings] = useState(false);
  const [localEmaTouchSettings, setLocalEmaTouchSettings] = useState(() => ({
    bbLength: 20,
    bbStdDev: 2.0,
    atrLength: 14,
    tp1Multiplier: 1.0,
    tp2Multiplier: 2.5,
    tp3Multiplier: 4.0,
  }));

  // Moving Average - Pro (MA Enhanced) UI state
  const [showMaSettings, setShowMaSettings] = useState(false);
  const [localMaSettings, setLocalMaSettings] = useState(() => ({
    maType: 'EMA',
    source: 'close',
    ma1Enabled: true,
    ma1Length: 9,
    ma2Enabled: true,
    ma2Length: 21,
    ma3Enabled: true,
    ma3Length: 50,
    ma4Enabled: false,
    ma4Length: 100,
  }));

  // Bollinger Bands - Pro (BB Pro) UI state
  const [showBbSettings, setShowBbSettings] = useState(false);
  const [localBbSettings, setLocalBbSettings] = useState(() => ({
    length: 20,
    source: 'close',
    stdDev: 2.0,
  }));

  // Opening Range Breakout (ORB) UI state
  const [showOrbSettings, setShowOrbSettings] = useState(false);
  const [localOrbSettings, setLocalOrbSettings] = useState(() => ({
    startHour: 9,
    startMinute: 15,
    orPeriod: 1,
    targetRR: 4.0,
  }));

  // SuperTrend - Pro (ST Enhanced) UI state
  const [showStSettings, setShowStSettings] = useState(false);
  const [localStSettings, setLocalStSettings] = useState(() => ({
    atrPeriod: 10,
    atrMultiplier: 3.0,
  }));

  // Keep track of programmatically-created ST label overlays (for cleanup)
  const stLabelOverlayIdsRef = useRef([]);
  // Keep track of programmatically-created ORB label overlays (for cleanup)
  const orbLabelOverlayIdsRef = useRef([]);
  // Keep track of programmatically-created S/R break label overlays (for cleanup)
  const srLabelOverlayIdsRef = useRef([]);

  // Track below-pane order (actual stacking order by enable sequence)
  const [_belowPaneOrder, setBelowPaneOrder] = useState(() => {
    try {
      const keys = ['rsiEnhanced', 'atrEnhanced', 'macdEnhanced'];
      return keys.filter((k) => settings?.indicators?.[k]);
    } catch (_) {
      return [];
    }
  });

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

  useEffect(() => {
    if (!showAtrSettings) return;
    const cfg = settings?.indicatorSettings?.atrEnhanced || {};
    setLocalAtrSettings({
      length: Number(cfg.length) || 14,
      smoothingMethod: String(cfg.smoothingMethod || 'RMA'),
    });
  }, [showAtrSettings, settings?.indicatorSettings?.atrEnhanced]);

  useEffect(() => {
    if (!showMacdSettings) return;
    const cfg = settings?.indicatorSettings?.macdEnhanced || {};
    setLocalMacdSettings({
      fastLength: Number(cfg.fastLength) || 12,
      slowLength: Number(cfg.slowLength) || 26,
      signalLength: Number(cfg.signalLength) || 9,
      source: String(cfg.source || 'close').toLowerCase(),
    });
  }, [showMacdSettings, settings?.indicatorSettings?.macdEnhanced]);

  // Maintain dynamic order of below panes based on enable sequence
  useEffect(() => {
    try {
      const keys = ['rsiEnhanced', 'atrEnhanced', 'macdEnhanced'];
      const enabledNow = keys.filter((k) => Boolean(settings?.indicators?.[k]));
      setBelowPaneOrder((prev) => {
        // Keep existing order for still-enabled items
        const next = prev.filter((k) => enabledNow.includes(k));
        // Append newly enabled items at the end (bottom-most pane)
        enabledNow.forEach((k) => {
          if (!next.includes(k)) next.push(k);
        });
        return next;
      });
    } catch (_) {
      // ignore
    }
  }, [settings?.indicators]);

  useEffect(() => {
    if (!showAtrSettings) return;
    const cfg = settings?.indicatorSettings?.atrEnhanced || {};
    setLocalAtrSettings({
      length: Math.max(1, Number(cfg.length) || 14),
      smoothingMethod: String(cfg.smoothingMethod || 'RMA'),
    });
  }, [showAtrSettings, settings?.indicatorSettings?.atrEnhanced]);

  useEffect(() => {
    if (!showEmaTouchSettings) return;
    const cfg = settings?.indicatorSettings?.emaTouch || {};
    setLocalEmaTouchSettings({
      bbLength: Math.max(1, Number(cfg.bbLength) || 20),
      bbStdDev: Number(cfg.bbStdDev ?? 2.0),
      atrLength: Math.max(1, Number(cfg.atrLength) || 14),
      tp1Multiplier: Number(cfg.tp1Multiplier ?? 1.0),
      tp2Multiplier: Number(cfg.tp2Multiplier ?? 2.5),
      tp3Multiplier: Number(cfg.tp3Multiplier ?? 4.0),
    });
  }, [showEmaTouchSettings, settings?.indicatorSettings?.emaTouch]);
  
  // Get the setter from store
  const { setKLineChartRef, toggleIndicator, isWorkspaceHidden, updateIndicatorSettings } = useChartStore();
  
  // Sync local MA settings when opening the modal
  useEffect(() => {
    if (!showMaSettings) return;
    const cfg = settings?.indicatorSettings?.maEnhanced || {};
    setLocalMaSettings({
      maType: cfg.maType === 'SMA' ? 'SMA' : 'EMA',
      source: cfg.source || 'close',
      ma1Enabled: cfg.ma1Enabled !== false,
      ma1Length: Math.max(1, Number(cfg.ma1Length) || 9),
      ma2Enabled: cfg.ma2Enabled !== false,
      ma2Length: Math.max(1, Number(cfg.ma2Length) || 21),
      ma3Enabled: cfg.ma3Enabled !== false,
      ma3Length: Math.max(1, Number(cfg.ma3Length) || 50),
      ma4Enabled: Boolean(cfg.ma4Enabled),
      ma4Length: Math.max(1, Number(cfg.ma4Length) || 100),
    });
  }, [showMaSettings, settings?.indicatorSettings?.maEnhanced]);

  // Sync local BB settings when opening the modal
  useEffect(() => {
    if (!showBbSettings) return;
    const cfg = settings?.indicatorSettings?.bbPro || {};
    setLocalBbSettings({
      length: Math.max(1, Number(cfg.length) || 20),
      source: cfg.source || 'close',
      stdDev: Math.max(0.1, Number(cfg.stdDev) || 2.0),
    });
  }, [showBbSettings, settings?.indicatorSettings?.bbPro]);

  // Sync local ORB settings when opening the modal
  useEffect(() => {
    if (!showOrbSettings) return;
    const cfg = settings?.indicatorSettings?.orbEnhanced || {};
    setLocalOrbSettings({
      startHour: Math.max(0, Math.min(23, Number(cfg.startHour) || 9)),
      startMinute: Math.max(0, Math.min(59, Number(cfg.startMinute) || 15)),
      orPeriod: Math.max(1, Number(cfg.orPeriod) || 1),
      targetRR: Math.max(0.5, Number(cfg.targetRR) || 4.0),
    });
  }, [showOrbSettings, settings?.indicatorSettings?.orbEnhanced]);

  // Sync local ST settings when opening the modal
  useEffect(() => {
    if (!showStSettings) return;
    const cfg = settings?.indicatorSettings?.stEnhanced || {};
    setLocalStSettings({
      atrPeriod: Math.max(1, Number(cfg.atrPeriod) || 10),
      atrMultiplier: Math.max(0.5, Number(cfg.atrMultiplier) || 3.0),
    });
  }, [showStSettings, settings?.indicatorSettings?.stEnhanced]);

  // SuperTrend computed stats for Trend/Trend Bars and Buy/Sell signals
  const stStats = useMemo(() => {
    try {
      if (!Array.isArray(candles) || candles.length === 0) return null;
      const cfg = settings?.indicatorSettings?.stEnhanced || {};
      const l = Math.max(1, Number(cfg.atrPeriod) || 10);
      const m = Math.max(0.5, Number(cfg.atrMultiplier) || 3.0);
      let prevAtr = null;
      let prevFinalUpper = NaN;
      let prevFinalLower = NaN;
      let prevTrend = 1;
      let trendBars = 0;
      const buySignals = [];
      const sellSignals = [];
      let lastSupertrend = NaN;
      for (let i = 0; i < candles.length; i++) {
        const k = candles[i];
        const prev = candles[i - 1] || k;
        const hl2 = (Number(k.high) + Number(k.low)) / 2;
        const tr = Math.max(
          Number(k.high) - Number(k.low),
          Math.abs(Number(k.high) - Number(prev.close)),
          Math.abs(Number(k.low) - Number(prev.close))
        );
        let atr = tr;
        if (i > 0 && prevAtr != null) atr = ((prevAtr * (l - 1)) + tr) / l; // Wilder's RMA
        prevAtr = atr;
        const basicUpper = hl2 + m * atr;
        const basicLower = hl2 - m * atr;
        let finalUpper;
        if (!Number.isFinite(prevFinalUpper) || Number(prev.close) > prevFinalUpper) finalUpper = basicUpper; else finalUpper = Math.min(basicUpper, prevFinalUpper);
        let finalLower;
        if (!Number.isFinite(prevFinalLower) || Number(prev.close) < prevFinalLower) finalLower = basicLower; else finalLower = Math.max(basicLower, prevFinalLower);
        let trend = prevTrend;
        if (i > 0) {
          if (Number(k.close) > prevFinalUpper) trend = 1; else if (Number(k.close) < prevFinalLower) trend = -1;
        }
        const supertrend = trend === 1 ? finalLower : finalUpper;
        const rawTime = (k.timestamp ?? k.time ?? 0);
        const tsMs = rawTime < 946684800000 ? rawTime * 1000 : rawTime;
        if (i > 0) {
          const prevTrendVal = prevTrend;
          if (trend === 1 && prevTrendVal === -1) {
            buySignals.push({ ts: tsMs, price: supertrend });
            trendBars = 1;
          } else if (trend === -1 && prevTrendVal === 1) {
            sellSignals.push({ ts: tsMs, price: supertrend });
            trendBars = 1;
          } else {
            trendBars += 1;
          }
        } else {
          trendBars = 1;
        }
        lastSupertrend = supertrend;
        prevFinalUpper = finalUpper;
        prevFinalLower = finalLower;
        prevTrend = trend;
      }
      return {
        lastTrendUp: prevTrend === 1,
        trendBars,
        lastSupertrend: Number.isFinite(lastSupertrend) ? lastSupertrend : null,
        buySignals,
        sellSignals,
      };
    } catch (_e) {
      return null;
    }
  }, [candles, settings?.indicatorSettings?.stEnhanced]);

  // Render BUY/SELL badges for SuperTrend signals
  useEffect(() => {
    try {
      const chart = chartRef.current;
      if (!chart) return;
      // Remove previously created ST badges
      try {
        const ids = Array.isArray(stLabelOverlayIdsRef.current) ? stLabelOverlayIdsRef.current : [];
        ids.forEach((id) => {
          try { chart.removeOverlay({ id }); } catch (_) {}
          try { chart.removeOverlay(id); } catch (_) {}
        });
      } catch (_) { /* ignore */ }
      stLabelOverlayIdsRef.current = [];

      if (!settings?.indicators?.stEnhanced || !stStats) return;

      const addBadge = (ts, price, label, style) => {
        if (!Number.isFinite(ts) || !Number.isFinite(price)) return;
        const overlaySpec = {
          name: 'text',
          text: label,
          points: [{ timestamp: ts, value: price }],
          styles: {
            text: {
              backgroundColor: style.bg,
              color: style.color,
              padding: 4,
              borderSize: 0,
            }
          }
        };
        try {
          const ov = chart.createOverlay(overlaySpec);
          const id = (ov && (ov.id || ov)) || null;
          if (id) stLabelOverlayIdsRef.current.push(id);
        } catch (_) { /* ignore */ }
      };

      const maxSignals = 50;
      const buy = Array.isArray(stStats.buySignals) ? stStats.buySignals.slice(-maxSignals) : [];
      const sell = Array.isArray(stStats.sellSignals) ? stStats.sellSignals.slice(-maxSignals) : [];
      buy.forEach((s) => addBadge(s.ts, s.price, 'BUY', { bg: 'rgba(38,166,154,0.20)', color: '#0b5f56' }));
      sell.forEach((s) => addBadge(s.ts, s.price, 'SELL', { bg: 'rgba(239,83,80,0.20)', color: '#7a1f1f' }));
    } catch (_) { /* ignore */ }
  }, [settings?.indicators?.stEnhanced, stStats]);

  // MA values table (top-right) computed values for current dataset and settings
  const maTableData = useMemo(() => {
    try {
      if (!Array.isArray(candles) || candles.length === 0) return [];
      const cfg = settings?.indicatorSettings?.maEnhanced || {};
      const type = cfg.maType === 'SMA' ? 'SMA' : 'EMA';
      const src = (cfg.source || 'close').toLowerCase();
      // Build selected MA set (index 1..4)
      const selected = [
        { idx: 1, enabled: cfg.ma1Enabled !== false, len: Math.max(1, Number(cfg.ma1Length) || 9) },
        { idx: 2, enabled: cfg.ma2Enabled !== false, len: Math.max(1, Number(cfg.ma2Length) || 21) },
        { idx: 3, enabled: cfg.ma3Enabled !== false, len: Math.max(1, Number(cfg.ma3Length) || 50) },
        { idx: 4, enabled: Boolean(cfg.ma4Enabled), len: Math.max(1, Number(cfg.ma4Length) || 100) },
      ].filter((d) => d.enabled);
      if (selected.length === 0) return [];
      // Map candles to chosen source (reuse RSI mapping approach)
      const mapped = candles.map((c) => {
        const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close);
        let v = cl;
        if (src === 'open') v = o; else if (src === 'high') v = h; else if (src === 'low') v = l;
        else if (src === 'hl2') v = (h + l) / 2; else if (src === 'hlc3') v = (h + l + cl) / 3; else if (src === 'ohlc4') v = (o + h + l + cl) / 4;
        return { ...c, close: v };
      });
      return selected.map(({ idx, len }) => {
        const series = type === 'SMA' ? (calculateSMA(mapped, len) || []) : (calculateEMA(mapped, len) || []);
        const last = series.length > 0 ? series[series.length - 1]?.value : null;
        return { index: idx, period: len, color: MA_COLORS_BY_INDEX[idx], value: typeof last === 'number' ? last : null, type };
      });
    } catch (_e) {
      return [];
    }
  }, [candles, settings?.indicatorSettings?.maEnhanced]);

  // BB Pro table stats (Upper, Middle, Lower, %B, Bandwidth)
  const bbProStats = useMemo(() => {
    try {
      if (!Array.isArray(candles) || candles.length === 0) return null;
      const cfg = settings?.indicatorSettings?.bbPro || {};
      const len = Math.max(1, Number(cfg.length) || 20);
      const mult = Math.max(0.1, Number(cfg.stdDev) || 2.0);
      const src = (cfg.source || 'close').toLowerCase();
      if (candles.length < len) return null;
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
      const series = calculateBollingerBands(mapped, len, mult) || [];
      if (series.length === 0) return null;
      const last = series[series.length - 1];
      if (!last) return null;
      const currentSource = Number(mapped[mapped.length - 1]?.close);
      const upper = Number(last.upper);
      const middle = Number(last.middle);
      const lower = Number(last.lower);
      if (!Number.isFinite(upper) || !Number.isFinite(middle) || !Number.isFinite(lower)) return null;
      const range = upper - lower;
      const percentB = Number.isFinite(range) && range !== 0 ? ((currentSource - lower) / range) * 100 : null;
      const bandwidth = Number.isFinite(middle) && middle !== 0 ? (range / middle) * 100 : null;
      return { upper, middle, lower, percentB, bandwidth };
    } catch (_e) {
      return null;
    }
  }, [candles, settings?.indicatorSettings?.bbPro]);
  
  // ORB (Opening Range Breakout) computed stats for top-right table and badges
  const orbStats = useMemo(() => {
    try {
      if (!Array.isArray(candles) || candles.length === 0) return null;
      const cfg = settings?.indicatorSettings?.orbEnhanced || {};
      const h = Math.max(0, Math.min(23, Number(cfg.startHour) || 9));
      const m = Math.max(0, Math.min(59, Number(cfg.startMinute) || 15));
      const orPeriod = Math.max(1, Number(cfg.orPeriod) || 1);
      const rr = Math.max(0.5, Number(cfg.targetRR) || 4.0);
      // timeframe suitability (<= 60 minutes)
      const tf = String(settings?.timeframe || '1h');
      const toMinutes = (tfStr) => {
        const match = /^([0-9]+)([mhdw])$/i.exec(tfStr.trim());
        if (!match) return 60; // default 60m
        const n = parseInt(match[1], 10);
        const u = match[2].toLowerCase();
        if (u === 'm') return n;
        if (u === 'h') return n * 60;
        if (u === 'd') return n * 60 * 24;
        if (u === 'w') return n * 60 * 24 * 7;
        return 60;
      };
      const isSuitableTimeframe = toMinutes(tf) <= 60;
      // Iterate and build state for the most recent bar
      let lastDay = null;
      let openingHigh = NaN;
      let openingLow = NaN;
      let orStartIdx = -1;
      let captured = false;
      let buyTaken = false;
      let sellTaken = false;
      let buyEntry = NaN;
      let sellEntry = NaN;
      let buyTs = NaN;
      let sellTs = NaN;
      let buyTP = NaN;
      let sellTP = NaN;
      let buySL = NaN;
      let sellSL = NaN;
      let buyTPHit = false;
      let sellTPHit = false;
      let buySLHit = false;
      let sellSLHit = false;
      let buyTPHitTs = null;
      let sellTPHitTs = null;
      let buySLHitTs = null;
      let sellSLHitTs = null;
      for (let i = 0; i < candles.length; i++) {
        const k = candles[i];
        const rawTime = (k.timestamp ?? k.time ?? 0);
        const tsMs = rawTime < 946684800000 ? rawTime * 1000 : rawTime;
        const d = new Date(tsMs);
        const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (dayKey !== lastDay) {
          lastDay = dayKey;
          openingHigh = NaN;
          openingLow = NaN;
          orStartIdx = -1;
          captured = false;
          buyTaken = false;
          sellTaken = false;
          buyEntry = NaN;
          sellEntry = NaN;
          buyTP = NaN;
          sellTP = NaN;
          buySL = NaN;
          sellSL = NaN;
          buyTPHit = false;
          sellTPHit = false;
          buySLHit = false;
          sellSLHit = false;
          buyTPHitTs = null;
          sellTPHitTs = null;
          buySLHitTs = null;
          sellSLHitTs = null;
        }
        const isOpening = d.getHours() === h && d.getMinutes() === m && !captured;
        if (isOpening) {
          openingHigh = Number(k.high);
          openingLow = Number(k.low);
          orStartIdx = i;
          captured = true;
        }
        if (captured && orStartIdx >= 0 && (i - orStartIdx) < orPeriod) {
          openingHigh = Math.max(openingHigh, Number(k.high));
          openingLow = Math.min(openingLow, Number(k.low));
        }
        const range = (isFinite(openingHigh) && isFinite(openingLow)) ? (openingHigh - openingLow) : NaN;
        const prev = candles[i - 1] || k;
        if (captured && isFinite(range) && !buyTaken && Number(k.close) > openingHigh && Number(prev.close) <= openingHigh) {
          buyTaken = true;
          buyEntry = Number(k.close);
          buyTP = openingHigh + range * rr;
          buySL = openingLow;
          buyTs = tsMs;
        }
        if (captured && isFinite(range) && !sellTaken && Number(k.close) < openingLow && Number(prev.close) >= openingLow) {
          sellTaken = true;
          sellEntry = Number(k.close);
          sellTP = openingLow - range * rr;
          sellSL = openingHigh;
          sellTs = tsMs;
        }

        // After entries, track TP/SL hits akin to Pine implementation
        if (buyTaken && !buyTPHit && !buySLHit) {
          if (Number.isFinite(buyTP) && Number(k.high) >= buyTP && !buyTPHit) {
            buyTPHit = true;
            buyTPHitTs = tsMs;
          }
          if (Number.isFinite(buySL) && Number(k.low) <= buySL && !buySLHit) {
            buySLHit = true;
            buySLHitTs = tsMs;
          }
        }
        if (sellTaken && !sellTPHit && !sellSLHit) {
          if (Number.isFinite(sellTP) && Number(k.low) <= sellTP && !sellTPHit) {
            sellTPHit = true;
            sellTPHitTs = tsMs;
          }
          if (Number.isFinite(sellSL) && Number(k.high) >= sellSL && !sellSLHit) {
            sellSLHit = true;
            sellSLHitTs = tsMs;
          }
        }
      }
      const rangeSize = (isFinite(openingHigh) && isFinite(openingLow)) ? (openingHigh - openingLow) : NaN;
      return {
        isSuitableTimeframe,
        openingHigh: isFinite(openingHigh) ? openingHigh : null,
        openingLow: isFinite(openingLow) ? openingLow : null,
        rangeSize: isFinite(rangeSize) ? rangeSize : null,
        buyTaken,
        sellTaken,
        buyEntry: isFinite(buyEntry) ? buyEntry : null,
        sellEntry: isFinite(sellEntry) ? sellEntry : null,
        buyTP: isFinite(buyTP) ? buyTP : null,
        sellTP: isFinite(sellTP) ? sellTP : null,
        buySL: isFinite(buySL) ? buySL : null,
        sellSL: isFinite(sellSL) ? sellSL : null,
        buyTs: Number.isFinite(buyTs) ? buyTs : null,
        sellTs: Number.isFinite(sellTs) ? sellTs : null,
        buyTPHit,
        sellTPHit,
        buySLHit,
        sellSLHit,
        buyTPHitTs,
        sellTPHitTs,
        buySLHitTs,
        sellSLHitTs,
        targetRR: rr,
      };
    } catch (_e) {
      return null;
    }
  }, [candles, settings?.indicatorSettings?.orbEnhanced, settings?.timeframe]);
  
  // ATR Pro stats (Current ATR, Volatility classification, Trend)
  const atrProStats = useMemo(() => {
    try {
      if (!Array.isArray(candles) || candles.length === 0) return null;
      const cfg = settings?.indicatorSettings?.atrEnhanced || {};
      const len = Math.max(1, Number(cfg.length) || 14);
      const method = String(cfg.smoothingMethod || 'RMA').toUpperCase();
      const n = candles.length;
      if (n < 2) return null;
      // Compute True Range (TR)
      const trSeries = new Array(n);
      for (let i = 0; i < n; i++) {
        const k = candles[i];
        const prev = candles[i - 1] || k;
        const high = Number(k.high);
        const low = Number(k.low);
        const prevClose = Number(prev.close);
        trSeries[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      }
      // ATR via selected method
      const atrSeries = new Array(n);
      if (method === 'SMA') {
        let sum = 0;
        const buf = [];
        for (let i = 0; i < n; i++) {
          const tr = trSeries[i];
          buf.push(tr);
          sum += tr;
          if (buf.length > len) sum -= buf.shift() || 0;
          atrSeries[i] = buf.length >= len ? (sum / len) : (sum / buf.length);
        }
      } else if (method === 'EMA') {
        const alpha = 2 / (len + 1);
        let ema = null;
        for (let i = 0; i < n; i++) {
          const tr = trSeries[i];
          if (ema == null) ema = tr; else ema = (tr - ema) * alpha + ema;
          atrSeries[i] = ema;
        }
      } else if (method === 'WMA') {
        const buf = [];
        for (let i = 0; i < n; i++) {
          const tr = trSeries[i];
          buf.push(tr);
          if (buf.length > len) buf.shift();
          let denom = 0, num = 0;
          for (let w = 1; w <= buf.length; w++) {
            const v = buf[buf.length - w];
            num += v * w;
            denom += w;
          }
          atrSeries[i] = denom > 0 ? num / denom : tr;
        }
      } else {
        // RMA (Wilder)
        let prevAtr = null;
        for (let i = 0; i < n; i++) {
          const tr = trSeries[i];
          if (i === 0 || prevAtr == null) {
            atrSeries[i] = tr;
            prevAtr = tr;
          } else {
            const atr = ((prevAtr * (len - 1)) + tr) / len;
            atrSeries[i] = atr;
            prevAtr = atr;
          }
        }
      }
      const lastAtr = atrSeries[n - 1];
      if (!Number.isFinite(lastAtr)) return null;
      // ATR moving average for trend (SMA of 20)
      const maLen = 20;
      let atrMa = null;
      if (n >= maLen) {
        let sum = 0;
        for (let i = n - maLen; i < n; i++) sum += atrSeries[i];
        atrMa = sum / maLen;
      }
      const trendUp = Number.isFinite(atrMa) ? lastAtr > atrMa : (n > 1 ? lastAtr > atrSeries[n - 2] : true);
      // Volatility classification using 100-period average
      const avgLen = 100;
      let atrAvg = null;
      if (n >= avgLen) {
        let sum = 0;
        for (let i = n - avgLen; i < n; i++) sum += atrSeries[i];
        atrAvg = sum / avgLen;
      }
      const relative = Number.isFinite(atrAvg) && atrAvg !== 0 ? lastAtr / atrAvg : null;
      const isHighVol = Number.isFinite(relative) ? relative >= 1.5 : false;
      const isLowVol = Number.isFinite(relative) ? relative <= 0.5 : false;
      const isNormalVol = !isHighVol && !isLowVol;
      return { currentAtr: lastAtr, trendUp, isHighVol, isLowVol, isNormalVol };
    } catch (_e) {
      return null;
    }
  }, [candles, settings?.indicatorSettings?.atrEnhanced]);

  // MACD Pro stats (Trend + Momentum)
  const macdProStats = useMemo(() => {
    try {
      if (!Array.isArray(candles) || candles.length < 2) return null;
      const cfg = settings?.indicatorSettings?.macdEnhanced || {};
      const fastLen = Math.max(1, Number(cfg.fastLength) || 12);
      const slowLen = Math.max(1, Number(cfg.slowLength) || 26);
      const sigLen = Math.max(1, Number(cfg.signalLength) || 9);
      const source = String(cfg.source || 'close').toLowerCase();

      const n = candles.length;
      const kf = 2 / (fastLen + 1);
      const ks = 2 / (slowLen + 1);
      const ks2 = 2 / (sigLen + 1);
      let emaFast = null;
      let emaSlow = null;
      let emaSignal = null;
      let lastMacd = null;
      let lastSignal = null;
      let lastHist = null;
      let prevHist = null;

      for (let i = 0; i < n; i++) {
        const k = candles[i];
        const o = Number(k.open), h = Number(k.high), l = Number(k.low), c = Number(k.close);
        let price = c;
        if (source === 'open') price = o;
        else if (source === 'high') price = h;
        else if (source === 'low') price = l;
        else if (source === 'hl2') price = (h + l) / 2;
        else if (source === 'hlc3') price = (h + l + c) / 3;
        else if (source === 'ohlc4') price = (o + h + l + c) / 4;

        emaFast = emaFast == null ? price : (price - emaFast) * kf + emaFast;
        emaSlow = emaSlow == null ? price : (price - emaSlow) * ks + emaSlow;
        const macd = (emaFast - emaSlow);
        emaSignal = emaSignal == null ? macd : (macd - emaSignal) * ks2 + emaSignal;
        const hist = macd - emaSignal;

        prevHist = lastHist;
        lastHist = hist;
        lastMacd = macd;
        lastSignal = emaSignal;
      }

      if (!Number.isFinite(lastMacd) || !Number.isFinite(lastSignal) || !Number.isFinite(lastHist)) return null;

      const histogramGrowing = Number.isFinite(prevHist) ? (lastHist > prevHist) : false;
      const macdAboveSignal = lastMacd > lastSignal;

      let momentumStatus = 'Recovering';
      let momentumBg = 'rgba(38,166,154,0.4)';
      if (lastHist > 0 && histogramGrowing) { momentumStatus = 'Strong Bullish'; momentumBg = '#26A69A'; }
      else if (lastHist > 0 && !histogramGrowing) { momentumStatus = 'Weakening'; momentumBg = 'rgba(38,166,154,0.4)'; }
      else if (lastHist < 0 && !histogramGrowing) { momentumStatus = 'Strong Bearish'; momentumBg = '#EF5350'; }
      else { momentumStatus = 'Recovering'; momentumBg = 'rgba(239,83,80,0.4)'; }

      return {
        macdAboveSignal,
        momentumStatus,
        momentumBg,
      };
    } catch (_e) {
      return null;
    }
  }, [candles, settings?.indicatorSettings?.macdEnhanced]);
  
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
          calcParams: [14, 0], // [length, methodCode] method: 0=RMA,1=SMA,2=EMA,3=WMA
          precision: 5,
          figures: [
            { key: 'atr', title: 'ATR: ', type: 'line' }
          ],
          calc: (dataList, indicator) => {
            const params = Array.isArray(indicator.calcParams) ? indicator.calcParams : [14, 0];
            const len = Math.max(1, Number(params[0]) || 14);
            const method = Number(params[1]) || 0; // 0 RMA, 1 SMA, 2 EMA, 3 WMA
            let prevAtr = null;
            let emaPrev = null;
            let sum = 0;
            const trBuf = [];
            const maxBuf = len;
            const alpha = 2 / (len + 1);
            return dataList.map((k, i) => {
              const prev = dataList[i - 1] || k;
              const high = Number(k.high);
              const low = Number(k.low);
              const closePrev = Number(prev.close);
              const tr = Math.max(high - low, Math.abs(high - closePrev), Math.abs(low - closePrev));
              // Maintain buffer for SMA/WMA
              trBuf.push(tr);
              sum += tr;
              if (trBuf.length > maxBuf) {
                const removed = trBuf.shift();
                sum -= (removed || 0);
              }
              let atrVal;
              if (method === 1) {
                // SMA
                atrVal = trBuf.length === maxBuf ? (sum / maxBuf) : (sum / trBuf.length);
              } else if (method === 2) {
                // EMA
                if (emaPrev == null) {
                  emaPrev = tr;
                } else {
                  emaPrev = (tr - emaPrev) * alpha + emaPrev;
                }
                atrVal = emaPrev;
              } else if (method === 3) {
                // WMA
                let denom = 0;
                let num = 0;
                for (let w = 1; w <= trBuf.length; w++) {
                  const v = trBuf[trBuf.length - w];
                  num += v * w;
                  denom += w;
                }
                atrVal = denom > 0 ? num / denom : tr;
              } else {
                // RMA (Wilder)
                if (i === 0 || prevAtr == null) {
                  prevAtr = tr;
                } else {
                  prevAtr = ((prevAtr * (len - 1)) + tr) / len;
                }
                atrVal = prevAtr;
              }
              return { atr: atrVal };
            });
          }
        });
      }
      // Register EMA_TOUCH_ENH (BB signals + ATR targets + Entry) — on chart
      if (Array.isArray(supported) && !supported.includes('EMA_TOUCH_ENH')) {
        registerIndicator({
          name: 'EMA_TOUCH_ENH',
          shortName: 'Trend Strategy',
          series: 'price',
          precision: 5,
          // bbLen, bbMult, atrLen, tp1, tp2, tp3, slMult, horizonBars
          calcParams: [20, 2.0, 14, 1.0, 2.5, 4.0, 1.5, 25],
          figures: [
            { key: 'buySL', title: 'BUY SL: ', type: 'line' },
            { key: 'buyEntry', title: 'BUY ENTRY: ', type: 'line' },
            { key: 'buyTP1', title: 'BUY TP1: ', type: 'line' },
            { key: 'buyTP2', title: 'BUY TP2: ', type: 'line' },
            { key: 'buyTP3', title: 'BUY TP3: ', type: 'line' },
            { key: 'sellSL', title: 'SELL SL: ', type: 'line' },
            { key: 'sellEntry', title: 'SELL ENTRY: ', type: 'line' },
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

            // Output arrays initialized NaN (include entry lines)
            const out = new Array(len).fill(null).map(() => ({
              buySL: NaN,
              buyEntry: NaN,
              buyTP1: NaN,
              buyTP2: NaN,
              buyTP3: NaN,
              sellSL: NaN,
              sellEntry: NaN,
              sellTP1: NaN,
              sellTP2: NaN,
              sellTP3: NaN,
            }));

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
                    out[j].sellEntry = close;
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
                    out[j].buyEntry = close;
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
          precision: 5,
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
              // Robust timestamp handling: accept seconds or milliseconds; fallback to k.time
              const rawTime = (k.timestamp ?? k.time ?? 0);
              const tsMs = rawTime < 946684800000 ? rawTime * 1000 : rawTime; // if < year 2000 in ms, treat as seconds
              const d = new Date(tsMs);
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
          precision: 5,
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
      // Register MA_ENH (Moving Average - Pro, multi-line, supports type & source)
      if (Array.isArray(supported) && !supported.includes('MA_ENH')) {
        registerIndicator({
          name: 'MA_ENH',
          shortName: 'MA',
          series: 'price',
          precision: 5,
          // calcParams: [typeCode, sourceCode, len1, len2, len3, len4]
          // typeCode: 0=EMA, 1=SMA; sourceCode: 0=close,1=open,2=high,3=low,4=hl2,5=hlc3,6=ohlc4
          calcParams: [0, 0, 9, 21, 50, 100],
          figures: [
            { key: 'ma1', title: 'MA1: ', type: 'line' },
            { key: 'ma2', title: 'MA2: ', type: 'line' },
            { key: 'ma3', title: 'MA3: ', type: 'line' },
            { key: 'ma4', title: 'MA4: ', type: 'line' },
          ],
          calc: (dataList, indicator) => {
            const p = Array.isArray(indicator.calcParams) ? indicator.calcParams : [0, 0, 9, 21, 50, 100];
            const typeCode = Math.max(0, Math.min(1, Number(p[0]) || 0));
            const srcCode = Math.max(0, Math.min(6, Number(p[1]) || 0));
            const l1 = Math.max(0, Number(p[2]) || 0);
            const l2 = Math.max(0, Number(p[3]) || 0);
            const l3 = Math.max(0, Number(p[4]) || 0);
            const l4 = Math.max(0, Number(p[5]) || 0);

            // Helpers to pick source
            const pick = (k) => {
              const o = Number(k.open), h = Number(k.high), l = Number(k.low), c = Number(k.close);
              switch (srcCode) {
                case 1: return o;
                case 2: return h;
                case 3: return l;
                case 4: return (h + l) / 2;
                case 5: return (h + l + c) / 3;
                case 6: return (o + h + l + c) / 4;
                default: return c;
              }
            };

            // EMA state
            let ema1 = null, ema2 = null, ema3 = null, ema4 = null;
            const k1 = l1 > 0 ? 2 / (l1 + 1) : 0;
            const k2 = l2 > 0 ? 2 / (l2 + 1) : 0;
            const k3 = l3 > 0 ? 2 / (l3 + 1) : 0;
            const k4 = l4 > 0 ? 2 / (l4 + 1) : 0;

            // SMA state
            let q1 = [], s1 = 0;
            let q2 = [], s2 = 0;
            let q3 = [], s3 = 0;
            let q4 = [], s4 = 0;

            const out = new Array(dataList.length);
            for (let i = 0; i < dataList.length; i++) {
              const px = pick(dataList[i]);

              let v1 = NaN, v2 = NaN, v3 = NaN, v4 = NaN;
              if (typeCode === 0) {
                // EMA
                if (l1 > 0) { ema1 = ema1 == null ? px : (px - ema1) * k1 + ema1; v1 = ema1; }
                if (l2 > 0) { ema2 = ema2 == null ? px : (px - ema2) * k2 + ema2; v2 = ema2; }
                if (l3 > 0) { ema3 = ema3 == null ? px : (px - ema3) * k3 + ema3; v3 = ema3; }
                if (l4 > 0) { ema4 = ema4 == null ? px : (px - ema4) * k4 + ema4; v4 = ema4; }
              } else {
                // SMA
                if (l1 > 0) { q1.push(px); s1 += px; if (q1.length > l1) s1 -= q1.shift(); if (q1.length >= l1) v1 = s1 / l1; }
                if (l2 > 0) { q2.push(px); s2 += px; if (q2.length > l2) s2 -= q2.shift(); if (q2.length >= l2) v2 = s2 / l2; }
                if (l3 > 0) { q3.push(px); s3 += px; if (q3.length > l3) s3 -= q3.shift(); if (q3.length >= l3) v3 = s3 / l3; }
                if (l4 > 0) { q4.push(px); s4 += px; if (q4.length > l4) s4 -= q4.shift(); if (q4.length >= l4) v4 = s4 / l4; }
              }

              out[i] = { ma1: v1, ma2: v2, ma3: v3, ma4: v4 };
            }
            return out;
          }
        });
      }
      // Register SR_ENH (Support/Resistance - on chart)
      if (Array.isArray(supported) && !supported.includes('SR_ENH')) {
        registerIndicator({
          name: 'SR_ENH',
          shortName: 'S/R',
          series: 'price',
          precision: 5,
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
          calcParams: [12, 26, 9, 'close'], // fast, slow, signal, source
          figures: [
            { key: 'macd', title: 'MACD: ', type: 'line' },
            { key: 'signal', title: 'SIGNAL: ', type: 'line' },
            { key: 'zero', title: '', type: 'line' }, // zero line for reference
            { key: 'histPS', title: 'HPS: ', type: 'bar' }, // pos strong
            { key: 'histPW', title: 'HPW: ', type: 'bar' }, // pos weak
            { key: 'histNW', title: 'HNW: ', type: 'bar' }, // neg weak
            { key: 'histNS', title: 'HNS: ', type: 'bar' }, // neg strong
          ],
          calc: (dataList, indicator) => {
            const [fastLen, slowLen, sigLen, src] = Array.isArray(indicator.calcParams) ? indicator.calcParams : [12, 26, 9, 'close'];
            const fl = Math.max(1, Number(fastLen) || 12);
            const sl = Math.max(1, Number(slowLen) || 26);
            const sg = Math.max(1, Number(sigLen) || 9);
            const source = String(src || 'close').toLowerCase();
            let emaFast = null;
            let emaSlow = null;
            let emaSignal = null;
            const kf = 2 / (fl + 1);
            const ks = 2 / (sl + 1);
            const ks2 = 2 / (sg + 1);
            return dataList.map((k, i, arr) => {
              const o = Number(k.open), h = Number(k.high), l = Number(k.low), c = Number(k.close);
              let price = c;
              if (source === 'open') price = o;
              else if (source === 'high') price = h;
              else if (source === 'low') price = l;
              else if (source === 'hl2') price = (h + l) / 2;
              else if (source === 'hlc3') price = (h + l + c) / 3;
              else if (source === 'ohlc4') price = (o + h + l + c) / 4;
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
                zero: 0,
                histPS: posStrong,
                histPW: posWeak,
                histNW: negWeak,
                histNS: negStrong,
              };
            });
          },
        });
      }
      // Register RSI_BOUNDS (Overbought/Oversold constant lines) for RSI pane
      if (Array.isArray(supported) && !supported.includes('RSI_BOUNDS')) {
        registerIndicator({
          name: 'RSI_BOUNDS',
          shortName: 'RSI Bnds',
          precision: 2,
          // calcParams: [overboughtLevel, oversoldLevel]
          calcParams: [70, 30],
          figures: [
            { key: 'ob', title: 'OB: ', type: 'line' },
            { key: 'os', title: 'OS: ', type: 'line' },
          ],
          calc: (dataList, indicator) => {
            const p = Array.isArray(indicator.calcParams) ? indicator.calcParams : [70, 30];
            const ob = Math.max(0, Math.min(100, Number(p[0]) || 70));
            const os = Math.max(0, Math.min(100, Number(p[1]) || 30));
            return dataList.map(() => ({ ob, os }));
          }
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
        const custom = (overlay && overlay.styles && overlay.styles.text) ? overlay.styles.text : {};
        const bg = custom.backgroundColor != null ? custom.backgroundColor : 'transparent';
        const color = custom.color != null ? custom.color : '#333333';
        const size = custom.size != null ? custom.size : 12;
        const borderColor = custom.borderColor != null ? custom.borderColor : 'transparent';
        const borderSize = custom.borderSize != null ? custom.borderSize : 0;
        const pad = custom.padding != null ? custom.padding : 0;
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
              backgroundColor: bg,
              borderSize: borderSize,
              borderColor: borderColor,
              color: color,
              size: size,
              paddingLeft: pad,
              paddingRight: pad,
              paddingTop: pad,
              paddingBottom: pad,
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
          precision = 5;
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
            precision = 5;
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
      // Ensure price precision is 5 decimals across the chart
      try {
        if (typeof chart.setPrecision === 'function') {
          chart.setPrecision({ price: 5, volume: 0 });
        } else if (typeof chart.setPriceVolumePrecision === 'function') {
          chart.setPriceVolumePrecision(5, 0);
        }
      } catch (_) {
        // best effort; fall back to defaults if API not available
      }

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
      // Hide indicator legends/values on the pane (EMA details on upper side)
      try {
        chart.setStyles({
          indicator: {
            tooltip: { showRule: 'none' }
          }
        });
      } catch (_) { /* optional API */ }
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
      const atrCfg = settings?.indicatorSettings?.atrEnhanced || {};
      const macdCfg = settings?.indicatorSettings?.macdEnhanced || {};
      const methodMap = { RMA: 0, SMA: 1, EMA: 2, WMA: 3 };
      const methodCode = methodMap[String(atrCfg.smoothingMethod || 'RMA').toUpperCase()] ?? 0;
      const indicatorMap = {
        rsiEnhanced: { name: 'RSI', params: { calcParams: [Math.max(1, Number(rsiCfg.length) || 14)] }, newPane: true },
        atrEnhanced: { name: 'ATR_ENH', params: { calcParams: [Math.max(1, Number(atrCfg.length) || 14), methodCode] }, newPane: true },
        macdEnhanced: {
          name: 'MACD_ENH',
          params: {
            calcParams: [
              Math.max(1, Number(macdCfg.fastLength) || 12),
              Math.max(1, Number(macdCfg.slowLength) || 26),
              Math.max(1, Number(macdCfg.signalLength) || 9),
              String(macdCfg.source || 'close').toLowerCase(),
            ]
          },
          newPane: true
        },
      };

      // First, handle Bollinger overlays (bbPro only; emaTouch does NOT draw BB)
      try {
        const wantBoll = Boolean(settings.indicators?.bbPro);
        const proStyles = settings.indicators?.bbPro
          ? {
              lines: [
                { color: '#2962FF', size: 1 }, // Upper
                { color: '#FF6D00', size: 1 }, // Middle
                { color: '#2962FF', size: 1 }, // Lower
              ],
            }
          : undefined;
        const bbCfg = settings?.indicatorSettings?.bbPro || {};
        const bbLen = Math.max(1, Number(bbCfg.length) || 20);
        const bbMult = Number(bbCfg.stdDev ?? 2.0);
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
            ? { name: 'BOLL', calcParams: [bbLen, bbMult], styles: proStyles }
            : { name: 'BOLL', calcParams: [bbLen, bbMult] };
          // Overlay on main price pane by targeting the candle pane id
          chartRef.current.createIndicator(indicatorArg, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: BOLL overlay added to candle pane', { mode: settings.indicators?.bbPro ? 'pro' : 'default' });
        } else {
          if (hasBoll) {
            chartRef.current.removeIndicator({ name: 'BOLL' });
            console.log('📈 KLineChart: BOLL overlay removed');
          }
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling BOLL overlay:', e);
      }
      
      // Trend Strategy (EMA Touch) — targets only; no Bollinger lines drawn here
      try {
        const existingTouch = typeof chartRef.current.getIndicators === 'function'
          ? chartRef.current.getIndicators({ name: 'EMA_TOUCH_ENH' })
          : [];
        const hasTouch = Array.isArray(existingTouch) && existingTouch.length > 0;
        const etCfg = settings?.indicatorSettings?.emaTouch || {};
        const bbLen = Math.max(1, Number(etCfg.bbLength) || 20);
        const bbMult = Number(etCfg.bbStdDev ?? 2.0);
        const atrLen = Math.max(1, Number(etCfg.atrLength) || 14);
        const tp1 = Number(etCfg.tp1Multiplier ?? 1.0);
        const tp2 = Number(etCfg.tp2Multiplier ?? 2.5);
        const tp3 = Number(etCfg.tp3Multiplier ?? 4.0);
        if (settings.indicators?.emaTouch) {
          if (hasTouch && typeof chartRef.current.removeIndicator === 'function') {
            chartRef.current.removeIndicator({ name: 'EMA_TOUCH_ENH' });
          }
          chartRef.current.createIndicator({ name: 'EMA_TOUCH_ENH', calcParams: [bbLen, bbMult, atrLen, tp1, tp2, tp3, 1.5, 25], styles: {
            lines: [
              { color: '#EF4444', size: 2 }, // buy SL (red)
              { color: '#3B82F6', size: 1 }, // buy ENTRY (blue)
              { color: '#22C55E', size: 1 }, // buy TP1 (green)
              { color: '#22C55E', size: 1 }, // buy TP2 (green)
              { color: '#22C55E', size: 1 }, // buy TP3 (green)
              { color: '#EF4444', size: 2 }, // sell SL (red)
              { color: '#3B82F6', size: 1 }, // sell ENTRY (blue)
              { color: '#22C55E', size: 1 }, // sell TP1 (green)
              { color: '#22C55E', size: 1 }, // sell TP2 (green)
              { color: '#22C55E', size: 1 }, // sell TP3 (green)
            ]
          } }, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: EMA Touch targets overlay added');
        } else if (hasTouch) {
          chartRef.current.removeIndicator({ name: 'EMA_TOUCH_ENH' });
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling EMA Touch overlay:', e);
      }

      // MA Enhanced (on-chart multi-line MA with Type & Source) using custom indicator
      try {
        const wantMa = Boolean(settings.indicators?.maEnhanced);
        const maCfg = settings?.indicatorSettings?.maEnhanced || {};
        const typeCode = (maCfg.maType === 'SMA') ? 1 : 0; // 0=EMA,1=SMA
        const srcMap = { close: 0, open: 1, high: 2, low: 3, hl2: 4, hlc3: 5, ohlc4: 6 };
        const sourceCode = srcMap[(maCfg.source || 'close').toLowerCase()] ?? 0;
        const l1 = Math.max(1, Number(maCfg.ma1Length) || 9);
        const l2 = Math.max(1, Number(maCfg.ma2Length) || 21);
        const l3 = Math.max(1, Number(maCfg.ma3Length) || 50);
        const l4 = Math.max(1, Number(maCfg.ma4Length) || 100);
        const e1 = maCfg.ma1Enabled !== false;
        const e2 = maCfg.ma2Enabled !== false;
        const e3 = maCfg.ma3Enabled !== false;
        const e4 = Boolean(maCfg.ma4Enabled);
        const hasAny = e1 || e2 || e3 || e4;
        const existingCustom = typeof chartRef.current.getIndicators === 'function' ? chartRef.current.getIndicators({ name: 'MA_ENH' }) : [];
        const hasCustom = Array.isArray(existingCustom) && existingCustom.length > 0;
        const removeIfExists = () => {
          try { chartRef.current.removeIndicator({ name: 'MA_ENH' }); } catch (_) {}
          try { chartRef.current.removeIndicator({ name: 'EMA' }); } catch (_) {}
          try { chartRef.current.removeIndicator({ name: 'MA' }); } catch (_) {}
        };
        if (wantMa && hasAny) {
          removeIfExists();
          // Disabled lines pass length 0 to calc for NaN outputs
          const calcParams = [
            typeCode,
            sourceCode,
            e1 ? l1 : 0,
            e2 ? l2 : 0,
            e3 ? l3 : 0,
            e4 ? l4 : 0,
          ];
          const styles = {
            lines: [
              { color: '#2962FF', size: 1 },
              { color: '#FF6D00', size: 1 },
              { color: '#26A69A', size: 1 },
              { color: '#9C27B0', size: 1 },
            ],
          };
          chartRef.current.createIndicator({ name: 'MA_ENH', calcParams, styles }, true, { id: 'candle_pane' });
          console.log('✅ KLineChart: MA Enhanced (custom) overlay added to candle pane');
        } else if (hasCustom) {
          removeIfExists();
          console.log('📈 KLineChart: MA Enhanced overlay removed');
        }
      } catch (e) {
        console.warn('📈 KLineChart: Error handling MA Enhanced overlay:', e);
      }

      // ORB Enhanced (on-chart Opening Range Breakout)
      try {
        const wantOrb = Boolean(settings.indicators?.orbEnhanced);
      const orbStyles = {
          lines: [
            { color: '#26a69a', size: 1 }, // OR High
            { color: '#ef5350', size: 1 }, // OR Low
            { color: '#26a69a', size: 1, dashedValue: [4, 4] }, // Buy TP
            { color: '#ef5350', size: 1, dashedValue: [4, 4] }, // Sell TP
            { color: '#ef5350', size: 1, dashedValue: [2, 2] }, // Buy SL
            { color: '#26a69a', size: 1, dashedValue: [2, 2] }, // Sell SL
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
          const orbCfg = settings?.indicatorSettings?.orbEnhanced || {};
          const startHour = Math.max(0, Math.min(23, Number(orbCfg.startHour) || 9));
          const startMinute = Math.max(0, Math.min(59, Number(orbCfg.startMinute) || 15));
          const orPeriod = Math.max(1, Number(orbCfg.orPeriod) || 1);
          const targetRR = Math.max(0.5, Number(orbCfg.targetRR) || 4.0);
          const indicatorArg = { name: 'ORB_ENH', calcParams: [startHour, startMinute, orPeriod, targetRR], styles: orbStyles };
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
          const stCfg = settings?.indicatorSettings?.stEnhanced || {};
          const atrLen = Math.max(1, Number(stCfg.atrPeriod) || 10);
          const atrMult = Math.max(0.5, Number(stCfg.atrMultiplier) || 3.0);
          const indicatorArg = { name: 'ST_ENH', calcParams: [atrLen, atrMult], styles: stStyles };
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
              if (key === 'atrEnhanced') {
                // Remove any existing ATR pane before re-adding to avoid duplicates on settings change
                try { chartRef.current.removeIndicator({ paneId: `pane-${key}` }); } catch (_) {}
                try { chartRef.current.removeIndicator({ name: indicatorName }); } catch (_) {}
                const lineColor = atrCfg.atrLineColor || '#2962FF';
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
                      { color: '#2962FF', size: 1 }, // MACD
                      { color: '#FF6D00', size: 1 }, // SIGNAL
                      { color: 'rgba(107,114,128,0.5)', size: 1 }, // ZERO
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

              // If RSI Enhanced is enabled, overlay persistent OB/OS lines on the same pane
              if (key === 'rsiEnhanced') {
                try {
                  const paneId = `pane-${key}`;
                  // Remove previous bounds lines if any
                  try { chartRef.current.removeIndicator({ name: 'RSI_BOUNDS', paneId }); } catch (_) {}
                  const ob = Math.max(0, Math.min(100, Number(rsiCfg.overbought ?? 70)));
                  const os = Math.max(0, Math.min(100, Number(rsiCfg.oversold ?? 30)));
                  const obColor = rsiCfg.obLineColor || 'rgba(242,54,69,0.6)';
                  const osColor = rsiCfg.osLineColor || 'rgba(8,153,129,0.6)';
                  const boundsArg = {
                    name: 'RSI_BOUNDS',
                    calcParams: [ob, os],
                      styles: {
                        lines: [
                         { color: obColor, size: 1, style: 'dashed', dashedValue: [4, 12], dashValue: [4, 12] },
                         { color: osColor, size: 1, style: 'dashed', dashedValue: [4, 12], dashValue: [4, 12] },
                        ]
                      }
                  };
                  // Stack within the RSI pane
                  chartRef.current.createIndicator(boundsArg, true, { id: paneId });
                  console.log('✅ KLineChart: RSI_BOUNDS overlay added to RSI pane');
                } catch (e) {
                  console.warn('📈 KLineChart: Error adding RSI_BOUNDS:', e);
                }
              }
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
              // Also remove RSI_BOUNDS when RSI is disabled
              if (key === 'rsiEnhanced') {
                try { chartRef.current.removeIndicator({ name: 'RSI_BOUNDS', paneId: `pane-${key}` }); } catch (_) {}
              }
            }
            
          } catch (_error) {
            // Silently ignore if indicator doesn't exist
          }
        }
      });
    } catch (error) {
      console.error('📈 KLineChart: Error handling indicator changes:', error);
    }
  }, [
    settings.indicators,
    settings?.indicatorSettings?.rsiEnhanced,
    settings?.indicatorSettings?.atrEnhanced,
    settings?.indicatorSettings?.macdEnhanced,
    settings?.indicatorSettings?.emaTouch,
    settings?.indicatorSettings?.bbPro,
    settings?.indicatorSettings?.maEnhanced,
    settings?.indicatorSettings?.stEnhanced,
    settings?.indicatorSettings?.orbEnhanced,
    isWorkspaceHidden
  ]);

  // Programmatic ORB TP/SL badges on chart (using 'text' overlay)
  useEffect(() => {
    try {
      const chart = chartRef.current;
      if (!chart) return;

      // Remove previously created badges
      try {
        const ids = Array.isArray(orbLabelOverlayIdsRef.current) ? orbLabelOverlayIdsRef.current : [];
        ids.forEach((id) => {
          try { chart.removeOverlay({ id }); } catch (_) {}
          try { chart.removeOverlay(id); } catch (_) {}
        });
      } catch (_) { /* ignore */ }
      orbLabelOverlayIdsRef.current = [];

      if (!settings?.indicators?.orbEnhanced || !orbStats) return;

      const precision = String(settings?.symbol || '').includes('JPY') ? 3 : 5;
      const addBadge = (ts, price, label, style) => {
        if (!Number.isFinite(ts) || !Number.isFinite(price)) return;
        const overlaySpec = {
          name: 'text',
          text: label,
          points: [{ timestamp: ts, value: price }],
          styles: {
            text: {
              backgroundColor: style.bg,
              color: style.color,
              padding: 4,
              borderSize: 0,
            }
          }
        };
        try {
          const ov = chart.createOverlay(overlaySpec);
          const id = (ov && (ov.id || ov)) || null;
          if (id) orbLabelOverlayIdsRef.current.push(id);
        } catch (_) { /* ignore */ }
      };

      // BUY badges
      if (orbStats.buyTaken && orbStats.buyTs != null) {
        // Entry arrow/label
        if (orbStats.buyEntry != null) {
          addBadge(orbStats.buyTs, orbStats.buyEntry, `BUY ▲ ${formatPrice(orbStats.buyEntry, precision)}`, { bg: 'rgba(38,166,154,0.15)', color: '#0b5f56' });
        }
        if (orbStats.buyTP != null) addBadge(orbStats.buyTs, orbStats.buyTP, `TP: ${formatPrice(orbStats.buyTP, precision)}`, { bg: 'rgba(38,166,154,0.20)', color: '#0b5f56' });
        if (orbStats.buySL != null) addBadge(orbStats.buyTs, orbStats.buySL, `SL: ${formatPrice(orbStats.buySL, precision)}`, { bg: 'rgba(239,83,80,0.20)', color: '#7a1f1f' });
      }
      // SELL badges
      if (orbStats.sellTaken && orbStats.sellTs != null) {
        if (orbStats.sellEntry != null) {
          addBadge(orbStats.sellTs, orbStats.sellEntry, `SELL ▼ ${formatPrice(orbStats.sellEntry, precision)}`, { bg: 'rgba(239,83,80,0.15)', color: '#7a1f1f' });
        }
        if (orbStats.sellTP != null) addBadge(orbStats.sellTs, orbStats.sellTP, `TP: ${formatPrice(orbStats.sellTP, precision)}`, { bg: 'rgba(239,83,80,0.20)', color: '#7a1f1f' });
        if (orbStats.sellSL != null) addBadge(orbStats.sellTs, orbStats.sellSL, `SL: ${formatPrice(orbStats.sellSL, precision)}`, { bg: 'rgba(38,166,154,0.20)', color: '#0b5f56' });
      }

      // TP/SL hit markers
      if (orbStats.buyTPHit && orbStats.buyTPHitTs && orbStats.buyTP != null) {
        addBadge(orbStats.buyTPHitTs, orbStats.buyTP, `BUY TP HIT ★`, { bg: 'rgba(38,166,154,0.25)', color: '#0b5f56' });
      }
      if (orbStats.buySLHit && orbStats.buySLHitTs && orbStats.buySL != null) {
        addBadge(orbStats.buySLHitTs, orbStats.buySL, `BUY SL HIT ✖`, { bg: 'rgba(239,83,80,0.25)', color: '#7a1f1f' });
      }
      if (orbStats.sellTPHit && orbStats.sellTPHitTs && orbStats.sellTP != null) {
        addBadge(orbStats.sellTPHitTs, orbStats.sellTP, `SELL TP HIT ★`, { bg: 'rgba(239,83,80,0.25)', color: '#7a1f1f' });
      }
      if (orbStats.sellSLHit && orbStats.sellSLHitTs && orbStats.sellSL != null) {
        addBadge(orbStats.sellSLHitTs, orbStats.sellSL, `SELL SL HIT ✖`, { bg: 'rgba(38,166,154,0.25)', color: '#0b5f56' });
      }

      // Timeframe suitability warning near last bar
      try {
        if (orbStats && !orbStats.isSuitableTimeframe && typeof chart.getDataList === 'function') {
          const dl = chart.getDataList() || [];
          const last = dl[dl.length - 1];
          const ts = last ? (last.timestamp ?? last.time ?? null) : null;
          const tsMs = ts != null ? (ts < 946684800000 ? ts * 1000 : ts) : null;
          const val = last ? Number(last.high ?? last.close ?? last.low) : null;
          if (tsMs && Number.isFinite(val)) {
            addBadge(tsMs, val, 'Use timeframe ≤ 60m for accurate signals', { bg: 'rgba(255,165,0,0.20)', color: '#6b3f00' });
          }
        }
      } catch (_) { /* ignore */ }
    } catch (_) { /* ignore */ }
  }, [settings?.indicators?.orbEnhanced, orbStats, settings?.symbol]);

  // Programmatic S/R BREAK and Wick badges on chart (using 'text' overlay)
  useEffect(() => {
    try {
      const chart = chartRef.current;
      if (!chart) return;

      // Remove previously created S/R badges
      try {
        const ids = Array.isArray(srLabelOverlayIdsRef.current) ? srLabelOverlayIdsRef.current : [];
        ids.forEach((id) => {
          try { chart.removeOverlay({ id }); } catch (_) {}
          try { chart.removeOverlay(id); } catch (_) {}
        });
      } catch (_) { /* ignore */ }
      srLabelOverlayIdsRef.current = [];

      if (!settings?.indicators?.srEnhanced || isWorkspaceHidden) return;

      const dataList = typeof chart.getDataList === 'function' ? chart.getDataList() : [];
      if (!Array.isArray(dataList) || dataList.length < 5) return;

      // Pivot-based support/resistance lines
      const leftBars = 15;
      const rightBars = 15;
      const len = dataList.length;
      const resAt = new Array(len).fill(NaN);
      const supAt = new Array(len).fill(NaN);
      for (let i = 0; i < len; i++) {
        const c = i - rightBars;
        if (c >= leftBars && i >= rightBars && c >= 0 && c < len) {
          const start = Math.max(0, c - leftBars);
          const end = Math.min(len - 1, c + rightBars);
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
      const resLine = new Array(len).fill(NaN);
      const supLine = new Array(len).fill(NaN);
      let lastRes = NaN;
      let lastSup = NaN;
      for (let i = 0; i < len; i++) {
        if (Number.isFinite(resAt[i])) lastRes = resAt[i];
        if (Number.isFinite(supAt[i])) lastSup = supAt[i];
        resLine[i] = Number.isFinite(lastRes) ? lastRes : NaN;
        supLine[i] = Number.isFinite(lastSup) ? lastSup : NaN;
      }

      // Volume oscillator (EMA 5 vs EMA 10)
      const vols = dataList.map(d => Number(d.volume) || 0);
      const ema = (arr, period) => {
        const k = 2 / (period + 1);
        let prev = null;
        const out = new Array(arr.length).fill(0);
        for (let i = 0; i < arr.length; i++) {
          const v = arr[i];
          prev = prev == null ? v : prev + k * (v - prev);
          out[i] = prev;
        }
        return out;
      };
      const shortE = ema(vols, 5);
      const longE = ema(vols, 10);
      const osc = vols.map((_, i) => {
        const le = longE[i];
        return le ? (100 * (shortE[i] - le) / le) : 0;
      });
      const volumeThresh = 20;

      // Collect break/wick events
      const events = [];
      for (let i = 1; i < len; i++) {
        const d = dataList[i];
        const p = dataList[i - 1];
        const res = resLine[i];
        const resPrev = resLine[i - 1];
        const sup = supLine[i];
        const supPrev = supLine[i - 1];
        if (!Number.isFinite(res) && !Number.isFinite(sup)) continue;

        const close = d.close;
        const open = d.open;
        const high = d.high;
        const low = d.low;
        const bearWickCond = (open - close) < (high - open);
        const bullWickCond = (open - low) > (close - open);

        if (Number.isFinite(res) && Number.isFinite(resPrev)) {
          const crossedUp = close > res && p.close <= resPrev;
          if (crossedUp) {
            if (bullWickCond) {
              events.push({ ts: d.timestamp, price: low, type: 'resWick' });
            } else if (osc[i] > volumeThresh) {
              events.push({ ts: d.timestamp, price: high, type: 'resVol' });
            }
          }
        }

        if (Number.isFinite(sup) && Number.isFinite(supPrev)) {
          const crossedDown = close < sup && p.close >= supPrev;
          if (crossedDown) {
            if (bearWickCond) {
              events.push({ ts: d.timestamp, price: high, type: 'supWick' });
            } else if (osc[i] > volumeThresh) {
              events.push({ ts: d.timestamp, price: low, type: 'supVol' });
            }
          }
        }
      }

      const maxSignals = 50;
      const recent = events.slice(-maxSignals);
      const addBadge = (ts, price, label, style) => {
        if (!Number.isFinite(ts) || !Number.isFinite(price)) return;
        const spec = {
          name: 'text',
          text: label,
          points: [{ timestamp: ts, value: price }],
          styles: {
            text: {
              backgroundColor: style.bg,
              color: style.color,
              padding: 4,
              borderSize: 0,
            }
          }
        };
        try {
          const ov = chart.createOverlay(spec);
          const id = (ov && (ov.id || ov)) || null;
          if (id) srLabelOverlayIdsRef.current.push(id);
        } catch (_) { /* ignore */ }
      };

      recent.forEach((e) => {
        if (e.type === 'resVol') addBadge(e.ts, e.price, 'BREAK', { bg: 'rgba(27,94,32,0.95)', color: '#ffffff' });
        if (e.type === 'supVol') addBadge(e.ts, e.price, 'BREAK', { bg: 'rgba(183,28,28,0.95)', color: '#ffffff' });
        if (e.type === 'resWick') addBadge(e.ts, e.price, 'Bull Wick', { bg: 'rgba(27,94,32,0.75)', color: '#ffffff' });
        if (e.type === 'supWick') addBadge(e.ts, e.price, 'Bear Wick', { bg: 'rgba(183,28,28,0.75)', color: '#ffffff' });
      });
    } catch (_) { /* ignore */ }
  }, [settings?.indicators?.srEnhanced, candles, isWorkspaceHidden]);

  // (Removed) MACD crossover arrows effect per request\n

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
              // Extend hover region slightly above the top of below panes so a
              // negatively offset action panel (e.g., top:-20px) remains interactive.
              const HOVER_EXTEND_TOP = 32;
              const hovering = belowHeight > 0 && y >= Math.max(0, totalHeight - belowHeight - HOVER_EXTEND_TOP);
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
          
        {/* MACD - Pro Settings Modal */}
        {showMacdSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#19235d]">MACD Settings</h3>
                <button
                  type="button"
                  className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => setShowMacdSettings(false)}
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="macd-fast" className="block text-sm text-gray-700 mb-1">Fast Length</label>
                    <input
                      id="macd-fast"
                      type="number"
                      min={1}
                      value={localMacdSettings.fastLength}
                      onChange={(e) => setLocalMacdSettings((p) => ({ ...p, fastLength: Math.max(1, parseInt(e.target.value || '12', 10)) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="macd-slow" className="block text-sm text-gray-700 mb-1">Slow Length</label>
                    <input
                      id="macd-slow"
                      type="number"
                      min={1}
                      value={localMacdSettings.slowLength}
                      onChange={(e) => setLocalMacdSettings((p) => ({ ...p, slowLength: Math.max(1, parseInt(e.target.value || '26', 10)) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="macd-signal" className="block text-sm text-gray-700 mb-1">Signal Length</label>
                    <input
                      id="macd-signal"
                      type="number"
                      min={1}
                      value={localMacdSettings.signalLength}
                      onChange={(e) => setLocalMacdSettings((p) => ({ ...p, signalLength: Math.max(1, parseInt(e.target.value || '9', 10)) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="macd-source" className="block text-sm text-gray-700 mb-1">Source</label>
                  <select
                    id="macd-source"
                    value={localMacdSettings.source}
                    onChange={(e) => setLocalMacdSettings((p) => ({ ...p, source: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="close">Close</option>
                    <option value="open">Open</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                    <option value="hl2">HL2 (H+L)/2</option>
                    <option value="hlc3">HLC3 (H+L+C)/3</option>
                    <option value="ohlc4">OHLC4 (O+H+L+C)/4</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                  onClick={() => setShowMacdSettings(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                  onClick={() => {
                    const payload = {
                      fastLength: Math.max(1, Number(localMacdSettings.fastLength) || 12),
                      slowLength: Math.max(1, Number(localMacdSettings.slowLength) || 26),
                      signalLength: Math.max(1, Number(localMacdSettings.signalLength) || 9),
                      source: String(localMacdSettings.source || 'close'),
                    };
                    try { updateIndicatorSettings('macdEnhanced', payload); } catch (_) {}
                    setShowMacdSettings(false);
                  }}
                >
                  Save
                </button>
              </div>
              </div>
            </div>
          )}
          
          {/* SuperTrend - Pro Settings Modal */}
          {showStSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#19235d]">SuperTrend Settings</h3>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowStSettings(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="st-atr-period" className="block text-sm text-gray-700 mb-1">ATR Period</label>
                    <input
                      id="st-atr-period"
                      type="number"
                      min={1}
                      value={localStSettings.atrPeriod}
                      onChange={(e) => setLocalStSettings((s) => ({ ...s, atrPeriod: Math.max(1, Number(e.target.value) || 10) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="st-atr-multiplier" className="block text-sm text-gray-700 mb-1">ATR Multiplier</label>
                    <input
                      id="st-atr-multiplier"
                      type="number"
                      step="0.1"
                      min={0.5}
                      value={localStSettings.atrMultiplier}
                      onChange={(e) => setLocalStSettings((s) => ({ ...s, atrMultiplier: Math.max(0.5, Number(e.target.value) || 3.0) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                    onClick={() => setShowStSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    onClick={() => {
                      const payload = {
                        atrPeriod: Math.max(1, Number(localStSettings.atrPeriod) || 10),
                        atrMultiplier: Math.max(0.5, Number(localStSettings.atrMultiplier) || 3.0),
                      };
                      try { updateIndicatorSettings('stEnhanced', payload); } catch (_) {}
                      setShowStSettings(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Breakout Strategy (ORB) Settings Modal */}
          {showOrbSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#19235d]">Breakout Strategy Settings</h3>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowOrbSettings(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="orb-hour" className="block text-sm text-gray-700 mb-1">Opening Candle Hour</label>
                      <input
                        id="orb-hour"
                        type="number"
                        min={0}
                        max={23}
                        value={localOrbSettings.startHour}
                        onChange={(e) => setLocalOrbSettings((p) => ({ ...p, startHour: Math.max(0, Math.min(23, parseInt(e.target.value || '9', 10))) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="orb-minute" className="block text-sm text-gray-700 mb-1">Opening Candle Minute</label>
                      <input
                        id="orb-minute"
                        type="number"
                        min={0}
                        max={59}
                        value={localOrbSettings.startMinute}
                        onChange={(e) => setLocalOrbSettings((p) => ({ ...p, startMinute: Math.max(0, Math.min(59, parseInt(e.target.value || '15', 10))) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="orb-period" className="block text-sm text-gray-700 mb-1">Opening Range Period (bars)</label>
                      <input
                        id="orb-period"
                        type="number"
                        min={1}
                        value={localOrbSettings.orPeriod}
                        onChange={(e) => setLocalOrbSettings((p) => ({ ...p, orPeriod: Math.max(1, parseInt(e.target.value || '1', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="orb-rr" className="block text-sm text-gray-700 mb-1">Risk:Reward Ratio</label>
                      <input
                        id="orb-rr"
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={localOrbSettings.targetRR}
                        onChange={(e) => setLocalOrbSettings((p) => ({ ...p, targetRR: Math.max(0.5, Math.min(10, parseFloat(e.target.value || '4.0'))) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                    onClick={() => setShowOrbSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    onClick={() => {
                      const payload = {
                        startHour: Math.max(0, Math.min(23, Number(localOrbSettings.startHour) || 9)),
                        startMinute: Math.max(0, Math.min(59, Number(localOrbSettings.startMinute) || 15)),
                        orPeriod: Math.max(1, Number(localOrbSettings.orPeriod) || 1),
                        targetRR: Math.max(0.5, Number(localOrbSettings.targetRR) || 4.0),
                      };
                      try { updateIndicatorSettings('orbEnhanced', payload); } catch (_) {}
                      setShowOrbSettings(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bollinger Bands - Pro Settings Modal */}
          {showBbSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#19235d]">Bollinger Bands Settings</h3>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowBbSettings(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="bb-length" className="block text-sm text-gray-700 mb-1">BB Length</label>
                      <input
                        id="bb-length"
                        type="number"
                        min={1}
                        value={localBbSettings.length}
                        onChange={(e) => setLocalBbSettings((p) => ({ ...p, length: Math.max(1, parseInt(e.target.value || '20', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="bb-source" className="block text-sm text-gray-700 mb-1">Source</label>
                      <select
                        id="bb-source"
                        value={localBbSettings.source}
                        onChange={(e) => setLocalBbSettings((p) => ({ ...p, source: e.target.value }))}
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
                  </div>
                  <div>
                    <label htmlFor="bb-stddev" className="block text-sm text-gray-700 mb-1">Standard Deviation</label>
                    <input
                      id="bb-stddev"
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={localBbSettings.stdDev}
                      onChange={(e) => setLocalBbSettings((p) => ({ ...p, stdDev: Math.max(0.1, parseFloat(e.target.value || '2.0')) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                    onClick={() => setShowBbSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    onClick={() => {
                      const payload = {
                        length: Math.max(1, Number(localBbSettings.length) || 20),
                        source: String(localBbSettings.source || 'close'),
                        stdDev: Math.max(0.1, Number(localBbSettings.stdDev) || 2.0),
                      };
                      try { updateIndicatorSettings('bbPro', payload); } catch (_) {}
                      setShowBbSettings(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Moving Average - Pro Settings Modal */}
          {showMaSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#19235d]">Moving Average Settings</h3>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowMaSettings(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ma-type" className="block text-sm text-gray-700 mb-1">MA Type</label>
                      <select
                        id="ma-type"
                        value={localMaSettings.maType}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, maType: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="EMA">EMA</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ma-source" className="block text-sm text-gray-700 mb-1">Source</label>
                      <select
                        id="ma-source"
                        value={localMaSettings.source}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, source: e.target.value }))}
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
                  </div>

                  {/* MA 1 */}
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localMaSettings.ma1Enabled}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma1Enabled: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">Enable MA 1</span>
                    </label>
                    <div>
                      <label htmlFor="ma1-length" className="block text-sm text-gray-700 mb-1">MA 1 Length</label>
                      <input
                        id="ma1-length"
                        type="number"
                        min={1}
                        value={localMaSettings.ma1Length}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma1Length: Math.max(1, parseInt(e.target.value || '9', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* MA 2 */}
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localMaSettings.ma2Enabled}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma2Enabled: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">Enable MA 2</span>
                    </label>
                    <div>
                      <label htmlFor="ma2-length" className="block text-sm text-gray-700 mb-1">MA 2 Length</label>
                      <input
                        id="ma2-length"
                        type="number"
                        min={1}
                        value={localMaSettings.ma2Length}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma2Length: Math.max(1, parseInt(e.target.value || '21', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* MA 3 */}
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localMaSettings.ma3Enabled}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma3Enabled: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">Enable MA 3</span>
                    </label>
                    <div>
                      <label htmlFor="ma3-length" className="block text-sm text-gray-700 mb-1">MA 3 Length</label>
                      <input
                        id="ma3-length"
                        type="number"
                        min={1}
                        value={localMaSettings.ma3Length}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma3Length: Math.max(1, parseInt(e.target.value || '50', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* MA 4 */}
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localMaSettings.ma4Enabled}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma4Enabled: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">Enable MA 4</span>
                    </label>
                    <div>
                      <label htmlFor="ma4-length" className="block text-sm text-gray-700 mb-1">MA 4 Length</label>
                      <input
                        id="ma4-length"
                        type="number"
                        min={1}
                        value={localMaSettings.ma4Length}
                        onChange={(e) => setLocalMaSettings((p) => ({ ...p, ma4Length: Math.max(1, parseInt(e.target.value || '100', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                    onClick={() => setShowMaSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    onClick={() => {
                      const payload = {
                        maType: localMaSettings.maType === 'SMA' ? 'SMA' : 'EMA',
                        source: String(localMaSettings.source || 'close'),
                        ma1Enabled: Boolean(localMaSettings.ma1Enabled),
                        ma1Length: Math.max(1, Number(localMaSettings.ma1Length) || 9),
                        ma2Enabled: Boolean(localMaSettings.ma2Enabled),
                        ma2Length: Math.max(1, Number(localMaSettings.ma2Length) || 21),
                        ma3Enabled: Boolean(localMaSettings.ma3Enabled),
                        ma3Length: Math.max(1, Number(localMaSettings.ma3Length) || 50),
                        ma4Enabled: Boolean(localMaSettings.ma4Enabled),
                        ma4Length: Math.max(1, Number(localMaSettings.ma4Length) || 100),
                      };
                      try { updateIndicatorSettings('maEnhanced', payload); } catch (_) {}
                      setShowMaSettings(false);
                    }}
                  >
                    Save
                  </button>
                </div>
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

          {/* MA Enhanced: MA values table (top-right, no header) */}
          {isFullscreen && settings?.indicators?.maEnhanced && !isWorkspaceHidden && maTableData.length > 0 && (
            <div className="absolute top-2 right-2 z-40 pointer-events-none" style={{ right: '80px' }}>
              <div className="pointer-events-none">
                <table className="text-[11px] text-gray-700">
                  <tbody>
                    {maTableData.map((row) => {
                      const pricePrecision = String(settings?.symbol || '').includes('JPY') ? 3 : 5;
                      return (
                        <tr key={`${row.index}-${row.period}`}>
                          <td className="px-2 py-1 whitespace-nowrap">
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="align-middle">{row.type} {row.period}</span>
                          </td>
                          <td className="px-2 py-1 text-right whitespace-nowrap">
                            {row.value != null ? formatPrice(row.value, pricePrecision) : '--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BB Pro: Bollinger Bands table (top-right, no header) */}
          {isFullscreen && settings?.indicators?.bbPro && !isWorkspaceHidden && bbProStats && (
            <div
              className="absolute right-2 z-40 pointer-events-none"
              style={{ right: '80px', top: settings?.indicators?.maEnhanced ? '80px' : '2px' }}
            >
              <div className="pointer-events-none">
                <table className="text-[11px] text-gray-700">
                  <tbody>
                    {(() => {
                      const pricePrecision = String(settings?.symbol || '').includes('JPY') ? 3 : 5;
                      const rows = [
                        { label: 'Upper Band', value: bbProStats.upper != null ? formatPrice(bbProStats.upper, pricePrecision) : '--' },
                        { label: 'Middle (SMA)', value: bbProStats.middle != null ? formatPrice(bbProStats.middle, pricePrecision) : '--' },
                        { label: 'Lower Band', value: bbProStats.lower != null ? formatPrice(bbProStats.lower, pricePrecision) : '--' },
                        { label: '%B Position', value: bbProStats.percentB != null ? `${bbProStats.percentB.toFixed(2)}%` : '--' },
                        { label: 'Bandwidth', value: bbProStats.bandwidth != null ? `${bbProStats.bandwidth.toFixed(2)}%` : '--' },
                      ];
                      return rows.map((r) => (
                        <tr key={r.label}>
                          <td className="px-2 py-1 whitespace-nowrap">{r.label}</td>
                          <td className="px-2 py-1 text-right whitespace-nowrap">{r.value}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SuperTrend - Pro: Trend & Trend Bars table (top-right) */}
          {isFullscreen && settings?.indicators?.stEnhanced && !isWorkspaceHidden && stStats && (
            <div
              className="absolute right-2 z-40 pointer-events-none"
              style={{
                right: '80px',
                top: (settings?.indicators?.maEnhanced && settings?.indicators?.bbPro)
                  ? '158px'
                  : (settings?.indicators?.maEnhanced || settings?.indicators?.bbPro) ? '80px' : '2px'
              }}
            >
              <div className="pointer-events-none">
                <table className="text-[11px] text-gray-700">
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 whitespace-nowrap">Trend</td>
                      <td className="px-2 py-1 text-right whitespace-nowrap" style={{ backgroundColor: stStats.lastTrendUp ? 'rgba(38,166,154,0.20)' : 'rgba(239,83,80,0.20)' }}>
                        {stStats.lastTrendUp ? 'BULLISH ▲' : 'BEARISH ▼'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 whitespace-nowrap">Trend Bars</td>
                      <td className="px-2 py-1 text-right whitespace-nowrap">{stStats.trendBars} bars</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORB Enhanced: Opening Range Breakout table (top-right) */}
          {isFullscreen && settings?.indicators?.orbEnhanced && !isWorkspaceHidden && orbStats && (
            <div
              className="absolute right-2 z-40 pointer-events-none"
              style={{
                right: '80px',
                top: (() => {
                  const base = (settings?.indicators?.maEnhanced && settings?.indicators?.bbPro)
                    ? 158
                    : ((settings?.indicators?.maEnhanced || settings?.indicators?.bbPro) ? 80 : 2);
                  const stOffset = settings?.indicators?.stEnhanced ? 78 : 0;
                  return `${base + stOffset}px`;
                })()
              }}
            >
              <div className="pointer-events-none">
                <table className="text-[11px] text-gray-700">
                  <tbody>
                    {(() => {
                      const pricePrecision = String(settings?.symbol || '').includes('JPY') ? 3 : 5;
                      const tfIcon = orbStats.isSuitableTimeframe ? '✓' : '⚠';
                      const tfText = `${tfIcon} ${String(settings?.timeframe || '').toUpperCase()}`;
                      const rows = [
                        { label: 'Timeframe', value: tfText, cellBg: orbStats.isSuitableTimeframe ? 'rgba(38,166,154,0.20)' : 'rgba(255,165,0,0.20)' },
                        { label: 'Range High', value: orbStats.openingHigh != null ? formatPrice(orbStats.openingHigh, pricePrecision) : '--' },
                        { label: 'Range Low', value: orbStats.openingLow != null ? formatPrice(orbStats.openingLow, pricePrecision) : '--' },
                        { label: 'Range Size', value: orbStats.rangeSize != null ? formatPrice(orbStats.rangeSize, pricePrecision) : '--' },
                        { label: 'Trade Status', value: (() => {
                          if (orbStats.buyTaken) {
                            if (orbStats.buyTPHit) return 'BUY TP HIT';
                            if (orbStats.buySLHit) return 'BUY SL HIT';
                            return 'BUY ACTIVE';
                          }
                          if (orbStats.sellTaken) {
                            if (orbStats.sellTPHit) return 'SELL TP HIT';
                            if (orbStats.sellSLHit) return 'SELL SL HIT';
                            return 'SELL ACTIVE';
                          }
                          return 'Waiting';
                        })(), cellBg: (() => {
                          if (orbStats.buyTaken) {
                            if (orbStats.buyTPHit) return 'rgba(38,166,154,0.30)';
                            if (orbStats.buySLHit) return 'rgba(239,83,80,0.30)';
                            return 'rgba(38,166,154,0.20)';
                          }
                          if (orbStats.sellTaken) {
                            if (orbStats.sellTPHit) return 'rgba(239,83,80,0.30)';
                            if (orbStats.sellSLHit) return 'rgba(38,166,154,0.30)';
                            return 'rgba(239,83,80,0.20)';
                          }
                          return undefined;
                        })() },
                        { label: 'Entry', value: (orbStats.buyTaken && orbStats.buyEntry != null) ? formatPrice(orbStats.buyEntry, pricePrecision) : (orbStats.sellTaken && orbStats.sellEntry != null) ? formatPrice(orbStats.sellEntry, pricePrecision) : '--' },
                        { label: 'Target', value: (orbStats.buyTaken && orbStats.buyTP != null) ? formatPrice(orbStats.buyTP, pricePrecision) : (orbStats.sellTaken && orbStats.sellTP != null) ? formatPrice(orbStats.sellTP, pricePrecision) : '--' },
                        { label: 'Stop Loss', value: (orbStats.buyTaken && orbStats.buySL != null) ? formatPrice(orbStats.buySL, pricePrecision) : (orbStats.sellTaken && orbStats.sellSL != null) ? formatPrice(orbStats.sellSL, pricePrecision) : '--' },
                        { label: 'Risk:Reward', value: `1:${(Number(orbStats.targetRR) || 0).toFixed(1)}` },
                      ];
                      return rows.map((r) => (
                        <tr key={r.label}>
                          <td className="px-2 py-1 whitespace-nowrap">{r.label}</td>
                          <td className="px-2 py-1 text-right whitespace-nowrap" style={r.cellBg ? { backgroundColor: r.cellBg } : undefined}>{r.value}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
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
            // Use a deterministic visual order that matches indicator creation order.
            // Creation order is: rsiEnhanced, atrEnhanced, macdEnhanced. In KLineCharts,
            // the first created below-pane sits at the bottom; subsequent panes stack above it.
            const fallbackKeys = ['rsiEnhanced', 'atrEnhanced', 'macdEnhanced'];
            const activeBelow = fallbackKeys.filter((k) => settings?.indicators?.[k]);
            if (activeBelow.length === 0 || isWorkspaceHidden) return null;
            return (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 60 }}>
                {activeBelow.map((key, idx) => {
                  // Align overlay containers with the final pane order we create (RSI → ATR → MACD).
                  // New panes are appended; the last created sits at the bottom.
                  // Therefore, compute bottom offset from the end of the active list.
                  const bottomOffset = (activeBelow.length - 1 - idx) * 120;
                  // Determine readable indicator label (no extra badge or color dot)
                  const label = key === 'rsiEnhanced' ? 'RSI' : key === 'atrEnhanced' ? 'ATR' : 'MACD';
                  return (
                    <div
                      key={key}
                      className="absolute left-0 right-0"
                      style={{ height: 120, bottom: bottomOffset }}
                    >

                      {/* Action panel */}
                      <div
                        className={`absolute top-0 left-0 transition-opacity duration-150 ${isHoveringBelowPanes ? 'opacity-100' : 'opacity-0'}`}
                        style={{ pointerEvents: isHoveringBelowPanes ? 'auto' : 'none', top: '-20px', left: '8px' }}
                      >
            <div className="flex items-center gap-1.5 text-gray-700">
              {/* Indicator name (plain text, no extra badge/dot) */}
              <span className="text-[11px] text-gray-700 whitespace-nowrap">{label}</span>
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
              {key === 'atrEnhanced' && (
                <label
                  className="w-4 h-4 rounded border border-gray-200 overflow-hidden cursor-pointer"
                  title="ATR Line Color"
                >
                  <input
                    type="color"
                    value={settings?.indicatorSettings?.atrEnhanced?.atrLineColor || '#2962FF'}
                    onChange={(e) => { try { updateIndicatorSettings('atrEnhanced', { atrLineColor: e.target.value }); } catch (_) {} }}
                    className="w-0 h-0 opacity-0 absolute"
                    aria-label="ATR Line Color"
                  />
                  <span
                    className="block w-4 h-4"
                    style={{ backgroundColor: settings?.indicatorSettings?.atrEnhanced?.atrLineColor || '#2962FF' }}
                  />
                </label>
              )}
                          <button
                            type="button"
                            title="Configure"
                            className="w-6 h-6 grid place-items-center text-gray-600 hover:text-emerald-600"
                            aria-label="Configure indicator"
                            onClick={() => { if (key === 'rsiEnhanced') setShowRsiSettings(true); if (key === 'atrEnhanced') setShowAtrSettings(true); if (key === 'macdEnhanced') setShowMacdSettings(true); }}
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="w-6 h-6 grid place-items-center text-gray-600 hover:text-red-600"
                            aria-label="Delete indicator"
                            onClick={() => toggleIndicator(key)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {/* ATR - Pro: stats table (top-right of ATR pane) */}
                      {isFullscreen && key === 'atrEnhanced' && atrProStats && (
                        <div className="absolute pointer-events-none" style={{ right: '80px', top: '2px' }}>
                          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md shadow-sm overflow-hidden">
                            <table className="text-[11px] text-gray-700">
                              <tbody>
                                {(() => {
                                  const pricePrecision = String(settings?.symbol || '').includes('JPY') ? 3 : 5;
                                  const currentAtr = atrProStats.currentAtr != null ? formatPrice(atrProStats.currentAtr, pricePrecision) : '--';
                                  const volText = atrProStats.isHighVol ? 'HIGH ⚠' : atrProStats.isLowVol ? 'LOW ⚡' : 'NORMAL ●';
                                  const volBg = atrProStats.isHighVol ? 'rgba(239,83,80,0.35)' : atrProStats.isLowVol ? 'rgba(255,167,38,0.35)' : 'rgba(38,166,154,0.35)';
                                  const trendText = atrProStats.trendUp ? 'RISING ▲' : 'FALLING ▼';
                                  const trendBg = atrProStats.trendUp ? 'rgba(239,83,80,0.25)' : 'rgba(38,166,154,0.25)';
                                  const rows = [
                                    { label: 'Current ATR', value: currentAtr, cellBg: undefined },
                                    { label: 'Volatility', value: volText, cellBg: volBg },
                                    { label: 'Trend', value: trendText, cellBg: trendBg },
                                  ];
                                  return rows.map((r) => (
                                    <tr key={r.label}>
                                      <td className="px-2 py-1 whitespace-nowrap">{r.label}</td>
                                      <td className="px-2 py-1 text-right whitespace-nowrap" style={r.cellBg ? { backgroundColor: r.cellBg } : undefined}>{r.value}</td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* MACD - Pro: Trend & Momentum table (top-right of MACD pane) */}
                      {isFullscreen && key === 'macdEnhanced' && macdProStats && (
                        <div className="absolute pointer-events-none" style={{ right: '80px', top: '2px' }}>
                          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md shadow-sm overflow-hidden">
                            <table className="text-[11px] text-gray-700">
                              <tbody>
                                <tr>
                                  <td className="px-2 py-1 whitespace-nowrap">Trend</td>
                                  <td className="px-2 py-1 text-right whitespace-nowrap" style={{ backgroundColor: macdProStats.macdAboveSignal ? 'rgba(38,166,154,0.20)' : 'rgba(239,83,80,0.20)' }}>
                                    {macdProStats.macdAboveSignal ? 'BULLISH ▲' : 'BEARISH ▼'}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-2 py-1 whitespace-nowrap">Momentum</td>
                                  <td className="px-2 py-1 text-right whitespace-nowrap" style={{ backgroundColor: macdProStats.momentumBg }}>
                                    {macdProStats.momentumStatus}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
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

          {/* ATR Enhanced Settings Modal */}
          {showAtrSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#19235d]">ATR Settings</h3>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowAtrSettings(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="atr-length" className="block text-sm text-gray-700 mb-1">ATR Period</label>
                    <input
                      id="atr-length"
                      type="number"
                      min={1}
                      value={localAtrSettings.length}
                      onChange={(e) => setLocalAtrSettings((p) => ({ ...p, length: Math.max(1, parseInt(e.target.value || '14', 10)) }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="atr-method" className="block text-sm text-gray-700 mb-1">Smoothing Method</label>
                    <select
                      id="atr-method"
                      value={localAtrSettings.smoothingMethod}
                      onChange={(e) => setLocalAtrSettings((p) => ({ ...p, smoothingMethod: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="RMA">RMA (Wilder)</option>
                      <option value="SMA">SMA</option>
                      <option value="EMA">EMA</option>
                      <option value="WMA">WMA</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                    onClick={() => setShowAtrSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    onClick={() => {
                      const payload = {
                        length: Math.max(1, Number(localAtrSettings.length) || 14),
                        smoothingMethod: String(localAtrSettings.smoothingMethod || 'RMA'),
                      };
                      try { updateIndicatorSettings('atrEnhanced', payload); } catch (_) {}
                      setShowAtrSettings(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trend Strategy (EMA Touch) Settings Modal */}
          {showEmaTouchSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#19235d]">Trend Strategy Settings</h3>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowEmaTouchSettings(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ts-bb-length" className="block text-sm text-gray-700 mb-1">BB Period</label>
                      <input
                        id="ts-bb-length"
                        type="number"
                        min={1}
                        value={localEmaTouchSettings.bbLength}
                        onChange={(e) => setLocalEmaTouchSettings((p) => ({ ...p, bbLength: Math.max(1, parseInt(e.target.value || '20', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="ts-bb-std" className="block text-sm text-gray-700 mb-1">BB StdDev</label>
                      <input
                        id="ts-bb-std"
                        type="number"
                        step="0.1"
                        min={0.1}
                        value={localEmaTouchSettings.bbStdDev}
                        onChange={(e) => setLocalEmaTouchSettings((p) => ({ ...p, bbStdDev: Math.max(0.1, Number(e.target.value || '2.0')) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ts-atr-length" className="block text-sm text-gray-700 mb-1">ATR Period</label>
                      <input
                        id="ts-atr-length"
                        type="number"
                        min={1}
                        value={localEmaTouchSettings.atrLength}
                        onChange={(e) => setLocalEmaTouchSettings((p) => ({ ...p, atrLength: Math.max(1, parseInt(e.target.value || '14', 10)) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="ts-tp1" className="block text-sm text-gray-700 mb-1">TP1 ATR Multiplier</label>
                      <input
                        id="ts-tp1"
                        type="number"
                        step="0.1"
                        min={0.1}
                        value={localEmaTouchSettings.tp1Multiplier}
                        onChange={(e) => setLocalEmaTouchSettings((p) => ({ ...p, tp1Multiplier: Math.max(0.1, Number(e.target.value || '1.0')) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="ts-tp2" className="block text-sm text-gray-700 mb-1">TP2 ATR Multiplier</label>
                      <input
                        id="ts-tp2"
                        type="number"
                        step="0.1"
                        min={0.1}
                        value={localEmaTouchSettings.tp2Multiplier}
                        onChange={(e) => setLocalEmaTouchSettings((p) => ({ ...p, tp2Multiplier: Math.max(0.1, Number(e.target.value || '2.5')) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="ts-tp3" className="block text-sm text-gray-700 mb-1">TP3 ATR Multiplier</label>
                      <input
                        id="ts-tp3"
                        type="number"
                        step="0.1"
                        min={0.1}
                        value={localEmaTouchSettings.tp3Multiplier}
                        onChange={(e) => setLocalEmaTouchSettings((p) => ({ ...p, tp3Multiplier: Math.max(0.1, Number(e.target.value || '4.0')) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md"
                    onClick={() => setShowEmaTouchSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    onClick={() => {
                      const payload = {
                        bbLength: Math.max(1, Number(localEmaTouchSettings.bbLength) || 20),
                        bbStdDev: Math.max(0.1, Number(localEmaTouchSettings.bbStdDev) || 2.0),
                        atrLength: Math.max(1, Number(localEmaTouchSettings.atrLength) || 14),
                        tp1Multiplier: Math.max(0.1, Number(localEmaTouchSettings.tp1Multiplier) || 1.0),
                        tp2Multiplier: Math.max(0.1, Number(localEmaTouchSettings.tp2Multiplier) || 2.5),
                        tp3Multiplier: Math.max(0.1, Number(localEmaTouchSettings.tp3Multiplier) || 4.0),
                      };
                      try { updateIndicatorSettings('emaTouch', payload); } catch (_) {}
                      setShowEmaTouchSettings(false);
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
              maEnhanced: 'Moving Average - Pro',
              orbEnhanced: 'Breakout Strategy',
              stEnhanced: 'Super Trend - Pro',
              srEnhanced: 'Support Resitance - Pro'
            };
            const activeOnChart = ON_CHART_KEYS.filter((k) => settings?.indicators?.[k]);
            if (activeOnChart.length === 0 || isWorkspaceHidden) return null;
            return (
              <div className="absolute top-8 left-2 space-y-1 transition-opacity duration-150" style={{ zIndex: 60, pointerEvents: isHoveringOnChartOverlays ? 'auto' : 'none', opacity: isHoveringOnChartOverlays ? 1 : 0 }}>
                {activeOnChart.map((key) => (
                  <div key={key} className="flex items-center gap-2 text-gray-700">
                    <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">{LABELS[key] || key}</span>
                    <div className="flex items-center gap-1.5">
                      {key !== 'srEnhanced' && (
                        <button
                          type="button"
                          title="Configure"
                          className="w-6 h-6 grid place-items-center text-gray-600 hover:text-emerald-600"
                          aria-label={`Configure ${LABELS[key] || key}`}
                          onClick={() => {
                            if (key === 'emaTouch') setShowEmaTouchSettings(true);
                            if (key === 'bbPro') setShowBbSettings(true);
                            if (key === 'maEnhanced') setShowMaSettings(true);
                            if (key === 'orbEnhanced') setShowOrbSettings(true);
                            if (key === 'stEnhanced') setShowStSettings(true);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Delete"
                        className="w-6 h-6 grid place-items-center text-gray-600 hover:text-red-600"
                        aria-label={`Delete ${LABELS[key] || key}`}
                        onClick={() => toggleIndicator(key)}
                      >
                        <Trash2 className="w-4 h-4" />
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
              <div className="flex items-center gap-1.5 text-gray-700">
                {selectedOverlayPanel?.name === 'rectangle' && (
                  <div className="relative ml-1 flex items-center">
                    <label
                      className="w-[18px] h-[18px] rounded border border-gray-300 overflow-hidden cursor-pointer"
                      title="Change rectangle color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                    >
                      <input
                        type="color"
                        aria-label="Change rectangle color"
                        className="w-0 h-0 opacity-0 absolute"
                        value={(() => {
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
                        })()}
                        onClick={(e) => { e.stopPropagation(); }}
                        onChange={(e) => {
                          try {
                            e.stopPropagation();
                          } catch (_) {}
                          try {
                            const hex = e.target.value;
                            const chart = chartRef.current;
                            const id = selectedOverlayPanel?.id;
                            if (!chart || !id) return;
                            const r = parseInt(hex.slice(1,3),16);
                            const g = parseInt(hex.slice(3,5),16);
                            const b = parseInt(hex.slice(5,7),16);
                            const fill = `rgba(${r},${g},${b},0.3)`;
                            chart.overrideOverlay({ id, styles: { rect: { color: fill, borderColor: hex } } });
                            try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                          } catch (_) { /* ignore */ }
                        }}
                      />
                      <span
                        className="block w-[18px] h-[18px]"
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
                      />
                    </label>
                  </div>
                )}
                {(selectedOverlayPanel?.name === 'segment' || selectedOverlayPanel?.name === 'trendLine') && (
                  <div className="relative ml-1 flex items-center">
                    <label
                      className="w-[18px] h-[18px] rounded border border-gray-300 overflow-hidden cursor-pointer"
                      title="Change trend line color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                    >
                      <input
                        type="color"
                        aria-label="Change trend line color"
                        className="w-0 h-0 opacity-0 absolute"
                        value={(() => {
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
                        })()}
                        onClick={(e) => { e.stopPropagation(); }}
                        onChange={(e) => {
                          try { e.stopPropagation(); } catch (_) {}
                          try {
                            const hex = e.target.value;
                            const chart = chartRef.current;
                            const id = selectedOverlayPanel?.id;
                            if (!chart || !id) return;
                            chart.overrideOverlay({ id, styles: { line: { color: hex } } });
                            try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                          } catch (_) { /* ignore */ }
                        }}
                      />
                      <span
                        className="block w-[18px] h-[18px]"
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
                      />
                    </label>
                  </div>
                )}
                {(selectedOverlayPanel?.name === 'horizontalStraightLine' || selectedOverlayPanel?.name === 'horizontalLine') && (
                  <div className="relative ml-1 flex items-center">
                    <label
                      className="w-[18px] h-[18px] rounded border border-gray-300 overflow-hidden cursor-pointer"
                      title="Change horizontal line color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                    >
                      <input
                        type="color"
                        aria-label="Change horizontal line color"
                        className="w-0 h-0 opacity-0 absolute"
                        value={(() => {
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
                        })()}
                        onClick={(e) => { e.stopPropagation(); }}
                        onChange={(e) => {
                          try { e.stopPropagation(); } catch (_) {}
                          try {
                            const hex = e.target.value;
                            const chart = chartRef.current;
                            const id = selectedOverlayPanel?.id;
                            if (!chart || !id) return;
                            chart.overrideOverlay({ id, styles: { line: { color: hex } } });
                            try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                          } catch (_) { /* ignore */ }
                        }}
                      />
                      <span
                        className="block w-[18px] h-[18px]"
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
                      />
                    </label>
                  </div>
                )}
                {(selectedOverlayPanel?.name === 'verticalStraightLine' || selectedOverlayPanel?.name === 'verticalLine') && (
                  <div className="relative ml-1 flex items-center">
                    <label
                      className="w-[18px] h-[18px] rounded border border-gray-300 overflow-hidden cursor-pointer"
                      title="Change vertical line color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                    >
                      <input
                        type="color"
                        aria-label="Change vertical line color"
                        className="w-0 h-0 opacity-0 absolute"
                        value={(() => {
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
                        })()}
                        onClick={(e) => { e.stopPropagation(); }}
                        onChange={(e) => {
                          try { e.stopPropagation(); } catch (_) {}
                          try {
                            const hex = e.target.value;
                            const chart = chartRef.current;
                            const id = selectedOverlayPanel?.id;
                            if (!chart || !id) return;
                            chart.overrideOverlay({ id, styles: { line: { color: hex } } });
                            try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                          } catch (_) { /* ignore */ }
                        }}
                      />
                      <span
                        className="block w-[18px] h-[18px]"
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
                      />
                    </label>
                  </div>
                )}
                {selectedOverlayPanel?.name === 'fibonacciRightLine' && (
                  <div className="relative ml-1 flex items-center">
                    <label
                      className="w-[18px] h-[18px] rounded border border-gray-300 overflow-hidden cursor-pointer"
                      title="Change Fibonacci retracement color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                    >
                      <input
                        type="color"
                        aria-label="Change Fibonacci retracement color"
                        className="w-0 h-0 opacity-0 absolute"
                        value={(() => {
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
                        })()}
                        onClick={(e) => { e.stopPropagation(); }}
                        onChange={(e) => {
                          try { e.stopPropagation(); } catch (_) {}
                          try {
                            const hex = e.target.value;
                            const chart = chartRef.current;
                            const id = selectedOverlayPanel?.id;
                            if (!chart || !id) return;
                            chart.overrideOverlay({ id, styles: { line: { color: hex } } });
                            try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                          } catch (_) { /* ignore */ }
                        }}
                      />
                      <span
                        className="block w-[18px] h-[18px]"
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
                      />
                    </label>
                  </div>
                )}
                {selectedOverlayPanel?.name === 'fibonacciTrendExtensionRight' && (
                  <div className="relative ml-1 flex items-center">
                    <label
                      className="w-[18px] h-[18px] rounded border border-gray-300 overflow-hidden cursor-pointer"
                      title="Change Fibonacci extension color"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                    >
                      <input
                        type="color"
                        aria-label="Change Fibonacci extension color"
                        className="w-0 h-0 opacity-0 absolute"
                        value={(() => {
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
                        })()}
                        onClick={(e) => { e.stopPropagation(); }}
                        onChange={(e) => {
                          try { e.stopPropagation(); } catch (_) {}
                          try {
                            const hex = e.target.value;
                            const chart = chartRef.current;
                            const id = selectedOverlayPanel?.id;
                            if (!chart || !id) return;
                            chart.overrideOverlay({ id, styles: { line: { color: hex } } });
                            try { setSelectedOverlayPanel(prev => (prev ? { ...prev } : prev)); } catch (_) {}
                          } catch (_) { /* ignore */ }
                        }}
                      />
                      <span
                        className="block w-[18px] h-[18px]"
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
                      />
                    </label>
                  </div>
                )}
                {/* Delete moved to the end to maintain order: Color, Configure, Delete */}
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
