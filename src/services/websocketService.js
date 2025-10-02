/**
 * Shared WebSocket Service
 * 
 * This service manages a single WebSocket connection that is shared across all stores.
 * It eliminates the need for multiple connections and provides centralized message routing.
 */

// WebSocket URL configuration - v2 probe (logs only)
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.fxlabs.ai/market-v2';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionError = null;
    this.messageHandlers = new Map();
    this.connectionCallbacks = [];
    this.disconnectionCallbacks = [];
    this.errorCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
  }

  /**
   * Add a message handler for a specific store
   * @param {string} storeName - Name of the store (e.g., 'market', 'rsiTracker')
   * @param {function} handler - Function to handle messages for this store
   */
  addMessageHandler(storeName, handler) {
    this.messageHandlers.set(storeName, handler);
  }

  /**
   * Remove a message handler for a specific store
   * @param {string} storeName - Name of the store
   */
  removeMessageHandler(storeName) {
    this.messageHandlers.delete(storeName);
  }

  /**
   * Add connection callback
   * @param {function} callback - Function to call when connected
   */
  addConnectionCallback(callback) {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Add disconnection callback
   * @param {function} callback - Function to call when disconnected
   */
  addDisconnectionCallback(callback) {
    this.disconnectionCallbacks.push(callback);
  }

  /**
   * Add error callback
   * @param {function} callback - Function to call when error occurs
   */
  addErrorCallback(callback) {
    this.errorCallbacks.push(callback);
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
          
          console.warn(`[WS][Shared-v2] Connected at ${new Date().toISOString()} -> ${WEBSOCKET_URL}`);
          
          // Notify all connection callbacks
          this.connectionCallbacks.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.error('[WS][Shared-v2] Connection callback error:', error);
            }
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          // v2 probe: log raw frames only, no state updates
          if (event?.data instanceof Blob) {
            event.data.text().then((text) => {
              console.log('[WS][Shared-v2][message][blob->text]', text);
              
            // Route message to all handlers
            this.messageHandlers.forEach((handler, storeName) => {
              try {
                handler(event, text);
              } catch (error) {
                console.error(`[WS][Shared-v2] Handler error for ${storeName}:`, error);
              }
            });
            }).catch((e) => {
              console.error('[WS][Shared-v2] Failed to read blob data:', e);
            });
          } else {
            console.log('[WS][Shared-v2][message]', event?.data);
            
            // Route message to all handlers
            this.messageHandlers.forEach((handler, storeName) => {
              try {
                handler(event, event?.data);
              } catch (error) {
                console.error(`[WS][Shared-v2] Handler error for ${storeName}:`, error);
              }
            });
          }
        };

        this.ws.onclose = (event) => {
          console.error(`[WS][Shared-v2] Disconnected at ${new Date().toISOString()} (code: ${event?.code}, reason: ${event?.reason || '-'})`);
          
          this.isConnected = false;
          this.isConnecting = false;
          this.ws = null;

          // Notify all disconnection callbacks
          this.disconnectionCallbacks.forEach(callback => {
            try {
              callback(event);
            } catch (error) {
              console.error('[WS][Shared-v2] Disconnection callback error:', error);
            }
          });

          // Attempt reconnection if not manually closed
          if (event?.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS][Shared-v2] error:', error);
          
          this.connectionError = 'Failed to connect to Market v2';
          this.isConnecting = false;

          // Notify all error callbacks
          this.errorCallbacks.forEach(callback => {
            try {
              callback(error);
            } catch (err) {
              console.error('[WS][Shared-v2] Error callback error:', err);
            }
          });

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
    
    console.warn(`[WS][Shared-v2] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[WS][Shared-v2] Reconnection failed:', error);
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
      console.warn('[WS][Shared-v2] Cannot send message: not connected');
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
   * Clear all handlers and callbacks
   */
  cleanup() {
    this.messageHandlers.clear();
    this.connectionCallbacks = [];
    this.disconnectionCallbacks = [];
    this.errorCallbacks = [];
    this.disconnect();
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
