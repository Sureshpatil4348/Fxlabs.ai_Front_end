# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Dependency Update: klinecharts 10.0.0-alpha9

- Bumped `klinecharts` from `^10.0.0-alpha5` to `^10.0.0-alpha9` in `package.json`.
- Code review shows our current API usage (`init`, `setStyles`, `setOptions`, `applyNewData`, `updateData`, `scrollToRealTime`, `subscribeAction`, `createIndicator/removeIndicator`, `createOverlay/removeOverlay`) remains compatible with v10 alpha9.
- No code changes were necessary; existing functionality should remain intact.
- After pulling, reinstall dependencies to update the lockfile and local modules:
  - npm: `rm -rf node_modules package-lock.json && npm i`
  - yarn: `rm -rf node_modules yarn.lock && yarn install`
  - pnpm: `rm -rf node_modules pnpm-lock.yaml && pnpm install`


## Candlestick-Only Mode

## K-line Tooltip (Hide Time)

- The default KLineCharts candle tooltip shows: Time, Open, High, Low, Close, Volume.
- We override the tooltip legends to remove the Time entry while keeping OHLC + Volume.
- Change location: `src/components/widget/components/KLineChartComponent.jsx:~700`
- Implementation: set `candle.tooltip.custom` to an array without `{time}`.
  - Example applied:
    - `{ title: 'open', value: '{open}' }`, `{ title: 'high', value: '{high}' }`, `{ title: 'low', value: '{low}' }`, `{ title: 'close', value: '{close}' }`, `{ title: 'volume', value: '{volume}' }`

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

## Indicators: RSI Enhanced + EMA Touch + ATR Enhanced + BB Pro + MA Enhanced + ORB Enhanced + ST Enhanced + SR Enhanced + MACD Enhanced

- Indicators are currently limited to nine options:
  - RSI Enhanced: shows RSI(14) in a dedicated pane beneath the candles.
  - EMA Touch: overlay indicator mapped to Bollinger Bands (BB 20, 2.0) on the main pane. ATR-based targets and signal labels from the provided Pine can be added next.
  - ATR Enhanced: separate pane using ATR(14). Initial version plots the built-in ATR line; premium visuals (zones, dynamic color, dashboard, alerts) from the provided Pine will be added later.
  - Bollinger Bands Pro: on-chart BOLL overlay with premium line styling (upper/lower: #2962FF, width 2; middle: #FF6D00, width 1). Band fill and dashboard from Pine will be layered in a next phase as supported.
  - MA Enhanced: on-chart multi-EMA overlay (9/21/50/100/200) with distinct colors and widths. Fill and dashboard from Pine can be added later.
  - ORB Enhanced: on-chart Opening Range Breakout overlay. Initial implementation plots range high/low and derived TP/SL lines. Advanced visuals (box fill, labels, table) to be explored as overlay support allows.
  - SuperTrend Enhanced: on-chart SuperTrend overlay computed from ATR(10) and multiplier 3.0. Current version draws the ST line; dynamic fills/labels and dashboards will be explored next.
  - Support/Resistance Enhanced: on-chart Support/Resistance overlay using pivot-based levels (left/right = 15). Plots last detected resistance/support and thin dashed zone boundaries.
  - MACD Enhanced: below‑chart MACD pane with MACD and Signal lines and a 4‑level histogram (strong/weak bull/bear) using distinct colors.
- Toggle path: Header → Indicators → RSI Enhanced / EMA Touch.

## KLineChart Indicator Display Fix

**Issue:** Enabling RSI in the K-line chart sometimes did not show the RSI panel.

**Root Causes:**
- The chart container height was hard‑limited to 370px, leaving no vertical space for additional indicator panes like RSI.
- The indicator API usage mixed arguments and removal semantics, which could prevent proper teardown/creation sequences.

**Fixes:**
- Make the chart container obey its parent height (100% container‑driven sizing). New panes (e.g., RSI) now share the available height instead of growing the DOM. File: `src/components/widget/components/KLineChartComponent.jsx`.
- Create new‑pane indicators (RSI/MACD/ATR/etc.) with explicit `paneOptions` and a default height of ~120px. Overlay indicators (EMA/SMA/BOLL/VWAP) are stacked on the main pane. File: `KLineChartComponent.jsx`.
- Remove the previous logic that increased the DOM height by a fixed base plus per‑pane pixels. This prevented cases where the chart expanded vertically beyond its allocated space when RSI was enabled. File: `KLineChartComponent.jsx`.
- Use the correct `removeIndicator({ ... })` filter form instead of passing a string id; remove by `paneId` for separate panes and by `name` for overlays. File: `KLineChartComponent.jsx`.

**Result:**
- Toggling RSI Enhanced shows/hides a dedicated RSI pane under the candles in candlestick mode (single RSI(14) line).
- Toggling EMA Touch overlays Bollinger Bands on the main pane.
- Toggling ATR Enhanced shows/hides an ATR pane under the candles (ATR 14).

## Layout Fix: TradingChart Height

- The `TradingChart` root container used `h-screen`, which caused the chart to exceed the grid cell height in the dashboard layout. This produced vertical overflow even when no indicators were enabled.
- Updated to `h-full` so the widget respects its parent’s allocated space.
- File: `src/components/widget/TradingChart.jsx`

Additionally, several flex containers now include `min-h-0` to allow children to shrink within grid cells without forcing overflow:
- `src/components/widget/TradingChart.jsx` (main wrappers)
- `src/components/widget/components/UnifiedChart.jsx` (root wrapper)

**File Modified:** `src/components/widget/components/KLineChartComponent.jsx`

**How to Verify:**
1. Open the Trading view with the candlestick chart.
2. Click Indicators in the header and toggle RSI on/off.
3. Observe: The chart container keeps its size; RSI appears in a sub‑pane within the chart without increasing total height; toggling off removes the pane without layout shifts.
