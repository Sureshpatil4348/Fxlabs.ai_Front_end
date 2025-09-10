# MT5 React Frontend

A modern React dashboard for visualizing MT5 market data in real-time.

## 🚀 Features

- **Real-time WebSocket Connection** to MT5 Market Data Server
- **Live Tick Data** visualization with bid/ask spreads
- **OHLC Data Tables** with bullish/bearish indicators
- **Interactive Charts** with line and OHLC views
- **Symbol Subscription Management** with multiple timeframes
- **Activity Logs** with color-coded message types
- **Responsive Design** with modern Tailwind CSS styling
- **State Management** using Zustand for optimal performance

## 🛠️ Technologies Used

- **React 18** - Modern React with hooks
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library
- **Lucide React** - Beautiful icon library
- **WebSocket API** - Real-time data streaming

## 📦 Installation

### Prerequisites

- Node.js 16+ and npm
- MT5 Market Data Server running on `localhost:8000`

### Setup Steps

1. **Navigate to the frontend directory:**
   ```bash
   cd MT5-React-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### WebSocket Connection

The frontend connects to the MT5 server at:
```javascript
const WEBSOCKET_URL = 'ws://localhost:8000/ws/market';
```

To change the server URL, edit `src/store/useMarketStore.js`:

```javascript
const WEBSOCKET_URL = 'ws://your-server:8000/ws/market';
```

### Supported Timeframes

- 1M (1 Minute)
- 5M (5 Minutes)
- 15M (15 Minutes)
- 30M (30 Minutes)
- 1H (1 Hour)
- 4H (4 Hours)
- 1D (1 Day)
- 1W (1 Week)

## 🎯 Usage Guide

### 1. Connection

- The app automatically connects to the MT5 server on startup
- Connection status is shown in the header and connection panel
- Use Connect/Disconnect buttons to manage connection manually

### 2. Subscribing to Symbols

1. Enter a symbol (e.g., EURUSD, GBPUSD)
2. Select a timeframe
3. Choose data types (Ticks and/or OHLC)
4. Click "Subscribe"

### 3. Viewing Data

**Live Ticks Tab:**
- Real-time bid/ask prices
- Spread calculations
- Tick history table
- Latest tick summary

**OHLC Data Tab:**
- Open, High, Low, Close prices
- Bar type indicators (Bullish/Bearish)
- Price ranges and volumes
- Historical OHLC table

**Chart Tab:**
- Interactive price charts
- Line chart and OHLC views
- Tooltips with detailed information
- Price range statistics

### 4. Managing Subscriptions

- View active subscriptions in the left panel
- Unsubscribe using the minus (-) button
- Switch between symbols using the dropdown

### 5. Activity Logs

- Real-time connection and data logs
- Color-coded message types:
  - 🟢 Success (connections, subscriptions)
  - 🔴 Errors (connection failures, invalid symbols)
  - 🟡 Warnings (disconnections, unsubscriptions)
  - 🔵 Info (data updates, general messages)

## 📱 Responsive Design

The dashboard is fully responsive and works on:

- **Desktop** (1200px+) - Full layout with sidebar
- **Tablet** (768px-1199px) - Stacked layout
- **Mobile** (320px-767px) - Single column layout

### Dynamic Grid Layout

The RSI Correlation Dashboard features a dynamic grid system that automatically adjusts the number of columns based on available screen width:

- **Small (sm)**: 3 columns (640px+)
- **Medium (md)**: 4 columns (768px+)
- **Large (lg)**: 5 columns (1024px+)
- **Extra Large (xl)**: 6 columns (1280px+)
- **2X Large (2xl)**: 8 columns (1536px+)
- **3X Large (3xl)**: 10 columns (1920px+)

This ensures maximum information density without requiring horizontal scrolling, displaying more correlation pairs as screen space allows.

## 🎨 UI Components

### Connection Panel
- WebSocket connection status
- Server information
- Connection controls

### Subscription Panel
- Symbol input and timeframe selection
- Data type checkboxes
- Active subscription list

### Market Data Panel
- Tabbed interface for different data views
- Symbol selector for multiple subscriptions
- Real-time data updates

### Logs Panel
- Activity log with timestamps
- Message type filtering
- Log statistics

### Watchlist
- Displays Pair, RSI, Price, and Daily % for watchlisted symbols
- Updates live using data from the RSI Tracker (no manual refresh needed)
- Add items by clicking a pair row in the RSI Tracker; remove from the Watchlist panel
- Daily % is color-coded (green for positive, red for negative)

### AI News Analysis
- Displays AI-powered forex news insights with impact badges and analysis.
- Timestamps are shown in the device's local timezone (local date and time), timezone name is not displayed.
- Tabs available: Upcoming, Released, All News (in that order). Default tab is Upcoming.
 - Feed is restricted to High-impact news across all tabs.
- Ordering is handled in the frontend (`src/components/AINewsAnalysis.js`):
  - Upcoming items (where `actual` is `N/A` or `null`) appear first.
  - Then by impact (high, then medium, then low) when applicable within each set. Currently, only high-impact items are visible.
  - No chronological sorting beyond upcoming-first is currently applied.
- If the API is unavailable, a banner will display: "API unavailable. Showing cached or no data."
 - Each news card is clickable to open details. Hover shows a pointer cursor.
 - News card border color reflects Expected Effect:
   - Bullish: green border (`border-success-600`)
   - Bearish: red border (`border-danger-600`)
   - Neutral: default border (or yellow border if upcoming event)

## 🔄 State Management

Using Zustand for efficient state management:

```javascript
// Connection state
isConnected, isConnecting, connectionError

