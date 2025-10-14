-- Apply packages table migration
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

CREATE INDEX IF NOT EXISTS idx_packages_bot_id ON packages(bot_id);
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bot packages"
  ON packages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));

CREATE POLICY "Users can insert packages for own bots"
  ON packages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));

CREATE POLICY "Users can update own bot packages"
  ON packages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));

CREATE POLICY "Users can delete own bot packages"
  ON packages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_packages_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER packages_updated_at BEFORE UPDATE ON packages
FOR EACH ROW EXECUTE FUNCTION update_packages_updated_at();

-- Apply custom_buttons table migration
CREATE TABLE IF NOT EXISTS custom_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  text text NOT NULL,
  url text NOT NULL,
  order_position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_buttons ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_custom_buttons_bot_id ON custom_buttons(bot_id);
CREATE INDEX IF NOT EXISTS idx_custom_buttons_order ON custom_buttons(bot_id, order_position);

CREATE POLICY "Users can view buttons from their own bots"
  ON custom_buttons FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));

CREATE POLICY "Users can insert buttons to their own bots"
  ON custom_buttons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));

CREATE POLICY "Users can update buttons from their own bots"
  ON custom_buttons FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));

CREATE POLICY "Users can delete buttons from their own bots"
  ON custom_buttons FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_custom_buttons_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_buttons_updated_at_trigger BEFORE UPDATE ON custom_buttons
FOR EACH ROW EXECUTE FUNCTION update_custom_buttons_updated_at();

-- Add package_id to transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'package_id') THEN
    ALTER TABLE transactions ADD COLUMN package_id uuid REFERENCES packages(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_package_id ON transactions(package_id);
