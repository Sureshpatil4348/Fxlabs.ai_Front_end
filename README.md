# FxLabs Prime Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Hero Stats Overlay Mobile Layout Fix (Latest)

The stats card below the hero slideshow ("80%+ Accuracy", "17+ Trading Tools", "$580k+ Profit Generated") now remains compact and horizontal on mobile, preventing it from covering the slideshow images.

### Changes
- Forced horizontal layout on mobile, reduced spacing, and font sizes
- Always show thin dividers between stats on all screen sizes
- Slightly adjusted bottom offset and rounded radius for smaller screens
- Files affected: `src/components/HeroSection.jsx`

## Lottie Animation Update (Latest)

The landing page Community Section (above FAQ) now uses the modern `@lottiefiles/dotlottie-react` library for better performance and React integration.

### Changes
- **Upgraded from Web Component**: Replaced `dotlottie-wc` web component with native React component
- **Better React Integration**: Uses `DotLottieReact` component from `@lottiefiles/dotlottie-react` package
- **Same Animation**: Maintains the same Lottie animation URL and behavior (loop, autoplay)
- **Improved Performance**: React component offers better performance and tree-shaking

### Implementation Details
- Added dependency: `@lottiefiles/dotlottie-react`
- Updated component: `src/components/CommunitySection.jsx`
- Wrapped component in container div to maintain responsive sizing
- Files affected: `src/components/CommunitySection.jsx`

### Installation
```bash
npm install @lottiefiles/dotlottie-react
```

## Live Quantum Analysis in Hero Section

The landing page hero section now displays real-time quantum analysis data for EUR/USD and XAU/USD pairs, driven by live market data from the Quantum Analysis meter.

### Changes
- **Live Success Probability**: Success probability % now shows the higher value between buy and sell percentages (whichever is above 50%)
- **Dynamic Trend Indicators**: Trend text is calculated based on buy/sell percentages:
  - **Strong Uptrend**: Buy percentage ≥ 70%
  - **Strong Downtrend**: Sell percentage ≥ 70%
  - **Weak Uptrend**: Buy percentage > Sell and Buy > 50% (but < 70%)
  - **Weak Downtrend**: Sell percentage > Buy and Sell > 50% (but < 70%)
  - **Neutral**: Buy and Sell percentages within 5% of each other
- **Real-time updates**: Data automatically refreshes as quantum analysis data updates via WebSocket
- **Smooth transitions**: Progress bars animate smoothly when values change

### Implementation Details
- Integrated `useMarketCacheStore` to access `quantumBySymbol` Map
- Added automatic hydration of quantum data for EURUSDm and XAUUSDm symbols on component mount
- Uses `swingtrader` style data for landing page display (fallback to `scalper` if not available)
- Color-coded trend indicators: green for uptrends, red for downtrends, gray for neutral
- Files affected: `src/components/HeroSection.jsx`

### Data Source
- Quantum data comes from the Multi-Indicator Heatmap (Quantum Analysis) component
- Data includes buy_percent and sell_percent for multiple trading styles
- WebSocket updates ensure real-time accuracy

## Tools Tab Mobile View Reordering (Latest)

The tools tab items have been reordered specifically for mobile view to improve user experience:

### Changes
- **Mobile order**: 
  1. Lot Size Calculator (first)
  2. Quantum Analysis (second)
  3. Forex Market Time Zone Converter (third)
- **Desktop layout preserved**: Desktop maintains the original two-column layout with Quantum Analysis spanning full width at the bottom
- **Implementation**: Uses Tailwind's responsive `order` utilities (`order-1`, `order-2 lg:order-3`, `order-3 lg:order-2`)
- **No layout breaks**: The reordering only affects mobile view; desktop grid layout remains unchanged

### Technical Details
- Applied `order-1` to Lot Size Calculator (stays first on all screens)
- Applied `order-2 lg:order-3` to Quantum Analysis (second on mobile, third on desktop)
- Applied `order-3 lg:order-2` to Multi Time Analysis (third on mobile, second on desktop)
- Files affected: `src/pages/Dashboard.jsx`

## Mobile Navigation Enhancement

The mobile navigation has been enhanced to show all navigation items directly in the navbar instead of hiding them behind a hamburger menu:

### Changes
- **Removed hamburger menu**: The mobile menu icon and popup overlay have been completely removed
- **Analysis & Tools tabs visible**: When on the dashboard, Analysis and Tools tabs are now always visible in the center of the navbar on all screen sizes
- **Account always accessible**: The account dropdown or login button is now always visible on the right side of the navbar
- **Three-column layout**: 
  - Left: FxLabs Prime logo (flex-shrink-0)
  - Center: Analysis/Tools tabs (when on dashboard)
  - Right: Account/Login button (flex-shrink-0)
- **Responsive sizing**: All navbar elements now scale appropriately for mobile screens with smaller text and padding
- **Improved UX**: Users can now switch between Analysis and Tools with a single tap, without needing to open a menu first

### Implementation Details
- Removed unused imports: `Menu`, `X` icons from lucide-react
- Removed state management: `isMobileMenuOpen` state and `toggleMobileMenu` function
- Made Analysis/Tools tabs visible on all screen sizes (removed `hidden lg:flex`)
- Made Account section visible on all screen sizes (removed `hidden lg:flex`)
- Added responsive classes for mobile: `text-xs sm:text-base`, `px-2 sm:px-5`, etc.
- **Size Balancing**: Made Analysis/Tools buttons larger (`px-3 sm:px-5 py-1.5 sm:py-1.5 text-sm sm:text-base`) and Account icon smaller (`w-8 h-8 sm:w-10 sm:h-10`) for better visual balance
- Files affected: `src/components/Navbar.jsx`, `src/components/UserProfileDropdown.jsx`

## IP Info Integration (Landing Page)

Geo-based pricing is now implemented! The landing page detects user location and shows appropriate pricing options:
- **Indian users** (IN): See INR pricing with Free Trial, 3-month, and 1-year plans
- **International users**: See USD pricing with Free Trial, 3-month, and 1-year plans

- Netlify Function proxy added to securely attach client credentials (secrets never shipped to browser): `netlify/functions/ip-info.js`
- Client service wrapper: `src/services/ipInfoService.js`
- Landing page hook logs result to console: `src/pages/Home.jsx`

### How it works
1. Browser calls `/.netlify/functions/ip-info` (or `REACT_APP_IP_INFO_FUNCTION_URL` if overridden)
2. Function resolves client IP from headers and calls `https://api.asoasis.tech/ip-info/ip/<ip>`
3. Function forwards JSON back to browser
4. Result is printed in DevTools console and also exposed at `window.__FX_IP_INFO__`

### Configure secrets (Netlify)
Set these environment variables in your Netlify site settings (Build & deploy → Environment):

- `ASOASIS_API_IP_INFO_CLIENT_ID` – provided client id (IP Info API)
- `ASOASIS_API_IP_INFO_CLIENT_SECRET` – provided client secret (IP Info API)

Do NOT put these values in `REACT_APP_` variables — those are exposed to the browser.

### Local development notes
- The proxy function path is `/.netlify/functions/ip-info` by default
- For local Netlify dev, create a `.env` at repo root with the variables above
- You can override IP for testing via query param: `/.netlify/functions/ip-info?ip=1.2.3.4`
- If calling the deployed function from `http://localhost:3000`, CORS is permitted by default (`Access-Control-Allow-Origin: *`) and preflight `OPTIONS` is supported.

No UI changes have been introduced yet; output is printed to console for future pricing logic. Headers to upstream are `client-id` and `client-secret`.

### Troubleshooting

- Symptom: Network call response body shows "You need to enable JavaScript to run this app".
  - Cause: The request is being served the SPA `index.html` instead of the Netlify Function. This happens if the function path is wrong or functions are not enabled on the current host (e.g., local CRA server).
  - Fixes:
    - Ensure the endpoint is exactly `/.netlify/functions/ip-info` (or set `REACT_APP_IP_INFO_FUNCTION_URL` to the full deployed URL like `https://<your-site>.netlify.app/.netlify/functions/ip-info`).
    - Confirm the function exists in Netlify (Site → Functions) and visiting it directly in the browser returns JSON (or a clear function error), not the app HTML.
    - When developing locally with CRA (`react-scripts start`), functions are not available. Use Netlify CLI (`netlify dev`) or point the client to the deployed function URL.

#### Function not appearing in Netlify UI

- Drag-and-drop deploys do not include Functions. Use Git-based deploys or the Netlify CLI to deploy Functions.
- Git-based deploy (recommended):
  - Commit `netlify.toml` and `netlify/functions/ip-info.js` to the repository root.
  - Connect the site to your Git repo and push a commit; Netlify will build and bundle functions automatically.
  - In build logs, look for a Functions bundling step. After deploy, check Site → Functions for `ip-info`.
- Netlify CLI deploy:
  - `netlify deploy --prod --dir=build --functions=netlify/functions`
  - This publishes the built static assets and uploads functions from `netlify/functions`.
- If you recently edited environment variables, click "Finish update" in Netlify, then trigger a fresh deploy (ideally "Clear cache and deploy site").

## Migration Notice: Server-Side Calculations (Latest)

**IMPORTANT ARCHITECTURAL CHANGE**: All technical indicator calculations have been moved to the server-side.

### What Changed
- **Client-side calculations removed**: RSI, EMA, MACD, UTBOT, Ichimoku, RFI, and all other technical indicators are no longer calculated on the frontend
- **Server-side calculation architecture**: All indicators should now be pre-calculated by the backend and delivered via WebSocket/API
- **Calculation files updated**: 
  - `src/utils/calculations.js` - Exports only constants and parameters, no calculation logic
  - `src/utils/rfiCalculations.js` - Exports only UI formatting helpers, no calculation logic
  - `src/utils/dataFormulasExample.js` - Deleted (was example/demo file)
- **Stores updated**: All calculation calls in stores are now placeholder functions that log warnings
  - `src/store/useRSITrackerStore.js`
  - (Removed) `src/store/useRSICorrelationStore.js`
  - `src/store/useMarketStore.js`
- **Components updated**: `src/components/MultiIndicatorHeatmap.js` now uses neutral fallback values instead of calculating indicators

### Why This Change
- **Performance**: Complex calculations no longer burden the client browser
- **Consistency**: Single source of truth for all calculations ensures consistency across users
- **Scalability**: Backend can optimize and cache calculations for multiple users
- **Reliability**: Server-side calculations with proper data management and error handling
- **Maintenance**: Single codebase for calculation logic, easier to update and fix

### Migration Path for Integrators
If you're integrating with this frontend:
1. **Backend must provide pre-calculated indicators** via WebSocket messages or API responses
2. **Expected data format**: Technical indicators should be included in the data payloads sent to frontend
3. **No client-side recalculation**: The frontend will not recalculate any indicators from raw OHLC data
4. **UI will show neutral/placeholder values** until server data arrives

### Affected Features
All features that relied on client-side calculations now expect server-provided data:
- Multi-Indicator Heatmap (EMA, MACD, RSI, UTBOT, Ichimoku)
- RSI Tracker (RSI values)
- (Removed) RSI Correlation Dashboard
- Currency Strength Meter (calculations)
- RFI Score Cards (RFI components)

## Recent Fixes (Latest)

### Currency Strength Meter - Loading State with Shimmer Animation (Latest)
- **Enhanced loading UX**: Currency strength values now show "--" with shimmer animation on grey cards instead of "0" when data hasn't loaded
  - **Root cause**: Before data loaded, all currency strengths defaulted to 0, which could be confusing for users
  - **Solution implemented**:
    - **Loading state detection**: Added `isDataLoading` memo that checks if data is genuinely loading (all values at neutral/default state or no connection/subscriptions)
    - **Visual indicator**: Currency cards now display "--" instead of numeric values during loading
    - **Grey neutral cards**: Cards show light grey background (`bg-gray-200` light mode, `bg-gray-700` dark mode) during loading instead of strength-based colors
    - **Shimmer animation**: Added smooth opacity animation (1.2s ease-in-out infinite) on the "--" text to indicate active loading state
    - **Smart detection**: Considers data loading if all values are 0 or within narrow neutral range (49-51), or if no subscriptions/connection exists
  - **Components updated**:
    - `src/components/CurrencyStrengthMeter.js` - Added loading state detection, conditional card styling, and shimmer effect
    - `src/index.css` - Added shimmer keyframe animation for loading indicator
  - **User experience**: Users now have clear visual feedback when currency strength data is still loading vs when actual values are displayed
  - **Technical details**: 
    - Loading detection uses `useMemo` for performance optimization
    - Shimmer animation cycles opacity between 0.3 and 1.0 for noticeable pulsing effect (faster at 1.2s)
    - Grey cards provide neutral backdrop distinguishing loading state from actual strength values
    - Applied to both strongest and weakest currency displays

### Currency Strength Meter - Alert Config Modal Z-Index Fix
- **Fixed navbar appearing over alert config modal**: Implemented React Portal solution to render modals outside component tree, bypassing all CSS stacking context issues
  - **Root cause**: Multiple issues causing navbar overlay:
    1. Alert config modal was rendered inside CurrencyStrengthMeter component, subject to parent CSS stacking contexts
    2. Parent component had `z-10 relative` and other CSS properties creating stacking contexts
    3. Navbar mobile menu dropdown had no explicit z-index, inheriting from parent navbar
    4. Backdrop-blur effects creating additional stacking contexts
  - **Solution implemented**: 
    - **React Portal**: Used `createPortal(modal, document.body)` to render modals directly to document body
    - **Bypass stacking contexts**: Modals now render outside component tree, immune to parent CSS interference
    - **Maintained z-index**: Kept `z-[99999]` with explicit inline styles for absolute positioning
    - **Added isolation**: `isolation: 'isolate'` CSS property for proper stacking context isolation
    - **Enhanced backdrop**: `backdrop-blur-sm` for better visual separation
    - **Fixed navbar mobile menu**: Set z-index to `z-40` (lower than modal)
    - **Applied to both modals**: Alert config and settings modals both use portal rendering
  - **Components updated**: 
    - `src/components/CurrencyStrengthAlertConfig.jsx` - Added `createPortal` import and portal rendering
    - `src/components/CurrencyStrengthMeter.js` - Added `createPortal` import and portal rendering for settings modal
    - `src/components/Navbar.jsx` - Mobile menu dropdown z-index fixed to `z-40`
  - **User experience**: Alert config and settings modals now properly overlay all other UI elements including navbar and mobile menu
  - **Technical details**: React Portal renders modals directly to `document.body`, completely bypassing any parent component CSS stacking contexts, ensuring absolute top-level rendering regardless of component hierarchy

### Lot Size Calculator - Tab Switching Auto-Selection Fix
- **Fixed price not updating when switching instrument tabs**: Automatically selects first available pair when switching between Forex/Commodities/Crypto tabs
  - **Root cause**: When switching tabs (e.g., Forex → Commodities), the `currencyPair` remained set to the previous instrument's pair (like `EURUSDm`), which doesn't exist in the new instrument type, causing the price to not update
  - **Solution implemented**: 
    - Added automatic pair selection when current pair doesn't exist in new instrument type
    - Detects invalid pair for current instrument type and auto-selects first available pair
    - Triggers re-render with new pair, which then fetches correct price
  - **User experience improvement**:
    - Switching from Forex → Commodities: Automatically selects Gold (XAU/USD)
    - Switching from Commodities → Crypto: Automatically selects BTC/USD  
    - Switching from Crypto → Forex: Automatically selects EUR/USD
    - Seamless instrument type switching without data loss
  - **Technical details**:
    - Lines 96-109: Added pair validation and auto-selection logic
    - Early return pattern triggers effect re-run with correct pair
    - Preserves user's selection within each tab when switching back
  - **Impact**: Seamless tab switching with immediate price updates for the selected instrument
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Lot Size Calculator - Current Price Removal (Latest)
- **Removed Current Price functionality**: Simplified the calculator by removing current price input and real-time price updates
  - **Changes made**: 
    - Removed current price input field from the UI
    - Removed real-time price fetching logic and related useEffect hooks
    - Removed current price validation from form validation
    - Simplified calculation logic to not depend on current price
    - Removed unused imports (useRSITrackerStore)
  - **Benefits**:
    - **Simplified UI**: Cleaner interface without current price complexity
    - **Better performance**: No real-time price fetching reduces API calls and component re-renders
    - **Easier maintenance**: Less complex state management and fewer edge cases
  - **Technical details**:
    - Removed currentPrice from formData state
    - Removed real-time price update useEffect hooks
    - Simplified calculation logic in calculateLotSize function
    - Cleaned up unused imports and dependencies
  - **Impact**: Simplified calculator interface with better performance and easier maintenance
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Lot Size Calculator - Risk Reward Ratio Text Format (Latest)
- **Updated text formatting**: Changed "Risk:Reward Ratio" to "Risk Reward Ratio" (removed colon)
  - **Display label**: Updated from "Risk:Reward Ratio" to "Risk Reward Ratio"
  - **Comment text**: Updated calculation comment to match new format
  - **Impact**: Cleaner, more readable text formatting without punctuation
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Lot Size Calculator - Risk:Reward Ratio Integer Display (Latest)
- **Integer risk:reward ratio**: Risk:Reward ratio now displays as whole numbers without decimal fractions
  - **Display format**: Changed from `1:2.50` to `1:3` (rounded to nearest integer)
  - **Implementation**: Used `Math.round()` to convert decimal ratio to integer
  - **Impact**: Cleaner, more intuitive risk:reward ratio display for traders
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Lot Size Calculator - Decimal Precision Standardization (Latest)
- **Standardized decimal places**: All calculation results now display with maximum 2 decimal places for consistency
  - **Forex calculations**: Changed from 4 decimal places to 2 decimal places
  - **Commodities calculations**: Changed from 4 decimal places to 2 decimal places  
  - **Crypto calculations**: Changed from 8 decimal places to 2 decimal places
  - **Position size display**: Updated result display to consistently show 2 decimal places
- **Impact**: Cleaner, more readable calculation results across all instrument types
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Lot Size Calculator Result Unit Capitalization (Latest)
- **Fixed text display**: The result unit (lots/contracts/units) now displays with proper capitalization
  - **Position Size description**: Changed from "lots to trade for this position" to "Lots to trade for this position"
  - **Implementation**: Added `.charAt(0).toUpperCase() + .slice(1)` to capitalize the first letter of `result.resultUnit`
  - **Components updated**:
    - `src/components/LotSizeCalculator.jsx` - Line 597

### Tools Tab Icon Alignment Improvement
- **Improved icon vertical alignment**: Icons in all three tools now align better with their title text
  - **Removed top margin**: Changed icon positioning from `mt-0.5` to no top margin for better vertical centering
  - **Components updated**:
    - **Lot Size Calculator**: Removed `mt-0.5` from calculator icon
    - **Forex Market Time Zone Converter**: Removed `mt-0.5` from globe icon  
    - **Quantum Analysis**: Removed `mt-0.5` from quantum image
  - **Visual improvement**: Icons now appear more centered and aligned with the title text baseline
  - **Responsive design maintained**: All responsive layout and spacing classes preserved
- **Files affected**: 
  - `src/components/LotSizeCalculator.jsx` - Updated icon positioning
  - `src/components/MultiTimeAnalysis.jsx` - Updated icon positioning
  - `src/components/MultiIndicatorHeatmap.js` - Updated icon positioning

### Tools Tab Header Standardization (Latest)
- **Standardized header styling across all tools**: All three main tools now have consistent title text styling and icon placement
  - **Title text styling**: All components now use `CardTitle` component with consistent classes: `text-lg font-bold text-gray-900 dark:text-white flex items-start tools-heading`
  - **Icon placement standardization**: All icons now use consistent sizing and spacing: `w-5 h-5 mr-2 flex-shrink-0 text-blue-600`
  - **Components updated**:
    - **Lot Size Calculator**: Updated from `h3` to `CardTitle` component, maintained blue icon color
    - **Forex Market Time Zone Converter**: Updated icon from responsive sizing (`sm:w-5 sm:h-5`) to fixed sizing (`w-5 h-5`), changed color from indigo to blue
    - **Quantum Analysis**: Updated from `h3` to `CardTitle` component, removed responsive sizing from icon
  - **Responsive design maintained**: All responsive spacing and layout classes preserved, only standardized the header elements
  - **Impact**: All three tools now have identical header appearance and behavior across mobile and desktop views
- **Files affected**: 
  - `src/components/LotSizeCalculator.jsx` - Added CardTitle import and updated header
  - `src/components/MultiTimeAnalysis.jsx` - Standardized icon styling
  - `src/components/MultiIndicatorHeatmap.js` - Added CardTitle import and updated header

