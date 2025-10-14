# 🤖 Guia Completo: Configuração do Bot Telegram

## 📋 Problemas Identificados e Soluções

### ✅ **PROBLEMA 1: Erro de Schema Resolvido**
- **Erro**: `PGRST204` - coluna `payment_method_button_text` não existe na tabela `bots`
- **Solução**: Migração aplicada com sucesso ✅
- **Status**: Resolvido - todas as colunas necessárias foram adicionadas

### ⚠️ **PROBLEMA 2: Bot não responde ao /start**
- **Causa**: Edge Functions não estão deployadas no Supabase
- **Status**: Identificado - precisa de deploy manual

---

## 🚀 **PASSO A PASSO PARA CONFIGURAR O BOT**

### **1. Verificar se você tem um bot criado**
1. Acesse o painel: `http://localhost:5174/login`
2. Faça login ou crie uma conta
3. Vá em "Bots" e verifique se existe um bot configurado
4. Se não existir, clique em "Novo Bot" e configure:
   - Token do bot (obtido do @BotFather)
   - Nome do bot
   - Username do bot
   - Grupo VIP ID
   - Canal de registro ID

### **2. Configurar o Webhook do Bot**
1. Após criar o bot, clique em "Configurar Webhook"
2. A URL do webhook será gerada automaticamente:
   ```
   https://kwwhzysrvivbybaetpbb.supabase.co/functions/v1/telegram-webhook?bot_id=SEU_BOT_ID
   ```
3. Clique em "Configurar Webhook"
4. Aguarde a confirmação de sucesso

### **3. Problema Atual: Edge Functions**
**⚠️ ATENÇÃO**: As Edge Functions não estão deployadas no Supabase.

**Erro encontrado**:
```
{"code":"NOT_FOUND","message":"Requested function was not found"}
```

**Causa**: Falta de permissões para deploy das Edge Functions.

---

## 🔧 **SOLUÇÕES PARA O PROBLEMA DAS EDGE FUNCTIONS**

### **Opção 1: Deploy Manual (Recomendado)**
1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá no seu projeto: `kwwhzysrvivbybaetpbb`
3. Navegue para "Edge Functions"
4. Clique em "Create Function"
5. Nome: `telegram-webhook`
6. Cole o código do arquivo: `supabase/functions/telegram-webhook/index.ts`
7. Clique em "Deploy"

### **Opção 2: Configurar CLI do Supabase**
1. Instale o Supabase CLI globalmente:
   ```bash
   npm install -g supabase
   ```
2. Faça login:
   ```bash
   supabase login
   ```
3. Vincule o projeto:
   ```bash
   supabase link --project-ref kwwhzysrvivbybaetpbb
   ```
4. Deploy das funções:
   ```bash
   supabase functions deploy telegram-webhook
   supabase functions deploy generate-pix
   supabase functions deploy confirm-payment
   ```

### **Opção 3: Verificar Permissões**
- Verifique se sua conta tem permissões de administrador no projeto Supabase
- Se não tiver, solicite acesso ao proprietário do projeto

---

## 🧪 **COMO TESTAR SE O BOT ESTÁ FUNCIONANDO**

### **1. Teste Básico**
1. Abra o Telegram
2. Procure pelo seu bot (username configurado)
3. Digite `/start`
4. **Resultado esperado**: Bot deve responder com mensagem de boas-vindas e mostrar planos

### **2. Se o bot não responder**
Verifique na ordem:

1. **Webhook configurado?**
   ```bash
   curl "https://api.telegram.org/botSEU_TOKEN/getWebhookInfo"
   ```

2. **Edge Function deployada?**
   ```bash
   curl "https://kwwhzysrvivbybaetpbb.supabase.co/functions/v1/telegram-webhook?bot_id=test"
   ```
   - Se retornar `NOT_FOUND`, as funções não estão deployadas

3. **Bot ativo no banco?**
   - Verifique no painel se o bot está marcado como "ativo"

### **3. Logs de Debug**
- Acesse o Supabase Dashboard > Edge Functions > Logs
- Monitore os logs em tempo real quando testar o bot

---

## 📝 **CHECKLIST DE CONFIGURAÇÃO**

### **Pré-requisitos**
- [ ] Conta no Telegram
- [ ] Bot criado via @BotFather
- [ ] Token do bot obtido
- [ ] Grupo VIP criado
- [ ] Canal de registro criado
- [ ] Conta no painel do sistema

### **Configuração no Sistema**
- [ ] Bot criado no painel
- [ ] Token configurado
- [ ] Grupos configurados
- [ ] Planos criados
- [ ] Webhook configurado
- [ ] Bot marcado como ativo

### **Edge Functions (CRÍTICO)**
- [ ] telegram-webhook deployada
- [ ] generate-pix deployada
- [ ] confirm-payment deployada
- [ ] Permissões corretas no Supabase

### **Teste Final**
- [ ] Bot responde ao /start
- [ ] Mostra planos disponíveis
- [ ] Permite seleção de plano
- [ ] Gera PIX para pagamento
- [ ] Confirma pagamento automaticamente

---

## 🆘 **TROUBLESHOOTING**

### **Bot não responde**
1. Verifique o token do bot
2. Confirme se o webhook está configurado
3. Verifique se as Edge Functions estão deployadas
4. Monitore os logs do Supabase

### **Erro de permissão no deploy**
```
Your account does not have the necessary privileges
```
**Solução**: Use o painel web do Supabase para deploy manual

### **Webhook não configura**
1. Verifique se o token está correto
2. Teste o token manualmente:
   ```bash
   curl "https://api.telegram.org/botSEU_TOKEN/getMe"
   ```

### **PIX não é gerado**
1. Verifique se a função `generate-pix` está deployada
2. Configure as credenciais do gateway de pagamento
3. Verifique os logs da função

---

## 🎯 **PRÓXIMOS PASSOS**

1. **URGENTE**: Deploy das Edge Functions no Supabase
2. Configurar gateway de pagamento (PushinPay/SyncPay)
3. Testar fluxo completo de pagamento
4. Configurar notificações automáticas
5. Monitorar logs e performance

---

## 📞 **Suporte**

Se ainda tiver problemas:
1. Verifique os logs do Supabase
2. Teste cada componente individualmente
3. Monitore as requisições HTTP
4. Verifique as permissões de acesso

**Status Atual**: ✅ Schema corrigido | ⚠️ Edge Functions precisam ser deployadas