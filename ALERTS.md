## RSI Tracker Alert (Simplified)

Frontend config only. Backend evaluates and sends notifications. No trigger tables are used.

Users can configure exactly one alert per account with:

- Timeframe: choose exactly one (e.g., `5M`, `15M`, `30M`, `1H`, `4H`, `1D`, `1W`).
- RSI Settings: `Overbought`, `Oversold` (RSI period fixed at 14).
- Backend behavior: No pair selection is required; the system checks all pairs and sends notifications externally.

Notes:
- Only one alert can be active for the RSI Tracker (unique per user).
- Frontend must not create triggers or evaluate thresholds.

Notification template: “RSI alert”

### UI Configuration

- Component: `src/components/RSITrackerAlertConfig.jsx`
- Opened from the bell icon in `src/components/RSIOverboughtOversoldTracker.js`
- Fields:
  - `timeframe`: single select
  - `rsiPeriod` (5–50)
  - `rsiOverbought` (60–90)
  - `rsiOversold` (10–40)
  - The alert can be deleted; saving creates or updates the single alert

### Service (Frontend)

- File: `src/services/rsiTrackerAlertService.js`
- Responsibilities:
  - Enforce a single alert per user (upsert by `user_id`).
  - Validate timeframe and RSI bounds.
  - Provide default config and CRUD (save, get, delete, toggle).
  - Do not evaluate or insert triggers on the client.

### Supabase Schema (reference)

File: `supabase_rsi_tracker_alerts_schema.sql`

Tables:

1) `public.rsi_tracker_alerts`
- `id uuid PK`
- `user_id uuid` FK to `auth.users`
- `user_email text`
- `timeframe text` in (`5M`,`15M`,`30M`,`1H`,`4H`,`1D`,`1W`)
- `rsi_period int` 5–50
- `rsi_overbought int` 60–90
- `rsi_oversold int` 10–40
- `is_active boolean`
- `created_at`, `updated_at`
- Constraints: `rsi_ob_gt_os` and unique `user_id` (one alert per user)

No trigger tables.

### How Alerts Are Evaluated

Evaluation and trigger insertion are performed by the backend only. The frontend solely manages alert configuration state.

### Migration & Deployment

1. Run `supabase_rsi_tracker_alerts_schema.sql` in your Supabase project.
2. Remove reliance on legacy multi-alert UIs:
   - RSI Tracker: use `RSITrackerAlertConfig.jsx` (old `RSIAlertConfig.jsx` removed)
   - RSI Correlation: use `RSICorrelationTrackerAlertConfig.jsx` (old `RSICorrelationAlertConfig.jsx` removed)
3. Ensure env vars for Supabase are configured (see `README_SUPABASE_SETUP.md`).

## RSI Correlation Tracker Alert (Removed)

This feature has been removed. There is no UI, service, or schema for RSI Correlation alerts anymore. The dashboard section previously used by RSI Correlation now renders a blank placeholder.

## Quantum Analysis (Heatmap) Tracker Alert (Simplified)

Frontend config only. Backend evaluates and sends notifications. No trigger tables are used.

Single per-user alert for the All-in-One/Quantum Analysis heatmap. Users select up to 3 currency pairs, a mode (trading style), and thresholds.

- Pairs: up to 3 (base symbols, e.g., `EURUSD`, `GBPUSD`).
- Mode: `scalper` or `swingTrader` (timeframe weights).
- Thresholds: `Buy Threshold %`, `Sell Threshold %` (0–100).
- Backend behavior: When Buy% or Sell% crosses its threshold for any selected pair, notifications are sent externally.

Notification template: “all in one”

### UI Configuration

- Component: `src/components/HeatmapTrackerAlertConfig.jsx`
- Open from bell icon in `src/components/MultiIndicatorHeatmap.js`
- Fields: pairs (max 3), trading style, buy/sell thresholds

### Service (Frontend)

- File: `src/services/heatmapTrackerAlertService.js`
- Responsibilities:
  - Single alert per user (upsert by `user_id`).
  - Validate pairs (≤3), style, and thresholds.
  - CRUD: save/get/getActive/toggle/delete.
  - Do not evaluate or insert triggers on the client.

### Supabase Schema

File: `supabase_heatmap_tracker_alerts_schema.sql`

Tables:

1) `public.heatmap_tracker_alerts`
- `id uuid PK`, `user_id uuid` FK, `user_email text`
- `pairs jsonb` (1–3 symbols)
- `trading_style text` in (`scalper`,`swingTrader`)
- `buy_threshold int` 0–100, `sell_threshold int` 0–100
- `is_active boolean`, timestamps
- Unique `user_id` (one alert per user)

No trigger tables.

## Quantum Analysis: Custom Indicator Tracker Alert (Simplified)

Frontend config only. Backend evaluates and sends notifications. No trigger tables are used.

Single per-user alert targeting one indicator on one timeframe across up to 3 pairs. Notifications are sent when the selected indicator flips its signal (Buy/Sell).

- Pairs: up to 3
- Timeframe: single select (`1M`…`1W`)
- Indicator: one of `EMA21`, `EMA50`, `EMA200`, `MACD`, `RSI`, `UTBOT`, `IchimokuClone`

Notification template: “Custom indicator”

### UI Configuration

- Component: `src/components/HeatmapIndicatorTrackerAlertConfig.jsx`
- Open from the sliders icon in `src/components/MultiIndicatorHeatmap.js`
- Fields: pairs (max 3), timeframe, indicator

### Service (Frontend)

- File: `src/services/heatmapIndicatorTrackerAlertService.js`
- Responsibilities:
  - Single alert per user (upsert by `user_id`).
  - Validate pairs, timeframe, indicator.
  - CRUD: save/get/getActive/toggle/delete.
  - Do not evaluate or insert triggers on the client.

### Supabase Schema

File: `supabase_heatmap_indicator_tracker_alerts_schema.sql`

Tables:

1) `public.heatmap_indicator_tracker_alerts`
- `id uuid PK`, `user_id uuid` FK, `user_email text`
- `pairs jsonb` (1–3 symbols), `timeframe text`, `indicator text`
- `is_active boolean`, timestamps
- Unique `user_id` (one alert per user)

No trigger tables.



