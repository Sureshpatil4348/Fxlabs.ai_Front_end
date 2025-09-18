-- RSI Tracker Alerts Schema
-- This schema supports alerts for RSI Tracker with overbought/oversold conditions, RFI scores, and RSI events

-- Create the rsi_alerts table
CREATE TABLE IF NOT EXISTS rsi_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL, -- User email for backend notifications
    
    -- Alert Configuration
    alert_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Trading Pairs (up to 5 pairs for RSI alerts)
    pairs JSONB NOT NULL, -- Array of up to 5 trading pairs: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"]
    
    -- Timeframes (1-3 timeframes for RSI alerts)
    timeframes JSONB NOT NULL DEFAULT '["1H"]', -- Array of 1-3 timeframes: ["1H", "4H", "1D"]
    
    -- RSI Settings
    rsi_period INTEGER DEFAULT 14, -- RSI calculation period
    rsi_overbought_threshold INTEGER DEFAULT 70, -- Overbought threshold
    rsi_oversold_threshold INTEGER DEFAULT 30, -- Oversold threshold
    
    -- Alert Conditions
    alert_conditions JSONB NOT NULL, -- Array of conditions: ["overbought", "oversold", "rfi_strong", "rfi_moderate", "crossup", "crossdown"]
    
    -- RFI Thresholds (optional)
    rfi_strong_threshold DECIMAL(3,2) DEFAULT 0.80, -- Strong RFI threshold (0.80+)
    rfi_moderate_threshold DECIMAL(3,2) DEFAULT 0.60, -- Moderate RFI threshold (0.60+)
    
    -- Alert Settings
    notification_methods JSONB DEFAULT '["browser"]', -- ["browser", "email", "push"]
    alert_frequency VARCHAR(20) DEFAULT 'once', -- once, every_5min, every_15min, every_30min, every_hour
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_timeframes_count CHECK (jsonb_array_length(timeframes) >= 1 AND jsonb_array_length(timeframes) <= 3),
    CONSTRAINT valid_timeframes CHECK (
        timeframes <@ '["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"]'::jsonb
    ),
    CONSTRAINT valid_rsi_period CHECK (rsi_period >= 5 AND rsi_period <= 50),
    CONSTRAINT valid_rsi_overbought CHECK (rsi_overbought_threshold >= 60 AND rsi_overbought_threshold <= 90),
    CONSTRAINT valid_rsi_oversold CHECK (rsi_oversold_threshold >= 10 AND rsi_oversold_threshold <= 40),
    CONSTRAINT valid_alert_frequency CHECK (alert_frequency IN ('once', 'every_5min', 'every_15min', 'every_30min', 'every_hour')),
    CONSTRAINT valid_pairs_count CHECK (jsonb_array_length(pairs) >= 1 AND jsonb_array_length(pairs) <= 5),
    CONSTRAINT valid_conditions_count CHECK (jsonb_array_length(alert_conditions) >= 1 AND jsonb_array_length(alert_conditions) <= 6),
    CONSTRAINT valid_conditions CHECK (
        alert_conditions <@ '["overbought", "oversold", "rfi_strong", "rfi_moderate", "crossup", "crossdown"]'::jsonb
    ),
    CONSTRAINT valid_rfi_strong CHECK (rfi_strong_threshold >= 0.50 AND rfi_strong_threshold <= 1.00),
    CONSTRAINT valid_rfi_moderate CHECK (rfi_moderate_threshold >= 0.30 AND rfi_moderate_threshold <= 0.80),
    CONSTRAINT rfi_thresholds_order CHECK (rfi_strong_threshold >= rfi_moderate_threshold)
);

-- Create the rsi_alert_triggers table to track when alerts are triggered
CREATE TABLE IF NOT EXISTS rsi_alert_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES rsi_alerts(id) ON DELETE CASCADE,
    
    -- Trigger Details
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_condition VARCHAR(20) NOT NULL, -- 'overbought', 'oversold', 'rfi_strong', 'rfi_moderate', 'crossup', 'crossdown'
    
    -- Market Data at Trigger
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    rsi_value DECIMAL(5,2) NOT NULL, -- Actual RSI value at trigger
    rfi_score DECIMAL(3,2), -- RFI score at trigger (if applicable)
    current_price DECIMAL(10,5) NOT NULL, -- Current price at trigger
    price_change_percent DECIMAL(5,2), -- Price change percentage
    
    -- RSI Event Data (for crossup/crossdown)
    rsi_event_data JSONB, -- Additional data for RSI events (previous RSI, crossing point, etc.)
    
    -- Alert Status
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_trigger_condition CHECK (trigger_condition IN ('overbought', 'oversold', 'rfi_strong', 'rfi_moderate', 'crossup', 'crossdown')),
    CONSTRAINT valid_rsi_value CHECK (rsi_value >= 0 AND rsi_value <= 100),
    CONSTRAINT valid_rfi_score CHECK (rfi_score IS NULL OR (rfi_score >= 0 AND rfi_score <= 1))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rsi_alerts_user_id ON rsi_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_rsi_alerts_user_email ON rsi_alerts(user_email);
