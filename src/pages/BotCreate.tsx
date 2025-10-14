import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function BotCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [botInfo, setBotInfo] = useState<{ username: string; name: string } | null>(null);
  const [error, setError] = useState('');

  const validateAndCreateBot = async () => {
    if (!botToken.trim()) {
      setError('Token do bot é obrigatório');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`
      );
      const data = await response.json();

      if (!data.ok) {
        setError('Token inválido. Verifique e tente novamente.');
        setValidating(false);
        return;
      }

      const botUsername = data.result.username;
      const botName = data.result.first_name;

      setBotInfo({ username: botUsername, name: botName });
      setValidating(false);

      setLoading(true);

      const { data: insertData, error: insertError } = await supabase
        .from('bots')
        .insert([
          {
            user_id: user?.id,
            bot_token: botToken,
            bot_username: botUsername,
            bot_name: botName,
            welcome_message: 'Olá {profile_name}! 👋\n\nBem-vindo ao nosso grupo VIP exclusivo!\n\nEscolha um dos planos abaixo:',
            vip_group_id: '',
            registry_channel_id: '',
            is_active: false,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const botId = insertData.id;
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-webhook?bot_id=${botId}`;

      const webhookResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );

      const webhookData = await webhookResponse.json();

      if (webhookData.ok) {
        await supabase
          .from('bots')
          .update({
            webhook_url: webhookUrl,
            is_active: true
          })
          .eq('id', botId);
      }

      navigate('/bot-editor?botId=' + botId);
    } catch (err: any) {
      console.error('Erro ao criar bot:', err);
      setError(err?.message || 'Erro ao criar bot. Tente novamente.');
      setLoading(false);
      setValidating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bots')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Bot</h1>
          <p className="text-gray-600 mt-1">Conecte seu bot do Telegram</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Bot className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Como obter o token?</h3>
              <p className="text-sm text-blue-700">
                Fale com o @BotFather no Telegram e use o comando /newbot ou /token
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token do Bot
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => {
                setBotToken(e.target.value);
                setError('');
                setBotInfo(null);
              }}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              disabled={loading || validating}
            />
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>

          {botInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">{botInfo.name}</p>
                  <p className="text-sm text-green-700">@{botInfo.username}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={validateAndCreateBot}
            disabled={loading || validating || !botToken.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading || validating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {validating ? 'Validando...' : 'Criando bot e configurando webhook...'}
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Criar Bot
              </>
            )}
          </button>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-3">O que acontece ao criar?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Bot é validado e conectado automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Webhook configurado automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Você será redirecionado para configurar mensagens e grupos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
