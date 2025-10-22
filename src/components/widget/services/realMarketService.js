// src/components/widget/services/realMarketService.js

export class RealMarketService {
    static BASE_URL = 'https://api.fxlabsprime.com';
    static WS_URL = 'wss://api.fxlabsprime.com/market-v2';
    
    ws = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 1000;
  
    /**
     * Fetch historical OHLC data from your real market data API
     * Uses the new OHLC endpoint with pagination support
     */
    async getHistoricalData(
      symbol = 'EURUSD',
      interval = '1m',
      limit = 500
    ) {
      try {
        console.log('🔍 RealMarketService: Starting getHistoricalData with new OHLC API');
        console.log('📊 Parameters:', { symbol, interval, limit });
        
        // Convert symbol format for your API (add 'm' suffix if not present)
        const apiSymbol = symbol.endsWith('m') ? symbol : symbol + 'm';
        console.log('🔄 Converted symbol:', apiSymbol);
        
        // Convert interval to API format (1m -> 1M, 5m -> 5M, etc.)
        const apiTimeframe = this.convertIntervalToTimeframe(interval);
        console.log('🔄 Converted timeframe:', apiTimeframe);
        
        // Calculate per_page (max 1000 per API spec)
        const perPage = Math.min(limit, 1000);
        
        // Build the new OHLC API URL
        const url = `${RealMarketService.BASE_URL}/api/ohlc?symbol=${apiSymbol}&timeframe=${apiTimeframe}&page=1&per_page=${perPage}`;
        console.log('🌐 API URL:', url);
        
        console.log('📡 Making API request...');
        const response = await fetch(url);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        console.log('📥 Parsing JSON response...');
        const data = await response.json();
        
        console.log('📊 Raw OHLC API response:', data);
        console.log('📊 Response structure:', {
          symbol: data.symbol,
          timeframe: data.timeframe,
          page: data.page,
          per_page: data.per_page,
          count: data.count,
          barsCount: data.bars?.length
        });
        
        // Validate response format
        if (!data || !data.bars || !Array.isArray(data.bars)) {
          console.error('❌ Invalid response format - no bars array:', data);
          throw new Error('Invalid response format from OHLC API');
        }
        
        if (data.bars.length === 0) {
          console.warn('⚠️ No bars returned from API');
          return [];
        }
        
        console.log('📊 Processing', data.bars.length, 'bars');
        console.log('📊 First bar:', data.bars[0]);
        console.log('📊 Last bar:', data.bars[data.bars.length - 1]);
        
        // Transform bars to candle format
        // The API returns bars in ascending time order within the page
        const candles = data.bars.map(bar => ({
          time: Math.floor(bar.time / 1000), // Convert milliseconds to seconds
          open: parseFloat(bar.open),
          high: parseFloat(bar.high),
          low: parseFloat(bar.low),
          close: parseFloat(bar.close),
          volume: parseFloat(bar.volume || 0),
          tick_volume: parseFloat(bar.tick_volume || 0),
          spread: parseFloat(bar.spread || 0),
          is_closed: bar.is_closed || false,
          // Store additional bid/ask data if needed
          openBid: parseFloat(bar.openBid || bar.open),
          highBid: parseFloat(bar.highBid || bar.high),
          lowBid: parseFloat(bar.lowBid || bar.low),
          closeBid: parseFloat(bar.closeBid || bar.close),
          openAsk: parseFloat(bar.openAsk || bar.open),
          highAsk: parseFloat(bar.highAsk || bar.high),
          lowAsk: parseFloat(bar.lowAsk || bar.low),
          closeAsk: parseFloat(bar.closeAsk || bar.close)
        }));
        
        console.log('✅ Transformed candles:', candles.length);
        console.log('📊 First candle:', candles[0]);
        console.log('📊 Last candle:', candles[candles.length - 1]);
        
        // Validate candle data
        const validCandles = candles.filter(candle => 
          !isNaN(candle.time) && 
          !isNaN(candle.open) && 
          !isNaN(candle.high) && 
          !isNaN(candle.low) && 
          !isNaN(candle.close) &&
          candle.time > 0 &&
          candle.high >= candle.low &&
          candle.high >= candle.open &&
          candle.high >= candle.close &&
          candle.low <= candle.open &&
          candle.low <= candle.close
        );
        
        if (validCandles.length < candles.length) {
          console.warn(`⚠️ Filtered out ${candles.length - validCandles.length} invalid candles`);
        }
        
        console.log('✅ Returning', validCandles.length, 'valid candles');
        return validCandles;
        
      } catch (error) {
        console.error('❌ Error fetching OHLC data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        throw error;
      }
  }
  
  /**
   * Fetch historical OHLC data with pagination support
   * @param {string} symbol - Trading symbol (e.g., 'EURUSD')
   * @param {string} interval - Timeframe (e.g., '1m', '5m', '1h')
   * @param {number} page - Page number (1-based)
   * @param {number} perPage - Items per page (max 1000)
   * @returns {Promise<{candles: Array, hasMore: boolean}>}
   */
  async getHistoricalDataWithPage(
    symbol = 'EURUSD',
    interval = '1m',
    page = 1,
    perPage = 500
  ) {
    try {
      console.log('🔍 RealMarketService: getHistoricalDataWithPage', { symbol, interval, page, perPage });
      
      // Convert symbol format for your API (add 'm' suffix if not present)
      const apiSymbol = symbol.endsWith('m') ? symbol : symbol + 'm';
      
      // Convert interval to API format (1m -> 1M, 5m -> 5M, etc.)
      const apiTimeframe = this.convertIntervalToTimeframe(interval);
      
      // Calculate per_page (max 1000 per API spec)
      const actualPerPage = Math.min(perPage, 1000);
      
      // Build the OHLC API URL with pagination
      const url = `${RealMarketService.BASE_URL}/api/ohlc?symbol=${apiSymbol}&timeframe=${apiTimeframe}&page=${page}&per_page=${actualPerPage}`;
      console.log('🌐 API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('📊 OHLC API response (page ' + page + '):', {
        symbol: data.symbol,
        timeframe: data.timeframe,
        page: data.page,
        per_page: data.per_page,
        count: data.count,
        barsCount: data.bars?.length
      });
      
      // Validate response format
      if (!data || !data.bars || !Array.isArray(data.bars)) {
        console.error('❌ Invalid response format - no bars array:', data);
        throw new Error('Invalid response format from OHLC API');
      }
      
      // Transform bars to candle format
      const candles = data.bars.map(bar => ({
        time: Math.floor(bar.time / 1000), // Convert milliseconds to seconds
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: parseFloat(bar.volume || 0),
        tick_volume: parseFloat(bar.tick_volume || 0),
        spread: parseFloat(bar.spread || 0),
        is_closed: bar.is_closed || false,
        openBid: parseFloat(bar.openBid || bar.open),
        highBid: parseFloat(bar.highBid || bar.high),
        lowBid: parseFloat(bar.lowBid || bar.low),
        closeBid: parseFloat(bar.closeBid || bar.close),
        openAsk: parseFloat(bar.openAsk || bar.open),
        highAsk: parseFloat(bar.highAsk || bar.high),
        lowAsk: parseFloat(bar.lowAsk || bar.low),
        closeAsk: parseFloat(bar.closeAsk || bar.close)
      }));
      
      // Validate candle data
      const validCandles = candles.filter(candle => 
        !isNaN(candle.time) && 
        !isNaN(candle.open) && 
        !isNaN(candle.high) && 
        !isNaN(candle.low) && 
        !isNaN(candle.close) &&
        candle.time > 0 &&
        candle.high >= candle.low &&
        candle.high >= candle.open &&
        candle.high >= candle.close &&
        candle.low <= candle.open &&
        candle.low <= candle.close
      );
      
      if (validCandles.length < candles.length) {
        console.warn(`⚠️ Filtered out ${candles.length - validCandles.length} invalid candles`);
      }
      
      // Determine if there are more pages
      // First check if API provides explicit hasMore/hasNext flag
      let hasMore;
      if (typeof data.hasMore === 'boolean') {
        hasMore = data.hasMore;
      } else if (typeof data.hasNext === 'boolean') {
        hasMore = data.hasNext;
      } else if (typeof data.count === 'number') {
        // 'count' is the number of records in this page, not total
        // If count < per_page, we've reached the last page
        hasMore = data.count >= actualPerPage;
      } else {
        // Fallback: check if we received a full page of data
        hasMore = validCandles.length >= actualPerPage;
      }
      
      console.log('✅ Returning page', page, ':', validCandles.length, 'candles, hasMore:', hasMore, 
        data.count !== undefined ? `(pageCount: ${data.count})` : '');
      
      return {
        candles: validCandles,
        hasMore: hasMore
      };
      
    } catch (error) {
      console.error('❌ Error fetching OHLC data with pagination:', error);
      throw error;
    }
  }
  
