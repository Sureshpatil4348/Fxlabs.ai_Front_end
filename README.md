# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Features

### Subscription & Network Resilience

- Subscription status checks now distinguish between actual subscription expiry and transient network issues.
- Network or connectivity errors during background checks no longer log users out or show the "Your subscription has ended" modal; they are logged and the user session is preserved.

### Linting Configuration

- ESLint `import/order` rule is disabled project-wide (`.eslintrc.json`) to prevent import ordering from blocking builds and deployments while other rules still enforce code quality with `--max-warnings=0`.

### State Persistence

All chart state is automatically persisted to localStorage and restored on page reload or browser tab reopen.

**What's Persisted:**
- **Currency Pair & Timeframe**: Selected symbol and timeframe automatically restored
- **Indicators**: All active indicators and their configurations persist across sessions
- **Drawings & Overlays**: User-drawn objects (trend lines, fibonacci retracements, rectangles, positions, annotations) are saved per symbol (persist across timeframe changes, but not across pair changes)
- **Fullscreen State**: Fullscreen mode preference is remembered
- **Workspace Visibility**: Hide/Unhide All button state persists - if you hide all indicators and reload, they stay hidden
- **Chart Settings**: Grid visibility, timezone, cursor type, and all other preferences

**Default KLineChart Configuration (on first load):**
- **Default Currency Pair**: `EUR/USD` (`EURUSD`)
- **Default Timeframe**: `15m`
- **Default Chart Type**: `Candlestick` (toggleable to `Line` via the chart-type dropdown next to the pair selector; line mode renders a close-price line while preserving all existing tools, drawings, zooming and split-mode behavior)
- **Default Cursor for Drawing Tools**: `Pointer`
- **Default Indicators**: None enabled by default
- **Initial REST History Load**: 1000 candles on first fetch; background preloading of additional past data is temporarily disabled (older-history preloading logic remains in code for future re-enable)

**Drawings Persistence Details:**
- Drawings are anchored to timestamps, not visual positions
- When you draw on historical candles and return hours/days later, drawings remain on the exact candles where you placed them
- Automatic saving occurs 2 seconds after last modification (debounced)
- **Timeframe-Independent Storage**: Drawings are stored per symbol-chart combination (NOT per timeframe)
  - Drawings persist when changing timeframes on the same pair (e.g., EURUSD 1m → EURUSD 1h keeps drawings)
  - Drawings do NOT transfer when changing pairs (e.g., EURUSD → GBPUSD clears drawings)
- **Split Mode Support**: Each chart in split mode maintains its own independent drawing storage - chart 1 and chart 2 drawings persist separately per symbol
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

### KLineChart Loading Experience

- While initial candles are loading, the KLineChart now renders placeholder x/y axes using arbitrary time and price values so the chart frame is visible immediately.
- During this phase, no candlesticks are drawn (their bodies, borders, wicks, and price marks are hidden), and a subtle spinner is shown in the center without occluding the axes.
- Once real candle data arrives, the axes automatically update to the correct time/price ranges and candlesticks become visible with the normal styling.
- Grid configuration (horizontal and vertical lines) is explicitly preserved during loading state transitions to ensure consistent rendering across development and production builds.

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

### Fibonacci Tools Visualization

- Fibonacci Retracement and Extension tools now display percentage levels and price values aligned to the rightmost edge of the chart for better visibility and reduced visual clutter on the chart body.

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
- Selecting a tool queues it as "pending". The first chart you click arms the tool on that chart only (single-use per selection), preventing duplicate actions across both charts.
- All drawing tools (trend lines, fibonacci, rectangles, positions, etc.) remain fully functional on both charts.
- Each chart maintains its own independent set of drawings.
- **Per-Chart Clear in Split Mode**: When clicking the "Clear All" button in the sidebar while in split mode, a confirmation modal appears in EACH chart simultaneously. Each modal allows you to independently clear that specific chart's drawings and indicators, enabling per-chart workspace management.

### Timeframe Selector Behavior

- Default quick selections show `1m`, `5m`, `15m`, plus a `More` dropdown.
- Selecting any timeframe from `More` swaps it into the third quick slot, and moves `15m` into the `More` list.
- Selecting `1m` or `5m` restores the default quick selections (`1m`, `5m`, `15m`) and returns the previously swapped timeframe back into `More`.
- If `15m` appears inside `More` (after a swap) and is selected, the quick selections revert to the default.
- Behavior is consistent in both split and non‑split modes since the header controls the active timeframe globally.
- Clicking the currently active timeframe (from the quick buttons or More dropdown) now leaves the chart state untouched so it does not trigger redundant reloads.

### Breakout Strategy (ORB) Settings Validation

- Saving ORB settings validates the Opening Candle time against the active timeframe to ensure a real candle boundary exists.
- Rules by timeframe:
  - `1m`: any minute is valid
  - `5m`/`15m`/`30m`: minute must be a multiple of 5/15/30 respectively (e.g., 0,5,10…)
  - `1h`: minute must be `0`
  - `4h`: hour must be one of `0,4,8,12,16,20` and minute must be `0`
  - `1d` and `1w`: hour must be `0` and minute must be `0`
- If the input is not aligned, an inline error appears: “Please choose an opening candle hour / minute which is multiple of <timeframe> …” and the settings are not saved.

### KLine Position & ORB TP/SL Labels

- Long and Short Position tools still render their risk/reward rectangles and handles, but the inline `SL xxx` / `TP xxx` price text inside those rectangles has been removed for a cleaner, less cluttered view. The external Stop/Target badges outside the rectangles remain unchanged.
- The ORB Enhanced breakout indicator keeps its colored TP/SL rectangles at the right edge of the chart, but no longer displays the white `TP xxx` / `SL xxx` text inside those boxes.

### Seamless Loading on Pair/Timeframe Change

- Changing the currency pair or timeframe now shows a centered loader (using the same icon and text styling as the AI News Analysis loader) with the message:
  - `Preparing Trading Chart`
  - `Please wait`
  - replacing the previous shimmer-based skeleton overlay.
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
