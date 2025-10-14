import { z } from 'zod';

export const BotSchema = z.object({
  bot_token: z.string().min(40, 'Invalid bot token format'),
  bot_username: z.string().min(3, 'Username too short'),
  bot_name: z.string().min(1, 'Name is required'),
  welcome_message: z.string().min(10, 'Welcome message too short'),
  media_url: z.string().url().optional().or(z.literal('')),
  media_type: z.enum(['image', 'video']).nullable(),
  vip_group_id: z.string().min(1, 'VIP Group ID is required'),
  registry_channel_id: z.string().min(1, 'Registry Channel ID is required'),
  vip_group_link: z.string().url('Invalid group link').optional().or(z.literal('')),
});

export const PlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(50, 'Name too long'),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Price must be greater than 0'
  ),
  duration_days: z.number().int().min(1, 'Duration must be at least 1 day'),
  description: z.string().optional(),
});

export const PaymentConfigSchema = z.object({
  payment_gateway: z.enum(['pushinpay', 'syncpay', 'mercadopago', 'asaas']),
  payment_public_token: z.string().min(10, 'Public token is required'),
  payment_private_token: z.string().min(10, 'Private token is required'),
  payment_webhook_secret: z.string().optional(),
  payment_enabled: z.boolean(),
});

export const TelegramUserSchema = z.object({
  telegram_user_id: z.string().min(1),
  telegram_name: z.string().min(1),
  telegram_username: z.string().optional(),
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}