### Lot Size Calculator - Header Styling Consistency (Latest)
- **Updated header to match other widgets**: Title now consistently displays "Lot Size Calculator" across all screen sizes
  - **Removed responsive text**: Removed separate mobile ("Calculator") and desktop ("Lot Size Calculator") title variants for consistency
  - **Standardized icon sizing**: Changed icon size from responsive `w-4 h-4 sm:w-5 sm:h-5` to fixed `w-5 h-5` to match other headers like "Forex Market Time Zone Converter"
  - **Consistent icon spacing**: Changed icon margin from responsive `mr-1.5 sm:mr-2` to fixed `mr-2` for uniformity
  - **Consistent text sizing**: Changed text size from responsive `text-base sm:text-lg` to fixed `text-lg` for consistency
  - **Impact**: Header now has the same professional appearance and styling as "Forex Market Time Zone Converter" and other dashboard widgets
- **Files affected**: 
  - `src/components/LotSizeCalculator.jsx` - Header styling standardized

### Lot Size Calculator - Mobile View Responsive Improvements
- **Fixed tab switcher cutoff in mobile view**: The Forex/Commodities/Crypto tab switcher now displays properly on smaller screens
  - **Responsive text sizing**: Changed button text from `text-sm` to `text-xs sm:text-sm` for better mobile fit
  - **Responsive padding**: Changed button padding from `px-3` to `px-2 sm:px-3` to reduce width on mobile
  - **Header gap adjustment**: Changed gap from `gap-3` to `gap-2 sm:gap-3` for tighter mobile spacing
  - **Prevent shrinkage**: Added `flex-shrink-0` to tab switcher container to prevent unwanted compression
- **Fixed input section margins**: Input fields now have proper spacing on mobile screens
  - **Left panel margins**: Changed from `pl-4` to `px-4 sm:pl-4 sm:pr-2` for consistent mobile padding
  - **Right panel margins**: Changed from `pl-4` to `px-4 lg:pl-4 lg:pr-2` for proper mobile spacing
  - **Impact**: Eliminates cramped appearance and ensures adequate touch targets on mobile devices
- **Files affected**: 
  - `src/components/LotSizeCalculator.jsx` - All responsive improvements applied

### Forex Market Time Zone Converter - Mobile View Spacing Fix
- **Eliminated excessive vertical spacing in mobile view**: Fixed excessive empty space below the widget using flexible max-height approach instead of fixed height
  - **Dashboard container approach** (Key Fix): Changed from fixed height `h-[820px]` to flexible `max-h-[600px]` on mobile
    - **Why this is better**: Content now uses its natural height (no empty space), but won't exceed 600px (scrolls if needed)
    - **Result**: Dynamic, responsive layout that adapts to content without forcing empty space
    - **Inner container**: Changed from `h-full` to `max-h-full` for proper height inheritance
  - **Component padding**: Changed from `p-3` to `p-2 sm:p-3` (reduced padding on mobile from 12px to 8px)
  - **Toggle position**: Adjusted absolute positioning from `top-4 right-4` to `top-3 sm:top-4 right-3 sm:right-4` for tighter mobile layout
  - **Header margin**: Reduced bottom margin from `mb-3` to `mb-2 sm:mb-3` (8px on mobile, 12px on desktop)
  - **Header padding-right**: Reduced from `pr-16` to `pr-14 sm:pr-16` for tighter mobile layout
  - **Timeline hours padding**: Changed from `px-6` to `px-4 sm:px-6` (reduced horizontal padding on mobile)
  - **Timeline hours margin**: Reduced bottom margin from `mb-2` to `mb-1 sm:mb-2` for tighter spacing
  - **Weekend message spacing**: Adjusted margins from `mt-3 mb-2` to `mt-2 sm:mt-3 mb-1 sm:mb-2` and padding from `px-6` to `px-4 sm:px-6`
  - **Market rows container**: Changed spacing from `space-y-4 mt-4` to `space-y-2 sm:space-y-3 mt-2 sm:mt-4` (reduced gap between rows from 16px to 8px on mobile)
  - **Market row cards**: Reduced padding from `gap-3 px-4 py-3` to `gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3` for tighter mobile layout
  - **Impact**: Completely eliminated empty space below the widget using flexible max-height instead of rigid fixed height - content adapts naturally
- **Files affected**: 
  - `src/pages/Dashboard.jsx` - Changed from fixed `h-[820px]` to flexible `max-h-[600px]` approach
  - `src/components/MultiTimeAnalysis.jsx` - All internal spacing adjustments with responsive breakpoints

### Widget Icons - Mobile View Alignment & Sizing Fix
- **Fixed icon alignment and size in mobile view**: Icons in Forex Market Time Zone Converter, Lot Size Calculator, and Quantum Analysis now align properly and maintain consistent size across all screen sizes
  - **Vertical alignment**: Changed from `items-center` to `items-start` to align icons to the top of title text instead of middle
  - **Icon positioning**: Added `mt-0.5` (2px top margin) to align icon baseline with text baseline
  - **Size consistency**: Icons use fixed `w-5 h-5` sizing to ensure they maintain 20px × 20px size across all breakpoints
  - **Prevent shrinking**: Added `flex-shrink-0` to prevent icons from shrinking when title text wraps on mobile
  - **Impact**: All three widget icons now have consistent size and top-aligned positioning, improving visual hierarchy and readability on mobile devices
- **Files affected**: 
  - `src/components/MultiTimeAnalysis.jsx` - Forex Market Time Zone Converter icon
  - `src/components/LotSizeCalculator.jsx` - Lot Size Calculator icon
  - `src/components/MultiIndicatorHeatmap.js` - Quantum Analysis icon

### Forex Market Time Zone Converter - Performance Optimization (Latest)
- **Reduced update frequency**: Changed time update interval from 1 second to 10 seconds
  - **Timer interval**: Modified `setInterval` from 1000ms to 10000ms for better performance
  - **Debug logs**: Commented out verbose NY Session debug logs that were flooding the console
  - **Impact**: Significantly reduced console log spam and improved browser performance
  - **Files affected**: 
    - `src/components/MultiTimeAnalysis.jsx` - Timer interval update
    - `src/utils/marketHoursEngine.js` - Debug logs disabled

### Lot Size Calculator - Risk:Reward Ratio Enhancement (Latest)
- **Added Risk:Reward Ratio display**: Calculator now shows the Risk:Reward ratio in the results section
  - **New input field**: Added "Take Profit" field to capture target profit level (optional)
  - **Ratio calculation**: Risk:Reward ratio calculated as Take Profit / Stop Loss (only when Take Profit is provided)
  - **Display format**: Shown as "1:X.XX" format with blue styling to distinguish from other metrics
  - **Validation**: Take Profit field is optional - only validates if a value is entered
  - **State persistence**: Take Profit value is saved and restored with other calculator inputs
  - **Default values**: Take Profit field defaults to 200 but can be cleared (optional input)
  - **Conditional display**: Risk:Reward ratio only appears when Take Profit is entered
  - **Impact**: Traders can now quickly assess if their trade setup meets their risk management criteria when they have a target profit level
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Lot Size Calculator - Full Height Cards Layout (Latest)
- **Made input and output cards extend to full height**: Cards now maintain consistent height even with minimal content
  - **Grid container**: Removed forced minimum height to prevent unnecessary scrollbars
  - **Input card**: Added `flex flex-col` and made input form area `flex-1` to fill available space naturally
  - **Output card**: Already had `flex flex-col` with `flex-1` content area for proper expansion
  - **Impact**: Both cards now have equal height based on content needs, creating balanced appearance without forced scrollbars

### Lot Size Calculator - Extra Space & Scrollbar Fix
- **Removed unnecessary height constraints and outer card wrapper**: Fixed extra space below calculator causing unnecessary scrollbar
  - **Root cause**: Outer container had `h-full` class AND result panel had `min-h-[400px]` forcing minimum height, plus unnecessary outer Card wrapper
  - **Solution**: Removed `h-full` class from line 296, `min-h-[400px]` from line 523, and entire outer Card wrapper, keeping only the two inner cards (input and output panels)
  - **Impact**: Calculator now has clean layout with only the essential input and output cards, eliminating unnecessary scrollbars and improving UX

### Lot Size Calculator - UI Alignment
- **Reduced excessive border radius and margins**: Aligned Lot Size Calculator cards with other widgets
  - **Container cards**: Changed border radius from `rounded-2xl` to `rounded-lg` for consistency
  - **CardHeader padding**: Override default `p-6` with `!px-2 !pt-3 !pb-2` for minimal horizontal margin
  - **CardContent padding**: Override default `p-6 pt-0` with `!p-2 !pt-1` for minimal outer margin
  - **Grid spacing**: Reduced from `gap-4` to `gap-2` for tight spacing between input and result panels
  - **Panel padding**: Maintained at `p-3` for comfortable internal spacing
  - **Inner result cards**: Changed spacing from `space-y-3` to `space-y-2` for minimal margins
  - **Input fields**: Changed border radius from `rounded-xl` to `rounded-lg` (all inputs, selects)
  - **Buttons**: Changed border radius from `rounded-xl` to `rounded-lg` for consistency
  - **Calculate button**: Changed from blue gradient to emerald-green gradient (`from-emerald-500 via-emerald-400 to-green-600`) to match Analysis/Tools header buttons
  - **Impact**: Calculator now has a compact, cohesive look that aligns with Currency Strength Meter, Quantum Analysis, and other dashboard widgets

### Forex Market Time Zone Converter - Multi-Segment Rendering (Latest)
- **Fixed timezone change reactivity**: Time labels inside market bars now update immediately when timezone changes
  - **Root cause**: `getSessionHoursInTimezone` function wasn't memoized with proper dependencies
  - **Solution**: Converted to `useCallback` with `[marketData, is24Hour]` dependencies
  - **Result**: Time labels now correctly reflect the selected timezone and 12h/24h format
- **Multi-segment projection**: Engine returns all segments overlapping the viewer's day window for each market
  - Provides `projectedSegmentsInViewer` (array) and `projectedSegmentInViewer` (first segment for backward-compat)
  - Shows both yesterday’s tail and today’s segment when applicable (e.g., New York in IST)
- **Session detection logic**:
  - **Yesterday extends check** and **today overlaps check** used to build all segments
  - No merging at engine level; component renders all segments clipped to 24h window
- **Component rendering update**: Renders all segments per market
  - Clips each segment at 0% and 100% to prevent overflow
  - Labels inside each segment respect 12h/24h toggle and timezone
  - When multiple segments exist, only the largest segment displays the time label (for visual clarity)
- **Enhanced debugging**: Comprehensive debug logging for multi-day session detection
  - Formatted output with clear sections for viewer window, yesterday's session, today's session, gap analysis, and selection logic
  - Shows exact timestamps, gap duration in hours, and which session is selected
  - Includes yesterday session flag, merged session flag, gap flag, and positioning adjustments
  - Helps diagnose multi-day session projection and selection issues

### Forex Market Time Zone Converter - Cross-Midnight Session Fix
- **Fixed New York session bar ending early**: Resolved issue where New York session bar ended at 21:30 instead of 17:00 local time
  - **Root cause**: Sessions that cross midnight in viewer's timezone were being clipped by the 24-hour viewer window
  - **Solution**: Extended viewer window to 48 hours to capture cross-midnight sessions
  - **Session bar positioning**: Added logic to handle sessions where endHour < startHour (crosses midnight)
  - **24-hour boundary clipping**: Session bars that extend beyond the 24-hour timeline are clipped at 100% to prevent overflow
  - **CSS overflow handling**: Added `overflow-hidden` to timeline bar containers to ensure clean visual boundaries
  - **Example**: New York session (8:00-17:00 EST) appears as 17:30-02:30 IST, with the portion after midnight clipped at 24h mark
- **Enhanced debugging**: Added comprehensive debug logging for session projection and positioning
  - Logs viewer window boundaries, session overlap calculations, and cross-midnight detection
  - Includes clipping detection to show when bars are truncated at 24-hour boundary
  - Helps diagnose timezone conversion issues in development mode

### Forex Market Time Zone Converter - Timezone Selection & Time Format Updates
- **Curated timezone list**: Timezone dropdown now shows only prominent timezones (one per GMT offset)
  - Covers all major GMT offsets from GMT-11:00 to GMT+13:00
  - Includes half-hour and quarter-hour offset timezones (e.g., Kolkata at GMT+05:30, Kathmandu at GMT+05:45)
  - Updated names: "Calcutta" → "Kolkata" and other modern timezone names
  - System timezone is always included in the list for user convenience
  - List is sorted by GMT offset for easy navigation
- **Time format consistency**: Market session times and timeline hours now fully respect the 12h/24h format toggle
  - **Timeline hours**: 
    - 24-hour format: displays 0-24 (includes terminal 24 label)
    - 12-hour format: displays 12, 1-11, 12, 1-11, 12 (includes terminal 12 label)
  - **Market session times** inside the colored rectangles:
    - Previously showed only 24-hour format (e.g., "08:00-17:00")
    - Now respects the toggle: 24-hour format (e.g., "08:00-17:00") or 12-hour format (e.g., "8:00 AM-5:00 PM")
    - Applies to Sydney, London, and New York session bars
- **Files affected**: 
  - `src/utils/marketHoursEngine.js` (timezone list, extended viewer window)
  - `src/components/MultiTimeAnalysis.jsx` (time format logic, cross-midnight handling)

### Forex Market Time Zone Converter - Mobile View Optimization & UI Reorganization (Latest)
- **Mobile-optimized layout**: Redesigned for better horizontal space utilization on mobile devices
  - **Fixed markets column**: Market information (currency symbols, names, times) stays fixed on the left side
  - **Scrollable timeline section**: Timeline bars and hours scroll horizontally on the right side
  - **Auto-scroll to current time**: On mobile, the timeline automatically scrolls to center the current time indicator (purple bar) on mount
  - **Synchronized scrolling**: All timeline elements (hours row, market bars) scroll together as a single unit
  - **Desktop layout**: Desktop view (≥1024px) uses optimized layout with timezone selector on the left
- **Timezone selector repositioned**: 
  - Moved from header to left side above market information (both mobile and desktop)
  - No longer overlaps with 12h-24h toggle switch
  - Compact vertical layout showing timezone name and GMT offset
  - Positioned at the same visual level as the time hours row
  - Better visual hierarchy and cleaner header area
- **Implementation details**:
  - Added `scrollContainerRef` to manage horizontal scroll position
  - Separate mobile/desktop layouts using Tailwind `lg:` breakpoint
  - Mobile layout uses flex container with fixed left column (`w-48 flex-shrink-0`) and scrollable right section
  - Auto-scroll effect triggers only on mobile (< 1024px) and centers the current time indicator
  - Custom scrollbar styling for better appearance (`scrollbar-thin` utility classes)
  - Z-index layering: 12h-24h toggle (`z-50`) > timezone dropdown (`z-40`) > time indicator (`z-10`)
  - Overflow visible on parent containers to prevent time badge clipping
- **UX improvements**:
  - Reduced horizontal scrolling on mobile by keeping markets fixed
  - Better visibility of current time by auto-scrolling to it on load
  - Smooth scroll animation for better user experience
  - All interactive features (draggable indicator, clickable hours) work seamlessly in both layouts
  - Cleaner header with no overlapping elements
  - Time indicator badge fully visible without clipping
- **Files affected**: `src/components/MultiTimeAnalysis.jsx`

### Forex Market Time Zone Converter - Simplified Timeline Interaction
- **Removed horizontal timeline bar**: Removed the gray rounded horizontal bar with vertical markers that was previously displayed between the times and market rows
- **Time numbers row now clickable**: The time numbers row at the top is now clickable to move the purple vertical time indicator to that position
- **Individual card design for each market**: Each market (Sydney, London, New York) now appears in its own distinct card
  - Clean white background (no fill color) with border, rounded corners, and shadow
  - Enhanced visual separation between markets
  - Hover effect on cards for better interactivity feedback
  - Currency badge now has proper background (white in light mode, dark in dark mode)
  - Consistent padding and spacing within each card
- **Enhanced active market session bars**: Active market session indicators are now more prominent
  - Increased height from 1.5rem to 2.5rem for better visibility
  - Intensified color gradients for stronger visual impact:
    - Sydney (Blue): from-blue-700 to-blue-900
    - London (Purple): from-purple-700 to-purple-900
    - New York (Green): from-green-700 to-green-900
  - Inactive sessions remain at 30% opacity for clear distinction
- **Improved vertical spacing**: Market rows now have optimal spacing between them for better readability and less clutter
  - Markets are evenly spread out vertically within the widget
  - Better visual hierarchy and organization
- **Improved UX**: Cleaner, more minimalist design with enhanced interactive functionality
  - The purple vertical time indicator remains draggable
  - Clicking on any time number or anywhere in the time row moves the indicator to that position
  - Hover effect on time numbers shows interactivity
  - Keyboard navigation (Arrow Left/Right) still works as before
  - Completely removed the invisible space between time numbers and market rows
- **Files affected**: `src/components/MultiTimeAnalysis.jsx`

## Market v2 WebSocket Integration (Latest)

**IMPORTANT ARCHITECTURAL CHANGE**: The server has removed OHLC streaming and now provides polling-based market data with indicator streaming.

### What Changed
- **OHLC streaming removed**: Server no longer streams OHLC bars in real-time
- **Polling-based market data**: Server fetches ticks and OHLC bars using MetaTrader5 Python package on a 10-second cadence
- **Indicator streaming**: Server pushes `indicator_update` messages when new closed-bar indicators are computed
- **Indicator cache**: Server maintains an in-memory cache to provide instant snapshots of indicators on WebSocket connect
- **Broadcast-all mode**: WebSocket v2 broadcasts ticks and indicator updates for a baseline set of symbols/timeframes to all connected clients

### WebSocket v2 Architecture
- **Endpoint**: `wss://api.fxlabsprime.com/market-v2` (override via `REACT_APP_WEBSOCKET_URL`)
- **Connection management**: Single shared WebSocket connection across all stores
- **Message routing**: Centralized message router (`src/services/websocketMessageRouter.js`) directs messages to appropriate stores
- **Data types**: `['ticks', 'indicators']` (OHLC no longer available)

### Message Types (Frontend)
- `connected` - Connection established with server info
- `ticks` - Real-time tick data (includes `daily_change_pct` per tick)
- `initial_indicators` - Bootstrap indicator snapshots on connect
- `indicator_update` - Live indicator updates when new closed-bar indicators are computed
- `subscribed` / `unsubscribed` / `pong` / `error` - Standard WebSocket messages

### Server-Side Calculations
All technical indicator calculations are now performed server-side:
- **RSI** (Relative Strength Index)
- **EMA** (Exponential Moving Average)
- **MACD** (Moving Average Convergence Divergence)
- **UTBOT** (Ultimate Trading Bot indicators)
- **Ichimoku** (Ichimoku Cloud)
- **RFI** (Risk Factor Index)

### Affected Files
- `src/services/websocketService.js` - Updated to use `/market-v2` endpoint
- `src/services/websocketMessageRouter.js` - Routes `indicator_update` messages
- `src/store/useMarketStore.js` - Handles `initial_indicators` and `indicator_update` messages
- `src/store/useRSITrackerStore.js` - Uses server indicator data; now stores per-timeframe snapshots per symbol
- (Removed) `src/store/useRSICorrelationStore.js`
- `src/store/useCurrencyStrengthStore.js` - Uses server indicator data; now stores per-timeframe snapshots per symbol
- `src/components/OHLCDataView.js` - Renamed to `IndicatorDataView.js` and updated to display indicators
- `src/components/TradingViewChart.js` - Updated to use tick data for line charts
- `src/components/RSIOverboughtOversoldTracker.js` - Updated to use tick data for price display
- `src/components/MultiIndicatorHeatmap.js` - Updated to use indicator data instead of OHLC

### Data Flow
1. **Client connects** to `/market-v2` WebSocket endpoint
2. **Server sends** `connected` message with server info
3. **Server sends** `initial_indicators` snapshots for all subscribed symbols
4. **Server streams** `ticks` for real-time price updates
5. **Server streams** `indicator_update` when new closed-bar indicators are computed
6. **Frontend stores** receive and process indicator data for display (normalized)
   - Normalization: payloads may include `symbol`/`timeframe` at top-level or under `data`. Stores accept both.
   - Storage format: `indicatorData` keeps both backward-compatible flat fields and a `timeframes: Map<tf, { indicators, barTime, lastUpdate }>` per symbol.
   - UI reads per-timeframe indicators when available; otherwise falls back to latest flat indicators.

### Pricing Snapshots (Latest)
- Initial price display for RSI Tracker uses REST `GET /api/pricing` for the currently visible pairs (including watchlist view).
- Subsequent price updates come from WebSocket `ticks` broadcasts.
- Implementation:
  - `src/services/pricingService.js` provides `fetchPricingSnapshot({ pairs })`.
  - `src/store/useRSITrackerStore.js` exposes `ingestPricingSnapshot(entries)` to merge REST snapshots into `tickData` as synthetic ticks.
  - `src/components/RSIOverboughtOversoldTracker.js` fetches pricing on mount and whenever the visible pair set changes (RSI lists or Watchlist), then relies on `ticks` for live updates.

