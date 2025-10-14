import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export interface PackageFormData {
  id?: string;
  name: string;
  value: string;
  deliverables: string;
  order_bump_enabled: boolean;
  order_bump_text: string;
  order_bump_accept_text: string;
  order_bump_reject_text: string;
  order_bump_value: string;
  order_bump_media_url: string;
  order_bump_audio_url: string;
}

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (packageData: PackageFormData) => void;
  initialData?: PackageFormData;
}

export default function PackageModal({ isOpen, onClose, onSave, initialData }: PackageModalProps) {
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    value: '',
    deliverables: '',
    order_bump_enabled: false,
    order_bump_text: '',
    order_bump_accept_text: 'Aceitar',
    order_bump_reject_text: 'Recusar',
    order_bump_value: '',
    order_bump_media_url: '',
    order_bump_audio_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        value: '',
        deliverables: '',
        order_bump_enabled: false,
        order_bump_text: '',
        order_bump_accept_text: 'Aceitar',
        order_bump_reject_text: 'Recusar',
        order_bump_value: '',
        order_bump_media_url: '',
        order_bump_audio_url: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do pacote é obrigatório';
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Valor deve ser maior que zero';
    }

    if (!formData.deliverables.trim()) {
      newErrors.deliverables = 'Link de entregável é obrigatório';
    }

    if (formData.order_bump_enabled) {
      if (!formData.order_bump_text.trim()) {
        newErrors.order_bump_text = 'Texto do order bump é obrigatório quando ativado';
      }
      if (!formData.order_bump_value || parseFloat(formData.order_bump_value) <= 0) {
        newErrors.order_bump_value = 'Valor do order bump deve ser maior que zero';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              {initialData ? 'Editar Pacote' : 'Novo Pacote'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Pacote *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              placeholder="Ex: Pacote Premium Completo"
            />
            {errors.name && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className={`w-full px-4 py-3 border ${errors.value ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              placeholder="Ex: 19.90"
            />
            {errors.value && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.value}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Link de Entregáveis *
            </label>
            <textarea
              value={formData.deliverables}
              onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 border ${errors.deliverables ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
              placeholder="Aqui estarão os entregáveis que seus clientes receberão após o pagamento!&#10;&#10;🔗 Exemplo:&#10;⭐ Link de acesso: https://t.me/+4bcdEFG12345"
            />
            {errors.deliverables && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.deliverables}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Order Bump</h4>
                <p className="text-sm text-gray-500">Ofereça um produto adicional durante a compra</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.order_bump_enabled}
                  onChange={(e) => setFormData({ ...formData, order_bump_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.order_bump_enabled && (
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Texto do Order Bump *
                  </label>
                  <textarea
                    value={formData.order_bump_text}
                    onChange={(e) => setFormData({ ...formData, order_bump_text: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-3 border ${errors.order_bump_text ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
                    placeholder="Descreva a oferta adicional..."
                  />
                  {errors.order_bump_text && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.order_bump_text}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Texto Botão Aceitar
                    </label>
                    <input
                      type="text"
                      value={formData.order_bump_accept_text}
                      onChange={(e) => setFormData({ ...formData, order_bump_accept_text: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Texto Botão Recusar
                    </label>
                    <input
                      type="text"
                      value={formData.order_bump_reject_text}
                      onChange={(e) => setFormData({ ...formData, order_bump_reject_text: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valor do Order Bump (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.order_bump_value}
                    onChange={(e) => setFormData({ ...formData, order_bump_value: e.target.value })}
                    className={`w-full px-4 py-3 border ${errors.order_bump_value ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Ex: 9.90"
                  />
                  {errors.order_bump_value && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.order_bump_value}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL da Mídia (PNG, JPEG, JPG, MP4)
                  </label>
                  <input
                    type="url"
                    value={formData.order_bump_media_url}
                    onChange={(e) => setFormData({ ...formData, order_bump_media_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://exemplo.com/imagem.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL do Áudio (OGG)
                  </label>
                  <input
                    type="url"
                    value={formData.order_bump_audio_url}
                    onChange={(e) => setFormData({ ...formData, order_bump_audio_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://exemplo.com/audio.ogg"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              {initialData ? 'Atualizar Pacote' : 'Criar Pacote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
