-- =====================================================================
-- Widget Tab Retention Schema for FXLabs.ai
-- =====================================================================
-- Purpose: Store user-specific widget states, configurations, and preferences
--          for tools tab widgets (LotSizeCalculator, MultiTimeAnalysis, MultiIndicatorHeatmap)
-- 
-- Features:
-- - Per-user widget state persistence
-- - Support for multiple widgets with individual configurations
-- - Versioning support for schema evolution
-- - Automatic timestamp tracking
-- - Row Level Security (RLS) for data isolation
-- =====================================================================

-- 1) Main widget_tab_retention table
-- Stores individual widget states for each user
CREATE TABLE IF NOT EXISTS public.widget_tab_retention (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_name TEXT NOT NULL,
  widget_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  widget_config JSONB DEFAULT '{}'::jsonb,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Unique constraint: one entry per user per widget
CREATE UNIQUE INDEX IF NOT EXISTS widget_tab_retention_user_widget_unique
  ON public.widget_tab_retention (user_id, widget_name);

-- 3) Create index for faster queries
CREATE INDEX IF NOT EXISTS widget_tab_retention_user_id_idx 
  ON public.widget_tab_retention (user_id);

CREATE INDEX IF NOT EXISTS widget_tab_retention_updated_at_idx 
  ON public.widget_tab_retention (updated_at DESC);

-- 4) Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_widget_tab_retention_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS widget_tab_retention_updated_at_trigger ON public.widget_tab_retention;
CREATE TRIGGER widget_tab_retention_updated_at_trigger
  BEFORE UPDATE ON public.widget_tab_retention
  FOR EACH ROW
  EXECUTE FUNCTION public.update_widget_tab_retention_timestamp();

-- 5) Enable Row Level Security
ALTER TABLE public.widget_tab_retention ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies

-- Select: Users can only view their own widget states
DROP POLICY IF EXISTS "widget_tab_retention_select_own" ON public.widget_tab_retention;
CREATE POLICY "widget_tab_retention_select_own"
  ON public.widget_tab_retention FOR SELECT
  USING (auth.uid() = user_id);

-- Insert: Users can only insert their own widget states
DROP POLICY IF EXISTS "widget_tab_retention_insert_self" ON public.widget_tab_retention;
CREATE POLICY "widget_tab_retention_insert_self"
  ON public.widget_tab_retention FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update: Users can only update their own widget states
DROP POLICY IF EXISTS "widget_tab_retention_update_own" ON public.widget_tab_retention;
CREATE POLICY "widget_tab_retention_update_own"
  ON public.widget_tab_retention FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can only delete their own widget states
DROP POLICY IF EXISTS "widget_tab_retention_delete_own" ON public.widget_tab_retention;
CREATE POLICY "widget_tab_retention_delete_own"
  ON public.widget_tab_retention FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- Default Widget States Reference
-- =====================================================================
-- This comment documents the expected structure for widget_state JSONB field
-- 
-- LotSizeCalculator:
-- {
--   "accountBalance": "",
--   "riskPercentage": "",
--   "stopLoss": "",
--   "instrumentType": "forex",
--   "currencyPair": "EURUSDm",
--   "contractSize": "100000",
--   "pipValue": "10",
--   "currentPrice": "",
--   "lastCalculation": null
-- }
--
-- MultiTimeAnalysis:
-- {
--   "selectedSymbol": "EURUSDm",
--   "selectedTimeframes": ["1H", "4H", "1D"],
--   "viewMode": "table",
--   "showOnlyActive": false,
--   "sortBy": "timeframe",
--   "sortOrder": "asc"
-- }
--
-- MultiIndicatorHeatmap:
-- {
--   "selectedSymbol": "EURUSDm",
--   "tradingStyle": "swingTrader",
--   "indicatorWeight": "equal",
--   "showNewSignals": true,
--   "visibleIndicators": ["rsi", "macd", "ema", "sma"],
--   "timeframeFilter": "all"
-- }
-- =====================================================================

-- =====================================================================
-- Helper Functions
-- =====================================================================

-- Function to get all widget states for a user
CREATE OR REPLACE FUNCTION public.get_user_widget_states(p_user_id UUID)
RETURNS TABLE (
  widget_name TEXT,
  widget_state JSONB,
  widget_config JSONB,
  is_visible BOOLEAN,
  display_order INTEGER,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.widget_name,
    w.widget_state,
    w.widget_config,
    w.is_visible,
    w.display_order,
    w.updated_at
  FROM public.widget_tab_retention w
  WHERE w.user_id = p_user_id
  ORDER BY w.display_order ASC, w.widget_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset widget state to default
CREATE OR REPLACE FUNCTION public.reset_widget_state(
  p_user_id UUID,
  p_widget_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.widget_tab_retention
  WHERE user_id = p_user_id AND widget_name = p_widget_name;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset all widget states for a user
CREATE OR REPLACE FUNCTION public.reset_all_widget_states(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.widget_tab_retention
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- Sample Queries for Testing
-- =====================================================================
-- Get all widgets for current user:
-- SELECT * FROM public.widget_tab_retention WHERE user_id = auth.uid();
--
-- Get specific widget:
-- SELECT * FROM public.widget_tab_retention 
-- WHERE user_id = auth.uid() AND widget_name = 'LotSizeCalculator';
--
-- Get using helper function:
-- SELECT * FROM public.get_user_widget_states(auth.uid());
-- =====================================================================

COMMENT ON TABLE public.widget_tab_retention IS 'Stores user-specific widget states and configurations for dashboard tools';
COMMENT ON COLUMN public.widget_tab_retention.widget_name IS 'Unique identifier for the widget (e.g., LotSizeCalculator, MultiTimeAnalysis)';
COMMENT ON COLUMN public.widget_tab_retention.widget_state IS 'JSONB object storing widget-specific state data';
COMMENT ON COLUMN public.widget_tab_retention.widget_config IS 'JSONB object storing widget-specific configuration';
COMMENT ON COLUMN public.widget_tab_retention.is_visible IS 'Whether the widget is visible in the dashboard';
COMMENT ON COLUMN public.widget_tab_retention.display_order IS 'Order in which widget should be displayed';

