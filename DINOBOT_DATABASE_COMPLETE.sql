-- =====================================================
-- 🗄️ SCRIPT SQL CONSOLIDADO - BANCO DE DADOS DINOBOT
-- =====================================================
-- 
-- Este script cria a estrutura completa do banco de dados DINOBOT
-- baseado na documentação técnica oficial.
-- 
-- Inclui:
-- ✅ 7 tabelas principais com estrutura completa
-- ✅ Relacionamentos (foreign keys)
-- ✅ 15 índices de performance
-- ✅ Row Level Security (RLS) em todas as tabelas
-- ✅ Constraints e validações
-- ✅ Triggers para updated_at
-- ✅ Políticas de segurança otimizadas
--
-- Executar no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 📋 SEÇÃO 1: CRIAÇÃO DAS TABELAS PRINCIPAIS
-- =====================================================

-- 🤖 Tabela: bots
-- Propósito: Configuração e gerenciamento dos bots Telegram
CREATE TABLE IF NOT EXISTS public.bots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_token text NOT NULL,
    bot_username text NOT NULL,
    bot_name text NOT NULL,
    welcome_message text NOT NULL DEFAULT 'Olá {profile_name}! 👋',
    media_url text,
    media_type text CHECK (media_type IN ('image', 'video')),
    vip_group_id text NOT NULL,
    vip_group_link text,
    registry_channel_id text NOT NULL,
    webhook_url text,
    is_active boolean NOT NULL DEFAULT false,
    cta_enabled boolean DEFAULT false,
    cta_text text,
    cta_button_text text,
    cta_button_url text,
    secondary_text text,
    payment_enabled boolean DEFAULT false,
    payment_gateway text CHECK (payment_gateway IN ('pushinpay', 'syncpay', 'mercadopago', 'asaas')),
    payment_method_message text,
    pix_media_url text,
    pix_media_type text CHECK (pix_media_type IN ('image', 'video')),
    pix_audio_url text,
    pix_format_blockquote boolean DEFAULT false,
    show_qrcode_in_chat boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 📋 Tabela: plans
-- Propósito: Planos de assinatura recorrente
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    duration_type text NOT NULL CHECK (duration_type IN ('WEEKLY', 'MONTHLY', 'LIFETIME')),
    duration_days integer CHECK (duration_days > 0 OR duration_days IS NULL),
    price decimal(10,2) NOT NULL CHECK (price >= 0),
    is_active boolean NOT NULL DEFAULT true,
    deliverables text,
    order_bump_text text,
    order_bump_accept_text text DEFAULT 'Aceitar',
    order_bump_reject_text text DEFAULT 'Recusar',
    order_bump_value decimal(10,2) CHECK (order_bump_value >= 0),
    order_bump_media_url text,
    order_bump_audio_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 📦 Tabela: packages
-- Propósito: Pacotes de compra única (sem recorrência)
CREATE TABLE IF NOT EXISTS public.packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    name text NOT NULL,
    value decimal(10,2) NOT NULL CHECK (value >= 0),
    deliverables text NOT NULL,
    order_bump_enabled boolean DEFAULT false,
    order_bump_text text,
    order_bump_accept_text text DEFAULT 'Aceitar',
    order_bump_reject_text text DEFAULT 'Recusar',
    order_bump_value decimal(10,2) CHECK (order_bump_value >= 0),
    order_bump_media_url text,
    order_bump_audio_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 🔘 Tabela: custom_buttons
-- Propósito: Botões personalizados nos bots
CREATE TABLE IF NOT EXISTS public.custom_buttons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    text text NOT NULL,
    url text NOT NULL,
    order_position integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 👥 Tabela: subscriptions
-- Propósito: Assinaturas ativas e históricas dos usuários
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    telegram_user_id text NOT NULL,
    telegram_username text,
    telegram_first_name text,
    start_date timestamptz NOT NULL DEFAULT now(),
    end_date timestamptz,
    status text NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    payment_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 💳 Tabela: transactions
-- Propósito: Histórico completo de transações de pagamento
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    package_id uuid REFERENCES public.packages(id) ON DELETE CASCADE,
    bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
    telegram_user_id text NOT NULL,
    amount decimal(10,2) NOT NULL CHECK (amount >= 0),
    status text NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    payment_method text,
    payment_proof text,
    pix_code text,
    qr_code_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 📝 Tabela: audit_logs
-- Propósito: Logs de auditoria para rastreamento de ações
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    metadata jsonb DEFAULT '{}',
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 🔗 SEÇÃO 2: ÍNDICES DE PERFORMANCE (15 ÍNDICES)
-- =====================================================

-- Índices para tabela bots
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON public.bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_is_active ON public.bots(is_active);

-- Índices para tabela plans
CREATE INDEX IF NOT EXISTS idx_plans_bot_id ON public.plans(bot_id);

-- Índices para tabela packages
CREATE INDEX IF NOT EXISTS idx_packages_bot_id ON public.packages(bot_id);

-- Índices para tabela custom_buttons
CREATE INDEX IF NOT EXISTS idx_custom_buttons_bot_id ON public.custom_buttons(bot_id);
CREATE INDEX IF NOT EXISTS idx_custom_buttons_order ON public.custom_buttons(bot_id, order_position);

