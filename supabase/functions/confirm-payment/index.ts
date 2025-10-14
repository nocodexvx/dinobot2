import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Bot {
  id: string;
  bot_token: string;
  vip_group_id: string;
  registry_channel_id: string;
}

interface Transaction {
  id: string;
  bot_id: string;
  telegram_user_id: string;
  amount: number;
  status: string;
}

interface Plan {
  id: string;
  name: string;
  duration_days: number;
}

class TelegramBot {
  private baseUrl: string;

  constructor(private token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async getChatMember(chatId: string, userId: number) {
    const response = await fetch(`${this.baseUrl}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
      }),
    });
    return response.json();
  }

  async unbanChatMember(chatId: string, userId: number) {
    const response = await fetch(`${this.baseUrl}/unbanChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
        only_if_banned: true,
      }),
    });
    return response.json();
  }

  async createChatInviteLink(chatId: string, memberLimit: number = 1) {
    const response = await fetch(`${this.baseUrl}/createChatInviteLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        member_limit: memberLimit,
        creates_join_request: false,
      }),
    });
    return response.json();
  }

  async sendMessage(chatId: string | number, text: string, replyMarkup?: any) {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return response.json();
  }

  async getChat(userId: number) {
    const response = await fetch(`${this.baseUrl}/getChat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
      }),
    });
    return response.json();
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { transaction_id, plan_id, package_id } = await req.json();

    if (!transaction_id || (!plan_id && !package_id)) {
      return new Response(
        JSON.stringify({ error: 'transaction_id and either plan_id or package_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (transaction.status === 'COMPLETED') {
      return new Response(
        JSON.stringify({ error: 'Transaction already completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let itemName: string;
    let durationDays: number | null = null;
    let itemType: 'plan' | 'package';

    if (plan_id) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      itemName = plan.name;
      durationDays = plan.duration_days;
      itemType = 'plan';
    } else {
      const { data: pkg, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', package_id)
        .single();

      if (packageError || !pkg) {
        return new Response(
          JSON.stringify({ error: 'Package not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      itemName = pkg.name;
      itemType = 'package';
    }

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', transaction.bot_id)
      .single();

    if (botError || !bot) {
      return new Response(
        JSON.stringify({ error: 'Bot not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegram = new TelegramBot(bot.bot_token);
    const userId = parseInt(transaction.telegram_user_id);

    const userInfo = await telegram.getChat(userId);
    const userName = userInfo.result?.first_name || 'User';
    const userUsername = userInfo.result?.username || '';

    let subscriptionId: string | null = null;

    if (itemType === 'plan' && durationDays !== null) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert([
          {
            bot_id: transaction.bot_id,
            plan_id: plan_id,
            telegram_user_id: transaction.telegram_user_id,
            telegram_username: userUsername,
            telegram_name: userName,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'ACTIVE',
            payment_id: transaction_id,
          },
        ])
        .select()
        .single();

      if (subError) {
        console.error('Error creating subscription:', subError);
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      subscriptionId = subscription.id;

      await supabase
        .from('transactions')
        .update({ status: 'COMPLETED', subscription_id: subscriptionId })
        .eq('id', transaction_id);

      await telegram.unbanChatMember(bot.vip_group_id, userId);

      const inviteLinkResult = await telegram.createChatInviteLink(bot.vip_group_id, 1);

      if (inviteLinkResult.ok && inviteLinkResult.result) {
        const inviteLink = inviteLinkResult.result.invite_link;

        const userMessage = `✅ <b>Pagamento Confirmado!</b>\n\n` +
          `Sua assinatura do plano <b>${escapeHtml(itemName)}</b> está ativa!\n\n` +
          `🎉 Clique no link abaixo para entrar no grupo VIP:\n` +
          `${inviteLink}\n\n` +
          `📅 Válido até: ${endDate.toLocaleDateString('pt-BR')}\n` +
          `⏰ Você receberá um lembrete 3 dias antes de expirar.`;

        await telegram.sendMessage(userId, userMessage);

        if (bot.registry_channel_id) {
          const registryMessage = `🎉 <b>Novo Membro VIP!</b>\n\n` +
            `👤 Usuário: ${escapeHtml(userName)}${userUsername ? ` (@${userUsername})` : ''}\n` +
            `💳 Plano: ${escapeHtml(itemName)}\n` +
            `💵 Valor: R$ ${transaction.amount.toFixed(2)}\n` +
            `📅 Válido até: ${endDate.toLocaleDateString('pt-BR')}`;

          await telegram.sendMessage(bot.registry_channel_id, registryMessage);
        }
      }
    } else {
      await supabase
        .from('transactions')
        .update({ status: 'COMPLETED' })
        .eq('id', transaction_id);

      const userMessage = `✅ <b>Pagamento Confirmado!</b>\n\n` +
        `Você adquiriu: <b>${escapeHtml(itemName)}</b>\n\n` +
        `💵 Valor: R$ ${transaction.amount.toFixed(2)}\n\n` +
        `🎉 Obrigado pela compra!`;

      await telegram.sendMessage(userId, userMessage);

      if (bot.registry_channel_id) {
        const registryMessage = `💰 <b>Nova Compra!</b>\n\n` +
          `👤 Usuário: ${escapeHtml(userName)}${userUsername ? ` (@${userUsername})` : ''}\n` +
          `📦 Pacote: ${escapeHtml(itemName)}\n` +
          `💵 Valor: R$ ${transaction.amount.toFixed(2)}`;

        await telegram.sendMessage(bot.registry_channel_id, registryMessage);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        subscription_id: subscriptionId,
        message: itemType === 'plan' ? 'Payment confirmed and user added to VIP group' : 'Package payment confirmed',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Confirm payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
