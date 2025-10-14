import { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: PlanFormData) => void;
  plan?: PlanFormData | null;
  botId: string;
}

export interface PlanFormData {
  id?: string;
  name: string;
  duration_type: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  price: number;
  order_bump_enabled: boolean;
  order_bump_text?: string;
  order_bump_accept_text?: string;
  order_bump_reject_text?: string;
  order_bump_name?: string;
  order_bump_value?: number;
  order_bump_media_url?: string;
  order_bump_audio_url?: string;
  deliverables?: string;
}

const DURATION_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  lifetime: 'Vitalício',
};

export default function PlanModal({ isOpen, onClose, onSave, plan, botId }: PlanModalProps) {
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    duration_type: 'monthly',
    price: 0,
    order_bump_enabled: false,
    order_bump_text: '',
    order_bump_accept_text: 'Aceitar',
    order_bump_reject_text: 'Recusar',
    order_bump_name: '',
    order_bump_value: 0,
    order_bump_media_url: '',
    order_bump_audio_url: '',
    deliverables: '',
  });

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData({
        name: '',
        duration_type: 'monthly',
        price: 0,
        order_bump_enabled: false,
        order_bump_text: '',
        order_bump_accept_text: 'Aceitar',
        order_bump_reject_text: 'Recusar',
        order_bump_name: '',
        order_bump_value: 0,
        order_bump_media_url: '',
        order_bump_audio_url: '',
        deliverables: '',
      });
    }
  }, [plan, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {plan ? 'Editar Plano' : 'Adicionar Plano'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Planos Assinaturas</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do plano"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
                  <select
                    value={formData.duration_type}
                    onChange={(e) => setFormData({ ...formData, duration_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="lifetime">Vitalício</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Valor do plano"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-medium text-gray-700">Ativar Order Bump:</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.order_bump_enabled}
                    onChange={(e) => setFormData({ ...formData, order_bump_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.order_bump_enabled && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto explicativo do Order Bump:
                    </label>
                    <textarea
                      value={formData.order_bump_text || ''}
                      onChange={(e) => setFormData({ ...formData, order_bump_text: e.target.value })}
                      rows={4}
                      maxLength={4096}
                      placeholder="Digite o texto explicativo do Order Bump aqui..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        Variáveis disponíveis: {'{selected_plan_name}'}, {'{order_bump_name}'}, {'{order_bump_value}'}, {'{total_value}'}
                      </p>
                      <span className="text-xs text-gray-500">{(formData.order_bump_text || '').length}/4096</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto Botão Aceitar:
                      </label>
                      <input
                        type="text"
                        value={formData.order_bump_accept_text || ''}
                        onChange={(e) => setFormData({ ...formData, order_bump_accept_text: e.target.value })}
                        placeholder="Aceitar"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto Botão Recusar:
                      </label>
                      <input
                        type="text"
                        value={formData.order_bump_reject_text || ''}
                        onChange={(e) => setFormData({ ...formData, order_bump_reject_text: e.target.value })}
                        placeholder="Recusar"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mídia Order Bump (PNG, JPEG, JPG, MP4):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.order_bump_media_url || ''}
                          onChange={(e) => setFormData({ ...formData, order_bump_media_url: e.target.value })}
                          placeholder="URL da mídia"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Escolher Mídia
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Audio Order Bump (OGG):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.order_bump_audio_url || ''}
                          onChange={(e) => setFormData({ ...formData, order_bump_audio_url: e.target.value })}
                          placeholder="URL do áudio"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Escolher Áudio
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Order Bump:
                      </label>
                      <input
                        type="text"
                        value={formData.order_bump_name || ''}
                        onChange={(e) => setFormData({ ...formData, order_bump_name: e.target.value })}
                        placeholder="Ex: Pacote Premium Completo"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor (R$):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.order_bump_value || 0}
                        onChange={(e) => setFormData({ ...formData, order_bump_value: parseFloat(e.target.value) || 0 })}
                        placeholder="Ex: 19.90"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entregáveis:
                    </label>
                    <textarea
                      value={formData.deliverables || ''}
                      onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                      rows={4}
                      maxLength={2500}
                      placeholder="Aqui estarão os entregáveis que seus clientes receberão após o pagamento!&#10;&#10;📌 Exemplo:&#10;⭐ Link de acesso: https://t.me/+abcdEFG12345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-gray-500">{(formData.deliverables || '').length}/2500</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