  /**
   * Convert interval format to API timeframe format
   * 1m -> 1M, 5m -> 5M, 1h -> 1H, 1d -> 1D, 1w -> 1W
   */
  convertIntervalToTimeframe(interval) {
    const mapping = {
      '1m': '1M',
      '5m': '5M',
      '15m': '15M',
      '30m': '30M',
      '1h': '1H',
      '4h': '4H',
      '1d': '1D',
      '1w': '1W'
    };
    return mapping[interval.toLowerCase()] || '5M'; // Default to 5M if not found
  }
  
  /**
   * Get time interval in seconds for different timeframes
   */
  getTimeIntervalInSeconds(interval) {
    const intervals = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
      '1w': 604800
    };
    return intervals[interval] || 60; // Default to 1 minute
  }
  
  /**
   * Connect to your real market WebSocket for real-time data
   */
    connectWebSocket(
      symbol = 'EURUSD',
      interval = '1m',
      onMessage,
      onError,
      onClose,
      onOpen
    ) {
      console.log('🔌 Connecting to real market WebSocket for', symbol, interval);
      
      try {
        // Close existing connection if any
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
        
        // For now, we'll use a simple WebSocket connection
        // TODO: Integrate with the existing websocketService properly
        const wsUrl = `${RealMarketService.WS_URL}`;
        console.log('🌐 WebSocket URL:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('✅ Real Market WebSocket connected');
          if (onOpen) onOpen();
        };
        
        this.ws.onmessage = (event) => {
          try {
            let message;
            
            // Handle Blob data
            if (event.data instanceof Blob) {
              event.data.text().then((text) => {
                try {
                  const parsedMessage = JSON.parse(text);
                  console.log('📨 Real Market WebSocket message (Blob):', parsedMessage);
                  handleWebSocketMessage(parsedMessage, symbol, onMessage);
                } catch (error) {
                  console.error('Error parsing Blob WebSocket message:', error);
                }
              }).catch((error) => {
                console.error('Error reading Blob data:', error);
              });
              return;
            }
            
            // Handle string data
            if (typeof event.data === 'string') {
              message = JSON.parse(event.data);
            } else {
              message = event.data;
            }
            
            console.log('📨 Real Market WebSocket message:', message);
            handleWebSocketMessage(message, symbol, onMessage);
            
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        // Helper function to handle WebSocket messages
        const handleWebSocketMessage = (message, symbol, onMessage) => {
          console.log('📨 Processing WebSocket message:', message.type);
          
          if (message.type === 'ticks' && message.data) {
            // Process ticks data to create OHLC candles
            console.log('📊 Processing ticks data:', message.data.length, 'ticks');
            
            // Find ticks for our symbol
            const symbolTicks = message.data.filter(tick => {
              const tickSymbol = tick.symbol || tick.pair;
              return tickSymbol === symbol || tickSymbol === symbol + 'm' || tickSymbol === symbol.replace('m', '');
            });
            
            if (symbolTicks.length > 0) {
              console.log('📊 Found ticks for symbol:', symbol, symbolTicks.length, 'ticks');
              
              // Create OHLC data from ticks
              symbolTicks.forEach(tick => {
                const currentTime = Math.floor(Date.now() / 1000);
                const price = parseFloat(tick.price || tick.ask || tick.bid || 0);
                
                if (price > 0) {
                  const candleData = {
                    time: currentTime,
                    open: price,
                    high: price,
                    low: price,
                    close: price,
                    volume: parseFloat(tick.volume || 0),
                  };
                  
                  console.log('📊 Created candle from tick:', candleData);
                  if (onMessage) onMessage(candleData);
                }
                
                // Daily change data is now handled by the centralized market cache
                // No need to extract and store separately in chart store
              });
            }
          } else if (message.type === 'ohlc_update' && message.symbol === symbol) {
            const candleData = {
              time: message.time,
              open: parseFloat(message.open),
              high: parseFloat(message.high),
              low: parseFloat(message.low),
              close: parseFloat(message.close),
              volume: parseFloat(message.volume || 0),
            };
            
            if (onMessage) onMessage(candleData);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ Real Market WebSocket error:', error);
          if (onError) onError(error);
        };
        
        this.ws.onclose = (event) => {
          console.log('🔌 Real Market WebSocket closed:', event.code, event.reason);
          if (onClose) onClose(event);
        };
        
      } catch (error) {
        console.error('❌ Error creating real market WebSocket connection:', error);
        if (onError) onError(error);
      }
    }
  
    /**
     * Disconnect WebSocket
     */
    disconnectWebSocket() {
      if (this.ws) {
        console.log('🔌 Disconnecting Real Market WebSocket...');
        this.ws.close(1000, 'Manual disconnect');
        this.ws = null;
      }
    }
  
    /**
     * Check if WebSocket is connected
     */
    isConnected() {
      return this.ws?.isConnected || false;
    }
  
    /**
     * Get available symbols from your real market data
     */
    async getSymbols() {
      try {
        const response = await fetch(`${RealMarketService.BASE_URL}/api/symbols`);
        const data = await response.json();
        return data.symbols || [];
      } catch (error) {
        console.error('Error fetching symbols:', error);
        return [];
      }
    }
  }
  
  export const realMarketService = new RealMarketService();