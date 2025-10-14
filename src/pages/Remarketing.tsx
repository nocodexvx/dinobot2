import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Image, Video, Music, Clock, Percent, Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import { SkeletonCard } from '../components/SkeletonLoader';

interface Bot {
  id: string;
  bot_name: string;
  bot_token: string;
  registry_channel_id: string;
}

interface RemarketingMessage {
  id: string;
  bot_id: string;
  message_text: string;
  media_file_id?: string | null;
  media_type?: string | null;
  audio_file_id?: string | null;
  send_after_minutes: number;
  discount_percentage?: number | null;
  target_audience: string;
  enabled: boolean;
  created_at: string;
}

interface MediaGalleryItem {
  id: string;
  file_id: string;
  file_type: string;
  file_name?: string;
  thumbnail_file_id?: string;
  uploaded_at: string;
}

export default function Remarketing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedBotId = searchParams.get('bot');

  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<RemarketingMessage[]>([]);
  const [mediaGallery, setMediaGallery] = useState<MediaGalleryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  const [newMessage, setNewMessage] = useState({
    message_text: '',
    media_file_id: null as string | null,
    media_type: null as string | null,
    audio_file_id: null as string | null,
    send_after_minutes: 20,
    discount_percentage: null as number | null,
    target_audience: 'users_who_never_purchased',
    enabled: true
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      loadBots();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBotId && bots.length > 0) {
      const bot = bots.find(b => b.id === selectedBotId);
      if (bot) {
        setSelectedBot(bot);
        loadMessages(selectedBotId);
        loadMediaGallery(selectedBotId);
      }
    }
  }, [selectedBotId, bots]);

  const loadBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('id, bot_name, bot_token, registry_channel_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (err) {
      console.error('Error loading bots:', err);
      setToast({ message: 'Erro ao carregar bots', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (botId: string) => {
    try {
      const { data, error } = await supabase
        .from('remarketing_messages')
        .select('*')
        .eq('bot_id', botId)
        .order('send_after_minutes', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadMediaGallery = async (botId: string) => {
    try {
      const { data, error } = await supabase
        .from('media_gallery')
        .select('*')
        .eq('bot_id', botId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setMediaGallery(data || []);
    } catch (err) {
      console.error('Error loading media:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedBot) return;

    try {
      setUploading(true);

      const fileType = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'document';

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `https://api.telegram.org/bot${selectedBot.bot_token}/sendDocument`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      if (!data.ok) throw new Error(data.description);

      const fileId = data.result.document?.file_id ||
                     data.result.photo?.[data.result.photo.length - 1]?.file_id ||
                     data.result.video?.file_id ||
                     data.result.audio?.file_id;

      await supabase.from('media_gallery').insert({
        bot_id: selectedBot.id,
        file_id: fileId,
        file_type: fileType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        context_type: 'remarketing',
        registry_message_id: String(data.result.message_id)
      });

      loadMediaGallery(selectedBot.id);
      setToast({ message: 'Mídia enviada com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Error uploading file:', err);
      setToast({ message: 'Erro ao enviar mídia', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!selectedBot || !newMessage.message_text.trim()) {
      setToast({ message: 'Preencha o texto da mensagem', type: 'error' });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('remarketing_messages')
        .insert({
          bot_id: selectedBot.id,
          message_text: newMessage.message_text,
          media_file_id: newMessage.media_file_id,
          media_type: newMessage.media_type,
          audio_file_id: newMessage.audio_file_id,
          send_after_minutes: newMessage.send_after_minutes,
          discount_percentage: newMessage.discount_percentage,
          target_audience: newMessage.target_audience,
          enabled: newMessage.enabled
        });

      if (error) throw error;

      setToast({ message: 'Mensagem salva com sucesso!', type: 'success' });
      setShowNewMessageForm(false);
      setNewMessage({
        message_text: '',
        media_file_id: null,
        media_type: null,
        audio_file_id: null,
        send_after_minutes: 20,
        discount_percentage: null,
        target_audience: 'users_who_never_purchased',
        enabled: true
      });
      loadMessages(selectedBot.id);
    } catch (err) {
      console.error('Error saving message:', err);
      setToast({ message: 'Erro ao salvar mensagem', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const { error } = await supabase
        .from('remarketing_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setToast({ message: 'Mensagem excluída!', type: 'success' });
      if (selectedBot) loadMessages(selectedBot.id);
    } catch (err) {
      console.error('Error deleting message:', err);
      setToast({ message: 'Erro ao excluir mensagem', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <SkeletonCard />
      </div>
    );
  }

  if (!selectedBot) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Send className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecione um Bot</h2>
          <p className="text-gray-600">
            Escolha um bot para gerenciar mensagens de remarketing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Remarketing</h1>
          <p className="text-gray-600 mt-1">
            Bot: {selectedBot.bot_name}
          </p>
        </div>
        <button
          onClick={() => setShowNewMessageForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nova Mensagem
        </button>
      </div>

      {showNewMessageForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Nova Mensagem de Remarketing</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto da Mensagem
              </label>
              <textarea
                value={newMessage.message_text}
                onChange={(e) => setNewMessage({ ...newMessage, message_text: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua mensagem de remarketing..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Enviar Após (minutos)
                </label>
                <input
                  type="number"
                  value={newMessage.send_after_minutes}
                  onChange={(e) => setNewMessage({ ...newMessage, send_after_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="w-4 h-4 inline mr-1" />
                  Desconto (%)
                </label>
                <input
                  type="number"
                  value={newMessage.discount_percentage || ''}
                  onChange={(e) => setNewMessage({ ...newMessage, discount_percentage: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Público-Alvo
                </label>
                <select
                  value={newMessage.target_audience}
                  onChange={(e) => setNewMessage({ ...newMessage, target_audience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="users_who_never_purchased">Nunca compraram</option>
                  <option value="all_users">Todos os usuários</option>
                  <option value="expired_subscriptions">Assinaturas expiradas</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMediaGallery(!showMediaGallery)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Image className="w-5 h-5" />
                Escolher Mídia
              </button>

              <label className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 cursor-pointer">
                <Upload className="w-5 h-5" />
                {uploading ? 'Enviando...' : 'Upload Nova Mídia'}
                <input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {showMediaGallery && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Galeria de Mídias</h4>
                <div className="grid grid-cols-4 gap-4">
                  {mediaGallery.map((media) => (
                    <div
                      key={media.id}
                      onClick={() => {
                        setNewMessage({
                          ...newMessage,
                          media_file_id: media.file_id,
                          media_type: media.file_type
                        });
                        setShowMediaGallery(false);
                      }}
                      className="border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-500"
                    >
                      {media.file_type === 'image' && <Image className="w-full h-20 text-gray-400" />}
                      {media.file_type === 'video' && <Video className="w-full h-20 text-gray-400" />}
                      {media.file_type === 'audio' && <Music className="w-full h-20 text-gray-400" />}
                      <p className="text-xs text-gray-600 mt-1 truncate">{media.file_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewMessageForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMessage}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-gray-900 whitespace-pre-wrap">{message.message_text}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Após {message.send_after_minutes} min
                  </span>
                  {message.discount_percentage && (
                    <span className="flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      {message.discount_percentage}% desconto
                    </span>
                  )}
                  {message.media_file_id && (
                    <span className="flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      Com mídia
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteMessage(message.id)}
                className="text-red-600 hover:text-red-700 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
