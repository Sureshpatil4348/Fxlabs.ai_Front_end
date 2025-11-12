# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Features

### Advanced Chart Drawing Tools
- **Long Position Tool** 📉: Single-click placement at Entry. Draws risk (red) below and reward (green) above the click point, to the right. The entire overlay is draggable to move. Upper (reward) and lower (risk) rectangles are individually draggable up/down to adjust their heights. RR ratio and badges update live.
- **Short Position Tool** 📈: Single-click placement at Entry. Draws risk (red) above and reward (green) below the click point, to the right. The entire overlay is draggable to move. Upper (risk) and lower (reward) rectangles are individually draggable up/down to adjust their heights. RR ratio and badges update live.
  - Usability: Upper rectangle has a circular handle at its upper-left corner; lower rectangle has a circular handle at its lower-left corner. In addition to the existing right-middle width handle, there is now a matching left-middle width handle at the entry line, allowing horizontal resizing from either side.
  - Technical: Delete works via `visible=false` workaround for KLineChart bug where `removeOverlay()` fails after `points` updates (left-handle drag).
  - Note: Drag/hover and second-point click interactions are removed for these tools.
- **Trend Lines**: Draw trend lines between two points
- **Fibonacci Tools**: Retracement levels and 3-point extensions
- **Support/Resistance**: Horizontal and vertical lines
- **Annotations**: Rectangle zones and text labels
- **Drawing Tool Restrictions**: All drawing tools are restricted to the main candle pane only. Drawing on below-chart indicator panes (RSI, MACD, etc.) is prevented for clarity and to avoid confusion.
- **Quick Delete for Drawings**: All tools — including Long Position and Short Position — now show a small floating delete action when selected, consistent with other drawing tools.
- **Interactive Tooltips**: Hover tooltips show tool names on hover. On click, an instant non-intrusive toast notification appears with the selected tool name, auto-dismissing after 2 seconds.
- Fix: Delete remains functional after resizing a Long/Short Position using the left width handle.

### Indicators
- **MACD Pro**: Adds vertical histogram columns (green/red) anchored at the zero line for momentum visualization, alongside MACD and Signal lines.
- **Opening Range Breakout (ORB) Enhanced**: Advanced breakout strategy indicator with comprehensive visual feedback
  - **Opening Range Detection**: Considers the single closing candle at the configured time (default: 9:15); the range is that candle’s High/Low
  - **Breakout Signals**: 
    - Buy signals (▲ green triangle) when price breaks above opening high
    - Sell signals (▼ red triangle) when price breaks below opening low
  - **Risk Management**:
    - On the first breakout of the day only, a locked Long/Short position overlay is added automatically
    - Risk (red rectangle) equals the breakout candle’s height; Reward (green rectangle) equals Risk × RR (default 1:4)
    - Entry is the breakout candle’s close; SL/TP are derived from risk around entry
    - Overlays are locked (no drag or customization)
  - **Visual Elements**:
    - **Programmatic Position Overlay**: Locked Long/Short rectangles (red risk, green reward) anchored at breakout candle close; no full-width horizontal guide lines
    - **Entry Markers**: Triangle markers at breakout points with "ENTRY" labels
    - **TP Hit Markers**: Diamond shapes (◆) with "TP ✓" labels when take profit is reached
    - **SL Hit Markers**: X-cross marks with "SL ✗" labels when stop loss is triggered
    - **Price Labels**: Real-time TP and SL price labels at the right edge of the chart
  - **Configuration**: Adjustable start hour/minute, opening range period (kept), and Risk:Reward ratio
  - **Timeframe**: Works only for timeframe ≤ 1h; shows a warning if greater

## Notes
- klinecharts v10 convention: single-click overlays use `totalStep = 1` and finalize immediately

## KLineChart Loading & Error States
- Default behavior shows a loading spinner first when the dashboard opens or reloads (label: "Loading Trading Chart...").
- On successful initialization and first data apply, the chart renders and follows real-time.
- If initialization or first data update fails, the component exits the initial loading state and displays a clear error panel with a retry action.
- Error display is suppressed during the initial loading phase to prevent transient flicker.
- When embedded via `UnifiedChart` with `chartType === 'candlestick'`, the page-level loader is suppressed and the inner KLineChart spinner is used to avoid duplicate loaders.

## UI Fixes
- Sidebar (drawing tools) horizontal scrollbar removed. The left tools panel now enforces `overflow-x-hidden` to prevent unintended horizontal scrolling while preserving vertical scroll for long tool lists.
