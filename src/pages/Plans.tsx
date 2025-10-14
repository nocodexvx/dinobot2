import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowLeft, Package } from 'lucide-react';
import PlanCard from '../components/PlanCard';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  name: string;
  description: string;
  duration_type: 'WEEKLY' | 'MONTHLY' | 'LIFETIME';
  duration_days: number;
  price: number;
  is_active: boolean;
  order_bump_enabled: boolean;
  order_bump_name?: string;
  order_bump_price?: number;
  subscriptions_count: number;
}

interface Bot {
  id: string;
  bot_name: string;
  bot_username: string;
}

export default function Plans() {
  const { botId } = useParams<{ botId: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (botId) {
      fetchBotAndPlans();
    }
  }, [botId]);

  const fetchBotAndPlans = async () => {
    try {
      const { data: botData, error: botError } = await supabase
        .from('bots')
        .select('id, bot_name, bot_username')
        .eq('id', botId)
        .maybeSingle();

      if (botError) throw botError;
      if (!botData) {
        navigate('/bots');
        return;
      }

      setBot(botData);

      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      const plansWithCounts = await Promise.all(
        (plansData || []).map(async (plan) => {
          const { count } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', plan.id)
            .eq('status', 'ACTIVE');

          return {
            ...plan,
            subscriptions_count: count || 0,
          };
        })
      );

      setPlans(plansWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);

      if (error) throw error;

      setPlans(plans.filter((plan) => plan.id !== id));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setPlans(plans.map((plan) => (plan.id === id ? { ...plan, is_active: isActive } : plan)));
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan status. Please try again.');
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bots')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-600 mt-1">
            {bot?.bot_name} (@{bot?.bot_username})
          </p>
        </div>
        <button
          onClick={() => navigate(`/bots/${botId}/plans/create`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No plans yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first subscription plan for this bot
          </p>
          <button
            onClick={() => navigate(`/bots/${botId}/plans/create`)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={(id) => navigate(`/bots/${botId}/plans/edit/${id}`)}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
