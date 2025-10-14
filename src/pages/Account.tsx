import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Globe, Clock, Bell, Key, Save, LogOut, Trash2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBot } from '../contexts/BotContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { SkeletonCard } from '../components/SkeletonLoader';

interface UserProfile {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  language: string;
  timezone: string;
  notify_email_bot_inactive: boolean;
  notify_telegram_bot_inactive: boolean;
  notify_email_new_subscriber: boolean;
  notify_email_payment: boolean;
  notify_email_expiring: boolean;
  telegram_notification_bot_id: string;
  created_at: string;
}

interface AccountStats {
  total_bots: number;
  active_bots: number;
  total_subscribers: number;
  total_revenue: number;
  member_since: string;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const { bots } = useBot();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setToast({ message: 'Erro ao carregar perfil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data: botsData } = await supabase
        .from('bots')
        .select('id, is_active, created_at')
        .eq('user_id', user.id);

      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('id')
        .in('bot_id', (botsData || []).map(b => b.id));

      const { data: transData } = await supabase
        .from('transactions')
        .select('amount')
        .in('bot_id', (botsData || []).map(b => b.id))
        .eq('status', 'paid');

      const totalRevenue = (transData || []).reduce((sum, t) => sum + (t.amount || 0), 0);
      const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A';

      setStats({
        total_bots: botsData?.length || 0,
        active_bots: botsData?.filter(b => b.is_active).length || 0,
        total_subscribers: subsData?.length || 0,
        total_revenue: totalRevenue / 100,
        member_since: memberSince
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          phone: profile.phone,
          language: profile.language,
          timezone: profile.timezone,
          notify_email_bot_inactive: profile.notify_email_bot_inactive,
          notify_telegram_bot_inactive: profile.notify_telegram_bot_inactive,
          notify_email_new_subscriber: profile.notify_email_new_subscriber,
          notify_email_payment: profile.notify_email_payment,
          notify_email_expiring: profile.notify_email_expiring,
          telegram_notification_bot_id: profile.telegram_notification_bot_id
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setToast({ message: 'Perfil atualizado com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setToast({ message: err.message || 'Erro ao salvar perfil', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setToast({ message: 'As senhas não coincidem', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'A senha deve ter no mínimo 6 caracteres', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setToast({ message: 'Senha alterada com sucesso!', type: 'success' });
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setToast({ message: err.message || 'Erro ao alterar senha', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Digite "DELETAR" para confirmar a exclusão permanente da conta:');

    if (confirmation !== 'DELETAR') {
      setToast({ message: 'Exclusão cancelada', type: 'error' });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.rpc('delete_user_account');

      if (error) throw error;

      setToast({ message: 'Conta deletada com sucesso', type: 'success' });
      setTimeout(() => {
        signOut();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setToast({ message: err.message || 'Erro ao deletar conta', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">Erro ao carregar perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header com Logo DINOBOT */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <svg className="w-12 h-12 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8.5V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v1.5c-1.66 0-3 1.34-3 3V13c0 .55.45 1 1 1h1v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2h4v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-6h1c.55 0 1-.45 1-1v-1.5c0-1.66-1.34-3-3-3zM6 7h12v1H6V7zm11 13h-2v-4H9v4H7v-7h10v7zm3-10h-2V9h2v1z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
            <p className="text-gray-600 mt-1">Gerencie suas informações e preferências</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Membro desde</p>
            <p className="text-lg font-semibold text-gray-900">{stats?.member_since}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Bots</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_bots || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Bots Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_bots || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assinantes</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_subscribers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats?.total_revenue.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-green-600" />
          Informações Pessoais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nome Completo
            </label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Empresa
            </label>
            <input
              type="text"
              value={profile.company_name || ''}
              onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Nome da empresa (opcional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefone
            </label>
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Idioma
            </label>
            <select
              value={profile.language}
              onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Fuso Horário
            </label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
              <option value="America/New_York">New York (GMT-5)</option>
              <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
              <option value="Europe/London">London (GMT+0)</option>
              <option value="Europe/Paris">Paris (GMT+1)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-600" />
          Notificações
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Notificar Inatividade de Bot por E-mail</p>
              <p className="text-sm text-gray-600">Receba alertas quando um bot ficar inativo</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_email_bot_inactive}
                onChange={(e) => setProfile({ ...profile, notify_email_bot_inactive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Notificar Inatividade de Bot por Telegram</p>
              <p className="text-sm text-gray-600 mb-2">Receba alertas via bot do Telegram</p>
              {profile.notify_telegram_bot_inactive && (
                <select
                  value={profile.telegram_notification_bot_id || ''}
                  onChange={(e) => setProfile({ ...profile, telegram_notification_bot_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Selecione um bot</option>
                  {bots.map(bot => (
                    <option key={bot.id} value={bot.id}>{bot.bot_name}</option>
                  ))}
                </select>
              )}
              {profile.notify_telegram_bot_inactive && !profile.telegram_notification_bot_id && (
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Selecione um bot para receber notificações
                </p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={profile.notify_telegram_bot_inactive}
                onChange={(e) => setProfile({ ...profile, notify_telegram_bot_inactive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Novo Assinante</p>
              <p className="text-sm text-gray-600">Notificação quando alguém assinar</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_email_new_subscriber}
                onChange={(e) => setProfile({ ...profile, notify_email_new_subscriber: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Pagamentos Recebidos</p>
              <p className="text-sm text-gray-600">Notificação de novos pagamentos</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_email_payment}
                onChange={(e) => setProfile({ ...profile, notify_email_payment: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Assinaturas Próximas do Vencimento</p>
              <p className="text-sm text-gray-600">Alertas de renovação de assinaturas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_email_expiring}
                onChange={(e) => setProfile({ ...profile, notify_email_expiring: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-green-600" />
          Segurança
        </h2>

        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Key className="w-4 h-4" />
            Alterar Senha
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Digite a senha novamente"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ações da Conta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Ações da Conta</h2>

        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Zona de Perigo</h3>
            <p className="text-sm text-gray-600 mb-4">
              A exclusão da conta é permanente e irá remover todos os seus dados, bots, assinantes e transações.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {saving ? 'Deletando...' : 'Deletar Conta Permanentemente'}
            </button>
          </div>
        </div>
      </div>

      {/* Botão Salvar Alterações */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-lg"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}
