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

    console.log(`[Router] Registered store: ${storeName} for message types: ${subscribedMessageTypes.join(', ')}`);
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

    console.log(`[Router] Unregistered store: ${storeName}`);
  }

  /**
   * Route a message to appropriate stores
   * @param {object} message - The WebSocket message
   * @param {string} rawData - Raw message data for logging
   */
  routeMessage(message, rawData) {
    if (!message || typeof message !== 'object') {
      console.warn('[Router] Invalid message format:', message);
      return;
    }

    const messageType = message.type;
    if (!messageType) {
      console.warn('[Router] Message missing type field:', message);
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
          console.error(`[Router] Error in ${storeName} handler:`, error);
        }
      }
    });

    // Log routing info for debugging (skip noisy types like 'ticks')
    if (messageType !== 'connected' && messageType !== 'ticks') {
      if (targetStores.size > 0) {
        console.log(`[Router] Routed ${messageType} to ${targetStores.size} stores: ${Array.from(targetStores).join(', ')}`);
      } else {
        console.log(`[Router] No stores registered for message type: ${messageType}`);
      }
    }
  }

  /**
   * Notify all stores of connection
   */
  notifyConnection() {
    console.log(`[Router] Connected - ${this.connectionCallbacks.size} stores registered`);
    this.connectionCallbacks.forEach((callback, storeName) => {
      try {
        callback();
      } catch (error) {
        console.error(`[Router] Error in ${storeName} connection callback:`, error);
      }
    });
  }

  /**
   * Notify all stores of disconnection
   * @param {object} event - Disconnection event
   */
  notifyDisconnection(event) {
    console.log(`[Router] Notifying ${this.disconnectionCallbacks.size} stores of disconnection`);
    this.disconnectionCallbacks.forEach((callback, storeName) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[Router] Error in ${storeName} disconnection callback:`, error);
      }
    });
  }

  /**
   * Notify all stores of error
   * @param {object} error - Error object
   */
  notifyError(error) {
    console.log(`[Router] Notifying ${this.errorCallbacks.size} stores of error`);
    this.errorCallbacks.forEach((callback, storeName) => {
      try {
        callback(error);
      } catch (err) {
        console.error(`[Router] Error in ${storeName} error callback:`, err);
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
    console.log('[Router] Cleaned up all routes and handlers');
  }
}

// Create singleton instance
const websocketMessageRouter = new WebSocketMessageRouter();

export default websocketMessageRouter;
