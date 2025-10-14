/*
  # Add CTA Button Configuration to Bots

  ## Overview
  Adds optional CTA (Call-to-Action) button configuration to customize
  the welcome flow with a custom button between media/text and plans.

  ## Changes

  ### 1. New Columns in `bots` table
  - `cta_enabled` (boolean) - Whether to show CTA button
  - `cta_text` (text) - Text to show before CTA button
  - `cta_button_text` (text) - Button text
  - `cta_button_url` (text) - Optional URL to open

  ### 2. Security
  - RLS policies remain unchanged
  - Only authenticated users can configure CTA

  ## Flow
  1. Media (image/video) with caption
  2. Text message (optional)
  3. CTA Button (optional)
  4. Plans keyboard
*/

-- Add CTA fields to bots table
DO $$
BEGIN
  -- Add cta_enabled column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bots' AND column_name = 'cta_enabled'
  ) THEN
    ALTER TABLE bots ADD COLUMN cta_enabled boolean DEFAULT false;
  END IF;

  -- Add cta_text column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bots' AND column_name = 'cta_text'
  ) THEN
    ALTER TABLE bots ADD COLUMN cta_text text;
  END IF;

  -- Add cta_button_text column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bots' AND column_name = 'cta_button_text'
  ) THEN
    ALTER TABLE bots ADD COLUMN cta_button_text text;
  END IF;

  -- Add cta_button_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bots' AND column_name = 'cta_button_url'
  ) THEN
    ALTER TABLE bots ADD COLUMN cta_button_url text;
  END IF;

  -- Add secondary_text column if not exists (text after media)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bots' AND column_name = 'secondary_text'
  ) THEN
    ALTER TABLE bots ADD COLUMN secondary_text text;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN bots.cta_enabled IS 'Whether to show CTA button in welcome flow';
COMMENT ON COLUMN bots.cta_text IS 'Text message to show with CTA button';
COMMENT ON COLUMN bots.cta_button_text IS 'Text displayed on the CTA button';
COMMENT ON COLUMN bots.cta_button_url IS 'Optional URL to open when CTA is clicked';
COMMENT ON COLUMN bots.secondary_text IS 'Additional text message sent after media';
