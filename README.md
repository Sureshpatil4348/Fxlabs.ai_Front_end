# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## K-line Chart History Loading (Cursor Pagination)

- Initial candles are fetched per timeframe using `getInitialBarsForTimeframe` to match visible ranges (e.g., 15m → 288 bars).
- Older candles are auto-fetched with keyset (cursor) pagination when users scroll left or zoom out near the oldest visible candle.
- Data source (REST): `GET /api/ohlc?symbol=EURUSDm&timeframe=5M&limit=100&before=1696230060000`
  - Query params:
    - `symbol` (required): instrument name, e.g., `EURUSDm`.
    - `timeframe` (required): one of `1M,5M,15M,30M,1H,4H,1D,1W`.
    - `limit` (optional, default 100, max 1000): bars to return.
    - `before` (optional): epoch ms, returns bars strictly older than this time (page older).
    - `after` (optional): epoch ms, returns bars strictly newer than this time (page newer). Use either `before` or `after`, not both.
  - Responses include cursors:
    - `next_before`: pass as `before` to fetch the next older slice without duplication.
    - `prev_after`: pass as `after` to page newer without duplication.
  - Bars are returned in ascending time order and include `is_closed`.

### Implementation details

- Service: `src/components/widget/services/realMarketService.js`
  - `fetchOhlcSlice(symbol, interval, { limit, before, after })` fetches a single slice, converts `time` to seconds, and returns `{ candles, count, nextBefore, prevAfter }`.
  - Uses `REACT_APP_API_BASE_URL` if set, else defaults to `https://api.fxlabsprime.com`.
  - Adds `X-API-Key: {API_TOKEN}` header when `REACT_APP_API_TOKEN` (or `REACT_APP_FXLABS_API_TOKEN`) is configured.
- Components:
  - `ChartPanel.jsx` and `UnifiedChart.jsx` now load initial data with one or more `limit`-based calls (max 1000 per call), then keep `next_before` as an in-memory cursor to fetch older pages on demand.
  - Candles are deduplicated by `time` and kept sorted ascending before being applied to charts.

### Environment variables

- `REACT_APP_API_BASE_URL` (optional): override API base (default: `https://api.fxlabsprime.com`).
- `REACT_APP_API_TOKEN` (optional): if set, sent as `X-API-Key` header for `/api/ohlc` requests.

