import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Package,
  Activity,
  BarChart3,
} from 'lucide-react';

interface Bot {
  id: string;
  bot_name: string;
}

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  averageTicket: number;
  churnRate: number;
  mrr: number;
}

interface PlanStats {
  plan_id: string;
  plan_name: string;
  total_sales: number;
  total_revenue: number;
  active_subs: number;
}

interface RevenueByMonth {
  month: string;
  revenue: number;
  subscriptions: number;
}

export default function Statistics() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('ALL');
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    averageTicket: 0,
    churnRate: 0,
    mrr: 0,
  });
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedBot, period]);

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('id, bot_name')
        .order('bot_name');

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const periodDate = getPeriodDate();

      let transactionsQuery = supabase
        .from('transactions')
        .select('*, bots(bot_name)')
        .eq('status', 'COMPLETED');

      let subscriptionsQuery = supabase
        .from('subscriptions')
        .select('*, plans(name, price)');

      if (selectedBot !== 'ALL') {
        transactionsQuery = transactionsQuery.eq('bot_id', selectedBot);
        subscriptionsQuery = subscriptionsQuery.eq('bot_id', selectedBot);
      }

      if (period !== 'all') {
        transactionsQuery = transactionsQuery.gte('created_at', periodDate);
        subscriptionsQuery = subscriptionsQuery.gte('created_at', periodDate);
      }

      const [
        { data: transactions, error: txError },
        { data: subscriptions, error: subError },
      ] = await Promise.all([
        transactionsQuery,
        subscriptionsQuery,
      ]);

      let allSubsQuery = supabase
        .from('subscriptions')
        .select('*, plans(name, price)');

      if (selectedBot !== 'ALL') {
        allSubsQuery = allSubsQuery.eq('bot_id', selectedBot);
      }

      const { data: allSubscriptions, error: allSubError } = await allSubsQuery;

      if (txError) throw txError;
      if (subError) throw subError;

      const totalRevenue = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const totalSubscriptions = subscriptions?.length || 0;
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'ACTIVE').length || 0;
      const expiredSubscriptions = subscriptions?.filter(s => s.status === 'EXPIRED').length || 0;
      const averageTicket = totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyTransactions = transactions?.filter(
        tx => new Date(tx.created_at) >= thirtyDaysAgo
      ) || [];
      const monthlyRevenue = monthlyTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

      const allActiveSubs = allSubscriptions?.filter(s => s.status === 'ACTIVE') || [];
      const mrr = allActiveSubs.reduce((sum, sub) => {
        const planPrice = Number(sub.plans?.price || 0);
        const durationDays = 30;
        return sum + (planPrice / durationDays) * 30;
      }, 0);

      const totalAllSubs = allSubscriptions?.length || 0;
      const expiredAllSubs = allSubscriptions?.filter(s => s.status === 'EXPIRED').length || 0;
      const churnRate = totalAllSubs > 0 ? (expiredAllSubs / totalAllSubs) * 100 : 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        averageTicket,
        churnRate,
        mrr,
      });

      await fetchPlanStats();
      await fetchRevenueByMonth();
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanStats = async () => {
    try {
      let query = supabase
        .from('subscriptions')
        .select('plan_id, plans(name, price), status');

      if (selectedBot !== 'ALL') {
        query = query.eq('bot_id', selectedBot);
      }

      const { data, error } = await query;

      if (error) throw error;

      const planStatsMap = new Map<string, PlanStats>();

      data?.forEach(sub => {
        const planId = sub.plan_id;
        const planName = sub.plans?.name || 'Unknown';
        const planPrice = Number(sub.plans?.price || 0);

        if (!planStatsMap.has(planId)) {
          planStatsMap.set(planId, {
            plan_id: planId,
            plan_name: planName,
            total_sales: 0,
            total_revenue: 0,
            active_subs: 0,
          });
        }

        const stats = planStatsMap.get(planId)!;
        stats.total_sales++;
        stats.total_revenue += planPrice;
        if (sub.status === 'ACTIVE') {
          stats.active_subs++;
        }
      });

      const sortedStats = Array.from(planStatsMap.values()).sort(
        (a, b) => b.total_revenue - a.total_revenue
      );

      setPlanStats(sortedStats);
    } catch (error) {
      console.error('Error fetching plan stats:', error);
    }
  };

  const fetchRevenueByMonth = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('created_at, amount')
        .eq('status', 'COMPLETED')
        .order('created_at');

      if (selectedBot !== 'ALL') {
        query = query.eq('bot_id', selectedBot);
      }

      const { data, error } = await query;

      if (error) throw error;

      const monthlyData = new Map<string, { revenue: number; count: number }>();

      data?.forEach(tx => {
        const date = new Date(tx.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { revenue: 0, count: 0 });
        }

        const stats = monthlyData.get(monthKey)!;
        stats.revenue += Number(tx.amount);
        stats.count++;
      });

      const sortedData = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, stats]) => ({
          month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          revenue: stats.revenue,
          subscriptions: stats.count,
        }));

      setRevenueByMonth(sortedData);
    } catch (error) {
      console.error('Error fetching revenue by month:', error);
    }
  };

  const getPeriodDate = () => {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-1">Detailed analytics and reports</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <select
            value={selectedBot}
            onChange={(e) => setSelectedBot(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Bots</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.bot_name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Monthly: R$ {stats.monthlyRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">MRR</p>
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.mrr.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Subscriptions</p>
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.activeSubscriptions}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total: {stats.totalSubscriptions}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Average Ticket</p>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.averageTicket.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Per subscription</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Churn Rate</p>
            <div className={`p-2 rounded-lg ${stats.churnRate > 10 ? 'bg-red-100' : 'bg-green-100'}`}>
              <TrendingDown className={`w-5 h-5 ${stats.churnRate > 10 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.churnRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.expiredSubscriptions} expired
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Revenue Trend</h2>
          </div>

          {revenueByMonth.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data available</div>
          ) : (
            <div className="space-y-4">
              {revenueByMonth.map((item, index) => {
                const maxRevenue = Math.max(...revenueByMonth.map(r => r.revenue));
                const widthPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-semibold text-gray-900">
                        R$ {item.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.subscriptions} subscriptions</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Top Plans</h2>
          </div>

          {planStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data available</div>
          ) : (
            <div className="space-y-4">
              {planStats.slice(0, 5).map((plan, index) => (
                <div key={plan.plan_id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.plan_name}</h3>
                        <p className="text-sm text-gray-600">
                          {plan.total_sales} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        R$ {plan.total_revenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600">
                        {plan.active_subs} active
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
