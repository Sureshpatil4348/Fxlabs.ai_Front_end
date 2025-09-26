-- Simplified RSI Correlation Tracker Alert (single alert per user)

CREATE TABLE IF NOT EXISTS public.rsi_correlation_tracker_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  timeframe text NOT NULL DEFAULT '1H' CHECK (timeframe IN ('1M','5M','15M','30M','1H','4H','1D','1W')),
  mode text NOT NULL DEFAULT 'rsi_threshold' CHECK (mode IN ('rsi_threshold','real_correlation')),
  rsi_period int DEFAULT 14 CHECK (rsi_period BETWEEN 5 AND 50),
  rsi_overbought int DEFAULT 70 CHECK (rsi_overbought BETWEEN 60 AND 90),
  rsi_oversold int DEFAULT 30 CHECK (rsi_oversold BETWEEN 10 AND 40),
  correlation_window int DEFAULT 50 CHECK (correlation_window IN (20,50,90,120)),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rsi_ob_gt_os_corr CHECK (rsi_overbought > rsi_oversold)
);

-- Ensure one row per user
CREATE UNIQUE INDEX IF NOT EXISTS rsi_correlation_tracker_alerts_user_id_unique ON public.rsi_correlation_tracker_alerts(user_id);

-- Triggers table
CREATE TABLE IF NOT EXISTS public.rsi_correlation_tracker_alert_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.rsi_correlation_tracker_alerts(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  mode text NOT NULL CHECK (mode IN ('rsi_threshold','real_correlation')),
  trigger_type text NOT NULL CHECK (trigger_type IN ('rsi_mismatch','real_mismatch')),
  pair_key text NOT NULL, -- e.g., EURUSD_GBPUSD
  timeframe text NOT NULL,
  value numeric(6,3), -- correlation percentage or delta, optional
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.rsi_correlation_tracker_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsi_correlation_tracker_alert_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rsi_correlation_tracker_alerts" ON public.rsi_correlation_tracker_alerts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own rsi_correlation_tracker_alert_triggers" ON public.rsi_correlation_tracker_alert_triggers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rsi_correlation_tracker_alerts a
      WHERE a.id = rsi_correlation_tracker_alert_triggers.alert_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own rsi_correlation_tracker_alert_triggers" ON public.rsi_correlation_tracker_alert_triggers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rsi_correlation_tracker_alerts a
      WHERE a.id = rsi_correlation_tracker_alert_triggers.alert_id AND a.user_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rsi_correlation_tracker_alerts_updated_at ON public.rsi_correlation_tracker_alerts;
CREATE TRIGGER set_rsi_correlation_tracker_alerts_updated_at
  BEFORE UPDATE ON public.rsi_correlation_tracker_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


