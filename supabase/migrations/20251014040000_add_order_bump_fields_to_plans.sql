/*
  # Add Order Bump Fields to Plans Table and Fix Duration Type

  1. Changes
    - Add `order_bump_text` (text) - Explanatory text for order bump offer
    - Add `order_bump_accept_text` (text) - Text for accept button (default: 'Aceitar')
    - Add `order_bump_reject_text` (text) - Text for reject button (default: 'Recusar')
    - Add `order_bump_value` (decimal) - Replace order_bump_price
    - Add `order_bump_media_url` (text) - URL for order bump media (PNG, JPEG, JPG, MP4)
    - Add `order_bump_audio_url` (text) - URL for order bump audio (OGG)
    - Add `deliverables` (text) - What customers receive after payment
    - Fix duration_type constraint to accept lowercase values

  2. Notes
    - All new fields are nullable
    - order_bump_value replaces order_bump_price (keeping both for backwards compatibility)
    - Fields are designed to support the complete Order Bump workflow
    - Duration type now accepts: 'daily', 'weekly', 'monthly', 'lifetime' (lowercase)
*/

-- Add new order bump fields
DO $$
BEGIN
  -- Add order_bump_enabled if not exists (CRITICAL MISSING FIELD)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_enabled'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_enabled boolean DEFAULT false NOT NULL;
  END IF;

  -- Add order_bump_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_name'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_name text;
  END IF;

  -- Add order_bump_text if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_text'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_text text;
  END IF;

  -- Add order_bump_accept_text if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_accept_text'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_accept_text text DEFAULT 'Aceitar';
  END IF;

  -- Add order_bump_reject_text if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_reject_text'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_reject_text text DEFAULT 'Recusar';
  END IF;

  -- Add order_bump_value if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_value'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_value decimal(10, 2) CHECK (order_bump_value >= 0);
  END IF;

  -- Add order_bump_media_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_media_url'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_media_url text;
  END IF;

  -- Add order_bump_audio_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_audio_url'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_audio_url text;
  END IF;

  -- Add deliverables if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'deliverables'
  ) THEN
    ALTER TABLE plans ADD COLUMN deliverables text;
  END IF;
END $$;

-- Drop old duration_type constraint and add new one with lowercase values
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_duration_type_check;
ALTER TABLE plans ADD CONSTRAINT plans_duration_type_check
  CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'lifetime'));
