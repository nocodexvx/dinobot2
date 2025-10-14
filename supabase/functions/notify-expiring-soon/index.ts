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

  async sendMessage(chatId: number, text: string, replyMarkup?: any) {
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

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    const { data: expiringSubs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*, bots(*), plans(*)')
      .eq('status', 'ACTIVE')
      .gte('end_date', threeDaysFromNow.toISOString())
      .lt('end_date', fourDaysFromNow.toISOString());

    if (subsError) {
      console.error('Error fetching expiring subscriptions:', subsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expiringSubs || expiringSubs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No subscriptions expiring soon', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let notifiedCount = 0;
    const errors: any[] = [];

    for (const sub of expiringSubs) {
      try {
        const bot = sub.bots;
        const plan = sub.plans;
        const telegram = new TelegramBot(bot.bot_token);
        const userId = parseInt(sub.telegram_user_id);

        const endDate = new Date(sub.end_date);
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const expirationWarning = `⚠️ <b>Sua Assinatura Está Expirando!</b>\n\n` +
          `Olá ${escapeHtml(sub.telegram_name)}! 👋\n\n` +
          `Sua assinatura do plano <b>${escapeHtml(plan.name)}</b> expira em <b>${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}</b>.\n\n` +
          `📅 Data de expiração: ${endDate.toLocaleDateString('pt-BR')}\n\n` +
          `💎 <b>Renove sua assinatura</b> para continuar aproveitando o acesso VIP sem interrupções!\n\n` +
          `🔄 Use o comando /start para ver os planos disponíveis e renovar agora mesmo.`;

        await telegram.sendMessage(userId, expirationWarning);

        if (bot.registry_channel_id) {
          const adminNotification = `⏰ <b>Assinatura Expirando em Breve</b>\n\n` +
            `👤 Usuário: ${escapeHtml(sub.telegram_name)}${sub.telegram_username ? ` (@${sub.telegram_username})` : ''}\n` +
            `📦 Plano: ${escapeHtml(plan.name)}\n` +
            `⏳ Expira em: ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}\n` +
            `📅 Data final: ${endDate.toLocaleDateString('pt-BR')}`;

          await telegram.sendMessage(parseInt(bot.registry_channel_id), adminNotification);
        }

        notifiedCount++;
      } catch (error) {
        console.error(`Error notifying user ${sub.telegram_user_id}:`, error);
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
        message: `Notified ${notifiedCount} users about upcoming expiration`,
        total: expiringSubs.length,
        notified: notifiedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notify expiring soon error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
