export interface GroupValidationResult {
  isValid: boolean;
  botPresent: boolean;
  isAdmin: boolean;
  hasAllPermissions: boolean;
  groupTitle?: string;
  error?: string;
}

export interface AdminPermissions {
  can_manage_chat: boolean;
  can_delete_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages: boolean;
}

export async function validateGroupId(groupId: string): Promise<{ isValid: boolean; error?: string }> {
  if (!groupId || !groupId.trim()) {
    return { isValid: false, error: 'ID do grupo é obrigatório' };
  }

  const trimmedId = groupId.trim();

  if (!trimmedId.startsWith('-100')) {
    return { isValid: false, error: '❌ ID inválido. IDs de grupos Telegram devem começar com -100' };
  }

  if (!/^-100\d+$/.test(trimmedId)) {
    return { isValid: false, error: '❌ ID inválido. O formato deve ser -100XXXXXXXXXX' };
  }

  return { isValid: true };
}

export async function validateBotInGroup(
  botToken: string,
  groupId: string
): Promise<GroupValidationResult> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${groupId}&user_id=${await getBotUserId(botToken)}`
    );

    const data = await response.json();

    if (!data.ok) {
      return {
        isValid: false,
        botPresent: false,
        isAdmin: false,
        hasAllPermissions: false,
        error: '❌ Bot não foi encontrado no grupo. Por favor, adicione o bot como administrador'
      };
    }

    const member = data.result;
    const status = member.status;

    if (status !== 'administrator' && status !== 'creator') {
      return {
        isValid: false,
        botPresent: true,
        isAdmin: false,
        hasAllPermissions: false,
        error: '❌ Bot não é administrador. Por favor, promova o bot a administrador'
      };
    }

    const chatResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat?chat_id=${groupId}`
    );
    const chatData = await chatResponse.json();
    const groupTitle = chatData.ok ? chatData.result.title : undefined;

    const hasAllPermissions = checkAllPermissions(member);

    if (!hasAllPermissions) {
      return {
        isValid: false,
        botPresent: true,
        isAdmin: true,
        hasAllPermissions: false,
        groupTitle,
        error: '❌ Bot não possui todas as permissões de administrador necessárias. Libere TODAS as permissões de admin'
      };
    }

    return {
      isValid: true,
      botPresent: true,
      isAdmin: true,
      hasAllPermissions: true,
      groupTitle
    };
  } catch (error) {
    console.error('Error validating bot in group:', error);
    return {
      isValid: false,
      botPresent: false,
      isAdmin: false,
      hasAllPermissions: false,
      error: '❌ Erro ao validar grupo. Verifique se o ID está correto'
    };
  }
}

async function getBotUserId(botToken: string): Promise<number> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const data = await response.json();
  return data.result.id;
}

function checkAllPermissions(member: any): boolean {
  const requiredPermissions = [
    'can_manage_chat',
    'can_delete_messages',
    'can_manage_video_chats',
    'can_restrict_members',
    'can_promote_members',
    'can_change_info',
    'can_invite_users',
    'can_pin_messages'
  ];

  for (const permission of requiredPermissions) {
    if (!member[permission]) {
      return false;
    }
  }

  return true;
}

export async function sendWelcomeMessageToRegistry(
  botToken: string,
  registryGroupId: string,
  botName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = `🎉 Agora o bot ${botName} irá registrar todas as vendas aqui!\nBoas Vendas! 💰😁`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: registryGroupId,
          text: message
        })
      }
    );

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: 'Falha ao enviar mensagem de boas-vindas' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending welcome message:', error);
    return { success: false, error: 'Erro ao enviar mensagem' };
  }
}

export async function generateVipLink(
  botToken: string,
  vipGroupId: string
): Promise<{ link?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/exportChatInviteLink?chat_id=${vipGroupId}`,
      { method: 'POST' }
    );

    const data = await response.json();

    if (!data.ok) {
      return { error: 'Falha ao gerar link do grupo VIP' };
    }

    return { link: data.result };
  } catch (error) {
    console.error('Error generating VIP link:', error);
    return { error: 'Erro ao gerar link VIP' };
  }
}