### Migration Notes
- **No OHLC data**: Components that previously used OHLC data now use tick data or indicator data
- **No client-side calculations**: All technical indicators are provided by the server
- **Real-time updates**: Indicators update when new closed bars are processed server-side
- **Performance**: Reduced client-side processing and improved real-time responsiveness

### Console Warning Cleanup (Latest)
### WebSocket Router Logging
- `indicator_update` messages are always logged with routing summary and full payload (for verification during live updates).
- Other message types are logged only when `REACT_APP_ENABLE_WS_ROUTER_DEBUG=true` (default `false`).
- Removed all console warnings related to disabled WebSocket subscribe/unsubscribe functions in probe mode
- Removed all console warnings about server-side RSI calculations being called
- Cleaned up warning messages in all store files to reduce console noise during development
- Affected functions: `subscribe()`, `unsubscribe()`, `recalculateAllRsi()`, `calculateRsi()`, `calculateAllCorrelations()`, `recalculateAllRfi()`

### Currency Strength Logging (New)
- WebSocket pushes: every `currency_strength_update` is logged by the router with a unified tag and both summary and full payload:
  - Summary: `[WS][CurrencyStrength] timeframe=<TF>` with `{ barTime, count, keys, sample }`
  - Full: `[WS][CurrencyStrength] Full message:` followed by the full JSON payload
- REST snapshots: every `indicator=currency_strength` response logs with a matching unified tag:
  - Summary: `[REST][CurrencyStrength]` with `{ timeframe, count, keys, sample, url }`
  - Full: `[REST][CurrencyStrength] Full response:` followed by the full JSON payload
- Purpose: verify that WS pushes and REST snapshots align for the same timeframe with easy-to-scan tags.
- Files:
  - `src/services/websocketMessageRouter.js` (WS summary + full logs)
  - `src/services/indicatorService.js` (REST summary + full logs)

### Currency Strength Snapshot Source (Design)
- WebSocket pushes (`currency_strength_update`) are the sole source for periodic updates (closed-bar cadence per timeframe; e.g., ~every 5 minutes for `5M`).
- REST is used only for initial hydration (on mount and timeframe changes) and cache-miss handling; no periodic REST polling.
- REST payload formats supported: `strength` or `currencies` (both map currency->value); timestamp fields supported: `bar_time` or `ts`.
- Files:
  - `src/components/CurrencyStrengthMeter.js` (initial hydration only; no interval)
  - `src/services/indicatorService.js` (snapshot fetch and logging; supports both payload shapes)

### WebSocket Selective Logging (Latest)
- The client now logs WebSocket messages selectively to reduce console noise from frequent tick data.
- **Tick messages are NOT logged by default** to prevent console spam from high-frequency market data.
- Other message types (indicator updates, connection status, etc.) are still logged for debugging.
- Blob payloads are converted to text before logging; string payloads are logged as-is.
- This logging uses `console.log` with an ISO timestamp prefix like `[WS][Market-v2][timestamp] Received:` to aid debugging.
- **Environment Variable**: Set `REACT_APP_ENABLE_TICK_LOGGING=true` to enable tick logging for debugging purposes.
- Note on performance/data: Full-payload logging can be verbose and may contain sensitive data. Use browser filters in DevTools when inspecting logs, and disable logging in production builds as needed.

### WebSocket Connection Timeout (New)
- The global dashboard connection now waits longer before declaring a timeout.
- Default timeout is `15000ms` and can be configured via environment variable:
  - `REACT_APP_WS_CONNECT_TIMEOUT_MS=20000` (example for 20s)
- Affected code: `src/store/useMarketStore.js` (`globalConnectionState.timeoutDuration`).

## Documentation

- Calculations reference and source of truth for all formulas, static symbol lists, correlation pairs, thresholds, and percentages: see `CALCULATIONS.md`.

### Dashboard Layout Update (Latest)

- The RSI Correlation placeholder has been replaced with `CurrencyStrengthMeter` on the Dashboard.
- Mobile (Analysis tab) order updated:
  1. TradingView
  2. Currency Strength Meter
  3. Trending Pairs
  4. RSI Tracker
  5. AI News Analysis
- Desktop: placed in the bottom-left area (row-start 8, col-span 7, row-span 5).
- Component: `src/components/CurrencyStrengthMeter.js`.

#### Trending Pairs Addition

- Added `TrendingPairs` to the desktop top-right column above the RSI Tracker.
- Moved `AINewsAnalysis` to the bottom-right area to balance the layout.
- Component file: `src/components/TrendingParis.jsx` (default export `TrendingPairs`).
- Backend‑driven list: trending symbols are hydrated at startup via REST and updated live via WebSocket.
  - REST: `GET https://api.fxlabsprime.com/trending-pairs?limit=N` (client helper: `trendingService.fetchTrendingPairs`).
  - WS types handled: `trending_pairs`, `trending_update`, `trending_snapshot`.
  - Central cache: `useMarketCacheStore` keeps `trendingSymbols` (ordered) and ensures live subscriptions for those symbols.
  - Display data is pulled live from cache: RSI (current timeframe), Price (bid), Daily %.
  - Manual refresh uses `hydrateTrendingFromREST()`.
  - Display format: Pairs are rendered as `ABC/DEF` (e.g., `BTC/USD`, `EUR/USD`). Broker suffixes like `m` are stripped for UI display only; internal symbols remain unchanged.

#### TradingView Widget replaces Heatmap (Latest)

- Replaced `MultiIndicatorHeatmap` with `TradingViewWidget` on Dashboard.
- Mobile: TradingView widget is hidden (removed from mobile view for better performance).
- Desktop: TradingView occupies the top-left large area (col-span 8, row-span 7).
- Component: `src/components/TradingViewWidget.jsx`.

#### Layout Width Adjustment (Latest)

- Increased desktop widths for analysis sections:
  - TradingViewWidget: `col-span 9` (was 8 → 7 originally)
  - CurrencyStrengthMeter: `col-span 9` (was 8 → 7 originally)
  - Right column (TrendingPairs/RSI and AI News): `col-span 3` (was 4 → 5 originally)

## Code Quality & Linting

- All ESLint warnings are treated as errors. The project is configured to fail on any warning.
- Run linting locally:
  - `npm run lint` (enforces `--max-warnings=0`)
- Key rules like `no-unused-vars`, `no-console` (except `warn`/`error`), and `import/order` are enforced as errors in `.eslintrc.json`.
  - React Hooks rules are enforced as errors:
    - `react-hooks/rules-of-hooks`: Error
    - `react-hooks/exhaustive-deps`: Error

## Alerts Architecture

Frontend config only; backend evaluates and sends notifications.
- Frontend: create/update/delete alerts; no client-side trigger insertion or evaluation.
- Backend: evaluates conditions and inserts trigger rows, then handles delivery.
- See `ALERTS.md` for alert types, fields, and schema.

### Default Alerts for First-Time Users (Latest)

**Automatic Alert Initialization**: When a user logs into the dashboard for the first time, the system automatically creates default alerts to help them get started immediately.

#### Default Alerts Created

1. **RSI Tracker Alert**
   - Timeframe: 4H
   - RSI Period: 14
   - Overbought: 70
   - Oversold: 30
   - Status: Active

2. **Currency Strength Alert**
   - Timeframe: 4H
   - Status: Active

3. **Quantum Analysis (Heatmap) Alert**
   - Pairs: EUR/USD, XAU/USD, BTC/USD
   - Trading Style: Scalper
   - Buy Threshold: 70
   - Sell Threshold: 70
   - Status: Active

#### How It Works

**First-Time User Detection**:
- System tracks initialization status in `user_profiles` table with `default_alerts_initialized` boolean flag
- On first dashboard access, the system checks if user needs initialization
- Distinguishes between:
  - **First-time users** (never initialized): Receive default alerts
  - **Returning users** who deleted all alerts: Do NOT receive alerts again (respects user preference)

**Implementation Details**:
- **Database Schema**: `supabase_user_profiles_schema.sql` - Tracks user initialization status
- **Services**:
  - `src/services/userProfileService.js` - Manages user profile and initialization flag
  - `src/services/defaultAlertsService.js` - Creates and coordinates default alerts
- **Dashboard Integration**: `src/pages/Dashboard.jsx` - Checks and initializes on user login
- **Timing**: Initialization happens automatically when user first loads the dashboard
- **Error Handling**: If any individual alert fails, others still get created; user profile is marked as initialized regardless to prevent retry loops

**Logging**:
- Console logs show initialization status and results for debugging
- Check browser DevTools Console for messages prefixed with `[DefaultAlertsService]` and `[Dashboard]`

#### Benefits

- **Immediate Value**: Users can start receiving alerts right away without manual setup
- **Guided Experience**: Pre-configured alerts showcase the system's capabilities
- **Smart Detection**: System respects user choices and doesn't recreate alerts for users who intentionally removed them
- **Non-intrusive**: Runs silently in the background during dashboard load

## Debug Logging (AI News)
- Browser console now logs AI News data for easier verification:
  - Raw fetched news: total count and items
  - Today (all impacts): count and items
  - Today (HIGH impact): count and items
  - Today (HIGH impact) Upcoming: count and items
  - Today (HIGH impact) Released: count and items
- Open the browser DevTools Console to view these logs as the news feed updates.

### MT5 Parity: RSI on Close (System‑wide)

- Applied price: Close (canonical MT5 default). We do not use Bid/Ask‑only variants for RSI math.
- Bar policy: Closed bars only. The forming candle is never used for RSI.
- Smoothing: Wilder's method (not SMA/EMA).
- Symbols: Always request with the broker suffix (e.g., `EURUSDm`, `XAUUSDm`, `BTCUSDm`).
- Timeframes: `1M, 5M, 15M, 30M, 1H, 4H, 1D, 1W` (alerts remain 5M+).
- Rounding: UI renders to 2 decimals; internal state keeps full precision.

All RSI widgets (Global dashboard, RSI Tracker, RSI Correlation, and Heatmap RSI cell) now derive RSI from closed‑candle `close` prices only and use Wilder smoothing for exact backend/MT5 parity.

### BTCUSD 1M Candle Logging

Detailed console logs are emitted for `BTCUSDm` 1-minute candles inside `src/store/useRSITrackerStore.js` during OHLC updates.

- What is logged per event:
  - Date (UTC), Time (UTC), Open, High, Low, Close
  - RSI(14) with the current forming bar (for reference only)
  - RSI(14) using closed bars only (used in UI and parity checks)
  - Event type: OPEN on new bar; UPDATE while forming; plus a CLOSE line for the previous bar when a new bar opens
- Toggle via feature flag:
  - `REACT_APP_ENABLE_BTCUSD_M1_LOGS=true` to enable (default)
  - `REACT_APP_ENABLE_BTCUSD_M1_LOGS=false` to disable
- View in browser DevTools Console.

Example:
```
[BTCUSDm][1M][CLOSE] 2025-09-30 12:03:00 | O:65000 H:65100 L:64920 C:65080 | RSI14(closed): 58.32
[BTCUSDm][1M][OPEN]  2025-09-30 12:04:00 | O:65080 H:65090 L:65070 C:65085 | RSI14(curr): 57.90 | RSI14(closed): 58.32 { …payload }
```

### BTCUSDm REST and WebSocket Logging (Indicators)

- Purpose: Help verify initial REST snapshots and subsequent WebSocket push updates for `BTCUSDm`.
- Where it logs:
  - REST (Indicators): `src/services/indicatorService.js` after successful fetch.
  - WebSocket (Indicator push): `src/services/websocketMessageRouter.js` when `type === 'indicator_update'` and `symbol === 'BTCUSDm'`.
  - WebSocket (Correlation push): removed (correlation feature removed)
- Log format samples:
  - REST Indicator: `[REST][Indicator][BTCUSDm] indicator=rsi timeframe=4H { requestPairsCount, hasBTCUSDmInRequest, responseItem, responseTs, url }`
  - WS Indicator: `[WS][Indicator][BTCUSDm] timeframe=4H { indicators, barTime, rsi, raw }`
- Notes:
  - These logs are lightweight and only trigger when `BTCUSDm` is in the request or present in the response/push.
  - General WS routing logs remain controlled by `REACT_APP_ENABLE_WS_ROUTER_DEBUG` (see `src/services/websocketMessageRouter.js`).

## Recent Updates
### Enhancement: Navbar centered Dashboard tabs (Latest)
- **Tabs moved to Navbar**: The `Analysis` and `Tools` buttons are now centered in the navbar on the Dashboard
- **Single source of truth**: Navbar receives `activeTab` and `onChangeTab` from `Dashboard` and updates the same state
- **Duplicate removed**: The old tab buttons inside Dashboard content were removed to avoid duplication
- **Files affected**: `src/components/Navbar.jsx`, `src/pages/Dashboard.jsx`

### Cleanup: TradingView Widget built-in controls removed (Latest)
- **Removed**: Currency symbol dropdown, timeframe dropdown, and manual Load button from `TradingViewWidget`
- **Reason**: These controls are already available elsewhere in the app; widget now initializes from props only
- **Behavior**: Widget auto-initializes when props or theme change; no user controls in the widget header
- **Files affected**: `src/components/TradingViewWidget.jsx`, `src/pages/Dashboard.jsx`

### UI Layout: Tools tab grid updated (Latest)
- **Left column**: `LotSizeCalculator` (top) and `MultiIndicatorHeatmap` (bottom) share the same column width
- **Right column**: `MultiTimeAnalysis` now spans the full height for better use of space
- **Files affected**: `src/pages/Dashboard.jsx`
 - Mobile stacking fixed: removed full-height constraints on small screens, set a reasonable fixed height for `MultiIndicatorHeatmap`, and allowed `MultiTimeAnalysis` to shrink-to-fit on mobile while preserving desktop behavior.

### UI Polish: Lot Size Calculator segmented pills (Latest)
- **Compact pills**: Instrument type options (Forex, Commodities, Crypto) redesigned as compact pill-style segmented controls
- **Professional look**: Reduced inner spacing, rounded-full, clear active/hover states
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### UI Polish: Lot Size Calculator premium inputs (Latest)
- **Affixed inputs**: Added currency/percent/unit affixes for clarity (`$`, `%`, `pips`/`price difference`)
- **Premium sizing**: Increased field height, rounded-2xl corners, soft shadow for a polished look
- **Select enhancement**: Custom arrow, consistent height, and disabled state styling; respects live-data availability
- **Responsive spacing**: Increased column gap; labels upgraded to `text-sm` for readability
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Layout: Segmented control centered (Latest)
- **Centered pills**: Instrument type segmented control moved to the second line under title and centered for balance
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Premium Refresh: Lot Size Calculator (Latest)
- **Subtitle added**: Clear description under the title for context
- **Soft panel**: Inputs wrapped in rounded-2xl bordered panel with subtle shadow
- **Results polish**: Stat chips for Risk Amount and Position Size, gradient card, and copy button for calculation
- **Accessibility**: Copy action provides quick feedback with a temporary "Copied" state
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Tweak: Segmented control size reduced (Latest)
- **No scroll on change**: Decreased font size and padding of instrument pills to prevent layout shift/scroll
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### UX: Results displayed inline (Latest)
- **Inline summary**: After clicking Calculate, results now appear inside the form panel right under the buttons, not at the bottom of the widget
- **Copy action**: Calculation remains copyable from the inline summary
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### UX: Premium Results Modal (Latest)
- **Modal presentation**: Clicking Calculate opens a premium modal within the same widget context showing Risk Amount, Position Size, and the full calculation
- **Keyboard/overlay**: Click outside or press `Esc` to close; includes copy-to-clipboard
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### Tweak: Modal scoped to widget (Latest)
- **In-widget modal**: Modal is rendered absolutely within the Lot Size Calculator card so it opens inside the widget bounds
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### UI Enhancement: Lot Size Calculator inline results (Latest)
- **Removed modal**: Results now display directly in the widget below the input form instead of in a modal overlay
- **Compact design**: Reduced spacing and font sizes throughout the component for better space utilization
- **Inline results**: Risk Amount and Position Size shown in compact cards with copy functionality for calculations
- **Responsive sizing**: All form elements, labels, and buttons reduced in size while maintaining usability
- **Files affected**: `src/components/LotSizeCalculator.jsx`

### UI Polish: Heatmap symbol dropdown with flags (Latest)
- **Country flags**: The Multi-Indicator Heatmap symbol dropdown now shows flags for currency pairs (e.g., 🇪🇺 EUR/🇺🇸 USD)
- **Professional look**: Increased min width, aligned flags on both sides of pair label, improved hover/active states
- **Files affected**: `src/components/MultiIndicatorHeatmap.js`

### Enhancement: RSI Tracker Watchlist Button Hidden (Latest)
- **Hidden watchlist functionality**: Watchlist toggle button and add pair modal have been commented out for future use
- **Clean UI**: RSI Tracker now shows only the core RSI analysis functionality without watchlist controls
- **Preserved code**: All watchlist-related code is preserved in comments for future implementation
- **Files affected**: `src/components/RSIOverboughtOversoldTracker.js`
- **Changes**:
  - Commented out watchlist toggle button
  - Commented out add pair button (visible in watchlist mode)
  - Commented out add currency pair modal
  - Commented out related state variables and functions
  - Removed unused imports (List, Plus, Search, X icons)
  - All code preserved for future use

### Enhancement: TradingView Widget Theme Support (Latest)
- **Added dynamic theme support**: TradingView widget now properly adapts to light/dark mode themes
- **Light mode improvements**: Widget displays with white background and proper contrast in light mode
- **Theme integration**: Widget now uses the application's ThemeContext to automatically switch between light and dark themes
- **UI consistency**: All widget controls (symbol selector, interval selector, load button) now match the current theme
- **Files affected**: `src/components/TradingViewWidget.jsx`
- **Features**:
  - Dynamic theme switching based on user preference
  - Proper toolbar background colors for both themes
  - Theme-aware control styling
  - Consistent loading overlay theming

### Fix: Resolved infinite API loop in RSI Tracker causing excessive calls to fxlabsprime.com/indicator (Latest)
- **Problem**: The RSI Tracker component was making API calls to `https://api.fxlabsprime.com/api/indicator` every second due to an infinite loop.
- **Root Cause**: The `useEffect` hook in `RSIOverboughtOversoldTracker.js` had `rsiData` in its dependency array, causing it to re-run every time WebSocket messages updated the RSI data, creating a loop: WebSocket → rsiData update → useEffect → API call → rsiData update → useEffect → API call...
- **Fix**: Removed `rsiData` from the `useEffect` dependency array in `src/components/RSIOverboughtOversoldTracker.js` line 313. The effect only needs to run when `settings.timeframe` or `settings?.autoSubscribeSymbols` change.
- **Impact**: Eliminates excessive API calls (was calling every second), reduces server load, improves performance, and prevents potential rate limiting.

### Fix: Removed legacy ohlcData.get usage causing mount errors (Latest)
- Removed references to `ohlcData.get(...)` that could throw "Cannot read properties of undefined (reading 'get')" during initial mount.
- Components now rely on `tickData` and `indicatorData` maps provided by the live stores:
  - `src/components/HeroSection.jsx`: chart data built from `tickData` only.
  - `src/components/TradingDashboardSection.jsx`: tick-only logging/reads; no `ohlcData` access.

Troubleshooting: If you encounter similar errors, search for `.get(` on possibly undefined maps and either initialize the map in the store or guard before calling `.get`.

### AI News Analysis: Ordering Update (Latest)
- Upcoming tab now shows the soonest events first (ascending by event time).
- Released and All tabs show newest events first (descending by event time).
- Implementation uses `formatNewsLocalDateTime` for consistent timestamp parsing across ISO/original formats.
- Affected file: `src/components/AINewsAnalysis.js`

### Quantum Analysis: Pair Selector Behavior (Latest)
- Pair selector now opens on click and stays open until you click outside the dropdown area.
- Selecting an option updates the symbol but does not auto-close the menu; click outside to close.
- Implemented with a controlled `open` state and document-level outside-click handler, with proper cleanup to avoid leaks.

### RSI Tracker Timeframe Switching (Latest)
- Fixed issue where RSI values appeared stuck on the previous timeframe (e.g., showing 1M while switching to 4H).
 - Root causes:
   - Alias mismatch: recalc gated lookups used only UI keys (e.g., `4H`) while data arrived under server aliases (e.g., `H4`).
   - Forced syncs: debug hard-lock and cross-store sync overwrote the user's chosen timeframe.
 - Fixes:
   - All timeframe lookups now consider aliases (e.g., `4H`/`H4`, `1M`/`M1`).
   - Per-timeframe OHLC buffers are saved under both server key and UI alias for direct keyed access.
   - Removed debug timeframe hard-lock and cross-store timeframe overwrite; UI changes are respected.
   - Selective unsubscribe added: you can unsubscribe a specific timeframe per symbol.
 - Affected files: `src/store/useRSITrackerStore.js`, `src/components/RSIOverboughtOversoldTracker.js`

