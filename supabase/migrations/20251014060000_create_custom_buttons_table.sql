/*
  # Create Custom Buttons Table

  1. New Tables
    - `custom_buttons`
      - `id` (uuid, primary key) - Unique button identifier
      - `bot_id` (uuid, foreign key) - Associated bot
      - `text` (text) - Button display text
      - `url` (text) - Target URL when button is clicked
      - `order_position` (integer) - Display order
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `custom_buttons` table
    - Add policies for authenticated users to manage their bot's buttons
    - Users can only access buttons from their own bots

  3. Indexes
    - Index on `bot_id` for efficient queries
    - Index on `order_position` for sorting
*/

-- Create custom_buttons table
CREATE TABLE IF NOT EXISTS custom_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  text text NOT NULL,
  url text NOT NULL,
  order_position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_buttons ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_buttons_bot_id ON custom_buttons(bot_id);
CREATE INDEX IF NOT EXISTS idx_custom_buttons_order ON custom_buttons(bot_id, order_position);

-- RLS Policies for custom_buttons
CREATE POLICY "Users can view buttons from their own bots"
  ON custom_buttons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = custom_buttons.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert buttons to their own bots"
  ON custom_buttons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = custom_buttons.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update buttons from their own bots"
  ON custom_buttons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = custom_buttons.bot_id
      AND bots.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = custom_buttons.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete buttons from their own bots"
  ON custom_buttons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = custom_buttons.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_buttons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_buttons_updated_at_trigger
  BEFORE UPDATE ON custom_buttons
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_buttons_updated_at();
