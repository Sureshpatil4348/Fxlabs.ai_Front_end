# FX Labs Trading Dashboard

A comprehensive forex trading dashboard with real-time market data, RSI analysis, currency strength meters, and AI-powered news analysis.

## Features

### Core Trading Features
- **Real-time Market Data**: Live forex price feeds with WebSocket connections
- **RSI Analysis**: Overbought/oversold tracking with customizable thresholds
- **Currency Strength Meter**: Multi-view currency strength analysis (Bar Chart, Line Chart, Heatmap)
- **RSI Correlation Dashboard**: Advanced correlation analysis between currency pairs
- **AI News Analysis**: AI-powered forex news insights and analysis
- **Watchlist Management**: Personalized symbol tracking with database persistence

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
- **AI News Analysis**: Intelligent news filtering and analysis

## Security

- **Row Level Security (RLS)**: All user data is protected with Supabase RLS policies
- **Authentication**: Secure user authentication with Supabase Auth
- **Data Isolation**: Each user can only access their own data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
