import { configureApiAuth } from '@/lib/api-client';
import { FakeWebSocket } from '@/testing/fake-web-socket';

/**
 * Session simulée pour les tests des modules qui vérifient qu'une personne est connectée avant
 * d'écrire en tâche de fond (état de lecture, événements d'écoute) : jeton d'accès fictif et
 * WebSocket simulé (la socket `ws/notifications/` du lecteur).
 */
export const simulerSession = () => {
  configureApiAuth({
    accessToken: async () => 'jeton-test',
    onUnauthorized: async () => 'jeton-test',
  });
  FakeWebSocket.reset();
  vi.stubGlobal('WebSocket', FakeWebSocket);
};

export const terminerSession = () => {
  configureApiAuth({
    accessToken: async () => null,
    onUnauthorized: () => undefined,
  });
  vi.unstubAllGlobals();
};
