# 🔧 DINOBOT - Guia de Configuração de Webhook

## ⚠️ SITUAÇÃO: Webhook Ativo mas Bot Não Responde

### Você está vendo:
```
✅ Webhook Active
URL: https://zjfwiirdztzmlootpqwg.supabase.co/functions/v1/telegram-webhook?bot_id=2f78771c-609c-475b-a8e1-28cbe54d61c6
```

### Mas ao digitar /start no bot:
```
❌ Bot não responde
❌ Nenhuma mensagem aparece
❌ Silêncio total
```

---

## 🔍 DIAGNÓSTICO: Por que isso acontece?

### Webhook ativo ≠ Bot funcionando

O webhook estar "ativo" significa apenas que:
- ✅ Telegram sabe a URL
- ✅ URL está registrada

**MAS NÃO significa que**:
- ❌ Edge Function está deployed
- ❌ Edge Function está funcionando
- ❌ Bot tem planos configurados
- ❌ Tabelas existem no banco

---

## 🎯 SOLUÇÃO PASSO A PASSO

### ETAPA 1: Verificar Edge Function (CRÍTICO)

A Edge Function `telegram-webhook` precisa estar deployed no Supabase.

**Como verificar**:
```
1. Acesse: https://app.supabase.com
2. Selecione projeto: zjfwiirdztzmlootpqwg
3. Menu lateral: Edge Functions
4. Procure: telegram-webhook
5. Verifique: Status deve estar "Deployed" (verde)
```

**Se NÃO estiver deployed**:
```bash
# No terminal, na pasta do projeto:

# 1. Fazer login no Supabase
supabase login

# 2. Link ao projeto
supabase link --project-ref zjfwiirdztzmlootpqwg

# 3. Deploy da função
supabase functions deploy telegram-webhook

# Aguarde confirmação:
# ✅ Deployed function telegram-webhook (xxxms)
```

**Se não tiver Supabase CLI instalado**:
```bash
npm install -g supabase
```

---

### ETAPA 2: Verificar Tabelas no Banco

O webhook precisa buscar dados do banco. Se as tabelas não existem, ele falha silenciosamente.

**Como verificar**:
```
1. Acesse: https://app.supabase.com
2. Projeto: zjfwiirdztzmlootpqwg
3. Menu: Table Editor
4. Verifique se TODAS estas tabelas existem:
   - bots ✅
   - plans ✅
   - packages ✅
   - subscriptions ✅
   - transactions ✅
   - custom_buttons ✅
   - audit_logs ✅
```

**Se alguma tabela NÃO existir**:
```
1. Abra: COMO_APLICAR_MIGRACOES.md
2. Siga o passo a passo completo
3. Execute TODO o SQL no Supabase Dashboard
4. Volte ao Table Editor e confirme tabelas criadas
```

---

### ETAPA 3: Verificar se Bot Tem Planos

O código da Edge Function verifica se há planos. Se não houver, envia mensagem genérica.

**Como verificar**:
```
1. No SaaS, vá em: Menu Bots
2. Clique em: Editor (no bot testbo1tnewBot)
3. Aba: Planos e Pacotes
4. Verifique se há pelo menos 1 plano ativo
```

**Se NÃO houver planos**:
```
1. Clique: + Novo Plano
2. Preencha:
   - Nome: Plano Teste
   - Preço: 10.00
   - Duração: 7 dias
   - Tipo: Semanal
3. Marque: Ativo
4. Clique: Salvar
```

---

### ETAPA 4: Testar Edge Function Manualmente

Vamos forçar uma chamada direta à Edge Function para ver se ela responde.

**Teste no navegador**:
```
Cole esta URL no navegador:
https://zjfwiirdztzmlootpqwg.supabase.co/functions/v1/telegram-webhook?bot_id=2f78771c-609c-475b-a8e1-28cbe54d61c6

Resultado esperado:
- Erro 405 (Method Not Allowed) = ✅ Function ONLINE
- Erro 404 (Not Found) = ❌ Function NÃO deployed
- Timeout = ❌ Function com problema
```

**Teste via curl** (terminal):
```bash
curl -X POST "https://zjfwiirdztzmlootpqwg.supabase.co/functions/v1/telegram-webhook?bot_id=2f78771c-609c-475b-a8e1-28cbe54d61c6" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "first_name": "TesteManual"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "text": "/start"
    }
  }'

# Resposta esperada:
{"ok":true}

# Se retornar erro, veja a mensagem de erro
```

---

### ETAPA 5: Ver Logs da Edge Function

