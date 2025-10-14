/*
  # Create Media Gallery Table

  1. New Table: media_gallery
    - id (uuid, primary key)
    - bot_id (uuid, foreign key to bots)
    - file_id (text) - Telegram file_id for reuse
    - file_unique_id (text) - Telegram unique identifier
    - file_type (text) - image, video, audio, document
    - file_name (text) - Original filename
    - file_size (bigint) - Size in bytes
    - mime_type (text) - image/jpeg, video/mp4, etc.
    - width (integer) - For images/videos
    - height (integer) - For images/videos
    - duration (integer) - For videos/audio in seconds
    - thumbnail_file_id (text) - For videos
    - context_type (text) - welcome_message, remarketing, pix, order_bump
    - description (text) - User description
    - registry_message_id (text) - Message ID in notification group
    - uploaded_at (timestamptz)
    - created_at (timestamptz)

  2. Security
    - Enable RLS
    - Policies for authenticated users to manage their bot media
*/

-- Create media gallery table
CREATE TABLE IF NOT EXISTS media_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  file_id text NOT NULL,
  file_unique_id text,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  file_name text,
  file_size bigint,
  mime_type text,
  width integer,
  height integer,
  duration integer,
  thumbnail_file_id text,
  context_type text CHECK (context_type IN ('welcome_message', 'remarketing', 'pix', 'order_bump', 'general')),
  description text,
  registry_message_id text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE media_gallery ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view media from their bots
CREATE POLICY "Users can view own bot media"
  ON media_gallery
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = media_gallery.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can insert media to their bots
CREATE POLICY "Users can upload media to own bots"
  ON media_gallery
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = media_gallery.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Policy: Users can delete media from their bots
CREATE POLICY "Users can delete own bot media"
  ON media_gallery
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = media_gallery.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_gallery_bot_id ON media_gallery(bot_id);
CREATE INDEX IF NOT EXISTS idx_media_gallery_context_type ON media_gallery(context_type);
CREATE INDEX IF NOT EXISTS idx_media_gallery_file_type ON media_gallery(file_type);
CREATE INDEX IF NOT EXISTS idx_media_gallery_uploaded_at ON media_gallery(uploaded_at DESC);
