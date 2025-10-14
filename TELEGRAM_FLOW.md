# 📱 Fluxo do Bot no Telegram - ApexVIPS

## 🎯 Fluxo Implementado

O bot segue uma logística sequencial quando o usuário envia `/start`:

---

## 📋 **Etapas do Fluxo**

### **1️⃣ Mídia + Mensagem de Boas-vindas**
- **Imagem ou Vídeo** com caption
- Mensagem personalizada com variável `{profile_name}`
- Campo: `bot.welcome_message`

### **2️⃣ Texto Secundário (Opcional)**
- Mensagem de texto adicional separada
- Aparece APÓS a mídia
- Campo: `bot.secondary_text`
- Suporta variáveis como `{profile_name}`

### **3️⃣ Botão CTA (Opcional)**
- Call-to-Action customizável
- Campos:
  - `bot.cta_enabled` - Ativa/desativa
  - `bot.cta_text` - Texto antes do botão
  - `bot.cta_button_text` - Texto do botão
  - `bot.cta_button_url` - URL (opcional)

**Comportamento:**
- ✅ **Com URL**: Abre link externo + mostra planos automaticamente
- ✅ **Sem URL**: Aguarda clique para mostrar planos

### **4️⃣ Planos Disponíveis**
- Lista de planos em botões inline
- Formato: `Nome do Plano - R$ XX,XX`
- Ordenados por preço (menor → maior)
- Mostra apenas planos ativos

---

## 🔄 **Após Seleção do Plano**

### **5️⃣ Detalhes do Plano**
- Nome e descrição
- Preço e duração
- Oferta especial (order bump) se configurado
- Botões:
  - `✅ Assinar Plano`
  - `🎁 Assinar com Bônus` (se houver)
  - `⬅️ Voltar`

### **6️⃣ Método de Pagamento**
- Confirmação do plano selecionado
- Mensagem customizável: `bot.payment_method_message`
- Variáveis disponíveis:
  - `{profile_name}` - Nome do usuário
  - `{plan_name}` - Nome do plano
  - `{plan_value}` - Valor total
  - `{plan_duration}` - Duração

- Botões:
  - `💠 Pagar com Pix`
  - `⬅️ Voltar`

### **7️⃣ Geração do PIX**
- **Chama edge function**: `generate-pix`
- **Cria transação** no banco
- **Retorna**:
  - PIX Copia e Cola
  - QR Code URL
  - Transaction ID

### **8️⃣ Tela de Pagamento**
- **Mídia opcional** (imagem/vídeo):
  - `bot.pix_media_url`
  - `bot.pix_media_type`

- **Código PIX**:
  - Formato `<code>` ou `<blockquote>`
  - Configurável: `bot.pix_format_blockquote`

- **Áudio opcional**:
  - `bot.pix_audio_url`

- **Botões**:
  - `Mostrar QR Code` (se `bot.show_qrcode_in_chat`)
  - `Verificar Status do Pagamento`
  - `⬅️ Voltar`

### **9️⃣ Verificação de Pagamento**
- Usuário clica em "Verificar Status"
- Sistema consulta status da transação
- Respostas:
  - ✅ **COMPLETED**: "Pagamento confirmado! Bem-vindo ao VIP!"
  - ⏳ **PENDING**: "Ainda não confirmado. Aguarde..."

---

## 🗄️ **Campos Adicionados no Banco**

### **Tabela: `bots`**

```sql
-- Novos campos para fluxo customizável
cta_enabled         boolean  DEFAULT false    -- Ativar CTA
cta_text            text                      -- Texto antes do CTA
cta_button_text     text                      -- Texto do botão CTA
cta_button_url      text                      -- URL do CTA (opcional)
secondary_text      text                      -- Texto após mídia
```

---

## 📊 **Exemplo de Fluxo Completo**

### **Cenário 1: Com CTA e Link Externo**

```
1. [IMAGEM] "Bem-vindo {profile_name} ao ApexVIPS!"
2. [TEXTO] "Temos os melhores grupos VIP do mercado"
3. [BOTÃO CTA] "📱 Visite nosso canal" → https://t.me/canal
4. [PLANOS] Escolha seu plano:
   - VIP Semanal - R$ 19,90
   - VIP Mensal - R$ 59,90
   - VIP Vitalício - R$ 199,90
```

### **Cenário 2: Com CTA Sem Link (Aguarda Clique)**

```
1. [IMAGEM] "Bem-vindo {profile_name} ao ApexVIPS!"
2. [TEXTO] "Conheça nossos planos exclusivos"
3. [BOTÃO CTA] "🎁 Ver Planos"
   └─ Usuário clica →
4. [PLANOS] Escolha seu plano:
   - VIP Semanal - R$ 19,90
   - VIP Mensal - R$ 59,90
```

### **Cenário 3: Sem CTA (Direto para Planos)**

```
1. [IMAGEM] "Bem-vindo {profile_name} ao ApexVIPS!"
2. [TEXTO] "Escolha seu plano abaixo"
3. [PLANOS] Escolha seu plano:
   - VIP Semanal - R$ 19,90
   - VIP Mensal - R$ 59,90
```

