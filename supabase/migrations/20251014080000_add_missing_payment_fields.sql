-- Add missing payment configuration fields to bots table
-- These fields are required by BotPayment.tsx component

ALTER TABLE public.bots 
ADD COLUMN IF NOT EXISTS payment_public_token TEXT,
ADD COLUMN IF NOT EXISTS payment_private_token TEXT,
ADD COLUMN IF NOT EXISTS payment_webhook_secret TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.bots.payment_public_token IS 'Public API token for payment gateway integration';
COMMENT ON COLUMN public.bots.payment_private_token IS 'Private API token for payment gateway integration';
COMMENT ON COLUMN public.bots.payment_webhook_secret IS 'Webhook secret for payment gateway callbacks';