Usage notes (WebSocket):
- Subscribe per timeframe
  - `{ "action": "subscribe", "symbol": "EURUSDm", "timeframe": "1M", "data_types": ["ohlc"] }`
  - `{ "action": "subscribe", "symbol": "EURUSDm", "timeframe": "4H", "data_types": ["ohlc"] }`
- Unsubscribe specific timeframe
  - `{ "action": "unsubscribe", "symbol": "EURUSDm", "timeframe": "4H" }`
- Unsubscribe all timeframes for a symbol
  - `{ "action": "unsubscribe", "symbol": "EURUSDm" }`


### WebSocket Connection Logs (Latest) - OPTIMIZED WITH TIMESTAMPS
- **Single Connection**: All stores now share one WebSocket connection via `websocketService.js`
- Added explicit browser console logs on WebSocket connect/disconnect for faster debugging:
  - `[WS][Market-v2] Connected/Disconnected ...` with ISO timestamps
  - `[Router][timestamp]` for all message routing logs with browser timestamps
  - `[WS][Market-v2][timestamp]` for connection errors and reconnection attempts
- **Enhanced Logging**: All WebSocket message logs now include browser timestamps for better debugging and performance analysis
- Includes timestamp, close code, and reason (when available).
- **Optimized Architecture**:
  - `src/services/websocketService.js` (NEW - shared connection manager)
  - (Removed) `src/store/useRSICorrelationStore.js`
  - `src/store/useRSITrackerStore.js` (updated to use shared service)
  - `src/store/useMarketStore.js` (updated to use shared service)
  - `src/store/useCurrencyStrengthStore.js` (updated to use shared service)


### Pair Display Formatting (Latest)
- All user-facing pair symbols now display as ABC/DEF (e.g., EUR/USD) for clarity
- Non-breaking UI-only change; internal symbols/storage remain unchanged (e.g., EURUSD, EURUSDm)
- Affected UI: heatmap symbol dropdown, alert pair chips, watchlist/RSI add modals, OHLC/Tick views, TradingView chart watermark/header


Auth headers: When `API_TOKEN` is required server-side, configure the deployment proxy/CDN to inject `X-API-Key` or wrap fetch to include it.
- Ensures real-time updates even when the global connection initiator is not mounted.
- Auto-subscription and on-update recalculations remain unchanged and continue to run on each `ohlc_update`.

### Timeframe Options Update (Latest)
- Removed 1M timeframe from RSI Tracker widgets.
- UI dropdowns exclude 1M; stores also omit 1M from their `timeframes` arrays.
- If previously saved user settings contain `1M`/`M1`, the UI normalizes to `5M` on load to keep selections valid.
- Affected files:
  - `src/store/useRSITrackerStore.js:81`
  - `src/components/RSIOverboughtOversoldTracker.js:719`

- Removed 1M timeframe from Currency Strength Meter.
- Currency Strength dropdown excludes 1M; store also omits 1M from its `timeframes` array, and saved `1M`/`M1` values normalize to `5M` on load.
- Affected files:
  - `src/store/useCurrencyStrengthStore.js`
  - `src/components/CurrencyStrengthMeter.js`

### Success Stories Section Responsive Design (Latest)
- **RESPONSIVE LAYOUT**: Made SuccessStories section fully responsive across all screen sizes
- **BANNER IMPROVEMENTS**: Updated banner with responsive padding, text sizes, and icon sizes
- **STATISTICS CARDS**: Improved grid layout from 1 column to 2 columns on small screens, 3 on medium+
- **CONTENT SPACING**: Added responsive spacing and padding throughout all sections
- **TEXT SCALING**: Implemented responsive text sizes for better mobile readability
- **BUTTON OPTIMIZATION**: Made CTA buttons responsive with proper padding and text sizes
- **COMMUNITY FEATURE**: Updated community feature section to stack vertically on mobile

### Hero Section Spacing Optimization
- **REDUCED LEFT SPACING**: Decreased the left side outer space in hero section content
- **CONTAINER PADDING**: Reduced container padding from `px-4 sm:px-6 lg:px-8` to `px-2 sm:px-4 lg:px-6`
- **GRID GAP**: Reduced grid gap between columns from `gap-20` to `gap-12`
- **IMPROVED LAYOUT**: Better content distribution and reduced excessive white space
- **RESPONSIVE DESIGN**: Maintained responsive behavior across all screen sizes

### Common Background Integration
- **UNIFIED BACKGROUND**: Removed individual backgrounds from HeroSection, GetInTouchSection, and InteractiveFooter
- **HOME PAGE BACKGROUND**: All sections now use the common gradient background defined in Home page
- **CONSISTENT DESIGN**: Ensures visual consistency across all sections with the same background treatment
- **LIGHT/DARK MODE**: Maintains proper theme support while using unified background
- **CLEAN ARCHITECTURE**: Simplified component styling by removing redundant background definitions

### GetInTouchSection Light Mode Support
- **THEME INTEGRATION**: Added proper theme context integration to GetInTouchSection component
- **LIGHT MODE STYLING**: Implemented comprehensive light mode support with appropriate color schemes
- **FORM INPUTS**: Updated all form inputs (name, email, phone, subject, message) to support both light and dark themes
- **CONTACT INFO**: Updated contact information section with theme-aware styling
- **CONSISTENT DESIGN**: Maintained brand consistency with #03c05d accent color across both themes
- **RESPONSIVE LAYOUT**: Preserved responsive design while adding theme support
- **CLEAN STYLING**: Used clean white backgrounds for light mode and maintained dark gray for dark mode

### Trading Dashboard Color Scheme & Animation Cleanup
- **CLEAN COLOR SCHEME**: Replaced excessive gradients with clean white and #03c05d color scheme throughout trading dashboard
- **MINIMAL GRADIENTS**: Removed complex gradient backgrounds, using solid colors for better readability
- **CONSISTENT BRANDING**: Applied #03c05d accent color throughout Master Trader AI section for brand consistency
- **PROFESSIONAL APPEARANCE**: Clean, modern design without visual clutter from excessive gradients
- **SIMPLIFIED ANIMATIONS**: Removed excessive hover animations, pulse effects, and bouncing elements for professional look
- **CLEAN ALERT SECTION**: Simplified alert flow section with minimal animations and clean visual hierarchy
- **BUTTON STYLING**: Updated filter buttons and CTA elements to use solid #03c05d background
- **CARD DESIGN**: Simplified currency pair cards with clean backgrounds and #03c05d accents
- **NOTIFICATION CARDS**: Updated email and telegram notification cards with clean styling
- **PROGRESS BARS**: Updated success probability bars to use #03c05d color scheme
- **NEWS CAROUSEL**: Maintained clean news carousel with simplified color scheme
- **STEP INDICATORS**: Simplified 3-step alert process with clean icons and minimal animations

### Hero Section Color Scheme Update (Latest)
- **CLEAN COLOR SCHEME**: Replaced excessive gradients with clean white and #03c05d color scheme
- **MINIMAL GRADIENTS**: Removed complex gradient text effects, using solid colors for better readability
- **CONSISTENT BRANDING**: Applied #03c05d accent color throughout hero section for brand consistency
- **IMPROVED READABILITY**: White text on dark backgrounds with #03c05d accents for better contrast
- **PROFESSIONAL APPEARANCE**: Clean, modern design without visual clutter from excessive gradients
- **RESPONSIVE DESIGN**: Maintained responsive text sizing while improving color scheme
- **BUTTON STYLING**: Updated CTA buttons to use solid #03c05d background with hover effects
- **TRUST INDICATORS**: Updated trust indicator badges to use #03c05d accent color
- **DASHBOARD CONTAINER**: Simplified dashboard container background while maintaining professional appearance
- **CHART ELEMENTS**: Updated all chart colors and progress bars to use #03c05d for consistency

### AI News: USD Events Pair Filtering (Latest)
- For USD-impact news, the "Suggested Pairs to Watch" now excludes crypto pairs BTCUSD and ETHUSD.
- Change implemented in `src/services/newsService.js` within `analyzeNewsWithAI` to filter these pairs when `impactedCurrency === 'USD'`.

### Alerts Config: Full Pair Support (Latest)
- Pair selectors in Heatmap Alerts and RSI Alerts now include all 32 supported pairs (majors, crosses, metals, crypto).
- Services now map UI symbols to broker symbols generically (adds 'm' suffix), enabling any supported pair without hardcoded mappings.
- Affected files:
  - `src/components/HeatmapAlertConfig.jsx`
  - `src/components/RSITrackerAlertConfig.jsx` (simple single-alert config for RSI Tracker)
  - `src/services/heatmapAlertService.js`
  - `src/services/heatmapTrackerAlertService.js`
  - `src/services/heatmapIndicatorTrackerAlertService.js`
- `supabase_heatmap_indicator_tracker_alerts_schema.sql` to create the simplified heatmap indicator tracker alert tables
  - `src/services/rsiTrackerAlertService.js`
- (Removed) `src/services/rsiCorrelationTrackerAlertService.js`
  - `src/constants/pairs.js` (new shared constants and helpers)

### RSI Calculation: MT5 Parity (Latest)
- RSI in RSI Tracker now matches MetaTrader 5 more closely.
- We use Wilder's RSI (RMA smoothing) computed on CLOSED candles only, mirroring typical MT5 display values.
- Previously we used a simple-average (Cutler's) approach over the last N bars, which could diverge; we also included the forming candle which further skewed values.
- Implementation details:
  - `src/store/useRSITrackerStore.js` now calls `src/utils/calculations.js` `calculateRSI`.
  - Recalc only when a NEW bar is appended (not on in-place updates), eliminating mid-candle churn and cross-widget drift.
  - Require at least `period + 2` raw bars; then drop the last (forming) bar so we always compute with `period + 1` closed candles.
  - Applied price: Close. Timeframe must match (e.g., `4H` vs MT5 `H4`). Symbols map to broker suffixes (e.g., `BTCUSDm`).

- Timestamp normalization for candle alignment: All `ohlc_update` handlers now compare candle identity using normalized timestamps (numeric epoch or ISO) to avoid duplicate bars when the feed alternates between number and string time formats. This prevents RSI drift that previously corrected only after a page refresh.

- Timeframe selection fix (RSI Tracker): The RSI Tracker now explicitly uses the OHLC series for the active timeframe when calculating RSI. Previously, the tracker could fall back to a symbol-level OHLC buffer that did not always reflect the selected timeframe, which was most visible as incorrect 5M values while 4H looked correct. The store now prefers the per-timeframe buffer when available.
  - Change: `src/store/useRSITrackerStore.js: getOhlcForSymbol` returns bars from `ohlcByTimeframe` for the active timeframe.
  - Handled aliasing: UI labels like `5M/4H/1D/1W` are now matched to server keys `M5/H4/D1/W1` during lookup to avoid mismatches that caused wrong RSI on 5M. Subscriptions continue using the UI timeframe labels for compatibility.
  - Added timeframe sanity checks in all stores so RSI never uses stale bars from a previous timeframe after switching. If the active timeframe's bars aren't available yet, the view avoids using mismatched buffers and updates as soon as new bars arrive.
  - Settings persistence load scope: RSI Tracker now loads saved settings only on user change to avoid continuous DB overwrites. This prevents unintended timeframe resets that could desync it from other widgets.

- Closed-candle parity (with graceful fallback): RSI calculations prefer the last completed candle. Now both stores wait for at least `period + 2` raw bars before dropping the last (forming) one; else they return null to avoid inconsistent intrabar values. RSI period is fixed at 14.

### Subscription Scope (Updated)
- Tracker limits subscriptions to watchlist/user actions instead of auto-subscribing a broad major set, keeping updates scoped to what's visible and relevant.
- Minor residual differences can arise from feed and timestamp alignment; in normal conditions the values should be very close to MT5.

### RSI Tracker Display Rules (Oversold/Overbought)
- Default thresholds: Overbought = 70, Oversold = 30. These are user-configurable per dashboard settings.
- Pair classification in lists:
  - Oversold tab shows symbols with RSI ≤ Oversold threshold; sorted by RSI ascending (most oversold first).
  - Overbought tab shows symbols with RSI ≥ Overbought threshold; sorted by RSI descending (most overbought first).
- Cell coloring: RSI values render as green when ≤ Oversold, red when ≥ Overbought, gray otherwise.
- Persistence: On load, saved values from `user_settings` are applied to the tracker; on Save, settings are validated and written back to the database.
- Validation bounds in UI: Overbought is clamped to 50–90; Oversold is clamped to 10–50, with enforced Oversold < Overbought.
- Alert config ranges: RSI Tracker Alerts validate Overbought 60–90 and Oversold 10–40 (alerts use their own stricter ranges).
- Event tracking: The tracker records threshold crossings (crossdown/crossup) and exits from zones for recent RSI points per symbol.

### RSI Tracker: Toggle Shows Current Mode (Latest)
- Fixed the RSI Tracker vs Watchlist toggle button to display the current mode rather than the target mode
- Tooltip now mirrors RSI Correlation Dashboard style: "Switch to … mode"
- Visual styling remains consistent with active state highlighting

### RSI Tracker: Watchlist Manual Add Button (Latest)
- Added a plus button in RSI Tracker header, visible only in Watchlist mode (before the alert bell)
- Clicking it opens an Add Currency Pair modal with search and filtered list
- Uses existing watchlist store for persistence and auto-subscription
- Keeps UI consistent with existing modals and dark mode styling


### Navbar Mobile Menu Spacing Fix (Latest)
- **MOBILE MENU SPACING**: Added responsive right margin to mobile menu icon for better spacing from screen edge
- **RESPONSIVE MARGINS**: Applied `mr-2 sm:mr-4` to mobile menu button for consistent spacing across screen sizes
- **IMPROVED UX**: Mobile menu icon now has proper spacing from the right edge of the screen
- **CONSISTENT DESIGN**: Follows the same responsive margin pattern used throughout the navbar
- **TOUCH FRIENDLY**: Better spacing makes the menu button easier to tap on mobile devices

### Hero Section Responsive Layout Fix (Latest)
- **NAVBAR OVERLAP FIX**: Fixed critical issue where hero section content was going behind navbar on small devices
- **PROPER SPACING**: Replaced negative top margins (`-mt-32 sm:-mt-24`) with positive padding (`pt-16 sm:pt-20 md:pt-24`)
- **MOBILE OPTIMIZATION**: Added proper top padding to account for navbar height on all screen sizes
- **CONTENT VISIBILITY**: Ensured all hero section content is fully visible and accessible on mobile devices
- **RESPONSIVE BREAKPOINTS**: Maintained responsive design while fixing layout issues
- **VISUAL CONSISTENCY**: Hero section now displays properly across all device sizes without content overlap
- **USER EXPERIENCE**: Mobile users can now see the complete hero section content without scrolling issues

### Hero Section Responsive Text Fix
- **RESPONSIVE TEXT SIZING**: Fixed "Market with AI" heading to display properly on medium and small devices
- **IMPROVED BREAKPOINTS**: Updated text sizes from `text-5xl md:text-6xl lg:text-7xl` to `text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl`
- **DESCRIPTION TEXT**: Enhanced description text responsiveness from `text-xl md:text-2xl` to `text-lg sm:text-xl md:text-2xl`
- **FEATURE LIST**: Updated feature list items to use `text-base sm:text-lg` for better mobile readability
- **MASTER TRADER AI**: Fixed Master Trader AI header text sizing for better mobile display
- **RESPONSIVE MARGINS**: Adjusted left margin for "Decode the" text to be responsive across all screen sizes
- **USER EXPERIENCE**: Text now scales appropriately from mobile (3xl) to extra large screens (7xl)

### Dashboard Responsive Layout Fix
- **RESPONSIVE BREAKPOINT FIX**: Fixed dashboard layout to show proper multi-column view on wide screens (1024px+)
- **LAYOUT OPTIMIZATION**: Changed breakpoint from `xl` (1280px) to `lg` (1024px) for desktop layout
- **MOBILE LAYOUT**: Mobile layout now only shows on screens smaller than 1024px
- **DESKTOP LAYOUT**: Desktop 12x12 grid layout now activates at 1024px instead of 1280px
- **USER EXPERIENCE**: Users at 1127px width now see proper multi-column dashboard instead of single-column mobile view
- **QUANTUM ANALYSIS**: Multi-Indicator Heatmap now displays correctly in desktop layout on wide screens
- **AI NEWS ANALYSIS**: AI News Analysis section maintains proper layout across all screen sizes

### Navbar Logo Theme Compatibility (Latest)
- **UNIFIED LOGO**: Now uses single logo (logo1.png) for both light and dark modes
- **DYNAMIC FILTERING**: Applied CSS filters to change logo text color based on theme
- **LIGHT MODE**: Logo text appears black using `filter brightness-0 contrast-100`
- **DARK MODE**: Logo text appears white using `filter brightness-110 contrast-110`
- **SMOOTH TRANSITIONS**: Logo color changes smoothly when switching between themes
- **CONSISTENT BRANDING**: Maintains brand consistency while ensuring readability in both modes

### Dark/Light Mode Toggle
- **THEME TOGGLE BUTTON**: Added dark/light mode toggle button to navbar with Sun/Moon icons
- **THEME CONTEXT**: Implemented React context provider for theme state management
- **PERSISTENT THEME**: Theme preference is saved to localStorage and restored on page load
- **SYSTEM PREFERENCE**: Automatically detects and uses system dark/light mode preference
- **SMOOTH TRANSITIONS**: Added smooth color transitions (0.3s) for theme switching
- **DARK MODE STYLES**: Comprehensive dark mode styling for all components:
  - Dark backgrounds (slate-800, slate-900) for cards and containers
  - Dark borders (slate-700) for component boundaries
  - Light text colors (slate-300, slate-400) for readability
  - Dark scrollbar styling for consistent appearance
- **NAVBAR INTEGRATION**: Theme toggle button positioned in navbar with proper styling
- **TAILWIND CONFIG**: Updated Tailwind config to support class-based dark mode
- **ACCESSIBILITY**: Proper tooltips and ARIA labels for theme toggle button
- **CLEAN IMPLEMENTATION**: Minimal complexity with clean, readable code following best practices
- **LOGIN PAGE THEME SUPPORT**: Both LoginModal and standalone Login page now fully support light/dark theme switching:
  - **LOGIN MODAL**: Updated with comprehensive theme-aware styling for all elements including background, text, inputs, buttons, and error messages
  - **STANDALONE LOGIN PAGE**: Added theme support to the dedicated login page with proper background, form styling, and interactive elements
  - **CONSISTENT THEMING**: Both login interfaces maintain visual consistency with the rest of the application
  - **SMOOTH TRANSITIONS**: All theme changes include smooth color transitions for better user experience
  - **ACCESSIBILITY**: Maintained proper contrast ratios and accessibility standards across both themes
- **MULTI-INDICATOR HEATMAP DARK MODE**: Updated MultiIndicatorHeatmap component with comprehensive dark mode support:
  - Dark mode text colors for all labels, headers, and dropdowns
  - Dark mode backgrounds for dropdown menus and progress bars
  - Dark mode borders and hover states for interactive elements
  - Consistent dark mode styling across all heatmap UI elements
  - Maintained all existing functionality while adding dark mode compatibility
- **AI NEWS ANALYSIS DARK MODE**: Updated AI News Analysis components with comprehensive dark mode support:
  - Dark mode styling for both home page section and dashboard widget
  - Dark mode text colors for all news cards, modal content, and filter tabs
  - Dark mode backgrounds for news cards, modal dialogs, and economic data sections
  - Dark mode borders and hover states for interactive elements
  - Consistent dark mode styling across news analysis UI elements
  - Maintained all existing functionality including countdown timers, AI analysis, and news filtering
- **RSI TRACKER DARK MODE**: Updated RSI Tracker component with comprehensive dark mode support:
  - Dark mode text colors for all table headers, data cells, and labels
  - Dark mode backgrounds for tables, modals, and interactive elements
  - Dark mode styling for tab navigation, watchlist toggle, and settings modal
  - Dark mode borders and hover states for all interactive elements
  - Dark mode styling for empty states and loading indicators
  - Consistent dark mode styling across RSI tracker UI elements
  - Maintained all existing functionality including RSI calculations, watchlist management, and alert configuration
- **RSI TRACKER DARK MODE**: Updated RSI Tracker settings modal with comprehensive dark mode support:
  - Dark mode styling for settings modal background and title
  - Dark mode text colors for all form labels and input fields
  - Dark mode backgrounds and borders for all form inputs and select dropdowns
  - Dark mode styling for calculation mode toggle and header buttons
  - Dark mode hover states for all interactive elements
  - Dark mode styling for modal action buttons (Reset, Cancel, Save)
  - Consistent dark mode styling across RSI tracker settings UI
  - Maintained all existing functionality including watchlist management, alert configuration, and settings persistence
- **HERO SECTION MATRIX CONTAINER**: Completely redesigned Matrix-Style Trading Visual Container to match modern trading dashboard design:
  - Replaced complex chart system with clean "Master Trader AI" dashboard layout
  - Added cryptocurrency analysis cards for Bitcoin and Ethereum with real-time pricing
  - Implemented success probability indicators with progress bars and trend analysis
  - Added market trend section with bearish/bullish indicators and analysis button
  - Updated color scheme to green theme with dark slate backgrounds
  - Maintained responsive design and hover animations
  - Preserved all existing functionality while improving visual appeal and user experience
- **TRADING DASHBOARD MASTER TRADER AI**: Replaced RSI Correlation Dashboard with comprehensive Master Trader AI dashboard:
  - Removed RSI Correlation Dashboard component from Trading Dashboard Section
  - Created full Master Trader AI dashboard with 8 currency pairs grid layout
  - Added cryptocurrency pairs: BTC/USD, ETH/USD, XRP/USD, SOL/USD with success probabilities
  - Added forex pairs: EUR/USD, GBP/USD, XAU/USD, USD/JPY with trend analysis
  - Implemented filter buttons for All Pairs, Crypto, and Forex categories
  - Added success probability progress bars with color-coded indicators (red 35%, yellow 65%)
  - Included trend indicators with up/down arrows and percentage changes
  - Maintained dark theme with green accents and professional styling
  - Preserved all existing Trading Dashboard functionality while enhancing user experience
- **MASTER TRADER AI CARD DESIGN**: Updated Master Trader AI cards to match exact image specifications:
  - Implemented exact card design with dark theme and purple border (rgba(168, 85, 247, 0.5))
  - Added light blue icon background (linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%))
  - Positioned symbol name (BTC/USD) in large white text with trend text below in light red
  - Aligned price (112173.96) on the right in large white text with change percentage and arrow
  - Implemented success probability section with progress bar and percentage display
  - Used red progress bar fill for low probability (35%) and yellow for higher probability (65%)
  - Updated BTC/USD data to match image exactly: price 112173.96, change -0.48%, trend "Weak Downtrend"
  - Maintained responsive grid layout with proper spacing and hover effects
  - Preserved all existing functionality while implementing exact visual design

