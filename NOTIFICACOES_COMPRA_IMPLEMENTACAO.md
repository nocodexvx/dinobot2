# 📧 IMPLEMENTAÇÃO DE NOTIFICAÇÕES DETALHADAS DE COMPRA

## ✅ MIGRATIONS APLICADAS

Migração aplicada com sucesso: `20251014180000_add_customer_info_to_transactions.sql`

### Novos Campos Adicionados na Tabela `transactions`:

```sql
- customer_full_name: text          -- Nome completo do cliente
- customer_cpf_cnpj: text            -- CPF ou CNPJ (será mascarado na exibição)
- customer_username: text            -- @username do Telegram
- customer_language: text            -- Idioma (pt-br, en, es, etc.)
- is_telegram_premium: boolean       -- Se é usuário Premium do Telegram
- conversion_time_seconds: integer   -- Tempo desde o /start até a compra
- net_amount: decimal(10,2)          -- Valor líquido após taxas
- currency_type: text                -- BRL, USD, EUR, etc.
- conversation_start_time: timestamptz -- Quando iniciou conversa com o bot
```

## 📦 ARQUIVO CRIADO: `notification-service.ts`

Localização: `/supabase/functions/telegram-webhook/notification-service.ts`

### Funções Disponíveis:

#### 1. `sendPurchaseNotification()`

Envia notificação completa ao Grupo de Notificação com todos os dados da compra.

**Formato da Mensagem:**
```
🎉 Pagamento Aprovado!

🤖 Bot: Dino
⚙️ ID Bot: 25741

👤 DADOS DO CLIENTE:
🆔 ID Cliente: 6431890327
👤 Nome de Perfil: João Silva
👤 Nome Completo: JOÃO SILVA S****
💳 CPF/CNPJ: 123.***.***-45
📱 Username: @joaosilva
🌐 Idioma: pt-br
⭐ Telegram Premium: Não

💰 DADOS DA COMPRA:
📦 Categoria: Plano
🎁 Plano: ⭐️ Acesso Mensal VIP ⭐️
📅 Duração: 30 dias
💰 Valor: R$29,90
💵 Valor Líquido: R$27,41

⏱️ INFORMAÇÕES ADICIONAIS:
⏳ Tempo Conversão: 0d 0h 3m 15s
🔑 ID Transação Interna: xyz123abc
🏷️ ID Transação Gateway: a0166b9d-d46b-4d86-8944-a5d11a93a762
💱 Tipo Moeda: BRL
💳 Método Pagamento: pix
🏦 Plataforma Pagamento: pushinpay
🕐 Data/Hora: 14/10/2025 10:30

✅ Cliente adicionado ao Grupo VIP automaticamente!
```

#### 2. `sendUserToVipGroup()`

Cria link único de convite e envia ao usuário com instruções.

**Mensagem enviada ao cliente:**
```
🎉 PAGAMENTO APROVADO! 🎉

Seu pagamento foi confirmado com sucesso!

🔐 Seu acesso ao Grupo VIP está liberado!

👉 Clique no link abaixo para entrar:
[link único]

⚠️ ATENÇÃO:
• Este link é único e pessoal
• Válido por 1 hora
• Só pode ser usado 1 vez
• Não compartilhe com outras pessoas

🎁 Benefícios do Grupo VIP:
✅ Conteúdo exclusivo diário
✅ Suporte prioritário
✅ Materiais premium
✅ Comunidade ativa

Qualquer dúvida, estou aqui! 😊

[Botão: 🚀 Acessar Grupo VIP]
```

## 🔧 COMO INTEGRAR NO WEBHOOK

### Passo 1: Importar o serviço

No arquivo `telegram-webhook/index.ts`, adicione:

```typescript
import { sendPurchaseNotification, sendUserToVipGroup } from './notification-service.ts';
```

### Passo 2: Quando Pagamento for Aprovado

Quando detectar pagamento aprovado (via webhook do gateway ou confirmação manual):

