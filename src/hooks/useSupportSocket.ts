import { useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { createSupportSocket } from '@/src/api/supportSocket';

export type SupportSocketEvents = {
  onConversationUpdated?: (payload: any) => void;
  onMessageCreated?: (payload: any) => void;
  onConversationStatusChanged?: (payload: any) => void;
};

export function useSupportSocket(token: string | null, events?: SupportSocketEvents) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const socket = useMemo<Socket | null>(() => {
    if (!token) return null;
    return createSupportSocket(token, {
      onConversationUpdated: (payload) => {
        setLastEvent('conversation:updated');
        events?.onConversationUpdated?.(payload);
      },
      onMessageCreated: (payload) => {
        setLastEvent('message:created');
        events?.onMessageCreated?.(payload);
      },
      onConversationStatusChanged: (payload) => {
        setLastEvent('conversation:status_changed');
        events?.onConversationStatusChanged?.(payload);
      },
    });
  }, [token, events]);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return { socket, isConnected, lastEvent };
}
