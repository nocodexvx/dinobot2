# Aplicar Migrações Manualmente no Supabase

## IMPORTANTE: Execute estes passos para corrigir TODOS os erros

O sistema está com 3 problemas principais:
1. **Tabela `packages` não existe** - Impossível criar pacotes
2. **Tabela `custom_buttons` não existe** - Impossível adicionar botões personalizados
3. **Tabela `plans` está desatualizada** - Faltam campos: `deliverables`, `order_bump_text`, `order_bump_accept_text`, `order_bump_reject_text`, `order_bump_value`, `order_bump_media_url`, `order_bump_audio_url`

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar TODAS as Migrações

Copie e cole o SQL completo abaixo no SQL Editor e clique em **RUN**:

```sql
-- ============================================
-- PARTE 1: Adicionar campos faltantes em PLANS
-- ============================================

DO $$
BEGIN
  -- Add order_bump_text if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_text'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_text text;
  END IF;

  -- Add order_bump_accept_text if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_accept_text'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_accept_text text DEFAULT 'Aceitar';
  END IF;

  -- Add order_bump_reject_text if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_reject_text'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_reject_text text DEFAULT 'Recusar';
  END IF;

  -- Add order_bump_value if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_value'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_value decimal(10, 2) CHECK (order_bump_value >= 0);
  END IF;

  -- Add order_bump_media_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_media_url'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_media_url text;
  END IF;

  -- Add order_bump_audio_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'order_bump_audio_url'
  ) THEN
    ALTER TABLE plans ADD COLUMN order_bump_audio_url text;
  END IF;

  -- Add deliverables if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'deliverables'
  ) THEN
    ALTER TABLE plans ADD COLUMN deliverables text;
  END IF;
END $$;

-- ============================================
-- PARTE 2: Criar tabela PACKAGES
-- ============================================

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

-- Policies para packages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Users can read own bot packages'
  ) THEN
    CREATE POLICY "Users can read own bot packages"
      ON packages FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Users can insert packages for own bots'
  ) THEN
    CREATE POLICY "Users can insert packages for own bots"
      ON packages FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Users can update own bot packages'
  ) THEN
    CREATE POLICY "Users can update own bot packages"
      ON packages FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Users can delete own bot packages'
  ) THEN
    CREATE POLICY "Users can delete own bot packages"
      ON packages FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = packages.bot_id AND bots.user_id = auth.uid()));
  END IF;
END $$;

-- ============================================
-- PARTE 3: Criar tabela CUSTOM_BUTTONS
-- ============================================

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

-- Policies para custom_buttons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_buttons' AND policyname = 'Users can view buttons from their own bots'
  ) THEN
    CREATE POLICY "Users can view buttons from their own bots"
      ON custom_buttons FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_buttons' AND policyname = 'Users can insert buttons to their own bots'
  ) THEN
    CREATE POLICY "Users can insert buttons to their own bots"
      ON custom_buttons FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_buttons' AND policyname = 'Users can update buttons from their own bots'
  ) THEN
    CREATE POLICY "Users can update buttons from their own bots"
      ON custom_buttons FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_buttons' AND policyname = 'Users can delete buttons from their own bots'
  ) THEN
    CREATE POLICY "Users can delete buttons from their own bots"
      ON custom_buttons FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM bots WHERE bots.id = custom_buttons.bot_id AND bots.user_id = auth.uid()));
  END IF;
END $$;

-- ============================================
-- PARTE 4: Adicionar package_id em TRANSACTIONS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'package_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN package_id uuid REFERENCES packages(id) ON DELETE CASCADE;
    CREATE INDEX idx_transactions_package_id ON transactions(package_id);
  END IF;
END $$;
```

### Passo 3: Verificar

Após executar o SQL, verifique se tudo foi criado corretamente:

1. No menu lateral, clique em **Table Editor**
2. Verifique se existem as tabelas:
   - `packages` ✓
   - `custom_buttons` ✓
3. Clique na tabela `plans` e verifique se há os campos:
   - `deliverables` ✓
   - `order_bump_text` ✓
   - `order_bump_accept_text` ✓
   - `order_bump_reject_text` ✓
   - `order_bump_value` ✓
   - `order_bump_media_url` ✓
   - `order_bump_audio_url` ✓
4. Clique na tabela `transactions` e verifique o campo:
   - `package_id` ✓

### Passo 4: Recarregar o App

Depois de aplicar as migrações, **recarregue a página do app no navegador** (F5 ou Ctrl+R).

Agora você poderá:
- ✓ Criar planos de assinatura
- ✓ Criar pacotes (compra única)
- ✓ Adicionar botões personalizados
- ✓ Gerar PIX e QR Codes
- ✓ Ver previews em tempo real

---

## Troubleshooting

Se ainda houver erros:

1. Verifique se você está usando a mesma conta no Supabase Dashboard
2. Confirme que o projeto correto está selecionado no dropdown
3. Se alguma policy já existir, ignore o erro e continue
4. Tente executar cada parte separadamente se houver problemas
5. Use o botão "Clear" no SQL Editor antes de colar o código

## O que cada parte faz?

- **Parte 1**: Adiciona 7 campos novos na tabela `plans` para suportar order bump e deliverables
- **Parte 2**: Cria a tabela `packages` para pacotes de compra única
- **Parte 3**: Cria a tabela `custom_buttons` para botões personalizados
- **Parte 4**: Adiciona referência de pacote nas transações
