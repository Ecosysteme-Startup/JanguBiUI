import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QueueView } from '@/features/actes-traitement/components/queue-view';
import { ids } from '@/testing/mocks/db';
import { ACTE_IDS, actesState, resetActes } from '@/testing/mocks/db-f6-actes';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

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
    expect(within(table).getByText('En retard')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^toutes 6/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^soumises 1/i })).toBeInTheDocument();
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
    await vi.waitFor(() => expect(within(screen.getByRole('table')).getByText('DOC-20260921-00412')).toBeInTheDocument());
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