---

## ⚙️ **Como Configurar**

### **1. Configurar Mídia de Boas-vindas**
```
Bot Settings:
├─ media_url: "https://..."
├─ media_type: "image" ou "video"
└─ welcome_message: "Bem-vindo {profile_name}!"
```

### **2. Adicionar Texto Secundário (Opcional)**
```
Bot Settings:
└─ secondary_text: "Conheça nossos planos VIP!"
```

### **3. Configurar CTA (Opcional)**
```
Bot Settings:
├─ cta_enabled: true
├─ cta_text: "👇 Clique no botão para continuar"
├─ cta_button_text: "🎁 Ver Planos"
└─ cta_button_url: null (ou URL externa)
```

### **4. Configurar Planos**
```
Plans:
├─ name: "VIP Semanal"
├─ price: 19.90
├─ duration_type: "WEEKLY"
└─ is_active: true
```

### **5. Configurar Pagamento PIX**
```
Bot Settings:
├─ payment_enabled: true
├─ payment_gateway: "pushinpay"
├─ pix_media_url: "https://..." (opcional)
├─ pix_audio_url: "https://..." (opcional)
└─ show_qrcode_in_chat: true/false
```

---

## 🔒 **Segurança do Fluxo**

### **Validações Implementadas**
- ✅ Bot deve estar ativo
- ✅ Planos devem estar ativos
- ✅ Payment gateway configurado
- ✅ Transação criada antes do PIX

### **Estados da Transação**
```
PENDING    → Aguardando pagamento
COMPLETED  → Pagamento confirmado → Adicionar ao grupo
FAILED     → Pagamento falhou
REFUNDED   → Pagamento reembolsado
```

---

## 📱 **Comandos do Bot**

Configurados na página `/bots/:botId/commands`:

```
/start     - Iniciar
/suporte   - Suporte
/status    - Consulte sua Assinatura
```

---

## 🎨 **Customização de Mensagens**

### **Variáveis Disponíveis**
```javascript
{profile_name}     // Nome do usuário
{plan_name}        // Nome do plano
{plan_value}       // Valor formatado (R$ XX,XX)
{plan_duration}    // Duração (Semanal, Mensal, Vitalício)
{payment_pointer}  // Código PIX
```

### **Exemplo de Uso**
```
"Olá {profile_name}!

Você escolheu o plano {plan_name}
Valor: {plan_value}
Duração: {plan_duration}

Pague via PIX:
{payment_pointer}"
```

---

## 🚀 **Edge Functions Envolvidas**

### **1. `telegram-webhook`**
- Processa todos os updates do Telegram
- Gerencia fluxo de mensagens
- Controla callbacks dos botões

### **2. `generate-pix`**
- Gera código PIX
- Cria transação no banco
- Retorna QR Code URL

### **3. `confirm-payment`**
- Webhook do gateway
- Confirma pagamento
- Adiciona usuário ao grupo VIP
- Cria assinatura

---

## ✅ **Checklist de Implementação**

### **Fluxo Básico**
- [x] Mídia com mensagem de boas-vindas
- [x] Texto secundário opcional
- [x] Botão CTA opcional
- [x] Lista de planos
- [x] Detalhes do plano
- [x] Seleção de método de pagamento
- [x] Geração de PIX
- [x] Verificação de status

### **Funcionalidades Extras**
- [x] Order bump (oferta especial)
- [x] QR Code em chat
- [x] Mídia na tela de PIX
- [x] Áudio na tela de PIX
- [x] Customização completa de mensagens
- [x] Suporte a variáveis dinâmicas

### **Comandos**
- [x] Menu de comandos lateral
- [x] Configuração via dashboard
- [x] Comandos padrão (/start, /suporte, /status)

---

## 🎯 **Resumo do Fluxo**

```
/start
  ↓
1. 📸 Mídia + Caption
  ↓
2. 📝 Texto Secundário (opcional)
  ↓
3. 🎯 Botão CTA (opcional)
  ↓
4. 📋 Lista de Planos
  ↓
5. 📄 Detalhes do Plano
  ↓
6. 💳 Método de Pagamento
  ↓
7. 🔄 Geração PIX
  ↓
8. 💠 Tela de Pagamento PIX
  ↓
9. ✅ Verificação de Status
  ↓
10. 🎉 Acesso ao Grupo VIP
```

---

## 📈 **Próximos Passos**

Para usar o bot:

1. **Criar Bot** no BotFather
2. **Configurar** no dashboard ApexVIPS
3. **Criar Planos** de assinatura
4. **Configurar Gateway** de pagamento
5. **Definir Webhook** do Telegram
6. **Testar** fluxo completo
7. **Lançar** para usuários!

---

## 🎉 **Sistema Pronto!**

O fluxo está completo e funcional seguindo exatamente a lógica que você pediu:

**Mídia → Texto → CTA → Planos → PIX → Pagamento → Grupo VIP**
