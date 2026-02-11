import { api } from './api';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  fraud_alert: boolean;
  attachments?: string[];
}

export interface Conversation {
  chat_id: string;
  land_id: string;
  buyer_id: string;
  seller_id: string;
  last_message: {
    sender_id: string;
    message: string;
    created_at: string;
  };
}

export const chatService = {
  startChat: async (landId: string) => {
    const response = await api.post<{
      chat_id: string;
      land_id: string;
      buyer_id: string;
      seller_id: string;
    }>(`/chat/start/${landId}`, {});
    return response.data;
  },

  getMessages: async (chatId: string) => {
    const response = await api.get<ChatMessage[]>(`/chat/${chatId}`);
    return response.data;
  },

  sendMessage: async (chatId: string, message: string) => {
    const response = await api.post<ChatMessage>('/chat', {
      chat_id: chatId,
      message
    });
    return response.data;
  },

  listConversations: async () => {
    const response = await api.get<{ count: number, items: Conversation[] }>('/chat/conversations/me');
    return response.data;
  }
};
