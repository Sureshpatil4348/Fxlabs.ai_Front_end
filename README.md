# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## UI Fixes

- KLineChart Fullscreen: Fixed the Indicators dropdown not opening/clicking in fullscreen by raising its portal z-index above the fullscreen overlay. The dropdown is now always visible and interactive when fullscreen is enabled.
 - KLineChart Below-Panes (RSI/ATR/MACD): Fixed pane-ordering so tables are bound to the correct panes regardless of enable order (e.g., ATR first then RSI). Overlays now compute offsets from the bottom (last-created pane sits at the bottom), aligned with our deterministic creation order (RSI → ATR → MACD).

## Trend Strategy (EMA Touch) – Entry Line

- Location: `Trading` → KLineChart (advanced widget). Toggle "Trend Strategy" in the indicator list.
- Visuals:
  - Now shows a blue Entry line in addition to existing green Take Profit lines (TP1–TP3) and red Stop Loss line.
  - Entry line reflects the signal bar close and extends forward for the configured horizon.
  - Mirrors the reference Pine behavior: entry (blue), SL (red), targets (green).

## Breakout Strategy (Opening Range) – KLineChart

- Location: `Trading` → KLineChart (advanced widget). Toggle "Breakout Strategy" in the indicator list, then click the gear icon near on-chart overlays to configure.
- Configurations:
  - Opening Candle Hour (0–23)
  - Opening Candle Minute (0–59)
  - Opening Range Period (bars)
  - Risk:Reward Ratio
- Logic (aligned with Pine v6):
  - Detect new trading day and reset state.
  - Opening range starts at `Opening Candle` time (hour/minute). Range is captured across `Opening Range Period (bars)` starting at the first opening candle.
  - Breakout entries:
    - BUY when `close > Opening High` and previous close `<= Opening High` (one buy trade per day).
    - SELL when `close < Opening Low` and previous close `>= Opening Low` (one sell trade per day).
  - Targets & risk:
    - Range size = `Opening High - Opening Low`.
    - BUY: `TP = Opening High + Range * RR`, `SL = Opening Low`.
    - SELL: `TP = Opening Low - Range * RR`, `SL = Opening High`.
  - TP/SL hit tracking (post‑entry):
    - BUY: TP if `high >= TP`, SL if `low <= SL` (both can register on same bar).
    - SELL: TP if `low <= TP`, SL if `high >= SL`.
    - Hit markers are plotted on‑chart as text badges (★ for TP, ✖ for SL).
  - Timeframe advisory: Warns when timeframe > 60 minutes.

- Implementation details:
  - Fixed timestamp handling to correctly parse both seconds and milliseconds across data feeds, ensuring opening time detection matches the Pine behavior.
  - Added entry badges (BUY ▲ / SELL ▼), TP/SL level badges at entry, and distinct TP/SL HIT markers when reached.
  - Top‑right table now includes a timeframe row (✓/⚠), enhanced trade status (ACTIVE / TP HIT / SL HIT), and shows Entry/TP/SL/Range consistently.

- Visuals:
  - OR High/Low, TP, SL plotted as lines on the price pane.
  - Entry/TP/SL/HIT markers are minimal text overlays for clarity.
  - The compact ORB table appears at top‑right (fullscreen only) and stacks below other tables if enabled.

## SuperTrend – Pro (KLineChart)

- Location: `Trading` → KLineChart (advanced widget). Toggle "Super Trend - Pro" in the indicator list, then click the gear icon near on-chart overlays to configure.
- Configurations:
  - ATR Period
  - ATR Multiplier
- Visuals:
  - SuperTrend line plotted on the price pane (uses configured ATR settings).
  - On-chart badges for BUY/SELL at trend flips.
  - Compact table (upper-right) with Trend (Bullish/Bearish) and Trend Bars (bars since last flip). Stacks below MA/BB tables when enabled. Visible only in fullscreen.

## Support/Resistance – Pro (KLineChart)

- Location: `Trading` → KLineChart. Toggle "Support Resitance - Pro" in the indicator list.
- Configuration: No popup configure button (removed by design). Uses sensible defaults (Left/Right Bars = 15).
- Visuals:
  - Dynamic Support/Resistance levels (solid lines) with subtle zone boundaries (dashed).

## MACD – Pro (KLineChart)

- Location: `Trading` → KLineChart. Toggle "MACD - Pro" in the indicator list, then click the gear icon on the MACD pane to configure.
- Configurations:
  - Fast Length
  - Slow Length
  - Signal Length
  - Source (Close/Open/High/Low/HL2/HLC3/OHLC4)
- Visuals:
  - MACD and Signal lines with a zero reference line.
  - 4-tone histogram coloring (Strong Bullish/Weak Bullish/Weak Bearish/Strong Bearish).
  - Buy/Sell arrows on MACD crossovers.
  - Compact table (upper-right of the MACD pane) with Trend (Bullish/Bearish) and Momentum state (Strong Bullish/Weakening/Strong Bearish/Recovering). Visible only in fullscreen.
  - On-chart badges for BREAK events:
    - BREAK (green) when resistance is broken with high volume.
    - BREAK (red) when support is broken with high volume.
    - Bull Wick / Bear Wick labels for wick-based break detections.
  - Badges are limited to the most recent signals for clarity.

## Indicator Labels (Below Panes)

- Location: Below-chart indicator panes (RSI, ATR, MACD) in the KLine chart widget.
- Behavior: On hover, a small text label appears at the upper-left of the indicator pane with quick actions. Positioned at top: -20px and left: 8px for a precise, readable placement. The hover region is extended ~32px above the pane so the label remains interactive even when slightly above the pane. The panel has no card/border/background; only text and icons are shown directly over the chart.
- Contents:
  - Indicator name (RSI, ATR, or MACD)
  - Quick actions: Delete and Settings
- Notes:
  - Color pickers remain for RSI and ATR; MACD uses a default palette.
  - Default KLine legends are suppressed to keep panes clean and readable.
  - On-chart indicator labels and drawing tool panels follow the same no‑card style (no border/background); only text and icons overlay the chart.

## On‑Chart Overlay Actions

- Overlays on the main price pane (Trend Strategy, Bollinger Bands – Pro, Moving Average – Pro, Breakout Strategy, Super Trend – Pro) now display both a gear (Configure) and a trash (Delete) icon when you hover the chart.
- Clicking the gear opens the corresponding settings modal. Support Resitance - Pro intentionally has no configuration and thus only shows Delete.

## KLineChart Action Panel Order

- All drawing tool and indicator action panels now strictly follow: Color, Configure, Delete.
- No actions were added or removed — only ordering was adjusted to be consistent and predictable.

## Price Precision (5 Decimals)

- Prices across kline/candlestick charts and related UI now default to 5 decimal places.
- The advanced KLine chart enforces 5-decimal price precision internally; tooltips, price marks, and overlays follow this.
- Utility `formatPrice(value, precision = 5)` is used app‑wide for price display; prefer it over manual `toFixed`.
- Special cases (e.g., metals or JPY pairs) can still override precision where explicitly configured.
