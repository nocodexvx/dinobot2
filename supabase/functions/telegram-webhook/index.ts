import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

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

  async sendPhoto(chatId: number, photo: string, caption?: string, replyMarkup?: any) {
    const response = await fetch(`${this.baseUrl}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo,
        caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return response.json();
  }

  async sendVideo(chatId: number, video: string, caption?: string, replyMarkup?: any) {
    const response = await fetch(`${this.baseUrl}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        video,
        caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return response.json();
  }

  async sendAudio(chatId: number, audio: string, caption?: string) {
    const response = await fetch(`${this.baseUrl}/sendAudio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        audio,
        caption,
        parse_mode: 'HTML',
      }),
    });
    return response.json();
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean) {
    const response = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert || false,
      }),
    });
    return response.json();
  }

  async editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any) {
    const response = await fetch(`${this.baseUrl}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return response.json();
  }

  async editMessageMedia(chatId: number, messageId: number, media: any, replyMarkup?: any) {
    const response = await fetch(`${this.baseUrl}/editMessageMedia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        media,
        reply_markup: replyMarkup,
      }),
    });
    return response.json();
  }
}

function formatMessage(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), escapeHtml(value));
  }
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

function formatDuration(durationType: string, durationDays: number): string {
  if (durationType === 'LIFETIME') return 'Vitalício';
  if (durationType === 'MONTHLY') return 'Mensal';
  if (durationType === 'WEEKLY') return 'Semanal';
  return `${durationDays} dias`;
}

function buildPlansKeyboard(plans: any[]) {
  const keyboard = plans.map((plan) => [
    {
      text: `${plan.name} - ${formatPrice(plan.price)}`,
      callback_data: `plan_${plan.id}`,
    },
  ]);
  return { inline_keyboard: keyboard };
}

function buildPlanDetailKeyboard(planId: string, hasOrderBump: boolean) {
  const keyboard: any[][] = [
    [
      {
        text: '✅ Assinar Plano',
        callback_data: `subscribe_${planId}_no_bump`,
      },
    ],
  ];

  if (hasOrderBump) {
    keyboard.unshift([
      {
        text: '🎁 Assinar com Bônus',
        callback_data: `subscribe_${planId}_with_bump`,
      },
    ]);
  }

  keyboard.push([
    {
      text: '⬅️ Voltar',
      callback_data: 'back_to_plans',
    },
  ]);

  return { inline_keyboard: keyboard };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const botId = url.searchParams.get('bot_id');

    console.log('[WEBHOOK] Received request for bot_id:', botId);

    if (!botId) {
      console.error('[WEBHOOK] Missing bot_id parameter');
      return new Response(
        JSON.stringify({ error: 'bot_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      console.error('[WEBHOOK] Bot not found:', botError);
      return new Response(
        JSON.stringify({ error: 'Bot not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WEBHOOK] Bot found:', bot.bot_name);

    if (!bot.is_active) {
      console.error('[WEBHOOK] Bot is not active');
      return new Response(
        JSON.stringify({ error: 'Bot is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const update: TelegramUpdate = await req.json();
    console.log('[WEBHOOK] Received update:', JSON.stringify(update));

    const telegram = new TelegramBot(bot.bot_token);

    // Handle /start command
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const userName = message.from.first_name;
      const text = message.text || '';

      if (text.startsWith('/start')) {
        console.log('[WEBHOOK] Processing /start command for user:', userId);

        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .eq('bot_id', botId)
          .eq('is_active', true)
          .order('price', { ascending: true });

        console.log('[WEBHOOK] Found plans:', plans?.length || 0);

        if (!plans || plans.length === 0) {
          console.log('[WEBHOOK] No plans available, sending message');
          await telegram.sendMessage(
            chatId,
            'Nenhum plano disponível no momento. Por favor, tente novamente mais tarde.'
          );
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const welcomeText = formatMessage(bot.welcome_message, { profile_name: userName });

        console.log('[WEBHOOK] Starting welcome flow');

        try {
          // ETAPA 1: Enviar mídia com mensagem de boas-vindas
          if (bot.media_url && bot.media_type) {
            if (bot.media_type === 'image') {
              console.log('[WEBHOOK] Sending photo with welcome message');
              await telegram.sendPhoto(chatId, bot.media_url, welcomeText);
            } else if (bot.media_type === 'video') {
              console.log('[WEBHOOK] Sending video with welcome message');
              await telegram.sendVideo(chatId, bot.media_url, welcomeText);
            }
          } else {
            console.log('[WEBHOOK] Sending text welcome message');
            await telegram.sendMessage(chatId, welcomeText);
          }

          // ETAPA 2: Enviar texto secundário (se configurado)
          if (bot.secondary_text) {
            console.log('[WEBHOOK] Sending secondary text');
            const secondaryText = formatMessage(bot.secondary_text, { profile_name: userName });
            await telegram.sendMessage(chatId, secondaryText);
          }

          // ETAPA 3: Enviar botão CTA (se configurado)
          if (bot.cta_enabled && bot.cta_button_text) {
            console.log('[WEBHOOK] Sending CTA button');
            const ctaText = bot.cta_text
              ? formatMessage(bot.cta_text, { profile_name: userName })
              : '👇 Clique no botão abaixo:';

            const ctaKeyboard = bot.cta_button_url
              ? {
                  inline_keyboard: [
                    [{ text: bot.cta_button_text, url: bot.cta_button_url }],
                  ],
                }
              : {
                  inline_keyboard: [
                    [{ text: bot.cta_button_text, callback_data: 'show_plans' }],
                  ],
                };

            await telegram.sendMessage(chatId, ctaText, ctaKeyboard);

            // Se o CTA não é um link externo, aguarda o clique antes de mostrar planos
            if (!bot.cta_button_url) {
              console.log('[WEBHOOK] Waiting for CTA click');
              return new Response(JSON.stringify({ ok: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }

          // ETAPA 4: Mostrar planos (se não tem CTA ou se CTA é link externo)
          if (!bot.cta_enabled || bot.cta_button_url) {
            console.log('[WEBHOOK] Sending plans keyboard');
            const plansText = '📋 Escolha seu plano:';
            const keyboard = buildPlansKeyboard(plans);
            await telegram.sendMessage(chatId, plansText, keyboard);
          }

          console.log('[WEBHOOK] Welcome flow completed');
        } catch (sendError) {
          console.error('[WEBHOOK] Error sending message:', sendError);
          throw sendError;
        }
      }
    }

    // Handle callback queries
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat.id;
      const messageId = query.message?.message_id;
      const userId = query.from.id;
      const userName = query.from.first_name;
      const userUsername = query.from.username || '';
      const callbackData = query.data || '';

      if (!chatId || !messageId) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mostrar planos após CTA
      if (callbackData === 'show_plans') {
        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .eq('bot_id', botId)
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (plans && plans.length > 0) {
          const keyboard = buildPlansKeyboard(plans);
          const plansText = '📋 Escolha seu plano:';
          await telegram.sendMessage(chatId, plansText, keyboard);
        }

        await telegram.answerCallbackQuery(query.id);
      }
      // Voltar para lista de planos
      else if (callbackData === 'back_to_plans') {
        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .eq('bot_id', botId)
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (plans && plans.length > 0) {
          const keyboard = buildPlansKeyboard(plans);
          const plansText = '📋 Escolha seu plano:';
          await telegram.editMessageText(chatId, messageId, plansText, keyboard);
        }

        await telegram.answerCallbackQuery(query.id);
      }
      // Ver detalhes do plano
      else if (callbackData.startsWith('plan_')) {
        const planId = callbackData.replace('plan_', '');

        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (plan) {
          let detailText = `<b>${escapeHtml(plan.name)}</b>\n\n`;
          detailText += `${escapeHtml(plan.description || '')}\n\n`;
          detailText += `💰 <b>Valor:</b> ${formatPrice(plan.price)}\n`;
          detailText += `⏱ <b>Duração:</b> ${formatDuration(plan.duration_type, plan.duration_days)}\n\n`;

          if (plan.order_bump_enabled && plan.order_bump_name) {
            detailText += `\n🎁 <b>Oferta Especial:</b>\n`;
            detailText += `${escapeHtml(plan.order_bump_name)}\n`;
            if (plan.order_bump_description) {
              detailText += `${escapeHtml(plan.order_bump_description)}\n`;
            }
            detailText += `Adicional: ${formatPrice(plan.order_bump_price || 0)}\n`;
          }

          const keyboard = buildPlanDetailKeyboard(
            planId,
            plan.order_bump_enabled && plan.order_bump_name
          );

          await telegram.editMessageText(chatId, messageId, detailText, keyboard);
        }

        await telegram.answerCallbackQuery(query.id);
      }
      // Assinar plano
      else if (callbackData.startsWith('subscribe_')) {
        const parts = callbackData.split('_');
        const planId = parts[1];
        const withBump = parts[2] === 'with';

        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (plan) {
          let totalPrice = plan.price;
          if (withBump && plan.order_bump_enabled) {
            totalPrice += plan.order_bump_price || 0;
          }

          const methodMessage = formatMessage(
            bot.payment_method_message || '🌟 Plano selecionado:\n\n🎁 Plano: {plan_name}\n💰 Valor: {plan_value}\n⏳ Duração: {plan_duration}\n\nEscolha o método de pagamento abaixo:',
            {
              profile_name: userName,
              plan_name: plan.name,
              plan_value: formatPrice(totalPrice),
              plan_duration: formatDuration(plan.duration_type, plan.duration_days),
            }
          );

          const keyboard = {
            inline_keyboard: [
              [{ text: bot.payment_method_button_text || '💠 Pagar com Pix', callback_data: `pix_${planId}_${withBump ? 'with' : 'no'}_bump` }],
              [{ text: '⬅️ Voltar', callback_data: `plan_${planId}` }],
            ],
          };

          await telegram.editMessageText(chatId, messageId, methodMessage, keyboard);
        }

        await telegram.answerCallbackQuery(query.id);
      }
      // Gerar PIX
      else if (callbackData.startsWith('pix_')) {
        const parts = callbackData.split('_');
        const planId = parts[1];
        const withBump = parts[2] === 'with';

        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (plan && bot.payment_enabled) {
          let totalPrice = plan.price;
          if (withBump && plan.order_bump_enabled) {
            totalPrice += plan.order_bump_price || 0;
          }

          // Gerar PIX
          const pixResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-pix`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              bot_id: botId,
              plan_id: planId,
              telegram_user_id: userId.toString(),
              telegram_name: userName,
              telegram_username: userUsername,
            }),
          });

          if (pixResponse.ok) {
            const pixData = await pixResponse.json();

            let pixMessage = formatMessage(
              bot.pix_main_message || '🌟 Você selecionou o seguinte plano:\n\n🎁 Plano: {plan_name}\n💰 Valor: {plan_value}\n\n💠 Pague via Pix Copia e Cola:\n\n{payment_pointer}\n\n👆 Toque na chave PIX acima para copiá-la\n\n‼️ Após o pagamento, clique no botão abaixo:',
              {
                profile_name: userName,
                plan_name: plan.name,
                plan_value: formatPrice(totalPrice),
                plan_duration: formatDuration(plan.duration_type, plan.duration_days),
                payment_pointer: bot.pix_format_blockquote ? `<blockquote>${pixData.pix_code}</blockquote>` : `<code>${pixData.pix_code}</code>`,
              }
            );

            const keyboard: any = {
              inline_keyboard: [
                [{ text: bot.pix_status_button_text || 'Verificar Status do Pagamento', callback_data: `check_${pixData.transaction_id}` }],
              ],
            };

            if (bot.show_qrcode_in_chat && pixData.qr_code_url) {
              keyboard.inline_keyboard.unshift([{ text: bot.pix_qrcode_button_text || 'Mostrar QR Code', callback_data: `qrcode_${pixData.transaction_id}` }]);
            }

            keyboard.inline_keyboard.push([{ text: '⬅️ Voltar', callback_data: `subscribe_${planId}_${withBump ? 'with' : 'no'}_bump` }]);

            // Enviar com mídia se configurado
            if (bot.pix_media_url && bot.pix_media_type) {
              if (bot.pix_media_type === 'image') {
                await telegram.editMessageMedia(chatId, messageId, {
                  type: 'photo',
                  media: bot.pix_media_url,
                  caption: pixMessage,
                  parse_mode: 'HTML',
                }, keyboard);
              } else if (bot.pix_media_type === 'video') {
                await telegram.editMessageMedia(chatId, messageId, {
                  type: 'video',
                  media: bot.pix_media_url,
                  caption: pixMessage,
                  parse_mode: 'HTML',
                }, keyboard);
              }
            } else {
              await telegram.editMessageText(chatId, messageId, pixMessage, keyboard);
            }

            // Enviar áudio se configurado
            if (bot.pix_audio_url) {
              await telegram.sendAudio(chatId, bot.pix_audio_url);
            }
          }
        }

        await telegram.answerCallbackQuery(query.id, 'Gerando PIX...');
      }
      // Mostrar QR Code
      else if (callbackData.startsWith('qrcode_')) {
        const transactionId = callbackData.replace('qrcode_', '');

        const { data: transaction } = await supabase
          .from('transactions')
          .select('pix_qr_code')
          .eq('id', transactionId)
          .single();

        if (transaction && transaction.pix_qr_code) {
          await telegram.sendPhoto(chatId, transaction.pix_qr_code, '📱 QR Code para pagamento PIX');
        }

        await telegram.answerCallbackQuery(query.id);
      }
      // Verificar status do pagamento
      else if (callbackData.startsWith('check_')) {
        const transactionId = callbackData.replace('check_', '');

        const { data: transaction } = await supabase
          .from('transactions')
          .select('status')
          .eq('id', transactionId)
          .single();

        if (transaction) {
          if (transaction.status === 'COMPLETED') {
            await telegram.answerCallbackQuery(query.id, '✅ Pagamento confirmado! Bem-vindo ao VIP!', true);
          } else {
            await telegram.answerCallbackQuery(query.id, '⏳ Pagamento ainda não confirmado. Aguarde...', true);
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
