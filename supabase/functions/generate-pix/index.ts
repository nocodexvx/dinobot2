import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GeneratePixRequest {
  bot_id: string;
  plan_id?: string;
  package_id?: string;
  telegram_user_id: string;
  telegram_name: string;
  telegram_username?: string;
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

    const body: GeneratePixRequest = await req.json();
    const { bot_id, plan_id, package_id, telegram_user_id, telegram_name, telegram_username } = body;

    if (!plan_id && !package_id) {
      return new Response(
        JSON.stringify({ error: 'Either plan_id or package_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', bot_id)
      .maybeSingle();

    if (botError || !bot) {
      return new Response(
        JSON.stringify({ error: 'Bot not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!bot.payment_enabled) {
      return new Response(
        JSON.stringify({ error: 'Payment not enabled for this bot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let amount: number;
    let itemName: string;

    if (plan_id) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .maybeSingle();

      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      amount = parseFloat(plan.price);
      itemName = plan.name;
    } else {
      const { data: pkg, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', package_id)
        .maybeSingle();

      if (packageError || !pkg) {
        return new Response(
          JSON.stringify({ error: 'Package not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      amount = parseFloat(pkg.value);
      itemName = pkg.name;
    }

    const transactionId = crypto.randomUUID();
    const amountInCents = Math.round(amount * 100);

    let pixData;

    if (bot.payment_gateway === 'pushinpay') {
      pixData = await generatePushinPayPix({
        publicToken: bot.payment_public_token,
        privateToken: bot.payment_private_token,
        amount: amountInCents,
        transactionId,
        customerName: telegram_name,
        customerId: telegram_user_id,
      });
    } else if (bot.payment_gateway === 'syncpay') {
      pixData = await generateSyncpayPix({
        publicToken: bot.payment_public_token,
        privateToken: bot.payment_private_token,
        amount: amountInCents,
        transactionId,
        customerName: telegram_name,
        customerId: telegram_user_id,
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported payment gateway' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transactionData: any = {
      bot_id,
      telegram_user_id,
      telegram_name,
      telegram_username,
      amount,
      status: 'PENDING',
      pix_code: pixData.pixCode,
      pix_qr_code: pixData.qrCodeUrl,
      payment_id: pixData.paymentId,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    if (plan_id) {
      transactionData.plan_id = plan_id;
    }

    if (package_id) {
      transactionData.package_id = package_id;
    }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        transaction_id: transaction.id,
        pix_code: pixData.pixCode,
        qr_code_url: pixData.qrCodeUrl,
        amount,
        item_name: itemName,
        expires_at: transaction.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate PIX error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generatePushinPayPix(params: {
  publicToken: string;
  privateToken: string;
  amount: number;
  transactionId: string;
  customerName: string;
  customerId: string;
}) {
  const response = await fetch('https://api.pushinpay.com.br/api/pix/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${params.privateToken}`,
      'X-Public-Key': params.publicToken,
    },
    body: JSON.stringify({
      value: params.amount / 100,
      external_reference: params.transactionId,
      payer: {
        name: params.customerName,
        document: params.customerId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PushinPay API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    pixCode: data.pix_code || data.brcode || data.qr_code_text,
    qrCodeUrl: data.qr_code_url || data.qr_code_image,
    paymentId: data.id || data.payment_id,
  };
}

async function generateSyncpayPix(params: {
  publicToken: string;
  privateToken: string;
  amount: number;
  transactionId: string;
  customerName: string;
  customerId: string;
}) {
  const response = await fetch('https://api.syncpay.com.br/v1/pix/charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.privateToken,
      'x-public-key': params.publicToken,
    },
    body: JSON.stringify({
      amount: params.amount,
      reference_id: params.transactionId,
      customer: {
        name: params.customerName,
        tax_id: params.customerId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Syncpay API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    pixCode: data.pix_code || data.emv || data.payload,
    qrCodeUrl: data.qr_code || data.image_url,
    paymentId: data.id || data.charge_id,
  };
}
