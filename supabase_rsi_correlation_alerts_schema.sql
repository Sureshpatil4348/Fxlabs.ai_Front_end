-- RSI Correlation Alerts Schema
-- This schema supports alerts for RSI Correlation Dashboard with both Real Correlation and RSI Threshold modes

-- Create the rsi_correlation_alerts table
CREATE TABLE IF NOT EXISTS rsi_correlation_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL, -- User email for backend notifications
    
    -- Alert Configuration
    alert_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Correlation Pairs (up to 5 pairs for correlation alerts)
    correlation_pairs JSONB NOT NULL, -- Array of up to 5 correlation pairs: [["EURUSD", "GBPUSD"], ["USDJPY", "EURUSD"]]
    
    -- Timeframes (1-3 timeframes for correlation alerts)
    timeframes JSONB NOT NULL DEFAULT '["1H"]', -- Array of 1-3 timeframes: ["1H", "4H", "1D"]
    
    -- Calculation Mode
    calculation_mode VARCHAR(20) NOT NULL DEFAULT 'rsi_threshold', -- 'rsi_threshold' | 'real_correlation'
    
    -- RSI Settings (for RSI Threshold mode)
    rsi_period INTEGER DEFAULT 14, -- RSI calculation period
    rsi_overbought_threshold INTEGER DEFAULT 70, -- Overbought threshold
    rsi_oversold_threshold INTEGER DEFAULT 30, -- Oversold threshold
    
    -- Correlation Settings (for Real Correlation mode)
    correlation_window INTEGER DEFAULT 50, -- Rolling correlation window (20, 50, 90, 120)
    
    -- Alert Conditions
    alert_conditions JSONB NOT NULL, -- Array of conditions based on calculation mode:
    -- For RSI Threshold mode: ["positive_mismatch", "negative_mismatch", "neutral_break"]
    -- For Real Correlation mode: ["strong_positive", "strong_negative", "weak_correlation", "correlation_break"]
    
    -- Correlation Thresholds (for Real Correlation mode)
    strong_correlation_threshold DECIMAL(3,2) DEFAULT 0.70, -- Strong correlation threshold (0.70+)
    moderate_correlation_threshold DECIMAL(3,2) DEFAULT 0.30, -- Moderate correlation threshold (0.30+)
    weak_correlation_threshold DECIMAL(3,2) DEFAULT 0.15, -- Weak correlation threshold (0.15+)
    
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
    CONSTRAINT valid_calculation_mode CHECK (calculation_mode IN ('rsi_threshold', 'real_correlation')),
    CONSTRAINT valid_rsi_period CHECK (rsi_period >= 5 AND rsi_period <= 50),
    CONSTRAINT valid_rsi_overbought CHECK (rsi_overbought_threshold >= 60 AND rsi_overbought_threshold <= 90),
    CONSTRAINT valid_rsi_oversold CHECK (rsi_oversold_threshold >= 10 AND rsi_oversold_threshold <= 40),
    CONSTRAINT valid_correlation_window CHECK (correlation_window IN (20, 50, 90, 120)),
    CONSTRAINT valid_alert_frequency CHECK (alert_frequency IN ('once', 'every_5min', 'every_15min', 'every_30min', 'every_hour')),
    CONSTRAINT valid_correlation_pairs_count CHECK (jsonb_array_length(correlation_pairs) >= 1 AND jsonb_array_length(correlation_pairs) <= 5),
    CONSTRAINT valid_conditions_count CHECK (jsonb_array_length(alert_conditions) >= 1 AND jsonb_array_length(alert_conditions) <= 6),
    CONSTRAINT valid_rsi_conditions CHECK (
        calculation_mode = 'rsi_threshold' AND alert_conditions <@ '["positive_mismatch", "negative_mismatch", "neutral_break"]'::jsonb
        OR calculation_mode = 'real_correlation' AND alert_conditions <@ '["strong_positive", "strong_negative", "weak_correlation", "correlation_break"]'::jsonb
    ),
    CONSTRAINT valid_strong_correlation CHECK (strong_correlation_threshold >= 0.50 AND strong_correlation_threshold <= 1.00),
    CONSTRAINT valid_moderate_correlation CHECK (moderate_correlation_threshold >= 0.20 AND moderate_correlation_threshold <= 0.80),
    CONSTRAINT valid_weak_correlation CHECK (weak_correlation_threshold >= 0.05 AND weak_correlation_threshold <= 0.50),
    CONSTRAINT correlation_thresholds_order CHECK (strong_correlation_threshold >= moderate_correlation_threshold AND moderate_correlation_threshold >= weak_correlation_threshold)
);

