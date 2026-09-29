import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QueueView } from '@/features/actes-traitement/components/queue-view';
import { ids } from '@/testing/mocks/db';
import { ACTE_IDS, actesState, resetActes } from '@/testing/mocks/db-f6-actes';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...actesHandlers));

const base = `/espace/${ids.saintDominique}/demandes`;

beforeEach(() => {
  resetActes();
  navigation.replace.mockClear();
});

describe('PAR-Demandes', () => {
  it('affiche la file avec les compteurs par statut', async () => {
    renderApp(<QueueView nodeId={ids.saintDominique} />);

    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(within(table).getByRole('link', { name: 'DOC-20260921-00412' })).toHaveAttribute('href', `${base}/${ACTE_IDS.verification}`);
    expect(within(table).getByTitle('En retard')).toHaveTextContent(/j, en retard$/);
    expect(await screen.findByRole('button', { name: /^toutes 6/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^soumises 1/i })).toBeInTheDocument();
  });

  it('accorde le nombre de demandes au pied de la file (« 1 demande », « 6 demandes »)', async () => {
    const { unmount } = renderApp(<QueueView nodeId={ids.saintDominique} />);
    expect(await screen.findByText('6 demandes')).toBeInTheDocument();
    unmount();

    actesState.requests = actesState.requests.slice(0, 1);
    renderApp(<QueueView nodeId={ids.saintDominique} />);
    expect(await screen.findByText('1 demande')).toBeInTheDocument();
  });

  it('filtre par statut, type et retard, et garde les filtres dans l’URL', async () => {
    const user = userEvent.setup();
    renderApp(<QueueView nodeId={ids.saintDominique} />);
    await screen.findByRole('table');

    await user.click(await screen.findByRole('button', { name: /^en vérification/i }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${base}?statut=under_verification`, { scroll: false });
    await vi.waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2));

    await user.selectOptions(screen.getByLabelText('Type d’acte'), 'baptism');
    expect(navigation.replace).toHaveBeenLastCalledWith(`${base}?statut=under_verification&type=baptism`, { scroll: false });

    await user.click(screen.getByRole('button', { name: /en retard/i }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${base}?statut=under_verification&type=baptism&retard=1`, { scroll: false });
    await vi.waitFor(() => expect(within(screen.getByRole('table')).getByRole('link', { name: 'DOC-20260921-00412' })).toBeInTheDocument());
  });

  it('montre le motif et la personne assignée, et filtre par motif, période et assignation', async () => {
    const user = userEvent.setup();
    renderApp(<QueueView nodeId={ids.saintDominique} />);
    const table = await screen.findByRole('table');

    const row = within(table).getByRole('link', { name: 'DOC-20260921-00412' }).closest('tr') as HTMLElement;
    expect(within(row).getByTitle('Germaine Faye')).toHaveTextContent('G. Faye');
    expect(within(row).getByText(/· pour mariage religieux$/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Motif'), 'personal');
    expect(navigation.replace).toHaveBeenLastCalledWith(`${base}?motif=personal`, { scroll: false });
    await vi.waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2));
    expect(within(screen.getByRole('table')).getByRole('link', { name: 'DOC-20260904-00399' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Motif'), '');
    await user.selectOptions(screen.getByLabelText('Assignation'), 'aucun');
    expect(navigation.replace).toHaveBeenLastCalledWith(`${base}?assigne=aucun`, { scroll: false });
    await vi.waitFor(() => expect(within(screen.getByRole('table')).queryByRole('link', { name: 'DOC-20260921-00412' })).not.toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('Période de réception'), '7j');
    expect(navigation.replace).toHaveBeenLastCalledWith(`${base}?periode=7j&assigne=aucun`, { scroll: false });
  });

  it('garde les filtres dans le lien vers le détail (flèches précédent / suivant)', async () => {
    const user = userEvent.setup();
    renderApp(<QueueView nodeId={ids.saintDominique} />);
    await screen.findByRole('table');

    await user.selectOptions(screen.getByLabelText('Type d’acte'), 'baptism');
    await vi.waitFor(() =>
      expect(within(screen.getByRole('table')).getByRole('link', { name: 'DOC-20260921-00412' })).toHaveAttribute(
        'href',
        `${base}/${ACTE_IDS.verification}?type=baptism`,
      ),
    );
  });

  it('recherche par nom ou référence', async () => {
    const user = userEvent.setup();
    renderApp(<QueueView nodeId={ids.saintDominique} />);
    await screen.findByRole('table');

    await user.type(screen.getByLabelText(/filtrer la file par nom ou référence/i), '00399');

    await vi.waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${base}?q=00399`, { scroll: false });
  });

  it('présente un état vide quand aucun filtre ne correspond', async () => {
    const user = userEvent.setup();
    renderApp(<QueueView nodeId={ids.saintDominique} />);
    await screen.findByRole('table');

    await user.type(screen.getByLabelText(/filtrer la file/i), 'personne');

    expect(await screen.findByText('Aucune demande ne correspond.')).toBeInTheDocument();
  });

  it('passe en vérification les seules demandes sélectionnées qui le permettent', async () => {
    const user = userEvent.setup();
    renderApp(<QueueView nodeId={ids.saintDominique} />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('checkbox', { name: /sélectionner DOC-20260921-00412, en retard/i }));
    const toolbar = screen.getByRole('toolbar', { name: /actions sur la sélection/i });
    expect(within(toolbar).queryByRole('button', { name: /passer en vérification/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Sélectionner DOC-20260923-00419' }));
    await user.click(within(toolbar).getByRole('button', { name: /passer en vérification \(1\)/i }));

    await vi.waitFor(() => expect(actesState.requests.find((r) => r.id === ACTE_IDS.submitted)?.status).toBe('under_verification'));
    expect(actesState.lastTransition).toMatchObject({ id: ACTE_IDS.submitted, transition: 'start-verification' });
  });
});