```typescript
// Exemplo de integração
async function handlePaymentApproved(paymentData: any, bot: any) {
  try {
    // 1. Buscar dados do bot
    const { data: botData } = await supabase
      .from('bots')
      .select('*')
      .eq('id', paymentData.bot_id)
      .single();

    if (!botData) {
      throw new Error('Bot not found');
    }

    // 2. Buscar dados do plano/pacote
    const { data: planData } = await supabase
      .from('plans')
      .select('*')
      .eq('id', paymentData.plan_id)
      .maybeSingle();

    // 3. Buscar informações do usuário do Telegram
    const telegramUser = await bot.getUser(paymentData.telegram_user_id);

    // 4. Calcular tempo de conversão
    const conversationStartTime = paymentData.conversation_start_time
      ? new Date(paymentData.conversation_start_time).getTime()
      : Date.now();
    const conversionTimeSeconds = Math.floor((Date.now() - conversationStartTime) / 1000);

    // 5. Criar registro de transação com TODOS os dados
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        bot_id: botData.id,
        telegram_user_id: paymentData.telegram_user_id,
        plan_id: paymentData.plan_id || null,
        package_id: paymentData.package_id || null,
        amount: paymentData.amount,
        net_amount: paymentData.net_amount || paymentData.amount * 0.92, // Exemplo: 8% de taxa
        status: 'approved',
        payment_method: paymentData.payment_method,
        gateway_transaction_id: paymentData.gateway_transaction_id,

        // NOVOS CAMPOS COM DADOS DO CLIENTE
        customer_full_name: paymentData.customer_full_name,
        customer_cpf_cnpj: paymentData.customer_cpf_cnpj,
        customer_username: telegramUser.username || null,
        customer_language: telegramUser.language_code || 'pt-br',
        is_telegram_premium: telegramUser.is_premium || false,
        conversion_time_seconds: conversionTimeSeconds,
        currency_type: paymentData.currency || 'BRL',
        conversation_start_time: new Date(conversationStartTime).toISOString(),

        pix_qrcode: paymentData.pix_qrcode || null,
        pix_copy_paste: paymentData.pix_copy_paste || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 6. Enviar notificação detalhada ao Grupo de Notificação
    await sendPurchaseNotification(
      botData.bot_token,
      botData.registry_channel_id,
      {
        botId: botData.id,
        botName: botData.bot_name,
        customerId: String(paymentData.telegram_user_id),
        customerName: telegramUser.first_name,
        customerFullName: paymentData.customer_full_name,
        customerCpfCnpj: paymentData.customer_cpf_cnpj,
        customerUsername: telegramUser.username,
        customerLanguage: telegramUser.language_code || 'pt-br',
        isTelegramPremium: telegramUser.is_premium || false,
        category: paymentData.plan_id ? 'subscription' : 'package',
        planName: planData?.name || 'Pacote Personalizado',
        durationDays: planData?.duration_days || undefined,
        amount: paymentData.amount,
        netAmount: transaction.net_amount,
        conversionTimeSeconds: conversionTimeSeconds,
        transactionId: transaction.id,
        gatewayTransactionId: paymentData.gateway_transaction_id,
        currencyType: paymentData.currency || 'BRL',
        paymentMethod: paymentData.payment_method,
        paymentGateway: paymentData.gateway_name || 'pushinpay',
        timestamp: new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    );

    // 7. Criar assinatura se for plano recorrente
    if (planData) {
      const expirationDate = planData.duration_days
        ? new Date(Date.now() + planData.duration_days * 24 * 60 * 60 * 1000)
        : null;

      await supabase
        .from('subscriptions')
        .insert({
          bot_id: botData.id,
          telegram_user_id: paymentData.telegram_user_id,
          plan_id: planData.id,
          start_date: new Date().toISOString(),
          end_date: expirationDate?.toISOString() || null,
          status: 'active',
          transaction_id: transaction.id
        });
    }

    // 8. Enviar link do Grupo VIP para o usuário
    await sendUserToVipGroup(
      botData.bot_token,
      botData.vip_group_id,
      String(paymentData.telegram_user_id)
    );

    // 9. Sucesso!
    return { success: true, transaction };

  } catch (error) {
    console.error('Error handling payment approval:', error);
    return { success: false, error: String(error) };
  }
}
```

