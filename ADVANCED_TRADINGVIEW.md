# Advanced TradingView Widget — Implementation Plan

Goal: Swap in an “advanced” TradingView widget that preserves the exact look and feel of the current widget while adding only two capabilities:
- Persist user state (symbol, interval, visual settings, custom indicator configuration)
- Render custom indicators (without introducing new visible UI)

The widget must be feature‑flagged so that we can toggle between the current/basic widget and the advanced one at build/runtime via an env var.

---

## Overview

- Current implementation: `src/components/TradingViewWidget.jsx` loads `tv.js` and renders a chart with default studies and theme integration. No built‑in controls, the widget initializes from props only.
- New implementation: `src/components/TradingViewAdvancedWidget.jsx` mirrors the same DOM and init options but additionally:
  - Loads/saves state via Supabase using the existing `widget_tab_retention` table and `widgetTabRetentionService` patterns
  - Adds/removes custom indicators programmatically via TradingView Chart API (studies, shapes) based on a simple registry and saved config
- Feature flag: Switch between basic and advanced by checking `process.env.REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET` (string 'true'/'false').

Key constraints we will honor:
- Look and feel identical to the current widget (no visible settings, no extra controls)
- Only two behavior differences: state persistence and custom indicators applied programmatically on chart ready
- No backend schema changes required (we reuse `widget_tab_retention`)

---

## References in Codebase

- Basic widget: `src/components/TradingViewWidget.jsx`
- Dashboard usage: `src/pages/Dashboard.jsx` (see the `<TradingViewWidget .../>` in the 12×12 grid section)
- State persistence service: `src/services/widgetTabRetentionService.js`
- Supabase schema (already present): `supabase_widget_tab_retention_schema.sql`
- Theme context: `src/contexts/ThemeContext` (used by widget for dark/light)

---

## Feature Flag Design

- Env var name (browser‑exposed): `REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET`
  - Reason: CRA/browser builds expose only `REACT_APP_*`. Mapping the provided flag name to CRA convention keeps it functional in the frontend.
- Read via: `process.env.REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET === 'true'`
- Switching pattern:
  - Option A (wrapper file, minimal churn): Create `src/components/TradingViewWidget/index.jsx` that exports Advanced or Basic component based on the flag. Update imports to `../components/TradingViewWidget` (directory import) once.
  - Option B (internal switch): Change `TradingViewWidget.jsx` into a thin delegator that picks Advanced vs Basic. Slightly riskier because we’d touch the existing file.
  - We will implement Option A in code (recommended) to keep the original `TradingViewWidget.jsx` untouched.

---

## Data Model and Persistence

Widget key: `TradingViewChart`

Table: `public.widget_tab_retention` (existing)

Stored fields (in `widget_state` JSONB):
```
{
  "symbol": "OANDA:EURUSD",
  "interval": "60",             // TradingView interval (string)
  "theme": "dark" | "light",     // Derived from ThemeContext for completeness
  "studies": [                    // Built-in studies applied via TV API
    "RSI@tv-basicstudies",
    { "name": "Moving Average", "inputs": { "length": 20 }, "overrides": { "Plot.color": "#ff9800" } }
  ],
  "overrides": {                  // Chart-level style overrides (if any)
    "paneProperties.legendProperties.showLegend": true
  },
  "customIndicators": [           // Our custom indicator registry entries
    { "id": "vwap_custom", "visible": true, "pane": "main", "color": "#4caf50", "params": {} },
    { "id": "pivot_points_custom", "visible": false, "pane": "separate", "params": { "lookback": 5 } }
  ],
  "lastAppliedAt": "2025-01-01T12:34:56.000Z"
}
```

Notes:
- We intentionally do not attempt to export/import TradingView user drawings; tv.js does not expose a stable API for that in the public embed. We persist only programmatic elements we add (studies, overrides, and custom indicator configuration) plus the symbol/interval.
- For unauthenticated users, fall back to local state only (no DB write). We will still keep runtime state in component memory; on next load nothing is restored (acceptable per constraints).
- Debounce saves 1–2 seconds to avoid write bursts during rapid switching.

---

## Custom Indicators Strategy

Given tv.js limitations for truly arbitrary custom studies, we will implement custom indicators in two ways:

