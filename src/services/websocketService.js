/**
 * Shared WebSocket Service
 * 
 * This service manages a single WebSocket connection that is shared across all stores.
 * It uses a centralized message router to intelligently route messages to appropriate stores.
 */

import websocketMessageRouter from './websocketMessageRouter';

// WebSocket URL configuration - v2 with indicator support
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.fxlabs.ai/market-v2';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionError = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
  }

  /**
   * Register a store with the message router
   * @param {string} storeName - Name of the store (e.g., 'market', 'rsiTracker')
   * @param {object} config - Configuration object for the store
   */
  registerStore(storeName, config) {
    websocketMessageRouter.registerStore(storeName, config);
  }

  /**
   * Unregister a store from the message router
   * @param {string} storeName - Name of the store
   */
  unregisterStore(storeName) {
    websocketMessageRouter.unregisterStore(storeName);
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      this.connectionError = null;

      try {
        this.ws = new WebSocket(WEBSOCKET_URL);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          console.warn(`[WS][Market-v2] Connected at ${new Date().toISOString()} -> ${WEBSOCKET_URL}`);
          
          // Notify all stores via router
          websocketMessageRouter.notifyConnection();

          resolve();
        };

        this.ws.onmessage = (event) => {
          // Parse and route message via router (no per-message logging)
          if (event?.data instanceof Blob) {
            event.data.text().then((text) => {
              try {
                const message = JSON.parse(text);
                websocketMessageRouter.routeMessage(message, text);
              } catch (error) {
                console.error(`[WS][Market-v2][${new Date().toISOString()}] Failed to parse blob message:`, error);
              }
            }).catch((e) => {
              console.error(`[WS][Market-v2][${new Date().toISOString()}] Failed to read blob data:`, e);
            });
          } else {
            try {
              const message = typeof event?.data === 'string' ? JSON.parse(event.data) : event?.data;
              websocketMessageRouter.routeMessage(message, event?.data);
            } catch (error) {
              console.error(`[WS][Market-v2][${new Date().toISOString()}] Failed to parse message:`, error);
            }
          }
        };

        this.ws.onclose = (event) => {
          console.error(`[WS][Market-v2] Disconnected at ${new Date().toISOString()} (code: ${event?.code}, reason: ${event?.reason || '-'})`);
          
          this.isConnected = false;
          this.isConnecting = false;
          this.ws = null;

          // Notify all stores via router
          websocketMessageRouter.notifyDisconnection(event);

          // Attempt reconnection if not manually closed
          if (event?.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error(`[WS][Market-v2][${new Date().toISOString()}] error:`, error);
          
          this.connectionError = 'Failed to connect to Market v2';
          this.isConnecting = false;

          // Notify all stores via router
          websocketMessageRouter.notifyError(error);

          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        this.connectionError = error.message;
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.warn(`[WS][Market-v2][${new Date().toISOString()}] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error(`[WS][Market-v2][${new Date().toISOString()}] Reconnection failed:`, error);
      });
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionError = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Send message through WebSocket
   * @param {string|object} message - Message to send
   */
  send(message) {
    if (this.isConnected && this.ws) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(messageStr);
    } else {
      console.warn(`[WS][Market-v2][${new Date().toISOString()}] Cannot send message: not connected`);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      connectionError: this.connectionError,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Get router statistics
   */
  getRouterStats() {
    return websocketMessageRouter.getStats();
  }

  /**
   * Clear all handlers and callbacks
   */
  cleanup() {
    websocketMessageRouter.cleanup();
    this.disconnect();
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
