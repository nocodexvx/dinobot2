import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Edit2, Plus, Trash2, Check, RotateCcw, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonCard } from '../components/SkeletonLoader';
import Toast from '../components/Toast';
import PlanModal, { PlanFormData } from '../components/PlanModal';
import PackageModal, { PackageFormData } from '../components/PackageModal';
import GroupConfigurationGuide from '../components/GroupConfigurationGuide';
import {
  validateGroupId,
  validateBotInGroup,
  sendWelcomeMessageToRegistry,
  generateVipLink
} from '../lib/telegram-group-validator';

interface Bot {
  id: string;
  bot_name: string;
  bot_username: string;
  bot_token: string;
  welcome_message: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  vip_group_id: string;
  vip_group_link: string | null;
  registry_channel_id: string;
  support_bot_link: string | null;
  payment_enabled: boolean;
  payment_method_message: string | null;
  payment_method_button_text: string | null;
  pix_main_message: string | null;
  pix_status_button_text: string | null;
  pix_qrcode_button_text: string | null;
  pix_media_url: string | null;
  pix_audio_url: string | null;
  show_qrcode_in_chat: boolean;
  pix_format_blockquote: boolean;
  cta_enabled: boolean;
  cta_text: string | null;
  cta_button_text: string | null;
  cta_after_click_message: string | null;
  cta_button_action: 'show_plans' | 'show_buttons' | null;
}

interface Plan {
  id: string;
  name: string;
  duration_type: string;
  price: number;
  order_bump_enabled: boolean;
  order_bump_value?: number;
  deliverables?: string;
}

interface Package {
  id: string;
  name: string;
  value: number;
  deliverables: string;
  order_bump_enabled: boolean;
  order_bump_value?: number;
}

interface CustomButton {
  id: string;
  text: string;
  url: string;
  order_position: number;
}

const DEFAULT_PIX_CONFIG = {
  payment_method_message: '🌟 Plano selecionado:\n\n🎁 Plano: {plan_name}\n💰 Valor: {plan_value}\n⏳ Duração: {plan_duration}\n\nEscolha o método de pagamento abaixo:',
  payment_method_button_text: '💠 Pagar com Pix',
  pix_main_message: '🌟 Você selecionou o seguinte plano:\n\n🎁 Plano: {plan_name}\n💰 Valor: {plan_value}\n\n💠 Pague via Pix Copia e Cola:\n\n{payment_pointer}\n\n👆 Toque na chave PIX acima para copiá-la\n\n‼️ Após o pagamento, clique no botão abaixo:',
  pix_status_button_text: 'Verificar Status do Pagamento',
  pix_qrcode_button_text: 'Mostrar QR Code',
  show_qrcode_in_chat: true,
  pix_format_blockquote: false,
};

