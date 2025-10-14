/*
  # Create Remarketing Messages Table

  1. New Table: remarketing_messages
    - id (uuid, primary key)
    - bot_id (uuid, foreign key to bots)
    - message_text (text) - The remarketing message content
    - media_file_id (text) - Telegram file_id for image/video
    - media_type (text) - image, video, document
    - audio_file_id (text) - Telegram file_id for audio
    - send_after_minutes (integer) - When to send after user interaction
    - discount_percentage (integer) - Optional discount offer
    - target_audience (text) - Who should receive this message
    - enabled (boolean) - Whether this message is active
    - created_at (timestamptz)
    - updated_at (timestamptz)

  2. Security
    - Enable RLS
    - Policies for authenticated users to manage their bot remarketing messages
*/

-- Create remarketing messages table
CREATE TABLE IF NOT EXISTS remarketing_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  message_text text NOT NULL,
  media_file_id text,
  media_type text CHECK (media_type IN ('image', 'video', 'document', 'audio')),
  audio_file_id text,
  send_after_minutes integer NOT NULL DEFAULT 20,
  discount_percentage integer CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  target_audience text NOT NULL DEFAULT 'users_who_never_purchased' CHECK (
    target_audience IN ('all_users', 'users_who_never_purchased', 'expired_subscriptions', 'active_subscribers')
  ),
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE remarketing_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view remarketing messages from their bots
CREATE POLICY "Users can view own bot remarketing"
  ON remarketing_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = remarketing_messages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can insert remarketing messages to their bots
CREATE POLICY "Users can create remarketing for own bots"
  ON remarketing_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = remarketing_messages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can update remarketing messages from their bots
CREATE POLICY "Users can update own bot remarketing"
  ON remarketing_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = remarketing_messages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can delete remarketing messages from their bots
CREATE POLICY "Users can delete own bot remarketing"
  ON remarketing_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = remarketing_messages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_remarketing_bot_id ON remarketing_messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_remarketing_enabled ON remarketing_messages(enabled);
CREATE INDEX IF NOT EXISTS idx_remarketing_target_audience ON remarketing_messages(target_audience);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_remarketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_remarketing_updated_at
  BEFORE UPDATE ON remarketing_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_remarketing_updated_at();
