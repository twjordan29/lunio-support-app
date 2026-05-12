import { io, Socket } from 'socket.io-client';

import { config } from '@/src/config/env';

export type SupportSocketEvents = {
  onConversationUpdated?: (payload: unknown) => void;
  onMessageCreated?: (payload: unknown) => void;
  onConversationStatusChanged?: (payload: unknown) => void;
};

export function createSupportSocket(token: string, events: SupportSocketEvents): Socket {
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

  socket.connect();
  return socket;
}
