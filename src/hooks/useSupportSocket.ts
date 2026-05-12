import { useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { createSupportSocket } from '@/src/api/supportSocket';

export function useSupportSocket(token: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const socket = useMemo<Socket | null>(() => {
    if (!token) return null;
    return createSupportSocket(token, {
      onConversationUpdated: () => setLastEvent('conversation:updated'),
      onMessageCreated: () => setLastEvent('message:created'),
      onConversationStatusChanged: () => setLastEvent('conversation:status_changed'),
    });
  }, [token]);

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