### Subscription Section Redesign
- **MINIMAL PREMIUM DESIGN**: Completely redesigned subscription section with clean, minimal layout
- **REMOVED VISUAL CLUTTER**: Eliminated excessive animations, floating icons, and background elements
- **STREAMLINED PRICING**: Simplified pricing display with clear visual hierarchy
- **FOCUSED CTA**: Single, compelling call-to-action button for better conversion
- **ENHANCED USER EXPERIENCE**: Cleaner interface that instantly catches user attention
- **PREMIUM AESTHETICS**: Professional design with subtle hover effects and proper spacing
- **SIMPLIFIED FEATURES**: Reduced feature lists to essential items for better readability
- **IMPROVED ACCESSIBILITY**: Better contrast and cleaner typography for enhanced usability

### Multi-Indicator Heatmap UI Enhancement
- **READABLE TIMEFRAME DISPLAY**: Updated timeframe labels from abbreviated format (1M, 5M, 15M) to readable format (1 Min, 5 Min, 15 Mins, 1 Hour, 4 Hours, 1 Day, 1 Week)
- **READABLE INDICATOR NAMES**: Updated indicator labels (EMA21 → EMA 21, EMA50 → EMA 50, EMA200 → EMA 200, UTBOT → UT BOT, IchimokuClone → Ichimoku)
- **ENHANCED BUY/SELL BUTTONS**: Updated Buy/Sell cell buttons with square design, proper colors (#03c05d for Buy, #e03f4c for Sell), and subtle shadow effects
- **REMOVED TF HEADER**: Removed "TF" header from heatmap table for cleaner UI
- **ENHANCED USER EXPERIENCE**: More intuitive timeframe and indicator display without changing business logic
- **UI-ONLY CHANGES**: All business logic and calculations remain unchanged, only visual presentation improved

### Typography Enhancement
- **INTER MEDIUM FONT**: Updated entire dashboard to use Inter Medium (font-weight: 500) for consistent typography
- **GLOBAL FONT APPLICATION**: Applied Inter Medium to all text elements across the dashboard and tabs
- **ENHANCED READABILITY**: Improved text clarity and professional appearance with Inter font family
- **FONT CONFIGURATION**: Updated Tailwind config to include Inter font family with proper weight definitions
- **MONOSPACE PRESERVATION**: Maintained JetBrains Mono for code elements while applying Inter Medium to all other text

### Dashboard Layout Optimization
- **WATCHLIST SECTION REMOVED**: Removed the dedicated watchlist panel from the dashboard layout
- **RSI TRACKER EXPANSION**: RSI Tracker height increased from 4 rows to 6 rows for better content visibility
- **AI NEWS BALANCED**: AI News Analysis adjusted to 6 rows starting from row 7 to prevent congestion
- **IMPROVED LAYOUT**: Better balance between RSI Tracker and AI News sections for optimal user experience
- **INTEGRATED WATCHLIST**: Watchlist functionality is now fully integrated within the RSI Tracker component
- **SPACE EFFICIENCY**: Better utilization of dashboard space with consolidated watchlist management

### RSI Tracker Watchlist Integration
- **WATCHLIST TOGGLE**: Added watchlist button to RSI Tracker header for seamless switching between RSI analysis and watchlist views
- **Integrated Watchlist View**: Content area now converts to watchlist display when watchlist button is clicked
- **Watchlist Management**: Users can view, manage, and remove symbols from their watchlist directly within the RSI Tracker
- **Visual Indicators**: Watchlist button shows active state with blue highlighting when in watchlist mode
- **Tab Navigation**: RSI tracker tabs (Oversold/Overbought) are hidden when in watchlist mode for cleaner interface
- **Real-time Data**: Watchlist items display current RSI values, prices, and daily changes using live market data
- **Enhanced Data Handling**: Proper symbol conversion (EURUSD → EURUSDm) for RSI data lookup
- **Loading States**: Shows loading spinner when removing symbols from watchlist
- **Error Handling**: Graceful handling of missing data with "--" placeholders
- **Remove Functionality**: Users can remove symbols from watchlist with trash icon and loading feedback
- **Empty State**: Clean empty state message when no watchlist items exist with helpful instructions
- **Seamless Integration**: Leverages existing watchlist service and base market store for consistent data management

### RSI Tracker Daily % Calculation
- The RSI Tracker previously showed intrabar change: `(latest close - latest open) / latest open` of the active timeframe. This did not match MT5 Market Watch "Daily Change".
- Updated mechanism: Daily % is now computed from the start-of-day price when available: `(current bid − daily open) / daily open * 100`.
- Data source priority:
  - Use daily timeframe bars (`1D`/`D1`) for the current day's open when present.
  - If daily bars are unavailable, fall back to the first bar of the current day from the active timeframe.
  - As a last resort, fall back to the latest bar's open (approximates change when time data is limited).
- Why it may still differ slightly from MT5: brokers define "day" using server time. If only non-daily bars are available, the fallback uses the bar timestamps to infer the day boundary, which can differ from MT5 server time in edge cases. Subscribing to the daily timeframe eliminates this variance.

### Symbol Formatting Fix: Alert Creation and Updates
- **SYMBOL MAPPING FIX**: Fixed critical issue where UI symbols (EURUSD) were not being converted to broker-specific symbols (EURUSDm) during alert updates
- Updated all three alert services to apply symbol mapping in both `createAlert` and `updateAlert` methods
- **Affected Services**: HeatmapAlertService, RSIAlertService
- **Implementation**: Added symbol mapping logic to `updateAlert` methods to ensure consistency between creation and updates
- **Symbol Mapping**: EURUSD → EURUSDm, GBPUSD → GBPUSDm, USDJPY → USDJPYm, etc.
- **Impact**: Ensures alerts work correctly with backend MT5 data regardless of whether they're created or updated

### Critical Security Fix: RLS Policy Enforcement
- **MAJOR SECURITY IMPROVEMENT**: Fixed critical vulnerability where end users could forge alert triggers
- Updated RLS policies to restrict trigger insertion to alert owners only
- Replaced unsafe `FOR INSERT WITH CHECK (true)` policies with proper ownership verification
- Added comprehensive authorization checks to verify alert ownership before trigger creation
- **Security Impact**: Prevents malicious users from creating fake triggers for other users' alerts
- **Affected Services**: All alert services (Heatmap, RSI, RSI Correlation)
- **Implementation**: Uses existing Python backend infrastructure with secure RLS policies

### Previous Heatmap Alert Service Validation Fix
- Fixed validation trigger issue in `updateAlert` method around lines 339-355
- Expanded `configFields` array to include all fields that `_validateAlertConfig` actually validates
- Ensures proper validation of alert configurations during updates by including all relevant fields
- Fixed issue where validation only triggered for limited subset of fields
- Now properly validates thresholds, notification methods, frequency, indicators, pairs, timeframes, and trading style
- Maintains existing snake_case to camelCase conversion before validation
- Ensures `_validateAlertConfig` receives normalized camelCase config for proper validation
- Prevents validation bypass when updating configuration fields
- Added comprehensive field coverage for alert configuration validation

### UI Warning Fixes (Latest)
- Resolved React warning about mixing border shorthand and non-shorthand properties during rerender.
- MultiIndicator Heatmap buttons no longer toggle between `border` and `borderStyle`; instead use consistent longhand properties: `borderWidth`, `borderStyle`, `borderColor`.
- Affects: `src/components/MultiIndicatorHeatmap.js`

### Previous Heatmap Alert Service Fixes
- Fixed snake_case to camelCase field mapping issue in `updateAlert` method
- Added proper field conversion from database format to service layer format
- Added bidirectional field conversion: camelCase ↔ snake_case
- Implemented field whitelisting for secure database updates
- Fixed all public methods (`createAlert`, `getAlertById`, `getAlerts`, `getActiveAlerts`, `updateAlert`) to return consistent camelCase format
- Prevents database field name mismatches and ensures data integrity
- Fixed PostgREST/Supabase compatibility issue in `acknowledgeTrigger` method
- Removed unsupported joined-table filter from UPDATE operation
- Implemented proper two-step process: UPDATE by trigger ID, then SELECT with joined relation
- Added proper error handling for unauthorized/not found cases
- Relies on RLS (Row Level Security) for authorization enforcement
- Fixed previous values overwrite issue in `processHeatmapData` method
- Implemented deep merge logic to preserve existing pair/timeframe entries
- Added `_deepMergeObjects` helper method for proper object merging
- Handles null/undefined previousValues by treating as empty object before merging
- Prevents data loss when updating only specific pairs/timeframes
- Fixed numeric validation security issue in `rsiAlertService.js`
- Added Number.isFinite guards to prevent NaN/Infinity bypassing validation
- Protected RSI overbought/oversold thresholds, and RFI thresholds (RSI period fixed at 14)
- Ensures proper validation of all numeric range and ordering comparisons
- Prevents silent failures from non-finite numeric values
- Fixed snake_case to camelCase field mapping issue in `rsiAlertService.js`
- Added bidirectional field conversion utilities for RSI alert service
- Implemented proper field normalization before validation
- Updated all public methods to return consistent camelCase format
- Ensures validation and business logic always work with camelCase
- Prevents database field name mismatches in RSI alert operations
- Added Number.isFinite guards to prevent NaN/Infinity bypassing validation
- Protected RSI overbought/oversold thresholds (RSI period fixed at 14)
- Ensures proper validation of all numeric range and ordering comparisons
- Prevents silent failures from non-finite numeric values
- Implemented proper field normalization before validation
- Updated all public methods to return consistent camelCase format
- Ensures validation and business logic always work with camelCase
- Prevents database field name mismatches in RSI alert operations

## Supported Trading Pairs

The FxLabs Prime Trading Dashboard supports **32 trading pairs** across multiple asset classes. All pairs use the broker-specific suffix 'm' (e.g., EURUSDm) for MT5 compatibility.

### Major Currency Pairs (7 pairs)
- **EURUSD** - Euro/US Dollar
- **GBPUSD** - British Pound/US Dollar  
- **USDJPY** - US Dollar/Japanese Yen
- **USDCHF** - US Dollar/Swiss Franc
- **AUDUSD** - Australian Dollar/US Dollar
- **USDCAD** - US Dollar/Canadian Dollar
- **NZDUSD** - New Zealand Dollar/US Dollar

### Cross Currency Pairs (21 pairs)

#### EUR Crosses (6 pairs)
- **EURGBP** - Euro/British Pound
- **EURJPY** - Euro/Japanese Yen
- **EURCHF** - Euro/Swiss Franc
- **EURAUD** - Euro/Australian Dollar
- **EURCAD** - Euro/Canadian Dollar
- **EURNZD** - Euro/New Zealand Dollar

#### GBP Crosses (5 pairs)
- **GBPJPY** - British Pound/Japanese Yen
- **GBPCHF** - British Pound/Swiss Franc
- **GBPAUD** - British Pound/Australian Dollar
- **GBPCAD** - British Pound/Canadian Dollar
- **GBPNZD** - British Pound/New Zealand Dollar

#### AUD Crosses (4 pairs)
- **AUDJPY** - Australian Dollar/Japanese Yen
- **AUDCHF** - Australian Dollar/Swiss Franc
- **AUDCAD** - Australian Dollar/Canadian Dollar
- **AUDNZD** - Australian Dollar/New Zealand Dollar

#### NZD Crosses (3 pairs)
- **NZDJPY** - New Zealand Dollar/Japanese Yen
- **NZDCHF** - New Zealand Dollar/Swiss Franc
- **NZDCAD** - New Zealand Dollar/Canadian Dollar

#### CAD Crosses (2 pairs)
- **CADJPY** - Canadian Dollar/Japanese Yen
- **CADCHF** - Canadian Dollar/Swiss Franc

#### CHF Crosses (1 pair)
- **CHFJPY** - Swiss Franc/Japanese Yen

### Precious Metals (2 pairs)
- **XAUUSD** - Gold/US Dollar
- **XAGUSD** - Silver/US Dollar

### Cryptocurrencies (2 pairs)
- **BTCUSD** - Bitcoin/US Dollar
- **ETHUSD** - Ethereum/US Dollar

### RSI Correlation Pairs

The RSI Correlation Dashboard monitors **17 specific correlation pairs** for mismatch detection:

#### Positive Correlations (10 pairs)
- **EURUSD ↔ GBPUSD** - Major European currencies
- **EURUSD ↔ AUDUSD** - EUR vs commodity currencies
- **EURUSD ↔ NZDUSD** - EUR vs commodity currencies
- **GBPUSD ↔ AUDUSD** - GBP vs commodity currencies
- **AUDUSD ↔ NZDUSD** - Commodity currencies
- **USDCHF ↔ USDJPY** - Safe haven currencies
- **XAUUSD ↔ XAGUSD** - Precious metals correlation
- **XAUUSD ↔ EURUSD** - Gold vs EUR safe haven
- **BTCUSD ↔ ETHUSD** - Cryptocurrency correlation
- **BTCUSD ↔ XAUUSD** - Bitcoin vs Gold correlation

#### Negative Correlations (7 pairs)
- **EURUSD ↔ USDCHF** - EUR vs USD safe haven
- **GBPUSD ↔ USDCHF** - GBP vs USD safe haven
- **USDJPY ↔ EURUSD** - USD vs EUR inverse
- **USDJPY ↔ GBPUSD** - USD vs GBP inverse
- **USDCAD ↔ AUDUSD** - USD vs commodity currencies
- **USDCHF ↔ AUDUSD** - USD safe haven vs commodity
- **XAUUSD ↔ USDJPY** - Gold vs USDJPY inverse

### Pair Usage Across Components

- **RSI Tracker**: All 32 pairs supported for RSI analysis and alerts
- **Multi-Indicator Heatmap**: All 32 pairs available for technical analysis
- **Currency Strength Meter**: All 28 forex pairs (excludes crypto)
- **RSI Correlation Dashboard**: 17 specific correlation pairs
- **AI News Analysis**: All 32 pairs for suggested pair recommendations
- **Watchlist Management**: All 32 pairs available for personal tracking
- **Alert Systems**: All 32 pairs supported across all alert types

### Symbol Format Conversion

The system automatically handles symbol format conversion:
- **UI Display**: EURUSD, GBPUSD, etc. (without suffix)
- **Broker Format**: EURUSDm, GBPUSDm, etc. (with 'm' suffix)
- **Conversion Functions**: `toBrokerSymbol()` and `fromBrokerSymbol()` utilities

## Features

### Core Trading Features
- **Real-time Market Data**: Live forex price feeds with WebSocket connections
- **RSI Analysis**: Overbought/oversold tracking with customizable thresholds
- **Currency Strength Meter**: Multi-view currency strength analysis (Bar Chart, Line Chart, Heatmap)
- **RSI Correlation Dashboard**: Advanced correlation analysis between currency pairs
  - Color legend header removed for a cleaner dashboard header
  - Total Pairs pill removed from header for a cleaner look
  - Mismatch-first sorting and simplified styling to surface divergences quickly
  - Mismatch rules:
    - RSI Threshold mode:
      - Positive pairs: mismatch if one RSI > 70 and the other < 30
      - Negative pairs: mismatch if both RSIs > 70 or both < 30
    - Real Correlation mode:
      - Positive pairs: mismatch if correlation < +25%
      - Negative pairs: mismatch if correlation > -15%
  - Styling:
    - Mismatch cells: green border highlight (thicker border)
    - Non-mismatch cells: white background with grey border
    - Heatmap cells: thicker borders for clearer separation
- **Multi-Indicator Heatmap**: Comprehensive technical analysis dashboard with multiple indicators across timeframes
  - Symbol dropdown now derives from `useRSITrackerStore.settings.autoSubscribeSymbols` (same source as watchlist)
  - **Enhanced Data Validation**: Robust error handling with insufficient data detection
  - **Fallback Calculations**: Graceful degradation when some indicators can't calculate
  - **Real-time Status Indicators**: Visual feedback for data quality and calculation status
  - **Progressive Data Loading**: Shows data progress as market information becomes available
- **AI News Analysis**: AI-powered forex news insights and analysis
  - **Enhanced News Cards**: Suggested pairs to watch displayed directly in news cards
  - **Reorganized Modal Layout**: AI analysis at top, suggested pairs, economic data, and detailed analysis
  - **Tabs UI Consistency**: News filter tabs now match RSI Tracker tabs (compact height, smaller font, tighter badges)
  - **Default Tab (Latest)**: The default AI News tab is "Upcoming". Your selection (Upcoming, Released, or All) is saved to Supabase per user and restored on login.
  - **Bullish/Bearish Styling Update**: Cards now use border-only green/red accents for bullish/bearish effects (no full background fills)
  - **Upcoming Styling Update**: Upcoming news no longer uses yellow backgrounds/borders; appearance matches released news with neutral background. Only bullish/bearish keep green/red borders.
- **Impact Filter Update (Latest)**: AI News now shows only HIGH impact items. Upcoming/Released tabs and counts reflect HIGH impact news only.
  - **Tab Persistence Fix (Latest)**: Selecting the "All" tab no longer reverts to "Released" due to a background tab state load. The store now preserves locally updated sections when merging with database state to avoid race-condition overwrites.
  - **RSI Tabs Cleanup**: Removed icons from RSI Tracker tab headers for a cleaner look
  - **Timezone-Aware Timestamps (Latest)**: News timestamps now respect provided timezones (e.g., ISO like `2025-09-16T21:00:00Z`) and are displayed in the browser's local timezone. Legacy format `YYYY.MM.DD HH:mm:ss` is treated as UTC for consistency.
  - **Today's News Only (Latest)**: The AI News widget now shows only today's news based on the browser's local date (midnight-to-midnight in your timezone). Tabs and counts reflect this filter.
  - **Impacted Currency & Suggested Pairs (Latest)**: Impacted Currency strictly uses backend `currency`. Suggested Pairs derive from the system pair list (Add Currency Pair modal) containing that currency and display as `ABC/DEF` (e.g., `EUR/USD`). Impact now comes from backend `analysis.impact` (high/medium/low/unknown) and effect uses backend `analysis.effect` (normalized for display).
- **Watchlist Management**: Personalized symbol tracking with database persistence
  - Watchlist "Add Currency Pair" derives available pairs from `useRSITrackerStore.settings.autoSubscribeSymbols`
  - To add/remove options, update `autoSubscribeSymbols` in `src/store/useRSITrackerStore.js` (use 'm' suffix)

### User Experience Features
- **Connection Status Dots**: All widgets now show a small top-right status dot (green = connected, red = disconnected). The previous "Connected/Disconnected" badges have been removed for a cleaner header.
- **Tab State Persistence**: All user interface states are automatically saved and restored
  - RSI Threshold settings (overbought/oversold values)
  - RSI Tracker active tab (Oversold/Overbought)
  - Currency Strength Meter view mode (Bar Chart, Line Chart, or Heatmap)
  - AI News Analysis filter (Upcoming or Latest news)
- **Enhanced UI Spacing**: Improved table and component spacing for better readability
  - Unified widget card styling across dashboard (consistent rounded corners and elevation)
  - Proper padding and margins in RSI Tracker tables
  - Consistent spacing across all view modes (table, cards, expandable)
  - Better visual separation between columns and rows
- **Responsive Design**: Optimized for desktop and mobile trading
- **Real-time Updates**: Live data streaming with automatic reconnection
- **User Authentication**: Secure login with Supabase authentication

## Tab State Persistence

The application automatically saves and restores your dashboard preferences:

### Persisted States
1. **RSI Threshold Settings**: Your custom overbought/oversold values (default: 70/30)
2. **RSI Tracker Tab**: Which tab is active (Oversold or Overbought)
3. **RSI Tracker View Mode**: Watchlist vs RSI Tracker view toggle
4. **RSI Correlation Mode**: RSI Threshold vs Real Correlation toggle
5. **Currency Strength View**: Your preferred visualization mode (Bar Chart, Line Chart, or Heatmap)
6. **News Filter**: Your news preference (Upcoming, Released, or All)
   - Default: Upcoming

### How It Works
- All tab states are stored in a `user_state` table in Supabase
- Comprehensive dashboard settings are stored in a `user_settings` table in Supabase
- States are automatically saved when you change tabs or settings
- Your preferences are restored when you log back in
- States are user-specific and secure with Row Level Security (RLS)

## Dashboard Settings Persistence

The application now includes comprehensive dashboard settings persistence:

### Settings Categories
- **Global Settings**: Universal timeframe for all indicators
- **RSI Correlation Settings**: Timeframe, RSI overbought/oversold thresholds, calculation mode (RSI period fixed at 14, correlation window fixed at 50)
- **RSI Tracker Settings**: Timeframe, RSI overbought/oversold thresholds, auto-subscribe symbols (RSI period fixed at 14)
- **Currency Strength Settings**: Timeframe, calculation mode (closed/live), enhanced calculation toggle, auto-subscribe symbols
- **Multi-Indicator Heatmap Settings**: Symbol selection, trading style, indicator weights, new signal display toggle

### Robustness And Partial Updates (Latest)
- Settings upserts now support partial updates safely. When calling `updateUserDashboardSettings`, you may pass only the sections you intend to update (e.g., `{ rsiTracker: { rsiOverbought: 75 } }`). The service merges with existing settings and sensible defaults.
- Defensive defaults added for tab state loading. If `user_state.tab_state` is missing/null, the app falls back to default tab state to prevent undefined reads.
- Affected code:
  - `src/services/userStateService.js`: partial merge handling in `updateUserDashboardSettings`; safer defaults in `getUserTabState`.
  - Components already call `updateUserDashboardSettings` with section-scoped payloads (e.g., RSI Tracker, Currency Strength, Global Settings, Multi-Indicator Heatmap).

### Database Tables
- `user_state`: Basic tab states and UI preferences
- `user_settings`: Comprehensive dashboard settings and configurations

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Fxlabsprime.com_Front_end
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.supabase.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials.

4. **Set up Supabase database**:
- Create a new Supabase project
   - Run the SQL script in `supabase_watchlist_table.sql` to create the `watchlist` table with proper RLS and unique constraints
   - Run the SQL script in `supabase_user_state_table.sql` to create the `user_state` table
   - Run the SQL script in `user_settings_table.sql` to create the `user_settings` table
   - Enable authentication in your Supabase project

5. **Start the development server**:
   ```bash
   npm start
   ```

## Database Setup

### Required Tables

1. **watchlist**: Stores user's watchlist symbols
2. **user_state**: Stores user's tab states and preferences
3. **user_settings**: Stores comprehensive dashboard settings and configurations
4. **heatmap_alerts**: Stores multi-indicator heatmap alert configurations
5. **rsi_tracker_alerts**: Simplified RSI Tracker alert table (single per user)
6. **rsi_correlation_tracker_alerts**: RSI Correlation Dashboard alert table (single per user)

Run the SQL scripts provided:
- `supabase_watchlist_table.sql` to create the watchlist table with proper security policies and `(user_id, symbol)` unique index for upsert
- `supabase_user_state_table.sql` to create the user_state table with proper security policies
- `user_settings_table.sql` to create the user_settings table with proper security policies
- `supabase_heatmap_alerts_schema.sql` to create the heatmap alerts table with proper security policies
- `supabase_heatmap_tracker_alerts_schema.sql` to create the simplified heatmap tracker alert table with proper security policies
- `supabase_rsi_tracker_alerts_schema.sql` to create the simplified RSI tracker alert table with proper security policies
- `supabase_rsi_correlation_tracker_alerts_schema.sql` to create the simplified RSI correlation tracker alert table with proper security policies

## Watchlist Persistence

The app persists the watchlist to Supabase via the `watchlist` table:

- Insert/Upsert: `src/services/watchlistService.js:57` uses `upsert([{ user_id, symbol }], { onConflict: "user_id,symbol" })` to avoid duplicates
- Load: `src/services/watchlistService.js:39` selects rows for the authenticated user, and `src/store/useBaseMarketStore.js:191` loads symbols into the in-memory set
- UI: The RSI Tracker's Watchlist mode reads from the store; on component mount, it now calls `loadWatchlist()` when a user is present

If "watchlist items are not getting stored in Supabase," most often the `watchlist` table or its unique constraint/policies are missing.

### Quick Fix Checklist
- Ensure `supabase_watchlist_table.sql` has been executed in your project
- Verify a unique index exists on `(user_id, symbol)` (required by `onConflict` upsert)
- Confirm RLS policies allow the authenticated user to select/insert/delete their own rows
- Make sure your Supabase URL and anon key are valid in `src/lib/supabaseClient.js`

### Troubleshooting
- If upsert fails with "no unique or exclusion constraint matching the ON CONFLICT specification," create the index: `create unique index on public.watchlist(user_id, symbol);`
- If you don't see items in the RSI Tracker Watchlist view after login, confirm that `loadWatchlist()` runs. It is invoked on mount in `src/components/RSIOverboughtOversoldTracker.js` when a user is available.

## Architecture

### State Management
- **Zustand Stores**: Modular state management for different dashboard components
- **Base Market Store**: Shared functionality including tab state persistence
- **Component Stores**: Specialized stores for RSI, Currency Strength, and Correlation data

### Services
- **UserStateService**: Manages user tab state persistence
- **WidgetTabRetentionService**: Manages persistent storage of widget states and configurations for tools tab widgets (NEW)
- **WatchlistService**: Handles watchlist database operations
- **NewsService**: Fetches and analyzes forex news with AI
- **RSITrackerAlertService**: Manages single RSI Tracker alert configuration (CRUD only)
- (Removed) RSICorrelationTrackerAlertService
- **HeatmapTrackerAlertService**: Manages All-in-One heatmap alert configuration (CRUD only)
- **HeatmapIndicatorTrackerAlertService**: Manages custom indicator alert configuration (CRUD only)
  - Note: Custom Indicator Alert timeframe options exclude `1M` (1 minute).

### Components
- **Dashboard**: Main trading interface with responsive grid layout
- **RSI Components**: Overbought/oversold tracking and correlation analysis
- **Currency Strength Meter**: Multi-view currency strength visualization
- **Multi-Indicator Heatmap**: Advanced technical analysis dashboard
- **AI News Analysis**: Intelligent news filtering and analysis
- **HeatmapAlertConfig**: Alert configuration modal for multi-indicator heatmap alerts
- **RSITrackerAlertConfig**: Alert configuration modal for RSI Tracker alert (single)
- (Removed) RSICorrelationTrackerAlertConfig
- **HeatmapTrackerAlertConfig**: Alert configuration modal for heatmap tracker alert (single)

## Widget Tab Retention Service

The **Widget Tab Retention Service** provides persistent storage of widget states and configurations for tools tab widgets in the dashboard, ensuring user preferences are preserved across sessions.

### Overview

This service manages the persistence of widget states for the tools tab, including:
- **LotSizeCalculator**: Position sizing inputs and calculation history
- **MultiTimeAnalysis**: Forex market timezone converter preferences (timezone, 24hr format, slider position)
- **MultiIndicatorHeatmap**: Trading style, indicator weights, and display preferences

### Features

- ✅ **Automatic State Persistence**: Widget states are saved automatically to Supabase
- ✅ **User-Specific Storage**: Each user has isolated widget states with Row Level Security (RLS)
- ✅ **Default State Management**: Intelligent fallback to default states when no saved data exists
- ✅ **Partial Updates**: Update specific widget fields without affecting others
- ✅ **Batch Operations**: Save/load multiple widget states simultaneously
- ✅ **Widget Configuration**: Separate configuration storage for widget-specific settings
- ✅ **Visibility Control**: Show/hide widgets dynamically
- ✅ **Display Order**: Customize widget arrangement
- ✅ **Import/Export**: Backup and restore widget states as JSON
- ✅ **Dashboard Tab Retention**: Remember active tab (Analysis/Tools) across sessions

### Dashboard Active Tab Retention (Latest)

The service now supports **Dashboard-level settings**, including retention of the active tab (Analysis or Tools) across sessions. This ensures users return to the same view they were using.

#### How It Works

1. **Initial Load**: When a user opens the dashboard, the last active tab is loaded from Supabase
2. **Auto-Save**: When switching between Analysis and Tools tabs, the selection is automatically saved
3. **Default Behavior**: First-time users or logged-out users see the Analysis tab by default

#### Usage in Dashboard

```javascript
// The Dashboard component automatically handles tab retention
import widgetTabRetentionService from '../services/widgetTabRetentionService';

// Get active tab (called on mount)
const activeTab = await widgetTabRetentionService.getActiveTab(); // Returns: 'analysis' or 'tools'

// Set active tab (called on tab change)
await widgetTabRetentionService.setActiveTab('tools');

// Get all dashboard settings (includes active tab and more)
const settings = await widgetTabRetentionService.getDashboardSettings();
// Returns: { activeTab: 'analysis', lastVisited: '2025-10-09T...' }

// Update dashboard settings
await widgetTabRetentionService.updateDashboardSettings({
  activeTab: 'tools',
  lastVisited: new Date().toISOString()
});

// Reset to default
await widgetTabRetentionService.resetDashboardSettings();
```

#### Dashboard Settings Structure

```javascript
{
  activeTab: 'analysis',  // 'analysis' or 'tools'
  lastVisited: null       // ISO timestamp of last visit
}
```

#### Available Tab Constants

```javascript
import { WidgetTabRetentionService } from '../services/widgetTabRetentionService';

WidgetTabRetentionService.TABS.ANALYSIS  // 'analysis'
WidgetTabRetentionService.TABS.TOOLS     // 'tools'
```

#### Integration

The feature is automatically integrated into the Dashboard component (`src/pages/Dashboard.jsx`):
- Tab state is loaded from Supabase on component mount
- Tab changes are automatically persisted to Supabase
- Uses the same `widget_tab_retention` table with a special widget name: `DashboardSettings`

**Files affected:**
- `src/services/widgetTabRetentionService.js`: Added tab retention methods
- `src/pages/Dashboard.jsx`: Integrated auto-save/load functionality

### Database Schema

The service uses the `widget_tab_retention` table in Supabase:

```sql
CREATE TABLE widget_tab_retention (
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
```

**Key Features:**
- Unique constraint on `(user_id, widget_name)` ensures one state per widget per user
- JSONB storage for flexible state structures
- Automatic timestamp updates via trigger
- Comprehensive RLS policies for data isolation
- Indexed for fast queries

### Usage Examples

#### Basic Operations

```javascript
import widgetTabRetentionService from '../services/widgetTabRetentionService';

// Get widget state
const lotSizeState = await widgetTabRetentionService.getWidgetState('LotSizeCalculator');

// Save widget state
await widgetTabRetentionService.saveWidgetState('LotSizeCalculator', {
  accountBalance: '10000',
  riskPercentage: '2',
  stopLoss: '50',
  instrumentType: 'forex',
  currencyPair: 'EURUSDm'
});

// Partial update
await widgetTabRetentionService.updateWidgetState('MultiTimeAnalysis', {
  selectedSymbol: 'GBPUSDm'
});

// Reset to defaults
await widgetTabRetentionService.resetWidgetState('MultiIndicatorHeatmap');
```

#### Batch Operations

```javascript
// Get all widget states
const allStates = await widgetTabRetentionService.getAllWidgetStates();

// Save multiple widgets
await widgetTabRetentionService.saveAllWidgetStates({
  LotSizeCalculator: { accountBalance: '10000' },
  MultiTimeAnalysis: { selectedSymbol: 'EURUSDm' }
});
```

#### Advanced Features

```javascript
// Widget visibility
await widgetTabRetentionService.setWidgetVisibility('LotSizeCalculator', false);

// Display order
await widgetTabRetentionService.setWidgetDisplayOrder('MultiTimeAnalysis', 1);

// Widget configuration
await widgetTabRetentionService.updateWidgetConfig('MultiIndicatorHeatmap', {
  autoUpdate: true,
  updateInterval: 30000
});

// Export/Import
const backup = await widgetTabRetentionService.exportWidgetStates();
await widgetTabRetentionService.importWidgetStates(backup);
```

### Widget State Structures

#### LotSizeCalculator
```javascript
{
  accountBalance: '',
  riskPercentage: '',
  stopLoss: '',
  instrumentType: 'forex',
  currencyPair: 'EURUSDm',
  contractSize: '100000',
  pipValue: '10',
  currentPrice: '',
  lastCalculation: null
}
```

#### MultiTimeAnalysis (Forex Market Timezone Converter)
The draggable time bar now initializes at the current time for the selected timezone and automatically advances every minute. While you are actively dragging, auto-follow pauses; on the next minute tick after you release, it realigns to the current time.

```javascript
{
  selectedTimezone: 'Asia/Kolkata',
  is24Hour: false,
  // sliderPosition is initialized from current time and auto-updates each minute
}
```

#### MultiIndicatorHeatmap
```javascript
{
  selectedSymbol: 'EURUSDm',
  tradingStyle: 'swingTrader',
  indicatorWeight: 'equal',
  showNewSignals: true,
  visibleIndicators: ['rsi', 'macd', 'ema', 'sma'],
  timeframeFilter: 'all'
}
```

### API Reference

#### Widget State Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getWidgetState(widgetName)` | Get widget state | Widget name | Promise\<Object\> |
| `saveWidgetState(widgetName, state, options)` | Save widget state | Widget name, state, options | Promise\<Object\> |
| `updateWidgetState(widgetName, partialState)` | Partial update | Widget name, partial state | Promise\<Object\> |
| `getAllWidgetStates()` | Get all states | None | Promise\<Object\> |
| `saveAllWidgetStates(states)` | Batch save | States object | Promise\<Array\> |
| `resetWidgetState(widgetName)` | Reset to default | Widget name | Promise\<Boolean\> |
| `resetAllWidgetStates()` | Reset all | None | Promise\<Number\> |
| `setWidgetVisibility(widgetName, isVisible)` | Set visibility | Widget name, boolean | Promise\<Object\> |
| `setWidgetDisplayOrder(widgetName, order)` | Set order | Widget name, number | Promise\<Object\> |
| `updateWidgetConfig(widgetName, config)` | Update config | Widget name, config | Promise\<Object\> |
| `getWidgetConfig(widgetName)` | Get config | Widget name | Promise\<Object\> |
| `exportWidgetStates()` | Export as JSON | None | Promise\<String\> |
| `importWidgetStates(json)` | Import from JSON | JSON string | Promise\<Array\> |

#### Dashboard Tab Methods (New)

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getActiveTab()` | Get active tab | None | Promise\<String\> |
| `setActiveTab(tabName)` | Set active tab | Tab name ('analysis'\|'tools') | Promise\<Object\> |
| `getDashboardSettings()` | Get dashboard settings | None | Promise\<Object\> |
| `updateDashboardSettings(settings)` | Update dashboard settings | Partial settings object | Promise\<Object\> |
| `resetDashboardSettings()` | Reset dashboard settings | None | Promise\<Boolean\> |

### Security

- **Row Level Security (RLS)**: Users can only access their own widget states
- **Authentication Required**: All operations require valid user session
- **Data Isolation**: Strict user_id filtering prevents cross-user data access
- **Input Validation**: Widget names are validated against allowed widgets

### SQL Setup

To set up the database schema, run the SQL file:

```bash
psql -h <host> -U <user> -d <database> -f supabase_widget_tab_retention_schema.sql
```

Or execute via Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase_widget_tab_retention_schema.sql`
3. Click "Run" to execute

### Files

- **SQL Schema**: `/supabase_widget_tab_retention_schema.sql`
- **Service**: `/src/services/widgetTabRetentionService.js`

## Multi-Indicator Heatmap

### Data Reliability Improvements (Latest Update)

The Multi-Indicator Heatmap has been significantly enhanced for proper market working:

#### **Data Validation & Error Handling**
- **Progressive Data Loading**: Shows data collection progress (e.g., "47/50 bars")
- **Insufficient Data Detection**: Clearly indicates when more market data is needed
- **Real-time Status Indicators**: Visual feedback for each indicator's calculation status
- **Graceful Error Handling**: Comprehensive error catching with meaningful messages

#### **Fallback Calculations**
- **Smart Fallbacks**: When primary calculations fail, uses simplified fallback methods
- **Partial Data Support**: Works with limited data while waiting for full dataset
- **Status Indicators**: Visual cues showing which indicators are using fallbacks (⚡ icon)
- **Error Explanations**: Specific error messages (e.g., "Need 200+ bars" for EMA200)

#### **Enhanced Debug Logging**
- **Grouped Console Logs**: Organized debug information for better troubleshooting
- **Signal Success Tracking**: Shows which indicators calculated successfully
- **Data Quality Assessment**: Real-time evaluation of data quality (POOR/FAIR/GOOD/EXCELLENT)
- **Calculation Performance**: Tracks calculation errors and warnings

#### **Visual Improvements**
- **Data Progress Bar**: Shows loading progress for insufficient data scenarios
- **Status Icons**: Different icons for working (signals), fallback (F), and failed (...) indicators
- **Color-coded Cells**: Clear distinction between calculated, fallback, and missing data
- **Error Tooltips**: Detailed hover information explaining calculation status
 - **Neutral Labeling**: Cells that previously showed `0%` now display `Neutral`
 - **Buy/Sell Styling**: Buy/Sell visuals use border-only (green/red) with no icons for a cleaner look
 - **Recommendation Cards**: In the All in One Currency Indicator header, we now display "Recommendation: Buy (xx%)" as a larger primary card and the opposite side "Sell (yy%)" as a smaller, lower-opacity card. The larger card dynamically reflects whichever side (Buy/Sell) has the higher percentage.
 - **All in One Currency UI Tweaks (Latest)**:
   - Primary recommendation card uses a thicker border and subtle elevation for emphasis
   - Heatmap cells no longer increase depth on hover (no hover shadow)
   - Table headers cleaned up: icons removed; headers are bold and slightly larger; timeframe labels (1M, 5M, etc.) are not bold

#### **Market Data Requirements**
- **EMA21**: Requires 21+ bars for accurate calculation
- **EMA50**: Requires 50+ bars for accurate calculation  
- **EMA200**: Requires 200+ bars for accurate calculation
- **MACD**: Requires 26+ bars for accurate calculation
- **RSI**: Requires 15+ bars for accurate calculation
- **UTBOT**: Requires 20+ bars for accurate calculation
- **Ichimoku**: Requires 52+ bars for accurate calculation

The system now provides reliable trading signals even with partial data and clearly communicates data quality to users.

### Core Features

The Multi-Indicator Heatmap provides a comprehensive view of technical analysis signals across multiple timeframes and indicators using standardized indicator logic.

### Features
- **Timeframes**: 5M, 15M, 30M, 1H, 4H, 1D
- **Indicators**: EMA21, EMA50, EMA200, MACD, RSI, UT Bot, Ichimoku Clone
- **Scoring System**: Weighted scoring based on timeframe importance
- **Final Score**: Aggregated score from -100 to +100
- **Buy/Sell Probability**: Percentage-based probability calculations
- **New Signal Detection**: Highlights fresh signals with orange dots (K=3 lookback)
- **Enhanced Dropdowns**: Professional dropdown interface with:
  - **Symbol Selection**: Major currency pairs with flag emojis (EUR/USD, GBP/USD, USD/JPY, etc.)
  - **Trading Style**: Scalper, Swing Trader with visual icons
  - **Weight Configuration**: Equal or Trend-Tilted indicator weights
  - **New Signal Toggle**: ON/OFF switch for new signal highlighting
- **Settings Persistence**: All user preferences are automatically saved and restored:
  - **Symbol Selection**: Remembers your preferred currency pair
  - **Trading Style**: Saves your trading approach (Scalper/Swing Trader)
  - **Indicator Weights**: Remembers your weight preference (Equal/Trend-Tilted)
  - **New Signal Display**: Saves your preference for showing new signal indicators

### Indicator Logic (Simple & Consistent)

#### EMA (21, 50, 200) Indicators
- **Buy Signal**: `close > EMA AND EMA slope ≥ 0`
- **Sell Signal**: `close < EMA AND EMA slope ≤ 0`
- **Neutral**: Otherwise
- **New Signal**: Price crossed EMA within last K bars (default K=3)

#### MACD Indicator
- **MACD Line**: `EMA(12) - EMA(26)`
- **Signal Line**: `EMA(MACD, 9)`
- **Buy Signal**: `MACD > Signal AND MACD > 0`
- **Sell Signal**: `MACD < Signal AND MACD < 0`
- **Neutral**: Otherwise
- **New Signal**: MACD/Signal cross within last K bars (default K=3)

### How It Works
1. **Data Collection**: Uses existing WebSocket data from RSI Tracker store
2. **Indicator Calculation**: Calculates all indicators for each timeframe using candle close prices
3. **Signal Detection**: Determines buy/sell/neutral signals based on standardized logic
4. **New Signal Detection**: Identifies fresh signals within last K bars (default K=3)
5. **Per-Cell Scoring**: Each indicator gets a score (-1.25 to +1.25) with new-signal boost
6. **Trading Style Selection**: Choose from Scalper or Swing Trader styles via enhanced dropdown
7. **Timeframe Weighting**: Weights vary by trading style (sum to 1.0 for each style)
8. **Final Aggregation**: Weighted average creates final score and probabilities

### Enhanced User Interface
- **Professional Dropdowns**: All controls use consistent styling with hover effects and focus states
- **Visual Indicators**: Icons and emojis for better user experience (⚡ for Scalper, 📈 for Swing, etc.)
- **Responsive Design**: Dropdowns adapt to different screen sizes with proper spacing
- **State Management**: All dropdown selections are properly managed and persist during session
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Automatic Persistence**: All user settings are automatically saved to the database and restored on login

### Per-Cell Scoring System

Each cell in the heatmap is converted to a numeric score using the following logic:

#### Base Scoring
- **Buy Signal**: +1
- **Sell Signal**: -1  
- **Neutral Signal**: 0

#### New-Signal Boost
- **New Buy Signal**: +1 + 0.25 = +1.25
- **New Sell Signal**: -1 - 0.25 = -1.25
- **New Neutral Signal**: 0 (no boost applied)

#### Score Clamping
All scores are clamped to the range **[-1.25, +1.25]**

#### Visual Representation
- **Strong Buy (1.0-1.25)**: Dark green background
- **Buy+ (0.5-1.0)**: Medium green background  
- **Buy (0-0.5)**: Light green background
- **Neutral (0)**: Gray background
- **Sell (0 to -0.5)**: Light red background
- **Sell+ (-0.5 to -1.0)**: Medium red background
- **Strong Sell (-1.0 to -1.25)**: Dark red background
- **New Signal**: Orange dot indicator (+0.25 boost)

### Trading Style Weights

Weights per style sum to 1.0 and determine which timeframes are most important for each trading approach:

| Timeframe | Scalper | Swing Trader |
|-----------|---------|--------------|
| 5M        | 0.30    | 0.00         |
| 15M       | 0.30    | 0.25       | 0.00         |
| 30M       | 0.20    | 0.25       | 0.10         |
| 1H        | 0.15    | 0.25       | 0.25         |
| 4H        | 0.05    | 0.10       | 0.35         |
| 1D        | 0.00    | 0.05       | 0.30         |

#### Trading Style Focus Areas:
- **Scalper**: Focus on 5M-30M timeframes (80% weight on short-term)
- **Swing Trader**: Focus on 1H-1D timeframes (90% weight on long-term)

### Indicator Weights

Two simple options for weighting indicators (both sum to 1.0):

| Indicator | Equal (Default) | Trend-Tilted |
|-----------|----------------|--------------|
| EMA21     | 0.1429         | 0.10         |
| EMA50     | 0.1429         | 0.10         |
| EMA200    | 0.1429         | 0.15         |
| MACD      | 0.1429         | 0.15         |
| RSI       | 0.1429         | 0.10         |
| UTBOT     | 0.1429         | 0.15         |
| IchimokuClone | 0.1429     | 0.25         |

#### Weight Options:
- **Equal**: All indicators have equal weight (0.1429 each)
- **Trend-Tilted**: Higher weight on trend-following indicators (EMA200, MACD, UTBOT, IchimokuClone)

### Indicator Logic (Simple & Consistent)

#### EMA (21, 50, 200) Indicators
- **Buy Signal**: `close > EMA AND EMA slope ≥ 0`
- **Sell Signal**: `close < EMA AND EMA slope ≤ 0`
- **Neutral**: Otherwise
- **New Signal**: Price crossed EMA within last K bars (default K=3)

#### MACD Indicator
- **MACD Line**: `EMA(12) - EMA(26)`
- **Signal Line**: `EMA(MACD, 9)`
- **Buy Signal**: `MACD > Signal AND MACD > 0`
- **Sell Signal**: `MACD < Signal AND MACD < 0`
- **Neutral**: Otherwise
- **New Signal**: MACD/Signal cross within last K bars (default K=3)

#### RSI (14) Indicator
- **Buy Signal**: `RSI ≤ 30` (oversold)
- **Sell Signal**: `RSI ≥ 70` (overbought)
- **Neutral**: Otherwise
- **New Signal**: RSI crosses 30 or 70 within last K bars (default K=3)

#### UTBOT (ATR-based flip)
- **Baseline**: `EMA(close, 50)`
- **ATR**: `ATR(10)`
- **Long Stop**: `Baseline - 3.0 × ATR`
- **Short Stop**: `Baseline + 3.0 × ATR`
- **Buy Signal**: Flip to Long or close breaks above short stop
- **Sell Signal**: Flip to Short or close breaks below long stop
- **Neutral**: Otherwise
- **New Signal**: Any flip within last K bars (default K=3)

#### IchimokuClone
- **Tenkan**: Midpoint of high/low over 9 periods
- **Kijun**: Midpoint over 26 periods
- **Span A**: `(Tenkan + Kijun) / 2` shifted +26
- **Span B**: Midpoint over 52 periods shifted +26
- **Chikou**: Close shifted -26
- **Decision Priority** (first hit wins):
  1. **Price vs Cloud**: above = Buy, below = Sell, inside = Neutral
  2. **Tenkan/Kijun Cross**: Tenkan > Kijun = Buy; < = Sell
  3. **Cloud Color**: SpanA > SpanB = Buy; < = Sell
  4. **Chikou vs Price**: above = Buy; below = Sell; else Neutral
- **New Signal**: Tenkan/Kijun cross or price cloud breakout within last K bars (default K=3)

## Multi-Indicator Heatmap Alerts

### Overview

The Multi-Indicator Heatmap Alerts system allows users to create intelligent trading alerts based on the comprehensive technical analysis provided by the Multi-Indicator Heatmap. Users can configure alerts for specific trading pairs, timeframes, and indicators with customizable thresholds.

### Key Features

#### Alert Configuration
- **Trading Pairs**: Select up to 3 currency pairs for monitoring
- **Timeframes**: Choose up to 3 timeframes from 1M to 1W
- **Indicators**: Select 1-2 indicators from the 7 available (EMA21, EMA50, EMA200, MACD, RSI, UTBOT, IchimokuClone)
- **Trading Style**: Choose from Scalper or Swing Trader approaches
- **Thresholds**: Set custom buy (70-100) and sell (0-30) thresholds
- **Notification Methods**: Browser notifications, email, or push notifications
- **Alert Frequency**: Once only, every 5/15/30 minutes, or hourly

#### Alert Management
- **Create Alerts**: Easy-to-use interface for setting up new alerts
- **Edit Alerts**: Modify existing alert configurations
- **Toggle Active/Inactive**: Enable or disable alerts without deleting them
- **Delete Alerts**: Remove alerts you no longer need
- **Alert History**: View all triggered alerts with market data at trigger time

#### Trigger Tracking
- **Real-time Monitoring**: Alerts are checked against live market data
- **Trigger History**: Complete record of when alerts fired
- **Market Data Snapshot**: Store actual indicator values at trigger time
- **Acknowledgment System**: Mark triggers as acknowledged to track follow-up
- **Statistics Dashboard**: View alert performance and trigger frequency

### Database Schema

#### heatmap_alerts Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- alert_name: VARCHAR(100) - User-defined alert name
- is_active: BOOLEAN - Alert status
- pairs: JSONB - Array of up to 3 trading pairs
- timeframes: JSONB - Array of up to 3 timeframes
- selected_indicators: JSONB - Array of 1-2 selected indicators
- trading_style: VARCHAR(20) - Trading approach (scalper/swingTrader)
- buy_threshold_min/max: INTEGER - Buy alert thresholds (70-100)
- sell_threshold_min/max: INTEGER - Sell alert thresholds (0-30)
- notification_methods: JSONB - Array of notification types
- alert_frequency: VARCHAR(20) - How often to check for triggers
- created_at/updated_at: TIMESTAMP - Audit timestamps
- last_triggered_at: TIMESTAMP - Last trigger time
```

#### heatmap_alerts Table
```sql
- id: UUID (Primary Key)
- alert_id: UUID (Foreign Key to heatmap_alerts)
- triggered_at: TIMESTAMP - When the alert fired
- trigger_type: VARCHAR(10) - 'buy' or 'sell'
- trigger_score: INTEGER - Actual score that triggered the alert
- symbol: VARCHAR(20) - Trading pair that triggered
- timeframe: VARCHAR(10) - Timeframe that triggered
- indicators_data: JSONB - Market data snapshot at trigger
- is_acknowledged: BOOLEAN - User acknowledgment status
- acknowledged_at: TIMESTAMP - When user acknowledged
```

### Service API

The `HeatmapAlertService` provides a comprehensive API for managing alerts:

#### Core Methods
- `createAlert(config)` - Create a new alert with validation
- `getAlerts()` - Get all user alerts
- `getActiveAlerts()` - Get only active alerts
- `updateAlert(id, updates)` - Update alert configuration
- `deleteAlert(id)` - Remove an alert
- `toggleAlert(id, isActive)` - Enable/disable alerts

#### Trigger Management
- `getAlertTriggers(alertId, options)` - Get triggers for specific alert
- `acknowledgeTrigger(triggerId)` - Mark trigger as acknowledged
- `getRecentTriggers(options)` - Get recent triggers across all alerts
- `getAlertStats()` - Get alert statistics and performance metrics

#### Configuration Helpers
- `getDefaultAlertConfig()` - Get default configuration template
- `getAlertOptions()` - Get available options for dropdowns
- `_validateAlertConfig(config)` - Validate alert configuration

### Security Features

#### Row Level Security (RLS)
- **User Isolation**: Users can only access their own alerts and triggers
- **Secure Policies**: Comprehensive RLS policies for all operations
- **Audit Trail**: Complete tracking of alert creation and modifications

#### Data Validation
- **Input Validation**: Comprehensive validation of all alert parameters
- **Constraint Checking**: Database-level constraints for data integrity
- **Error Handling**: Graceful error handling with meaningful messages

### Usage Examples

#### Creating a Basic RSI Alert
```javascript
const alertConfig = {
  alertName: "EURUSD RSI Alert",
  pairs: ["EURUSD"],
  timeframes: ["1H"],
  selectedIndicators: ["RSI"],
  tradingStyle: "swingTrader",
  buyThresholdMin: 70,
  buyThresholdMax: 100,
  sellThresholdMin: 0,
  sellThresholdMax: 30,
  notificationMethods: ["browser"],
  alertFrequency: "once"
};

const alert = await heatmapAlertService.createAlert(alertConfig);
```

#### Creating a Multi-Pair MACD Alert
```javascript
const alertConfig = {
  alertName: "Major Pairs MACD Alert",
  pairs: ["EURUSD", "GBPUSD", "USDJPY"],
  timeframes: ["4H", "1D"],
  selectedIndicators: ["MACD", "EMA200"],
  tradingStyle: "swingTrader",
  buyThresholdMin: 75,
  buyThresholdMax: 100,
  sellThresholdMin: 0,
  sellThresholdMax: 25,
  notificationMethods: ["browser", "email"],
  alertFrequency: "every_hour"
};

const alert = await heatmapAlertService.createAlert(alertConfig);
```

### Integration with Multi-Indicator Heatmap

The alert system integrates seamlessly with the existing Multi-Indicator Heatmap:

1. **Shared Data Source**: Uses the same market data and calculations
2. **Consistent Logic**: Applies the same indicator logic and scoring system
3. **Real-time Updates**: Monitors live market data for trigger conditions
4. **Unified Interface**: Alert management integrated into the navbar bell icon
5. **Visual Indicators**: Bell icon shows active alert count as a badge
6. **Modal Interface**: Clean, user-friendly alert configuration modal

### Future Enhancements

- **Backend Integration**: Real-time alert checking and notification delivery
- **Advanced Filters**: More sophisticated trigger conditions
- **Performance Analytics**: Detailed alert performance metrics
- **Mobile Notifications**: Push notification support
- **Alert Templates**: Pre-configured alert templates for common strategies

## RSI Tracker Alerts

### Overview

The RSI Tracker Alert is simplified to a single per-user alert. Users choose exactly one timeframe and RSI thresholds; no pair selection is required as the backend checks all pairs and triggers when any crosses the thresholds.

### Key Features

#### Alert Configuration
- **Timeframe**: Choose exactly one timeframe (5M to 1W)
- **RSI Settings**: RSI overbought (60-90), oversold (10-40) (RSI period fixed at 14)
- **Pairs**: Not required; all pairs are evaluated by the backend

#### Alert Management
- **Create Alerts**: Easy-to-use interface for setting up new RSI alerts
- **Edit Alerts**: Modify existing alert configurations
- **Toggle Active/Inactive**: Enable or disable alerts without deleting them
- **Delete Alerts**: Remove alerts you no longer need
- **Alert History**: View all triggered alerts with RSI data at trigger time

#### Trigger Tracking
- **Real-time Monitoring**: Alerts are checked against closed-candle RSI data
- **Trigger History**: Complete record of when alerts fired
- **RSI Data Snapshot**: Store actual RSI values, RFI scores, and price data at trigger time
- **Event Tracking**: Track RSI crossup/crossdown events with detailed data
- **Acknowledgment System**: Mark triggers as acknowledged to track follow-up
- **Statistics Dashboard**: View alert performance and trigger frequency

### Database Schema

#### rsi_tracker_alerts Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- alert_name: VARCHAR(100) - User-defined alert name
- is_active: BOOLEAN - Alert status
- pairs: JSONB - Array of up to 5 trading pairs
- timeframes: JSONB - Array of 1-3 timeframes for RSI analysis
- rsi_period: INTEGER - RSI calculation period (fixed at 14)
- rsi_overbought_threshold: INTEGER - Overbought threshold (60-90)
- rsi_oversold_threshold: INTEGER - Oversold threshold (10-40)
- alert_conditions: JSONB - Array of alert conditions
- rfi_strong_threshold: DECIMAL(3,2) - Strong RFI threshold (0.50-1.00)
- rfi_moderate_threshold: DECIMAL(3,2) - Moderate RFI threshold (0.30-0.80)
- notification_methods: JSONB - Array of notification types
- alert_frequency: VARCHAR(20) - How often to check for triggers
- created_at/updated_at: TIMESTAMP - Audit timestamps
- last_triggered_at: TIMESTAMP - Last trigger time
```

#### rsi_tracker_alerts Table
```sql
- id: UUID (Primary Key)
- alert_id: UUID (Foreign Key to rsi_tracker_alerts)
- triggered_at: TIMESTAMP - When the alert fired
- trigger_condition: VARCHAR(20) - Specific condition that triggered
- symbol: VARCHAR(20) - Trading pair that triggered
- timeframe: VARCHAR(10) - Timeframe that triggered
- rsi_value: DECIMAL(5,2) - Actual RSI value at trigger
- rfi_score: DECIMAL(3,2) - RFI score at trigger (if applicable)
- current_price: DECIMAL(10,5) - Current price at trigger
- price_change_percent: DECIMAL(5,2) - Price change percentage
- rsi_event_data: JSONB - Additional data for RSI events
- is_acknowledged: BOOLEAN - User acknowledgment status
- acknowledged_at: TIMESTAMP - When user acknowledged
```

### Service API

The `RSITrackerAlertService` provides a minimal API for the single RSI tracker alert:

`saveAlert(config)` (upsert), `getAlert()`, `getActiveAlert()`, `toggleActive(isActive)`, `deleteAlert()`

### Security Features

#### Row Level Security (RLS)
- **User Isolation**: Users can only access their own RSI alerts and triggers
- **Secure Policies**: Comprehensive RLS policies for all operations
- **Audit Trail**: Complete tracking of alert creation and modifications

#### Data Validation
- **Input Validation**: Comprehensive validation of all alert parameters
- **Constraint Checking**: Database-level constraints for data integrity
- **Error Handling**: Graceful error handling with meaningful messages

### Usage Examples

#### Creating an RSI Tracker Alert
```javascript
const alertConfig = {
  timeframe: '4H',
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  isActive: true
};

const alert = await rsiTrackerAlertService.saveAlert(alertConfig);
```

#### Creating a Multi-Pair Multi-Timeframe RFI Alert
```javascript
const alertConfig = {
  alertName: "Major Pairs RFI Alert",
  pairs: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"],
  timeframes: ["1H", "4H", "1D"],
  rsiPeriod: 14,
  rsiOverboughtThreshold: 75,
  rsiOversoldThreshold: 25,
  alertConditions: ["rfi_strong", "rfi_moderate", "crossup", "crossdown"],
  rfiStrongThreshold: 0.85,
  rfiModerateThreshold: 0.65,
  notificationMethods: ["browser", "email"],
  alertFrequency: "every_hour"
};

const alert = await rsiTrackerAlertService.saveAlert(alertConfig);
```

### Integration with RSI Tracker

The alert system integrates seamlessly with the existing RSI Tracker:

1. **Shared Data Source**: Uses the same RSI calculations and RFI analysis
2. **Consistent Logic**: Applies the same RSI thresholds and period logic (RSI period fixed at 14)
3. **Real-time Updates**: Monitors closed-candle RSI data for trigger conditions
4. **Unified Interface**: Alert management integrated into the navbar with orange TrendingUp icon
5. **Visual Indicators**: TrendingUp icon shows active RSI alert count as a badge
6. **Modal Interface**: Clean, user-friendly RSI alert configuration modal

### Supported Trading Pairs

The RSI Tracker Alerts support all **32 trading pairs** available in the system. See the [Supported Trading Pairs](#supported-trading-pairs) section above for the complete list of major currency pairs, cross pairs, precious metals, and cryptocurrencies.

### Future Enhancements

- **Backend Integration**: Real-time RSI alert checking and notification delivery
- **Advanced RSI Analysis**: More sophisticated RSI-based trigger conditions
- **Performance Analytics**: Detailed RSI alert performance metrics
- **Mobile Notifications**: Push notification support
- **Alert Templates**: Pre-configured RSI alert templates for common strategies
- **Multi-timeframe Analysis**: Cross-timeframe RSI analysis alerts

## RSI Correlation Alerts

### Overview

The RSI Correlation Alert is simplified to a single per-user alert. Users choose one timeframe and a mode: RSI Threshold or Real Correlation. No pair selection is required; the backend checks all correlation pairs and triggers on mismatches based on the chosen mode.

### Key Features

#### Alert Configuration
- **Timeframe**: Choose exactly one timeframe (5M to 1W)
- **Mode**: `rsi_threshold` or `real_correlation`
- **RSI Settings** (RSI mode): RSI overbought (60-90), oversold (10-40) (RSI period fixed at 14)
- **Correlation Settings** (Real mode): Rolling correlation window (fixed at 50)
- **Pairs**: Not required; all correlation pairs are evaluated by the backend

#### Alert Management
- **Create Alerts**: Easy-to-use interface for setting up new RSI correlation alerts
- **Edit Alerts**: Modify existing alert configurations
- **Toggle Active/Inactive**: Enable or disable alerts without deleting them
- **Delete Alerts**: Remove alerts you no longer need
- **Alert History**: View all triggered alerts with correlation data at trigger time

#### Trigger Tracking
- **Real-time Monitoring**: Alerts are checked against closed-candle RSI correlation data
- **Trigger History**: Complete record of when alerts fired
- **Correlation Data Snapshot**: Store actual RSI values, correlation coefficients, and market data at trigger time
- **Mode-specific Tracking**: Different data captured for RSI Threshold vs Real Correlation modes
- **Acknowledgment System**: Mark triggers as acknowledged to track follow-up
- **Statistics Dashboard**: View alert performance and trigger frequency

### Database Schema

#### rsi_correlation_tracker_alerts Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- alert_name: VARCHAR(100) - User-defined alert name
- is_active: BOOLEAN - Alert status
- correlation_pairs: JSONB - Array of up to 5 correlation pairs
- timeframes: JSONB - Array of 1-3 timeframes for correlation analysis
- calculation_mode: VARCHAR(20) - 'rsi_threshold' | 'real_correlation'
- rsi_period: INTEGER - RSI calculation period (fixed at 14)
- rsi_overbought_threshold: INTEGER - Overbought threshold (60-90)
- rsi_oversold_threshold: INTEGER - Oversold threshold (10-40)
- correlation_window: INTEGER - Rolling correlation window (fixed at 50)
- alert_conditions: JSONB - Array of alert conditions based on mode
- strong_correlation_threshold: DECIMAL(3,2) - Strong correlation threshold (0.50-1.00)
- moderate_correlation_threshold: DECIMAL(3,2) - Moderate correlation threshold (0.20-0.80)
- weak_correlation_threshold: DECIMAL(3,2) - Weak correlation threshold (0.05-0.50)
- notification_methods: JSONB - Array of notification types
- alert_frequency: VARCHAR(20) - How often to check for triggers
- created_at/updated_at: TIMESTAMP - Audit timestamps
- last_triggered_at: TIMESTAMP - Last trigger time
```

#### rsi_correlation_tracker_alerts Table
```sql
- id: UUID (Primary Key)
- alert_id: UUID (Foreign Key to rsi_correlation_tracker_alerts)
- triggered_at: TIMESTAMP - When the alert fired
- trigger_condition: VARCHAR(30) - Specific condition that triggered
- calculation_mode: VARCHAR(20) - Mode used when trigger occurred
- pair_symbol1: VARCHAR(20) - First symbol in the pair
- pair_symbol2: VARCHAR(20) - Second symbol in the pair
- timeframe: VARCHAR(10) - Timeframe that triggered
- rsi1_value: DECIMAL(5,2) - RSI value for first symbol (RSI mode)
- rsi2_value: DECIMAL(5,2) - RSI value for second symbol (RSI mode)
- correlation_value: DECIMAL(4,3) - Actual correlation value (-1 to 1) (Real mode)
- correlation_strength: VARCHAR(10) - 'weak', 'moderate', 'strong' (Real mode)
- correlation_trend: VARCHAR(15) - 'increasing', 'decreasing', 'stable' (Real mode)
- trigger_data: JSONB - Additional data specific to trigger condition
- is_acknowledged: BOOLEAN - User acknowledgment status
- acknowledged_at: TIMESTAMP - When user acknowledged
```

### Service API

The `RSICorrelationTrackerAlertService` provides a minimal API for the single RSI correlation tracker alert:

`saveAlert(config)` (upsert), `getAlert()`, `getActiveAlert()`, `toggleActive(isActive)`, `deleteAlert()`

### Security Features

#### Row Level Security (RLS)
- **User Isolation**: Users can only access their own RSI correlation alerts and triggers
- **Secure Policies**: Comprehensive RLS policies for all operations
- **Audit Trail**: Complete tracking of alert creation and modifications

#### Data Validation
- **Input Validation**: Comprehensive validation of all alert parameters
- **Constraint Checking**: Database-level constraints for data integrity
- **Error Handling**: Graceful error handling with meaningful messages

### Usage Examples

#### Creating an RSI Correlation Alert
```javascript
const alertConfig = {
  timeframe: '4H',
  mode: 'rsi_threshold', // or 'real_correlation'
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  correlationWindow: 50,
  isActive: true
};

const alert = await rsiCorrelationTrackerAlertService.saveAlert(alertConfig);
```

#### Creating a Real Correlation Alert
```javascript
const alertConfig = {
  alertName: "Major Pairs Correlation Alert",
  correlationPairs: [["EURUSD", "GBPUSD"], ["USDJPY", "EURUSD"], ["XAUUSD", "XAGUSD"]],
  timeframes: ["1H", "4H", "1D"],
  calculationMode: "real_correlation",
  correlationWindow: 50,
  alertConditions: ["strong_positive", "strong_negative", "correlation_break"],
  strongCorrelationThreshold: 0.75,
  moderateCorrelationThreshold: 0.35,
  weakCorrelationThreshold: 0.20,
  notificationMethods: ["browser", "email"],
  alertFrequency: "every_hour"
};

const alert = await rsiCorrelationTrackerAlertService.saveAlert(alertConfig);
```

### Integration with RSI Correlation Dashboard

The alert system integrates seamlessly with the existing RSI Correlation Dashboard:

1. **Shared Data Source**: Uses the same RSI calculations and correlation analysis
2. **Consistent Logic**: Applies the same RSI thresholds, period, and correlation windows (RSI period fixed at 14, correlation window fixed at 50)
3. **Real-time Updates**: Monitors closed-candle RSI correlation data for trigger conditions
4. **Unified Interface**: Alert management integrated into the navbar with purple BarChart3 icon
5. **Visual Indicators**: BarChart3 icon shows active RSI correlation alert count as a badge
6. **Modal Interface**: Clean, user-friendly RSI correlation alert configuration modal

### Supported Correlation Pairs

The RSI Correlation Alerts support all **17 correlation pairs** available in the RSI Correlation Dashboard. See the [RSI Correlation Pairs](#rsi-correlation-pairs) section above for the complete list of positive and negative correlation pairs.

### Calculation Modes

#### RSI Threshold Mode
- **Purpose**: Traditional RSI overbought/oversold mismatch detection
- **Logic**: 
  - Positive pairs: Mismatch if one RSI > 70 and other < 30
  - Negative pairs: Mismatch if both RSIs > 70 or both < 30
- **Conditions**: positive_mismatch, negative_mismatch, neutral_break
- **Data Captured**: RSI values, current prices, mismatch type

#### Real Correlation Mode
- **Purpose**: Actual correlation coefficient analysis using Pearson correlation
- **Logic**: 
  - Strong correlation: |correlation| ≥ threshold
  - Moderate correlation: threshold > |correlation| ≥ moderate threshold
  - Weak correlation: |correlation| < weak threshold
- **Conditions**: strong_positive, strong_negative, weak_correlation, correlation_break
- **Data Captured**: Correlation value, strength classification, trend direction

### Future Enhancements

- **Backend Integration**: Real-time RSI correlation alert checking and notification delivery
- **Advanced Correlation Analysis**: More sophisticated correlation-based trigger conditions
- **Performance Analytics**: Detailed RSI correlation alert performance metrics
- **Mobile Notifications**: Push notification support
- **Alert Templates**: Pre-configured RSI correlation alert templates for common strategies
- **Cross-timeframe Correlation**: Multi-timeframe correlation analysis alerts

## Alerts: Consolidated Spec Parity (Frontend + Supabase)

- Heatmap (Type A + gating): normalized `trading_style` to `scalper|day|swing`; added `min_alignment` (0–5), `cooldown_minutes` (1–1440), `gate_by_buy_now` (bool), `gate_buy_min` (default 60), `gate_sell_max` (default 40). UI now shows single Buy ≥ and Sell ≤ thresholds and advanced controls for alignment, cooldown, and Buy Now % gate. Notification method limited to `email`.
- RSI OB/OS: conditions limited to `overbought`/`oversold` (crossing + 1‑bar confirmation). Added `bar_policy` (default `close`), `trigger_policy` (default `crossing`), `only_new_bars` (3), `confirmation_bars` (1), `cooldown_minutes` (30), `timezone` (default `Asia/Kolkata`), `quiet_start_local`, `quiet_end_local`. UI adds Bar Timing, Cooldown, Quiet Hours, Timezone. Notification method limited to `email`.
- RSI Correlation: no schema change required; notification method limited to `email`.
- Global safeguard: services enforce max 3 unique tracked symbols/user across Heatmap, RSI, and RSI Correlation (correlation counts both symbols in each pair). Creation blocked with a friendly remaining‑slots message.
- Supabase schema files: additive ALTERs included in `supabase_heatmap_tracker_alerts_schema.sql` and `supabase_rsi_correlation_tracker_alerts_schema.sql` to match backend spec; added helpful indexes.

## Accessibility

The application follows web accessibility best practices to ensure an inclusive user experience:

### Navigation Accessibility
- **Semantic Navigation**: Uses proper `<Link>` components for navigation instead of buttons where appropriate
- **Button Types**: All interactive buttons include proper `type="button"` attributes to prevent form submission
- **Accessible Labels**: Icon-only buttons include descriptive `aria-label` attributes for screen readers
- **Keyboard Navigation**: All interactive elements support keyboard navigation and focus management

### Recent Accessibility Improvements
- **Navbar Navigation**: Dashboard navigation now uses semantic `<Link>` components for better accessibility and open-in-new-tab behavior
- **Notification Button**: Added proper `type="button"` and `aria-label="View notifications"` to the notification icon button
- **AI News Modal**: Enhanced modal accessibility with proper dialog semantics, ARIA attributes, and z-index management
  - Fixed z-index conflict with sticky navbar (raised to z-[60])
  - Added `role="dialog"`, `aria-modal="true"`, and proper labeling
  - Implemented safe-area inset support for mobile devices
  - Added accessible close button with proper labeling
- **Screen Reader Support**: All interactive elements now provide meaningful labels for assistive technologies

#### Lint-driven label associations (Latest)
- Resolved `jsx-a11y/label-has-associated-control` CI errors by:
  - Replacing non-control section labels with `<p>` elements
  - Adding `id` to inputs/selects and matching `label htmlFor`
- Cleaned unused variables flagged by `no-unused-vars` where applicable
- Affected files: `HeatmapIndicatorTrackerAlertConfig.jsx`, `HeatmapTrackerAlertConfig.jsx`, `RSICorrelationTrackerAlertConfig.jsx`, `RSITrackerAlertConfig.jsx`

## Security

- **Row Level Security (RLS)**: All user data is protected with Supabase RLS policies
- **Authentication**: Secure user authentication with Supabase Auth
- **Data Isolation**: Each user can only access their own data
- **XSS Protection**: HTML sanitization implemented to prevent cross-site scripting attacks

### Auth Call Optimization (Frontend)

To reduce excessive calls to `https://<project>.supabase.co/auth/v1/user`, the frontend now relies on `supabase.auth.getSession()` wherever possible instead of `supabase.auth.getUser()`.

- Updated services: `watchlistService.js`, `usertabService.js`, `userStateService.js`, `heatmapTrackerAlertService.js`, `heatmapIndicatorTrackerAlertService.js`, `rsiTrackerAlertService.js`, `rsiCorrelationTrackerAlertService.js`
- Rationale: `getSession()` returns cached session data (including `user`) without always hitting the `/auth/v1/user` endpoint, significantly reducing redundant auth traffic during dashboard usage.
- Behavior: If no session exists, methods return `null` and callers surface appropriate auth-required errors.

Additionally, duplicate calls to load user tab state were removed from `TradingDashboardSection.jsx` (centralized in `pages/Dashboard.jsx`).
  - Custom sanitization function for AI news analysis content
  - Escapes all HTML entities before applying safe transformations
  - Whitelists only `<strong>` and `<br />` tags for formatting
- **Enhanced Authentication**: Robust token parsing for password reset flows
  - Handles both URL search parameters and hash fragments
  - Hash parameters take precedence over search parameters
  - Ensures Supabase authentication tokens are correctly parsed regardless of URL format

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

### Interim: Config Changes Show Blank Until Data Arrives (Temporary)
- When configuration changes (e.g., timeframe or calculation mode), RSI widgets reset their in-memory maps to avoid stale values.
- UI will show placeholders (e.g., "--" or "Calculating…") until fresh data arrives via WebSocket.
- TODO in code: a future API snapshot fetch will pre-populate data immediately after config changes while the stream catches up.
- Affected files:
  - `src/store/useRSITrackerStore.js` (timeframe change resets `rsiData`, `rsiDataByTimeframe`, `indicatorData`, `tickData`)
  - `src/store/useRSICorrelationStore.js` (timeframe change resets `correlationStatus`, `realCorrelationData`, `rsiData`, `rsiDataByTimeframe`, `indicatorData`, `tickData`)
  - `src/components/RSIOverboughtOversoldTracker.js` (TODO note on settings save)
  - `src/components/RSICorrelationDashboard.js` (TODO note on settings save and mode toggle)

### REST Snapshot + WebSocket Merge (Initial Load Pattern)
- On mount and on configuration changes (e.g., timeframe), fetch initial closed‑bar indicator values via REST:
  - Service: `src/services/indicatorService.js` → `GET https://api.fxlabsprime.com/api/indicator?indicator=rsi&timeframe=<TF>&pairs=...`
  - Stores/components merge the snapshot into `rsiData` to render immediately, then live `indicator_update` pushes keep it fresh.
- Implementations:
  - `src/store/useRSITrackerStore.js`: fires REST snapshot on timeframe change; populates `rsiData`.
  - (Removed) correlation store behavior
  - `src/components/RSIOverboughtOversoldTracker.js`: fetches on mount/timeframe change.
  - (Removed) correlation dashboard component
- Notes:
  - REST base is fixed: `https://api.fxlabsprime.com` (no env vars required).

#### Currency Strength Heatmap (Server‑driven)
- WebSocket v2 additionally broadcasts `currency_strength_update` per timeframe:
  - Sample payload:
    ```json
    { "type": "currency_strength_update", "timeframe": "5M", "data": { "bar_time": 1696229940000, "strength": { "USD": 62.3, "EUR": 47.8, "GBP": 55.1, "JPY": 41.2, "AUD": 58.9, "CAD": 52.4, "CHF": 44.7, "NZD": 37.5 } } }
    ```
- Store: `src/store/useCurrencyStrengthStore.js`
  - Subscribes to `currency_strength_update` and updates `currencyStrength` when the incoming timeframe matches the selected timeframe.
  - Exposes `setCurrencyStrengthSnapshot(strengthObject, timeframe)` to apply REST snapshots.
- Widget: `src/components/CurrencyStrengthMeter.js`
  - Ensures WS connection on mount via `connect()`.
  - On mount and timeframe change, fetches REST snapshot:
    `GET /api/indicator?indicator=currency_strength&timeframe=<TF>` and applies via `setCurrencyStrengthSnapshot`.
  - Live updates arrive via WebSocket. A single REST snapshot is fetched on mount/timeframe change; no periodic REST auto-refresh.
  - UI renders strongest top 4 and weakest bottom 4 currencies (no duplicates). This guarantees exactly 4 tiles per row while still covering all 8 majors across both rows.

### Quantum Analysis Integration (Server‑only)
- Quantum values are sourced solely from the backend; no client‑side calculations.
- REST: `GET /api/indicator?indicator=quantum&timeframe=5M&pairs=...` is called during cache hydration.
- WebSocket: `quantum_update` messages are processed and stored under `useMarketCacheStore.quantumBySymbol`.
- UI:
  - `src/components/MultiIndicatorHeatmap.js` reads `overall[scalper|swingtrader]` for Buy/Sell percentages.
  - Per‑timeframe cells use `per_timeframe[TF].indicators[EMA21|EMA50|EMA200|MACD|RSI|UTBOT|ICHIMOKU].signal`.
  - No fallback computations; if data is missing, the cell shows a placeholder.
  - **Responsive Layout**: Desktop displays indicator grid and Trading Meter side-by-side; mobile displays them stacked vertically with the meter below the grid for better visibility on smaller screens.
  - **Mobile Scroll Fix**: The mobile view now includes both the header (indicator names) and body rows within the same scrollable table container, ensuring synchronized horizontal scrolling. Previously, the header and body were in separate tables, causing them to scroll independently.

### RSI Correlation Dashboard: Blank/Neutral Render Troubleshooting
- Ensure WebSocket connection established (see console `[WS][Market-v2] Connected`).
- The dashboard now derives pair statuses from `rsiData`; placeholders will show until initial snapshot or first `indicator_update` arrives.
- After timeframe/mode changes, a REST snapshot is fetched and `recalculateAllRsi()` runs to populate statuses immediately.

## Centralized Market Cache (2025-10)

We introduced a centralized cache to ensure instant, consistent data across all widgets and timeframes:

- Store: `src/store/useMarketCacheStore.js`
- Behavior:
  - On dashboard launch, it prefetches RSI snapshots for all supported pairs across supported timeframes and fetches pricing for all supported pairs (single REST round for each timeframe + pricing).
  - It registers to the shared WebSocket and continuously updates the cache on `initial_indicators`, `indicator_update`, and `ticks` messages.
  - Cache is persisted into `sessionStorage` for instant reloads and minimized REST usage.
  - It broadcasts hydrated snapshots into existing RSI stores so current widgets render directly from the cache without extra API calls.

Consumers continue using existing selectors in `useRSITrackerStore`.

Wiring:

- `src/pages/Dashboard.jsx` initializes the market cache on mount.
- `src/store/useRSITrackerStore.js` hydrates from the cache immediately on timeframe changes instead of issuing new REST calls.

Benefits:

- Faster UI when switching timeframes/indicators
- Reduced REST chatter; one-time hydration then live WS updates
- Consistent data across widgets from a single source of truth

## Optimized Startup Sequence (Latest)
- WebSocket first: a single shared connection is established via `src/services/websocketService.js` and routed by `src/services/websocketMessageRouter.js`.
- Restore state from Supabase: user tab and dashboard settings are restored early via `src/services/userStateService.js` through `useBaseMarketStore`.
- Minimal REST hydration only when needed:
  - `useMarketCacheStore.initialize()` no longer triggers bulk REST hydration on startup.
  - A new method `hydrateQuantumForSymbol(symbol)` fetches a tiny quantum snapshot for the currently viewed symbol to quickly power `MultiIndicatorHeatmap`.
  - Additional data is filled by live WebSocket updates.
- Defer AI News fetches: news polling starts after the global connection state is CONNECTED (see `src/pages/Dashboard.jsx`). Duplicate news fetches in `TradingDashboardSection.jsx` have been removed to avoid redundant network calls.

### Files touched
- `src/store/useMarketCacheStore.js`: removed heavy startup REST hydration; added `hydrateQuantumForSymbol`.
- `src/components/MultiIndicatorHeatmap.js`: triggers minimal quantum hydration when the current symbol has no cached quantum data.
- `src/pages/Dashboard.jsx`: delays news polling until after connection is established.
- `src/components/TradingDashboardSection.jsx`: removed duplicate news polling.

### Environment hints
- `REACT_APP_WEBSOCKET_URL` can override the default WS endpoint. Router debug: `REACT_APP_ENABLE_WS_ROUTER_DEBUG=true`.

## Currency Strength Alerts (New)
- Purpose: Adds alert support for the Currency Strength Meter with a simple, single configuration: `timeframe`.
- UI:
  - Open the Currency Strength widget and click the bell icon to configure.
  - Component: `src/components/CurrencyStrengthAlertConfig.jsx`
- Service:
  - `src/services/currencyStrengthAlertService.js`
  - Methods: `getAlert`, `getActiveAlert`, `saveAlert`, `toggleActive`, `deleteAlert`.
  - Validation: timeframe must be one of `['5M','15M','30M','1H','4H','1D','1W']`.
- Store integration:
  - On save, the store timeframe in `useCurrencyStrengthStore` is updated to match alert config.
- Schema (Supabase):
  - `supabase_currency_strength_tracker_alerts_schema.sql`
  - Table: `currency_strength_tracker_alerts(user_id, user_email, timeframe, is_active, created_at, updated_at)` with 1 row per user.
### Startup UX: Immediate WebSocket + Faster Loader Close (Latest)
- WebSocket connection now boots immediately at app start (in `src/index.js`) instead of waiting for the Dashboard/user session.
- The loader modal closes as soon as the first WebSocket connection is established.
  - `marketCache` store now reports connection to the global dashboard state via `updateDashboardConnection`.
  - This ensures the modal disappears promptly on WS open, before other background tasks run.
- Non-critical REST calls are deferred until after WS connect to avoid blocking startup:
  - Trending pairs snapshot fetch moved to `marketCache` connection callback.
  - News polling already starts only after global status becomes `CONNECTED`.
- You can tune the connection timeout using `REACT_APP_WS_CONNECT_TIMEOUT_MS` (default 15000ms).

### Favicon Update (Latest)
- **Updated favicon**: Replaced the previous SVG-based favicon with the new `fxlabs_favicon.png` image
- **File location**: `public/fxlabs_favicon.png`
- **HTML references**: Updated `public/index.html` to reference the new favicon file
- **Browser compatibility**: PNG format ensures better cross-browser compatibility and visual quality
