/*
  # Fix Plans Insert Policy

  1. Changes
    - Drop existing INSERT policy for plans
    - Create new INSERT policy with proper validation
    - Ensures users can only create plans for their own bots

  2. Security
    - Validates bot ownership before allowing plan insertion
*/

DROP POLICY IF EXISTS "Users can insert plans for own bots" ON plans;

CREATE POLICY "Users can insert plans for own bots"
  ON plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM bots
      WHERE bots.id = plans.bot_id
      AND bots.user_id = auth.uid()
    )
  );
