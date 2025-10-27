import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { SUPPORTED_PAIRS, BROKER_SUFFIX } from '../constants/pairs';
import indicatorService from '../services/indicatorService';
import pricingService from '../services/pricingService';
import trendingService from '../services/trendingService';
import websocketService from '../services/websocketService';

// Utility: safe JSON parse
const safeParse = (text, fallback) => {
  try { return JSON.parse(text); } catch (_e) { return fallback; }
};

// Utility: convert plain objects to Maps recursively (for known keys)
const _toMap = (obj) => {
  if (!obj) return new Map();
  if (obj instanceof Map) return obj;
  const map = new Map();
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    map.set(k, v && typeof v === 'object' && !Array.isArray(v) ? v : v);
  });
  return map;
};

// Utility: serialize Maps to plain objects for sessionStorage
const mapToObject = (map) => {
  const out = {};
  if (!(map instanceof Map)) return out;
  map.forEach((v, k) => { out[k] = v; });
  return out;
};

const SESSION_STORAGE_KEY = 'marketCache:v1';

const DEFAULT_TIMEFRAMES = ['1M', '5M', '15M', '30M', '1H', '4H', '1D'];
const DEFAULT_INDICATORS = ['RSI', 'MACD', 'EMA21', 'EMA50', 'EMA200', 'UTBOT', 'IchimokuClone'];

