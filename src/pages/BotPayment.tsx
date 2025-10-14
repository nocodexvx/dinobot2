import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Eye, EyeOff, Check, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentConfig {
  payment_gateway: string;
  payment_public_token: string;
  payment_private_token: string;
  payment_webhook_secret: string;
  payment_enabled: boolean;
}

export default function BotPayment() {
  const navigate = useNavigate();
  const { botId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botName, setBotName] = useState('');
  const [showPrivateToken, setShowPrivateToken] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [config, setConfig] = useState<PaymentConfig>({
    payment_gateway: '',
    payment_public_token: '',
    payment_private_token: '',
    payment_webhook_secret: '',
    payment_enabled: false,
  });

  useEffect(() => {
    fetchPaymentConfig();
  }, [botId]);

  const fetchPaymentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('bot_name, payment_gateway, payment_public_token, payment_private_token, payment_webhook_secret, payment_enabled')
        .eq('id', botId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBotName(data.bot_name);
        setConfig({
          payment_gateway: data.payment_gateway || '',
          payment_public_token: data.payment_public_token || '',
          payment_private_token: data.payment_private_token || '',
          payment_webhook_secret: data.payment_webhook_secret || '',
          payment_enabled: data.payment_enabled || false,
        });
      }
    } catch (error) {
      console.error('Error fetching payment config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('bots')
        .update({
          payment_gateway: config.payment_gateway || null,
          payment_public_token: config.payment_public_token || null,
          payment_private_token: config.payment_private_token || null,
          payment_webhook_secret: config.payment_webhook_secret || null,
          payment_enabled: config.payment_enabled,
        })
        .eq('id', botId);

      if (error) throw error;

      setSuccessMessage('Payment gateway configured successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving payment config:', error);
      alert('Error saving payment configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payment configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bots')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Gateway</h1>
          <p className="text-gray-600 mt-1">{botName}</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gateway Configuration</h2>
              <p className="text-sm text-gray-600">Configure PIX payment gateway</p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-medium text-gray-700">
              {config.payment_enabled ? 'Enabled' : 'Disabled'}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={config.payment_enabled}
                onChange={(e) => setConfig({ ...config, payment_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Gateway *
            </label>
            <select
              value={config.payment_gateway}
              onChange={(e) => setConfig({ ...config, payment_gateway: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gateway</option>
              <option value="pushinpay">PushinPay</option>
              <option value="syncpay">Syncpay</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="asaas">Asaas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Token / API Key *
            </label>
            <input
              type="text"
              value={config.payment_public_token}
              onChange={(e) => setConfig({ ...config, payment_public_token: e.target.value })}
              placeholder="Enter your public token"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This token will be used for public API calls
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Token / Secret Key *
            </label>
            <div className="relative">
              <input
                type={showPrivateToken ? 'text' : 'password'}
                value={config.payment_private_token}
                onChange={(e) => setConfig({ ...config, payment_private_token: e.target.value })}
                placeholder="Enter your private token"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPrivateToken(!showPrivateToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPrivateToken ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Keep this token secure. It will be used for server-side operations.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret (Optional)
            </label>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                value={config.payment_webhook_secret}
                onChange={(e) => setConfig({ ...config, payment_webhook_secret: e.target.value })}
                placeholder="Enter webhook secret for validation"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showWebhookSecret ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used to validate incoming webhook requests from the payment gateway
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Never share your private token with anyone</li>
                <li>Tokens are stored securely and encrypted</li>
                <li>Make sure to enable payment after configuration</li>
                <li>Test with small amounts before going live</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !config.payment_gateway || !config.payment_public_token || !config.payment_private_token}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Configuration
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/bots')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {config.payment_enabled && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Payment Gateway is Active!
              </h3>
              <p className="text-green-800 text-sm mb-3">
                Your bot can now generate PIX payments automatically. Users will be able to purchase plans directly through Telegram.
              </p>
              <div className="bg-white rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-900 mb-2">Webhook URL:</p>
                <code className="bg-gray-100 px-3 py-2 rounded text-xs block break-all">
                  {`${window.location.origin}/functions/v1/payment-webhook?bot_id=${botId}`}
                </code>
                <p className="text-gray-600 mt-2 text-xs">
                  Configure this URL in your payment gateway dashboard to receive payment confirmations
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
