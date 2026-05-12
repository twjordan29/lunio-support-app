import type { Conversation } from '@/src/types/support';

const SUPPORT_APP_DEBUG = false;

const cleanString = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const cleaned = String(value).trim();
  return cleaned.length > 0 ? cleaned : null;
};

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return null;
};

export function getConversationDisplayInfo(conversation: Conversation | null | undefined) {
  const nameCandidates: [keyof Conversation, unknown][] = [
    ['guest_name', conversation?.guest_name],
    ['customer_name', conversation?.customer_name],
    ['visitor_name', conversation?.visitor_name],
    ['contact_name', conversation?.contact_name],
    ['name', conversation?.name],
  ];
  const emailCandidates: [keyof Conversation, unknown][] = [
    ['guest_email', conversation?.guest_email],
    ['customer_email', conversation?.customer_email],
    ['visitor_email', conversation?.visitor_email],
    ['contact_email', conversation?.contact_email],
    ['email', conversation?.email],
  ];
  const nameSource = nameCandidates.find(([, value]) => cleanString(value))?.[0] || 'fallback';
  const emailSource = emailCandidates.find(([, value]) => cleanString(value))?.[0] || 'fallback';
  const displayName = firstString(
    ...nameCandidates.map(([, value]) => value)
  ) || 'Guest visitor';

  const displayEmail = firstString(
    ...emailCandidates.map(([, value]) => value)
  ) || 'No email provided';

  const latestMessagePreview = firstString(
    conversation?.latest_message,
    conversation?.last_message,
    conversation?.last_message_body,
    conversation?.last_message_preview,
    conversation?.preview,
    conversation?.snippet,
    conversation?.latest_message_body,
    conversation?.subject
  ) || 'No messages yet';

  const updatedAt = firstString(
    conversation?.last_message_at,
    conversation?.latest_message_at,
    conversation?.latest_message_created_at,
    conversation?.updated_at
  ) || undefined;

  if (SUPPORT_APP_DEBUG) {
    console.debug('[support-app] conversation display info', {
      conversation_id: conversation?.id || null,
      displayNameSource: nameSource,
      displayEmailSource: emailSource,
      displayName,
      displayEmail,
    });
  }

  return {
    displayName,
    displayEmail,
    displayNameSource: nameSource,
    displayEmailSource: emailSource,
    latestMessagePreview,
    status: conversation?.status || 'open',
    updatedAt,
  };
}

export function mergeConversationPreservingDisplay(existing: Conversation, incoming: Partial<Conversation>): Conversation {
  return {
    ...existing,
    ...incoming,
    guest_name: incoming.guest_name ?? existing.guest_name,
    guest_email: incoming.guest_email ?? existing.guest_email,
    customer_name: incoming.customer_name ?? existing.customer_name,
    customer_email: incoming.customer_email ?? existing.customer_email,
    visitor_name: incoming.visitor_name ?? existing.visitor_name,
    visitor_email: incoming.visitor_email ?? existing.visitor_email,
    contact_name: incoming.contact_name ?? existing.contact_name,
    contact_email: incoming.contact_email ?? existing.contact_email,
    name: incoming.name ?? existing.name,
    email: incoming.email ?? existing.email,
    latest_message: incoming.latest_message ?? existing.latest_message,
    last_message: incoming.last_message ?? existing.last_message,
    last_message_body: incoming.last_message_body ?? existing.last_message_body,
    last_message_preview: incoming.last_message_preview ?? existing.last_message_preview,
    preview: incoming.preview ?? existing.preview,
    snippet: incoming.snippet ?? existing.snippet,
    latest_message_body: incoming.latest_message_body ?? existing.latest_message_body,
    latest_message_created_at: incoming.latest_message_created_at ?? existing.latest_message_created_at,
    last_message_at: incoming.last_message_at ?? existing.last_message_at,
    latest_message_at: incoming.latest_message_at ?? existing.latest_message_at,
    subject: incoming.subject ?? existing.subject,
  };
}
