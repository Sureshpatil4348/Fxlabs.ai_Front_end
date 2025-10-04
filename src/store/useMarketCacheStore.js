import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import websocketService from '../services/websocketService';
import indicatorService from '../services/indicatorService';
import pricingService from '../services/pricingService';
import { SUPPORTED_PAIRS, BROKER_SUFFIX } from '../constants/pairs';

// Utility: safe JSON parse
const safeParse = (text, fallback) => {
  try { return JSON.parse(text); } catch (_e) { return fallback; }
};

// Utility: convert plain objects to Maps recursively (for known keys)
const toMap = (obj) => {
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
    // pricingBySymbol: symbol -> { bid, ask, time, time_iso, daily_change_pct, lastUpdate }
    pricingBySymbol: new Map(),
    // ticksBySymbol: symbol -> { ticks: [..], lastUpdate }
    ticksBySymbol: new Map(),

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
          // no-op
        },
        disconnectionCallback: () => {
          // keep cache
        },
        errorCallback: () => {
          // keep cache
        },
        subscribedMessageTypes: ['connected', 'initial_indicators', 'indicator_update', 'ticks', 'pong', 'error']
      });

      // Ensure WS connection
      websocketService.connect().catch(() => {});

      set({ initialized: true });

      // Kick off hydration from REST
      try {
        await get().hydrateFromREST();
      } catch (_e) {
        // Silent; live WS will fill
      }
    },

    hydrateFromSession: () => {
      try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return;
        const parsed = safeParse(raw, {});
        const indicatorsBySymbol = new Map();
        const rsiBySymbolTimeframe = new Map();
        const pricingBySymbol = new Map();
        const ticksBySymbol = new Map();

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

        set({
          indicatorsBySymbol,
          rsiBySymbolTimeframe,
          pricingBySymbol,
          ticksBySymbol,
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
        pricingBySymbol: mapToObject(state.pricingBySymbol),
        ticksBySymbol: mapToObject(state.ticksBySymbol)
      };
      try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload)); } catch (_e) { /* ignore */ }
    },

    hydrateFromREST: async () => {
      const state = get();
      if (state.isHydrating) return;
      set({ isHydrating: true });

      const pairs = Array.from(new Set((get().supportedPairs || []).slice(0, 32)));
      const timeframes = Array.isArray(get().supportedTimeframes) && get().supportedTimeframes.length > 0 ? get().supportedTimeframes : DEFAULT_TIMEFRAMES;

      const indicatorCalls = timeframes.map((tf) => indicatorService.fetchIndicatorSnapshot({ indicator: 'rsi', timeframe: tf, pairs }));
      const pricingCall = pricingService.fetchPricingSnapshot({ pairs });

      const results = await Promise.allSettled([...indicatorCalls, pricingCall]);

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

      // Process pricing snapshot (last result)
      const pricingRes = results[timeframes.length];
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

    // --- WebSocket message handling ---
    handleMessage: (message) => {
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
        case 'ticks': {
          const ticks = Array.isArray(message.data) ? message.data : [];
          if (ticks.length === 0) break;
          const ticksBySymbol = new Map(get().ticksBySymbol || new Map());
          const pricingBySymbol = new Map(get().pricingBySymbol || new Map());
          ticks.forEach((tick) => {
            if (!tick || !tick.symbol) return;
            const existing = ticksBySymbol.get(tick.symbol) || { ticks: [], lastUpdate: null };
            existing.ticks = [tick, ...existing.ticks.slice(0, 49)];
            existing.lastUpdate = new Date();
            ticksBySymbol.set(tick.symbol, existing);

            // Update pricing view
            pricingBySymbol.set(tick.symbol, {
              bid: tick.bid,
              ask: tick.ask,
              time: tick.time || Date.now(),
              time_iso: tick.time_iso || new Date().toISOString(),
              daily_change_pct: typeof tick.daily_change_pct === 'number' ? tick.daily_change_pct : (pricingBySymbol.get(tick.symbol)?.daily_change_pct || 0),
              lastUpdate: new Date()
            });
          });
          set({ ticksBySymbol, pricingBySymbol });
          get().persistToSession();
          get().broadcastToLegacyStoresDebounced();
          break;
        }
        default:
          break;
      }
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

          // Apply to store
          useRSITrackerStore.setState({ rsiData, indicatorData });

          // Pricing into tickData as synthetic ticks
          if (typeof trackerState.ingestPricingSnapshot === 'function' && pricingEntries.length > 0) {
            trackerState.ingestPricingSnapshot(pricingEntries);
          }
        } catch (_e) { /* ignore */ }
      });

      // Sync to RSI Correlation store
      import('./useRSICorrelationStore').then(({ default: useRSICorrelationStore }) => {
        try {
          const corrState = useRSICorrelationStore.getState();
          const tf = corrState?.settings?.timeframe || '4H';
          const allPairs = [...(corrState?.correlationPairs?.positive || []), ...(corrState?.correlationPairs?.negative || [])];
          const symbols = Array.from(new Set(allPairs.flat().map((s) => `${s}m`)));

          const rsiData = new Map();
          symbols.forEach((sym) => {
            const tfMap = state.rsiBySymbolTimeframe.get(sym);
            const entry = tfMap && tfMap.get(String(tf).toUpperCase());
            if (entry && typeof entry.value === 'number') {
              rsiData.set(sym, { value: entry.value, period: entry.period, timeframe: entry.timeframe, updatedAt: entry.updatedAt });
            }
          });

          const indicatorData = new Map();
          symbols.forEach((sym) => {
            const base = state.indicatorsBySymbol.get(sym);
            if (!base) return;
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

          useRSICorrelationStore.setState({ rsiData, indicatorData });

          // Pricing into tickData
          if (typeof corrState.ingestPricingSnapshot === 'function' && pricingEntries.length > 0) {
            corrState.ingestPricingSnapshot(pricingEntries);
          } else {
            // Fallback: set minimal tickData directly
            const tickData = new Map();
            pricingEntries.forEach((p) => {
              tickData.set(p.symbol, { ticks: [{
                symbol: p.symbol,
                time: p.time || Date.now(),
                time_iso: p.time_iso || new Date().toISOString(),
                bid: p.bid,
                ask: p.ask,
                volume: p.volume || 0,
                daily_change_pct: p.daily_change_pct || 0
              }], lastUpdate: new Date() });
            });
            useRSICorrelationStore.setState({ tickData });
          }
        } catch (_e) { /* ignore */ }
      });
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


