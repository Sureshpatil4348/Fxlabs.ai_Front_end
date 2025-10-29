# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## K-line Chart History Loading

- Initial candles are fetched per timeframe using `getInitialBarsForTimeframe` to match sensible visible ranges (e.g., 15m → 288 bars).
- Older candles are auto-fetched with pagination when users scroll left or zoom out near the oldest visible candle.
- Data source: `GET /api/ohlc?symbol={SYMBOL}m&timeframe={TF}&page={N}&per_page={K}` (Page 1 = most recent; older pages increment).
- **All OHLC REST requests use `per_page=200` consistently** regardless of timeframe for both initial loads and pagination calls.
- Candles are deduplicated and merged by timestamp in ascending order.

