# 🤖 DINOBOT - Sistema de Gerenciamento de Bots Telegram

> **🚀 Sistema 100% funcional e pronto para produção!**

Plataforma SaaS completa para gerenciar grupos VIP do Telegram com assinaturas automatizadas, pagamentos PIX e controle de membros.

## ⚡ Deploy Rápido (5 minutos)

### 🎯 Opção 1: Deploy Completo
```bash
# 1. Clone o repositório
git clone <repository-url>
cd dinobot

# 2. Configure Supabase (execute o SQL)
# Copie DINOBOT_DATABASE_COMPLETE.sql no Supabase SQL Editor

# 3. Deploy na Vercel
vercel --prod

# 4. Configure variáveis de ambiente
# Ver GUIA_DEPLOY_TESTE.md para detalhes completos
```

### 🎯 Opção 2: Teste Local
```bash
npm install
npm run dev
```

**📖 Para instruções completas, consulte: [`GUIA_DEPLOY_TESTE.md`](./GUIA_DEPLOY_TESTE.md)**

---

## 🚀 Funcionalidades Principais

### 🤖 Gerenciamento de Bots
- ✅ Múltiplos bots Telegram
- ✅ Validação automática de tokens
- ✅ Mensagens personalizadas com preview
- ✅ Suporte para mídia (imagens/vídeos)
- ✅ Grupos VIP e canais de registro
- ✅ Webhook configurável
- ✅ Botão CTA personalizável

### 📋 Planos & Pacotes
- ✅ Planos flexíveis (semanal, mensal, vitalício)
- ✅ Pacotes de compra única
- ✅ Order Bump (upsell) com mídia
- ✅ Preços e durações customizáveis
- ✅ Preview em tempo real

### 🔘 Botões Personalizados
- ✅ Links externos configuráveis
- ✅ Ordem personalizável
- ✅ Integração com CTA

### 💳 Pagamentos PIX
- ✅ **4 Gateways integrados:**
  - PushinPay ⭐ (Recomendado)
  - Syncpay
  - Mercado Pago
  - Asaas
- ✅ Geração automática de PIX
- ✅ QR Code para pagamento
- ✅ Confirmação automática via webhook
- ✅ Timeout de 15 minutos

### 🔄 Automações
- ✅ Adição automática aos grupos VIP
- ✅ Notificações de expiração (3 dias antes)
- ✅ Remoção automática de usuários expirados
- ✅ Logs completos de operações
- ✅ Sistema de renovação

### 📊 Analytics & Estatísticas
- ✅ Dashboard com métricas em tempo real
- ✅ Receita total e por bot
- ✅ Assinaturas ativas
- ✅ Taxa de conversão
- ✅ Gráficos de crescimento
- ✅ Histórico completo de transações

### 🔒 Segurança & Performance
- ✅ Rate limiting em endpoints
- ✅ Validação com Zod
- ✅ Audit logs completos
- ✅ Row Level Security (RLS)
- ✅ Code splitting e lazy loading
- ✅ 15 índices de performance
- ✅ Paginação otimizada

### 🎨 UI/UX
- ✅ Design responsivo (mobile-first)
- ✅ Skeleton loaders
- ✅ Toast notifications
- ✅ Empty states com ilustrações
- ✅ Animações suaves
- ✅ Preview em tempo real

---

## 🛠️ Instalação & Deploy

