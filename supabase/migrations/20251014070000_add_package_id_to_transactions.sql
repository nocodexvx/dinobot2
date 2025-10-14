/*
  # Add package_id to transactions table

  1. Changes
    - Add `package_id` column to transactions table
    - Add foreign key constraint to packages table
    - Update check constraint to ensure either plan_id or package_id is set

  2. Notes
    - Allows transactions to be linked to either plans or packages
    - Maintains data integrity with proper constraints
*/

-- Add package_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'package_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN package_id uuid REFERENCES packages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop old constraint if exists and create new one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'transactions_plan_or_package_check'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_plan_or_package_check;
  END IF;
END $$;

-- Add check constraint to ensure either plan_id or package_id is set
ALTER TABLE transactions
ADD CONSTRAINT transactions_plan_or_package_check
CHECK (
  (plan_id IS NOT NULL AND package_id IS NULL) OR
  (plan_id IS NULL AND package_id IS NOT NULL)
);

-- Create index on package_id for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_package_id ON transactions(package_id);
