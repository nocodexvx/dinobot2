/*
  # Adicionar Campos de Personalização de Pagamento

  1. Alterações na tabela `bots`
    - Adicionar campos para personalização de mensagens PIX
    - Campos para mídia e áudio personalizados
    - Mensagens customizáveis com variáveis

  2. Campos Adicionados
    - `payment_method_message` - Mensagem de seleção de método
    - `payment_method_button_text` - Texto do botão PIX
    - `pix_main_message` - Mensagem principal do PIX
    - `pix_status_button_text` - Texto do botão de verificação de status
    - `pix_qrcode_button_text` - Texto do botão de QR Code
    - `pix_media_url` - URL da mídia PIX (imagem/vídeo)
    - `pix_media_type` - Tipo da mídia PIX
    - `pix_audio_url` - URL do áudio PIX (OGG)
    - `show_qrcode_in_chat` - Mostrar QR Code diretamente no chat
    - `pix_format_blockquote` - Usar formato blockquote para código PIX
*/

-- Adicionar campos de personalização de pagamento
DO $$ 
BEGIN
  -- Mensagens personalizadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'payment_method_message'
  ) THEN
    ALTER TABLE bots ADD COLUMN payment_method_message TEXT DEFAULT '🌟 Plano selecionado:

🎁 Plano: {plan_name}
💰 Valor: {plan_value}
⏳ Duração: {plan_duration}

Escolha o método de pagamento abaixo:';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'payment_method_button_text'
  ) THEN
    ALTER TABLE bots ADD COLUMN payment_method_button_text TEXT DEFAULT '💠 Pagar com Pix';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'pix_main_message'
  ) THEN
    ALTER TABLE bots ADD COLUMN pix_main_message TEXT DEFAULT '🌟 Você selecionou o seguinte plano:

🎁 Plano: {plan_name}
💰 Valor: {plan_value}

💠 Pague via Pix Copia e Cola (ou QR Code em alguns bancos):

{payment_pointer}

👆 Toque na chave PIX acima para copiá-la

‼️ Após o pagamento, clique no botão abaixo para verificar o status:';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'pix_status_button_text'
  ) THEN
    ALTER TABLE bots ADD COLUMN pix_status_button_text TEXT DEFAULT 'Verificar Status do Pagamento';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'pix_qrcode_button_text'
  ) THEN
    ALTER TABLE bots ADD COLUMN pix_qrcode_button_text TEXT DEFAULT 'Mostrar QR Code';
  END IF;

  -- Mídia e áudio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'pix_media_url'
  ) THEN
    ALTER TABLE bots ADD COLUMN pix_media_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'pix_media_type'
  ) THEN
    ALTER TABLE bots ADD COLUMN pix_media_type TEXT CHECK (pix_media_type IN ('image', 'video'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'pix_audio_url'
  ) THEN
    ALTER TABLE bots ADD COLUMN pix_audio_url TEXT;
  END IF;

  -- Configurações de exibição
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'show_qrcode_in_chat'
  ) THEN
    ALTER TABLE bots ADD COLUMN show_qrcode_in_chat BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bots' AND column_name = 'pix_format_blockquote'
  ) THEN
    ALTER TABLE bots ADD COLUMN pix_format_blockquote BOOLEAN DEFAULT false;
  END IF;

END $$;