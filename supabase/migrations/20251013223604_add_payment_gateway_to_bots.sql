/*
  # Add Payment Gateway Configuration to Bots

  ## Overview
  Adds payment gateway integration fields to the bots table to support
  PIX payment processing via PushinPay, Syncpay, or other gateways.

  ## Changes
  
  ### 1. New Columns in `bots` table
  - `payment_gateway` (text) - Gateway provider name (pushinpay, syncpay, etc.)
  - `payment_public_token` (text) - Public API key/token for the gateway
  - `payment_private_token` (text) - Private API key/token for the gateway
  - `payment_webhook_secret` (text) - Optional webhook secret for validation
  - `payment_enabled` (boolean) - Whether payment is enabled for this bot
  
  ### 2. Security
  - RLS policies remain unchanged
  - Private tokens are encrypted at rest by Supabase
  - Only authenticated users can view/modify payment settings
  
  ## Important Notes
  - Private tokens should be kept secure
  - Webhook secret is used to validate incoming payment confirmations
  - Each bot can have its own payment gateway configuration
*/

-- Add payment gateway fields to bots table
DO $$ 
BEGIN
  -- Add payment_gateway column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'payment_gateway'
  ) THEN
    ALTER TABLE bots ADD COLUMN payment_gateway text;
  END IF;

  -- Add payment_public_token column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'payment_public_token'
  ) THEN
    ALTER TABLE bots ADD COLUMN payment_public_token text;
  END IF;

  -- Add payment_private_token column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'payment_private_token'
  ) THEN
    ALTER TABLE bots ADD COLUMN payment_private_token text;
  END IF;

  -- Add payment_webhook_secret column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'payment_webhook_secret'
  ) THEN
    ALTER TABLE bots ADD COLUMN payment_webhook_secret text;
  END IF;

  -- Add payment_enabled column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'payment_enabled'
  ) THEN
    ALTER TABLE bots ADD COLUMN payment_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN bots.payment_gateway IS 'Payment gateway provider (pushinpay, syncpay, etc.)';
COMMENT ON COLUMN bots.payment_public_token IS 'Public API token for the payment gateway';
COMMENT ON COLUMN bots.payment_private_token IS 'Private API token for the payment gateway (keep secure)';
COMMENT ON COLUMN bots.payment_webhook_secret IS 'Secret for validating payment webhook callbacks';
COMMENT ON COLUMN bots.payment_enabled IS 'Whether payment processing is enabled for this bot';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bots_payment_enabled 
  ON bots(payment_enabled) WHERE payment_enabled = true;
