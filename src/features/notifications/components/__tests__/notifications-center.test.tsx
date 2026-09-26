import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationsCenter } from '@/features/notifications/components/notifications-center';
import { f5bState, resetF5bState } from '@/testing/mocks/db-f5b';
import { renderApp } from '@/testing/test-utils';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));

/** WebSocket simulé : le socket de notifications reçoit des trames poussées par le test. */
class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
    });
  }
  send() {}
  close() {
    this.readyState = 3;
  }
  push(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

beforeEach(() => {
  resetF5bState();
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
});
afterEach(() => vi.unstubAllGlobals());

describe('Notifications (/app/notifications)', () => {
  it('liste les notifications par jour, sans jamais montrer le contenu d’un message', async () => {
    renderApp(<NotificationsCenter />);

    expect(await screen.findByText('Père Emmanuel Tine vous a écrit')).toBeInTheDocument();
    expect(screen.getByText(/le contenu du message s.affiche seulement dans la conversation/i)).toBeInTheDocument();
    expect(screen.getByText('3 non lues.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^aujourd.hui/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Cette semaine' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nouvelle annonce de saint-dominique/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/app\/paroisse\/annonces\//),
    );
    expect(screen.getByRole('link', { name: /votre demande jb-2026-00412\s:\sen vérification/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/app\/demandes\//),
    );
    expect(screen.queryByText(/chiffré de bout en bout/i)).not.toBeInTheDocument();
  });

  it('filtre par catégorie et par état de lecture', async () => {
    const user = userEvent.setup();
    renderApp(<NotificationsCenter />);
    const list = await screen.findByRole('region', { name: /liste des notifications/i });

    await user.click(within(list).getByRole('button', { name: /^confession/i }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(within(list).getByText(/rappel : rendez-vous de confession/i)).toBeInTheDocument();

    await user.click(within(list).getByRole('button', { name: /non lues/i }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('marque une notification lue à l’ouverture, puis toutes', async () => {
    const user = userEvent.setup();
    // jsdom ne navigue pas : on garde le clic sur le lien sans changement de page.
    const stay = (event: Event) => event.preventDefault();
    document.addEventListener('click', stay);
    renderApp(<NotificationsCenter />);

    await user.click(await screen.findByRole('link', { name: /père emmanuel tine vous a écrit/i }));
    document.removeEventListener('click', stay);
    await vi.waitFor(() => expect(f5bState.readIds).toEqual(['n1']));
    expect(await screen.findByText('2 non lues.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tout marquer comme lu/i }));
    expect(await screen.findByText('Tout est lu.')).toBeInTheDocument();
    expect(screen.queryAllByRole('img', { name: 'Non lue' })).toHaveLength(0);
  });

  it('se met à jour en temps réel quand une notification arrive', async () => {
    renderApp(<NotificationsCenter />);
    await screen.findByText('Père Emmanuel Tine vous a écrit');
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    expect(FakeWebSocket.instances[0].url).toContain('/ws/notifications/?ticket=ticket-test');

    f5bState.notifications = [
      {
        id: 'n9',
        event_type: 'documents.status',
        payload: { request_id: 'r9', reference: 'JB-2026-00500', status: 'ready_for_pickup' },
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
      },
      ...f5bState.notifications,
    ];
    act(() => FakeWebSocket.instances[0].push({ type: 'notification', event_type: 'documents.status' }));

    expect(await screen.findByText('Votre demande JB-2026-00500 : prête à retirer')).toBeInTheDocument();
    expect(screen.getByText(/l.original est à retirer au secrétariat/i)).toBeInTheDocument();
  });

  it('enregistre les préférences de notification', async () => {
    const user = userEvent.setup();
    renderApp(<NotificationsCenter />);

    const agenda = await screen.findByRole('switch', { name: 'Agenda et événements' });
    expect(agenda).toHaveAttribute('aria-checked', 'false');
    await user.click(agenda);
    await vi.waitFor(() => expect(f5bState.preferences.topic_evenements).toBe(true));

    await user.click(screen.getByRole('switch', { name: /silence de 22 h à 6 h/i }));
    await vi.waitFor(() => expect(f5bState.preferences).toMatchObject({ quiet_start: '00:00:00', quiet_end: '00:00:00' }));
    expect(await screen.findByRole('switch', { name: 'Silence la nuit' })).toHaveAttribute('aria-checked', 'false');
  });
});
