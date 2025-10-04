-- Simplified RSI Tracker Alert (single alert per user)

CREATE TABLE IF NOT EXISTS public.rsi_tracker_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  timeframe text NOT NULL DEFAULT '1H' CHECK (timeframe IN ('5M','15M','30M','1H','4H','1D','1W')),
  rsi_period int NOT NULL DEFAULT 14 CHECK (rsi_period BETWEEN 5 AND 50),
  rsi_overbought int NOT NULL DEFAULT 70 CHECK (rsi_overbought BETWEEN 60 AND 90),
  rsi_oversold int NOT NULL DEFAULT 30 CHECK (rsi_oversold BETWEEN 10 AND 40),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rsi_ob_gt_os CHECK (rsi_overbought > rsi_oversold)
);

-- Ensure one row per user
CREATE UNIQUE INDEX IF NOT EXISTS rsi_tracker_alerts_user_id_unique ON public.rsi_tracker_alerts(user_id);


-- RLS
ALTER TABLE public.rsi_tracker_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rsi_tracker_alerts" ON public.rsi_tracker_alerts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rsi_tracker_alerts_updated_at ON public.rsi_tracker_alerts;
CREATE TRIGGER set_rsi_tracker_alerts_updated_at
  BEFORE UPDATE ON public.rsi_tracker_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


