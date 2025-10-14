/*
  # Create Packages Table for One-Time Purchase Plans

  1. New Tables
    - `packages`
      - `id` (uuid, primary key)
      - `bot_id` (uuid, foreign key to bots table)
      - `name` (text) - Package name
      - `value` (decimal) - Package price
      - `deliverables` (text) - Link or description of what customers receive (REQUIRED)
      - `order_bump_enabled` (boolean) - Whether order bump is active
      - `order_bump_text` (text) - Explanatory text for order bump offer
      - `order_bump_accept_text` (text) - Text for accept button
      - `order_bump_reject_text` (text) - Text for reject button
      - `order_bump_value` (decimal) - Order bump price
      - `order_bump_media_url` (text) - URL for order bump media (PNG, JPEG, JPG, MP4)
      - `order_bump_audio_url` (text) - URL for order bump audio (OGG)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `packages` table
    - Add policy for authenticated users to read their own bot packages
    - Add policy for authenticated users to insert packages for their own bots
    - Add policy for authenticated users to update their own bot packages
    - Add policy for authenticated users to delete their own bot packages

  3. Indexes
    - Index on `bot_id` for fast lookups

  4. Notes
    - Packages are one-time purchases (no duration/subscription)
    - Deliverables field is required and should contain a link
    - Order bump functionality is optional
    - All prices stored as decimal with 2 decimal places
*/

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  name text NOT NULL,
  value decimal(10, 2) NOT NULL CHECK (value >= 0),
  deliverables text NOT NULL,
  order_bump_enabled boolean DEFAULT false,
  order_bump_text text,
  order_bump_accept_text text DEFAULT 'Aceitar',
  order_bump_reject_text text DEFAULT 'Recusar',
  order_bump_value decimal(10, 2) CHECK (order_bump_value >= 0),
  order_bump_media_url text,
  order_bump_audio_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for bot_id lookups
CREATE INDEX IF NOT EXISTS idx_packages_bot_id ON packages(bot_id);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read packages for their own bots
CREATE POLICY "Users can read own bot packages"
  ON packages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = packages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can insert packages for their own bots
CREATE POLICY "Users can insert packages for own bots"
  ON packages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = packages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own bot packages
CREATE POLICY "Users can update own bot packages"
  ON packages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = packages.bot_id
      AND bots.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = packages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own bot packages
CREATE POLICY "Users can delete own bot packages"
  ON packages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = packages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_packages_updated_at();
