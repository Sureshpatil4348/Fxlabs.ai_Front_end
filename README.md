# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Candlestick-Only Mode

- The TradingView widget now supports only the K-line candlestick chart. The separate Line Chart page (with volume, 24h change, and multiple indicator panels) has been removed from the UI.
- Any attempts to switch to a line chart are ignored; the store enforces `candlestick` mode on set and on state rehydrate.
- Sidebar > Chart Type menu shows only Candlestick.

## K-line Chart History Loading (Background Preload)

- Initial candles are fetched with a fixed count of 150 using the REST `limit=150` parameter. `getInitialBarsForTimeframe` returns 150 regardless of timeframe to enforce this.
- After the first page is displayed (150 bars), the system waits 2 seconds, then automatically preloads older candles in the background using keyset (cursor) pagination. The preloader fetches pages sequentially up to a total of 20 pages (including the first), with no scroll needed. Scroll/zoom left-edge detection for pagination has been disabled.
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
  - `UnifiedChart.jsx` loads the first page with `limit=150`, stores `next_before` as an in-memory cursor, and then starts a background preloader that sequentially calls the existing `loadMoreHistory()` until either 20 total pages are loaded or the server indicates no more history. The preloader is session-bound to `symbol`/`timeframe` changes and stops automatically on change.
  - Candles are deduplicated by `time` and kept sorted ascending before being applied to charts.

### Environment variables

- `REACT_APP_API_BASE_URL` (optional): override API base (default: `https://api.fxlabsprime.com`).
- `REACT_APP_API_TOKEN` (optional): if set, sent as `X-API-Key` header for `/api/ohlc` requests.

## Developer Notes: `getInitialBarsForTimeframe` memoization

- In `src/components/widget/components/UnifiedChart.jsx`, `getInitialBarsForTimeframe` is created via `useMemo` to provide a stable function reference across renders and returns a fixed value of `150`.
- This stability allows it to be safely listed in `useEffect` dependencies without causing unnecessary effect re-runs, and keeps ESLint's `react-hooks/exhaustive-deps` satisfied (see the effect dependency in the same file).
- An equivalent, more idiomatic alternative would be `useCallback`: `const getInitialBarsForTimeframe = useCallback(() => 150, [])`.

## K-line Chart Loading States

### Loading vs. Error UI Priority

- **During initialization** (`!chartRef.current`): Always show loading spinner, even if a transient error occurred. This prevents error UI from flashing briefly on first page load.
- **After initialization** (`chartRef.current` exists): Show error UI only if an actual error persists after the chart has been initialized.
- **Implementation**: The error UI condition requires both `error` state AND `chartRef.current` to be truthy. This ensures errors from during initialization don't flash to the user—they'll only see the loading state.
- **Related file**: `src/components/widget/components/KLineChartComponent.jsx` (lines 1092-1135)

## Fix: Indicators Dropdown Click Handling (RSI toggle)

- Issue: Clicking the Indicators dropdown and toggling items (e.g., RSI) had no effect because the dropdown was rendered via a portal, but the outside-click handler only checked the header button container. A `mousedown` on the portal closed the dropdown before the toggle `onClick` could fire, so no console logs or state updates occurred.
- Change: Add a ref to the portal panel and update the outside-click logic to only close when the click is outside both the button container and the portal panel.
- File: `src/components/widget/components/TradingViewHeader.jsx`
- How to verify:
  - Open the chart, click Indicators, toggle RSI. The switch updates, a log prints from the store toggle, and the UnifiedChart renders the RSI panel.
  - Toggling again hides the RSI panel.

## KLineChart Indicator Display Fix

**Issue:** Enabling RSI in the K-line chart sometimes did not show the RSI panel.

**Root Causes:**
- The chart container height was hard‑limited to 370px, leaving no vertical space for additional indicator panes like RSI.
- The indicator API usage mixed arguments and removal semantics, which could prevent proper teardown/creation sequences.

**Fixes:**
- Make the chart container fill available height (remove fixed 370px min/max). This allows new panes (e.g., RSI) to render visibly. File: `src/components/widget/components/KLineChartComponent.jsx`.
- Create new‑pane indicators (RSI/MACD/ATR/etc.) with explicit `paneOptions` and a default height of ~120px. Overlay indicators (EMA/SMA/BOLL/VWAP) are stacked on the main pane. File: `KLineChartComponent.jsx`.
- Prevent vertical overflow: chart height = 370px base + 120px per enabled pane (RSI/MACD/ATR/KDJ/WR/CCI/OBV). This keeps the widget bounded and avoids pushing surrounding UI. File: `KLineChartComponent.jsx`.
- Use the correct `removeIndicator({ ... })` filter form instead of passing a string id; remove by `paneId` for separate panes and by `name` for overlays. File: `KLineChartComponent.jsx`.

**Result:** Toggling RSI shows/hides a dedicated RSI pane under the candles in candlestick mode. This also improves behavior for MACD/ATR/etc.

**Indicators Mapping to KLineCharts API:**
- `rsi` → `RSI`
- `ema20` / `ema200` → `EMA` (with periods parameter)
- `macd` → `MACD`
- `atr` → `ATR`
- `sma50` / `sma100` → `SMA` (with periods parameter)
- `bollinger` → `BOLL`
- `stoch` → `KDJ` (KLineCharts uses KDJ for Stochastic)
- `williams` → `WR` (Williams %R)
- `cci` → `CCI`
- `obv` → `OBV`
- `vwap` → `VWAP`

**File Modified:** `src/components/widget/components/KLineChartComponent.jsx` (lines 912-974)

**How to Verify:**
1. Open the TradingView widget with a candlestick chart
2. Click the Indicators button in the header
3. Toggle RSI on/off
4. Observe: The toggle switch updates, console logs appear (📈 KLineChart: Adding RSI indicator → ✅ KLineChart: RSI indicator added), and RSI appears/disappears on the KLineChart
