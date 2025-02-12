-- Drop existing auth triggers and policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profiles" ON "public"."profiles";

-- Create auth_attempts table for Crossmint
CREATE TABLE IF NOT EXISTS auth_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pubkey TEXT NOT NULL,
    nonce TEXT NOT NULL,
    ttl INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_pubkey UNIQUE (pubkey)
);

-- Update profiles table to use pubkey instead of auth.users reference
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD COLUMN IF NOT EXISTS pubkey TEXT,
ADD CONSTRAINT unique_pubkey UNIQUE (pubkey);

-- Update trade tables to use pubkey
ALTER TABLE trades
DROP CONSTRAINT IF EXISTS trades_user_id_fkey,
ADD COLUMN IF NOT EXISTS pubkey TEXT,
ADD CONSTRAINT trades_pubkey_fkey FOREIGN KEY (pubkey) REFERENCES profiles(pubkey);

-- Update trade_schedules to use pubkey
ALTER TABLE trade_schedules
DROP CONSTRAINT IF EXISTS trade_schedules_user_id_fkey,
ADD COLUMN IF NOT EXISTS pubkey TEXT,
ADD CONSTRAINT trade_schedules_pubkey_fkey FOREIGN KEY (pubkey) REFERENCES profiles(pubkey);

-- Update trade_executions to use pubkey
ALTER TABLE trade_executions
DROP CONSTRAINT IF EXISTS trade_executions_user_id_fkey,
ADD COLUMN IF NOT EXISTS pubkey TEXT,
ADD CONSTRAINT trade_executions_pubkey_fkey FOREIGN KEY (pubkey) REFERENCES profiles(pubkey);

-- Create new RLS policies for Crossmint auth
CREATE POLICY "Users can view their own profiles"
ON profiles FOR SELECT
USING (auth.jwt() ->> 'sub' = pubkey);

CREATE POLICY "Users can update their own profiles"
ON profiles FOR UPDATE
USING (auth.jwt() ->> 'sub' = pubkey);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_attempts_pubkey ON auth_attempts(pubkey);
CREATE INDEX IF NOT EXISTS idx_profiles_pubkey ON profiles(pubkey);
CREATE INDEX IF NOT EXISTS idx_trades_pubkey ON trades(pubkey);
CREATE INDEX IF NOT EXISTS idx_trade_schedules_pubkey ON trade_schedules(pubkey);
CREATE INDEX IF NOT EXISTS idx_trade_executions_pubkey ON trade_executions(pubkey); 