import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase, Bot } from '../lib/supabase';
import { createTelegramService } from '../lib/telegram-service';
import Toast from '../components/Toast';

interface BotCommand {
  command: string;
  description: string;
}

const DEFAULT_COMMANDS: BotCommand[] = [
  { command: 'start', description: 'Iniciar' },
  { command: 'suporte', description: 'Suporte' },
  { command: 'status', description: 'Consulte sua Assinatura' },
];

export default function BotCommands() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<Bot | null>(null);
  const [commands, setCommands] = useState<BotCommand[]>(DEFAULT_COMMANDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (botId) {
      fetchBot();
      fetchCurrentCommands();
    }
  }, [botId]);

  const fetchBot = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setToast({ message: 'Bot não encontrado', type: 'error' });
        navigate('/bots');
        return;
      }

      setBot(data);
    } catch (error) {
      console.error('Error fetching bot:', error);
      setToast({ message: 'Erro ao carregar bot', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCommands = async () => {
    try {
      const { data } = await supabase
        .from('bots')
        .select('bot_token')
        .eq('id', botId)
        .maybeSingle();

      if (data?.bot_token) {
        const telegram = createTelegramService(data.bot_token);
        const response = await telegram.makeRequest('getMyCommands');

        if (response.ok && response.result && Array.isArray(response.result) && response.result.length > 0) {
          setCommands(response.result);
        }
      }
    } catch (error) {
      console.error('Error fetching commands:', error);
    }
  };

  const handleAddCommand = () => {
    setCommands([...commands, { command: '', description: '' }]);
  };

  const handleRemoveCommand = (index: number) => {
    setCommands(commands.filter((_, i) => i !== index));
  };

  const handleCommandChange = (index: number, field: 'command' | 'description', value: string) => {
    const newCommands = [...commands];
    newCommands[index][field] = value;
    setCommands(newCommands);
  };

  const handleSave = async () => {
    if (!bot) return;

    // Validações
    const emptyCommands = commands.filter(c => !c.command || !c.description);
    if (emptyCommands.length > 0) {
      setToast({ message: 'Todos os comandos devem ter nome e descrição', type: 'error' });
      return;
    }

    // Validar formato do comando (apenas letras minúsculas e números)
    const invalidCommands = commands.filter(c => !/^[a-z0-9_]+$/.test(c.command));
    if (invalidCommands.length > 0) {
      setToast({
        message: 'Comandos devem conter apenas letras minúsculas, números e underscore',
        type: 'error'
      });
      return;
    }

    // Validar tamanho da descrição (máximo 256 caracteres)
    const longDescriptions = commands.filter(c => c.description.length > 256);
    if (longDescriptions.length > 0) {
      setToast({ message: 'Descrições devem ter no máximo 256 caracteres', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const telegram = createTelegramService(bot.bot_token);
      const response = await telegram.setMyCommands(commands);

      if (!response.ok) {
        throw new Error(response.description || 'Erro ao configurar comandos');
      }

      setToast({ message: 'Comandos configurados com sucesso!', type: 'success' });

      setTimeout(() => {
        navigate(`/bots/${botId}/webhook`);
      }, 1500);
    } catch (error: any) {
      console.error('Error setting commands:', error);
      setToast({
        message: error.message || 'Erro ao configurar comandos',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setCommands(DEFAULT_COMMANDS);
    setToast({ message: 'Comandos resetados para padrão', type: 'success' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bot) return null;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/bots')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comandos do Bot</h1>
            <p className="text-gray-600 mt-1">Configure o menu de comandos do {bot.bot_name}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sobre os comandos do Telegram:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Os comandos aparecerão no menu lateral do bot para os usuários</li>
              <li>Use apenas letras minúsculas, números e underscore (_)</li>
              <li>Não use / no início, ele será adicionado automaticamente</li>
              <li>Máximo de 100 comandos por bot</li>
              <li>Descrição máxima de 256 caracteres</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Comandos</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure os comandos que aparecerão no menu do bot
          </p>
        </div>

        <div className="p-6 space-y-4">
          {commands.map((command, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comando
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">/</span>
                    <input
                      type="text"
                      value={command.command}
                      onChange={(e) => handleCommandChange(index, 'command', e.target.value.toLowerCase())}
                      placeholder="start"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={command.description}
                    onChange={(e) => handleCommandChange(index, 'description', e.target.value)}
                    placeholder="Iniciar"
                    maxLength={256}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              {commands.length > 1 && (
                <button
                  onClick={() => handleRemoveCommand(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-7"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          {commands.length < 100 && (
            <button
              onClick={handleAddCommand}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Adicionar Comando</span>
            </button>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Resetar para Padrão
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'Salvando...' : 'Salvar Comandos'}</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Prévia do Menu</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          {commands.map((command, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm">
              <span className="text-blue-600 font-mono">/{command.command}</span>
              <span className="text-gray-600">{command.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
