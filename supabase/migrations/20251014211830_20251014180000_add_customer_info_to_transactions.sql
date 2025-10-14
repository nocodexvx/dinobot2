/*
  # Add Customer Information Fields to Transactions

  1. Changes
    - Add customer_full_name field to store complete customer name
    - Add customer_cpf_cnpj field for tax identification
    - Add customer_language field for user language preference
    - Add is_telegram_premium field to track premium users
    - Add conversion_time_seconds field to track time from start to purchase
    - Add net_amount field to track amount after fees
    - Add currency_type field (BRL, USD, etc.)
    - Add customer_username field for Telegram username

  2. Purpose
    Enable detailed customer tracking and comprehensive purchase notifications
    in the registry/notification group
*/

-- Add customer information fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'customer_full_name'
  ) THEN
    ALTER TABLE transactions ADD COLUMN customer_full_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'customer_cpf_cnpj'
  ) THEN
    ALTER TABLE transactions ADD COLUMN customer_cpf_cnpj text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'customer_language'
  ) THEN
    ALTER TABLE transactions ADD COLUMN customer_language text DEFAULT 'pt-br';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'is_telegram_premium'
  ) THEN
    ALTER TABLE transactions ADD COLUMN is_telegram_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'customer_username'
  ) THEN
    ALTER TABLE transactions ADD COLUMN customer_username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'conversion_time_seconds'
  ) THEN
    ALTER TABLE transactions ADD COLUMN conversion_time_seconds integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'net_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN net_amount decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'currency_type'
  ) THEN
    ALTER TABLE transactions ADD COLUMN currency_type text DEFAULT 'BRL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'conversation_start_time'
  ) THEN
    ALTER TABLE transactions ADD COLUMN conversation_start_time timestamptz;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_customer_cpf ON transactions(customer_cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_username ON transactions(customer_username);
