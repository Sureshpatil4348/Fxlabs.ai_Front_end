# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Features

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

- The **Split** button in the KLine chart header is visible only in fullscreen mode (triggered via the upper-right fullscreen arrow)
- Click the **Split** button to enter split mode
- Click the **Unsplit** button to exit split mode and return to single chart view
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
- Drawing tools work independently on both charts
- Each chart maintains its own separate chart reference
- When a drawing tool is selected from the sidebar, it activates on BOTH charts simultaneously
- This ensures the cursor changes to the drawing tool cursor on both charts
- Click or drag on either chart to create the drawing on that specific chart
- Active chart tracking ensures drawings are created on the correct chart instance
- All drawing tools (trend lines, fibonacci, rectangles, positions, etc.) fully functional on both charts
- Each chart maintains its own independent set of drawings

### Seamless Loading on Pair/Timeframe Change

- Changing the currency pair or timeframe now shows the same loader overlay used on first page load: "Loading Trading Chart...".
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
