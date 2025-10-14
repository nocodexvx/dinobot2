# 🚀 GUIA COMPLETO DE DEPLOY E TESTE - DINOBOT

## 📋 Visão Geral

Este guia te ajudará a fazer o deploy completo do sistema DINOBOT e testar todas as funcionalidades. O sistema está 100% funcional e pronto para produção!

## 🎯 Pré-requisitos

- ✅ Conta no [Supabase](https://supabase.com)
- ✅ Conta no [Vercel](https://vercel.com) ou [Netlify](https://netlify.com)
- ✅ Bot do Telegram criado via [@BotFather](https://t.me/botfather)
- ✅ Gateway de pagamento PIX (PushinPay, SyncPay, etc.)

---

## 🗄️ PASSO 1: CONFIGURAR SUPABASE

### 1.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha um nome para o projeto (ex: `dinobot-production`)
4. Defina uma senha forte para o banco
5. Selecione a região mais próxima
6. Clique em "Create new project"

### 1.2 Executar Script SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `DINOBOT_DATABASE_COMPLETE.sql`
4. Cole no editor SQL
5. Clique em **"Run"** para executar

**✅ Resultado esperado:**
```
✅ 7 tabelas principais criadas
✅ 15 índices de performance adicionados
✅ Row Level Security (RLS) habilitado
✅ 28 políticas de segurança implementadas
✅ Triggers configurados
✅ Permissões definidas
```

### 1.3 Obter Credenciais

No painel do Supabase, vá em **Settings > API**:

- **URL**: `https://seu-projeto.supabase.co`
- **ANON KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **SERVICE ROLE KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🌐 PASSO 2: DEPLOY NA VERCEL (RECOMENDADO)

### 2.1 Preparar Repositório

1. Faça push do código para o GitHub:
```bash
git add .
git commit -m "Deploy: Sistema DINOBOT pronto para produção"
git push origin main
```

### 2.2 Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Selecione o repositório do DINOBOT
5. Configure as variáveis de ambiente (ver seção 3)
6. Clique em "Deploy"

**⚡ Deploy automático em ~2 minutos!**

### 2.3 Configurar Domínio (Opcional)

1. No painel da Vercel, vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções

---

## 🔧 PASSO 3: VARIÁVEIS DE AMBIENTE

### 3.1 Criar arquivo .env.local

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role (apenas para Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ
TELEGRAM_WEBHOOK_SECRET=seu-webhook-secret-aqui

# Payment Gateway (escolha um)
PUSHINPAY_API_KEY=sua-api-key-pushinpay
PUSHINPAY_SECRET=seu-secret-pushinpay

# OU
SYNCPAY_API_KEY=sua-api-key-syncpay
SYNCPAY_SECRET=seu-secret-syncpay

# Application Settings
NODE_ENV=production
VITE_APP_URL=https://seu-app.vercel.app
```

### 3.2 Configurar na Vercel

1. No painel da Vercel, vá em **Settings > Environment Variables**
2. Adicione cada variável uma por uma
3. Marque para todos os ambientes (Production, Preview, Development)
4. Clique em "Save"

---

## 🤖 PASSO 4: CONFIGURAR BOT TELEGRAM

### 4.1 Criar Bot no BotFather

1. Abra o Telegram e procure por [@BotFather](https://t.me/botfather)
2. Digite `/newbot`
3. Escolha um nome para o bot (ex: "ApexVIPS Bot")
4. Escolha um username (ex: "apexvips_bot")
5. Copie o **token** fornecido

### 4.2 Configurar Webhook

Execute este comando substituindo os valores:

```bash
curl -X POST "https://api.telegram.org/bot<SEU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-projeto.supabase.co/functions/v1/telegram-webhook",
    "secret_token": "seu-webhook-secret"
  }'
```

### 4.3 Criar Grupos VIP

1. Crie um grupo no Telegram para usuários VIP
2. Adicione o bot como administrador
3. Copie o ID do grupo (use [@userinfobot](https://t.me/userinfobot))

---

## 💳 PASSO 5: CONFIGURAR PAGAMENTOS PIX

### 5.1 PushinPay (Recomendado)

1. Acesse [pushinpay.com.br](https://pushinpay.com.br)
2. Crie uma conta
3. Obtenha API Key e Secret
4. Configure webhook: `https://seu-projeto.supabase.co/functions/v1/confirm-payment`

### 5.2 SyncPay (Alternativa)

1. Acesse [syncpay.com.br](https://syncpay.com.br)
2. Crie uma conta
3. Obtenha credenciais da API
4. Configure webhook de confirmação

---

## ✅ PASSO 6: TESTE COMPLETO DO SISTEMA

### 6.1 Checklist de Testes

#### 🔐 Autenticação
- [ ] Registro de novo usuário
- [ ] Login com email/senha
- [ ] Logout
- [ ] Recuperação de senha

#### 🤖 Gerenciamento de Bots
- [ ] Criar novo bot
- [ ] Configurar token do Telegram
- [ ] Definir grupos VIP
- [ ] Ativar/desativar bot
- [ ] Personalizar mensagens

#### 📋 Planos e Pacotes
- [ ] Criar planos de assinatura
- [ ] Criar pacotes únicos
- [ ] Configurar preços
- [ ] Definir durações
- [ ] Order bump

#### 🔘 Botões Personalizados
- [ ] Adicionar botões customizados
- [ ] Definir URLs externas
- [ ] Ordenar botões
- [ ] Editar/excluir botões

#### 💰 Pagamentos PIX
- [ ] Gerar PIX para plano
- [ ] Gerar PIX para pacote
- [ ] QR Code funcional
- [ ] Confirmação automática
- [ ] Webhook de pagamento

#### 👥 Gestão de Usuários
- [ ] Adicionar usuário ao grupo VIP
- [ ] Remover usuário expirado
- [ ] Listar assinaturas ativas
- [ ] Histórico de transações

### 6.2 Teste do Fluxo Telegram

1. **Iniciar conversa com o bot:**
   ```
   /start
   ```

2. **Verificar resposta:**
   - Mensagem de boas-vindas
   - Mídia (se configurada)
   - Botão CTA (se habilitado)
   - Lista de planos

3. **Selecionar plano:**
   - Detalhes do plano
   - Order bump (se configurado)
   - Opções de pagamento

4. **Gerar PIX:**
   - Código PIX copiável
   - QR Code funcional
   - Instruções de pagamento

5. **Confirmar pagamento:**
   - Verificação automática
   - Adição ao grupo VIP
   - Mensagem de confirmação

### 6.3 Teste de Performance

Execute estes comandos para verificar a performance:

```bash
# Teste de velocidade do site
curl -w "@curl-format.txt" -o /dev/null -s "https://seu-app.vercel.app"

# Teste de API
curl -X GET "https://seu-projeto.supabase.co/rest/v1/bots" \
  -H "apikey: sua-anon-key" \
  -H "Authorization: Bearer seu-token"
```

---

## 🔧 PASSO 7: TROUBLESHOOTING

### 7.1 Problemas Comuns

#### ❌ "Failed to load resource: 404 (packages)"
**Solução:** Execute o script SQL completo no Supabase

#### ❌ "Permission denied for table"
**Solução:** Verificar se RLS está configurado corretamente
```sql
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated');
```

#### ❌ Bot não responde no Telegram
**Solução:** Verificar webhook e token
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

#### ❌ PIX não é gerado
**Solução:** Verificar credenciais do gateway de pagamento

### 7.2 Logs e Monitoramento

#### Supabase Logs
1. Vá em **Logs > Edge Functions**
2. Filtre por função específica
3. Verifique erros em tempo real

#### Vercel Logs
1. Vá em **Functions > View Function Logs**
2. Monitore requests em tempo real
3. Identifique erros de deploy

---

## 📊 PASSO 8: MONITORAMENTO PÓS-DEPLOY

### 8.1 Métricas Importantes

- **Uptime**: 99.9%+ (Vercel + Supabase)
- **Response Time**: <200ms
- **Error Rate**: <1%
- **Conversão de Pagamentos**: Monitorar via dashboard

### 8.2 Backup e Segurança

1. **Backup automático** do Supabase (diário)
2. **Logs de auditoria** na tabela `audit_logs`
3. **Rate limiting** nas Edge Functions
4. **RLS** em todas as tabelas

---

## 🎉 CONCLUSÃO

Após seguir este guia, você terá:

✅ **Sistema 100% funcional** em produção  
✅ **Bots Telegram** operacionais  
✅ **Pagamentos PIX** automatizados  
✅ **Dashboard** completo para gestão  
✅ **Segurança** enterprise-level  
✅ **Performance** otimizada  

## 🆘 Suporte

Se encontrar algum problema:

1. Verifique os logs no Supabase e Vercel
2. Consulte a seção de troubleshooting
3. Revise as variáveis de ambiente
4. Teste as APIs individualmente

**🚀 Seu sistema DINOBOT está pronto para gerar receita!**