Os logs mostram EXATAMENTE o que está acontecendo quando você digita /start.

**Como acessar**:
```
1. https://app.supabase.com
2. Projeto: zjfwiirdztzmlootpqwg
3. Menu: Edge Functions
4. Clique: telegram-webhook
5. Aba: Logs
6. Clique: Refresh para atualizar
```

**O que procurar nos logs**:

**✅ Logs de sucesso** (bot funcionando):
```
[WEBHOOK] Received request for bot_id: 2f78771c-609c-475b-a8e1-28cbe54d61c6
[WEBHOOK] Bot found: testbo1tnewBot
[WEBHOOK] Processing /start command for user: 123456
[WEBHOOK] Found plans: 1
[WEBHOOK] Sending text welcome message
[WEBHOOK] Sending plans keyboard
[WEBHOOK] Welcome flow completed
```

**❌ Logs de erro** (problemas):
```
[WEBHOOK] Bot not found
→ Problema: bot_id não existe no banco
→ Solução: Verificar se bot foi criado corretamente

[WEBHOOK] Bot is not active
→ Problema: Bot desativado
→ Solução: Ativar bot em Menu Bots

[WEBHOOK] Found plans: 0
→ Problema: Nenhum plano ativo
→ Solução: Criar pelo menos 1 plano

Error sending message: {...}
→ Problema: Token do bot inválido ou bot deletado
→ Solução: Verificar token com @BotFather
```

---

### ETAPA 6: Verificar Token do Bot

Se a Edge Function está OK mas bot não responde, pode ser o token.

**Como verificar**:
```
Cole no navegador (substitua TOKEN pelo seu token):
https://api.telegram.org/bot<SEU_TOKEN>/getMe

Resposta esperada:
{
  "ok": true,
  "result": {
    "id": 7894561230,
    "is_bot": true,
    "first_name": "Botnew",
    "username": "testbo1tnewBot"
  }
}

Se retornar erro = TOKEN INVÁLIDO!
```

**Onde pegar o token**:
```
1. No SaaS: Menu Bots → Lista de Bots
2. Copie o token mostrado
3. OU vá ao @BotFather no Telegram
4. Digite: /mybots
5. Selecione: testbo1tnewBot
6. Clique: API Token
```

---

### ETAPA 7: Reconfigurar Webhook (Se necessário)

Às vezes o webhook "trava". Vamos resetar.

**Método 1: Pelo SaaS**
```
1. Menu Bots
2. Clique: Webhook (no bot)
3. Clique: Remove
4. Aguarde confirmação
5. Clique: Set Webhook
6. Aguarde "✅ Ativo"
```

**Método 2: Via BotFather**
```
1. Abra @BotFather no Telegram
2. Digite: /setwebhook
3. Cole: https://zjfwiirdztzmlootpqwg.supabase.co/functions/v1/telegram-webhook?bot_id=2f78771c-609c-475b-a8e1-28cbe54d61c6
4. BotFather confirma: "Webhook was set"
```

**Método 3: Via API (avançado)**
```bash
# Remover webhook atual
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Configurar novo webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://zjfwiirdztzmlootpqwg.supabase.co/functions/v1/telegram-webhook?bot_id=2f78771c-609c-475b-a8e1-28cbe54d61c6"
  }'
```

---

### ETAPA 8: Verificar Status Detalhado do Webhook

Vamos ver o que o Telegram diz sobre o webhook.

**Como verificar**:
```
Cole no navegador (substitua TOKEN):
https://api.telegram.org/bot<TOKEN>/getWebhookInfo

Resposta esperada (tudo OK):
{
  "ok": true,
  "result": {
    "url": "https://zjfwiirdztzmlootpqwg.supabase.co/functions/v1/telegram-webhook?bot_id=2f78771c-609c-475b-a8e1-28cbe54d61c6",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": null,  ← ✅ DEVE SER NULL
    "last_error_message": null,  ← ✅ DEVE SER NULL
    "max_connections": 40
  }
}
```

**Se last_error_message NÃO for null**:
```
Exemplo de erro:
"last_error_message": "Connection timeout"
→ Edge Function não responde rápido

"last_error_message": "Wrong response"
→ Edge Function retorna resposta inválida

"last_error_message": "Not Found"
→ URL do webhook incorreta

Solução: Ver logs da Edge Function para detalhes
```

---

## 🎯 CHECKLIST RÁPIDO

Use esta lista em ordem:

