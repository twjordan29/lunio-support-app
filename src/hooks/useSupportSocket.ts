import { useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { createSupportSocket } from '@/src/api/supportSocket';

export type SupportSocketEvents = {
  onConversationUpdated?: (payload: any) => void;
  onMessageCreated?: (payload: any) => void;
  onConversationStatusChanged?: (payload: any) => void;
  onConversationRead?: (payload: any) => void;
  onAuthError?: () => void;
};

export function useSupportSocket(token: string | null, events?: SupportSocketEvents) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const eventsRef = useRef<SupportSocketEvents | undefined>(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const socket = useMemo<Socket | null>(() => {
    if (!token) return null;
    return createSupportSocket(token, {
      onConversationUpdated: (payload) => {
        setLastEvent('conversation:updated');
        eventsRef.current?.onConversationUpdated?.(payload);
      },
      onMessageCreated: (payload) => {
        setLastEvent('message:created');
        console.debug('[mobile-socket] message received:', payload);
        eventsRef.current?.onMessageCreated?.(payload);
      },
      onConversationStatusChanged: (payload) => {
        setLastEvent('conversation:status_changed');
        console.debug('[mobile-socket] status changed received:', payload);
        eventsRef.current?.onConversationStatusChanged?.(payload);
      },
      onConversationRead: (payload) => {
        setLastEvent('conversation:read');
        eventsRef.current?.onConversationRead?.(payload);
      },
    }, () => eventsRef.current?.onAuthError?.());
  }, [token]);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const handleConnect = () => {
      console.debug('[mobile-socket] connected');
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.debug('[mobile-socket] disconnected');
      setIsConnected(false);
    };

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
