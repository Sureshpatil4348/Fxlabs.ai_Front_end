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

## SuperTrend – Pro (KLineChart)

- Location: `Trading` → KLineChart (advanced widget). Toggle "Super Trend - Pro" in the indicator list, then click the gear icon near on-chart overlays to configure.
- Configurations:
  - ATR Period
  - ATR Multiplier
- Visuals:
  - SuperTrend line plotted on the price pane (uses configured ATR settings).
  - On-chart badges for BUY/SELL at trend flips.
  - Compact table (upper-right) with Trend (Bullish/Bearish) and Trend Bars (bars since last flip). Stacks below MA/BB tables when enabled.

