/**
 * Centralized WebSocket Message Router
 * 
 * This service routes WebSocket messages to appropriate stores based on message type and content.
 * It eliminates the need for each store to handle all messages and provides intelligent routing.
 */

class WebSocketMessageRouter {
  constructor() {
    this.routes = new Map(); // messageType -> Set of handlers
    this.storeHandlers = new Map(); // storeName -> handler function
    this.connectionCallbacks = new Map(); // storeName -> callback
    this.disconnectionCallbacks = new Map(); // storeName -> callback
    this.errorCallbacks = new Map(); // storeName -> callback
    // Debug logging flag (env driven)
    this.enableDebugLogs = (
      (process.env.REACT_APP_ENABLE_WS_ROUTER_DEBUG || 'false')
    ).toString().toLowerCase() === 'true';
  }

  /**
   * Register a store with the router
   * @param {string} storeName - Name of the store (e.g., 'market', 'rsiTracker')
   * @param {object} config - Configuration object
   * @param {function} config.messageHandler - Function to handle messages
   * @param {function} config.connectionCallback - Function to call on connection
   * @param {function} config.disconnectionCallback - Function to call on disconnection
   * @param {function} config.errorCallback - Function to call on error
   * @param {array} config.subscribedMessageTypes - Array of message types this store wants to receive
   */
  registerStore(storeName, config) {
    const {
      messageHandler,
      connectionCallback,
      disconnectionCallback,
      errorCallback,
      subscribedMessageTypes = ['*'] // Default to all messages
    } = config;

    // Store the handler
    this.storeHandlers.set(storeName, messageHandler);

    // Store callbacks
    if (connectionCallback) {
      this.connectionCallbacks.set(storeName, connectionCallback);
    }
    if (disconnectionCallback) {
      this.disconnectionCallbacks.set(storeName, disconnectionCallback);
    }
    if (errorCallback) {
      this.errorCallbacks.set(storeName, errorCallback);
    }

    // Register message type routes
    subscribedMessageTypes.forEach(messageType => {
      if (!this.routes.has(messageType)) {
        this.routes.set(messageType, new Set());
      }
      this.routes.get(messageType).add(storeName);
    });

    console.log(`[Router][${new Date().toISOString()}] Registered store: ${storeName} for message types: ${subscribedMessageTypes.join(', ')}`);
  }

  /**
   * Unregister a store from the router
   * @param {string} storeName - Name of the store to unregister
   */
  unregisterStore(storeName) {
    // Remove from all routes
    this.routes.forEach((stores, messageType) => {
      stores.delete(storeName);
      if (stores.size === 0) {
        this.routes.delete(messageType);
      }
    });

    // Remove handlers and callbacks
    this.storeHandlers.delete(storeName);
    this.connectionCallbacks.delete(storeName);
    this.disconnectionCallbacks.delete(storeName);
    this.errorCallbacks.delete(storeName);

    console.log(`[Router][${new Date().toISOString()}] Unregistered store: ${storeName}`);
  }