-- Create the rsi_correlation_alert_triggers table to track when alerts are triggered
CREATE TABLE IF NOT EXISTS rsi_correlation_alert_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES rsi_correlation_alerts(id) ON DELETE CASCADE,
    
    -- Trigger Details
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_condition VARCHAR(30) NOT NULL, -- 'positive_mismatch', 'negative_mismatch', 'neutral_break', 'strong_positive', 'strong_negative', 'weak_correlation', 'correlation_break'
    calculation_mode VARCHAR(20) NOT NULL, -- 'rsi_threshold' | 'real_correlation'
    
    -- Correlation Pair Data at Trigger
    pair_symbol1 VARCHAR(20) NOT NULL, -- First symbol in the pair
    pair_symbol2 VARCHAR(20) NOT NULL, -- Second symbol in the pair
    timeframe VARCHAR(10) NOT NULL, -- Timeframe that triggered
    
    -- RSI Data (for RSI Threshold mode)
    rsi1_value DECIMAL(5,2), -- RSI value for first symbol
    rsi2_value DECIMAL(5,2), -- RSI value for second symbol
    rsi1_price DECIMAL(10,5), -- Current price for first symbol
    rsi2_price DECIMAL(10,5), -- Current price for second symbol
    
    -- Correlation Data (for Real Correlation mode)
    correlation_value DECIMAL(4,3), -- Actual correlation value (-1 to 1)
    correlation_strength VARCHAR(10), -- 'weak', 'moderate', 'strong'
    correlation_trend VARCHAR(15), -- 'increasing', 'decreasing', 'stable'
    correlation_window INTEGER, -- Correlation window used
    
    -- Additional Data
    trigger_data JSONB, -- Additional data specific to the trigger condition
    
    -- Alert Status
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_trigger_condition CHECK (trigger_condition IN ('positive_mismatch', 'negative_mismatch', 'neutral_break', 'strong_positive', 'strong_negative', 'weak_correlation', 'correlation_break')),
    CONSTRAINT valid_calculation_mode CHECK (calculation_mode IN ('rsi_threshold', 'real_correlation')),
    CONSTRAINT valid_rsi_values CHECK (
        (rsi1_value IS NULL OR (rsi1_value >= 0 AND rsi1_value <= 100)) AND
        (rsi2_value IS NULL OR (rsi2_value >= 0 AND rsi2_value <= 100))
    ),
    CONSTRAINT valid_correlation_value CHECK (correlation_value IS NULL OR (correlation_value >= -1 AND correlation_value <= 1)),
    CONSTRAINT valid_correlation_strength CHECK (correlation_strength IS NULL OR correlation_strength IN ('weak', 'moderate', 'strong')),
    CONSTRAINT valid_correlation_trend CHECK (correlation_trend IS NULL OR correlation_trend IN ('increasing', 'decreasing', 'stable'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alerts_user_id ON rsi_correlation_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alerts_user_email ON rsi_correlation_alerts(user_email);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alerts_active ON rsi_correlation_alerts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alerts_pairs ON rsi_correlation_alerts USING GIN (correlation_pairs);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alerts_timeframes ON rsi_correlation_alerts USING GIN (timeframes);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alerts_conditions ON rsi_correlation_alerts USING GIN (alert_conditions);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alerts_mode ON rsi_correlation_alerts(calculation_mode);

CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alert_triggers_alert_id ON rsi_correlation_alert_triggers(alert_id);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alert_triggers_triggered_at ON rsi_correlation_alert_triggers(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alert_triggers_pair ON rsi_correlation_alert_triggers(pair_symbol1, pair_symbol2);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alert_triggers_timeframe ON rsi_correlation_alert_triggers(timeframe);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alert_triggers_condition ON rsi_correlation_alert_triggers(trigger_condition);
CREATE INDEX IF NOT EXISTS idx_rsi_correlation_alert_triggers_mode ON rsi_correlation_alert_triggers(calculation_mode);

-- Enable Row Level Security (RLS)
ALTER TABLE rsi_correlation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsi_correlation_alert_triggers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rsi_correlation_alerts
CREATE POLICY "Users can view their own RSI correlation alerts" ON rsi_correlation_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RSI correlation alerts" ON rsi_correlation_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSI correlation alerts" ON rsi_correlation_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSI correlation alerts" ON rsi_correlation_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for rsi_correlation_alert_triggers
CREATE POLICY "Users can view triggers for their RSI correlation alerts" ON rsi_correlation_alert_triggers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rsi_correlation_alerts 
            WHERE rsi_correlation_alerts.id = rsi_correlation_alert_triggers.alert_id 
            AND rsi_correlation_alerts.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert RSI correlation alert triggers" ON rsi_correlation_alert_triggers
    FOR INSERT WITH CHECK (true); -- Allow system to insert triggers

CREATE POLICY "Users can update their own RSI correlation alert triggers" ON rsi_correlation_alert_triggers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM rsi_correlation_alerts 
            WHERE rsi_correlation_alerts.id = rsi_correlation_alert_triggers.alert_id 
            AND rsi_correlation_alerts.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rsi_correlation_alerts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rsi_correlation_alerts_updated_at 
    BEFORE UPDATE ON rsi_correlation_alerts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_rsi_correlation_alerts_updated_at_column();

-- Create function to clean up old RSI correlation triggers (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_rsi_correlation_alert_triggers()
RETURNS void AS $$
BEGIN
    -- Delete triggers older than 30 days
    DELETE FROM rsi_correlation_alert_triggers 
    WHERE triggered_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Add comments for documentation
COMMENT ON TABLE rsi_correlation_alerts IS 'Stores user-configured alerts for RSI Correlation Dashboard trading signals';
COMMENT ON TABLE rsi_correlation_alert_triggers IS 'Tracks when RSI correlation alerts are triggered with market data';

COMMENT ON COLUMN rsi_correlation_alerts.user_email IS 'User email address for backend notifications and alerts';
COMMENT ON COLUMN rsi_correlation_alerts.correlation_pairs IS 'Array of up to 5 correlation pairs (e.g., [["EURUSD", "GBPUSD"], ["USDJPY", "EURUSD"]])';
COMMENT ON COLUMN rsi_correlation_alerts.timeframes IS 'Array of 1-3 timeframes (e.g., ["1H", "4H", "1D"])';
COMMENT ON COLUMN rsi_correlation_alerts.calculation_mode IS 'Calculation mode: rsi_threshold or real_correlation';
COMMENT ON COLUMN rsi_correlation_alerts.alert_conditions IS 'Array of alert conditions based on calculation mode';
COMMENT ON COLUMN rsi_correlation_alerts.correlation_window IS 'Rolling correlation window for real correlation mode (20, 50, 90, 120)';
COMMENT ON COLUMN rsi_correlation_alerts.strong_correlation_threshold IS 'Strong correlation threshold (0.50-1.00)';
COMMENT ON COLUMN rsi_correlation_alerts.moderate_correlation_threshold IS 'Moderate correlation threshold (0.20-0.80)';
COMMENT ON COLUMN rsi_correlation_alerts.weak_correlation_threshold IS 'Weak correlation threshold (0.05-0.50)';
COMMENT ON COLUMN rsi_correlation_alert_triggers.trigger_condition IS 'The specific condition that triggered the alert';
COMMENT ON COLUMN rsi_correlation_alert_triggers.calculation_mode IS 'The calculation mode used when trigger occurred';
COMMENT ON COLUMN rsi_correlation_alert_triggers.correlation_value IS 'Actual correlation value when alert was triggered (-1 to 1)';
COMMENT ON COLUMN rsi_correlation_alert_triggers.correlation_strength IS 'Correlation strength classification (weak, moderate, strong)';
COMMENT ON COLUMN rsi_correlation_alert_triggers.trigger_data IS 'Additional data specific to the trigger condition';
