import { Bot, Settings, Users, Trash2, BarChart3, Power, Link, CreditCard, Terminal } from 'lucide-react';
import { useState } from 'react';

interface BotCardProps {
  bot: {
    id: string;
    bot_name: string;
    bot_username: string;
    is_active: boolean;
    subscriptions_count?: number;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onViewPlans: (id: string) => void;
  onViewStats: (id: string) => void;
  onWebhook: (id: string) => void;
  onCommands: (id: string) => void;
  onPayment: (id: string) => void;
}

export default function BotCard({
  bot,
  onEdit,
  onDelete,
  onToggleActive,
  onViewPlans,
  onViewStats,
  onWebhook,
  onCommands,
  onPayment,
}: BotCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir @${bot.bot_username}?`)) {
      return;
    }
    setIsDeleting(true);
    await onDelete(bot.id);
    setIsDeleting(false);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    await onToggleActive(bot.id, !bot.is_active);
    setIsToggling(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${bot.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Bot className={`w-6 h-6 ${bot.is_active ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{bot.bot_name}</h3>
            <p className="text-sm text-gray-500">@{bot.bot_username}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`p-2 rounded-lg transition-colors ${
            bot.is_active
              ? 'bg-green-100 text-green-600 hover:bg-green-200'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          } disabled:opacity-50`}
          title={bot.is_active ? 'Ativo' : 'Inativo'}
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{bot.subscriptions_count || 0} assinaturas ativas</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(bot.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
          <button
            onClick={() => onViewPlans(bot.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Planos
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWebhook(bot.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Link className="w-4 h-4" />
            Webhook
          </button>
          <button
            onClick={() => onCommands(bot.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Terminal className="w-4 h-4" />
            Comandos
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPayment(bot.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Pagamento
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewStats(bot.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            title="Estatísticas"
          >
            <BarChart3 className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
