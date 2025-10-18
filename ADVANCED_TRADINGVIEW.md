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

## Detailed Specs Per Step

### Step 1 — Advanced Widget Skeleton (mirror visuals)
- Files:
  - `src/components/TradingViewAdvancedWidget.jsx`
- Requirements:
  - DOM must match `src/components/TradingViewWidget.jsx` container structure exactly:
    - Wrapper classes: `tradingview-widget flex flex-col h-full` plus any `className` passed via props
    - Inner `div` with `relative flex-1 min-h-0`
    - Chart container `div` with rounded border and theme-bound background/border classes
    - Loading overlay behavior identical (opacity, spinner, text styles)
  - Initialization options must match current widget options one-for-one:
    - `autosize: true`, `style: '1'`, `locale: 'en'`, `withdateranges: true`
    - `hide_side_toolbar: false`, `allow_symbol_change: true`, `details: true`, `hotlist: false`, `calendar: false`
    - `hide_top_toolbar: false`, `hide_legend: false`, `enable_publishing: false`, `save_image: false`
    - `toolbar_bg` must use the same color mapping as current theme
  - Script loading:
    - Reuse tv.js loader logic; prevent duplicate loads
  - Props:
    - `initialSymbol`, `initialInterval`, `height`, `className` same defaults and behavior as basic widget
  - Cleanup:
    - On unmount, clear container and nullify widget ref (no additional side effects)
  - No UI controls; no props added beyond the current ones

Acceptance criteria:
- Visual diff between Basic and Advanced for same props is negligible (no visible differences)
- Theme switching results in identical colors/backgrounds

---

### Step 2 — Feature Flag Wrapper and Wiring
- Env variable: `REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET` (values `'true'` / `'false'`)
- Wrapper approach (Option A: directory wrapper — recommended):
  - Create `src/components/TradingViewWidget/index.jsx`:
    - `import Basic from '../TradingViewWidget.jsx'`
    - `import Advanced from '../TradingViewAdvancedWidget.jsx'`
    - `const useAdvanced = process.env.REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET === 'true'`
    - `export default (props) => (useAdvanced ? <Advanced {...props} /> : <Basic {...props} />)`
  - Update imports site-wide to `import TradingViewWidget from '../components/TradingViewWidget'` (directory import resolves to index.jsx)
  - Keep the original `TradingViewWidget.jsx` intact; it serves as the Basic widget

Fallback (Option B: in-file delegator):
- Rename existing default to `TradingViewWidgetBasic` in `TradingViewWidget.jsx`
- Add `import TradingViewAdvancedWidget from './TradingViewAdvancedWidget'` and export a flag-based delegator as default
- Pros: no import path changes; Cons: touches existing file

Acceptance criteria:
- Flag OFF renders Basic widget everywhere; Flag ON renders Advanced with same visual output and props

---

### Step 3 — State Model + Supabase Integration
- Widget key: `TradingViewChart`
- Source of truth for persistence: `widgetTabRetentionService`
- State shape (widget_state):
  - `symbol: string` (e.g., `OANDA:EURUSD`)
  - `interval: string` (TradingView resolution; e.g., `'60'`)
  - `theme: 'dark' | 'light'`
  - `studies: Array<string | { name: string, inputs?: object, overrides?: object }>`
  - `overrides: object` (TradingView style overrides)
  - `customIndicators: Array<{ id: string, visible: boolean, pane: 'main' | 'separate', color?: string, params?: object }>`
  - `lastAppliedAt: ISO string`
- Defaults:
  - Use the same symbol/interval defaults as props
  - Studies default includes `"RSI@tv-basicstudies"` to match current behavior
  - `customIndicators` default empty array
- Load flow:
  - On `onChartReady`:
    - `const saved = await widgetTabRetentionService.getWidgetState('TradingViewChart')`
    - Merge with defaults; for unauthenticated users, use defaults only
  - Apply symbol/interval only if different from initial props
