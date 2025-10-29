// src/components/widget/services/realMarketService.js

import websocketService from '../../../services/websocketService';

export class RealMarketService {
    // Allow overriding via env; fallback to production API
    static BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'https://api.fxlabsprime.com');
    // Uses centralized WS service via websocketMessageRouter

    // Router registration bookkeeping (no direct socket)
    _routerStoreName = null;
    _onClose = null;
    _onOpen = null;
  
    /**
     * Fetch an OHLC slice using cursor-based pagination.
     * - If neither before/after is provided: returns most recent `limit` bars.
     * - If `before` provided: returns bars strictly older than `before`.
     * - If `after` provided: returns bars strictly newer than `after`.
     * Returns ascending bars plus cursors.
     */
    async fetchOhlcSlice(symbol = 'EURUSD', interval = '1m', { limit = 200, before = null, after = null } = {}) {
      try {
        const apiSymbol = symbol.endsWith('m') ? symbol : symbol + 'm';
        const apiTimeframe = this.convertIntervalToTimeframe(interval);

        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

        // Build URL (avoid double encoding for search params values)
        const url = `${RealMarketService.BASE_URL}/api/ohlc?symbol=${encodeURIComponent(apiSymbol)}&timeframe=${encodeURIComponent(apiTimeframe)}&limit=${safeLimit}` +
          (Number.isFinite(before) && before > 0 ? `&before=${before}` : '') +
          (Number.isFinite(after) && after > 0 ? `&after=${after}` : '');

        const headers = {};
        const apiKey = process.env.REACT_APP_API_TOKEN || process.env.REACT_APP_FXLABS_API_TOKEN;
        if (apiKey) headers['X-API-Key'] = apiKey;

        const response = await fetch(url, { headers });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.bars)) {
          throw new Error('Invalid response format from OHLC API');
        }

        // Transform bars (ascending order expected)
        const candles = data.bars.map((bar) => ({
          time: Math.floor(Number(bar.time) / 1000),
          open: parseFloat(bar.open),
          high: parseFloat(bar.high),
          low: parseFloat(bar.low),
          close: parseFloat(bar.close),
          volume: parseFloat(bar.volume || 0),
          tick_volume: parseFloat(bar.tick_volume || 0),
          spread: parseFloat(bar.spread || 0),
          is_closed: Boolean(bar.is_closed),
          openBid: parseFloat(bar.openBid ?? bar.open),
          highBid: parseFloat(bar.highBid ?? bar.high),
          lowBid: parseFloat(bar.lowBid ?? bar.low),
          closeBid: parseFloat(bar.closeBid ?? bar.close),
          openAsk: parseFloat(bar.openAsk ?? bar.open),
          highAsk: parseFloat(bar.highAsk ?? bar.high),
          lowAsk: parseFloat(bar.lowAsk ?? bar.low),
          closeAsk: parseFloat(bar.closeAsk ?? bar.close),
        })).filter((c) => {
          return (
            Number.isFinite(c.time) &&
            Number.isFinite(c.open) &&
            Number.isFinite(c.high) &&
            Number.isFinite(c.low) &&
            Number.isFinite(c.close) &&
            c.time > 0 &&
            c.high >= c.low &&
            c.high >= c.open &&
            c.high >= c.close &&
            c.low <= c.open &&
            c.low <= c.close
          );
        });

        const count = Array.isArray(data.bars) ? data.bars.length : 0;
        const nextBefore = Number.isFinite(data.next_before) ? data.next_before : (typeof data.next_before === 'number' ? data.next_before : null);
        const prevAfter = Number.isFinite(data.prev_after) ? data.prev_after : (typeof data.prev_after === 'number' ? data.prev_after : null);

        return { candles, count, nextBefore, prevAfter, raw: data };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error fetching OHLC slice:', error);
        throw error;
      }
    }

    /**
     * Deprecated: page/per_page-based pagination. Use fetchOhlcSlice instead.
     * Kept for reference; not used by updated components.
     */
    async getHistoricalData(
      symbol = 'EURUSD',
      interval = '1m',
      limit = 500
    ) {
      const res = await this.fetchOhlcSlice(symbol, interval, { limit: Math.min(limit || 200, 1000) });
      return res.candles;
    }
  
  /**
   * Fetch historical OHLC data with pagination support
   * @param {string} symbol - Trading symbol (e.g., 'EURUSD')
   * @param {string} interval - Timeframe (e.g., '1m', '5m', '1h')
   * @param {number} page - Page number (1-based)
   * @param {number} perPage - Items per page (max 1000)
   * @returns {Promise<{candles: Array, hasMore: boolean}>}
   */
  async getHistoricalDataWithPage(
    symbol = 'EURUSD',
    interval = '1m',
    _page = 1,
    perPage = 200
  ) {
    // Shim to avoid breaking callers that might still use this method.
    const res = await this.fetchOhlcSlice(symbol, interval, { limit: Math.min(perPage || 200, 1000) });
    // Approximate hasMore via presence of nextBefore and non-empty result
    return { candles: res.candles, hasMore: !!(res.nextBefore && res.count > 0) };
  }
  
  /**
   * Convert interval format to API timeframe format
   * 1m -> 1M, 5m -> 5M, 1h -> 1H, 1d -> 1D, 1w -> 1W
   */
  convertIntervalToTimeframe(interval) {
    const mapping = {
      '1m': '1M',
      '5m': '5M',
      '15m': '15M',
      '30m': '30M',
      '1h': '1H',
      '4h': '4H',
      '1d': '1D',
      '1w': '1W'
    };
    return mapping[interval.toLowerCase()] || '5M'; // Default to 5M if not found
  }
  
  /**
   * Get time interval in seconds for different timeframes
   */
  getTimeIntervalInSeconds(interval) {
    const intervals = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
      '1w': 604800
    };
    const key = (interval || '').toLowerCase();
    return intervals[key] || 60; // Default to 1 minute
  }
  
  /**
   * Connect: register a transient handler with the shared WS router.
   * Streams each tick immediately to the chart via onMessage.
   */
    connectWebSocket(
      symbol = 'EURUSD',
      interval = '1m',
      onMessage,
      onError,
      onClose,
      onOpen
    ) {
      try {
        // Cleanup any existing registration
        if (this._routerStoreName) {
          websocketService.unregisterStore(this._routerStoreName);
          this._routerStoreName = null;
        }

        // Normalize symbol matching against server suffix
        const wants = [symbol, symbol + 'm', symbol.replace('m', '')];
        const storeName = `realMarketChart:${symbol}:${interval}:${Date.now()}`;
        this._routerStoreName = storeName;
        this._onClose = onClose;
        this._onOpen = onOpen;

        // Note: Do NOT synthesize candles from ticks for KLine.
        // KLine should only update on closed-bar OHLC updates to avoid jitter.

        // Message handler via router
        const handler = (message) => {
          try {
            if (!message || !message.type) return;
            // Live ticks -> update the current (open) candle only
            if (message.type === 'ticks') {
              const arr = Array.isArray(message.data) ? message.data : [];
              if (arr.length === 0) return;
              const tfSec = this.getTimeIntervalInSeconds(interval);
              for (let i = 0; i < arr.length; i++) {
                const t = arr[i];
                const sym = (t.symbol || t.pair || '').toString();
                if (!wants.includes(sym)) continue;
                const price = parseFloat(t.bid || t.ask || t.price || 0);
                if (!Number.isFinite(price) || price <= 0) continue;
                const nowSec = Number.isFinite(t.time) ? Math.floor(t.time / 1000) : Math.floor(Date.now() / 1000);
                const bucketStart = Math.floor(nowSec / tfSec) * tfSec;
                const tickUpdate = {
                  source: 'tick',
                  time: bucketStart,
                  price,
                  volume: parseFloat(t.volume || 0)
                };
                if (onMessage) onMessage(tickUpdate);
              }
              return;
            }
            // Consolidated OHLC updates on closed candles
            if (message.type === 'ohlc_updates') {
              const tf = this.convertIntervalToTimeframe(interval);
              const msgTf = (message?.timeframe || '').toString().toUpperCase();
              if (tf !== msgTf) return; // Ignore other timeframes
              const arr = Array.isArray(message?.data) ? message.data : [];
              if (arr.length === 0) return;
              for (let i = 0; i < arr.length; i++) {
                const entry = arr[i];
                const sym = (entry?.symbol || '').toString();
                if (!wants.includes(sym)) continue;
                const o = entry?.ohlc || {};
                // Determine time seconds from bar_time (ms) or time_iso
                let timeSec = 0;
                if (typeof entry?.bar_time === 'number') {
                  timeSec = Math.floor(entry.bar_time / 1000);
                } else if (typeof o?.time_iso === 'string') {
                  const parsed = Date.parse(o.time_iso);
                  if (Number.isFinite(parsed)) timeSec = Math.floor(parsed / 1000);
                }
                const open = parseFloat(o.open);
                const high = parseFloat(o.high);
                const low = parseFloat(o.low);
                const close = parseFloat(o.close);
                const volume = parseFloat(o.volume || o.tick_volume || 0);
                if (!Number.isFinite(timeSec) || timeSec <= 0) continue;
                if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) continue;
                const candleData = {
                  time: timeSec,
                  open,
                  high,
                  low,
                  close,
                  volume
                };
                if (onMessage) onMessage(candleData);
              }
              return;
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('RealMarketService handler error:', e);
            if (onError) onError(e);
          }
        };

        // Register with the centralized router
        websocketService.registerStore(storeName, {
          messageHandler: handler,
          connectionCallback: () => { if (typeof onOpen === 'function') onOpen(); },
          disconnectionCallback: (ev) => { if (typeof onClose === 'function') onClose(ev); },
          errorCallback: (err) => { if (typeof onError === 'function') onError(err); },
          subscribedMessageTypes: ['ticks', 'ohlc_updates']
        });

        // Ensure the shared connection is up
        if (websocketService.getStatus()?.isConnected) {
          if (typeof onOpen === 'function') onOpen();
        } else {
          websocketService.connect().catch((err) => { if (onError) onError(err); });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error registering real market handler:', error);
        if (onError) onError(error);
      }
    }
  
    /**
     * Disconnect WebSocket
     */
    disconnectWebSocket() {
      if (this._routerStoreName) {
        try {
          websocketService.unregisterStore(this._routerStoreName);
        } catch (_e) { /* ignore */ }
        this._routerStoreName = null;
      }
      if (typeof this._onClose === 'function') {
        try { this._onClose({ code: 1000, reason: 'Manual disconnect' }); } catch (_e) { /* ignore */ }
      }
    }
  
    /**
     * Check if WebSocket is connected
     */
    isConnected() {
      try { return !!websocketService.getStatus()?.isConnected; } catch (_e) { return false; }
    }
  
    /**
     * Get available symbols from your real market data
     */
    async getSymbols() {
      try {
        const response = await fetch(`${RealMarketService.BASE_URL}/api/symbols`);
        const data = await response.json();
        return data.symbols || [];
      } catch (error) {
        console.error('Error fetching symbols:', error);
        return [];
      }
    }
  }
  
  export const realMarketService = new RealMarketService();
