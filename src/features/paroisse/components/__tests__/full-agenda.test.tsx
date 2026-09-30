import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { AGENDA_PAGE_SIZE } from '@/features/paroisse/api/get-agenda';
import { FullAgenda } from '@/features/paroisse/components/full-agenda';
import { ParishOverview } from '@/features/paroisse/components/parish-overview';
import { apiUrl } from '@/testing/mocks/api-url';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));
beforeEach(() => resetF5bState());

const liste = () => screen.getByRole('region', { name: 'Événements à venir' });

describe('Agenda complet du fidèle (/app/paroisse/agenda)', () => {
  it('présente l’agenda de la paroisse suivie, trié par date, avec le lien vers le détail', async () => {
    const seen: URL[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/agenda/')) seen.push(new URL(request.url));
    });
    renderApp(<FullAgenda />);

    expect(screen.getByRole('heading', { level: 1, name: 'Agenda' })).toBeInTheDocument();
    const items = await within(liste()).findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(liste()).getByText('2 événements à venir')).toBeInTheDocument();
    expect(within(items[0]).getByRole('link', { name: /répétition de la chorale/i })).toHaveAttribute('href', '/app/paroisse/evenements/43');
    // Toujours filtré sur la paroisse suivie : sans `node`, le serveur renverrait toute la plateforme.
    expect(seen[0]?.searchParams.get('node')).toBeTruthy();
    expect(within(liste()).queryByText(/ordinations sacerdotales/i)).not.toBeInTheDocument();
    expect(seen[0]?.searchParams.get('limit')).toBe(String(AGENDA_PAGE_SIZE));
    server.events.removeAllListeners();
  });

  it('filtre par type d’événement', async () => {
    const user = userEvent.setup();
    renderApp(<FullAgenda />);
    await within(liste()).findAllByRole('listitem');

    const filtres = screen.getByRole('group', { name: 'Filtrer par type d’événement' });
    await user.click(within(filtres).getByRole('button', { name: 'Retraites' }));

    await waitFor(() => expect(within(liste()).getAllByRole('listitem')).toHaveLength(1));
    expect(within(liste()).getByRole('link', { name: /journée de récollection/i })).toBeInTheDocument();
    expect(within(filtres).getByRole('button', { name: 'Retraites' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(filtres).getByRole('button', { name: 'Messes' }));
    expect(await screen.findByText('Aucun événement de ce type à venir.')).toBeInTheDocument();
  });

  it('charge la page suivante à la demande', async () => {
    const user = userEvent.setup();
    const event = (id: number, day: number) => ({
      id,
      title: `Rencontre ${id}`,
      description: '',
      event_type: 'other',
      start_at: `2026-11-${String(day).padStart(2, '0')}T18:00:00Z`,
      end_at: `2026-11-${String(day).padStart(2, '0')}T20:00:00Z`,
      location: 'Salle paroissiale',
      node_id: null,
      node_name: 'Saint-Dominique',
      max_participants: null,
      registration_closes_at: null,
      registrations_count: 0,
      seats_taken: 0,
      seats_remaining: null,
      is_full: false,
      registrations_open: false,
      is_registered: false,
      my_seats: null,
      my_note: null,
      is_cancelled: false,
    });
    server.use(
      http.get(apiUrl('/agenda/'), ({ request }) => {
        const offset = Number(new URL(request.url).searchParams.get('offset') ?? 0);
        return offset === 0
          ? HttpResponse.json({ limit: 20, offset: 0, count: 3, next: `${apiUrl('/agenda/')}?offset=2`, previous: null, results: [event(1, 2), event(2, 3)] })
          : HttpResponse.json({ limit: 20, offset: 2, count: 3, next: null, previous: null, results: [event(3, 4)] });
      }),
    );
    renderApp(<FullAgenda />);

    expect(await within(liste()).findAllByRole('listitem')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Afficher plus d’événements' }));

    expect(await within(liste()).findByRole('link', { name: /rencontre 3/i })).toBeInTheDocument();
    expect(within(liste()).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Afficher plus d’événements' })).not.toBeInTheDocument();
  });

  it('signale une erreur de chargement', async () => {
    server.use(http.get(apiUrl('/agenda/'), () => HttpResponse.json({}, { status: 500 })));
    renderApp(<FullAgenda />);
    expect(await screen.findByText('L’agenda n’a pas pu être chargé.')).toBeInTheDocument();
  });

  it('est accessible depuis l’onglet Agenda de Ma paroisse (« Tout l’agenda »)', async () => {
    window.history.replaceState(null, '', '/app/paroisse#agenda');
    renderApp(<ParishOverview />);

    const agenda = await screen.findByRole('region', { name: 'Agenda' });
    expect(within(agenda).getByRole('link', { name: 'Tout l’agenda' })).toHaveAttribute('href', '/app/paroisse/agenda');
    // L’onglet reste celui de la paroisse : pas d’événement du diocèse.
    await within(agenda).findByRole('link', { name: /journée de récollection/i });
    expect(within(agenda).queryByText(/ordinations sacerdotales/i)).not.toBeInTheDocument();
    window.history.replaceState(null, '', '/');
  });
});
