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
    expect(within(detail).getByRole('img', { name: '3 places réservées sur 60' })).toBeInTheDocument();
    expect(within(detail).getByText(/57 places restantes · clôture jeu\. 08\.10 à 18 h/)).toBeInTheDocument();
    expect(await within(detail).findByText('Thérèse Ndione')).toBeInTheDocument();
    expect(within(detail).getByText('· 2 personnes')).toBeInTheDocument();
    expect(within(detail).getByText('« Une place à l’avant du car. »')).toBeInTheDocument();
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

  it('fixe la clôture des inscriptions et refuse une clôture après la fin', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /nouvel événement/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Nouvel événement' });
    await user.type(within(dialog).getByLabelText(/^titre/i), 'Récollection');
    await user.type(within(dialog).getByLabelText(/début, date/i), '2026-10-10');
    await user.type(within(dialog).getByLabelText(/début, heure/i), '08:30');
    await user.type(within(dialog).getByLabelText(/fin, date/i), '2026-10-10');
    await user.type(within(dialog).getByLabelText(/fin, heure/i), '16:00');
    await user.type(within(dialog).getByLabelText(/clôture des inscriptions, date/i), '2026-10-11');
    await user.type(within(dialog).getByLabelText(/clôture, heure/i), '18:00');
    await user.click(within(dialog).getByRole('button', { name: 'Créer l’événement' }));

    expect(await within(dialog).findByText('La clôture doit précéder la fin de l’événement.')).toBeInTheDocument();
    expect(f8aState.lastBody).toBeNull();

    const closes = within(dialog).getByLabelText(/clôture des inscriptions, date/i);
    await user.clear(closes);
    await user.type(closes, '2026-10-08');
    await user.click(within(dialog).getByRole('button', { name: 'Créer l’événement' }));

    await vi.waitFor(() => expect(f8aState.lastBody).not.toBeNull());
    expect(String((f8aState.lastBody as { registration_closes_at: string }).registration_closes_at)).toMatch(/^2026-10-08T18:00:00/);
  });

  it('demande la période affichée et enchaîne les pages au-delà de 50 événements', async () => {
    const base = f8aState.events[1];
    f8aState.events = Array.from({ length: 55 }, (_, i) => ({ ...base, id: 1000 + i, title: `Messe ${i}` }));
    const user = userEvent.setup();
    await renderPage();
    await openOctober(user);

    expect(await screen.findByText(/55 événements en octobre/)).toBeInTheDocument();
    const october = f8aState.agendaQueries.filter((q) => q.from === '2026-09-28');
    expect(october.map((q) => q.offset).sort()).toEqual(['0', '50']);
    expect(october[0]).toMatchObject({ to: '2026-11-01', limit: '50' });
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
