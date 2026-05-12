import { apiClient } from '@/src/api/client';
import type { Conversation, SupportMessage } from '@/src/types/support';

type ApiResponse<T> = { ok: boolean; data: T };

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<ApiResponse<{ conversations: Conversation[] }>>('/conversations');
  return data.data.conversations ?? [];
}

export async function getConversationMessages(conversationId: number): Promise<SupportMessage[]> {
  const { data } = await apiClient.get<ApiResponse<{ messages: SupportMessage[] }>>(`/conversations/${conversationId}/messages`);
  return data.data.messages ?? [];
}

export async function getConversation(conversationId: number): Promise<Conversation> {
  const { data } = await apiClient.get<ApiResponse<{ conversation: Conversation }>>(`/conversations/${conversationId}`);
  return data.data.conversation;
}

export async function sendMessage(conversationId: number, body: string): Promise<SupportMessage> {
  const { data } = await apiClient.post<ApiResponse<{ message: SupportMessage }>>(`/conversations/${conversationId}/messages`, { body });
  return data.data.message;
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/read`);
}

export async function claimConversation(conversationId: number): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/claim`);
}

async function updateConversationStatus(conversationId: number, status: string): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/status`, { status });
}

export async function completeConversation(conversationId: number): Promise<void> {
  await updateConversationStatus(conversationId, 'completed');
}

export async function closeConversation(conversationId: number): Promise<void> {
  await updateConversationStatus(conversationId, 'closed');
}

export async function reopenConversation(conversationId: number): Promise<void> {
  await updateConversationStatus(conversationId, 'open');
}