const useMarketCacheStore = create(
  subscribeWithSelector((set, get) => ({
    // Lifecycle
    initialized: false,
    isHydrating: false,
    lastHydratedAt: 0,

    // Supported universe
    supportedPairs: SUPPORTED_PAIRS.map((p) => `${p}${BROKER_SUFFIX}`),
    supportedTimeframes: DEFAULT_TIMEFRAMES,
    supportedIndicators: DEFAULT_INDICATORS,

    // Centralized cache
    // indicatorsBySymbol: symbol -> { timeframes: Map(tf -> { indicators, barTime, lastUpdate }) }
    indicatorsBySymbol: new Map(),
    // rsiBySymbolTimeframe: symbol -> Map(tf -> { value, period, timeframe, updatedAt })
    rsiBySymbolTimeframe: new Map(),
    // quantumBySymbol: symbol -> { per_timeframe, overall, bar_times, lastUpdate }
    quantumBySymbol: new Map(),
    // pricingBySymbol: symbol -> { bid, ask, time, time_iso, daily_change_pct, lastUpdate }
    pricingBySymbol: new Map(),
    // ticksBySymbol: symbol -> { ticks: [..], lastUpdate }
    ticksBySymbol: new Map(),

    // Trending pairs
    // trendingSymbols: ordered list from backend (already ranked)
    trendingSymbols: [],
    // trendingMetaBySymbol: symbol -> { score?, reason? } (optional extras)
    trendingMetaBySymbol: new Map(),

    // Internal debounce for legacy broadcast
    _broadcastTimer: null,

    // --- Initialization & Persistence ---
    initialize: async () => {
      const state = get();
      if (state.initialized) return;

      // Hydrate from session first for instant UI readiness
      get().hydrateFromSession();

      // Register to WebSocket router for live updates
      websocketService.registerStore('marketCache', {
        messageHandler: (message, _raw) => {
          try { get().handleMessage(message); } catch (e) { /* eslint-disable-next-line no-console */ console.error('[MarketCache] handleMessage error:', e); }
        },
        connectionCallback: () => {
          // Notify global dashboard that at least one store is connected so the loader can close
          import('./useMarketStore').then(({ default: useMarketStore }) => {
            useMarketStore.getState().updateDashboardConnection('marketCache', {
              connected: true,
              connecting: false,
              error: null
            });
          }).catch(() => {});

          // Fetch initial trending pairs snapshot after WS connect
          try { get().hydrateTrendingFromREST(); } catch (_e) { /* ignore */ }
        },
        disconnectionCallback: () => {
          // keep cache
        },
        errorCallback: () => {
          // keep cache
        },
        subscribedMessageTypes: ['connected', 'initial_indicators', 'indicator_update', 'quantum_update', 'ticks', 'trending_pairs', 'trending_update', 'trending_snapshot', 'pong', 'error']
      });

      // Ensure WS connection
      websocketService.connect().catch(() => {});

      set({ initialized: true });
      // Defer REST hydration; trending will be fetched on WS connect callback
    },

    hydrateFromSession: () => {
      try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return;
        const parsed = safeParse(raw, {});
        const indicatorsBySymbol = new Map();
        const rsiBySymbolTimeframe = new Map();
        const quantumBySymbol = new Map();
        const pricingBySymbol = new Map();
        const ticksBySymbol = new Map();
        const trendingMetaBySymbol = new Map();

        Object.entries(parsed.indicatorsBySymbol || {}).forEach(([symbol, val]) => {
          const tfMap = new Map();
          const src = (val && val.timeframes) || {};
          Object.entries(src).forEach(([tf, v]) => { tfMap.set(tf, v); });
          indicatorsBySymbol.set(symbol, {
            symbol,
            timeframes: tfMap
          });
        });

        Object.entries(parsed.rsiBySymbolTimeframe || {}).forEach(([symbol, obj]) => {
          const tfMap = new Map();
          Object.entries(obj).forEach(([tf, v]) => { tfMap.set(tf, v); });
          rsiBySymbolTimeframe.set(symbol, tfMap);
        });

        Object.entries(parsed.pricingBySymbol || {}).forEach(([symbol, v]) => {
          pricingBySymbol.set(symbol, v);
        });

        Object.entries(parsed.ticksBySymbol || {}).forEach(([symbol, v]) => {
          ticksBySymbol.set(symbol, v);
        });

        Object.entries(parsed.quantumBySymbol || {}).forEach(([symbol, val]) => {
          quantumBySymbol.set(symbol, {
            per_timeframe: (val && val.per_timeframe) || {},
            overall: (val && val.overall) || {},
            bar_times: (val && val.bar_times) || {},
            lastUpdate: val && val.lastUpdate ? new Date(val.lastUpdate) : null
          });
        });

        Object.entries(parsed.trendingMetaBySymbol || {}).forEach(([symbol, v]) => {
          trendingMetaBySymbol.set(symbol, v || {});
        });

        set({
          indicatorsBySymbol,
          rsiBySymbolTimeframe,
          quantumBySymbol,
          pricingBySymbol,
          ticksBySymbol,
          trendingSymbols: Array.isArray(parsed.trendingSymbols) ? parsed.trendingSymbols : [],
          trendingMetaBySymbol,
          supportedTimeframes: Array.isArray(parsed.supportedTimeframes) && parsed.supportedTimeframes.length > 0 ? parsed.supportedTimeframes : DEFAULT_TIMEFRAMES
        });
      } catch (_e) {
        // ignore
      }
    },

    persistToSession: () => {
      const state = get();
      const payload = {
        supportedTimeframes: state.supportedTimeframes,
        indicatorsBySymbol: (() => {
          const out = {};
          state.indicatorsBySymbol.forEach((entry, symbol) => {
            const tfObj = mapToObject(entry.timeframes);
            out[symbol] = { symbol, timeframes: tfObj };
          });
          return out;
        })(),
        rsiBySymbolTimeframe: (() => {
          const out = {};
          state.rsiBySymbolTimeframe.forEach((tfMap, symbol) => {
            out[symbol] = mapToObject(tfMap);
          });
          return out;
        })(),
        quantumBySymbol: (() => {
          const out = {};
          state.quantumBySymbol.forEach((val, symbol) => {
            out[symbol] = {
              per_timeframe: val.per_timeframe || {},
              overall: val.overall || {},
              bar_times: val.bar_times || {},
              lastUpdate: val.lastUpdate || null
            };
          });
          return out;
        })(),
        pricingBySymbol: mapToObject(state.pricingBySymbol),
        ticksBySymbol: mapToObject(state.ticksBySymbol),
        trendingSymbols: Array.isArray(state.trendingSymbols) ? state.trendingSymbols : [],
        trendingMetaBySymbol: mapToObject(state.trendingMetaBySymbol)
      };
      try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload)); } catch (_e) { /* ignore */ }
    },

    // Minimal REST hydration for a single symbol's quantum snapshot (powers heatmap quickly)
    hydrateQuantumForSymbol: async (symbol) => {
      const sym = (symbol || '').trim();
      if (!sym) return;
      try {
        const res = await indicatorService.fetchIndicatorSnapshot({ indicator: 'quantum', timeframe: '5M', pairs: [sym] });
        const entries = (res && Array.isArray(res.pairs)) ? res.pairs : [];
        if (entries.length === 0) return;
        const quantumBySymbol = new Map(get().quantumBySymbol);
        entries.forEach((p) => {
          if (!p || !p.symbol || !p.quantum) return;
          const q = p.quantum;
          quantumBySymbol.set(p.symbol, {
            per_timeframe: q.per_timeframe || {},
            overall: q.overall || {},
            bar_times: q.bar_times || {},
            lastUpdate: new Date()
          });
        });
        set({ quantumBySymbol });
        get().persistToSession();
      } catch (_e) {
        // Silent; websocket will fill
      }
    },

    hydrateFromREST: async () => {
      const state = get();
      if (state.isHydrating) return;
      set({ isHydrating: true });

      const pairs = Array.from(new Set((get().supportedPairs || []).slice(0, 32)));
      const timeframes = Array.isArray(get().supportedTimeframes) && get().supportedTimeframes.length > 0 ? get().supportedTimeframes : DEFAULT_TIMEFRAMES;

      const indicatorCalls = timeframes.map((tf) => indicatorService.fetchIndicatorSnapshot({ indicator: 'rsi', timeframe: tf, pairs }));
      const quantumCall = indicatorService.fetchIndicatorSnapshot({ indicator: 'quantum', timeframe: '5M', pairs });
      const pricingCall = pricingService.fetchPricingSnapshot({ pairs });

      const results = await Promise.allSettled([...indicatorCalls, quantumCall, pricingCall]);

      // Process indicator snapshots per timeframe
      results.slice(0, timeframes.length).forEach((res, idx) => {
        const tf = timeframes[idx];
        if (res.status !== 'fulfilled') return;
        const entries = (res.value && Array.isArray(res.value.pairs)) ? res.value.pairs : [];
        if (entries.length === 0) return;

        // Update RSI
        const rsiMap = new Map(get().rsiBySymbolTimeframe);
        const indiMap = new Map(get().indicatorsBySymbol);
        entries.forEach((p) => {
          const symbol = p.symbol;
          // rsi structure
          const symTf = rsiMap.get(symbol) instanceof Map ? rsiMap.get(symbol) : new Map(rsiMap.get(symbol) || []);
          symTf.set(tf.toUpperCase(), {
            value: p.value,
            period: 14,
            timeframe: tf.toUpperCase(),
            updatedAt: new Date(p.ts || Date.now())
          });
          rsiMap.set(symbol, symTf);

          // Indicators container (at least include RSI value)
          const existing = indiMap.get(symbol) || { symbol, timeframes: new Map() };
          const tfMap = existing.timeframes instanceof Map ? existing.timeframes : new Map(existing.timeframes || []);
          const indicators = Object.assign({}, (tfMap.get(tf.toUpperCase()) || {}).indicators || {});
          indicators.rsi = { 14: p.value };
          tfMap.set(tf.toUpperCase(), {
            indicators,
            barTime: p.ts || Date.now(),
            lastUpdate: new Date()
          });
          indiMap.set(symbol, { symbol, timeframes: tfMap });
        });
        set({ rsiBySymbolTimeframe: rsiMap, indicatorsBySymbol: indiMap });
      });

      // Process quantum snapshot (next result)
      const quantumRes = results[timeframes.length];
      if (quantumRes && quantumRes.status === 'fulfilled') {
        const entries = (quantumRes.value && Array.isArray(quantumRes.value.pairs)) ? quantumRes.value.pairs : [];
        if (entries.length > 0) {
          const quantumBySymbol = new Map(get().quantumBySymbol);
          entries.forEach((p) => {
            if (!p || !p.symbol || !p.quantum) return;
            const q = p.quantum;
            quantumBySymbol.set(p.symbol, {
              per_timeframe: q.per_timeframe || {},
              overall: q.overall || {},
              bar_times: q.bar_times || {},
              lastUpdate: new Date()
            });
          });
          set({ quantumBySymbol });
        }
      }

      // Process pricing snapshot (last result)
      const pricingRes = results[timeframes.length + 1];
      if (pricingRes && pricingRes.status === 'fulfilled') {
        const entries = (pricingRes.value && Array.isArray(pricingRes.value.pairs)) ? pricingRes.value.pairs : [];
        if (entries.length > 0) {
          const pricingBySymbol = new Map(get().pricingBySymbol);
          const ticksBySymbol = new Map(get().ticksBySymbol);
          entries.forEach((p) => {
            if (!p || !p.symbol) return;
            pricingBySymbol.set(p.symbol, {
              bid: p.bid,
              ask: p.ask,
              time: typeof p.time === 'number' ? p.time : Date.now(),
              time_iso: p.time_iso || new Date().toISOString(),
              daily_change_pct: typeof p.daily_change_pct === 'number' ? p.daily_change_pct : 0,
              daily_change: typeof p.daily_change === 'number' ? p.daily_change : 0,
              lastUpdate: new Date()
            });
            const existing = ticksBySymbol.get(p.symbol) || { ticks: [], lastUpdate: null };
            const syntheticTick = {
              symbol: p.symbol,
              time: typeof p.time === 'number' ? p.time : Date.now(),
              time_iso: p.time_iso || new Date().toISOString(),
              bid: p.bid,
              ask: p.ask,
              volume: typeof p.volume === 'number' ? p.volume : 0,
              daily_change_pct: typeof p.daily_change_pct === 'number' ? p.daily_change_pct : 0
            };
            existing.ticks = [syntheticTick, ...existing.ticks.slice(0, 49)];
            existing.lastUpdate = new Date(syntheticTick.time);
            ticksBySymbol.set(p.symbol, existing);
          });
          set({ pricingBySymbol, ticksBySymbol });
        }
      }

      set({ isHydrating: false, lastHydratedAt: Date.now() });
      get().persistToSession();
      get().broadcastToLegacyStoresDebounced();
    },

    // Load trending pairs via REST
    hydrateTrendingFromREST: async (opts = {}) => {
      try {
        const res = await trendingService.fetchTrendingPairs({ limit: opts.limit });
        const items = Array.isArray(res?.pairs) ? res.pairs : Array.isArray(res) ? res : [];
        const normalized = items
          .map((it) => {
            if (!it) return null;
            // Support both string symbol entries and objects { symbol, score }
            const sym = typeof it === 'string' ? it : it.symbol;
            if (!sym) return null;
            let s = String(sym).trim();
            const upper = s.toUpperCase();
            // Ensure broker suffix 'm'
            if (!upper.endsWith('M')) s = upper + 'm'; else s = upper;
            return { symbol: s, meta: typeof it === 'object' ? { score: it.score, reason: it.reason } : {} };
          })
          .filter(Boolean);
        const trendingSymbols = normalized.map((x) => x.symbol);
        const trendingMetaBySymbol = new Map(get().trendingMetaBySymbol || new Map());
        normalized.forEach(({ symbol, meta }) => { trendingMetaBySymbol.set(symbol, meta || {}); });
        set({ trendingSymbols, trendingMetaBySymbol });

        // Proactively ensure subscriptions for indicators/ticks on these symbols
        try { get().ensureSubscriptionsForTrending(trendingSymbols); } catch (_e) {}

        get().persistToSession();
      } catch (_e) {
        // ignore; will be filled by websocket if available
      }
    },

    // --- WebSocket message handling ---
    handleMessage: (message) => {
      // Only log quantum updates with simplified info, skip others
      if (message?.type === 'quantum_update') {
        const symbol = message.symbol || message?.data?.symbol;
        const timeframes = message?.data?.per_timeframe ? Object.keys(message.data.per_timeframe).join(', ') : 'N/A';
        console.log(`🔍 MarketCache: Received quantum update for ${symbol} (timeframes: ${timeframes})`);
      }
      switch (message?.type) {
        case 'connected': {
          const tfs = Array.isArray(message.supported_timeframes) ? message.supported_timeframes : null;
          if (tfs && tfs.length > 0) {
            set({ supportedTimeframes: tfs.map((tf) => String(tf).toUpperCase()) });
          }
          break;
        }
        case 'initial_indicators':
        case 'indicator_update': {
          const symbol = message.symbol || message?.data?.symbol;
          const timeframe = (message.timeframe || message?.data?.timeframe || '').toUpperCase();
          const indicators = message?.data?.indicators || message?.indicators;
          const barTime = message?.data?.bar_time ?? message?.bar_time;
          if (!symbol || !indicators) break;

          // Update indicatorsBySymbol
          const indiMap = new Map(get().indicatorsBySymbol || new Map());
          const existing = indiMap.get(symbol) || { symbol, timeframes: new Map() };
          const tfMap = existing.timeframes instanceof Map ? existing.timeframes : new Map(existing.timeframes || []);
          if (timeframe) {
            tfMap.set(timeframe, {
              indicators,
              barTime,
              lastUpdate: new Date()
            });
          }
          indiMap.set(symbol, { symbol, timeframes: tfMap });
          set({ indicatorsBySymbol: indiMap });

          // Update RSI view if present
          if (indicators && indicators.rsi) {
            const periodKey = Object.keys(indicators.rsi)[0];
            const value = indicators.rsi[periodKey];
            if (typeof value === 'number') {
              const byTf = new Map(get().rsiBySymbolTimeframe || new Map());
              const symTf = byTf.get(symbol) instanceof Map ? byTf.get(symbol) : new Map(byTf.get(symbol) || []);
              if (timeframe) {
                symTf.set(timeframe, { value, period: periodKey, timeframe, updatedAt: new Date() });
              }
              byTf.set(symbol, symTf);
              set({ rsiBySymbolTimeframe: byTf });
            }
          }

          get().persistToSession();
          get().broadcastToLegacyStoresDebounced();
          break;
        }
        case 'quantum_update': {
          const symbol = message.symbol || message?.data?.symbol;
          const data = message?.data || {};
          if (!symbol || !data) break;

          const quantumBySymbol = new Map(get().quantumBySymbol || new Map());
          const prev = quantumBySymbol.get(symbol) || {};
          quantumBySymbol.set(symbol, {
            per_timeframe: data.per_timeframe || prev.per_timeframe || {},
            overall: data.overall || prev.overall || {},
            bar_times: data.bar_times || prev.bar_times || {},
            lastUpdate: new Date()
          });
          set({ quantumBySymbol });
          get().persistToSession();
          break;
        }
        case 'ticks': {
          const ticks = Array.isArray(message.data) ? message.data : [];
          if (ticks.length === 0) break;
          const ticksBySymbol = new Map(get().ticksBySymbol || new Map());
          const pricingBySymbol = new Map(get().pricingBySymbol || new Map());
          ticks.forEach((tick) => {
            if (!tick || !tick.symbol) return;
            
            // Debug logging for tick data (BTC only)
            if (tick.symbol === 'BTCUSDm') {
              console.log('🔍 MarketCache: Processing tick data:', {
                symbol: tick.symbol,
                daily_change_pct: tick.daily_change_pct,
                daily_change: tick.daily_change,
                bid: tick.bid,
                ask: tick.ask
              });
            }
            
            const existing = ticksBySymbol.get(tick.symbol) || { ticks: [], lastUpdate: null };
            existing.ticks = [tick, ...existing.ticks.slice(0, 49)];
            existing.lastUpdate = new Date();
            ticksBySymbol.set(tick.symbol, existing);

            // Update pricing view
            const pricingData = {
              bid: tick.bid,
              ask: tick.ask,
              time: tick.time || Date.now(),
              time_iso: tick.time_iso || new Date().toISOString(),
              daily_change_pct: typeof tick.daily_change_pct === 'number' ? tick.daily_change_pct : (pricingBySymbol.get(tick.symbol)?.daily_change_pct || 0),
              daily_change: typeof tick.daily_change === 'number' ? tick.daily_change : (pricingBySymbol.get(tick.symbol)?.daily_change || 0),
              lastUpdate: new Date()
            };
            
            if (tick.symbol === 'BTCUSDm') {
              console.log('🔍 MarketCache: Setting pricing data:', pricingData);
            }
            pricingBySymbol.set(tick.symbol, pricingData);
          });
          set({ ticksBySymbol, pricingBySymbol });
          get().persistToSession();
          get().broadcastToLegacyStoresDebounced();
          break;
        }
        case 'trending_pairs':
        case 'trending_update':
        case 'trending_snapshot': {
          // Flexible payload handling
          const payload = message?.data || message;
          const list = Array.isArray(payload?.pairs) ? payload.pairs
            : Array.isArray(payload?.symbols) ? payload.symbols
            : Array.isArray(payload) ? payload
            : [];
          if (list.length === 0) break;

          const normalized = list
            .map((it) => {
              const sym = typeof it === 'string' ? it : it?.symbol;
              if (!sym) return null;
              let s = String(sym).trim();
              const upper = s.toUpperCase();
              if (!upper.endsWith('M')) s = upper + 'm'; else s = upper;
              return { symbol: s, meta: typeof it === 'object' ? { score: it.score, reason: it.reason } : {} };
            })
            .filter(Boolean);
          const trendingSymbols = normalized.map((x) => x.symbol);
          const trendingMetaBySymbol = new Map(get().trendingMetaBySymbol || new Map());
          normalized.forEach(({ symbol, meta }) => { trendingMetaBySymbol.set(symbol, meta || {}); });
          set({ trendingSymbols, trendingMetaBySymbol });

          // Ensure live subscriptions for trending symbols
          try { get().ensureSubscriptionsForTrending(trendingSymbols); } catch (_e) {}

          get().persistToSession();
          get().broadcastToLegacyStoresDebounced();
          break;
        }
        default:
          break;
      }
    },

    // Subscribe to indicators/ticks for trending symbols via RSI tracker store
    ensureSubscriptionsForTrending: (symbols) => {
      const list = Array.isArray(symbols) ? symbols : get().trendingSymbols;
      if (!list || list.length === 0) return;
      try {
        import('./useRSITrackerStore').then(({ default: useRSITrackerStore }) => {
          const tracker = useRSITrackerStore.getState();
          const tf = tracker?.settings?.timeframe || '1H';
          list.forEach((sym) => {
            if (!tracker.subscriptions.has(sym)) {
              tracker.subscribe(sym, tf, ['ticks', 'indicators']);
            }
          });
        }).catch(() => {});
      } catch (_e) { /* ignore */ }
    },

    // --- Legacy store sync & getters ---
    broadcastToLegacyStoresDebounced: () => {
      const timer = get()._broadcastTimer;
      if (timer) return; // already queued
      const t = setTimeout(() => {
        try { get().broadcastToLegacyStores(); } finally { clearTimeout(get()._broadcastTimer); set({ _broadcastTimer: null }); }
      }, 0);
      set({ _broadcastTimer: t });
    },

    broadcastToLegacyStores: () => {
      // Push minimal snapshots into existing stores to drive widgets without refactor
      const state = get();

      // Prepare pricing entries for ingestion
      const pricingEntries = [];
      state.pricingBySymbol.forEach((v, symbol) => {
        pricingEntries.push({
          symbol,
          bid: v.bid,
          ask: v.ask,
          time: v.time,
          time_iso: v.time_iso,
          volume: 0,
          daily_change_pct: v.daily_change_pct
        });
      });

      // Sync to RSI Tracker
      import('./useRSITrackerStore').then(({ default: useRSITrackerStore }) => {
        try {
          const trackerState = useRSITrackerStore.getState();
          const tf = trackerState?.settings?.timeframe || '1H';
          const symbols = Array.isArray(trackerState?.settings?.autoSubscribeSymbols) ? trackerState.settings.autoSubscribeSymbols : state.supportedPairs;

          // Build rsiData map for current timeframe
          const rsiData = new Map();
          symbols.forEach((sym) => {
            const tfMap = state.rsiBySymbolTimeframe.get(sym);
            const entry = tfMap && tfMap.get(String(tf).toUpperCase());
            if (entry && typeof entry.value === 'number') {
              rsiData.set(sym, { value: entry.value, period: entry.period, timeframe: entry.timeframe, updatedAt: entry.updatedAt });
            }
          });

          // Build indicatorData map carrying per-timeframe indicators
          const indicatorData = new Map();
          symbols.forEach((sym) => {
            const base = state.indicatorsBySymbol.get(sym);
            if (!base) return;
            // Maintain backward-compatible flat fields using latest tf data if available
            const tfMap = base.timeframes instanceof Map ? base.timeframes : new Map(base.timeframes || []);
            const latestTf = String(tf).toUpperCase();
            const latest = tfMap.get(latestTf) || null;
            indicatorData.set(sym, {
              symbol: sym,
              timeframe: latest ? latestTf : undefined,
              indicators: latest ? latest.indicators : undefined,
              barTime: latest ? latest.barTime : undefined,
              lastUpdate: latest ? latest.lastUpdate : undefined,
              timeframes: tfMap
            });
          });

          // Merge into store instead of replacing to avoid wiping existing RSI data
          const prevRsi = trackerState?.rsiData instanceof Map ? trackerState.rsiData : new Map(trackerState?.rsiData || []);
          const prevIndicator = trackerState?.indicatorData instanceof Map ? trackerState.indicatorData : new Map(trackerState?.indicatorData || []);

          // Only update when we actually have entries to merge
          const hasRsiUpdates = rsiData.size > 0;
          const hasIndicatorUpdates = indicatorData.size > 0;
          if (hasRsiUpdates) {
            rsiData.forEach((val, key) => { prevRsi.set(key, val); });
          }
          if (hasIndicatorUpdates) {
            indicatorData.forEach((val, key) => { prevIndicator.set(key, val); });
          }
          if (hasRsiUpdates || hasIndicatorUpdates) {
            useRSITrackerStore.setState({ rsiData: prevRsi, indicatorData: prevIndicator });
          }

          // Pricing into tickData as synthetic ticks
          if (typeof trackerState.ingestPricingSnapshot === 'function' && pricingEntries.length > 0) {
            trackerState.ingestPricingSnapshot(pricingEntries);
          }
        } catch (_e) { /* ignore */ }
      });

      // Correlation store removed; no broadcast
    },

    // Query helpers
    getRsiEntriesForSymbols: (timeframe, symbols) => {
      const tf = String(timeframe || '').toUpperCase();
      const out = [];
      if (!tf || !Array.isArray(symbols)) return out;
      symbols.forEach((sym) => {
        const tfMap = get().rsiBySymbolTimeframe.get(sym);
        const entry = tfMap && tfMap.get(tf);
        if (entry && typeof entry.value === 'number') {
          out.push({ symbol: sym, value: entry.value, period: entry.period, timeframe: tf, updatedAt: entry.updatedAt });
        }
      });
      return out;
    }
  }))
);

export default useMarketCacheStore;

