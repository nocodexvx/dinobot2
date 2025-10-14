import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

class TelegramBot {
  private baseUrl: string;

  constructor(private token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async banChatMember(chatId: string, userId: number) {
    const response = await fetch(`${this.baseUrl}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
      }),
    });
    return response.json();
  }

  async sendMessage(chatId: number, text: string) {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();

    const { data: expiredSubs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*, bots(*), plans(*)')
      .eq('status', 'ACTIVE')
      .lt('end_date', now);

    if (subsError) {
      console.error('Error fetching expired subscriptions:', subsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No expired subscriptions found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let removedCount = 0;
    const errors: any[] = [];

    for (const sub of expiredSubs) {
      try {
        const bot = sub.bots;
        const plan = sub.plans;
        const telegram = new TelegramBot(bot.bot_token);
        const userId = parseInt(sub.telegram_user_id);

        await telegram.banChatMember(bot.vip_group_id, userId);

        const endDate = new Date(sub.end_date);
        const expirationMessage = `❌ <b>Sua Assinatura Expirou</b>\n\n` +
          `Olá ${escapeHtml(sub.telegram_name)}! 😔\n\n` +
          `Sua assinatura do plano <b>${escapeHtml(plan.name)}</b> expirou em ${endDate.toLocaleDateString('pt-BR')}.\n\n` +
          `🚫 Você foi removido do grupo VIP.\n\n` +
          `💎 <b>Quer voltar?</b>\n` +
          `Renove sua assinatura agora mesmo usando o comando /start e volte a ter acesso a todo o conteúdo exclusivo!\n\n` +
          `⚡ Não perca mais tempo fora do VIP!`;

        await telegram.sendMessage(userId, expirationMessage);

        await supabase
          .from('subscriptions')
          .update({ status: 'EXPIRED' })
          .eq('id', sub.id);

        removedCount++;
      } catch (error) {
        console.error(`Error removing user ${sub.telegram_user_id}:`, error);
        errors.push({
          subscription_id: sub.id,
          user_id: sub.telegram_user_id,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: `Processed ${expiredSubs.length} expired subscriptions`,
        removed: removedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Remove expired users error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
