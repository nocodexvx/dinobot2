import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Bot {
  id: string;
  user_id: string;
  bot_token: string;
  bot_username: string;
  bot_name: string;
  welcome_message: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  vip_group_id: string;
  vip_group_link: string | null;
  registry_channel_id: string;
  webhook_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  bot_id: string;
  name: string;
  description: string | null;
  duration_type: 'WEEKLY' | 'MONTHLY' | 'LIFETIME';
  duration_days: number | null;
  price: number;
  is_active: boolean;
  order_bump_enabled: boolean;
  order_bump_name: string | null;
  order_bump_price: number | null;
  order_bump_description: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  plan_id: string;
  bot_id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  start_date: string;
  end_date: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  payment_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  subscription_id: string | null;
  bot_id: string;
  telegram_user_id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  payment_method: string | null;
  payment_proof: string | null;
  created_at: string;
}