  /**
   * Route a message to appropriate stores
   * @param {object} message - The WebSocket message
   * @param {string} rawData - Raw message data for logging
   */
  routeMessage(message, rawData) {
    if (!message || typeof message !== 'object') {
      console.warn(`[Router][${new Date().toISOString()}] Invalid message format:`, message);
      return;
    }

    const messageType = message.type;
    if (!messageType) {
      console.warn(`[Router][${new Date().toISOString()}] Message missing type field:`, message);
      return;
    }

    // Get stores that should receive this message type
    const targetStores = new Set();
    
    // Add stores subscribed to this specific message type
    if (this.routes.has(messageType)) {
      this.routes.get(messageType).forEach(storeName => {
        targetStores.add(storeName);
      });
    }

    // Add stores subscribed to all messages
    if (this.routes.has('*')) {
      this.routes.get('*').forEach(storeName => {
        targetStores.add(storeName);
      });
    }

    // Route to target stores
    targetStores.forEach(storeName => {
      const handler = this.storeHandlers.get(storeName);
      if (handler) {
        try {
          handler(message, rawData);
        } catch (error) {
          console.error(`[Router][${new Date().toISOString()}] Error in ${storeName} handler:`, error);
        }
      }
    });

    // Targeted BTCUSDm logging for indicator pushes (correlation removed)
    try {
      if (messageType === 'indicator_update') {
        const sym = (message?.symbol || message?.data?.symbol || '').toString().toUpperCase();
        if (sym === 'BTCUSDm'.toUpperCase()) {
          const tf = (message?.timeframe || message?.data?.timeframe || '').toString().toUpperCase();
          const rsiVal = message?.data?.indicators?.rsi ?? message?.indicators?.rsi;
          console.log(
            `[WS][Indicator][BTCUSDm] timeframe=${tf}`,
            {
              indicators: message?.data?.indicators || message?.indicators || null,
              barTime: message?.data?.bar_time ?? message?.bar_time ?? null,
              rsi: rsiVal ?? null,
              raw: message
            }
          );
        }
      }

      // Targeted logging for currency strength pushes
      if (messageType === 'currency_strength_update') {
        const tf = (message?.timeframe || message?.data?.timeframe || '').toString().toUpperCase();
        const barTime = message?.data?.bar_time ?? message?.bar_time ?? null;
        const strength = message?.data?.strength || message?.strength || null;
        const keys = strength && typeof strength === 'object' ? Object.keys(strength) : [];
        const sample = keys.slice(0, 5).reduce((acc, k) => {
          acc[k] = strength[k];
          return acc;
        }, {});
        console.log(
          `[WS][CurrencyStrength] timeframe=${tf}`,
          {
            barTime,
            count: keys.length,
            keys,
            sample
          }
        );
      }

      // correlation_update removed
    } catch (_e) {
      // best-effort logging only
    }

    // Always log indicator updates verbosely
    if (messageType === 'indicator_update') {
      console.log(`[Router][${new Date().toISOString()}] Routed ${messageType} to ${targetStores.size} stores: ${Array.from(targetStores).join(', ')}`);
      console.log(`[Router][${new Date().toISOString()}] Full ${messageType} message:`, JSON.stringify(message, null, 2));
    } else if (this.enableDebugLogs && messageType !== 'connected' && messageType !== 'ticks') {
      // Log other message types only when debug flag is enabled (skip noisy types like 'ticks')
      if (targetStores.size > 0) {
        console.log(`[Router][${new Date().toISOString()}] Routed ${messageType} to ${targetStores.size} stores: ${Array.from(targetStores).join(', ')}`);
      } else {
        console.log(`[Router][${new Date().toISOString()}] No stores registered for message type: ${messageType}`);
      }
    }
  }

  /**
   * Notify all stores of connection
   */
  notifyConnection() {
    console.log(`[Router][${new Date().toISOString()}] Connected - ${this.connectionCallbacks.size} stores registered`);
    this.connectionCallbacks.forEach((callback, storeName) => {
      try {
        callback();
      } catch (error) {
        console.error(`[Router][${new Date().toISOString()}] Error in ${storeName} connection callback:`, error);
      }
    });
  }

  /**
   * Notify all stores of disconnection
   * @param {object} event - Disconnection event
   */
  notifyDisconnection(event) {
    console.log(`[Router][${new Date().toISOString()}] Notifying ${this.disconnectionCallbacks.size} stores of disconnection`);
    this.disconnectionCallbacks.forEach((callback, storeName) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[Router][${new Date().toISOString()}] Error in ${storeName} disconnection callback:`, error);
      }
    });
  }

  /**
   * Notify all stores of error
   * @param {object} error - Error object
   */
  notifyError(error) {
    console.log(`[Router][${new Date().toISOString()}] Notifying ${this.errorCallbacks.size} stores of error`);
    this.errorCallbacks.forEach((callback, storeName) => {
      try {
        callback(error);
      } catch (err) {
        console.error(`[Router][${new Date().toISOString()}] Error in ${storeName} error callback:`, err);
      }
    });
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      totalStores: this.storeHandlers.size,
      totalRoutes: this.routes.size,
      routes: Object.fromEntries(
        Array.from(this.routes.entries()).map(([type, stores]) => [
          type, 
          Array.from(stores)
        ])
      )
    };
  }

  /**
   * Clear all routes and handlers
   */
  cleanup() {
    this.routes.clear();
    this.storeHandlers.clear();
    this.connectionCallbacks.clear();
    this.disconnectionCallbacks.clear();
    this.errorCallbacks.clear();
    console.log(`[Router][${new Date().toISOString()}] Cleaned up all routes and handlers`);
  }
}

// Create singleton instance
const websocketMessageRouter = new WebSocketMessageRouter();

export default websocketMessageRouter;