- Save flow:
  - Build a minimal snapshot: `{ symbol, interval, theme, studies, overrides, customIndicators, lastAppliedAt: new Date().toISOString() }`
  - Debounce save (1000–1500ms) and only write when values changed (shallow compare)
  - Unauthenticated users: skip saving

Acceptance criteria:
- Authenticated: Change symbol/interval, reload → state restored
- Guest: No errors; no persistence attempted

---

### Step 4 — Event Listeners and Debounced Persistence
- On chart ready:
  - `const chart = widget.activeChart()`
  - Register listeners:
    - `chart.onSymbolChanged(({ name }) => { state.symbol = name; scheduleSave(); reapplyCustomIndicators(); })`
    - `chart.onIntervalChanged((interval) => { state.interval = interval; scheduleSave(); reapplyCustomIndicators(); })`
  - Theme changes:
    - From `useTheme()`: on theme change, set `state.theme`, update widget theme, reapply overrides/indicator colors, schedule save
- Debounce strategy:
  - `let saveTimer; scheduleSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 1000); }`
  - `saveNow` performs shallow comparison against lastSaved snapshot to avoid redundant writes

Acceptance criteria:
- No write bursts during rapid changes; at most one save per second of activity
- Listeners are cleaned up on unmount

---

### Step 5 — Studies Restore/Apply with Overrides
- Applying studies:
  - For string entries: `chart.createStudy('RSI@tv-basicstudies', true, false)`
  - For object entries: `chart.createStudy(name, true, false, inputs || {}, overrides || {})`
- Tracking:
  - Maintain `studyIds` in-memory to manage duplicates and facilitate cleanup on symbol/interval/theme changes
- Overrides:
  - For chart-level style options: prefer `widget.applyOverrides(overrides)`
  - Keep overrides theme-aware (e.g., legend color, grid lines)
- Error handling:
  - Wrap each `createStudy` call; on failure, log a `[TV][Study]` error and continue

Acceptance criteria:
- Studies defined in saved state are created after chart ready without blocking
- Overrides apply immediately and survive symbol changes (until we reset)

---

### Step 6 — Custom Indicator Registry and Helpers
- File: `src/components/tradingview/customIndicatorRegistry.js`
- Contract:
  - Export `CUSTOM_INDICATORS` map keyed by `id`
  - Each entry: `{ kind: 'study_pref' | 'shapes', pane: 'main' | 'separate', apply(chart, ctx)?, remove(chart, ctx)?, compute?(symbol, interval, ctx) }`
  - `ctx` includes `{ theme, colorPalette, services: { marketCache? }, log(prefix, ...args) }`
- Helpers:
  - `applyCustomIndicators(chart, indicators, ctx)` — Applies visible indicators; returns handles/ids
  - `removeCustomIndicators(chart, handles)` — Cleans up on symbol/interval changes
  - `deriveThemeColors(theme)` — Produces palette for dark/light
- Examples shipped:
  - `vwap_custom` with `kind='study_pref'` — If VWAP not available, fallback to SMA(1) placeholder or skip with warning
  - `pivot_points_custom` with `kind='shapes'` — Compute multi-level horizontal lines and plot via `createMultipointShape`

Acceptance criteria:
- Registry is extensible; indicators can be toggled via state without UI
- Errors in one indicator do not break others

---

### Step 7 — Shapes-based Overlays
- Rendering:
  - Use `chart.createShape({ time, price }, options)` for single points; `createMultipointShape([...], options)` for lines/levels
  - Options include `shape: 'horizontal_line' | 'trend_line' | 'arrow_up' | ...`, `text`, `lock`, `disableSelection`, `disableSave`
  - Respect theme colors (`linecolor`, `textcolor`, `linewidth`)
- Data sourcing:
  - Prefer existing stores/services if they hold OHLC streams; otherwise compute from recent visible range
  - For static levels (e.g., pivots), compute from recent session data
- Lifecycle:
  - Track created shape ids; remove all on symbol/interval change or theme change, then re-render

Acceptance criteria:
- Overlays render quickly and are cleaned up correctly on changes
- Visuals remain subtle and aligned with current chart aesthetics

