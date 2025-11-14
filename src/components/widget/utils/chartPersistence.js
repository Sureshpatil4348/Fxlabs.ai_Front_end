// Lightweight localStorage-based persistence for KLine chart state
// - Persists candles per (chartIndex, symbol, timeframe)
// - Persists user drawings/overlays per (chartIndex, symbol, timeframe)
// - Persists fullscreen UI state

const VERSION = 'v1';
const PREFIX = `kline:${VERSION}`;

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeParse = (str, fallback = null) => {
  try {
    if (typeof str !== 'string') return fallback;
    return JSON.parse(str);
  } catch (_) {
    return fallback;
  }
};

const keyFor = (type, chartIndex, symbol, timeframe) => {
  const chart = Number(chartIndex) === 2 ? 'split' : 'main';
  const sym = String(symbol || 'UNKNOWN').toUpperCase();
  const tf = String(timeframe || '1h');
  return `${PREFIX}:${type}:${chart}:${sym}@${tf}`;
};

// Candles persistence
const MAX_BARS = 3000; // keep recent N bars to avoid exceeding localStorage limits

export function saveCandles(chartIndex, symbol, timeframe, candles) {
  if (!isBrowser()) return;
  try {
    if (!Array.isArray(candles) || candles.length === 0) return;
    // Normalize and prune: keep last MAX_BARS ascending by time
    const sorted = [...candles]
      .filter(
        (c) =>
          Number.isFinite(c?.time) &&
          Number.isFinite(c?.open) &&
          Number.isFinite(c?.high) &&
          Number.isFinite(c?.low) &&
          Number.isFinite(c?.close) &&
          c.time > 0
      )
      .sort((a, b) => a.time - b.time);
    const pruned = sorted.slice(Math.max(0, sorted.length - MAX_BARS));
    const slim = pruned.map((c) => ({
      time: Number(c.time),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume || 0),
    }));
    const k = keyFor('candles', chartIndex, symbol, timeframe);
    window.localStorage.setItem(k, JSON.stringify({ bars: slim }));
  } catch (_) {
    // ignore
  }
}

export function loadCandles(chartIndex, symbol, timeframe) {
  if (!isBrowser()) return [];
  try {
    const k = keyFor('candles', chartIndex, symbol, timeframe);
    const val = window.localStorage.getItem(k);
    const parsed = safeParse(val, null);
    const bars = Array.isArray(parsed?.bars) ? parsed.bars : [];
    return bars
      .filter(
        (c) =>
          Number.isFinite(c?.time) &&
          Number.isFinite(c?.open) &&
          Number.isFinite(c?.high) &&
          Number.isFinite(c?.low) &&
          Number.isFinite(c?.close) &&
          c.time > 0
      )
      .sort((a, b) => a.time - b.time);
  } catch (_) {
    return [];
  }
}

// Overlay persistence
// Only persist user-created overlays; skip programmatic ones (locked or flagged otherwise).
const ALLOWED_OVERLAY_NAMES = new Set([
  'segment',
  'trendLine',
  'horizontalStraightLine',
  'horizontalLine',
  'verticalStraightLine',
  'verticalLine',
  'fibonacciRightLine',
  'fibonacciTrendExtensionRight',
  'rectangle',
  'text',
  'longPosition',
  'shortPosition',
]);

function normalizePoint(pt) {
  // Normalize points to { timestamp, value }
  if (!pt || (!Number.isFinite(pt.timestamp) && !Number.isFinite(pt.time))) return null;
  const ts = Number.isFinite(pt.timestamp) ? Number(pt.timestamp) : Number(pt.time);
  const v = Number(pt.value);
  if (!Number.isFinite(ts) || !Number.isFinite(v)) return null;
  return { timestamp: ts, value: v };
}

export function saveOverlays(chartIndex, symbol, timeframe, overlays) {
  if (!isBrowser()) return;
  try {
    const k = keyFor('overlays', chartIndex, symbol, timeframe);
    const items = (Array.isArray(overlays) ? overlays : [])
      .filter((ov) => ov && ov.visible !== false && !ov.locked && ALLOWED_OVERLAY_NAMES.has(ov.name))
      .map((ov) => {
        const pts = Array.isArray(ov.points) ? ov.points.map(normalizePoint).filter(Boolean) : [];
        const out = {
          name: ov.name,
          points: pts,
        };
        // Persist commonly-used custom fields when present
        if (Number.isFinite(ov.widthPx)) out.widthPx = Number(ov.widthPx);
        if (Number.isFinite(ov.stopValue)) out.stopValue = Number(ov.stopValue);
        if (Number.isFinite(ov.targetValue)) out.targetValue = Number(ov.targetValue);
        if (Number.isFinite(ov.qty)) out.qty = Number(ov.qty);
        if (typeof ov.text === 'string') out.text = ov.text;
        // Styles: persist shallow plain object only
        if (ov.styles && typeof ov.styles === 'object') {
          try {
            out.styles = JSON.parse(JSON.stringify(ov.styles));
          } catch (_) {
            // skip non-serializable styles
          }
        }
        return out;
      });
    window.localStorage.setItem(k, JSON.stringify({ overlays: items }));
  } catch (_) {
    // ignore
  }
}

export function loadOverlays(chartIndex, symbol, timeframe) {
  if (!isBrowser()) return [];
  try {
    const k = keyFor('overlays', chartIndex, symbol, timeframe);
    const val = window.localStorage.getItem(k);
    const parsed = safeParse(val, null);
    const items = Array.isArray(parsed?.overlays) ? parsed.overlays : [];
    return items
      .filter((ov) => ov && ALLOWED_OVERLAY_NAMES.has(ov.name) && Array.isArray(ov.points) && ov.points.length > 0)
      .map((ov) => ({
        name: ov.name,
        paneId: 'candle_pane',
        points: ov.points.map(normalizePoint).filter(Boolean),
        widthPx: Number.isFinite(ov.widthPx) ? ov.widthPx : undefined,
        stopValue: Number.isFinite(ov.stopValue) ? ov.stopValue : undefined,
        targetValue: Number.isFinite(ov.targetValue) ? ov.targetValue : undefined,
        qty: Number.isFinite(ov.qty) ? ov.qty : undefined,
        text: typeof ov.text === 'string' ? ov.text : undefined,
        styles: ov.styles && typeof ov.styles === 'object' ? ov.styles : undefined,
      }));
  } catch (_) {
    return [];
  }
}

// UI: fullscreen persistence
const FULLSCREEN_KEY = `${PREFIX}:ui:fullscreen`;

export function saveFullscreenState(isFullscreen) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(FULLSCREEN_KEY, isFullscreen ? '1' : '0');
  } catch (_) {
    // ignore
  }
}

export function loadFullscreenState() {
  if (!isBrowser()) return false;
  try {
    const v = window.localStorage.getItem(FULLSCREEN_KEY);
    return v === '1';
  } catch (_) {
    return false;
  }
}

