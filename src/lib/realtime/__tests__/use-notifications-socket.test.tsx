import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { env } from '@/config/env';
import { useNotifications } from '@/hooks/use-notifications';
import { server } from '@/testing/mocks/server';
import { useRealtimeStore } from '@/stores/realtime-store';

import { useNotificationsSocket } from '../use-notifications-socket';

class SocketTest {
  static readonly OPEN = 1;
  static instances: SocketTest[] = [];
  readyState = 0;
  envoyes: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {
    SocketTest.instances.push(this);
  }
  send(data: string) {
    this.envoyes.push(data);
  }
  close() {
    this.readyState = 3;
  }
  ouvrir() {
    this.readyState = 1;
    this.onopen?.();
  }
  recevoir(trame: unknown) {
    this.onmessage?.({ data: JSON.stringify(trame) });
  }
}

const wrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

describe('useNotificationsSocket', () => {
  beforeEach(() => {
    SocketTest.instances = [];
    vi.stubGlobal('WebSocket', SocketTest);
  });

  test('ouvre ws/notifications/ par ticket, bat toutes les 25 s, suit notifications et présence', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let lectures = 0;
    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () => {
        lectures += 1;
        return HttpResponse.json([]);
      }),
    );
    client.setQueryData(['notifications'], []);
    renderHook(() => useNotificationsSocket(true), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(SocketTest.instances).toHaveLength(1));
    const socket = SocketTest.instances[0];
    expect(socket.url).toMatch(
      /\/ws\/notifications\/\?ticket=ticket-demo-\d+$/,
    );
    expect(socket.url).not.toMatch(/token=/);

    vi.useFakeTimers();
    try {
      socket.ouvrir();
      expect(useRealtimeStore.getState().notificationsSocket).toBe('ouverte');
      vi.advanceTimersByTime(25_000);
      expect(socket.envoyes).toEqual([
        JSON.stringify({ type: 'presence.ping' }),
      ]);
    } finally {
      vi.useRealTimers();
    }

    socket.recevoir({
      type: 'presence.changed',
      user_id: 'pere-emmanuel-tine',
      visible: true,
      online: false,
      last_seen_at: '2026-09-27T10:42:13+00:00',
    });
    expect(useRealtimeStore.getState().presences['pere-emmanuel-tine']).toEqual(
      {
        user_id: 'pere-emmanuel-tine',
        visible: true,
        online: false,
        last_seen_at: '2026-09-27T10:42:13+00:00',
      },
    );

    const avant = lectures;
    socket.recevoir({ type: 'notification', event_type: 'new_message' });
    await waitFor(() =>
      expect(client.getQueryState(['notifications'])?.isInvalidated).toBe(true),
    );
    expect(lectures).toBe(avant); // pas d'observateur : invalidé, rechargé à l'usage
  });

  test('polling de secours seulement quand la socket est fermée', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useNotifications(), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const options = () =>
      client.getQueryCache().find({ queryKey: ['notifications'] })?.observers[0]
        ?.options.refetchInterval;
    expect(options()).toBe(30_000);
    React.act(() =>
      useRealtimeStore.getState().setNotificationsSocket('ouverte'),
    );
    await waitFor(() => expect(options()).toBe(false));
  });
});