1) Prefer built-in studies where available, parameterized (e.g., additional moving averages, VWAP if offered by account tier). We add them via `activeChart().createStudy(...)` and then override styles.
2) For indicators not available as studies, render programmatic overlays using chart shapes/annotations:
   - Use `widget.activeChart().createShape` or `createMultipointShape` to draw lines/bands/marks derived from our data
   - Source data comes from our own computations (client-side or fed from our stores/services)
   - Keep overlays subtle and theme‑aware to preserve the current look and feel

Custom Indicator Registry (concept): `src/components/tradingview/customIndicatorRegistry.js`
```
export const CUSTOM_INDICATORS = {
  vwap_custom: { kind: 'study_pref', name: 'VWAP', pane: 'main' },
  pivot_points_custom: { kind: 'shapes', pane: 'separate', compute: async (symbol, interval) => {/* returns levels */} },
  // add more indicators under the same contract
};
```

Application flow (advanced widget):
- On `onChartReady`:
  - Apply symbol/interval if different from defaults
  - Create all configured studies (from `studies[]`) using `chart.createStudy`
  - For each `customIndicators[]` with `visible=true`:
    - If `kind==='study_pref'`: create a corresponding study (if the library supports it)
    - If `kind==='shapes'`: compute series data and render with shapes API
- On symbol/interval/theme change:
  - Recompute and reapply custom overlays
  - Debounce‑save updated state to Supabase

---

## Component Design

Files to add:
- `src/components/TradingViewAdvancedWidget.jsx` — Advanced widget (mirrors DOM and init of current widget)
- `src/components/TradingViewWidget/index.jsx` — Wrapper that switches between basic and advanced using feature flag
- `src/components/tradingview/customIndicatorRegistry.js` — Registry and helper functions

Advanced widget lifecycle:
1) Load `tv.js` (reuse current loader). Create widget using identical options to `TradingViewWidget.jsx` so visuals remain the same.
2) `widget.onChartReady`:
   - Acquire `chart = widget.activeChart()`
   - Attach listeners: `chart.onIntervalChanged`, `chart.onSymbolChanged`
   - Restore state from `widgetTabRetentionService.getWidgetState('TradingViewChart')`:
     - Apply saved symbol/interval if needed using `chart.setSymbol` and `chart.setResolution`
     - Recreate built‑in studies via `chart.createStudy`
     - Apply overrides via `widget.applyOverrides` or `chart.applyOverrides`
     - Apply custom indicators via registry helpers
   - Save a first snapshot (debounced) to persist any defaulted/merged state
3) On each relevant event, update in‑memory state and schedule `saveWidgetState('TradingViewChart', state)` with debounce.

Event hooks we will use (subject to tv.js availability):
- `onChartReady(cb)`
- `activeChart().onSymbolChanged(cb)`
- `activeChart().onIntervalChanged(cb)`
- `activeChart().createStudy(name, forceOverlay, lock, inputs, overrides)`
- `activeChart().setSymbol(symbol, cb)`
- `activeChart().setResolution(interval, cb)`
- `widget.applyOverrides(overrides)` or `chart.applyOverrides(overrides)`
- `activeChart().createShape(point, options)` / `createMultipointShape(points, options)`

Failure modes and fallbacks:
- If `tv.js` fails to load: show the existing loading/empty state; log an error; skip persistence.
- If any study creation fails (e.g., plan references an unavailable study): continue rendering; mark the indicator as unavailable in logs; persist a state without that item.

---

## Step Plan (with Estimates)

| Step | Description | Complexity | Est. Time | Status |
|---|---|---:|---:|---|
| 1 | Create Advanced widget skeleton mirroring basic DOM/options | Low | 1.5h | Not Started |
| 2 | Feature flag wrapper and wire in Dashboard import | Low | 0.5h | Not Started |
| 3 | State model + load/merge defaults from Supabase | Medium | 1.0h | Not Started |
| 4 | Event listeners (symbol/interval), debounce save | Medium | 1.0h | Not Started |
| 5 | Studies restore/apply with overrides | Medium | 1.0h | Not Started |
| 6 | Custom indicator registry + helpers | Medium | 1.5h | Not Started |
| 7 | Shapes‑based overlays for non‑study indicators | Medium | 2.0h | Not Started |
| 8 | Theme‑aware colors + reapply on theme change | Low | 0.5h | Not Started |
| 9 | QA: parity visual checks (flag on/off) | Medium | 1.0h | Not Started |
| 10 | Docs updates and env guidance | Low | 0.5h | Not Started |

