/*
  # Setup Cron Jobs for Automation

  ## Overview
  This migration configures automated tasks using pg_cron extension to run daily jobs
  for managing subscription lifecycle and user notifications.

  ## Jobs Created
  
  ### 1. Daily Job: Remove Expired Users (02:00 UTC)
  - Runs every day at 2 AM
  - Calls the `remove-expired-users` edge function
  - Removes users from VIP groups when subscriptions expire
  - Updates subscription status to EXPIRED
  
  ### 2. Daily Job: Notify Expiring Soon (10:00 UTC)
  - Runs every day at 10 AM
  - Calls the `notify-expiring-soon` edge function
  - Notifies users 3 days before subscription expires
  - Sends reminder to renew subscription

  ## Technical Details
  - Uses pg_cron extension
  - Calls Supabase Edge Functions via HTTP
  - Uses service_role key for authentication
  - Logs execution results
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule: Remove expired users daily at 2:00 AM UTC
SELECT cron.schedule(
  'remove-expired-users-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/remove-expired-users',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule: Notify users about expiration 3 days before, daily at 10:00 AM UTC
SELECT cron.schedule(
  'notify-expiring-soon-daily',
  '0 10 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-expiring-soon',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Create a table to log cron job executions
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  executed_at timestamptz DEFAULT now(),
  status text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can view logs
CREATE POLICY "Authenticated users can view cron logs"
  ON cron_job_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_executed_at 
  ON cron_job_logs(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name 
  ON cron_job_logs(job_name);
