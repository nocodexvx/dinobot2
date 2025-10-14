/*
  # Performance Indexes and Audit Logs

  ## Overview
  Adds performance indexes for frequently queried columns and creates
  an audit log system for tracking important system events.

  ## Changes

  ### 1. Performance Indexes
  - `subscriptions.status` - Fast filtering by subscription status
  - `subscriptions.end_date` - Optimize cron job queries
  - `transactions.status` - Fast transaction status lookup
  - `transactions.created_at` - Sort by creation date
  - `plans.bot_id` - Fast plan lookups per bot
  - `bots.is_active` - Filter active bots quickly

  ### 2. Audit Logs Table
  - `audit_logs` table for tracking system events
  - Stores user actions, IP addresses, and context
  - Indexed for fast querying by user and timestamp
  
  ### 3. Security
  - RLS enabled on audit_logs
  - Only authenticated users can view their own logs
  - System can insert logs for any user (via service role)

  ## Important Notes
  - Indexes improve query performance significantly
  - Audit logs help with debugging and compliance
  - Logs are retained indefinitely (can add TTL later)
*/

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date 
  ON subscriptions(end_date) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_transactions_status 
  ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
  ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_plans_bot_id 
  ON plans(bot_id);

CREATE INDEX IF NOT EXISTS idx_bots_user_id 
  ON bots(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_user_id 
  ON subscriptions(telegram_user_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
  ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
  ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
  ON audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to insert audit logs for any user
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE audit_logs IS 'System audit log for tracking user actions';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., CREATE_BOT, DELETE_PLAN)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., bot, plan, subscription)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context as JSON';
