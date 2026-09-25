import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import AgendaPage from '@/app/espace/[nodeId]/agenda/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsChancelier, grantsSecretaire, ids } from '@/testing/mocks/db';
import { f8aState, resetF8a } from '@/testing/mocks/db-f8a';
import { v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

const renderPage = async (capacites = grantsSecretaire) =>
  renderApp(await AgendaPage({ params: Promise.resolve({ nodeId: ids.saintDominique }) }), { capacites });

/** Ouvre octobre 2026 (les données démo), depuis le « jeudi 24 septembre » de la maquette. */
const openOctober = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: 'Mois suivant : octobre' }));
  await screen.findByRole('heading', { name: 'Octobre 2026', level: 1 });
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-24T10:00:00'));
  resetF8a();
});
afterEach(() => vi.useRealTimers());

describe('Agenda (PAR-Agenda)', () => {
  it('affiche le mois, ses événements et leur détail avec les inscrits', async () => {
    const user = userEvent.setup();
    await renderPage();
    await openOctober(user);

    const day = screen.getByRole('group', { name: 'samedi 10 octobre' });
    await user.click(within(day).getByRole('button', { name: /récollection des ceb/i }));

    const detail = await screen.findByRole('region', { name: 'Journée de récollection des CEB' });
    expect(within(detail).getByText('Sam. 10.10 · 8 h 30-16 h')).toBeInTheDocument();
    expect(within(detail).getByRole('img', { name: '2 inscrits sur 60 places' })).toBeInTheDocument();
    expect(await within(detail).findByText('Thérèse Ndione')).toBeInTheDocument();
    expect(screen.getByText(/2 événements en octobre/)).toBeInTheDocument();
  });

  it('crée un événement et le sélectionne', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /nouvel événement/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Nouvel événement' });
    await user.type(within(dialog).getByLabelText(/^titre/i), 'Pèlerinage à Popenguine : préparation');
    await user.type(within(dialog).getByLabelText(/début, date/i), '2026-10-07');
    await user.type(within(dialog).getByLabelText(/début, heure/i), '19:00');
    await user.type(within(dialog).getByLabelText(/fin, date/i), '2026-10-07');
    await user.type(within(dialog).getByLabelText(/fin, heure/i), '20:30');
    await user.type(within(dialog).getByLabelText(/places disponibles/i), '40');
    await user.click(within(dialog).getByRole('button', { name: 'Créer l’événement' }));

    expect(await screen.findByRole('region', { name: /pèlerinage à popenguine/i })).toBeInTheDocument();
    expect(f8aState.lastBody).toMatchObject({
      node_id: ids.saintDominique,
      title: 'Pèlerinage à Popenguine : préparation',
      event_type: 'other',
      max_participants: 40,
      place_id: null,
    });
    expect(String((f8aState.lastBody as { start_at: string }).start_at)).toMatch(/^2026-10-07T19:00:00/);
  });

  it('refuse une fin avant le début', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /nouvel événement/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Nouvel événement' });
    await user.click(within(dialog).getByRole('button', { name: 'Créer l’événement' }));
    expect(await within(dialog).findByText('Le titre est obligatoire.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^titre/i), 'Veillée');
    await user.type(within(dialog).getByLabelText(/début, date/i), '2026-10-07');
    await user.type(within(dialog).getByLabelText(/début, heure/i), '21:00');
    await user.type(within(dialog).getByLabelText(/fin, date/i), '2026-10-07');
    await user.type(within(dialog).getByLabelText(/fin, heure/i), '20:00');
    await user.click(within(dialog).getByRole('button', { name: 'Créer l’événement' }));

    expect(await within(dialog).findByText('La fin doit suivre le début.')).toBeInTheDocument();
    expect(f8aState.lastBody).toBeNull();
  });

  it('modifie puis annule un événement', async () => {
    const user = userEvent.setup();
    await renderPage();
    await openOctober(user);
    await user.click(screen.getByRole('button', { name: /rentrée du catéchisme/i, pressed: false }));
    const detail = await screen.findByRole('region', { name: 'Rentrée du catéchisme' });

    await user.click(within(detail).getByRole('button', { name: /modifier/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Modifier l’événement' });
    const location = within(dialog).getByLabelText(/^lieu$/i);
    await user.clear(location);
    await user.type(location, 'Salle Saint-Jean');
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(f8aState.lastBody).toMatchObject({ location: 'Salle Saint-Jean' }));
    expect(f8aState.lastBody).not.toHaveProperty('node_id');

    await user.click(within(await screen.findByRole('region', { name: 'Rentrée du catéchisme' })).getByRole('button', { name: 'Annuler l’événement' }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Annuler cet événement ?' })).getByRole('button', { name: 'Annuler l’événement' }));

    expect(await screen.findByText('Événement annulé')).toBeInTheDocument();
    expect(f8aState.events.find((e) => e.id === 32)?.is_cancelled).toBe(true);
  });

  it('affiche un refus du serveur', async () => {
    server.use(http.get(apiUrl('/staff/agenda/'), () => v1Error(403, 'permission_denied', 'Vous ne pouvez pas gérer les événements de ce nœud.')));
    await renderPage();

    expect(await screen.findByText('Accès refusé')).toBeInTheDocument();
    expect(screen.getByText('Vous ne pouvez pas gérer les événements de ce nœud.')).toBeInTheDocument();
  });

  it('refuse l’écran sans la capacité evenements.gerer', async () => {
    await renderPage(grantsChancelier);

    expect(await screen.findByText('Agenda : accès réservé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nouvel événement/i })).not.toBeInTheDocument();
  });
});
