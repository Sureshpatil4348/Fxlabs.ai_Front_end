-- Multi-Indicator Heatmap Alerts Schema
-- This schema supports alerts for multi-indicator heatmap with up to 3 pairs, 3 timeframes, and 1-2 indicators

-- Create the heatmap_alerts table
CREATE TABLE IF NOT EXISTS heatmap_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL, -- User email for backend notifications
    
    -- Alert Configuration
    alert_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Trading Pairs (up to 3 pairs)
    pairs JSONB NOT NULL, -- Array of up to 3 trading pairs: ["EURUSD", "GBPUSD", "USDJPY"]
    
    -- Timeframes (up to 3 timeframes)
    timeframes JSONB NOT NULL, -- Array of up to 3 timeframes: ["1H", "4H", "1D"]
    
    -- Selected Indicators (1-2 of the 7 available indicators)
    selected_indicators JSONB NOT NULL, -- Array of 1-2 indicators: ["RSI", "MACD"]
    
    -- Trading Style
    trading_style VARCHAR(20) NOT NULL DEFAULT 'dayTrader', -- scalper, dayTrader, swingTrader
    
    -- Alert Thresholds
    buy_threshold_min INTEGER DEFAULT 70, -- Minimum threshold for buy alerts (70-80+)
    buy_threshold_max INTEGER DEFAULT 100, -- Maximum threshold for buy alerts
    sell_threshold_min INTEGER DEFAULT 0, -- Minimum threshold for sell alerts
    sell_threshold_max INTEGER DEFAULT 30, -- Maximum threshold for sell alerts (0-30)
    
    -- Alert Settings
    notification_methods JSONB DEFAULT '["browser"]', -- ["browser", "email", "push"]
    alert_frequency VARCHAR(20) DEFAULT 'once', -- once, every_5min, every_15min, every_30min, every_hour
    
    -- Crossing Detection Settings
    trigger_on_crossing BOOLEAN DEFAULT true, -- Only trigger when crossing INTO condition (prevents spam)
    previous_values JSONB, -- Store previous indicator values for crossing detection
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_trading_style CHECK (trading_style IN ('scalper', 'dayTrader', 'swingTrader')),
    CONSTRAINT valid_alert_frequency CHECK (alert_frequency IN ('once', 'every_5min', 'every_15min', 'every_30min', 'every_hour')),
    CONSTRAINT valid_buy_threshold CHECK (buy_threshold_min >= 70 AND buy_threshold_max <= 100 AND buy_threshold_min <= buy_threshold_max),
    CONSTRAINT valid_sell_threshold CHECK (sell_threshold_min >= 0 AND sell_threshold_max <= 30 AND sell_threshold_min <= sell_threshold_max),
    CONSTRAINT valid_pairs_count CHECK (jsonb_array_length(pairs) >= 1 AND jsonb_array_length(pairs) <= 3),
    CONSTRAINT valid_timeframes_count CHECK (jsonb_array_length(timeframes) >= 1 AND jsonb_array_length(timeframes) <= 3),
    CONSTRAINT valid_indicators_count CHECK (jsonb_array_length(selected_indicators) >= 1 AND jsonb_array_length(selected_indicators) <= 2),
    CONSTRAINT valid_indicators CHECK (
        selected_indicators <@ '["EMA21", "EMA50", "EMA200", "MACD", "RSI", "UTBOT", "IchimokuClone"]'::jsonb
    ),
    CONSTRAINT valid_timeframes CHECK (
        timeframes <@ '["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"]'::jsonb
    )
);

