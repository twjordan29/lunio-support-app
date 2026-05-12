import type { Conversation, SupportMessage } from '@/src/types/support';
import { mergeConversationPreservingDisplay } from '@/src/utils/conversationDisplay';

export const ACTIVE_CONVERSATION_STATUSES = new Set(['open', 'pending', 'assigned', 'mine']);
export const INACTIVE_CONVERSATION_STATUSES = new Set(['closed', 'completed', 'ended', 'archived']);

export function isActiveConversationStatus(status: string | null | undefined): boolean {
  const normalized = String(status || '').toLowerCase();
  if (INACTIVE_CONVERSATION_STATUSES.has(normalized)) return false;
  return ACTIVE_CONVERSATION_STATUSES.has(normalized) || normalized === '';
}

export function getActiveUnreadTotal(conversations: Conversation[]): number {
  return conversations.reduce((total, conversation) => {
    if (!isActiveConversationStatus(conversation.status)) return total;
    return total + Number(conversation.unread_count || 0);
  }, 0);
}

export function sortConversationsForInbox(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = Date.parse(a.last_message_at || a.latest_message_at || a.latest_message_created_at || a.updated_at || '');
    const bTime = Date.parse(b.last_message_at || b.latest_message_at || b.latest_message_created_at || b.updated_at || '');
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

export function upsertConversation(conversations: Conversation[], incoming: Conversation): Conversation[] {
  const index = conversations.findIndex((conversation) => conversation.id === incoming.id);
  if (index < 0) return sortConversationsForInbox([incoming, ...conversations]);

  const next = [...conversations];
  next[index] = mergeConversationPreservingDisplay(next[index], incoming);
  return sortConversationsForInbox(next);
}

export function applyConversationEvent(conversations: Conversation[], payload: { conversation_id?: number; status?: string; conversation?: Partial<Conversation> }): Conversation[] {
  const incoming = payload.conversation;
  const id = Number(incoming?.id || payload.conversation_id || 0);
  if (!id) return conversations;

  const existing = conversations.find((conversation) => conversation.id === id);
  const base: Conversation = existing || {
    id,
    status: payload.status || incoming?.status || 'open',
    unread_count: 0,
  };

  return upsertConversation(conversations, mergeConversationPreservingDisplay(base, {
    ...incoming,
    id,
    status: payload.status || incoming?.status || base.status,
  }));
}

export function applyMessageEventToConversation(conversations: Conversation[], payload: { conversation_id?: number; message?: SupportMessage }, currentUserId?: number | null): Conversation[] {
  const message = payload.message;
  const id = Number(payload.conversation_id || message?.conversation_id || 0);
  if (!id || !message) return conversations;

  const existing = conversations.find((conversation) => conversation.id === id);
  const isOwnMessage = !!currentUserId && Number(message.sender_id || 0) === currentUserId;
  const base: Conversation = existing || {
    id,
    status: 'open',
    unread_count: 0,
  };
  const active = isActiveConversationStatus(base.status);
  const unread_count = isOwnMessage || !active ? Number(base.unread_count || 0) : Number(base.unread_count || 0) + 1;

  return upsertConversation(conversations, mergeConversationPreservingDisplay(base, {
    id,
    latest_message: message.body,
    latest_message_body: message.body,
    last_message_body: message.body,
    last_message_preview: message.body,
    preview: message.body,
    snippet: message.body,
    updated_at: message.created_at,
    latest_message_at: message.created_at,
    last_message_at: message.created_at,
    latest_message_created_at: message.created_at,
    unread_count,
  }));
}

export function markConversationReadLocally(conversations: Conversation[], conversationId: number): Conversation[] {
  return conversations.map((conversation) => (
    conversation.id === conversationId
      ? mergeConversationPreservingDisplay(conversation, { unread_count: 0 })
      : conversation
  ));
}
