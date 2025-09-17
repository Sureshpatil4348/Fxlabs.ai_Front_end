# FX Labs Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Features

### Core Trading Features
- **Real-time Market Data**: Live forex price feeds with WebSocket connections
- **RSI Analysis**: Overbought/oversold tracking with customizable thresholds
- **Currency Strength Meter**: Multi-view currency strength analysis (Bar Chart, Line Chart, Heatmap)
- **RSI Correlation Dashboard**: Advanced correlation analysis between currency pairs
- **Multi-Indicator Heatmap**: Comprehensive technical analysis dashboard with multiple indicators across timeframes
  - Symbol dropdown now derives from `useRSITrackerStore.settings.autoSubscribeSymbols` (same source as watchlist)
  - **Enhanced Data Validation**: Robust error handling with insufficient data detection
  - **Fallback Calculations**: Graceful degradation when some indicators can't calculate
  - **Real-time Status Indicators**: Visual feedback for data quality and calculation status
  - **Progressive Data Loading**: Shows data progress as market information becomes available
- **AI News Analysis**: AI-powered forex news insights and analysis
  - **Enhanced News Cards**: Suggested pairs to watch displayed directly in news cards
  - **Reorganized Modal Layout**: AI analysis at top, suggested pairs, economic data, and detailed analysis
- **Watchlist Management**: Personalized symbol tracking with database persistence
  - Watchlist "Add Currency Pair" derives available pairs from `useRSITrackerStore.settings.autoSubscribeSymbols`
  - To add/remove options, update `autoSubscribeSymbols` in `src/store/useRSITrackerStore.js` (use 'm' suffix)

### User Experience Features
- **Tab State Persistence**: All user interface states are automatically saved and restored
  - RSI Threshold settings (overbought/oversold values)
  - RSI Tracker active tab (Oversold/Overbought)
  - Currency Strength Meter view mode (Bar Chart, Line Chart, or Heatmap)
  - AI News Analysis filter (Upcoming or Latest news)
- **Enhanced UI Spacing**: Improved table and component spacing for better readability
  - Proper padding and margins in RSI Tracker tables
  - Consistent spacing across all view modes (table, cards, expandable)
  - Better visual separation between columns and rows
- **Responsive Design**: Optimized for desktop and mobile trading
- **Real-time Updates**: Live data streaming with automatic reconnection
- **User Authentication**: Secure login with Supabase authentication

## Recent Fixes

### Tab State Update Issue (Fixed)
- **Issue**: Tab state updates were failing with "record 'new' has no field 'updatedat'" error
- **Root Cause**: Database column name mismatch - database expected `updatedat` but code was using `updated_at`
- **Solution**: Updated all service files to use correct column name `updatedat` instead of `updated_at`
- **Files Fixed**: `src/services/userStateService.js`, `src/services/usertabService.js`
- **Impact**: All tab state persistence now works correctly across all components

## Tab State Persistence

The application automatically saves and restores your dashboard preferences:

### Persisted States
1. **RSI Threshold Settings**: Your custom overbought/oversold values (default: 70/30)
2. **RSI Tracker Tab**: Which tab is active (Oversold or Overbought)
3. **Currency Strength View**: Your preferred visualization mode (Bar Chart, Line Chart, or Heatmap)
4. **News Filter**: Your news preference (Upcoming or Latest news)

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
- **RSI Correlation Settings**: Timeframe, RSI period, overbought/oversold thresholds, correlation window, calculation mode
- **RSI Tracker Settings**: Timeframe, RSI period, overbought/oversold thresholds, auto-subscribe symbols
- **Currency Strength Settings**: Timeframe, calculation mode (closed/live), enhanced calculation toggle, auto-subscribe symbols
- **Multi-Indicator Heatmap Settings**: Symbol selection, trading style, indicator weights, new signal display toggle

### Database Tables
- `user_state`: Basic tab states and UI preferences
- `user_settings`: Comprehensive dashboard settings and configurations

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Fxlabs.ai_Front_end
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
   - Run the SQL script in `supabase_user_state_table.sql` to create the user_state table
   - Run the SQL script in `user_settings_table.sql` to create the user_settings table
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

Run the SQL scripts provided:
- `supabase_user_state_table.sql` to create the user_state table with proper security policies
- `user_settings_table.sql` to create the user_settings table with proper security policies

## Architecture

### State Management
- **Zustand Stores**: Modular state management for different dashboard components
- **Base Market Store**: Shared functionality including tab state persistence
- **Component Stores**: Specialized stores for RSI, Currency Strength, and Correlation data

### Services
- **UserStateService**: Manages user tab state persistence
- **WatchlistService**: Handles watchlist database operations
- **NewsService**: Fetches and analyzes forex news with AI

### Components
- **Dashboard**: Main trading interface with responsive grid layout
- **RSI Components**: Overbought/oversold tracking and correlation analysis
- **Currency Strength Meter**: Multi-view currency strength visualization
- **Multi-Indicator Heatmap**: Advanced technical analysis dashboard
- **AI News Analysis**: Intelligent news filtering and analysis

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
  - **Trading Style**: Scalper, Day Trader, Swing Trader with visual icons
  - **Weight Configuration**: Equal or Trend-Tilted indicator weights
  - **New Signal Toggle**: ON/OFF switch for new signal highlighting
- **Settings Persistence**: All user preferences are automatically saved and restored:
  - **Symbol Selection**: Remembers your preferred currency pair
  - **Trading Style**: Saves your trading approach (Scalper/Day Trader/Swing Trader)
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
6. **Trading Style Selection**: Choose from Scalper, Day Trader, or Swing Trader styles via enhanced dropdown
7. **Timeframe Weighting**: Weights vary by trading style (sum to 1.0 for each style)
8. **Final Aggregation**: Weighted average creates final score and probabilities

### Enhanced User Interface
- **Professional Dropdowns**: All controls use consistent styling with hover effects and focus states
- **Visual Indicators**: Icons and emojis for better user experience (⚡ for Scalper, 📈 for Day Trader, etc.)
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

| Timeframe | Scalper | Day Trader | Swing Trader |
|-----------|---------|------------|--------------|
| 5M        | 0.30    | 0.10       | 0.00         |
| 15M       | 0.30    | 0.25       | 0.00         |
| 30M       | 0.20    | 0.25       | 0.10         |
| 1H        | 0.15    | 0.25       | 0.25         |
| 4H        | 0.05    | 0.10       | 0.35         |
| 1D        | 0.00    | 0.05       | 0.30         |

#### Trading Style Focus Areas:
- **Scalper**: Focus on 5M-30M timeframes (80% weight on short-term)
- **Day Trader**: Balanced across 15M-1H timeframes (75% weight on medium-term)
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

## Security

- **Row Level Security (RLS)**: All user data is protected with Supabase RLS policies
- **Authentication**: Secure user authentication with Supabase Auth
- **Data Isolation**: Each user can only access their own data
- **XSS Protection**: HTML sanitization implemented to prevent cross-site scripting attacks
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
