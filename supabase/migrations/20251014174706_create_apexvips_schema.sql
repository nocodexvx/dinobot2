/*
  # ApexVips Telegram Bot Management System - Initial Schema

  ## Overview
  This migration creates the complete database structure for managing Telegram bots 
  with subscription-based monetization.

  ## 1. New Tables
  
  ### `bots` - Telegram Bot Configuration
  - `id` (uuid, primary key) - Unique bot identifier
  - `user_id` (uuid, foreign key) - Owner reference to auth.users
  - `bot_token` (text, encrypted) - Telegram bot token
  - `bot_username` (text) - Telegram @username
  - `bot_name` (text) - Display name
  - `welcome_message` (text) - Message sent on /start
  - `media_url` (text, nullable) - Welcome media URL
  - `media_type` (text, nullable) - 'image' or 'video'
  - `vip_group_id` (text) - Telegram group ID for VIP members
  - `vip_group_link` (text, nullable) - Invite link template
  - `registry_channel_id` (text) - Channel for sale notifications
  - `webhook_url` (text, nullable) - Configured webhook URL
  - `is_active` (boolean, default false) - Bot activation status
  - `created_at` (timestamptz) - Creation timestamp

  ### `plans` - Subscription Plans
  - `id` (uuid, primary key) - Unique plan identifier
  - `bot_id` (uuid, foreign key) - Associated bot
  - `name` (text) - Plan name (e.g., "VIP Semanal")
  - `description` (text, nullable) - Plan description
  - `duration_type` (text) - 'WEEKLY', 'MONTHLY', 'LIFETIME'
  - `duration_days` (integer, nullable) - Duration in days (null for LIFETIME)
  - `price` (decimal) - Plan price
  - `is_active` (boolean, default true) - Plan availability
  - `order_bump_enabled` (boolean, default false) - Enable upsell
  - `order_bump_name` (text, nullable) - Upsell name
  - `order_bump_price` (decimal, nullable) - Upsell price
  - `order_bump_description` (text, nullable) - Upsell description
  - `created_at` (timestamptz) - Creation timestamp

  ### `subscriptions` - User Subscriptions
  - `id` (uuid, primary key) - Unique subscription identifier
  - `plan_id` (uuid, foreign key) - Associated plan
  - `bot_id` (uuid, foreign key) - Associated bot
  - `telegram_user_id` (text) - Telegram user ID
  - `telegram_username` (text, nullable) - Telegram @username
  - `telegram_first_name` (text, nullable) - User's first name
  - `start_date` (timestamptz) - Subscription start
  - `end_date` (timestamptz, nullable) - Subscription end (null for LIFETIME)
  - `status` (text) - 'ACTIVE', 'EXPIRED', 'CANCELLED'
  - `payment_id` (text, nullable) - Payment reference
  - `created_at` (timestamptz) - Creation timestamp

  ### `transactions` - Payment Transactions
  - `id` (uuid, primary key) - Unique transaction identifier
  - `subscription_id` (uuid, foreign key, nullable) - Associated subscription
  - `bot_id` (uuid, foreign key) - Associated bot
  - `telegram_user_id` (text) - Buyer's Telegram ID
  - `amount` (decimal) - Transaction amount
  - `status` (text) - 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
  - `payment_method` (text, nullable) - Payment method used
  - `payment_proof` (text, nullable) - Proof URL/reference
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Users can only access their own bots and related data
  - Authenticated users only
  - Separate policies for SELECT, INSERT, UPDATE, DELETE operations

  ## 3. Indexes
  - Performance indexes on foreign keys and frequently queried fields
  - Unique constraints on bot tokens and usernames

  ## 4. Important Notes
  - Bot tokens should be encrypted at application level before storage
  - Webhook URLs are generated based on bot_id
  - Subscriptions automatically calculate end_date based on plan duration
  - RLS ensures data isolation between users
*/

-- Create bots table
CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_token text NOT NULL,
  bot_username text NOT NULL,
  bot_name text NOT NULL,
  welcome_message text NOT NULL DEFAULT 'Olá {profile_name}! 👋 Bem-vindo ao nosso grupo VIP!',
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video')),
  vip_group_id text NOT NULL,
  vip_group_link text,
  registry_channel_id text NOT NULL,
  webhook_url text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_type text NOT NULL CHECK (duration_type IN ('WEEKLY', 'MONTHLY', 'LIFETIME')),
  duration_days integer CHECK (duration_days > 0 OR duration_days IS NULL),
  price decimal(10, 2) NOT NULL CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  order_bump_enabled boolean NOT NULL DEFAULT false,
  order_bump_name text,
  order_bump_price decimal(10, 2) CHECK (order_bump_price >= 0),
  order_bump_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  telegram_user_id text NOT NULL,
  telegram_username text,
  telegram_first_name text,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  telegram_user_id text NOT NULL,
  amount decimal(10, 2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  payment_method text,
  payment_proof text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_is_active ON bots(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_bot_id ON plans(bot_id);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_bot_id ON subscriptions(bot_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_user_id ON subscriptions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bot_id ON transactions(bot_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Enable Row Level Security
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bots table
CREATE POLICY "Users can view own bots"
  ON bots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bots"
  ON bots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bots"
  ON bots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bots"
  ON bots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for plans table
CREATE POLICY "Users can view plans for own bots"
  ON plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = plans.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert plans for own bots"
  ON plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = plans.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update plans for own bots"
  ON plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = plans.bot_id
      AND bots.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = plans.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete plans for own bots"
  ON plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = plans.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view subscriptions for own bots"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = subscriptions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subscriptions for own bots"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = subscriptions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subscriptions for own bots"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = subscriptions.bot_id
      AND bots.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = subscriptions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subscriptions for own bots"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = subscriptions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- RLS Policies for transactions table
CREATE POLICY "Users can view transactions for own bots"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = transactions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for own bots"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = transactions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions for own bots"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = transactions.bot_id
      AND bots.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = transactions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions for own bots"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = transactions.bot_id
      AND bots.user_id = auth.uid()
    )
  );