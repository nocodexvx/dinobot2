import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Bot, MessageSquare, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BotData {
  bot_token: string;
  bot_username: string;
  bot_name: string;
  welcome_message: string;
  media_url: string;
  media_type: 'image' | 'video' | null;
  vip_group_id: string;
  registry_channel_id: string;
  vip_group_link: string;
}

export default function BotCreate() {
  const navigate = useNavigate();
  const { botId } = useParams();
  const { user } = useAuth();
  const [isEdit, setIsEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);

  const [botData, setBotData] = useState<BotData>({
    bot_token: '',
    bot_username: '',
    bot_name: '',
    welcome_message: 'Olá {profile_name}! 👋\n\nBem-vindo ao nosso grupo VIP exclusivo!\n\nEscolha um dos planos abaixo:',
    media_url: '',
    media_type: null,
    vip_group_id: '',
    registry_channel_id: '',
    vip_group_link: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BotData, string>>>({});

  useEffect(() => {
    if (botId) {
      setIsEdit(true);
      fetchBot();
    }
  }, [botId]);

  const fetchBot = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setBotData({
          bot_token: data.bot_token,
          bot_username: data.bot_username,
          bot_name: data.bot_name,
          welcome_message: data.welcome_message,
          media_url: data.media_url || '',
          media_type: data.media_type,
          vip_group_id: data.vip_group_id,
          registry_channel_id: data.registry_channel_id,
          vip_group_link: data.vip_group_link || '',
        });
        setTokenValidated(true);
      }
    } catch (error) {
      console.error('Error fetching bot:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Bot Token', icon: Bot },
    { number: 2, title: 'Welcome Message', icon: MessageSquare },
    { number: 3, title: 'Groups Configuration', icon: Settings },
  ];

  const validateToken = async () => {
    if (!botData.bot_token) {
      setErrors({ ...errors, bot_token: 'Bot token is required' });
      return;
    }

    setValidatingToken(true);
    setErrors({});

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botData.bot_token}/getMe`
      );
      const data = await response.json();

      if (data.ok) {
        setBotData({
          ...botData,
          bot_username: data.result.username,
          bot_name: data.result.first_name,
        });
        setTokenValidated(true);
      } else {
        setErrors({ ...errors, bot_token: 'Invalid bot token' });
      }
    } catch (error) {
      setErrors({ ...errors, bot_token: 'Failed to validate token' });
    } finally {
      setValidatingToken(false);
    }
  };

  const validateStep1 = () => {
    if (!tokenValidated) {
      setErrors({ ...errors, bot_token: 'Please validate the bot token first' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof BotData, string>> = {};

    if (!botData.welcome_message.trim()) {
      newErrors.welcome_message = 'Welcome message is required';
    }

    if (botData.media_url && !botData.media_type) {
      newErrors.media_type = 'Please select media type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Partial<Record<keyof BotData, string>> = {};

    if (!botData.vip_group_id.trim()) {
      newErrors.vip_group_id = 'VIP group ID is required';
    }

    if (!botData.registry_channel_id.trim()) {
      newErrors.registry_channel_id = 'Registry channel ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);

    try {
      const botPayload = {
        bot_token: botData.bot_token,
        bot_username: botData.bot_username,
        bot_name: botData.bot_name,
        welcome_message: botData.welcome_message,
        media_url: botData.media_url || null,
        media_type: botData.media_type,
        vip_group_id: botData.vip_group_id,
        vip_group_link: botData.vip_group_link || null,
        registry_channel_id: botData.registry_channel_id,
      };

      if (isEdit && botId) {
        const { error } = await supabase
          .from('bots')
          .update(botPayload)
          .eq('id', botId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('bots').insert([
          {
            ...botPayload,
            user_id: user?.id,
            is_active: false,
          },
        ]);

        if (error) throw error;
      }

      navigate('/bots');
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} bot:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} bot. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Bot' : 'Create Bot'}</h1>
          <p className="text-gray-600 mt-1">{isEdit ? 'Update your bot configuration' : 'Set up your Telegram bot'}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep > step.number
                      ? 'bg-green-600 border-green-600'
                      : currentStep === step.number
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <step.icon
                      className={`w-6 h-6 ${
                        currentStep === step.number ? 'text-white' : 'text-gray-400'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-sm font-medium mt-2 ${
                    currentStep === step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-4 ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 1: Validate Bot Token
              </h2>
              <p className="text-gray-600 mb-6">
                Enter your bot token from @BotFather to get started
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="text"
                value={botData.bot_token}
                onChange={(e) => {
                  setBotData({ ...botData, bot_token: e.target.value });
                  setTokenValidated(false);
                  setErrors({});
                }}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={tokenValidated}
              />
              {errors.bot_token && (
                <p className="text-red-600 text-sm mt-1">{errors.bot_token}</p>
              )}
            </div>

            {!tokenValidated ? (
              <button
                onClick={validateToken}
                disabled={validatingToken || !botData.bot_token}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validatingToken ? 'Validating...' : 'Validate Token'}
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{botData.bot_name}</p>
                    <p className="text-sm text-green-700">@{botData.bot_username}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 2: Welcome Message
              </h2>
              <p className="text-gray-600 mb-6">
                Customize the message users will see when they start the bot
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Message
              </label>
              <textarea
                value={botData.welcome_message}
                onChange={(e) =>
                  setBotData({ ...botData, welcome_message: e.target.value })
                }
                rows={6}
                placeholder="Use {profile_name} to personalize"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.welcome_message && (
                <p className="text-red-600 text-sm mt-1">{errors.welcome_message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Use {'{profile_name}'} to include the user's name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media URL (Optional)
              </label>
              <input
                type="url"
                value={botData.media_url}
                onChange={(e) => setBotData({ ...botData, media_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {botData.media_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="media_type"
                      value="image"
                      checked={botData.media_type === 'image'}
                      onChange={(e) =>
                        setBotData({
                          ...botData,
                          media_type: e.target.value as 'image' | 'video',
                        })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="media_type"
                      value="video"
                      checked={botData.media_type === 'video'}
                      onChange={(e) =>
                        setBotData({
                          ...botData,
                          media_type: e.target.value as 'image' | 'video',
                        })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Video</span>
                  </label>
                </div>
                {errors.media_type && (
                  <p className="text-red-600 text-sm mt-1">{errors.media_type}</p>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 3: Groups Configuration
              </h2>
              <p className="text-gray-600 mb-6">
                Configure the VIP group and registry channel
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIP Group ID
              </label>
              <input
                type="text"
                value={botData.vip_group_id}
                onChange={(e) =>
                  setBotData({ ...botData, vip_group_id: e.target.value })
                }
                placeholder="-1001234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.vip_group_id && (
                <p className="text-red-600 text-sm mt-1">{errors.vip_group_id}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                The Telegram group where paid members will be added
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIP Group Link (Optional)
              </label>
              <input
                type="url"
                value={botData.vip_group_link}
                onChange={(e) =>
                  setBotData({ ...botData, vip_group_link: e.target.value })
                }
                placeholder="https://t.me/yourvipgroup"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registry Channel ID
              </label>
              <input
                type="text"
                value={botData.registry_channel_id}
                onChange={(e) =>
                  setBotData({ ...botData, registry_channel_id: e.target.value })
                }
                placeholder="-1001234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.registry_channel_id && (
                <p className="text-red-600 text-sm mt-1">{errors.registry_channel_id}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                The channel where sale notifications will be posted
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Make sure the bot is an administrator in both the VIP group and registry
                channel
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Bot'}
            <Check className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
