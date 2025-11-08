# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Features

### Advanced Chart Drawing Tools
- **Long Position Tool** 📉: Plan long trades with 2-click placement (Entry + SL below). TP auto-calculated for RR=1. Shows risk (red) and reward (green) zones with detailed metrics.
- **Short Position Tool** 📈: Plan short trades with 2-click placement (Entry + SL above). TP auto-calculated for RR=1. Shows risk (red) and reward (green) zones with detailed metrics.
  - Direction guard: Opposite-direction drawings are blocked. For Long, SL must be below Entry; for Short, SL must be above Entry. Invalid attempts show a small inline warning with a dark red badge and do not finalize.
- **Trend Lines**: Draw trend lines between two points
- **Fibonacci Tools**: Retracement levels and 3-point extensions
- **Support/Resistance**: Horizontal and vertical lines
- **Annotations**: Rectangle zones and text labels
- **Drawing Tool Restrictions**: All drawing tools are restricted to the main candle pane only. Drawing on below-chart indicator panes (RSI, MACD, etc.) is prevented for clarity and to avoid confusion.

## Notes
- klinecharts v10 convention: `totalStep = number of user clicks + 1` for automatic finalization
