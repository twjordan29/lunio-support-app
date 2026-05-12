import type { Conversation, SupportMessage } from '@/src/types/support';

export function messageKey(message: SupportMessage): string {
  return message.local_id ?? `id:${message.id}`;
}

export function upsertMessage(messages: SupportMessage[], message: SupportMessage): SupportMessage[] {
  return mergeUniqueMessages(messages, [message]);
}

export function mergeUniqueMessages(existing: SupportMessage[], incoming: SupportMessage[]): SupportMessage[] {
  const merged: SupportMessage[] = [...existing];
  const indexByLocalId = new Map<string, number>();
  const indexById = new Map<number, number>();

  merged.forEach((message, index) => {
    if (message.local_id) {
      indexByLocalId.set(message.local_id, index);
    }
    indexById.set(message.id, index);
  });

  incoming.forEach((message) => {
    if (message.local_id && indexByLocalId.has(message.local_id)) {
      const existingIndex = indexByLocalId.get(message.local_id)!;
      merged[existingIndex] = { ...merged[existingIndex], ...message };
      return;
    }

    if (indexById.has(message.id)) {
      const existingIndex = indexById.get(message.id)!;
      merged[existingIndex] = { ...merged[existingIndex], ...message };
      return;
    }

    indexById.set(message.id, merged.length);
    if (message.local_id) {
      indexByLocalId.set(message.local_id, merged.length);
    }
    merged.push(message);
  });

  return merged;
}

export function conversationKey(conversation: Conversation): string {
  return `id:${conversation.id}`;
}

export function upsertConversation(conversations: Conversation[], conversation: Conversation): Conversation[] {
  return mergeUniqueConversations(conversations, [conversation]);
}

export function mergeUniqueConversations(existing: Conversation[], incoming: Conversation[]): Conversation[] {
  const merged: Conversation[] = [...existing];
  const indexById = new Map<number, number>();

  merged.forEach((conversation, index) => {
    indexById.set(conversation.id, index);
  });

  incoming.forEach((conversation) => {
    const existingIndex = indexById.get(conversation.id);
    if (existingIndex !== undefined) {
      merged[existingIndex] = { ...merged[existingIndex], ...conversation };
      return;
    }

    indexById.set(conversation.id, merged.length);
    merged.push(conversation);
  });

  return merged;
}
