-- Simplified Heatmap/Quantum Analysis Tracker Alert (single alert per user)

CREATE TABLE IF NOT EXISTS public.heatmap_tracker_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  pairs jsonb NOT NULL DEFAULT '[]', -- up to 3 base symbols (e.g., ["EURUSD","GBPUSD"])
  trading_style text NOT NULL DEFAULT 'swingTrader' CHECK (trading_style IN ('scalper','swingTrader')),
  buy_threshold int NOT NULL DEFAULT 70 CHECK (buy_threshold BETWEEN 0 AND 100),
  sell_threshold int NOT NULL DEFAULT 70 CHECK (sell_threshold BETWEEN 0 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT heatmap_pairs_count CHECK (jsonb_array_length(pairs) BETWEEN 1 AND 3)
);

CREATE UNIQUE INDEX IF NOT EXISTS heatmap_tracker_alerts_user_id_unique ON public.heatmap_tracker_alerts(user_id);

ALTER TABLE public.heatmap_tracker_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own heatmap_tracker_alerts" ON public.heatmap_tracker_alerts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_heatmap_tracker_alerts_updated_at ON public.heatmap_tracker_alerts;
CREATE TRIGGER set_heatmap_tracker_alerts_updated_at
  BEFORE UPDATE ON public.heatmap_tracker_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


