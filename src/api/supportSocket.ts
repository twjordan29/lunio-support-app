import { io, Socket } from 'socket.io-client';

import { config } from '@/src/config/env';

export type SupportSocketEvents = {
  onConversationUpdated?: (payload: unknown) => void;
  onMessageCreated?: (payload: unknown) => void;
  onConversationStatusChanged?: (payload: unknown) => void;
  onConversationRead?: (payload: unknown) => void;
};

export function createSupportSocket(token: string, events: SupportSocketEvents, onAuthError?: () => void): Socket {
  console.debug('[mobile-socket] creating socket with token length:', token.length, 'token starts with:', token.substring(0, 10));
  if (!token || token.length === 0) {
    console.error('[mobile-socket] token is empty!');
  }
  const socket = io(config.supportApiUrl, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: false,
  });

  socket.on('support:conversation:updated', (payload) => events.onConversationUpdated?.(payload));
  socket.on('conversation:updated', (payload) => events.onConversationUpdated?.(payload));
  socket.on('support:message:new', (payload) => events.onMessageCreated?.(payload));
  socket.on('message:created', (payload) => events.onMessageCreated?.(payload));
  socket.on('support:conversation:status_changed', (payload) => events.onConversationStatusChanged?.(payload));
  socket.on('conversation:status_changed', (payload) => events.onConversationStatusChanged?.(payload));
  socket.on('support:conversation:read', (payload) => events.onConversationRead?.(payload));
  socket.on('conversation:read', (payload) => events.onConversationRead?.(payload));

  socket.on('connect_error', (error) => {
    console.debug('[mobile-socket] connect error:', error.message);
    if (error.message && (error.message.includes('authentication') || error.message.includes('token') || error.message.includes('Invalid'))) {
      console.debug('[mobile-socket] auth error detected');
      onAuthError?.();
    }
  });

  console.debug('[mobile-socket] connecting...');
  socket.connect();
  return socket;
}