-- Create the heatmap_alert_triggers table to track when alerts are triggered
CREATE TABLE IF NOT EXISTS heatmap_alert_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES heatmap_alerts(id) ON DELETE CASCADE,
    
    -- Trigger Details
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    trigger_score INTEGER NOT NULL, -- The actual score that triggered the alert
    
    -- Market Data at Trigger
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    indicators_data JSONB NOT NULL, -- Store the actual indicator values at trigger time
    previous_indicators_data JSONB, -- Previous indicator values for crossing detection
    current_price DECIMAL(10,5), -- Current price at trigger
    price_change_percent DECIMAL(5,2), -- Price change percentage
    
    -- Crossing Detection Data
    crossing_direction VARCHAR(20), -- 'cross_up', 'cross_down', 'cross_into_buy', 'cross_into_sell'
    previous_score INTEGER, -- Previous score before crossing
    crossing_threshold INTEGER, -- The threshold that was crossed
    
    -- Alert Status
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('buy', 'sell')),
    CONSTRAINT valid_crossing_direction CHECK (crossing_direction IS NULL OR crossing_direction IN ('cross_up', 'cross_down', 'cross_into_buy', 'cross_into_sell'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_heatmap_alerts_user_id ON heatmap_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_alerts_user_email ON heatmap_alerts(user_email);
CREATE INDEX IF NOT EXISTS idx_heatmap_alerts_active ON heatmap_alerts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_heatmap_alerts_pairs ON heatmap_alerts USING GIN (pairs);
CREATE INDEX IF NOT EXISTS idx_heatmap_alerts_timeframes ON heatmap_alerts USING GIN (timeframes);
CREATE INDEX IF NOT EXISTS idx_heatmap_alerts_indicators ON heatmap_alerts USING GIN (selected_indicators);

CREATE INDEX IF NOT EXISTS idx_heatmap_alert_triggers_alert_id ON heatmap_alert_triggers(alert_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_alert_triggers_triggered_at ON heatmap_alert_triggers(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_heatmap_alert_triggers_symbol_timeframe ON heatmap_alert_triggers(symbol, timeframe);

-- Enable Row Level Security (RLS)
ALTER TABLE heatmap_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_alert_triggers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for heatmap_alerts
CREATE POLICY "Users can view their own heatmap alerts" ON heatmap_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own heatmap alerts" ON heatmap_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own heatmap alerts" ON heatmap_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own heatmap alerts" ON heatmap_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for heatmap_alert_triggers
CREATE POLICY "Users can view triggers for their alerts" ON heatmap_alert_triggers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM heatmap_alerts 
            WHERE heatmap_alerts.id = heatmap_alert_triggers.alert_id 
            AND heatmap_alerts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert triggers for their own alerts" ON heatmap_alert_triggers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM heatmap_alerts 
            WHERE heatmap_alerts.id = heatmap_alert_triggers.alert_id 
            AND heatmap_alerts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own alert triggers" ON heatmap_alert_triggers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM heatmap_alerts 
            WHERE heatmap_alerts.id = heatmap_alert_triggers.alert_id 
            AND heatmap_alerts.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_heatmap_alerts_updated_at 
    BEFORE UPDATE ON heatmap_alerts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old triggers (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_alert_triggers()
RETURNS void AS $$
BEGIN
    -- Delete triggers older than 30 days
    DELETE FROM heatmap_alert_triggers 
    WHERE triggered_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Add comments for documentation
COMMENT ON TABLE heatmap_alerts IS 'Stores user-configured alerts for multi-indicator heatmap trading signals';
COMMENT ON TABLE heatmap_alert_triggers IS 'Tracks when heatmap alerts are triggered with market data';

COMMENT ON COLUMN heatmap_alerts.user_email IS 'User email address for backend notifications and alerts';
COMMENT ON COLUMN heatmap_alerts.pairs IS 'Array of up to 3 trading pairs (e.g., ["EURUSD", "GBPUSD"])';
COMMENT ON COLUMN heatmap_alerts.timeframes IS 'Array of up to 3 timeframes (e.g., ["1H", "4H", "1D"])';
COMMENT ON COLUMN heatmap_alerts.selected_indicators IS 'Array of 1-2 selected indicators from the 7 available';
COMMENT ON COLUMN heatmap_alerts.buy_threshold_min IS 'Minimum buy threshold (70-100)';
COMMENT ON COLUMN heatmap_alerts.sell_threshold_max IS 'Maximum sell threshold (0-30)';
COMMENT ON COLUMN heatmap_alert_triggers.indicators_data IS 'JSON object containing actual indicator values at trigger time';
COMMENT ON COLUMN heatmap_alert_triggers.previous_indicators_data IS 'Previous indicator values for crossing detection';
COMMENT ON COLUMN heatmap_alert_triggers.crossing_direction IS 'Direction of crossing: cross_up, cross_down, cross_into_buy, cross_into_sell';
COMMENT ON COLUMN heatmap_alert_triggers.previous_score IS 'Previous score before crossing occurred';
COMMENT ON COLUMN heatmap_alert_triggers.crossing_threshold IS 'The threshold that was crossed to trigger the alert';
