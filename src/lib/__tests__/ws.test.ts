import { backoffDelay, createSocket, MAX_ATTEMPTS, type SocketStatus } from '@/lib/ws';

class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close(code: number) {
    this.onclose?.({ code });
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0));

const setup = () => {
  FakeSocket.instances = [];
  const statuses: SocketStatus[] = [];
  const messages: unknown[] = [];
  const timers: (() => void)[] = [];
  let n = 0;
  const socket = createSocket('/ws/notifications/', {
    onMessage: (m) => messages.push(m),
    onStatus: (s) => statuses.push(s),
    WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
    ticket: async () => `t${++n}`,
    schedule: (fn) => timers.push(fn),
  });
  return { socket, statuses, messages, timers };
};

describe('createSocket', () => {
  it('se connecte avec un ticket à usage unique et relaie les messages', async () => {
    const { socket, statuses, messages } = setup();
    await flush();
    const ws = FakeSocket.instances[0];
    expect(ws.url).toMatch(/\/ws\/notifications\/\?ticket=t1$/);

    ws.open();
    ws.onmessage?.({ data: '{"type":"notification"}' });

    expect(statuses.at(-1)).toBe('open');
    expect(messages).toEqual([{ type: 'notification' }]);
    expect(socket.send({ a: 1 })).toBe(true);
  });

  it('reprend avec un ticket frais, puis passe hors ligne après le plafond', async () => {
    const { statuses, timers } = setup();
    await flush();
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      FakeSocket.instances.at(-1)!.onclose?.({ code: 1006 });
      timers.shift()!();
      await flush();
    }
    expect(new Set(FakeSocket.instances.map((s) => s.url)).size).toBe(MAX_ATTEMPTS + 1);

    FakeSocket.instances.at(-1)!.onclose?.({ code: 1006 });
    expect(statuses.at(-1)).toBe('offline');
  });

  it('ne relance pas après un refus d’accès (4003)', async () => {
    const { statuses, timers } = setup();
    await flush();
    FakeSocket.instances[0].onclose?.({ code: 4003 });
    expect(statuses.at(-1)).toBe('forbidden');
    expect(timers).toHaveLength(0);
  });

  it('borne l’attente entre deux tentatives', () => {
    expect(backoffDelay(0)).toBe(1000);
    expect(backoffDelay(10)).toBe(15_000);
  });
});
