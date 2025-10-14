import type {
  TelegramApiResponse,
  SendMessageOptions,
  SendPhotoOptions,
  SendVideoOptions,
  AnswerCallbackQueryOptions,
  InlineKeyboardButton,
} from './telegram-types';

export class TelegramService {
  private baseUrl: string;

  constructor(private botToken: string) {
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async makeRequest<T = any>(
    method: string,
    data?: Record<string, any>
  ): Promise<TelegramApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return await response.json();
    } catch (error) {
      console.error(`Telegram API error (${method}):`, error);
      return {
        ok: false,
        description: 'Network error',
      };
    }
  }

  async sendMessage(options: SendMessageOptions) {
    return this.makeRequest('sendMessage', options);
  }

  async sendPhoto(options: SendPhotoOptions) {
    return this.makeRequest('sendPhoto', options);
  }

  async sendVideo(options: SendVideoOptions) {
    return this.makeRequest('sendVideo', options);
  }

  async answerCallbackQuery(options: AnswerCallbackQueryOptions) {
    return this.makeRequest('answerCallbackQuery', options);
  }

  async editMessageText(
    chatId: number,
    messageId: number,
    text: string,
    replyMarkup?: any
  ) {
    return this.makeRequest('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  }

  async getChatMember(chatId: number | string, userId: number) {
    return this.makeRequest('getChatMember', {
      chat_id: chatId,
      user_id: userId,
    });
  }

  async createChatInviteLink(chatId: number | string, memberLimit = 1) {
    return this.makeRequest('createChatInviteLink', {
      chat_id: chatId,
      member_limit: memberLimit,
      expire_date: Math.floor(Date.now() / 1000) + 86400,
    });
  }

  async banChatMember(chatId: number | string, userId: number) {
    return this.makeRequest('banChatMember', {
      chat_id: chatId,
      user_id: userId,
    });
  }

  async setWebhook(url: string) {
    return this.makeRequest('setWebhook', {
      url,
      allowed_updates: ['message', 'callback_query'],
    });
  }

  async deleteWebhook() {
    return this.makeRequest('deleteWebhook');
  }

  async setMyCommands(commands: Array<{ command: string; description: string }>) {
    return this.makeRequest('setMyCommands', {
      commands,
    });
  }

  async deleteMyCommands() {
    return this.makeRequest('deleteMyCommands');
  }

  buildInlineKeyboard(buttons: InlineKeyboardButton[][]): any {
    return {
      inline_keyboard: buttons,
    };
  }

  formatPrice(price: number): string {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  formatWelcomeMessage(template: string, userName: string): string {
    return template.replace(/\{profile_name\}/g, this.escapeHtml(userName));
  }
}

export function createTelegramService(botToken: string): TelegramService {
  return new TelegramService(botToken);
}
