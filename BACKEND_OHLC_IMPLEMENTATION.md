# Backend OHLC Implementation Guide

## Overview

This document outlines the backend changes required to support the real-time trading widget with proper OHLC (Open, High, Low, Close) data. The current implementation only provides pricing data and ticks, but the widget needs historical and real-time OHLC candles for proper chart functionality.

## Current Issues

### ❌ What's Missing
- **OHLC REST Endpoint**: `/api/ohlc` returns 404 (doesn't exist)
- **OHLC WebSocket Messages**: No real-time OHLC updates
- **Historical Data**: No proper historical candle data
- **Time Series**: No chronological OHLC data

### ✅ What's Working
- **Pricing Data**: `/api/pricing` provides current bid/ask
- **Tick Data**: WebSocket sends real-time price ticks
- **WebSocket Connection**: Market v2 WebSocket is connected
- **Indicators**: Server-side indicator calculations

## Required Backend Changes

### 1. OHLC REST Endpoint

#### Endpoint: `GET /api/ohlc`

**Purpose**: Provide historical OHLC data for chart initialization

**Parameters**:
- `symbol` (string): Trading pair symbol (e.g., "USDCAD", "EURUSD")
- `timeframe` (string): Time interval ("1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w")
- `limit` (integer): Number of candles to return (default: 500, max: 1000)

**Example Request**:
```
GET /api/ohlc?symbol=USDCAD&timeframe=1h&limit=500
```

**Response Structure**:
```json
[
  {
    "time": 1640995200,
    "open": 1.26345,
    "high": 1.26450,
    "low": 1.26280,
    "close": 1.26420,
    "volume": 1250.75
  },
  {
    "time": 1640998800,
    "open": 1.26420,
    "high": 1.26510,
    "low": 1.26390,
    "close": 1.26480,
    "volume": 1180.25
  }
]
```

**Field Descriptions**:
- `time`: Unix timestamp (seconds) of candle start time
- `open`: Opening price of the period
- `high`: Highest price during the period
- `low`: Lowest price during the period
- `close`: Closing price of the period
- `volume`: Trading volume (optional, can be 0 if not available)

### 2. OHLC WebSocket Messages

#### Message Type: `ohlc_update`

**Purpose**: Send real-time OHLC updates when new candles are formed

**Message Structure**:
```json
{
  "type": "ohlc_update",
  "symbol": "USDCAD",
  "timeframe": "1h",
  "time": 1640995200,
  "open": 1.26345,
  "high": 1.26450,
  "low": 1.26280,
  "close": 1.26420,
  "volume": 1250.75
}
```

**When to Send**:
- When a new candle is formed (timeframe period completes)
- When the current candle is updated (new tick affects OHLC)
- On subscription to a new symbol/timeframe

### 3. Enhanced WebSocket Connection Message

**Current Connection Message**:
```json
{
  "type": "connected",
  "message": "WebSocket connected successfully",
  "supported_timeframes": ["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"],
  "supported_data_types": ["ticks", "indicators"],
  "supported_price_bases": ["last", "bid", "ask"]
}
```

**Updated Connection Message**:
```json
{
  "type": "connected",
  "message": "WebSocket connected successfully",
  "supported_timeframes": ["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"],
  "supported_data_types": ["ticks", "indicators", "ohlc"],
  "supported_price_bases": ["last", "bid", "ask"],
  "ohlc_supported": true
}
```

### 4. Subscription System

#### Subscribe to OHLC Updates

**Client Request**:
```json
{
  "type": "subscribe",
  "data_type": "ohlc",
  "symbol": "USDCAD",
  "timeframe": "1h"
}
```

**Server Response**:
```json
{
  "type": "subscribed",
  "data_type": "ohlc",
  "symbol": "USDCAD",
  "timeframe": "1h",
  "message": "Successfully subscribed to OHLC updates"
}
```

## Implementation Details

### 1. OHLC Data Aggregation

**From Ticks to OHLC**:
```python
class OHLCAggregator:
    def __init__(self, timeframe_seconds):
        self.timeframe_seconds = timeframe_seconds
        self.current_candles = {}  # symbol -> current candle data
    
    def add_tick(self, symbol, tick_data):
        """
        Add tick data and update current candle
        tick_data: {
            "price": 1.26345,
            "volume": 100.0,
            "timestamp": 1640995200
        }
        """
        # Get current candle for symbol
        current_candle = self.get_or_create_candle(symbol, tick_data["timestamp"])
        
        # Update OHLC values
        if current_candle["open"] is None:
            current_candle["open"] = tick_data["price"]
        
        current_candle["high"] = max(current_candle["high"], tick_data["price"])
        current_candle["low"] = min(current_candle["low"], tick_data["price"])
        current_candle["close"] = tick_data["price"]
        current_candle["volume"] += tick_data["volume"]
        
        # Check if candle is complete
        if self.is_candle_complete(current_candle, tick_data["timestamp"]):
            self.finalize_candle(symbol, current_candle)
            self.start_new_candle(symbol, tick_data["timestamp"])
```

### 2. Timeframe Mapping

**Timeframe to Seconds**:
```python
TIMEFRAME_MAPPING = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
    "1w": 604800
}
```

### 3. Database Schema (Optional)

**OHLC Table Structure**:
```sql
CREATE TABLE ohlc_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    timeframe VARCHAR(5) NOT NULL,
    timestamp BIGINT NOT NULL,
    open DECIMAL(10,5) NOT NULL,
    high DECIMAL(10,5) NOT NULL,
    low DECIMAL(10,5) NOT NULL,
    close DECIMAL(10,5) NOT NULL,
    volume DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, timeframe, timestamp)
);
```

## API Endpoints Summary

### REST Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/ohlc` | GET | Historical OHLC data | Array of OHLC objects |
| `/api/pricing` | GET | Current prices | Pricing data (existing) |
| `/api/indicator` | GET | Indicator data | Indicator data (existing) |

### WebSocket Messages

| Message Type | Direction | Purpose |
|--------------|-----------|---------|
| `connected` | Server → Client | Connection established |
| `subscribe` | Client → Server | Subscribe to data |
| `subscribed` | Server → Client | Subscription confirmed |
| `ohlc_update` | Server → Client | Real-time OHLC update |
| `ticks` | Server → Client | Real-time tick data (existing) |
| `indicator_update` | Server → Client | Indicator updates (existing) |

## Error Handling

### REST API Errors

**404 - Symbol Not Found**:
```json
{
  "error": "Symbol not found",
  "message": "Symbol USDCAD not supported",
  "code": 404
}
```

**400 - Invalid Parameters**:
```json
{
  "error": "Invalid parameters",
  "message": "Invalid timeframe: 2h. Supported: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w",
  "code": 400
}
```

### WebSocket Errors

**Subscription Error**:
```json
{
  "type": "error",
  "message": "Failed to subscribe to OHLC updates",
  "error": "Symbol not supported",
  "code": "SUBSCRIPTION_FAILED"
}
```

## Testing

### Test OHLC Endpoint

```bash
# Test historical data
curl "https://api.fxlabsprime.com/api/ohlc?symbol=USDCAD&timeframe=1h&limit=10"

# Expected response: Array of 10 OHLC objects
```

### Test WebSocket OHLC Updates

```javascript
// WebSocket test
const ws = new WebSocket('wss://api.fxlabsprime.com/market-v2');

ws.onopen = () => {
  // Subscribe to OHLC updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    data_type: 'ohlc',
    symbol: 'USDCAD',
    timeframe: '1h'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'ohlc_update') {
    console.log('OHLC Update:', data);
  }
};
```

## Implementation Priority

### Phase 1 (Critical)
1. ✅ Add `/api/ohlc` REST endpoint
2. ✅ Implement OHLC data aggregation from ticks
3. ✅ Add `ohlc_update` WebSocket messages
4. ✅ Update connection message to include OHLC support

### Phase 2 (Enhancement)
1. ✅ Add subscription management for OHLC
2. ✅ Implement OHLC data caching
3. ✅ Add error handling and validation
4. ✅ Performance optimization

### Phase 3 (Advanced)
1. ✅ Add OHLC data persistence
2. ✅ Implement data compression
3. ✅ Add rate limiting
4. ✅ Monitoring and analytics

## Expected Results

After implementing these changes:

### ✅ Frontend Benefits
- **Proper Chart Display**: Continuous time series candlesticks
- **Real-time Updates**: Live OHLC candle updates
- **Historical Data**: Proper historical chart data
- **Better Performance**: Optimized data flow

### ✅ User Experience
- **Professional Charts**: TradingView-quality candlestick charts
- **Real-time Data**: Live market data updates
- **Accurate Visualization**: Proper price action representation
- **Smooth Interaction**: Responsive chart interactions

## Conclusion

This implementation will transform the widget from a synthetic data display to a professional trading tool with real market data. The key is implementing proper OHLC aggregation from tick data and providing both historical and real-time OHLC updates through REST API and WebSocket respectively.

**Next Steps**:
1. Implement the `/api/ohlc` endpoint
2. Add OHLC aggregation logic
3. Implement WebSocket OHLC updates
4. Test with the frontend widget
5. Deploy and monitor performance
