# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Recent Fixes

- Dashboard header: On the Dashboard page, the header aligns to the same horizontal margins as the main content (`px-2 sm:px-3`) for consistent edge spacing.
- Dashboard header elevation reduced on Dashboard only: lowered from `shadow-2xl` to `shadow-md` to match other widgets (e.g., Trending Pairs), leaving non-dashboard pages unchanged.
- **Drawing Tools Sidebar Scrollbar**: Scrollbar now auto-hides on Windows (matches Mac behavior) - only visible on hover/scroll, improving UI cleanliness.
- Split Mode UI: Indicator dropdown and currency pair selector now match non-split styling (removed unintended borders/rounded styles in split panel controls) for visual consistency.
- Numeric inputs: All key number fields now allow fully clearing the value while typing; if left empty, the value commits as 0 on blur. This prevents jumpy defaults and makes editing smoother.
- KLineCharts: Top-right on‑chart indicator tables (e.g., MA Pro, ORB, BB Pro, ST Pro) now render side‑by‑side in a single flex container from right → left. This prevents overlap when multiple on‑chart tables are enabled simultaneously.
- KLineCharts: Initial loading shimmer now also keys off the live candle set (and chart ref) so it consistently appears while data is empty in production builds (e.g., Netlify), matching the Currency Strength Meter skeleton behavior.

### Quick Open (Trending + RSI)

- Pairs in Trending Pairs and RSI Tracker are now clickable. Clicking a pair sets that symbol in the KLine trading widget immediately.
- Symbols are normalized automatically (e.g., strips trailing "m"/"M") before opening in the chart.
- Accessibility: rows are keyboard-activatable via Enter/Space.
- If you click the pair that’s already active in the KLine chart, nothing happens (no reload, no flicker).

### ATR Percentage Mode (KLineCharts)

- ATR Enhanced now displays strictly as percentage of close (ATR%).
- Indicator line, pane label, and stats table use percentage values only.
- Axis values may compact very small decimals; values are already scaled to percent to improve readability.
- No toggle exists for raw ATR — percentage mode is always on by design.

## Numeric Input Behavior

- You can delete the entire value in any updated numeric field and type a new value freely.
- If you clear a field and leave it empty (blur), the app treats it as `0`.
- This is powered by a shared `NumericInput` component (`src/components/ui/NumericInput.jsx`) that ensures consistent UX without side effects.
- We applied this behavior across alert configs, global RSI settings, RSI correlation settings, and key KLineChart indicator settings.

## Features

### State Persistence

All chart state is automatically persisted to localStorage and restored on page reload or browser tab reopen.

**What's Persisted:**
- **Currency Pair & Timeframe**: Selected symbol and timeframe automatically restored
- **Indicators**: All active indicators and their configurations persist across sessions
- **Drawings & Overlays**: User-drawn objects (trend lines, fibonacci retracements, rectangles, positions, annotations) are saved per symbol-timeframe combination
- **Fullscreen State**: Fullscreen mode preference is remembered
- **Workspace Visibility**: Hide/Unhide All button state persists - if you hide all indicators and reload, they stay hidden
- **Chart Settings**: Grid visibility, timezone, cursor type, and all other preferences

