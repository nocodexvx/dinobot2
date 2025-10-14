import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Bot {
  id: string;
  bot_name: string;
  bot_username: string;
  bot_token: string;
  webhook_url: string | null;
}

export default function BotWebhook() {
  const { botId } = useParams<{ botId: string }>();
  const navigate = useNavigate();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBot();
  }, [botId]);

  const fetchBot = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('id, bot_name, bot_username, bot_token, webhook_url')
        .eq('id', botId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/bots');
        return;
      }

      setBot(data);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const generatedUrl = `${supabaseUrl}/functions/v1/telegram-webhook?bot_id=${data.id}`;
      setWebhookUrl(generatedUrl);
    } catch (error) {
      console.error('Error fetching bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebhook = async () => {
    if (!bot) return;

    setSetting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${bot.bot_token}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ['message', 'callback_query'],
            drop_pending_updates: true,
          }),
        }
      );

      const data = await response.json();

      if (data.ok) {
        const { error: updateError } = await supabase
          .from('bots')
          .update({
            webhook_url: webhookUrl,
            is_active: true
          })
          .eq('id', bot.id);

        if (updateError) throw updateError;

        setStatus('success');
        setMessage('Webhook configurado com sucesso! Seu bot está ativo e pronto para receber mensagens.');
        setBot({ ...bot, webhook_url: webhookUrl });
      } else {
        throw new Error(data.description || 'Failed to set webhook');
      }
    } catch (error: any) {
      console.error('Error setting webhook:', error);
      setStatus('error');
      setMessage(error.message || 'Falha ao configurar webhook. Verifique o token do bot.');
    } finally {
      setSetting(false);
    }
  };

  const deleteWebhook = async () => {
    if (!bot) return;

    setSetting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${bot.bot_token}/deleteWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drop_pending_updates: true,
          }),
        }
      );

      const data = await response.json();

      if (data.ok) {
        const { error } = await supabase
          .from('bots')
          .update({
            webhook_url: null,
            is_active: false
          })
          .eq('id', bot.id);

        if (error) throw error;

        setStatus('success');
        setMessage('Webhook removido com sucesso! Seu bot está inativo.');
        setBot({ ...bot, webhook_url: null });
      } else {
        throw new Error(data.description || 'Failed to delete webhook');
      }
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      setStatus('error');
      setMessage(error.message || 'Falha ao remover webhook.');
    } finally {
      setSetting(false);
    }
  };

  const checkWebhook = async () => {
    if (!bot) return;

    setSetting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${bot.bot_token}/getWebhookInfo`
      );

      const data = await response.json();

      if (data.ok) {
        const info = data.result;
        if (info.url) {
          setStatus('success');
          setMessage(`Active webhook: ${info.url}\nPending updates: ${info.pending_update_count}`);
        } else {
          setStatus('error');
          setMessage('No webhook configured');
        }
      } else {
        throw new Error(data.description || 'Failed to check webhook');
      }
    } catch (error: any) {
      console.error('Error checking webhook:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to check webhook status');
    } finally {
      setSetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bots')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhook Configuration</h1>
          <p className="text-gray-600 mt-1">
            {bot?.bot_name} (@{bot?.bot_username})
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>

        {bot?.webhook_url ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Webhook Active</p>
                <p className="text-sm text-green-700 break-all mt-1">{bot.webhook_url}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">No Webhook Configured</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Set up a webhook to enable bot functionality
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setMessage('URL copied to clipboard!');
                  setStatus('success');
                  setTimeout(() => setStatus('idle'), 2000);
                }}
                className="px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Copy URL"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={setupWebhook}
              disabled={setting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {setting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Set Webhook
                </>
              )}
            </button>

            <button
              onClick={checkWebhook}
              disabled={setting}
              className="px-4 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Status
            </button>

            {bot?.webhook_url && (
              <button
                onClick={deleteWebhook}
                disabled={setting}
                className="px-4 py-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            )}
          </div>

          {status !== 'idle' && message && (
            <div
              className={`rounded-lg p-4 ${
                status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p
                className={`text-sm whitespace-pre-line ${
                  status === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">1.</span>
            <span>
              The webhook URL is automatically generated based on your bot ID
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">2.</span>
            <span>
              Click "Set Webhook" to configure Telegram to send updates to this URL
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">3.</span>
            <span>
              Users can now interact with your bot and see available plans
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">4.</span>
            <span>Make sure your bot is active and has plans configured</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