Total: ~10.5h (one focused day incl. validation)

---

## Pseudocode Sketches

Wrapper selection (`src/components/TradingViewWidget/index.jsx`):
```jsx
import Basic from '../TradingViewWidget.jsx';
import Advanced from '../TradingViewAdvancedWidget.jsx';

const useAdvanced = (process.env.REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET === 'true');
export default function TradingViewWidget(props) {
  return useAdvanced ? <Advanced {...props} /> : <Basic {...props} />;
}
```

Advanced widget restore/apply (inside `onChartReady`):
```js
const state = await widgetTabRetentionService.getWidgetState('TradingViewChart');
const chart = widget.activeChart();

// Apply symbol/interval
if (state.symbol && state.symbol !== currentSymbol) chart.setSymbol(state.symbol);
if (state.interval && state.interval !== currentInterval) chart.setResolution(state.interval);

// Studies
for (const s of state.studies || []) {
  if (typeof s === 'string') chart.createStudy(s, true, false);
  else chart.createStudy(s.name, true, false, s.inputs || {}, s.overrides || {});
}

// Overrides
if (state.overrides) widget.applyOverrides(state.overrides);

// Custom indicators
await applyCustomIndicators(chart, state.customIndicators || [], theme);

scheduleDebouncedSave();
```

Debounced save example:
```js
const save = () => widgetTabRetentionService.saveWidgetState('TradingViewChart', currentState);
const scheduleDebouncedSave = debounce(save, 1000);
```

---

## Testing and Verification

- Visual parity: With flag OFF, dashboard renders exactly as today. With flag ON (same props), the chart visuals match the basic widget before any custom overlay is applied.
- Persistence: Change symbol/interval, reload the page; the chart restores to last used values (for authenticated user). For guests, no DB writes; behavior degrades gracefully.
- Custom indicators: When flag ON, the default custom indicators render (e.g., VWAP line or pivot levels). Toggle theme to confirm colors adapt.
- Performance: Verify no noticeable lag on symbol changes; ensure debounced saves (1–2s) and minimal Supabase writes.

---

## Risks and Mitigations

- tv.js API coverage differs by account tier; some studies might be unavailable. Mitigation: guard each `createStudy` and proceed on error; mark unavailable in logs.
- Custom overlays via shapes can become heavy if many objects are added. Mitigation: limit points, downsample data, batch updates, and clean up on symbol/interval change.
- Persistence churn (too many writes). Mitigation: robust debouncing and change detection (only save when something actually changed).
- User drawings cannot be exported. Mitigation: out of scope; document clearly.

---

## Rollout Plan

1) Ship code behind flag defaulting to OFF
2) Enable in staging by setting `REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET=true`
3) Perform visual and state‑retention checks against a test account
4) Gradually enable in production environments
5) Keep an immediate rollback path by flipping the flag to `false`

---

## Acceptance Criteria

- With the flag OFF, nothing changes visually or behaviorally
- With the flag ON:
  - State persists for authenticated users (symbol, interval, studies, custom indicator config)
  - Custom indicators render without new UI and adapt to theme
  - Performance and UX remain comparable to the current widget

---

## Implementation Notes (Security, Architecture, Clean Code)

- Use the existing `widgetTabRetentionService` for all persistence; do not duplicate persistence logic
- Ensure all env reads are safe and do not leak secrets (browser variables must be prefixed with `REACT_APP_`)
- Keep the advanced widget self‑contained and side‑effect free; do not alter global stores
- Respect the current theme API and CSS classes to keep visuals identical
- No additional network calls beyond `tv.js` and Supabase writes/reads

---

## Next Actions (Engineering)

- Implement wrapper and Advanced widget files as per plan
- Add basic custom indicator registry with at least one study‑backed and one shapes‑backed example
- Wire persistence, event listeners, and debounced save
- Validate parity and finalize documentation

