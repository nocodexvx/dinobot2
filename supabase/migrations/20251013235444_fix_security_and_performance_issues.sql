/*
  # Correção de Issues de Segurança e Performance

  1. Adicionar Índices em Foreign Keys
    - Adicionar índice em subscriptions.plan_id
    - Adicionar índice em transactions.plan_id
    - Adicionar índice em transactions.subscription_id

  2. Otimizar RLS Policies
    - Substituir auth.uid() por (SELECT auth.uid())
    - Aplicar em todas as policies de bots, plans, subscriptions, transactions, audit_logs

  3. Remover Índices Não Utilizados
    - Remover índices que não estão sendo usados

  4. Melhorias de Performance
    - Otimizar queries com subselects
*/

-- =====================================================
-- PARTE 1: ADICIONAR ÍNDICES EM FOREIGN KEYS
-- =====================================================

-- Índice para subscriptions.plan_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id 
ON subscriptions(plan_id);

-- Índice para transactions.plan_id  
CREATE INDEX IF NOT EXISTS idx_transactions_plan_id 
ON transactions(plan_id);

-- Índice para transactions.subscription_id
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id 
ON transactions(subscription_id);

-- =====================================================
-- PARTE 2: OTIMIZAR RLS POLICIES - BOTS
-- =====================================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view own bots" ON bots;
DROP POLICY IF EXISTS "Users can insert own bots" ON bots;
DROP POLICY IF EXISTS "Users can update own bots" ON bots;
DROP POLICY IF EXISTS "Users can delete own bots" ON bots;

-- Recriar com otimização
CREATE POLICY "Users can view own bots" 
ON bots FOR SELECT 
TO authenticated 
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own bots" 
ON bots FOR INSERT 
TO authenticated 
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own bots" 
ON bots FOR UPDATE 
TO authenticated 
USING (user_id = (SELECT auth.uid())) 
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own bots" 
ON bots FOR DELETE 
TO authenticated 
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- PARTE 3: OTIMIZAR RLS POLICIES - PLANS
-- =====================================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view plans for own bots" ON plans;
DROP POLICY IF EXISTS "Users can insert plans for own bots" ON plans;
DROP POLICY IF EXISTS "Users can update plans for own bots" ON plans;
DROP POLICY IF EXISTS "Users can delete plans for own bots" ON plans;

-- Recriar com otimização
CREATE POLICY "Users can view plans for own bots" 
ON plans FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = plans.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert plans for own bots" 
ON plans FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = plans.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update plans for own bots" 
ON plans FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = plans.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = plans.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete plans for own bots" 
ON plans FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = plans.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

-- =====================================================
-- PARTE 4: OTIMIZAR RLS POLICIES - SUBSCRIPTIONS
-- =====================================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view subscriptions for own bots" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert subscriptions for own bots" ON subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions for own bots" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete subscriptions for own bots" ON subscriptions;

-- Recriar com otimização
CREATE POLICY "Users can view subscriptions for own bots" 
ON subscriptions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = subscriptions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert subscriptions for own bots" 
ON subscriptions FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = subscriptions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update subscriptions for own bots" 
ON subscriptions FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = subscriptions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = subscriptions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete subscriptions for own bots" 
ON subscriptions FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = subscriptions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

-- =====================================================
-- PARTE 5: OTIMIZAR RLS POLICIES - TRANSACTIONS
-- =====================================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view transactions for own bots" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions for own bots" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for own bots" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions for own bots" ON transactions;

-- Recriar com otimização
CREATE POLICY "Users can view transactions for own bots" 
ON transactions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = transactions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert transactions for own bots" 
ON transactions FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = transactions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update transactions for own bots" 
ON transactions FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = transactions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = transactions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete transactions for own bots" 
ON transactions FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bots 
    WHERE bots.id = transactions.bot_id 
    AND bots.user_id = (SELECT auth.uid())
  )
);

-- =====================================================
-- PARTE 6: OTIMIZAR RLS POLICIES - AUDIT_LOGS
-- =====================================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;

-- Recriar com otimização
CREATE POLICY "Users can view own audit logs" 
ON audit_logs FOR SELECT 
TO authenticated 
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- PARTE 7: REMOVER ÍNDICES NÃO UTILIZADOS
-- =====================================================

-- Remover índices que não estão sendo usados
DROP INDEX IF EXISTS idx_bots_is_active;
DROP INDEX IF EXISTS idx_subscriptions_telegram_user_id;
DROP INDEX IF EXISTS idx_transactions_bot_id;
DROP INDEX IF EXISTS idx_cron_job_logs_job_name;
DROP INDEX IF EXISTS idx_bots_payment_enabled;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_resource;

-- =====================================================
-- PARTE 8: ADICIONAR ÍNDICES ÚTEIS
-- =====================================================

-- Índice composto para queries comuns em subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_bot_status 
ON subscriptions(bot_id, status) 
WHERE status = 'ACTIVE';

-- Índice composto para queries comuns em transactions
CREATE INDEX IF NOT EXISTS idx_transactions_bot_status 
ON transactions(bot_id, status);

-- Índice para queries de planos ativos
CREATE INDEX IF NOT EXISTS idx_plans_bot_active 
ON plans(bot_id, is_active) 
WHERE is_active = true;

-- Índice para bots ativos do usuário
CREATE INDEX IF NOT EXISTS idx_bots_user_active 
ON bots(user_id, is_active) 
WHERE is_active = true;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON INDEX idx_subscriptions_plan_id IS 'Índice para melhorar performance de queries com foreign key plan_id';
COMMENT ON INDEX idx_transactions_plan_id IS 'Índice para melhorar performance de queries com foreign key plan_id';
COMMENT ON INDEX idx_transactions_subscription_id IS 'Índice para melhorar performance de queries com foreign key subscription_id';
COMMENT ON INDEX idx_subscriptions_bot_status IS 'Índice composto para queries de assinaturas ativas por bot';
COMMENT ON INDEX idx_transactions_bot_status IS 'Índice composto para queries de transações por bot e status';
COMMENT ON INDEX idx_plans_bot_active IS 'Índice parcial para queries de planos ativos';
COMMENT ON INDEX idx_bots_user_active IS 'Índice parcial para queries de bots ativos do usuário';