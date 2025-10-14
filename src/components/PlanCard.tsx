import { DollarSign, Edit, Trash2, Power, Users } from 'lucide-react';
import { useState } from 'react';

interface PlanCardProps {
  plan: {
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
    subscriptions_count?: number;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export default function PlanCard({ plan, onEdit, onDelete, onToggleActive }: PlanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      return;
    }
    setIsDeleting(true);
    await onDelete(plan.id);
    setIsDeleting(false);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    await onToggleActive(plan.id, !plan.is_active);
    setIsToggling(false);
  };

  const getDurationLabel = () => {
    switch (plan.duration_type) {
      case 'WEEKLY':
        return `${plan.duration_days} days`;
      case 'MONTHLY':
        return `${plan.duration_days} days`;
      case 'LIFETIME':
        return 'Lifetime';
      default:
        return `${plan.duration_days} days`;
    }
  };

  const getDurationBadgeColor = () => {
    switch (plan.duration_type) {
      case 'WEEKLY':
        return 'bg-blue-100 text-blue-700';
      case 'MONTHLY':
        return 'bg-green-100 text-green-700';
      case 'LIFETIME':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium ${getDurationBadgeColor()}`}
            >
              {getDurationLabel()}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`p-2 rounded-lg transition-colors ml-3 ${
            plan.is_active
              ? 'bg-green-100 text-green-600 hover:bg-green-200'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          } disabled:opacity-50`}
          title={plan.is_active ? 'Active' : 'Inactive'}
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <DollarSign className="w-5 h-5" />
            <span className="text-2xl font-bold">R$ {plan.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{plan.subscriptions_count || 0} subs</span>
          </div>
        </div>

        {plan.order_bump_enabled && plan.order_bump_name && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-orange-800">
                Order Bump: {plan.order_bump_name}
              </span>
              <span className="text-xs font-bold text-orange-900">
                +R$ {plan.order_bump_price?.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(plan.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
