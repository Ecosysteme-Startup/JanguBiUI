import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { useRealtimeStore } from '@/stores/realtime-store';

import { useChatSocket } from '../use-chat-socket';

class SocketTest {
  static readonly OPEN = 1;
  static instances: SocketTest[] = [];
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  constructor(public url: string) {
    SocketTest.instances.push(this);
  }
}

describe('useChatSocket', () => {
  test('s’authentifie par ticket et relaie presence.changed', async () => {
    SocketTest.instances = [];
    vi.stubGlobal('WebSocket', SocketTest);
    const client = new QueryClient();
    renderHook(() => useChatSocket('conv-1'), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await waitFor(() => expect(SocketTest.instances).toHaveLength(1));
    const socket = SocketTest.instances[0];
    expect(socket.url).toMatch(
      /\/ws\/messaging\/conversations\/conv-1\/\?ticket=ticket-demo-\d+$/,
    );
    socket.onmessage?.({
      data: JSON.stringify({
        type: 'presence.changed',
        user_id: 'anna-sarr',
        visible: true,
        online: true,
        last_seen_at: null,
      }),
    });
    expect(useRealtimeStore.getState().presences['anna-sarr']?.online).toBe(
      true,
    );
  });
});
