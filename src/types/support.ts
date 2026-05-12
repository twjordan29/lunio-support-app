export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed' | string;

export type Conversation = {
  id: number;
  customer_name?: string | null;
  customer_email?: string | null;
  subject?: string | null;
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
};
