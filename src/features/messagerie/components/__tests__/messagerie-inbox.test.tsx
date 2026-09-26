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
  it('liste d’abord les messages sans réponse et garde le bandeau confession, même sans conversation ouverte', async () => {
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    const pending = await screen.findByRole('list', { name: 'Sans réponse' });
    expect(within(pending).getByText('Emmanuel Tine')).toBeInTheDocument();
    expect(within(pending).getByText('1 message non lu')).toBeInTheDocument();
    expect(within(pending).queryByText('Augustin Ndiaye')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sans réponse 1' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('note')).toHaveTextContent('La confession ne se fait pas par message.');
    expect(screen.getByText(/ni le secrétariat, ni le curé, ni les administrateurs/i)).toBeInTheDocument();
    expect(screen.queryByText(/bout en bout/i)).not.toBeInTheDocument();
  });

  it('ouvre une conversation avec le bandeau adapté au prêtre et l’URL à jour', async () => {
    const user = userEvent.setup();
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    await user.click(await screen.findByRole('radio', { name: /toutes/i }));
    const answered = screen.getByRole('list', { name: 'Répondu récemment' });
    await user.click(within(answered).getByRole('button', { name: /augustin ndiaye/i }));

    expect(navigation.replace).toHaveBeenCalledWith(`/espace/${ids.saintDominique}/messagerie?c=${f7Ids.convNdiaye}`);
    expect(await screen.findByRole('heading', { name: 'Augustin Ndiaye' })).toBeInTheDocument();
    const notice = screen.getByRole('note');
    expect(notice).toHaveTextContent(/proposez-lui un rendez-vous de confession en présentiel/i);
    expect(within(notice).getByRole('link', { name: 'Voir les créneaux' })).toHaveAttribute(
      'href',
      `/espace/${ids.saintDominique}/confessions`,
    );
  });

  it('insère la réponse « rendez-vous de confession » sans l’envoyer', async () => {
    const user = userEvent.setup();
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    await user.click(await screen.findByRole('button', { name: /emmanuel tine/i }));
    await user.click(await screen.findByRole('button', { name: 'Proposer un rendez-vous de confession' }));

    expect(screen.getByLabelText(/votre message à emmanuel tine/i)).toHaveValue(
      'Pour la confession, venez en personne : réservez un créneau dans l’application, rubrique « Rendez-vous de confession ». Aucun motif n’est demandé.',
    );
    expect(f7State.sent).toEqual([]);
  });

  it('archive une conversation puis la retrouve dans « Archivées »', async () => {
    const user = userEvent.setup();
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    await user.click(await screen.findByRole('button', { name: /emmanuel tine/i }));
    await user.click(await screen.findByRole('button', { name: 'Archiver' }));

    await vi.waitFor(() => expect(f7State.conversations[0].is_archived).toBe(true));
    await user.click(await screen.findByRole('button', { name: 'Voir les archivées (1)' }));
    expect(await screen.findByRole('list', { name: 'Archivées' })).toHaveTextContent('Emmanuel Tine');
  });

  it('change ma disponibilité : absent jusqu’à une date', async () => {
    const user = userEvent.setup();
    renderApp(<MessagerieInbox nodeId={ids.saintDominique} />);

    await user.click(await screen.findByRole('button', { name: /les fidèles voient : joignable/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Ma disponibilité' });
    await user.click(within(dialog).getByRole('radio', { name: /absent jusqu.au/i }));
    const date = within(dialog).getByLabelText(/absent jusqu.au/i, { selector: 'input[type="date"]' });
    await user.type(date, '2099-10-02');
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await vi.waitFor(() => expect(f7State.availability.absent_until).toBe('2099-10-02'));
    expect(await within(dialog).findByText(/les fidèles voient : absent jusqu.au 02\.10/i)).toBeInTheDocument();
  });
});
