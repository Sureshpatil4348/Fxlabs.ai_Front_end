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

## K-line Cursor Tools (Crosshair, Pointer, Grab)

- The sidebar “Cursor” menu controls the KLine chart interaction cursor.
- Modes and behavior:
  - `Crosshair`: Crosshair is enabled in the chart and the DOM cursor shows `crosshair`.
  - `Pointer`: Crosshair is disabled and the DOM cursor shows `pointer`.
  - `Grab`: Crosshair is disabled and the DOM cursor shows `grab`, switching to `grabbing` while dragging for panning.
- Implementation details:
  - Changes applied in `src/components/widget/components/KLineChartComponent.jsx` with a dedicated effect around `settings.cursorType` and a dynamic container class.
  - Uses `chart.setStyles({ crosshair: { show: <bool> } })` to toggle crosshair visibility.
  - Applies cursor via container style and forced CSS classes to override library defaults.
- CSS helpers in `src/index.css`:
    - `.kline-cursor-crosshair`, `.kline-cursor-pointer`, `.kline-cursor-grab`, `.kline-cursor-grabbing` (each enforces cursor on all children with `!important`).

## Sidebar: Clear All Button Update

- The left panel's “Clear All” button is now styled gray to match other icons instead of red.
- Clicking it prompts a confirmation and then removes all drawings and indicators from both the KLine chart and the Universal (Recharts) drawing layer.
- Implementation details:
  - Component: `src/components/widget/components/Sidebar.jsx:~1-260`
  - Behavior: On confirm, clears Universal drawings via `useDrawingTools().clearAllDrawings()`, removes KLine overlays via a robust multi-pass strategy (`getOverlays`/`getAllOverlays` + remove by `{id,paneId}`, `{id}`, `id`, and by `name` for known overlays), attempts immediate indicator removal when possible, and turns off all indicator toggles through the chart store `setIndicatorsPreset`. Also deactivates any active drawing tool in both systems and dismisses any on-chart overlay action panel/inline editor via `chart._dismissSelectedOverlayPanel()`.
  - Confirmation UI: Uses a custom centered modal within the KLine widget via `chart._openConfirmModal({ title, message, confirmText, cancelText, onConfirm })`. Falls back to `window.confirm` only if the chart ref is unavailable.
- UX: Button classes changed to `text-gray-500 hover:text-gray-700` for a consistent look.

## Sidebar: Hide/Unhide All

- A new button above “Clear All” toggles visibility of every on-chart drawing (KLine overlays) and all indicators without deleting anything or prompting a confirmation.
- Behavior:
  - When toggled to “Hide All”, does NOT change the indicator switches in the dropdown; it temporarily removes indicator instances from the chart and hides all KLine overlays using `overrideOverlay({ id, visible: false })`.
  - Also hides overlay popups/toolpanels (delete/config, inline text editor, rectangle color palette) and suppresses selection while hidden.
  - When toggled to “Unhide All”, it makes overlays visible again and re-applies indicator instances based on the current switch states (switches remain unchanged).
- Implementation details:
  - Store: `src/components/widget/stores/useChartStore.js` adds `isWorkspaceHidden` and action `setWorkspaceHidden` (not persisted).
  - Sidebar UI/logic: `src/components/widget/components/Sidebar.jsx` adds the new button and `handleKLineToggleVisibility` to apply the toggle, removing indicators at hide time and re-applying them at unhide time via a no-op `setIndicatorsPreset` with current values.
  - No confirmation dialog is shown; this is a non-destructive visibility toggle.

## K-line RSI Enhanced

- Added configurable RSI pane to mirror common Pine features:
  - Inputs: Length, Source (Close/Open/High/Low/HL2/HLC3/OHLC4), Overbought/Oversold levels.
  - Styling: RSI line color via pane color button (width fixed at 1).
  - Status: Live "RSI Zone" badge (Overbought/Oversold/Neutral) with colors.
  - Alerts: Lightweight on-chart chips when RSI crosses into OB/OS zones.
- How to use:
  - Toggle RSI from the indicators switch (enabled by default).
  - Hover the RSI pane; use the small color swatch to change RSI line color; use the gear icon to open settings for length/source/levels.
  - Changes apply immediately and persist via `localStorage`.
- Implementation:
  - Store: `settings.indicatorSettings.rsiEnhanced` in `useChartStore`.
  - Chart: `KLineChartComponent.jsx` wires settings to KLineCharts `RSI` indicator styles and computes RSI locally for status/alerts.

## Fix: K-line Text Tool Delete (inline editor blur)

- Problem: Deleting a text annotation from the on-chart overlay action panel sometimes failed because clicking the delete button first blurred the inline text editor, which cleaned up the action panel before the click handler executed.
- Change: Handle deletion on `onMouseDown` (with `preventDefault`/`stopPropagation`) so the removal runs before the input blur cleanup.
- Location: `src/components/widget/components/KLineChartComponent.jsx:~2590-2635` (delete button in the selected drawing action panel).
- Result: Clicking the delete overlay button reliably removes text annotations (and other overlays) without being interrupted by the inline editor blur.
