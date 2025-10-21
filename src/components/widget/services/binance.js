export class BinanceService {
  static BASE_URL = 'https://api.binance.com/api/v3';
  static WS_URL = 'wss://stream.binance.com:9443/ws';
  
  ws = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  reconnectDelay = 1000;

  /**
   * Fetch historical kline data from Binance REST API
   */
  async getHistoricalData(
    symbol = 'BTCUSDT',
    interval = '1m',
    limit = 500
  ) {
    try {
      const url = `${BinanceService.BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('Raw Binance API response:', data);
      console.log('First kline item:', data[0]);
      console.log('Data type:', typeof data[0]);
      console.log('Is array:', Array.isArray(data[0]));
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Binance API');
      }
      
      const candleData = data
        .map((kline) => {
          // Binance API returns arrays: [openTime, open, high, low, close, volume, ...]
          const openTime = kline[0];
          const open = kline[1];
          const high = kline[2];
          const low = kline[3];
          const close = kline[4];
          const volume = kline[5];

          const time = openTime / 1000; // Convert to seconds
          const openNum = parseFloat(open);
          const highNum = parseFloat(high);
          const lowNum = parseFloat(low);
          const closeNum = parseFloat(close);
          const volumeNum = parseFloat(volume);

          // Validate that all values are valid numbers
          if (isNaN(time) || isNaN(openNum) || isNaN(highNum) || isNaN(lowNum) || isNaN(closeNum) || isNaN(volumeNum)) {
            console.warn('Invalid kline data:', kline);
            console.warn('Parsed values:', { time, openNum, highNum, lowNum, closeNum, volumeNum });
            return null;
          }

          return {
            time,
            open: openNum,
            high: highNum,
            low: lowNum,
            close: closeNum,
            volume: volumeNum,
          };
        })
        .filter((candle) => candle !== null);

      // Ensure data is sorted by time (ascending order) and remove duplicates
      const sortedData = candleData.sort((a, b) => a.time - b.time);
      
      // Remove duplicate timestamps (keep the last one)
      const uniqueData = sortedData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.time === current.time);
        if (existingIndex >= 0) {
          acc[existingIndex] = current; // Replace with newer data
        } else {
          acc.push(current);
        }
        return acc;
      }, []);

      console.log('Processed candle data:', uniqueData.length, 'candles');
      console.log('First processed candle:', uniqueData[0]);
      
      return uniqueData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  /**
   * Connect to Binance WebSocket for real-time data
   */
  connectWebSocket(
    symbol = 'BTCUSDT',
    interval = '1m',
    onMessage,
    onError,
    onClose,
    onOpen
  ) {
    // Fix WebSocket URL format - use correct Binance stream format
    const wsUrl = `${BinanceService.WS_URL}/${symbol.toLowerCase()}@kline_${interval}`;
    
    console.log('🔌 Attempting to connect WebSocket:', wsUrl);
    console.log('🔌 Symbol:', symbol, 'Interval:', interval);
    console.log('🔌 Base WS URL:', BinanceService.WS_URL);
    
    try {
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully!', wsUrl);
        this.reconnectAttempts = 0;
        if (onOpen) {
          console.log('📡 Calling onOpen callback');
          onOpen();
        } else {
          console.warn('⚠️ No onOpen callback provided');
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.k && data.k.x) { // Only process closed klines
            const time = data.k.t / 1000; // Convert to seconds
            const open = parseFloat(data.k.o);
            const high = parseFloat(data.k.h);
            const low = parseFloat(data.k.l);
            const close = parseFloat(data.k.c);
            const volume = parseFloat(data.k.v);

            // Validate that all values are valid numbers
            if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume)) {
              console.warn('Invalid WebSocket kline data:', data.k);
              return;
            }

            const candleData = {
              time,
              open,
              high,
              low,
              close,
              volume,
            };
            
            onMessage(candleData);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('❌ WebSocket URL was:', wsUrl);
        console.error('❌ Error details:', error);
        if (onError) onError(error);
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        if (onClose) onClose(event);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.connectWebSocket(symbol, interval, onMessage, onError, onClose, onOpen);
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      if (onError) onError(error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get available symbols (for future use)
   */
  async getSymbols() {
    try {
      const response = await fetch(`${BinanceService.BASE_URL}/exchangeInfo`);
      const data = await response.json();
      return data.symbols
        .filter((symbol) => symbol.status === 'TRADING')
        .map((symbol) => symbol.symbol);
    } catch (error) {
      console.error('Error fetching symbols:', error);
      return [];
    }
  }
}

export const binanceService = new BinanceService();
