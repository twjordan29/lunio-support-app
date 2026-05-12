export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed' | string;

export type Conversation = {
  id: number;
  guest_name?: string | null;
  guest_email?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  visitor_name?: string | null;
  visitor_email?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  name?: string | null;
  email?: string | null;
  subject?: string | null;
  latest_message?: string | null;
  last_message?: string | null;
  last_message_body?: string | null;
  last_message_preview?: string | null;
  preview?: string | null;
  snippet?: string | null;
  latest_message_body?: string | null;
  latest_message_created_at?: string | null;
  last_message_at?: string | null;
  latest_message_at?: string | null;
  status: ConversationStatus;
  assigned_admin_id?: number | null;
  unread_count?: number;
  updated_at?: string;
};

export type SupportMessage = {
  id: number;
  conversation_id: number;
  sender_type: 'staff' | 'user' | 'guest' | string;
  sender_id?: number | null;
  body: string;
  created_at: string;
  local_id?: string;
};
