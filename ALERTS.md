## RSI Tracker Alert (Simplified)

This alert is a simplified, single-alert configuration for the RSI Tracker. Users can configure exactly one alert per account with:

- Timeframe: choose exactly one (e.g., `1M`, `5M`, `15M`, `30M`, `1H`, `4H`, `1D`, `1W`)
- RSI Settings: `RSI Period`, `Overbought`, `Oversold`
- Behavior: If any subscribed pair in the RSI Tracker crosses into overbought (>= threshold) or oversold (<= threshold), an alert trigger is recorded.

Notes:
- Only one alert can be active for the RSI Tracker. This keeps UX simple and avoids duplicate spam.
- Evaluation happens on closed candles based on the tracker’s timeframe selection for consistency with the UI view.

### UI Configuration

- Component: `src/components/RSITrackerAlertConfig.jsx`
- Opened from the bell icon in `src/components/RSIOverboughtOversoldTracker.js`
- Fields:
  - `timeframe`: single select
  - `rsiPeriod` (5–50)
  - `rsiOverbought` (60–90)
  - `rsiOversold` (10–40)
  - The alert can be deleted; saving creates or updates the single alert

### Client Evaluation Logic

- Store: `src/store/useRSITrackerStore.js`
- On RSI recalculation, we detect threshold crossing events:
  - `crossup`: previous RSI < overbought AND current RSI >= overbought → trigger overbought
  - `crossdown`: previous RSI > oversold AND current RSI <= oversold → trigger oversold
- For each crossing event, if the RSI Tracker alert is active, we insert a trigger record using the new service.

### Service

- File: `src/services/rsiTrackerAlertService.js`
- Responsibilities:
  - Enforce a single alert per user (upsert by `user_id`)
  - Validate timeframe and RSI bounds
  - Provide default config and CRUD (save, get, delete, toggle)
  - Insert alert triggers (`createTrigger`)

### Supabase Schema

File: `supabase_rsi_tracker_alerts_schema.sql`

Tables:

1) `public.rsi_tracker_alerts`
- `id uuid PK`
- `user_id uuid` FK to `auth.users`
- `user_email text`
- `timeframe text` in (`1M`,`5M`,`15M`,`30M`,`1H`,`4H`,`1D`,`1W`)
- `rsi_period int` 5–50
- `rsi_overbought int` 60–90
- `rsi_oversold int` 10–40
- `is_active boolean`
- `created_at`, `updated_at`
- Constraints: `rsi_ob_gt_os` and unique `user_id` (one alert per user)

2) `public.rsi_tracker_alert_triggers`
- `id uuid PK`
- `alert_id uuid` FK → `rsi_tracker_alerts(id)`
- `triggered_at timestamptz`
- `trigger_condition text` in (`overbought`,`oversold`)
- `symbol text`
- `timeframe text`
- `rsi_value numeric(5,2)` 0–100
- `created_at timestamptz`

RLS Policies:
- Users can manage their own `rsi_tracker_alerts`; can read/insert triggers only for their own alerts.

### How Alerts Are Evaluated

1. The tracker subscribes to pairs and computes RSI per the selected timeframe and period on closed candles.
2. On each update, the store checks for threshold crossings (overbought/oversold) compared to the prior RSI value.
3. If an active RSI Tracker alert exists, a trigger row is inserted with `symbol`, `timeframe`, `rsi_value`, and `trigger_condition`.
4. Notification delivery can be handled by a backend process listening to `rsi_tracker_alert_triggers` (not included here).

### Migration & Deployment

1. Run `supabase_rsi_tracker_alerts_schema.sql` in your Supabase project.
2. Remove reliance on legacy multi-alert UIs:
   - RSI Tracker: use `RSITrackerAlertConfig.jsx` (old `RSIAlertConfig.jsx` removed)
   - RSI Correlation: use `RSICorrelationTrackerAlertConfig.jsx` (old `RSICorrelationAlertConfig.jsx` removed)
3. Ensure env vars for Supabase are configured (see `README_SUPABASE_SETUP.md`).

## RSI Correlation Tracker Alert (Simplified)

Single per-user alert for the RSI Correlation dashboard. User can select either RSI Threshold mode or Real Correlation mode, and one timeframe.

- Mode: `RSI Threshold` or `Real Correlation`
- Timeframe: choose exactly one (`1M`, `5M`, `15M`, `30M`, `1H`, `4H`, `1D`, `1W`)
- RSI Threshold mode: `RSI Period`, `Overbought`, `Oversold`
- Real Correlation mode: `Correlation Window` (20, 50, 90, 120)
- Behavior: If any correlation pair transitions into a mismatch, insert an alert trigger.

### UI Configuration

- Component: `src/components/RSICorrelationTrackerAlertConfig.jsx`
- Opened from bell icon in `src/components/RSICorrelationDashboard.js`
- Fields:
  - `timeframe`: single select
  - `mode`: `rsi_threshold` or `real_correlation`
  - RSI mode fields: `rsiPeriod` (5–50), `rsiOverbought` (60–90), `rsiOversold` (10–40)
  - Real mode fields: `correlationWindow` (20, 50, 90, 120)

### Client Evaluation Logic

- Store: `src/store/useRSICorrelationStore.js`
- RSI Threshold mode mismatch rule:
  - Positive pairs: mismatch if one RSI > overbought and the other < oversold
  - Negative pairs: mismatch if both > overbought or both < oversold
  - We trigger only on transitions into mismatch (prev != 'mismatch' and next == 'mismatch')
- Real Correlation mode mismatch rule:
  - Positive pairs: correlation < +0.25 -> mismatch
  - Negative pairs: correlation > -0.15 -> mismatch
  - We trigger only on transitions into mismatch (prev != true and next == true)
- For each transition, if the alert is active, we insert a trigger row.

### Service

- File: `src/services/rsiCorrelationTrackerAlertService.js`
- Responsibilities:
  - Single alert per user (upsert by `user_id`)
  - Validate timeframe, mode, RSI bounds, correlation window
  - CRUD: save/get/getActive/toggle/delete
  - `createTrigger({ alertId, pairKey, timeframe, mode, triggerType, value })`

### Supabase Schema

File: `supabase_rsi_correlation_tracker_alerts_schema.sql`

Tables:

1) `public.rsi_correlation_tracker_alerts`
- `id uuid PK`, `user_id uuid` FK, `user_email text`
- `timeframe text` in (`1M`,`5M`,`15M`,`30M`,`1H`,`4H`,`1D`,`1W`)
- `mode text` in (`rsi_threshold`,`real_correlation`)
- `rsi_period int` 5–50, `rsi_overbought int` 60–90, `rsi_oversold int` 10–40
- `correlation_window int` in (20, 50, 90, 120)
- `is_active boolean`, timestamps, constraint `rsi_overbought > rsi_oversold`
- Unique `user_id` (one alert per user)

2) `public.rsi_correlation_tracker_alert_triggers`
- `id uuid PK`, `alert_id uuid` FK → `rsi_correlation_tracker_alerts(id)`
- `triggered_at timestamptz`, `mode text`, `trigger_type text` ('rsi_mismatch'|'real_mismatch')
- `pair_key text` (e.g., `EURUSD_GBPUSD`), `timeframe text`, `value numeric(6,3)`
- `created_at timestamptz`

RLS Policies: Same pattern as RSI tracker alert; only owners can manage and read triggers for their alerts.



