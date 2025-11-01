# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Candlestick-Only Mode

## K-line Tooltip (Hide Time + Abbreviations)

- The default KLineCharts candle tooltip shows: Time, Open, High, Low, Close, Volume.
- We override the tooltip legends to remove the Time entry and abbreviate labels.
- Change location: `src/components/widget/components/KLineChartComponent.jsx:~700`
- Implementation: set `candle.tooltip.custom` to an array without `{time}` and with abbreviated titles:
  - `{ title: 'O:', value: '{open}' }`, `{ title: 'H:', value: '{high}' }`, `{ title: 'L:', value: '{low}' }`, `{ title: 'C:', value: '{close}' }`, `{ title: 'V:', value: '{volume}' }`

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

## Drawing Tools and A11y Updates

- Multiple horizontal/vertical lines supported using KLineCharts built-ins; Vertical Line tool added in toolbar and sidebar.
- Click-to-delete on Trend/Horizontal/Vertical lines shows a small delete panel; pressing the trash button removes only the selected line.
- A11y/ESLint: Removed click/mouse handlers from non-interactive delete panel wrappers and used a native `button` for actions; wrapper uses `role="dialog"`.
- Files: `src/components/widget/components/KLineChartComponent.jsx`, `src/components/widget/components/KLineDrawingToolbar.jsx`, `src/components/widget/components/Sidebar.jsx`.

### Fibonacci Retracement (Right-Only, 2 points)

- The built-in KLineCharts `fibonacciLine` extends levels to both left and right. We now register a custom overlay `fibonacciRightLine` (2 anchor points) that extends levels only to the right from the fib range.
- The overlay uses `totalStep: 3` (matching KLineCharts’ 2-point tools) and renders the preview line while drawing, then fib levels after the second anchor.
- The toolbar and sidebar map the Fib tool to this custom overlay, so plotted retracement “bars” no longer extend to the left edge.
- File: `src/components/widget/components/KLineChartComponent.jsx:~640-940`
- If you prefer the original behavior, change the overlay mapping from `fibonacciRightLine` back to `fibonacciLine` inside `handleDrawingToolChange`.

### Trend-Based Fibonacci Extension (3 points, Right-Only)

- Added a new drawing tool that uses 3 anchors (A→B defines the trend; C is the pivot) and projects Fibonacci extension levels to the right only.
- Overlay ID: `fibonacciTrendExtensionRight`, Tool ID: `fibExtension`. The overlay uses `totalStep: 4` to collect 3 anchors (A, B, C) and finalize on the 4th step, consistent with KLineCharts multi-anchor overlays.
- Ratios used: 0.618, 1.0, 1.272, 1.618, 2.0, 2.618. Lines start at the rightmost of the three anchors and extend to the right edge.
- Files:
  - `src/components/widget/components/KLineChartComponent.jsx:~640-980` (overlay registration + tool mapping)
  - `src/components/widget/components/KLineDrawingToolbar.jsx:~1-160` (tool entry)
  - `src/components/widget/components/Sidebar.jsx:~1-120` (sidebar button)
- To disable right-only behavior, you can customize `startX` and `endX` inside the overlay’s `createPointFigures` implementation.

## Sidebar Scrolling (Many Tools)

- The K-line tools left panel is vertically scrollable when content exceeds available height.
- Implementation: sidebar container uses `h-full min-h-0 overflow-y-auto`.
- File: `src/components/widget/components/Sidebar.jsx`
