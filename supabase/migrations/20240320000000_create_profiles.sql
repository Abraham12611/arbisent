-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  pubkey TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  email_preferences JSONB DEFAULT '{}'::jsonb,
  privacy_settings JSONB DEFAULT '{}'::jsonb,
  trading_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (
    COALESCE(
      (privacy_settings->>'showProfile')::boolean,
      true
    )
  );

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.jwt()->>'sub' = pubkey
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.jwt()->>'sub' = pubkey
  );

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (
    auth.jwt()->>'sub' = pubkey
  );

-- Create function to migrate user data
CREATE OR REPLACE FUNCTION migrate_user_data(old_user_id TEXT, new_pubkey TEXT)
RETURNS void AS $$
BEGIN
  -- Add your data migration logic here
  -- Example:
  -- UPDATE user_trades SET user_id = new_pubkey WHERE user_id = old_user_id;
  -- UPDATE user_settings SET user_id = new_pubkey WHERE user_id = old_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 