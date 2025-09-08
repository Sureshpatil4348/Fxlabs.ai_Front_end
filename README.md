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