## 🎯 PONTOS IMPORTANTES

### 1. Mascaramento de Dados Sensíveis

O `notification-service.ts` já faz o mascaramento automático de:
- **CPF:** `123.456.789-01` vira `123.***.***-01`
- **CNPJ:** `12.345.678/0001-90` vira `12.***.***/****-90`
- **Nome Completo:** `JOÃO SILVA SANTOS` vira `JOÃO SILVA S****`

### 2. Cálculo de Tempo de Conversão

O tempo de conversão é calculado automaticamente desde quando o usuário enviou `/start` até a aprovação do pagamento.

Para rastrear isso, você precisa salvar o timestamp quando o usuário inicia conversa:

```typescript
// Quando usuário envia /start
if (message.text === '/start') {
  // Salvar em cache ou banco temporário
  await saveConversationStart(message.from.id, Date.now());
}
```

### 3. Detecção de Telegram Premium

A API do Telegram fornece o campo `is_premium` no objeto do usuário. Isso é detectado automaticamente.

### 4. Gateway de Pagamento

Adapte conforme o gateway que você usa:
- **PushInPay**
- **MercadoPago**
- **Pagarme**
- **Stripe**

Cada um envia os dados de forma diferente no webhook.

## 📊 EXEMPLO COMPLETO DE PAYLOAD

Quando o gateway notificar pagamento aprovado, você receberá algo assim:

```json
{
  "event": "payment.approved",
  "data": {
    "bot_id": "uuid-bot",
    "telegram_user_id": 6431890327,
    "plan_id": "uuid-plan",
    "amount": 29.90,
    "net_amount": 27.41,
    "payment_method": "pix",
    "gateway_transaction_id": "a0166b9d-d46b-4d86-8944-a5d11a93a762",
    "gateway_name": "pushinpay",
    "currency": "BRL",
    "customer_full_name": "JOÃO SILVA SANTOS",
    "customer_cpf_cnpj": "12345678901",
    "conversation_start_time": "2025-10-14T10:26:45Z"
  }
}
```

## 🚀 PRÓXIMOS PASSOS

1. ✅ Migração aplicada - campos criados
2. ✅ Serviço de notificações criado
3. ⏳ Integrar no webhook principal (você precisa fazer isso)
4. ⏳ Testar fluxo completo de compra
5. ⏳ Implementar sistema de monitoramento de assinaturas (cron job)

## 🔍 TESTANDO

Para testar sem fazer compra real:

```typescript
// Teste de notificação
await sendPurchaseNotification(
  'SEU_BOT_TOKEN',
  'SEU_GRUPO_NOTIFICACAO_ID',
  {
    botId: 'test-123',
    botName: 'Dino Bot',
    customerId: '6431890327',
    customerName: 'João',
    customerFullName: 'JOÃO SILVA SANTOS',
    customerCpfCnpj: '12345678901',
    customerUsername: 'joaosilva',
    customerLanguage: 'pt-br',
    isTelegramPremium: false,
    category: 'subscription',
    planName: '⭐️ Acesso Mensal VIP ⭐️',
    durationDays: 30,
    amount: 29.90,
    netAmount: 27.41,
    conversionTimeSeconds: 195,
    transactionId: 'test-trans-123',
    gatewayTransactionId: 'a0166b9d-test',
    currencyType: 'BRL',
    paymentMethod: 'pix',
    paymentGateway: 'pushinpay',
    timestamp: new Date().toLocaleString('pt-BR')
  }
);
```

## 💡 DICAS

1. **Armazenar conversation_start_time:** Salve quando usuário enviar `/start`
2. **Capturar dados do gateway:** Cada gateway envia dados diferentes
3. **Validar CPF/CNPJ:** Antes de salvar no banco
4. **Testar com dados reais:** Use um pagamento de teste
5. **Monitorar logs:** Verifique se notificações estão chegando

---

**Tudo pronto para implementação!** 🚀

Agora você só precisa integrar essas funções no momento que detectar pagamento aprovado.
