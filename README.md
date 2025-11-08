# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Breakout Strategy (Opening Range) – KLineChart

- Location: `Trading` → KLineChart (advanced widget). Toggle "Breakout Strategy" in the indicator list, then click the gear icon near on-chart overlays to configure.
- Configurations:
  - Opening Candle Hour (0–23)
  - Opening Candle Minute (0–59)
  - Opening Range Period (bars)
  - Risk:Reward Ratio
- Visuals:
  - All OR/TP/SL lines render with width 1 for clarity.
  - TP/SL badges show live target values when a trade is active.
  - A compact table appears in the upper-right (like Bollinger Bands – Pro) with Range High/Low, Range Size, Trade Status, Entry, Target, Stop Loss, and Risk:Reward.
  - Indicator tables render only in fullscreen to reduce clutter in normal view.

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
- Behavior: On hover, a small text label appears at the upper-left of the indicator pane with quick actions.
- Contents:
  - Indicator name (RSI, ATR, or MACD)
  - Quick actions: Delete and Settings
- Notes:
  - Color pickers remain for RSI and ATR; MACD uses a default palette.
  - Default KLine legends are suppressed to keep panes clean and readable.

## Price Precision (5 Decimals)

- Prices across kline/candlestick charts and related UI now default to 5 decimal places.
- The advanced KLine chart enforces 5-decimal price precision internally; tooltips, price marks, and overlays follow this.
- Utility `formatPrice(value, precision = 5)` is used app‑wide for price display; prefer it over manual `toFixed`.
- Special cases (e.g., metals or JPY pairs) can still override precision where explicitly configured.
