import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { FideleShell } from '@/components/layouts/fidele-shell';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { type NotificationFrame, sendNotificationsFrame, subscribeNotifications } from '@/lib/realtime/notifications-socket';
import { PRESENCE_PING_MS, useNotificationsSocket } from '@/lib/realtime/use-notifications-socket';
import { useRealtimeStore } from '@/stores/realtime-store';
import { apiUrl } from '@/testing/mocks/api-url';
import { f5bState, resetF5bState } from '@/testing/mocks/db-f5b';
import { server } from '@/testing/mocks/server';
import { FakeWebSocket } from '@/testing/fake-web-socket';
import { createTestQueryClient, renderApp } from '@/testing/test-utils';

// Chaque store zustand repart de son état initial après chaque test (__mocks__/zustand.ts).
vi.mock('zustand');

let lectures: number;

beforeEach(() => {
  resetF5bState();
  FakeWebSocket.reset();
  vi.stubGlobal('WebSocket', FakeWebSocket);
  lectures = 0;
  server.use(
    http.get(apiUrl('/notifications/'), () => {
      lectures += 1;
      return HttpResponse.json(f5bState.notifications);
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const socketsNotifications = () => FakeWebSocket.instances.filter((s) => s.url.includes('/ws/notifications/'));

const wrapper = () => {
  const client = createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, Wrapper };
};

describe('Socket ws/notifications/ unique de l’onglet (RealtimeBridge)', () => {
  it('ouvre UNE connexion pour la coquille, le lecteur et plusieurs abonnés du bus ; la cloche se met à jour sur une trame', async () => {
    const recuesA: NotificationFrame[] = [];
    const recuesB: NotificationFrame[] = [];
    const stopA = subscribeNotifications((f) => recuesA.push(f));
    const stopB = subscribeNotifications((f) => recuesB.push(f));
    try {
      renderApp(<FideleShell>contenu</FideleShell>);

      expect(await screen.findByRole('link', { name: 'Notifications, 3 non lues' })).toBeInTheDocument();
      await vi.waitFor(() => expect(FakeWebSocket.last()?.readyState).toBe(1));
      expect(socketsNotifications()).toHaveLength(1);
      expect(FakeWebSocket.instances).toHaveLength(1);
      expect(socketsNotifications()[0].url).toContain('/ws/notifications/?ticket=ticket-test');
      expect(useRealtimeStore.getState().notificationsSocket).toBe('open');

      f5bState.notifications = [
        { id: 'n9', event_type: 'documents.status', payload: { request_id: 'r9', reference: 'JB-2026-00500', status: 'ready_for_pickup' }, is_read: false, read_at: null, created_at: new Date().toISOString() },
        ...f5bState.notifications,
      ];
      const trame = { type: 'notification', event_type: 'documents.status' };
      act(() => FakeWebSocket.last()!.emit(trame));

      expect(await screen.findByRole('link', { name: 'Notifications, 4 non lues' })).toBeInTheDocument();
      expect(recuesA).toEqual([trame]);
      expect(recuesB).toEqual([trame]);
      // Toujours une seule socket après la trame et le rechargement.
      expect(FakeWebSocket.instances).toHaveLength(1);
    } finally {
      stopA();
      stopB();
    }
  });

  it('n’invalide pas les notifications sur une trame playback.state (mais la publie sur le bus)', async () => {
    const recues: NotificationFrame[] = [];
    const stop = subscribeNotifications((f) => recues.push(f));
    const { client, Wrapper } = wrapper();
    client.setQueryData(['notifications'], []);
    try {
      renderHook(() => useNotificationsSocket(true), { wrapper: Wrapper });
      await vi.waitFor(() => expect(FakeWebSocket.last()?.readyState).toBe(1));

      const lecture = { type: 'notification', event_type: 'playback.state', action: 'pause', sauf_device_id: 'autre' };
      act(() => FakeWebSocket.last()!.emit(lecture));
      expect(client.getQueryState(['notifications'])?.isInvalidated).toBe(false);
      expect(recues).toEqual([lecture]);

      act(() => FakeWebSocket.last()!.emit({ type: 'notification', event_type: 'new_message' }));
      expect(client.getQueryState(['notifications'])?.isInvalidated).toBe(true);
    } finally {
      stop();
    }
  });

  it('envoie presence.ping toutes les 25 s et permet d’écrire sur la socket unique', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { Wrapper } = wrapper();
    const { unmount } = renderHook(() => useNotificationsSocket(true), { wrapper: Wrapper });
    await vi.waitFor(() => expect(FakeWebSocket.last()?.readyState).toBe(1));
    const socket = FakeWebSocket.last()!;

    expect(socket.sent).toEqual([]);
    vi.advanceTimersByTime(PRESENCE_PING_MS);
    expect(socket.sent).toEqual([{ type: 'presence.ping' }]);
    vi.advanceTimersByTime(PRESENCE_PING_MS);
    expect(socket.sent).toEqual([{ type: 'presence.ping' }, { type: 'presence.ping' }]);

    expect(sendNotificationsFrame({ type: 'autre' })).toBe(true);
    expect(socket.sent.at(-1)).toEqual({ type: 'autre' });

    // Onglet fermé : plus de battement, plus d'écriture possible, état « inactive ».
    unmount();
    vi.advanceTimersByTime(PRESENCE_PING_MS);
    expect(socket.sent).toHaveLength(3);
    expect(sendNotificationsFrame({ type: 'autre' })).toBe(false);
    expect(useRealtimeStore.getState().notificationsSocket).toBe('inactive');
  });

  it('tient la présence des interlocuteurs à jour (presence.changed)', async () => {
    const { Wrapper } = wrapper();
    renderHook(() => useNotificationsSocket(true), { wrapper: Wrapper });
    await vi.waitFor(() => expect(FakeWebSocket.last()?.readyState).toBe(1));

    act(() =>
      FakeWebSocket.last()!.emit({ type: 'presence.changed', user_id: 'pere-emmanuel-tine', visible: true, online: true, last_seen_at: null }),
    );
    expect(useRealtimeStore.getState().presences['pere-emmanuel-tine']).toEqual({
      user_id: 'pere-emmanuel-tine',
      visible: true,
      online: true,
      last_seen_at: null,
    });
  });

  it('secours : la cloche se recharge toutes les 30 s tant que la socket n’est pas ouverte', async () => {
    const { client, Wrapper } = wrapper();
    const { result } = renderHook(() => useUnreadNotifications(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    const intervalle = () => client.getQueryCache().find({ queryKey: ['notifications'] })?.observers[0]?.options.refetchInterval;

    expect(intervalle()).toBe(30_000);
    act(() => useRealtimeStore.getState().setNotificationsSocket('open'));
    await vi.waitFor(() => expect(intervalle()).toBe(false));
    act(() => useRealtimeStore.getState().setNotificationsSocket('offline'));
    await vi.waitFor(() => expect(intervalle()).toBe(30_000));
    expect(lectures).toBeGreaterThan(0);
  });
});
