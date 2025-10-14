/*
  # Adicionar Campos PIX na Tabela Transactions

  1. Alterações na tabela `transactions`
    - Adicionar campos para armazenar dados do PIX gerado
    - Campos para código PIX, QR Code e tempo de expiração

  2. Campos Adicionados
    - `pix_code` - Código PIX copia e cola
    - `pix_qr_code` - URL da imagem do QR Code
    - `payment_id` - ID do pagamento no gateway
    - `expires_at` - Data/hora de expiração do PIX
    - `telegram_name` - Nome do usuário no Telegram
    - `telegram_username` - Username do usuário no Telegram
    - `plan_id` - ID do plano selecionado
*/

-- Adicionar campos PIX nas transações
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'pix_code'
  ) THEN
    ALTER TABLE transactions ADD COLUMN pix_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'pix_qr_code'
  ) THEN
    ALTER TABLE transactions ADD COLUMN pix_qr_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE transactions ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'telegram_name'
  ) THEN
    ALTER TABLE transactions ADD COLUMN telegram_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'telegram_username'
  ) THEN
    ALTER TABLE transactions ADD COLUMN telegram_username TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN plan_id UUID REFERENCES plans(id) ON DELETE CASCADE;
  END IF;

END $$;