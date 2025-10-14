export interface PurchaseNotificationData {
  botId: string;
  botName: string;
  customerId: string;
  customerName: string;
  customerFullName?: string;
  customerCpfCnpj?: string;
  customerUsername?: string;
  customerLanguage?: string;
  isTelegramPremium?: boolean;
  category: 'subscription' | 'package';
  planName: string;
  durationDays?: number;
  amount: number;
  netAmount?: number;
  conversionTimeSeconds?: number;
  transactionId: string;
  gatewayTransactionId: string;
  currencyType: string;
  paymentMethod: string;
  paymentGateway: string;
  timestamp: string;
}

export async function sendPurchaseNotification(
  botToken: string,
  registryChannelId: string,
  data: PurchaseNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const formatTime = (seconds?: number): string => {
      if (!seconds) return '0d 0h 0m 0s';

      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    };

    const maskCpf = (cpf?: string): string => {
      if (!cpf) return 'N/A';
      if (cpf.length === 11) {
        return `${cpf.substring(0, 3)}.***.***-${cpf.substring(9)}`;
      }
      return `${cpf.substring(0, 2)}.***.***/****-${cpf.substring(12)}`;
    };

    const maskFullName = (name?: string): string => {
      if (!name) return 'N/A';
      const parts = name.split(' ');
      if (parts.length === 1) return name;
      return `${parts[0]} ${parts[1]} ${parts[parts.length - 1].charAt(0)}****`;
    };

    const message = `🎉 *Pagamento Aprovado!*

🤖 *Bot:* ${data.botName}
⚙️ *ID Bot:* ${data.botId}

👤 *DADOS DO CLIENTE:*
🆔 *ID Cliente:* \`${data.customerId}\`
👤 *Nome de Perfil:* ${data.customerName}
👤 *Nome Completo:* ${maskFullName(data.customerFullName)}
💳 *CPF/CNPJ:* ${maskCpf(data.customerCpfCnpj)}
📱 *Username:* ${data.customerUsername ? '@' + data.customerUsername : 'N/A'}
🌐 *Idioma:* ${data.customerLanguage || 'pt-br'}
⭐ *Telegram Premium:* ${data.isTelegramPremium ? 'Sim' : 'Não'}

💰 *DADOS DA COMPRA:*
📦 *Categoria:* ${data.category === 'subscription' ? 'Plano' : 'Pacote'}
🎁 *Plano:* ${data.planName}
${data.durationDays ? `📅 *Duração:* ${data.durationDays} dias` : '📅 *Duração:* Vitalício'}
💰 *Valor:* R$ ${data.amount.toFixed(2)}
💵 *Valor Líquido:* R$ ${(data.netAmount || data.amount).toFixed(2)}

⏱️ *INFORMAÇÕES ADICIONAIS:*
⏳ *Tempo Conversão:* ${formatTime(data.conversionTimeSeconds)}
🔑 *ID Transação Interna:* \`${data.transactionId}\`
🏷️ *ID Transação Gateway:* \`${data.gatewayTransactionId}\`
💱 *Tipo Moeda:* ${data.currencyType}
💳 *Método Pagamento:* ${data.paymentMethod}
🏦 *Plataforma Pagamento:* ${data.paymentGateway}
🕐 *Data/Hora:* ${data.timestamp}

✅ *Cliente adicionado ao Grupo VIP automaticamente!*`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: registryChannelId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );

    const result = await response.json();

    if (!result.ok) {
      console.error('Error sending notification:', result);
      return { success: false, error: result.description || 'Unknown error' };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception sending notification:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendUserToVipGroup(
  botToken: string,
  vipGroupId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const linkResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/createChatInviteLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: vipGroupId,
          member_limit: 1,
          expire_date: Math.floor(Date.now() / 1000) + 3600
        })
      }
    );

    const linkData = await linkResponse.json();

    if (!linkData.ok) {
      return { success: false, error: 'Failed to create invite link' };
    }

    const inviteLink = linkData.result.invite_link;

    const messageResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: userId,
          text: `🎉 *PAGAMENTO APROVADO!* 🎉

Seu pagamento foi confirmado com sucesso!

🔐 Seu acesso ao Grupo VIP está liberado!

👉 Clique no link abaixo para entrar:
${inviteLink}

⚠️ *ATENÇÃO:*
• Este link é único e pessoal
• Válido por 1 hora
• Só pode ser usado 1 vez
• Não compartilhe com outras pessoas

🎁 *Benefícios do Grupo VIP:*
✅ Conteúdo exclusivo diário
✅ Suporte prioritário
✅ Materiais premium
✅ Comunidade ativa

Qualquer dúvida, estou aqui! 😊`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🚀 Acessar Grupo VIP', url: inviteLink }
            ]]
          }
        })
      }
    );

    const messageData = await messageResponse.json();

    if (!messageData.ok) {
      return { success: false, error: 'Failed to send invite message' };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception sending user to VIP group:', error);
    return { success: false, error: String(error) };
  }
}