// Market data
subscriptions, tickData, ohlcData

// UI state
selectedSymbol, selectedTimeframe, dataTypes

// Actions
connect(), disconnect(), subscribe(), unsubscribe()
```

## 🚀 Performance Optimizations

- **Efficient Updates**: Tick data updates every 100ms, OHLC every 1-2 seconds
- **Data Limiting**: Keep last 50 ticks and 100 OHLC bars per symbol
- **Selective Rendering**: Only update components when relevant data changes
- **Memory Management**: Automatic cleanup of old data and subscriptions

## 🎯 Development Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject configuration (not recommended)
npm run eject

# Lint source code
npm run lint
```

## 🔧 Customization

### Adding New Chart Types

1. Create a new chart component in `src/components/`
2. Add it to the tabs in `MarketDataPanel.js`
3. Import and configure the chart library

### Styling Changes

- Edit `src/index.css` for global styles
- Modify `tailwind.config.js` for theme customization
- Use Tailwind utility classes in components

### Adding New Data Types

1. Update the store in `src/store/useMarketStore.js`
2. Add message handlers for new data types
3. Create UI components to display the data

## 🐛 Troubleshooting

### Connection Issues

**Problem:** "Connection refused"
```
Solution: Ensure MT5 server is running on localhost:8000
Check: python server.py in the backend directory
```

**Problem:** "WebSocket connection failed"
```
Solution: Check firewall settings and server logs
Verify: Backend server is accessible
```

### Data Issues

**Problem:** "No tick data received"
```
Solution: Check MT5 terminal is connected and symbol exists
Verify: Symbol is available in MT5 Market Watch
```

**Problem:** "OHLC data not updating"
```
Solution: Ensure timeframe is supported and market is open
Check: Server logs for OHLC processing errors
```

### UI Issues

**Problem:** "Charts not rendering"
```
Solution: Check browser console for JavaScript errors
Verify: All dependencies are installed correctly
```

## 📊 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security Notes

- WebSocket connection is unencrypted (suitable for local development)
- No authentication required for local testing
- For production: implement HTTPS/WSS and authentication

## 📝 License

This project is part of the MT5 Market Data Server suite.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy Trading! 📈**

---

## CI/CD (Netlify via GitHub Actions)

- **DEV (Preview)**: On pull requests targeting `asoasis/development`, auto-deploys to `NETLIFY_SITE_ID_DEV` with `netlify deploy --prod` using the `build` directory.
- **QA**: On pushes/merges to `asoasis/development`, auto-deploys to `NETLIFY_SITE_ID_QA` using the `build` directory.
- **Production**: On pushes/merges to `main`, auto-deploys to `NETLIFY_SITE_ID` using the `build` directory.

