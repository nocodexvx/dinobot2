import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlanData {
  name: string;
  description: string;
  duration_type: 'WEEKLY' | 'MONTHLY' | 'LIFETIME';
  duration_days: number;
  price: number;
  order_bump_enabled: boolean;
  order_bump_name: string;
  order_bump_description: string;
  order_bump_price: number;
}

export default function PlanForm() {
  const { botId, planId } = useParams<{ botId: string; planId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState('');
  const [isEdit, setIsEdit] = useState(false);

  const [planData, setPlanData] = useState<PlanData>({
    name: '',
    description: '',
    duration_type: 'MONTHLY',
    duration_days: 30,
    price: 0,
    order_bump_enabled: false,
    order_bump_name: '',
    order_bump_description: '',
    order_bump_price: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PlanData, string>>>({});

  useEffect(() => {
    fetchBot();
    if (planId) {
      setIsEdit(true);
      fetchPlan();
    }
  }, [botId, planId]);

  const fetchBot = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('bot_name')
        .eq('id', botId)
        .maybeSingle();

      if (error) throw error;
      if (data) setBotName(data.bot_name);
    } catch (error) {
      console.error('Error fetching bot:', error);
    }
  };

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPlanData({
          name: data.name,
          description: data.description || '',
          duration_type: data.duration_type,
          duration_days: data.duration_days,
          price: data.price,
          order_bump_enabled: data.order_bump_enabled || false,
          order_bump_name: data.order_bump_name || '',
          order_bump_description: data.order_bump_description || '',
          order_bump_price: data.order_bump_price || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    }
  };

  const handleDurationTypeChange = (type: 'WEEKLY' | 'MONTHLY' | 'LIFETIME') => {
    let days = planData.duration_days;

    if (type === 'WEEKLY' && planData.duration_type !== 'WEEKLY') {
      days = 7;
    } else if (type === 'MONTHLY' && planData.duration_type !== 'MONTHLY') {
      days = 30;
    } else if (type === 'LIFETIME') {
      days = 365 * 100;
    }

    setPlanData({
      ...planData,
      duration_type: type,
      duration_days: days,
    });
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof PlanData, string>> = {};

    if (!planData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!planData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (planData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (planData.duration_type !== 'LIFETIME' && planData.duration_days <= 0) {
      newErrors.duration_days = 'Duration must be greater than 0';
    }

    if (planData.order_bump_enabled) {
      if (!planData.order_bump_name.trim()) {
        newErrors.order_bump_name = 'Order bump name is required';
      }
      if (planData.order_bump_price <= 0) {
        newErrors.order_bump_price = 'Order bump price must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const planPayload = {
        bot_id: botId,
        name: planData.name,
        description: planData.description,
        duration_type: planData.duration_type,
        duration_days: planData.duration_days,
        price: planData.price,
        order_bump_enabled: planData.order_bump_enabled,
        order_bump_name: planData.order_bump_enabled ? planData.order_bump_name : null,
        order_bump_description: planData.order_bump_enabled
          ? planData.order_bump_description
          : null,
        order_bump_price: planData.order_bump_enabled ? planData.order_bump_price : null,
        is_active: true,
      };

      if (isEdit && planId) {
        const { error } = await supabase.from('plans').update(planPayload).eq('id', planId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('plans').insert([planPayload]);
        if (error) throw error;
      }

      navigate(`/bots/${botId}/plans`);
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/bots/${botId}/plans`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Plan' : 'Create Plan'}
          </h1>
          <p className="text-gray-600 mt-1">{botName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name
              </label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
                placeholder="e.g., VIP Monthly, Premium Weekly"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={planData.description}
                onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
                rows={4}
                placeholder="Describe what's included in this plan..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration Type
                </label>
                <select
                  value={planData.duration_type}
                  onChange={(e) =>
                    handleDurationTypeChange(e.target.value as 'WEEKLY' | 'MONTHLY' | 'LIFETIME')
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="LIFETIME">Lifetime</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={planData.duration_days}
                  onChange={(e) =>
                    setPlanData({ ...planData, duration_days: parseInt(e.target.value) || 0 })
                  }
                  disabled={planData.duration_type === 'LIFETIME'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                {errors.duration_days && (
                  <p className="text-red-600 text-sm mt-1">{errors.duration_days}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={planData.price}
                  onChange={(e) =>
                    setPlanData({ ...planData, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order Bump (Upsell)</h2>
              <p className="text-sm text-gray-600 mt-1">
                Offer an additional product during checkout
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={planData.order_bump_enabled}
                onChange={(e) =>
                  setPlanData({ ...planData, order_bump_enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {planData.order_bump_enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Bump Name
                </label>
                <input
                  type="text"
                  value={planData.order_bump_name}
                  onChange={(e) =>
                    setPlanData({ ...planData, order_bump_name: e.target.value })
                  }
                  placeholder="e.g., Extra Benefits Package"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.order_bump_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.order_bump_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Bump Description
                </label>
                <textarea
                  value={planData.order_bump_description}
                  onChange={(e) =>
                    setPlanData({ ...planData, order_bump_description: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe what's included in the order bump..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Price (R$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={planData.order_bump_price}
                    onChange={(e) =>
                      setPlanData({
                        ...planData,
                        order_bump_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {errors.order_bump_price && (
                  <p className="text-red-600 text-sm mt-1">{errors.order_bump_price}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold mb-2">{planData.name || 'Plan Name'}</h3>
                <p className="text-blue-100 text-sm mb-4">
                  {planData.description || 'Plan description will appear here...'}
                </p>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">
                    R$ {planData.price.toFixed(2)}
                  </span>
                  <span className="text-blue-100">
                    / {planData.duration_type === 'LIFETIME' ? 'lifetime' : `${planData.duration_days} days`}
                  </span>
                </div>

                {planData.order_bump_enabled && planData.order_bump_name && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                        BONUS
                      </span>
                      <span className="text-sm font-semibold">{planData.order_bump_name}</span>
                    </div>
                    {planData.order_bump_description && (
                      <p className="text-xs text-blue-100">{planData.order_bump_description}</p>
                    )}
                    <p className="text-sm font-bold mt-2">
                      +R$ {planData.order_bump_price.toFixed(2)}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(`/bots/${botId}/plans`)}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