### 📋 Pré-requisitos
- ✅ Node.js 18+
- ✅ Conta [Supabase](https://supabase.com) (grátis)
- ✅ Bot Telegram ([@BotFather](https://t.me/botfather))
- ✅ Gateway PIX (PushinPay/SyncPay)

### 🚀 Deploy Produção (Recomendado)

**1. Configurar Supabase:**
```sql
-- Execute no Supabase SQL Editor
-- Copie todo o conteúdo de: DINOBOT_DATABASE_COMPLETE.sql
```

**2. Deploy na Vercel:**
```bash
git clone <repository-url>
cd dinobot
vercel --prod
```

**3. Configurar Variáveis:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF...
PUSHINPAY_API_KEY=sua-api-key
```

### 🔧 Desenvolvimento Local

**1. Clone e instale:**
```bash
git clone <repository-url>
cd dinobot
npm install
```

**2. Configure ambiente:**
```bash
cp .env.example .env.local
# Edite as variáveis necessárias
```

**3. Execute:**
```bash
npm run dev
```

**4. Build:**
```bash
npm run build
```

## 📁 Estrutura do Projeto

```
/src
  /components          - Componentes reutilizáveis
    BotCard.tsx       - Card de bot
    EmptyState.tsx    - Estado vazio
    MetricCard.tsx    - Card de métrica
    Pagination.tsx    - Paginação
    PlanModal.tsx     - Modal de planos
    PackageModal.tsx  - Modal de pacotes
    SkeletonLoader.tsx - Loading states
    Toast.tsx         - Notificações

  /contexts           - Contextos React
    AuthContext.tsx   - Estado de autenticação

  /hooks              - Custom hooks
    usePagination.ts  - Hook de paginação

  /lib                - Utilitários
    supabase.ts       - Cliente Supabase
    validation.ts     - Schemas Zod
    rate-limiter.ts   - Rate limiting
    telegram-service.ts - API do Telegram

  /pages              - Páginas da aplicação
    Dashboard.tsx     - Dashboard principal
    Bots.tsx          - Lista de bots
    BotCreate.tsx     - Criar/editar bot
    BotEditor.tsx     - Editor completo de bot
    BotPayment.tsx    - Configurar pagamento
    BotWebhook.tsx    - Configurar webhook
    BotCommands.tsx   - Comandos do bot
    Plans.tsx         - Lista de planos
    PlanForm.tsx      - Criar/editar plano
    Subscriptions.tsx - Lista de assinaturas
    Transactions.tsx  - Histórico de transações
    Statistics.tsx    - Estatísticas avançadas
    CronLogs.tsx      - Logs de automações
    Login.tsx         - Login/cadastro

/supabase
  /functions          - Edge Functions
    telegram-webhook  - Webhook do Telegram
    generate-pix      - Gerar PIX
    confirm-payment   - Confirmar pagamento
    notify-expiring-soon - Notificações
    remove-expired-users - Remover expirados

  /migrations         - Migrações SQL
    (11 migrations)
```

## 🎯 Como Usar

### 1. Criar seu primeiro bot

1. Acesse a página **Bots** no menu lateral
2. Clique em **Create Bot**
3. Cole o token do bot (obtido via @BotFather)
4. O sistema valida automaticamente
5. Configure a mensagem de boas-vindas (com preview!)
6. Defina os grupos VIP e canal de registro
7. Clique em **Save Bot**

### 2. Configurar no Editor

1. Na lista de bots, clique em **Editor**
2. Configure:
   - Mensagem de boas-vindas
   - Botão CTA
   - Planos e Pacotes
   - Botões personalizados
   - Mensagens de pagamento PIX
3. Veja o preview em tempo real de todas as mudanças

### 3. Criar planos e pacotes

1. No Editor, clique em **+ Novo Plano** ou **+ Novo Pacote**
2. Defina nome, preço e deliverables
3. Configure order bump se desejar
4. Veja o preview antes de salvar

### 4. Configurar webhook do Telegram

1. Na lista de bots, clique em **Webhook**
2. Copie a URL gerada
3. Clique em **Set Webhook**
4. Verifique o status

### 5. Monitorar

- **Dashboard**: Visão geral de receita e métricas
- **Subscriptions**: Todas as assinaturas ativas
- **Transactions**: Histórico de pagamentos
- **Statistics**: Gráficos e análises detalhadas
- **Cron Logs**: Logs das automações

## 🔒 Segurança

### Rate Limiting
```typescript
import { rateLimit } from './lib/rate-limiter';

// Limitar a 10 requisições por minuto
if (!rateLimit(identifier, 10, 60000)) {
  return new Response('Too many requests', { status: 429 });
}
```

### Validação de Inputs
```typescript
import { validateInput, BotSchema } from './lib/validation';

const result = validateInput(BotSchema, data);
if (!result.success) {
  console.error(result.errors);
  return;
}
```

### Audit Logs
Todas as ações importantes são registradas:
```sql
SELECT * FROM audit_logs
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

## ⚡ Performance

### Code Splitting
- Bundle principal: 318KB (96KB gzip)
- Páginas individuais: 5-11KB
- Carregamento sob demanda

### Database Indexes
8 indexes otimizam queries frequentes:
- subscriptions.status
- transactions.created_at
- plans.bot_id
- packages.bot_id
- E mais...

### Paginação
```typescript
const { currentItems, goToPage } = usePagination(items, {
  itemsPerPage: 10
});
```

## 📊 Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth (email/password)
- **Payment**: PIX (PushinPay, Syncpay, etc.)
- **Validation**: Zod
- **Deployment**: Vercel, Netlify ou qualquer host estático

## 📈 Status do Projeto

**Progresso: 100% Completo ✅**

### Tabelas do Banco de Dados:
1. ✅ `bots` - Configuração dos bots
2. ✅ `plans` - Planos de assinatura
3. ✅ `packages` - Pacotes de compra única
4. ✅ `custom_buttons` - Botões personalizados
5. ✅ `subscriptions` - Assinaturas ativas
6. ✅ `transactions` - Histórico de pagamentos
7. ✅ `audit_logs` - Logs de auditoria

### Funcionalidades:
- ✅ Gerenciamento completo de bots
- ✅ Planos e pacotes com order bump
- ✅ Botões personalizados
- ✅ Preview em tempo real
- ✅ Integração PIX completa
- ✅ Automações (cron jobs)
- ✅ Analytics e estatísticas
- ✅ Segurança e performance

## 🐛 Troubleshooting

### Bot não responde
1. Verifique se o webhook está configurado
2. Confirme que o bot está ativo
3. Revise os logs de edge function

### Pagamento não confirma
1. Verifique as credenciais do gateway
2. Confirme que o webhook está configurado
3. Revise a tabela de transações

### Usuário não é adicionado ao grupo
1. Verifique se o bot é admin do grupo
2. Confirme o group_id
3. Revise os logs de cron

### Erro ao criar plano/pacote
1. Aplique as migrações seguindo `COMO_APLICAR_MIGRACOES.md`
2. Verifique se todas as tabelas foram criadas
3. Recarregue a página após aplicar migrações

## 📄 Documentação Adicional

- [SECURITY.md](./SECURITY.md) - Segurança e melhores práticas
- [COMO_APLICAR_MIGRACOES.md](./COMO_APLICAR_MIGRACOES.md) - Guia de migrações
- [APPLY_MIGRATIONS.md](./APPLY_MIGRATIONS.md) - SQL das migrações

## 🤝 Suporte

Para dúvidas e problemas:
- Telegram: @DINOBOT_Suporte
- Revise a documentação
- Verifique os logs de erro

## 📝 Licença

Privado - Todos os direitos reservados

## 🎉 Créditos

Desenvolvido com Claude Code e Supabase
