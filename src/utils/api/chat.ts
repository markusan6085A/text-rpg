import { apiRequest, getAccessToken, API_URL } from "./core";

// Chat API
export interface ChatMessage {
  id: string;
  characterName: string;
  characterId?: string; // For ownership check
  channel: string;
  message: string;
  createdAt: string;
  isOwn?: boolean; // Whether this message belongs to current user
  nickColor?: string; // Color of the character's nickname
  emblem?: string | null; // Clan emblem of the sender
}

export interface ChatMessagesResponse {
  ok: boolean;
  messages: ChatMessage[];
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface PostChatMessageRequest {
  channel: string;
  message: string;
}

export interface PostChatMessageResponse {
  ok: boolean;
  message: ChatMessage;
}

export interface ChatRestrictionResponse {
  ok: boolean;
  mutedUntil: number | null;
  bannedUntil: string | null;
  isMuted: boolean;
  isBanned: boolean;
}

export async function getChatRestriction(): Promise<ChatRestrictionResponse> {
  const response = await apiRequest<ChatRestrictionResponse>('/chat/restriction', { method: 'GET' });
  return response;
}

export async function getChatMessages(channel: string = 'general', page: number = 1, limit: number = 10): Promise<ChatMessagesResponse> {
  const response = await apiRequest<ChatMessagesResponse>(`/chat/messages?channel=${encodeURIComponent(channel)}&page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function deleteChatMessage(messageId: string): Promise<{ ok: boolean; message: string }> {
  // 🔥 DELETE не повинен мати body, тільки URL параметр
  console.log('[api] deleteChatMessage called:', messageId);
  try {
    // 🔥 Використовуємо fetch напряму для DELETE, щоб гарантовано не додати Content-Type
    const token = getAccessToken();
    const headers: HeadersInit = { Accept: "application/json" };
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/chat/messages/${encodeURIComponent(messageId)}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    console.log('[api] DELETE response status:', response.status, response.statusText);
    console.log('[api] DELETE response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Спробуємо отримати детальну помилку з бекенду
      const status = response.status;
      let errorMessage = `HTTP ${status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('[api] DELETE error response:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
        if (errorData.details) {
          console.error('[api] DELETE error details:', errorData.details);
          errorMessage += ` (${JSON.stringify(errorData.details)})`;
        }
      } catch (e) {
        // Не вдалося розпарсити JSON - використовуємо текст
        const text = await response.text().catch(() => '');
        console.error('[api] DELETE error text:', text);
        errorMessage = text || errorMessage;
      }
      
      // 🔥 Додаємо status до помилки для перевірки на фронтенді
      const error = new Error(errorMessage) as any;
      error.status = status;
      throw error;
    }

    const result = await response.json() as { ok: boolean; message: string };
    console.log('[api] deleteChatMessage success:', result);
    return result;
  } catch (error: any) {
    console.error('[api] deleteChatMessage error:', error);
    console.error('[api] deleteChatMessage error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    throw error;
  }
}

export async function postChatMessage(channel: string, message: string): Promise<ChatMessage> {
  const response = await apiRequest<PostChatMessageResponse>('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ channel, message }),
  });
  return response.message;
}
