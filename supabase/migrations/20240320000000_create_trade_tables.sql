-- Create trade schedules table
CREATE TABLE trade_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset VARCHAR(255) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    custom_interval INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_executed TIMESTAMP WITH TIME ZONE,
    next_execution TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    max_executions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_frequency CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'custom')),
    CONSTRAINT valid_custom_interval CHECK (
        (frequency != 'custom' AND custom_interval IS NULL) OR
        (frequency = 'custom' AND custom_interval IS NOT NULL)
    )
);

-- Create trade executions table
CREATE TABLE trade_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES trade_schedules(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset VARCHAR(255) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    price DECIMAL(18,8),
    status VARCHAR(50) NOT NULL,
    error TEXT,
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash VARCHAR(255),
    gas_used DECIMAL(18,8),
    gas_price DECIMAL(18,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'executing', 'completed', 'failed'))
);

-- Create trade status table for real-time updates
CREATE TABLE trade_status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES trade_executions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('info', 'warning', 'error', 'success'))
);

-- Create indexes for better query performance
CREATE INDEX idx_trade_schedules_user ON trade_schedules(user_id);
CREATE INDEX idx_trade_schedules_next_execution ON trade_schedules(next_execution) WHERE is_active = true;
CREATE INDEX idx_trade_executions_schedule ON trade_executions(schedule_id);
CREATE INDEX idx_trade_executions_user ON trade_executions(user_id);
CREATE INDEX idx_trade_status_execution ON trade_status_updates(execution_id);

-- Add RLS policies
ALTER TABLE trade_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_status_updates ENABLE ROW LEVEL SECURITY;

-- Policies for trade_schedules
CREATE POLICY "Users can view their own schedules"
    ON trade_schedules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules"
    ON trade_schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
    ON trade_schedules FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for trade_executions
CREATE POLICY "Users can view their own executions"
    ON trade_executions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create executions"
    ON trade_executions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for trade_status_updates
CREATE POLICY "Users can view status of their executions"
    ON trade_status_updates FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trade_executions
        WHERE trade_executions.id = trade_status_updates.execution_id
        AND trade_executions.user_id = auth.uid()
    )); 