CREATE INDEX IF NOT EXISTS idx_rsi_alerts_active ON rsi_alerts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rsi_alerts_pairs ON rsi_alerts USING GIN (pairs);
CREATE INDEX IF NOT EXISTS idx_rsi_alerts_conditions ON rsi_alerts USING GIN (alert_conditions);
CREATE INDEX IF NOT EXISTS idx_rsi_alerts_timeframes ON rsi_alerts USING GIN (timeframes);

CREATE INDEX IF NOT EXISTS idx_rsi_alert_triggers_alert_id ON rsi_alert_triggers(alert_id);
CREATE INDEX IF NOT EXISTS idx_rsi_alert_triggers_triggered_at ON rsi_alert_triggers(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsi_alert_triggers_symbol_timeframe ON rsi_alert_triggers(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_rsi_alert_triggers_condition ON rsi_alert_triggers(trigger_condition);

-- Enable Row Level Security (RLS)
ALTER TABLE rsi_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsi_alert_triggers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rsi_alerts
CREATE POLICY "Users can view their own RSI alerts" ON rsi_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RSI alerts" ON rsi_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSI alerts" ON rsi_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSI alerts" ON rsi_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for rsi_alert_triggers
CREATE POLICY "Users can view triggers for their RSI alerts" ON rsi_alert_triggers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rsi_alerts 
            WHERE rsi_alerts.id = rsi_alert_triggers.alert_id 
            AND rsi_alerts.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert RSI alert triggers" ON rsi_alert_triggers
    FOR INSERT WITH CHECK (true); -- Allow system to insert triggers

CREATE POLICY "Users can update their own RSI alert triggers" ON rsi_alert_triggers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM rsi_alerts 
            WHERE rsi_alerts.id = rsi_alert_triggers.alert_id 
            AND rsi_alerts.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rsi_alerts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rsi_alerts_updated_at 
    BEFORE UPDATE ON rsi_alerts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_rsi_alerts_updated_at_column();

-- Create function to clean up old RSI triggers (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_rsi_alert_triggers()
RETURNS void AS $$
BEGIN
    -- Delete triggers older than 30 days
    DELETE FROM rsi_alert_triggers 
    WHERE triggered_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Add comments for documentation
COMMENT ON TABLE rsi_alerts IS 'Stores user-configured alerts for RSI Tracker trading signals';
COMMENT ON TABLE rsi_alert_triggers IS 'Tracks when RSI alerts are triggered with market data';

COMMENT ON COLUMN rsi_alerts.user_email IS 'User email address for backend notifications and alerts';
COMMENT ON COLUMN rsi_alerts.pairs IS 'Array of up to 5 trading pairs (e.g., ["EURUSD", "GBPUSD", "XAUUSD"])';
COMMENT ON COLUMN rsi_alerts.timeframes IS 'Array of 1-3 timeframes (e.g., ["1H", "4H", "1D"])';
COMMENT ON COLUMN rsi_alerts.alert_conditions IS 'Array of alert conditions: overbought, oversold, rfi_strong, rfi_moderate, crossup, crossdown';
COMMENT ON COLUMN rsi_alerts.rsi_overbought_threshold IS 'RSI overbought threshold (60-90)';
COMMENT ON COLUMN rsi_alerts.rsi_oversold_threshold IS 'RSI oversold threshold (10-40)';
COMMENT ON COLUMN rsi_alerts.rfi_strong_threshold IS 'Strong RFI threshold (0.50-1.00)';
COMMENT ON COLUMN rsi_alerts.rfi_moderate_threshold IS 'Moderate RFI threshold (0.30-0.80)';
COMMENT ON COLUMN rsi_alert_triggers.trigger_condition IS 'The specific condition that triggered the alert';
COMMENT ON COLUMN rsi_alert_triggers.rsi_value IS 'Actual RSI value when alert was triggered';
COMMENT ON COLUMN rsi_alert_triggers.rfi_score IS 'RFI score when alert was triggered (if applicable)';
COMMENT ON COLUMN rsi_alert_triggers.rsi_event_data IS 'Additional data for RSI crossup/crossdown events';
