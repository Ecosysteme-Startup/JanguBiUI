import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MessagerieInbox } from '@/features/messagerie/components/messagerie-inbox';
import { FakeWebSocket } from '@/testing/fake-web-socket';
import { ids } from '@/testing/mocks/db';
import { f7Ids, f7State, resetF7State } from '@/testing/mocks/db-f7-pretre';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f7PretreHandlers));

beforeEach(() => {
  resetF7State();
  FakeWebSocket.reset();
  vi.stubGlobal('WebSocket', FakeWebSocket);
  navigation.pathname = `/espace/${ids.saintDominique}/messagerie`;
  navigation.replace.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe('MessagerieInbox (PAR-Messagerie)', () => {
  it('liste mes conversations et garde le bandeau confession, même sans conversation ouverte', async () => {
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    const list = await screen.findByRole('list', { name: 'Conversations' });
    expect(within(list).getByText('Emmanuel Tine')).toBeInTheDocument();
    expect(within(list).getByText('1 nouveau')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      'La confession ne se fait pas par message.',
    );
    expect(
      screen.getByText(
        /ni le secrétariat, ni le curé, ni les administrateurs/i,
      ),
    ).toBeInTheDocument();
  });

  it('ouvre une conversation avec le bandeau adapté au prêtre et l’URL à jour', async () => {
    const user = userEvent.setup();
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    await user.click(
      await screen.findByRole('button', { name: /augustin ndiaye/i }),
    );

    expect(navigation.replace).toHaveBeenCalledWith(
      `/espace/${ids.saintDominique}/messagerie?c=${f7Ids.convNdiaye}`,
    );
    expect(
      await screen.findByRole('heading', { name: 'Augustin Ndiaye' }),
    ).toBeInTheDocument();
    const notice = screen.getByRole('note');
    expect(notice).toHaveTextContent(
      /proposez-lui un rendez-vous en présentiel/i,
    );
    expect(
      within(notice).getByRole('link', { name: 'Voir les créneaux' }),
    ).toHaveAttribute('href', `/espace/${ids.saintDominique}/confessions`);
  });

  it('filtre les non lues et archive une conversation', async () => {
    const user = userEvent.setup();
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    await user.click(await screen.findByRole('button', { name: /non lues/i }));
    const list = screen.getByRole('list', { name: 'Conversations' });
    expect(within(list).queryByText('Augustin Ndiaye')).not.toBeInTheDocument();

    await user.click(
      within(list).getByRole('button', { name: /emmanuel tine/i }),
    );
    await user.click(await screen.findByRole('button', { name: 'Archiver' }));

    await vi.waitFor(() =>
      expect(f7State.conversations[0].is_archived).toBe(true),
    );
  });

  it('change ma disponibilité : absent jusqu’à une date', async () => {
    const user = userEvent.setup();
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    await user.click(
      await screen.findByRole('radio', { name: /absent jusqu.au/i }),
    );
    const date = screen.getByLabelText(/absent jusqu.au/i, {
      selector: 'input[type="date"]',
    });
    await user.type(date, '2099-10-02');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await vi.waitFor(() =>
      expect(f7State.availability.absent_until).toBe('2099-10-02'),
    );
    expect(
      await screen.findByText(/les fidèles voient : absent jusqu.au 02\.10/i),
    ).toBeInTheDocument();
  });
});
