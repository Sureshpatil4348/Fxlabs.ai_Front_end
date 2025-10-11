import currencyStrengthAlertService from './currencyStrengthAlertService';
import heatmapTrackerAlertService from './heatmapTrackerAlertService';
import rsiTrackerAlertService from './rsiTrackerAlertService';
import userProfileService from './userProfileService';

/**
 * Service to initialize default alerts for first-time users
 */
class DefaultAlertsService {
  /**
   * Initialize all default alerts for a new user
   * This should only be called once per user (on first login)
   * 
   * Default alerts created:
   * - RSI Tracker: 4H timeframe, overbought 70, oversold 30
   * - Currency Strength Alert: 4H timeframe
   * - Quantum Analysis (Heatmap): EUR/USD, XAU/USD, BTC/USD, scalper, buy 70, sell 70
   * 
   * @returns {Promise<{success: boolean, results: Object}>}
   */
  async initializeDefaultAlerts() {
    console.log('[DefaultAlertsService] Starting default alerts initialization...');
    
    const results = {
      rsiTracker: { success: false, error: null },
      currencyStrength: { success: false, error: null },
      quantumAnalysis: { success: false, error: null }
    };

    try {
      // 1. Create RSI Tracker Alert
      try {
        console.log('[DefaultAlertsService] Creating default RSI Tracker alert...');
        await rsiTrackerAlertService.saveAlert({
          timeframe: '4H',
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          isActive: true
        });
        results.rsiTracker.success = true;
        console.log('[DefaultAlertsService] ✓ RSI Tracker alert created successfully');
      } catch (error) {
        console.error('[DefaultAlertsService] ✗ Failed to create RSI Tracker alert:', error);
        results.rsiTracker.error = error.message;
      }

      // 2. Create Currency Strength Alert
      try {
        console.log('[DefaultAlertsService] Creating default Currency Strength alert...');
        await currencyStrengthAlertService.saveAlert({
          timeframe: '4H',
          isActive: true
        });
        results.currencyStrength.success = true;
        console.log('[DefaultAlertsService] ✓ Currency Strength alert created successfully');
      } catch (error) {
        console.error('[DefaultAlertsService] ✗ Failed to create Currency Strength alert:', error);
        results.currencyStrength.error = error.message;
      }

      // 3. Create Quantum Analysis (Heatmap) Alert
      try {
        console.log('[DefaultAlertsService] Creating default Quantum Analysis alert...');
        await heatmapTrackerAlertService.saveAlert({
          pairs: ['EURUSD', 'XAUUSD', 'BTCUSD'],
          tradingStyle: 'scalper',
          buyThreshold: 70,
          sellThreshold: 70,
          isActive: true
        });
        results.quantumAnalysis.success = true;
        console.log('[DefaultAlertsService] ✓ Quantum Analysis alert created successfully');
      } catch (error) {
        console.error('[DefaultAlertsService] ✗ Failed to create Quantum Analysis alert:', error);
        results.quantumAnalysis.error = error.message;
      }

      // Mark user profile as initialized (even if some alerts failed)
      try {
        await userProfileService.markDefaultAlertsInitialized();
        console.log('[DefaultAlertsService] ✓ User profile marked as initialized');
      } catch (error) {
        console.error('[DefaultAlertsService] ✗ Failed to mark profile as initialized:', error);
        // Don't throw here - alerts were already created
      }

      const successCount = Object.values(results).filter(r => r.success).length;
      console.log(`[DefaultAlertsService] Initialization complete: ${successCount}/3 alerts created`);

      return {
        success: successCount > 0, // Success if at least one alert was created
        results
      };

    } catch (error) {
      console.error('[DefaultAlertsService] Unexpected error during initialization:', error);
      return {
        success: false,
        results,
        error: error.message
      };
    }
  }

  /**
   * Check if user needs initialization and initialize if needed
   * This is the main entry point to be called from the Dashboard
   * 
   * @returns {Promise<{initialized: boolean, results?: Object}>}
   */
  async checkAndInitialize() {
    try {
      const needsInit = await userProfileService.needsDefaultAlertsInitialization();
      
      if (!needsInit) {
        console.log('[DefaultAlertsService] User already initialized, skipping default alerts');
        return { initialized: false };
      }

      console.log('[DefaultAlertsService] First-time user detected, initializing default alerts...');
      const initResult = await this.initializeDefaultAlerts();
      
      return {
        initialized: true,
        ...initResult
      };
    } catch (error) {
      console.error('[DefaultAlertsService] Error in checkAndInitialize:', error);
      return {
        initialized: false,
        error: error.message
      };
    }
  }
}

const defaultAlertsService = new DefaultAlertsService();
export default defaultAlertsService;