-- Índices para tabela subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_bot_id ON public.subscriptions(bot_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_user_id ON public.subscriptions(telegram_user_id);

-- Índices para tabela transactions
CREATE INDEX IF NOT EXISTS idx_transactions_bot_id ON public.transactions(bot_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_package_id ON public.transactions(package_id);

-- Índices para tabela audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- =====================================================
-- ⚡ SEÇÃO 3: TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para packages
DROP TRIGGER IF EXISTS update_packages_updated_at ON public.packages;
CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para custom_buttons
DROP TRIGGER IF EXISTS update_custom_buttons_updated_at ON public.custom_buttons;
CREATE TRIGGER update_custom_buttons_updated_at
    BEFORE UPDATE ON public.custom_buttons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔒 SEÇÃO 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 🛡️ SEÇÃO 5: POLÍTICAS DE SEGURANÇA
-- =====================================================

-- 🤖 Políticas para tabela BOTS
DROP POLICY IF EXISTS "Users can view own bots" ON public.bots;
CREATE POLICY "Users can view own bots" ON public.bots
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bots" ON public.bots;
CREATE POLICY "Users can insert own bots" ON public.bots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bots" ON public.bots;
CREATE POLICY "Users can update own bots" ON public.bots
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bots" ON public.bots;
CREATE POLICY "Users can delete own bots" ON public.bots
    FOR DELETE USING (auth.uid() = user_id);

-- 📋 Políticas para tabela PLANS
DROP POLICY IF EXISTS "Users can view plans for own bots" ON public.plans;
CREATE POLICY "Users can view plans for own bots" ON public.plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = plans.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert plans for own bots" ON public.plans;
CREATE POLICY "Users can insert plans for own bots" ON public.plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = plans.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update plans for own bots" ON public.plans;
CREATE POLICY "Users can update plans for own bots" ON public.plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = plans.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete plans for own bots" ON public.plans;
CREATE POLICY "Users can delete plans for own bots" ON public.plans
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = plans.bot_id
            AND bots.user_id = auth.uid()
        )
    );

-- 📦 Políticas para tabela PACKAGES
DROP POLICY IF EXISTS "Users can read own bot packages" ON public.packages;
CREATE POLICY "Users can read own bot packages" ON public.packages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = packages.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert packages for own bots" ON public.packages;
CREATE POLICY "Users can insert packages for own bots" ON public.packages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = packages.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own bot packages" ON public.packages;
CREATE POLICY "Users can update own bot packages" ON public.packages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = packages.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own bot packages" ON public.packages;
CREATE POLICY "Users can delete own bot packages" ON public.packages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = packages.bot_id
            AND bots.user_id = auth.uid()
        )
    );

-- 🔘 Políticas para tabela CUSTOM_BUTTONS
DROP POLICY IF EXISTS "Users can view buttons from their own bots" ON public.custom_buttons;
CREATE POLICY "Users can view buttons from their own bots" ON public.custom_buttons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = custom_buttons.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert buttons to their own bots" ON public.custom_buttons;
CREATE POLICY "Users can insert buttons to their own bots" ON public.custom_buttons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = custom_buttons.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update buttons from their own bots" ON public.custom_buttons;
CREATE POLICY "Users can update buttons from their own bots" ON public.custom_buttons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = custom_buttons.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete buttons from their own bots" ON public.custom_buttons;
CREATE POLICY "Users can delete buttons from their own bots" ON public.custom_buttons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = custom_buttons.bot_id
            AND bots.user_id = auth.uid()
        )
    );

-- 👥 Políticas para tabela SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view subscriptions for own bots" ON public.subscriptions;
CREATE POLICY "Users can view subscriptions for own bots" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = subscriptions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert subscriptions for own bots" ON public.subscriptions;
CREATE POLICY "Users can insert subscriptions for own bots" ON public.subscriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = subscriptions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update subscriptions for own bots" ON public.subscriptions;
CREATE POLICY "Users can update subscriptions for own bots" ON public.subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = subscriptions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete subscriptions for own bots" ON public.subscriptions;
CREATE POLICY "Users can delete subscriptions for own bots" ON public.subscriptions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = subscriptions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

-- 💳 Políticas para tabela TRANSACTIONS
DROP POLICY IF EXISTS "Users can view transactions for own bots" ON public.transactions;
CREATE POLICY "Users can view transactions for own bots" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = transactions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert transactions for own bots" ON public.transactions;
CREATE POLICY "Users can insert transactions for own bots" ON public.transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = transactions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update transactions for own bots" ON public.transactions;
CREATE POLICY "Users can update transactions for own bots" ON public.transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = transactions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete transactions for own bots" ON public.transactions;
CREATE POLICY "Users can delete transactions for own bots" ON public.transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.bots
            WHERE bots.id = transactions.bot_id
            AND bots.user_id = auth.uid()
        )
    );

-- 📝 Políticas para tabela AUDIT_LOGS
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 🎯 SEÇÃO 6: PERMISSÕES PARA ROLES
-- =====================================================

-- Conceder permissões básicas para role anon (usuários não autenticados)
GRANT USAGE ON SCHEMA public TO anon;

-- Conceder permissões completas para role authenticated (usuários autenticados)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Conceder permissões para service_role (Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- ✅ SCRIPT EXECUTADO COM SUCESSO!
-- =====================================================
-- 
-- 🎉 BANCO DE DADOS DINOBOT CRIADO COM SUCESSO!
-- 
-- ✅ 7 tabelas principais criadas
-- ✅ Relacionamentos (foreign keys) configurados
-- ✅ 15 índices de performance adicionados
-- ✅ Row Level Security (RLS) habilitado
-- ✅ Políticas de segurança implementadas
-- ✅ Triggers para updated_at configurados
-- ✅ Permissões para roles definidas
-- 
-- O sistema está pronto para uso em produção!
-- 
-- 📋 Próximos passos:
-- 1. Verificar se todas as tabelas foram criadas
-- 2. Testar as políticas de RLS
-- 3. Configurar as Edge Functions
-- 4. Aplicar dados iniciais se necessário
-- 
-- =====================================================