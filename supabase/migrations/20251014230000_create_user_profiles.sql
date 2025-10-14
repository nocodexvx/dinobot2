/*
  # Create User Profiles Table

  1. New Table: user_profiles
    - id (uuid, primary key)
    - user_id (uuid, foreign key to auth.users)
    - full_name (text) - User's full name
    - company_name (text) - Company/Business name
    - phone (text) - Phone number
    - language (text) - Preferred language (pt-BR, en-US)
    - timezone (text) - User timezone
    - notify_email_bot_inactive (boolean) - Email notification for inactive bots
    - notify_telegram_bot_inactive (boolean) - Telegram notification for inactive bots
    - notify_email_new_subscriber (boolean) - Email notification for new subscribers
    - notify_email_payment (boolean) - Email notification for payments
    - notify_email_expiring (boolean) - Email notification for expiring subscriptions
    - telegram_notification_bot_id (text) - Bot ID for Telegram notifications
    - created_at (timestamptz)
    - updated_at (timestamptz)

  2. Security
    - Enable RLS
    - Users can only view and update their own profile
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  company_name text,
  phone text,
  language text DEFAULT 'pt-BR' CHECK (language IN ('pt-BR', 'en-US', 'es-ES')),
  timezone text DEFAULT 'America/Sao_Paulo',
  notify_email_bot_inactive boolean DEFAULT true,
  notify_telegram_bot_inactive boolean DEFAULT false,
  notify_email_new_subscriber boolean DEFAULT true,
  notify_email_payment boolean DEFAULT true,
  notify_email_expiring boolean DEFAULT true,
  telegram_notification_bot_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_profile_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