```
[ ] 1. Edge Function está deployed?
    → Supabase Dashboard → Edge Functions → telegram-webhook

[ ] 2. Tabelas existem no banco?
    → Supabase Dashboard → Table Editor → Ver 7 tabelas

[ ] 3. Bot tem pelo menos 1 plano ativo?
    → Menu Bots → Editor → Planos e Pacotes

[ ] 4. Edge Function responde?
    → Abrir URL no navegador (esperar erro 405)

[ ] 5. Logs mostram requisições?
    → Supabase → Edge Functions → Logs

[ ] 6. Token do bot é válido?
    → api.telegram.org/bot{TOKEN}/getMe

[ ] 7. Webhook não tem erros?
    → api.telegram.org/bot{TOKEN}/getWebhookInfo

[ ] 8. Bot está ativo no SaaS?
    → Menu Bots → Toggle verde

[ ] 9. Mensagem de boas-vindas configurada?
    → Menu Bots → Editor → Campo preenchido

[ ] 10. Testar /start novamente?
    → Telegram → @testbo1tnewBot → /start
```

---

## 💡 TESTE FINAL

Depois de seguir TODAS as etapas acima:

```
1. Abra o bot no Telegram: @testbo1tnewBot
2. Se já digitou /start antes, bloqueie e desbloqueie o bot
3. Digite: /start
4. Aguarde 2-3 segundos

Resultado esperado:
✅ Mensagem de boas-vindas
✅ Lista de planos
✅ Botões funcionando

Se AINDA não funcionar:
→ Vá direto aos LOGS (Etapa 5)
→ Copie a mensagem de erro
→ Procure no arquivo BOT_LOGISTICS_DEBUG.md
```

---

## 🔥 SOLUÇÃO MAIS COMUM

**90% dos casos o problema é**:

### Edge Function NÃO está deployed!

**Solução rápida**:
```bash
# Terminal na pasta do projeto:
supabase login
supabase link --project-ref zjfwiirdztzmlootpqwg
supabase functions deploy telegram-webhook

# Aguarde deploy completar
# Teste /start novamente
```

---

## 📊 ENTENDENDO O FLUXO

```
Você digita /start
    ↓
Telegram API recebe
    ↓
Telegram procura webhook configurado
    ↓ (URL: https://zjfwiirdztzmlootpqwg...?bot_id=2f78771c...)
    ↓
Telegram chama Edge Function
    ↓
Edge Function busca bot no banco (usando bot_id)
    ↓
Edge Function busca planos do bot
    ↓
Edge Function monta mensagem de boas-vindas
    ↓
Edge Function envia para Telegram API
    ↓
Telegram entrega mensagem para você

⚠️ Se QUALQUER etapa falhar = bot não responde!
```

---

## 🆘 AINDA NÃO FUNCIONA?

### Teste de emergência:

1. **Deploy forçado**:
```bash
supabase functions deploy telegram-webhook --no-verify-jwt
```

2. **Ver logs em tempo real**:
```bash
supabase functions logs telegram-webhook
# Deixe rodando e digite /start no bot
# Veja o que aparece
```

3. **Reiniciar Edge Function**:
```
Supabase Dashboard → Edge Functions → telegram-webhook → Restart
```

4. **Criar novo bot do zero**:
```
1. @BotFather → /newbot
2. Criar com nome diferente
3. Pegar novo token
4. Criar no SaaS
5. Configurar webhook
6. Testar
```

---

## 📞 INFORMAÇÕES DO SEU BOT

```
Bot Username: @testbo1tnewBot
Bot ID no SaaS: 2f78771c-609c-475b-a8e1-28cbe54d61c6
Projeto Supabase: zjfwiirdztzmlootpqwg
Webhook URL: https://zjfwiirdztzmlootpqwg.supabase.co/functions/v1/telegram-webhook?bot_id=2f78771c-609c-475b-a8e1-28cbe54d61c6
Status Webhook: ✅ Ativo (mas bot não responde)
```

---

## 🎯 PRÓXIMO PASSO IMEDIATO

**Faça AGORA (em ordem)**:

1. Acesse: https://app.supabase.com
2. Vá em: Edge Functions
3. Verifique: telegram-webhook está deployed?
4. Se NÃO: Deploy via CLI (comando acima)
5. Se SIM: Vá em Logs e procure erros
6. Copie qualquer erro que encontrar
7. Procure a solução neste arquivo

---

**Sistema**: DINOBOT v1.0
**Guia**: Webhook Configuration & Debugging
**Status**: ✅ Completo - Siga passo a passo