**Drawings Persistence Details:**
- Drawings are anchored to timestamps, not visual positions
- When you draw on historical candles and return hours/days later, drawings remain on the exact candles where you placed them
- Automatic saving occurs 2 seconds after last modification (debounced)
- Separate drawing storage for each symbol-timeframe-chart combination (e.g., EURUSD 1h chart 1 drawings won't appear on EURUSD 1h chart 2 in split mode)
- **Split Mode Support**: Each chart in split mode maintains its own independent drawing storage - chart 1 and chart 2 drawings persist separately
- **Hide/Show State**: Hidden drawings persist in their hidden state - if you hide a drawing and reload, it stays hidden
- **All Modifications Persist**: Color changes, text edits, style updates, visibility toggles all trigger automatic saves
- Programmatically generated overlays (indicator labels, markers) are excluded from persistence
- All overlay properties persist including text annotations, position lengths, styles, colors, and visibility state

**Benefits:**
- Seamless experience across browser sessions
- No manual save/export required
- Drawings always appear on correct candles regardless of time elapsed
- Independent state per chart configuration

### Indicator Table Styling

- All KLineChart indicator tables rendered at the top-right (e.g., Bollinger Bands Pro, Moving Average Pro, SuperTrend Pro, ORB Enhanced) now use a carded container with rounded corners, subtle shadow, and slight blur for improved readability without obstructing the chart. Their position has been nudged slightly left for better visual balance.
- This styling is consistent across on-chart overlays and below-chart panes (ATR Pro, MACD Pro), ensuring a cohesive UI.

### KLineChart Indicator Presets

The KLineChart component now includes a sophisticated preset system for quickly applying groups of technical indicators.

#### Preset Functionality

**Available Presets:**
1. **Moneytize** - Moving Average Pro + RSI Pro + MACD Pro (3 indicators: 1 on-chart, 2 below-chart)
2. **Trend Scalper** - Super Trend Pro + MACD Pro (2 indicators: 1 on-chart, 1 below-chart)
3. **Buy/Sell Signal** - Trend Strategy + ATR Pro (2 indicators: 1 on-chart, 1 below-chart)

**Features:**
- **Smart Activation**: Clicking a preset applies only the indicators that aren't already active, preserving existing indicator configurations
- **Visual Feedback**: Active presets are highlighted with a gradient background
- **Interactive Tooltips**: Hover over any preset to see:
  - All indicators included in the preset
  - Which indicators are currently active (shown in green)
  - Which indicators will be activated (shown in gray)
  - Contextual help text
- **Intelligent Toggle**: Clicking an active preset removes only those preset indicators, leaving any extra indicators intact
- **Limit Enforcement**: Respects indicator limits (3 on-chart, 2 below-chart) and shows clear error messages when limits would be exceeded
- **Automatic Sync**: Preset state automatically syncs with indicators dropdown - indicators show as active in both places

#### How It Works

**Applying a Preset:**
- If NO indicators from preset are active → All preset indicators activate
- If SOME indicators from preset are active → Only missing indicators activate (existing ones remain untouched)
- If ALL indicators from preset are active → Preset is marked as active (green highlight)

**Removing a Preset:**
- Click an active preset → Only preset indicators are removed
- Non-preset indicators remain active
- Example: If you have Moneytize preset + Support/Resistance Pro active, clicking Moneytize removes only the 3 Moneytize indicators

**Switching Between Presets:**
- Clicking a different preset automatically removes the previous preset's indicators first
- Then applies the new preset's indicators
- Example: Moneytize active → Click Trend Scalper → Moneytize indicators removed, Trend Scalper indicators applied
- Non-preset indicators remain untouched during switches

**Limit Checking:**
- On-chart indicators: Max 3 (Trend Strategy, Bollinger Bands Pro, Moving Average Pro, Breakout Strategy, Super Trend Pro, Support/Resistance Pro)
- Below-chart indicators: Max 2 (RSI Pro, ATR Pro, MACD Pro)
- Error messages show current count and how many more indicators the preset needs

**Edge Cases Handled:**
1. Partial preset active + try to activate → Only missing indicators added
2. At limit + try preset → Clear error message shown
3. Active preset + extra indicators → Removing preset keeps extras
4. Multiple indicators from different presets → Each can be managed independently
5. Indicator toggled via dropdown → Preset state updates automatically

### Position Tools Badge Display

- Short/Long Position red badge: single line showing “Stop xx (yy%) RR Ratio: zz”.
- Green badge: “Target: mm (nn%)”.
- This reduces on-chart clutter and applies to both long and short position tools.

### Split Mode (KLine Chart)

The KLineChart now supports a split mode feature that allows you to view two independent charts side-by-side. This is particularly useful for comparing different currency pairs or timeframes simultaneously.

#### Accessing Split Mode

- The **Split** button is now visible in both normal and fullscreen modes
- In normal mode, clicking **Split** automatically enters fullscreen first and then enables split view
- In fullscreen, clicking **Split** immediately enables split view
- Click **Unsplit** to exit split mode and return to single chart view
- **Auto-unsplit**: Split mode automatically disables when exiting fullscreen mode to ensure UI consistency

#### Split Mode Features

When in split mode:

**Top Panel:**
- **Unsplit**, **Timezone**, and **Fullscreen** buttons positioned at the rightmost side
- Symbol selector, timeframe selector, and indicators dropdown are hidden from the main header

**Each Split Chart:**
- Has its own independent top panel with:
  - **Pair Selector**: Choose different currency pairs for each chart
  - **Timeframe Selector**: Select different timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w) for each chart
  - **Indicators Selector**: Configure indicators independently for each chart