---

### Step 8 — Theme Awareness and Reapply
- Theme detection: from `useTheme()`
- Palette:
  - Dark: backgrounds `#19235d`, lines `#90caf9`, accents `#4caf50`
  - Light: backgrounds `#ffffff`, lines `#1976d2`, accents `#388e3c`
- On theme change:
  - Recreate overrides, studies style overrides if needed, and custom shapes with new colors
  - Save updated `theme` in state (debounced)

Acceptance criteria:
- Immediate color update on theme switch; no flicker beyond chart re-draw

---

### Step 9 — QA and Parity Verification
- Scenarios:
  - Flag OFF vs ON visual parity for default props
  - Authenticated persistence: change symbol/interval, reload
  - Theme toggle while advanced is ON
  - Custom indicators default rendering (at least one study-based and one shapes-based)
  - Performance under rapid symbol/interval changes (no UI jank, saves debounced)
- Logging:
  - Minimal console logs prefixed with `[TV][Adv]` behind debug gate `REACT_APP_DEBUG` or similar

Acceptance criteria:
- No regressions observed with flag OFF; with flag ON functionality matches specs

---

### Step 10 — Docs and Env Guidance
- Update `README.md`:
  - Document the feature flag, default value, and how to enable
  - Point to this file for full specification
- Update `env.example`:
  - Add `REACT_APP_FEATURE_FLAG_USE_ADVANCED_TRADINGVIEW_WIDGET=false`

Acceptance criteria:
- New team member can enable the feature by following README and env example without assistance

---

## Data Formats (Extended)

### Saved `widget_state` JSONB
```
symbol: string
interval: string
theme: 'dark' | 'light'
studies: Array<string | { name: string, inputs?: object, overrides?: object }>
overrides: { [key: string]: any }
customIndicators: Array<{
  id: string
  visible: boolean
  pane: 'main' | 'separate'
  color?: string
  params?: { [key: string]: any }
}>
lastAppliedAt: string (ISO)
```

### Custom Indicator Registry Entry
```
type RegistryEntry = {
  kind: 'study_pref' | 'shapes';
  pane: 'main' | 'separate';
  apply?: (chart, ctx, config) => Promise<any> | any; // return handle/id
  remove?: (chart, ctx, handle) => void;
  compute?: (symbol: string, interval: string, ctx) => Promise<any>;
}
```

---

## Security and Privacy
- No secrets in browser code; only `REACT_APP_*` variables are read
- Supabase operations use authenticated user context via existing client; deny if unauthenticated
- Input validation:
  - Validate `studies` entries (allowed names/types)
  - Validate `customIndicators` ids against registry
- Avoid storing or exposing raw private data; only chart config

---

## Performance and Reliability
- Debounce persistence (1000–1500ms); skip save if snapshot unchanged
- Cleanup all listeners and created handles on unmount
- Guard tv.js API calls with availability checks; fail soft and continue rendering

---

## Implementation Checklist
- [ ] Create `TradingViewAdvancedWidget.jsx` with identical DOM/options
- [ ] Add wrapper `components/TradingViewWidget/index.jsx` selecting basic/advanced by flag
- [ ] Add `tradingview/customIndicatorRegistry.js` with at least two indicators
- [ ] Wire persistence using `widgetTabRetentionService` with widget key `TradingViewChart`
- [ ] Add event listeners for symbol/interval and theme; implement debounced save
- [ ] Implement studies restore/apply with error guards
- [ ] Implement shapes overlays with cleanup and theme-aware colors
- [ ] Update `env.example` with the new flag
- [ ] Update `README.md` to document flag and point to this plan
- [ ] QA parity and persistence scenarios; adjust colors/overrides for perfect visual match

---

## Open Decisions
- Wrapper approach: Option A (directory wrapper) preferred for minimal risk to existing file; switch imports to directory path
- Custom indicators shipped by default: `vwap_custom` (best-effort), `pivot_points_custom` (shapes). Expandable later

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
