import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, Bot } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalRevenue: number;
  activeSubscriptions: number;
  conversionRate: number;
  totalBots: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    telegram_first_name: string | null;
    created_at: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    conversionRate: 0,
    totalBots: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'COMPLETED');

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch active subscriptions
      const { count: activeCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Fetch total bots
      const { count: botsCount } = await supabase
        .from('bots')
        .select('*', { count: 'exact', head: true });

      // Fetch recent transactions with subscription data
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          status,
          telegram_user_id,
          created_at,
          subscription_id,
          subscriptions (
            telegram_first_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate conversion rate (completed vs total transactions)
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      const { count: completedTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED');

      const conversionRate =
        totalTransactions && completedTransactions
          ? (completedTransactions / totalTransactions) * 100
          : 0;

      setStats({
        totalRevenue,
        activeSubscriptions: activeCount || 0,
        conversionRate: Math.round(conversionRate),
        totalBots: botsCount || 0,
        recentTransactions: recentTransactions?.map((t: any) => ({
          id: t.id,
          amount: t.amount,
          status: t.status,
          telegram_first_name: t.subscriptions?.telegram_first_name || null,
          created_at: t.created_at,
        })) || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel</h1>
        <p className="text-gray-600 mt-1">Visão geral do desempenho dos seus bots</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <MetricCard
          title="Assinaturas Ativas"
          value={stats.activeSubscriptions}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <MetricCard
          title="Total de Bots"
          value={stats.totalBots}
          icon={Bot}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transações Recentes</h2>
        {stats.recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma transação ainda</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Valor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {transaction.telegram_first_name || 'Desconhecido'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(Number(transaction.amount))}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
