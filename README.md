# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Notes
- klinecharts v10 convention: `totalStep = number of user clicks + 1` for automatic finalization

## Drawing Tools
- Short Position: Entry click, then SL (above entry). TP auto at RR 1:1. Renders red (risk) and green (reward) zones with labels.
- Long Position: Entry click, then SL (below entry). TP auto at RR 1:1. Renders red (risk) and green (reward) zones with labels.

Usage: open the drawing tools dropdown or sidebar buttons, select the desired Position tool, click Entry, then click Stop. TP is placed automatically.
