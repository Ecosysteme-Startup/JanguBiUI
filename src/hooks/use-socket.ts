'use client';

import { useEffect, useRef, useState } from 'react';

import { createSocket, type ManagedSocket, type SocketStatus } from '@/lib/ws';

/** Ouvre un socket géré pour la durée de vie du composant (`path` null : aucun socket). */
export const useSocket = (path: string | null, onMessage: (data: unknown) => void) => {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const handler = useRef(onMessage);
  const socket = useRef<ManagedSocket | null>(null);

  useEffect(() => {
    handler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!path) return undefined;
    const managed = createSocket(path, { onMessage: (data) => handler.current(data), onStatus: setStatus });
    socket.current = managed;
    return () => {
      managed.close();
      socket.current = null;
    };
  }, [path]);

  return {
    status,
    send: (data: unknown) => socket.current?.send(data) ?? false,
    retry: () => socket.current?.retry(),
  };
};
