import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bot as BotIcon } from 'lucide-react';
import BotCard from '../components/BotCard';
import { supabase } from '../lib/supabase';
import { SkeletonCard } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

interface BotWithCount {
  id: string;
  bot_name: string;
  bot_username: string;
  is_active: boolean;
  subscriptions_count: number;
}

export default function Bots() {
  const [bots, setBots] = useState<BotWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const { data: botsData, error } = await supabase
        .from('bots')
        .select('id, bot_name, bot_username, is_active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const botsWithCounts = await Promise.all(
        (botsData || []).map(async (bot) => {
          const { count } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('bot_id', bot.id)
            .eq('status', 'ACTIVE');

          return {
            ...bot,
            subscriptions_count: count || 0,
          };
        })
      );

      setBots(botsWithCounts);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('bots').delete().eq('id', id);

      if (error) throw error;

      setBots(bots.filter((bot) => bot.id !== id));
    } catch (error) {
      console.error('Error deleting bot:', error);
      alert('Falha ao excluir bot. Tente novamente.');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('bots')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setBots(
        bots.map((bot) => (bot.id === id ? { ...bot, is_active: isActive } : bot))
      );
    } catch (error) {
      console.error('Error updating bot:', error);
      alert('Failed to update bot status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bots</h1>
          <p className="text-gray-600 mt-1">Gerencie seus bots do Telegram</p>
        </div>
        <button
          onClick={() => navigate('/bots/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Criar Bot
        </button>
      </div>

      {bots.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <BotIcon className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bots yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first Telegram bot to start managing subscriptions
          </p>
          <button
            onClick={() => navigate('/bots/create')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Your First Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onEdit={(id) => navigate(`/bots/edit/${id}`)}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onViewPlans={(id) => navigate(`/bots/${id}/plans`)}
              onViewStats={(id) => navigate(`/statistics?bot=${id}`)}
              onWebhook={(id) => navigate(`/bots/${id}/webhook`)}
              onCommands={(id) => navigate(`/bots/${id}/commands`)}
              onPayment={(id) => navigate(`/bots/${id}/payment`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