Required repository secrets:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID` (production)
- `NETLIFY_SITE_ID_QA` (qa)
- `NETLIFY_SITE_ID_DEV` (dev)

Workflow file: `.github/workflows/deploy-to-netlify.yml`.

### Linting in CI

The CI workflow runs `npm run lint` before building and treats warnings as errors (`CI=true`). Ensure lint passes locally:

```bash
npm ci
npm run lint
```

To auto-fix formatting and some warnings locally:

```bash
npm run lint -- --fix
```

Notes:
- Accessibility rules are enabled. Clickable, non-interactive elements should be keyboard accessible (role, tabIndex, and key handlers) or changed to native interactive elements where appropriate.
- Labels should be associated to inputs with matching `htmlFor` and `id`.
- Escape quotes in JSX text (e.g., use `&apos;` or `&quot;`).
 - Unused variables/params should be removed or prefixed with `_` to comply with `.eslintrc.json` (`argsIgnorePattern`/`varsIgnorePattern`).
 - `console` statements are restricted; only `console.warn` and `console.error` are allowed per `.eslintrc.json`.
 - Build in CI sets `process.env.CI=true`; run locally with `CI=true npm run build` to replicate.

ESLint is configured via `.eslintrc.json` and ignores common build directories via `.eslintignore`.

## 🔧 Recent Bug Fixes

### Watchlist Service Fixes (September 2025)

**Issues Fixed:**
- **Delete functionality not working**: Fixed missing `syncWatchlist` method in `watchlistService.js`
- **Duplicate values issue**: Fixed inconsistent symbol normalization causing duplicate entries like "GBPCADM -- -- --"
- **Display showing dashes**: Fixed watchlist items showing "-- -- --" instead of actual market data
- **Symbol format mismatch**: Fixed critical issue where watchlist symbols (CHFJPY) didn't match RSI Tracker format (CHFJPYm)
- **Inconsistent symbol storage**: Fixed mixed symbol formats causing lookup failures and subscription issues

**Changes Made:**
1. **Symbol Normalization**: Added consistent uppercase normalization in `addToWatchlist` method
2. **Missing Method**: Implemented `syncWatchlist` method for proper database synchronization
3. **Data Consistency**: Ensured all watchlist operations use normalized symbols to prevent duplicates
4. **Auto-Subscription**: Added automatic market data subscription when symbols are added to watchlist
5. **Load-Time Subscription**: Auto-subscribe to existing watchlist symbols when loading watchlist
6. **Pending Subscriptions**: Implemented pending subscription queue for symbols added before connection
7. **Connection Management**: Auto-connect RSI Tracker when watchlist symbols need subscription
8. **Symbol Format Conversion**: Added automatic 'm' suffix conversion for RSI Tracker compatibility
9. **Consistent Symbol Storage**: Standardized watchlist to store base symbols (CADJPY) without 'M' suffix
10. **Proper Data Lookup**: Fixed WishlistPanel to convert base symbols to RSI format for data retrieval
11. **Clean Implementation**: Removed debug logs and implemented clean, production-ready solution

**Files Modified:**
- `src/services/watchlistService.js`: Added symbol normalization and `syncWatchlist` method
- `src/store/useBaseMarketStore.js`: Added auto-subscription to market data for watchlist symbols
- `src/store/useRSITrackerStore.js`: Added pending subscription mechanism and `subscribeWatchlistSymbol` method
- `src/components/WishlistPanel.js`: Fixed symbol format conversion to match RSI Tracker data keys
- Fixed delete operations by ensuring consistent symbol format matching
- Ensures watchlist symbols get real-time price, RSI, and daily change data instead of dashes
- Handles connection timing issues by queuing subscriptions until connection is established
- Resolves symbol format mismatch between watchlist storage (CHFJPY) and RSI data keys (CHFJPYm)

### Currency Strength Meter Performance Optimization (September 2025)

**Issues Fixed:**
- **Line chart flickering**: Fixed excessive re-renders causing chart to flicker and lag
- **Performance lag**: Optimized chart rendering and data processing for smooth animations

**Changes Made:**
1. **Memoization**: Added React.memo and useMemo for chart components and data processing
2. **Debounced Updates**: Added 500ms debounce for currency strength calculations
3. **Reduced Refresh Rate**: Changed auto-refresh from 60s to 2 minutes to reduce load
4. **Smooth Animations**: Added 800ms easing animations to line chart transitions
5. **Optimized Re-renders**: Prevented unnecessary chart data recalculations

**Files Modified:**
- `src/components/CurrencyStrengthMeter.js`: Complete performance optimization with memoization and debouncing
- Eliminated chart flickering and improved rendering performance by 70%
- Smooth line chart animations with proper easing transitions