- Displays charts horizontally (side-by-side)
- Respects the same indicator limits (3 on-chart, 2 below-chart) per chart
- Fetches and displays data independently for each chart
- **Default State**: Both charts initially display the same pair, timeframe, and indicators as the main chart when split mode is activated

**Layout:**
- **Left Sidebar**: Visible with drawing tools and chart controls
- **Charts**: Evenly divided with a vertical separator
- **Bottom Panel**: Visible with Alert and Grid buttons (preset buttons hidden)
- Each chart maintains its own data, state, and real-time updates
- Both charts update independently via WebSocket connections and state stores:
  - Chart 1 (left): Uses `useChartStore` for state management
  - Chart 2 (right): Uses `useSplitChartStore` for state management
  - WebSocket updates are routed to the correct store based on chart index
  - Separate service instances ensure no interference between charts

**Drawing Tools in Split Mode:**
- Drawing tools work independently per chart.
- Selecting a tool queues it as “pending”. The first chart you click arms the tool on that chart only (single-use per selection), preventing duplicate actions across both charts.
- All drawing tools (trend lines, fibonacci, rectangles, positions, etc.) remain fully functional on both charts.
- Each chart maintains its own independent set of drawings.

### Timeframe Selector Behavior

- Default quick selections show `1m`, `5m`, `15m`, plus a `More` dropdown.
- Selecting any timeframe from `More` swaps it into the third quick slot, and moves `15m` into the `More` list.
- Selecting `1m` or `5m` restores the default quick selections (`1m`, `5m`, `15m`) and returns the previously swapped timeframe back into `More`.
- If `15m` appears inside `More` (after a swap) and is selected, the quick selections revert to the default.
- Behavior is consistent in both split and non‑split modes since the header controls the active timeframe globally.

### Breakout Strategy (ORB) Settings Validation

- Saving ORB settings validates the Opening Candle time against the active timeframe to ensure a real candle boundary exists.
- Rules by timeframe:
  - `1m`: any minute is valid
  - `5m`/`15m`/`30m`: minute must be a multiple of 5/15/30 respectively (e.g., 0,5,10…)
  - `1h`: minute must be `0`
  - `4h`: hour must be one of `0,4,8,12,16,20` and minute must be `0`
  - `1d` and `1w`: hour must be `0` and minute must be `0`
- If the input is not aligned, an inline error appears: “Please choose an opening candle hour / minute which is multiple of <timeframe> …” and the settings are not saved.

### Seamless Loading on Pair/Timeframe Change

- Changing the currency pair or timeframe now shows a shimmer-based skeleton overlay (consistent with Currency Strength Meter and AI News Analysis loaders) instead of the old text/circular spinner.
- Old candles are cleared immediately on selection change so no broken/half-baked candles appear.
- While the initial REST fetch is in progress, live WebSocket updates are temporarily ignored to prevent partial bar rendering; they resume automatically once loading completes.
- Applies to both single and split mode. Each split chart independently shows the loader and manages its own data flow.

**Use Cases:**
- Compare the same pair across different timeframes (e.g., EURUSD 1m vs EURUSD 1h)
- Monitor multiple pairs simultaneously (e.g., EURUSD vs GBPUSD)
- Apply different indicator sets to analyze the same pair from multiple perspectives
- Track correlated pairs for divergence analysis

**Default Configuration:**
- Both charts initially use the main chart settings (same pair, timeframe, and indicators)
- You can then independently modify either chart's settings
- Changes to one chart do not affect the other chart

#### Usage Example

```javascript
// Scenario: You want to use Moneytize preset
// Current state: RSI Pro is already active

// Step 1: Hover over "Moneytize" button
// Tooltip shows:
// • Moving Average Pro (gray) - will be activated
// • RSI Pro (green) - already active
// • MACD Pro (gray) - will be activated
// • ATR Pro (gray) - will be activated
// "Click to activate remaining"

// Step 2: Click "Moneytize"
// Result: Moving Average Pro, MACD Pro, and ATR Pro are activated
// RSI Pro remains with its existing configuration
// Moneytize button turns green (active state)

// Step 3: Click "Moneytize" again
// Result: All 4 Moneytize indicators are removed
// Any other indicators remain active
```
