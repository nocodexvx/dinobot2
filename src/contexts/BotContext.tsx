import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Bot {
  id: string;
  bot_name: string;
  bot_username: string;
  bot_token: string;
  welcome_message: string;
  vip_group_id: string;
  registry_channel_id: string;
  payment_enabled: boolean;
  created_at: string;
}

interface BotContextType {
  selectedBot: Bot | null;
  bots: Bot[];
  loading: boolean;
  selectBot: (botId: string) => void;
  refreshBots: () => Promise<void>;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export function BotProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBots = async () => {
    if (!user) {
      setBots([]);
      setSelectedBot(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBots(data || []);

      const savedBotId = localStorage.getItem('selectedBotId');
      if (savedBotId && data?.find(b => b.id === savedBotId)) {
        setSelectedBot(data.find(b => b.id === savedBotId) || data[0] || null);
      } else if (data && data.length > 0) {
        setSelectedBot(data[0]);
        localStorage.setItem('selectedBotId', data[0].id);
      }
    } catch (err) {
      console.error('Error loading bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectBot = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (bot) {
      setSelectedBot(bot);
      localStorage.setItem('selectedBotId', botId);
    }
  };

  const refreshBots = async () => {
    await loadBots();
  };

  useEffect(() => {
    loadBots();
  }, [user]);

  return (
    <BotContext.Provider value={{ selectedBot, bots, loading, selectBot, refreshBots }}>
      {children}
    </BotContext.Provider>
  );
}

export function useBot() {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
}