export default function BotEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([]);

  const [editingCTA, setEditingCTA] = useState(false);
  const [editingButtons, setEditingButtons] = useState(false);
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState(false);
  const [ctaBackup, setCtaBackup] = useState<any>(null);
  const [paymentBackup, setPaymentBackup] = useState<any>(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanFormData | null>(null);
  const [plansExpanded, setPlansExpanded] = useState(false);

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageFormData | null>(null);
  const [packagesExpanded, setPackagesExpanded] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchBots();
    }
  }, [user]);

  useEffect(() => {
    const botId = searchParams.get('botId');
    if (botId && bots.length > 0) {
      setSelectedBotId(botId);
      loadBotData(botId);
    } else if (bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id);
      loadBotData(bots[0].id);
    }
  }, [searchParams, bots]);

  useEffect(() => {
    if (selectedBotId) {
      loadBotData(selectedBotId);
    }
  }, [selectedBotId]);

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar bots:', err);
      setLoading(false);
    }
  };

  const loadBotData = async (botId: string) => {
    try {
      setLoading(true);

      const { data: botData, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .single();

      if (botError) throw botError;

      // Aplicar valores padrão do PIX se não existirem
      const botWithDefaults = {
        ...botData,
        payment_method_message: botData.payment_method_message || DEFAULT_PIX_CONFIG.payment_method_message,
        payment_method_button_text: botData.payment_method_button_text || DEFAULT_PIX_CONFIG.payment_method_button_text,
        pix_main_message: botData.pix_main_message || DEFAULT_PIX_CONFIG.pix_main_message,
        pix_status_button_text: botData.pix_status_button_text || DEFAULT_PIX_CONFIG.pix_status_button_text,
        pix_qrcode_button_text: botData.pix_qrcode_button_text || DEFAULT_PIX_CONFIG.pix_qrcode_button_text,
        show_qrcode_in_chat: botData.show_qrcode_in_chat ?? DEFAULT_PIX_CONFIG.show_qrcode_in_chat,
        pix_format_blockquote: botData.pix_format_blockquote ?? DEFAULT_PIX_CONFIG.pix_format_blockquote,
      };

      setSelectedBot(botWithDefaults);

      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);

      const { data: buttonsData, error: buttonsError } = await supabase
        .from('custom_buttons')
        .select('*')
        .eq('bot_id', botId)
        .order('order_position', { ascending: true });

      if (buttonsError) throw buttonsError;
      setCustomButtons(buttonsData || []);

      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados do bot:', err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBot) return;

    try {
      setSaving(true);

      const vipIdValidation = await validateGroupId(selectedBot.vip_group_id);
      if (!vipIdValidation.isValid) {
        setToast({ message: `ID VIP: ${vipIdValidation.error}`, type: 'error' });
        setSaving(false);
        return;
      }

      const registryIdValidation = await validateGroupId(selectedBot.registry_channel_id);
      if (!registryIdValidation.isValid) {
        setToast({ message: `ID REGISTRO: ${registryIdValidation.error}`, type: 'error' });
        setSaving(false);
        return;
      }

      if (selectedBot.vip_group_id === selectedBot.registry_channel_id) {
        setToast({ message: '❌ Os IDs do Grupo VIP e Grupo de Notificação não podem ser iguais', type: 'error' });
        setSaving(false);
        return;
      }

      setToast({ message: 'Validando Grupo VIP...', type: 'success' });
      const vipValidation = await validateBotInGroup(selectedBot.bot_token, selectedBot.vip_group_id);
      if (!vipValidation.isValid) {
        setToast({ message: `Grupo VIP: ${vipValidation.error}`, type: 'error' });
        setSaving(false);
        return;
      }

      setToast({ message: 'Validando Grupo de Notificação...', type: 'success' });
      const registryValidation = await validateBotInGroup(selectedBot.bot_token, selectedBot.registry_channel_id);
      if (!registryValidation.isValid) {
        setToast({ message: `Grupo de Notificação: ${registryValidation.error}`, type: 'error' });
        setSaving(false);
        return;
      }

      setToast({ message: 'Gerando link VIP...', type: 'success' });
      const linkResult = await generateVipLink(selectedBot.bot_token, selectedBot.vip_group_id);
      let vipLink = selectedBot.vip_group_link;
      if (linkResult.link) {
        vipLink = linkResult.link;
      }

      setToast({ message: 'Enviando mensagem de boas-vindas...', type: 'success' });
      await sendWelcomeMessageToRegistry(selectedBot.bot_token, selectedBot.registry_channel_id, selectedBot.bot_name);

      const { error } = await supabase
        .from('bots')
        .update({
          bot_token: selectedBot.bot_token,
          welcome_message: selectedBot.welcome_message,
          media_url: selectedBot.media_url,
          media_type: selectedBot.media_type,
          vip_group_id: selectedBot.vip_group_id,
          vip_group_link: vipLink,
          registry_channel_id: selectedBot.registry_channel_id,
          support_bot_link: selectedBot.support_bot_link,
          payment_enabled: selectedBot.payment_enabled,
          payment_method_message: selectedBot.payment_method_message,
          payment_method_button_text: selectedBot.payment_method_button_text,
          pix_main_message: selectedBot.pix_main_message,
          pix_status_button_text: selectedBot.pix_status_button_text,
          pix_qrcode_button_text: selectedBot.pix_qrcode_button_text,
          pix_media_url: selectedBot.pix_media_url,
          pix_audio_url: selectedBot.pix_audio_url,
          show_qrcode_in_chat: selectedBot.show_qrcode_in_chat,
          pix_format_blockquote: selectedBot.pix_format_blockquote,
          cta_enabled: selectedBot.cta_enabled,
          cta_text: selectedBot.cta_text,
          cta_button_text: selectedBot.cta_button_text,
          cta_after_click_message: selectedBot.cta_after_click_message,
          cta_button_action: selectedBot.cta_button_action,
        })
        .eq('id', selectedBot.id);

      if (error) throw error;

      setSelectedBot({ ...selectedBot, vip_group_link: vipLink });
      setToast({ message: '✅ Grupos validados e alterações salvas com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setToast({ message: 'Erro ao salvar alterações', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBot = async () => {
    if (!selectedBot) return;

    if (!confirm(`Tem certeza que deseja excluir o bot @${selectedBot.bot_username}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', selectedBot.id);

      if (error) throw error;

      setToast({ message: 'Bot excluído com sucesso!', type: 'success' });
      setTimeout(() => navigate('/bots'), 1500);
    } catch (err) {
      console.error('Erro ao excluir bot:', err);
      setToast({ message: 'Erro ao excluir bot', type: 'error' });
    }
  };

  const startEditCTA = () => {
    setCtaBackup({
      cta_enabled: selectedBot?.cta_enabled,
      cta_text: selectedBot?.cta_text,
      cta_button_text: selectedBot?.cta_button_text,
      cta_after_click_message: selectedBot?.cta_after_click_message,
      cta_button_action: selectedBot?.cta_button_action,
    });
    setEditingCTA(true);
  };

  const saveCTA = () => {
    setEditingCTA(false);
    setCtaBackup(null);
  };

  const cancelCTA = () => {
    if (selectedBot && ctaBackup) {
      setSelectedBot({
        ...selectedBot,
        ...ctaBackup,
      });
    }
    setEditingCTA(false);
    setCtaBackup(null);
  };

  const startEditPayment = () => {
    setPaymentBackup({
      payment_method_message: selectedBot?.payment_method_message,
      payment_method_button_text: selectedBot?.payment_method_button_text,
      pix_main_message: selectedBot?.pix_main_message,
      pix_status_button_text: selectedBot?.pix_status_button_text,
      pix_qrcode_button_text: selectedBot?.pix_qrcode_button_text,
      show_qrcode_in_chat: selectedBot?.show_qrcode_in_chat,
      pix_format_blockquote: selectedBot?.pix_format_blockquote,
    });
    setEditingPayment(true);
  };

  const savePayment = () => {
    setEditingPayment(false);
    setPaymentBackup(null);
  };

  const cancelPayment = () => {
    if (selectedBot && paymentBackup) {
      setSelectedBot({
        ...selectedBot,
        ...paymentBackup,
      });
    }
    setEditingPayment(false);
    setPaymentBackup(null);
  };

  const restorePaymentDefaults = () => {
    if (!selectedBot) return;

    if (!confirm('Tem certeza que deseja restaurar as configurações padrão do PIX?')) {
      return;
    }

    setSelectedBot({
      ...selectedBot,
      ...DEFAULT_PIX_CONFIG,
    });

    setToast({ message: 'Configurações do PIX restauradas!', type: 'success' });
  };

  const handleSavePlan = async (planData: PlanFormData) => {
    try {
      const getDurationDays = (durationType: string) => {
        switch (durationType) {
          case 'daily': return 1;
          case 'weekly': return 7;
          case 'monthly': return 30;
          case 'lifetime': return null;
          default: return 30;
        }
      };

      const planPayload = {
        name: planData.name,
        duration_type: planData.duration_type,
        duration_days: getDurationDays(planData.duration_type),
        price: planData.price,
        order_bump_enabled: planData.order_bump_enabled,
        order_bump_text: planData.order_bump_text || null,
        order_bump_accept_text: planData.order_bump_accept_text || null,
        order_bump_reject_text: planData.order_bump_reject_text || null,
        order_bump_name: planData.order_bump_name || null,
        order_bump_value: planData.order_bump_value || null,
        order_bump_media_url: planData.order_bump_media_url || null,
        order_bump_audio_url: planData.order_bump_audio_url || null,
        deliverables: planData.deliverables || null,
      };

      if (planData.id) {
        const { error } = await supabase
          .from('plans')
          .update(planPayload)
          .eq('id', planData.id);

        if (error) {
          console.error('Erro detalhado ao atualizar plano:', error);
          throw error;
        }
        setToast({ message: 'Plano atualizado com sucesso!', type: 'success' });
      } else {
        const { error } = await supabase
          .from('plans')
          .insert({
            ...planPayload,
            bot_id: selectedBotId,
          });

        if (error) {
          console.error('Erro detalhado ao criar plano:', error);
          throw error;
        }
        setToast({ message: 'Plano criado com sucesso!', type: 'success' });
      }

      setShowPlanModal(false);
      setEditingPlan(null);
      loadBotData(selectedBotId);
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      const errorMessage = err?.message || 'Erro desconhecido ao salvar plano';
      setToast({ message: `Erro: ${errorMessage}`, type: 'error' });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setToast({ message: 'Plano excluído com sucesso!', type: 'success' });
      loadBotData(selectedBotId);
    } catch (err) {
      console.error('Erro ao excluir plano:', err);
      setToast({ message: 'Erro ao excluir plano', type: 'error' });
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan as any);
    setShowPlanModal(true);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    setShowPlanModal(true);
  };

  const handleSavePackage = async (packageData: PackageFormData) => {
    try {
      if (!selectedBotId) return;

      const packagePayload = {
        bot_id: selectedBotId,
        name: packageData.name,
        value: parseFloat(packageData.value),
        deliverables: packageData.deliverables,
        order_bump_enabled: packageData.order_bump_enabled,
        order_bump_text: packageData.order_bump_text || null,
        order_bump_accept_text: packageData.order_bump_accept_text || 'Aceitar',
        order_bump_reject_text: packageData.order_bump_reject_text || 'Recusar',
        order_bump_value: packageData.order_bump_value ? parseFloat(packageData.order_bump_value) : null,
        order_bump_media_url: packageData.order_bump_media_url || null,
        order_bump_audio_url: packageData.order_bump_audio_url || null,
      };

      if (packageData.id) {
        const { error } = await supabase
          .from('packages')
          .update(packagePayload)
          .eq('id', packageData.id);

        if (error) throw error;
        setToast({ message: 'Pacote atualizado com sucesso!', type: 'success' });
      } else {
        const { error } = await supabase
          .from('packages')
          .insert([packagePayload]);

        if (error) throw error;
        setToast({ message: 'Pacote criado com sucesso!', type: 'success' });
      }

      loadBotData(selectedBotId);
    } catch (err) {
      console.error('Erro ao salvar pacote:', err);
      setToast({ message: 'Erro ao salvar pacote', type: 'error' });
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      setToast({ message: 'Pacote excluído com sucesso!', type: 'success' });
      loadBotData(selectedBotId);
    } catch (err) {
      console.error('Erro ao excluir pacote:', err);
      setToast({ message: 'Erro ao excluir pacote', type: 'error' });
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage({
      id: pkg.id,
      name: pkg.name,
      value: pkg.value.toString(),
      deliverables: pkg.deliverables,
      order_bump_enabled: pkg.order_bump_enabled,
      order_bump_text: '',
      order_bump_accept_text: 'Aceitar',
      order_bump_reject_text: 'Recusar',
      order_bump_value: pkg.order_bump_value?.toString() || '',
      order_bump_media_url: '',
      order_bump_audio_url: '',
    });
    setShowPackageModal(true);
  };

  const handleAddPackage = () => {
    setEditingPackage(null);
    setShowPackageModal(true);
  };

  const handleSaveButton = async () => {
    if (!selectedBot || !buttonText.trim() || !buttonUrl.trim()) {
      setToast({ message: 'Preencha todos os campos', type: 'error' });
      return;
    }

    try {
      const newButton = {
        bot_id: selectedBot.id,
        text: buttonText.trim(),
        url: buttonUrl.trim(),
        order_position: customButtons.length,
      };

      const { error } = await supabase
        .from('custom_buttons')
        .insert([newButton]);

      if (error) throw error;

      setToast({ message: 'Botão salvo com sucesso!', type: 'success' });
      setButtonText('');
      setButtonUrl('');
      loadBotData(selectedBotId);
    } catch (err) {
      console.error('Erro ao salvar botão:', err);
      setToast({ message: 'Erro ao salvar botão', type: 'error' });
    }
  };

  const handleDeleteButton = async (buttonId: string) => {
    try {
      const { error } = await supabase
        .from('custom_buttons')
        .delete()
        .eq('id', buttonId);

      if (error) throw error;

      setToast({ message: 'Botão excluído com sucesso!', type: 'success' });
      loadBotData(selectedBotId);
    } catch (err) {
      console.error('Erro ao excluir botão:', err);
      setToast({ message: 'Erro ao excluir botão', type: 'error' });
    }
  };

  const handleCancelButtonEdit = () => {
    setEditingButtons(false);
    setButtonText('');
    setButtonUrl('');
    setEditingButtonId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Você ainda não tem bots cadastrados</p>
        <button
          onClick={() => navigate('/bots/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Criar Primeiro Bot
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bots')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Bot</h1>
            <p className="text-gray-600 mt-1">Configure todos os detalhes do seu bot</p>
          </div>
        </div>
      </div>

      {/* Seletor de Bot */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione o Bot para Editar
        </label>
        <select
          value={selectedBotId}
          onChange={(e) => setSelectedBotId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>
              @{bot.bot_username} - {bot.bot_name}
            </option>
          ))}
        </select>
      </div>

      {selectedBot && (
        <>
          {/* Configurações do Bot */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bot: {selectedBot.bot_username.toUpperCase()} ID: {selectedBot.id.slice(0, 8).toUpperCase()}
            </h2>

            <h3 className="text-lg font-medium text-gray-800 mb-4">Configurações do Bot</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username:
                </label>
                <input
                  type="text"
                  value={selectedBot.bot_username}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token:
                </label>
                <input
                  type="text"
                  value={selectedBot.bot_token}
                  onChange={(e) => setSelectedBot({ ...selectedBot, bot_token: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem Inicial:
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Variáveis disponíveis: {'{profile_name}'}, {'{country}'}, {'{state}'}, {'{city}'}
                </p>
                <textarea
                  value={selectedBot.welcome_message}
                  onChange={(e) => setSelectedBot({ ...selectedBot, welcome_message: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Digite sua mensagem de boas-vindas..."
                />
                <p className="text-xs text-gray-500 mt-1">{selectedBot.welcome_message.length}/4096</p>

                {/* Preview em tempo real */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {selectedBot.welcome_message.replace(/\{profile_name\}/g, 'João') || 'Sua mensagem aparecerá aqui...'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Configuração de Grupos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Configuração de Grupos</h3>
            <GroupConfigurationGuide
              vipGroupId={selectedBot.vip_group_id}
              registryGroupId={selectedBot.registry_channel_id}
              onVipChange={(value) => setSelectedBot({ ...selectedBot, vip_group_id: value })}
              onRegistryChange={(value) => setSelectedBot({ ...selectedBot, registry_channel_id: value })}
            />
          </div>

          {/* Suporte Bot */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Suporte Bot</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username ou Link do Suporte:
            </label>
            <input
              type="text"
              value={selectedBot.support_bot_link || ''}
              onChange={(e) => setSelectedBot({ ...selectedBot, support_bot_link: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="@seusuporte ou https://t.me/seusuporte"
            />
          </div>

          {/* Planos Assinaturas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Planos Assinaturas</h3>
                <p className="text-sm text-gray-500 mt-1">Configure os planos de assinatura do seu bot</p>
              </div>
              <div className="flex gap-2">
                {plans.length > 0 && (
                  <button
                    onClick={() => setPlansExpanded(!plansExpanded)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                    title={plansExpanded ? 'Colapsar' : 'Expandir'}
                  >
                    <Edit2 className="w-4 h-4" />
                    {plansExpanded ? 'Colapsar' : 'Expandir'}
                  </button>
                )}
                <button
                  onClick={handleAddPlan}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                  title="Adicionar Plano"
                >
                  <Plus className="w-4 h-4" />
                  Novo Plano
                </button>
              </div>
            </div>

            {plans.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500">Nenhum plano cadastrado</p>
              </div>
            ) : plansExpanded ? (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="w-6 h-6 text-blue-600" />
                          <span className="text-xl font-bold text-gray-900">{plan.name}</span>
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold uppercase shadow-sm">
                            {plan.duration_type === 'daily' && 'Diário'}
                            {plan.duration_type === 'weekly' && 'Semanal'}
                            {plan.duration_type === 'monthly' && 'Mensal'}
                            {plan.duration_type === 'lifetime' && 'Vitalício'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm text-gray-600 font-medium">Valor:</span>
                            <span className="text-2xl font-bold text-green-600">
                              R$ {plan.price.toFixed(2)}
                            </span>
                          </div>
                          {plan.order_bump_enabled && plan.order_bump_value && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <span className="text-xs font-semibold text-yellow-700">⚡ ORDER BUMP</span>
                              <span className="text-sm font-bold text-yellow-800">
                                + R$ {plan.order_bump_value.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        {plan.deliverables && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            📦 {plan.deliverables}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200">
                  <span>Nome do Plano</span>
                  <span>Periodicidade</span>
                  <span>Valor (R$)</span>
                  <span>Order Bump</span>
                  <span className="text-right">Ações</span>
                </div>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="grid grid-cols-5 gap-4 px-5 py-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900 truncate">{plan.name}</span>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium uppercase self-start">
                      {plan.duration_type === 'daily' && 'Diário'}
                      {plan.duration_type === 'weekly' && 'Semanal'}
                      {plan.duration_type === 'monthly' && 'Mensal'}
                      {plan.duration_type === 'lifetime' && 'Vitalício'}
                    </span>
                    <span className="text-base font-bold text-green-600">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-sm font-medium">
                      {plan.order_bump_enabled ? (
                        <span className="text-yellow-700">✅ Ativo</span>
                      ) : (
                        <span className="text-gray-400">Desativado</span>
                      )}
                    </span>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planos Pacotes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Planos Pacotes</h3>
                <p className="text-sm text-gray-500 mt-1">Configure os pacotes de compra única do seu bot</p>
              </div>
              <div className="flex gap-2">
                {packages.length > 0 && (
                  <button
                    onClick={() => setPackagesExpanded(!packagesExpanded)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                    title={packagesExpanded ? 'Colapsar' : 'Expandir'}
                  >
                    <Edit2 className="w-4 h-4" />
                    {packagesExpanded ? 'Colapsar' : 'Expandir'}
                  </button>
                )}
                <button
                  onClick={handleAddPackage}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                  title="Adicionar Pacote"
                >
                  <Plus className="w-4 h-4" />
                  Novo Pacote
                </button>
              </div>
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500">Nenhum pacote cadastrado</p>
              </div>
            ) : packagesExpanded ? (
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="w-6 h-6 text-blue-600" />
                          <span className="text-xl font-bold text-gray-900">{pkg.name}</span>
                          <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-xs font-semibold uppercase shadow-sm">
                            Compra Única
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm text-gray-600 font-medium">Valor:</span>
                            <span className="text-2xl font-bold text-green-600">
                              R$ {pkg.value.toFixed(2)}
                            </span>
                          </div>
                          {pkg.order_bump_enabled && pkg.order_bump_value && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <span className="text-xs font-semibold text-yellow-700">⚡ ORDER BUMP</span>
                              <span className="text-sm font-bold text-yellow-800">
                                + R$ {pkg.order_bump_value.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          🔗 {pkg.deliverables}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditPackage(pkg)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200">
                  <span>Nome do Pacote</span>
                  <span>Valor (R$)</span>
                  <span>Order Bump</span>
                  <span className="text-right">Ações</span>
                </div>
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="grid grid-cols-4 gap-4 px-5 py-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900 truncate">{pkg.name}</span>
                    </div>
                    <span className="text-base font-bold text-green-600">R$ {pkg.value.toFixed(2)}</span>
                    <span className="text-sm font-medium">
                      {pkg.order_bump_enabled ? (
                        <span className="text-yellow-700">✅ Ativo</span>
                      ) : (
                        <span className="text-gray-400">Desativado</span>
                      )}
                    </span>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões Personalizados */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Botões Personalizados</h3>
              {!editingButtons && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingButtons(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingButtons(true);
                      setButtonText('');
                      setButtonUrl('');
                      setEditingButtonId(null);
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {!editingButtons ? (
              customButtons.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">Nenhum botão personalizado cadastrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customButtons.map((button) => (
                    <div
                      key={button.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{button.text}</p>
                        <p className="text-sm text-gray-500 truncate">{button.url}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Texto do Botão"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link
                    </label>
                    <input
                      type="url"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://exemplo.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {customButtons.map((button) => (
                    <div
                      key={button.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{button.text}</p>
                        <p className="text-sm text-gray-500 truncate">{button.url}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteButton(button.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleCancelButtonEdit}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveButton}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Check className="w-5 h-5 inline mr-2" />
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Chamada para Ação CTA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Botão de Chamada para Ação CTA</h3>
              {!editingCTA && (
                <button
                  onClick={startEditCTA}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {!editingCTA ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p>Status do botão CTA: <span className={selectedBot.cta_enabled ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {selectedBot.cta_enabled ? 'Ativo' : 'Inativo'}
                </span></p>
                {selectedBot.cta_enabled && (
                  <p>Texto do botão: <span className="font-medium text-gray-900">{selectedBot.cta_button_text || 'Não configurado'}</span></p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Ativar Botão CTA:
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBot.cta_enabled || false}
                      onChange={(e) => setSelectedBot({ ...selectedBot, cta_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {selectedBot.cta_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem que será enviada com o botão de chamada para ação (CTA):
                      </label>
                      <textarea
                        value={selectedBot.cta_text || ''}
                        onChange={(e) => setSelectedBot({ ...selectedBot, cta_text: e.target.value })}
                        rows={5}
                        maxLength={500}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
                        placeholder="Exemplo:&#10;🔥 +237 pessoas já aproveitaram hoje!&#10;&#10;Tudo pra você aproveitar depois de um dia cansativo! 👇"
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">{(selectedBot.cta_text || '').length}/500</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto do botão de chamada de ação (CTA):
                      </label>
                      <input
                        type="text"
                        value={selectedBot.cta_button_text || ''}
                        onChange={(e) => setSelectedBot({ ...selectedBot, cta_button_text: e.target.value })}
                        maxLength={500}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        placeholder="CLIQUE AQUI E GARENTE SEU ACESSO"
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">{(selectedBot.cta_button_text || '').length}/500</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem que aparece após clicar no botão de chamada para ação, junto com a exibição dos planos:
                      </label>
                      <textarea
                        value={selectedBot.cta_after_click_message || ''}
                        onChange={(e) => setSelectedBot({ ...selectedBot, cta_after_click_message: e.target.value })}
                        rows={5}
                        maxLength={500}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
                        placeholder="Exemplo:&#10;🎁 Sua vaga com desconto está confirmada!&#10;&#10;Agora, escolha seu nível de acesso todos vitalícios!&#10;&#10;⭐ Acesso Vitalício (R$ 5,90)"
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">{(selectedBot.cta_after_click_message || '').length}/500</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ação do Botão:
                      </label>
                      <select
                        value={selectedBot.cta_button_action || 'show_plans'}
                        onChange={(e) => setSelectedBot({ ...selectedBot, cta_button_action: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      >
                        <option value="show_plans">Mostrar Planos</option>
                        <option value="show_plans_and_buttons">Mostrar Planos e Botões</option>
                        <option value="show_buttons">Mostrar Botões</option>
                      </select>
                    </div>

                    {/* Preview em tempo real do CTA */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-3 uppercase tracking-wide">Preview do Telegram:</p>
                      <div className="bg-white rounded-lg p-4 shadow-md space-y-3 max-w-sm">
                        {selectedBot.cta_text && (
                          <div className="text-sm text-gray-800 whitespace-pre-wrap mb-3 leading-relaxed">
                            {selectedBot.cta_text.replace(/\{profile_name\}/g, 'João')}
                          </div>
                        )}
                        {selectedBot.cta_button_text && (
                          <button className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            {selectedBot.cta_button_text}
                          </button>
                        )}
                        {selectedBot.cta_after_click_message && (
                          <div className="mt-4 pt-4 border-t-2 border-gray-200">
                            <p className="text-xs text-gray-500 mb-2 font-medium">↓ Após clicar:</p>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {selectedBot.cta_after_click_message.replace(/\{profile_name\}/g, 'João')}
                            </div>
                          </div>
                        )}
                        {!selectedBot.cta_text && !selectedBot.cta_button_text && (
                          <p className="text-sm text-gray-400 italic text-center py-4">
                            Configure o CTA para ver o preview aqui
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja restaurar as configurações padrão do CTA?')) {
                        setSelectedBot({
                          ...selectedBot,
                          cta_enabled: false,
                          cta_text: '',
                          cta_button_text: '',
                          cta_after_click_message: '',
                          cta_button_action: 'show_plans',
                        });
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={cancelCTA}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={saveCTA}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Personalização do Pagamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Personalização do Pagamento</h3>
              {!editingPayment && (
                <button
                  onClick={startEditPayment}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {!editingPayment ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p>Exibição do QR Code (Pix): <span className="font-medium text-gray-900">
                  {selectedBot.show_qrcode_in_chat ? 'Mostrar QR Code diretamente no chat' : 'Oculto'}
                </span></p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-2">
                  <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                    Pix
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Seleção de Método:
                  </label>
                  <textarea
                    value={selectedBot.payment_method_message || ''}
                    onChange={(e) => setSelectedBot({ ...selectedBot, payment_method_message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto do Botão Pix:
                  </label>
                  <input
                    type="text"
                    value={selectedBot.payment_method_button_text || ''}
                    onChange={(e) => setSelectedBot({ ...selectedBot, payment_method_button_text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Método Pix</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagem do QR Code:
                      </label>
                      <select
                        value={selectedBot.show_qrcode_in_chat ? 'show' : 'hide'}
                        onChange={(e) => setSelectedBot({ ...selectedBot, show_qrcode_in_chat: e.target.value === 'show' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="show">Mostrar QR Code diretamente no chat</option>
                        <option value="hide">Ocultar QR Code</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Formato do Código PIX:
                      </label>
                      <select
                        value={selectedBot.pix_format_blockquote ? 'blockquote' : 'code'}
                        onChange={(e) => setSelectedBot({ ...selectedBot, pix_format_blockquote: e.target.value === 'blockquote' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="blockquote">Blockquote</option>
                        <option value="code">Code</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem Principal:
                      </label>
                      <textarea
                        value={selectedBot.pix_main_message || ''}
                        onChange={(e) => setSelectedBot({ ...selectedBot, pix_main_message: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto do Botão de Status:
                      </label>
                      <input
                        type="text"
                        value={selectedBot.pix_status_button_text || ''}
                        onChange={(e) => setSelectedBot({ ...selectedBot, pix_status_button_text: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Preview em tempo real do PIX */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                      <p className="text-xs font-semibold text-green-900 mb-3 uppercase tracking-wide">Preview da Mensagem PIX:</p>
                      <div className="bg-white rounded-lg p-4 shadow-md space-y-3 max-w-sm">
                        {selectedBot.pix_main_message && (
                          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {selectedBot.pix_main_message
                              .replace(/\{plan_name\}/g, 'VIP Mensal')
                              .replace(/\{plan_value\}/g, 'R$ 29,90')
                              .replace(/\{plan_duration\}/g, '30 dias')
                              .replace(/\{payment_pointer\}/g, '00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540529.905802BR5913Nome Exemplo6009SAO PAULO62070503***6304XXXX')}
                          </div>
                        )}
                        {selectedBot.pix_status_button_text && (
                          <button className="w-full bg-green-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                            {selectedBot.pix_status_button_text}
                          </button>
                        )}
                        {selectedBot.pix_qrcode_button_text && (
                          <button className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            {selectedBot.pix_qrcode_button_text}
                          </button>
                        )}
                        {!selectedBot.pix_main_message && (
                          <p className="text-sm text-gray-400 italic text-center py-4">
                            Configure a mensagem PIX para ver o preview
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-between pt-4 border-t">
                  <button
                    onClick={restorePaymentDefaults}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar Padrão
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={cancelPayment}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={savePayment}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé com aviso */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Os bots que apresentarem inatividades, foram deletados do Telegram ou tiveram o token alterado sendo excluídos automaticamente.
              Se tiver algum problema, não hesite em chamar nosso suporte! <span className="text-blue-600">@DINOBOT_Suporte 🤝</span>
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleDeleteBot}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Excluir Bot
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </>
      )}

      {/* Modal de Planos */}
      <PlanModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        plan={editingPlan}
        botId={selectedBotId}
      />

      {/* Modal de Pacotes */}
      <PackageModal
        isOpen={showPackageModal}
        onClose={() => {
          setShowPackageModal(false);
          setEditingPackage(null);
        }}
        onSave={handleSavePackage}
        initialData={editingPackage || undefined}
      />
    </div>
  );
}
