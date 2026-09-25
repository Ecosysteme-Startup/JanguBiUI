/**
 * WebSocket simulé pour les tests d'intégration (jsdom tenterait une vraie connexion).
 * `vi.stubGlobal('WebSocket', FakeWebSocket)` ; `FakeWebSocket.autoFail = true` simule un
 * serveur injoignable (fermeture 1006 à chaque tentative).
 */
export class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];
  static autoFail = false;

  static reset() {
    FakeWebSocket.instances = [];
    FakeWebSocket.autoFail = false;
  }

  static last() {
    return FakeWebSocket.instances.at(-1);
  }

  readyState = 0;
  sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
    queueMicrotask(() =>
      FakeWebSocket.autoFail ? this.close(1006) : this.open(),
    );
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  emit(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  close(code = 1000) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}
