-- Simplified Heatmap Indicator Tracker Alert (single alert per user)

CREATE TABLE IF NOT EXISTS public.heatmap_indicator_tracker_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  pairs jsonb NOT NULL DEFAULT '[]', -- up to 3 base symbols
  timeframe text NOT NULL DEFAULT '1H' CHECK (timeframe IN ('5M','15M','30M','1H','4H','1D','1W')),
  indicator text NOT NULL CHECK (indicator IN ('EMA21','EMA50','EMA200','MACD','RSI','UTBOT','IchimokuClone')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT heatmap_indicator_pairs_count CHECK (jsonb_array_length(pairs) BETWEEN 1 AND 3)
);

CREATE UNIQUE INDEX IF NOT EXISTS heatmap_indicator_tracker_alerts_user_id_unique ON public.heatmap_indicator_tracker_alerts(user_id);

CREATE TABLE IF NOT EXISTS public.heatmap_indicator_tracker_alert_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.heatmap_indicator_tracker_alerts(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  symbol text NOT NULL,
  timeframe text NOT NULL,
  indicator text NOT NULL,
  signal text NOT NULL CHECK (signal IN ('buy','sell')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.heatmap_indicator_tracker_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_indicator_tracker_alert_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own heatmap_indicator_tracker_alerts" ON public.heatmap_indicator_tracker_alerts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own heatmap_indicator_tracker_alert_triggers" ON public.heatmap_indicator_tracker_alert_triggers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.heatmap_indicator_tracker_alerts a
      WHERE a.id = heatmap_indicator_tracker_alert_triggers.alert_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own heatmap_indicator_tracker_alert_triggers" ON public.heatmap_indicator_tracker_alert_triggers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.heatmap_indicator_tracker_alerts a
      WHERE a.id = heatmap_indicator_tracker_alert_triggers.alert_id AND a.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_heatmap_indicator_tracker_alerts_updated_at ON public.heatmap_indicator_tracker_alerts;
CREATE TRIGGER set_heatmap_indicator_tracker_alerts_updated_at
  BEFORE UPDATE ON public.heatmap_indicator_tracker_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


