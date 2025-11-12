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

