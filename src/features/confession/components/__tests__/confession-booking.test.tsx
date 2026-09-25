import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ConfessionBooking } from '@/features/confession/components/confession-booking';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { f7State, resetF7State } from '@/testing/mocks/db-f7-pretre';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f7PretreHandlers));

beforeEach(() => {
  resetF7State();
  // Jeudi 24 septembre 2026 : la semaine des maquettes, créneaux le samedi 26.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-24T10:00:00') });
});
afterEach(() => vi.useRealTimers());

const renderBooking = () =>
  renderApp(
    <ConfessionBooking
      nodeId={ids.saintDominique}
      parishName="Saint-Dominique"
    />,
  );

describe('ConfessionBooking (FID-Confession-RDV)', () => {
  it('ne propose AUCUN champ de contenu : seulement le prêtre, le jour et le créneau (RG-08)', async () => {
    const user = userEvent.setup();
    renderBooking();

    await user.click(await screen.findByRole('button', { name: /16 h 40/ }));

    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(
      document.querySelectorAll(
        'textarea, input[type="text"], input:not([type])',
      ),
    ).toHaveLength(0);
    expect(
      screen.getByText('Aucun contenu n’est demandé.'),
    ).toBeInTheDocument();
  });

  it('réserve un créneau en n’envoyant que son identifiant', async () => {
    const user = userEvent.setup();
    renderBooking();

    const days = await screen.findByRole('group', {
      name: /jours de la semaine du 21 au 27 septembre/i,
    });
    expect(
      within(days).getByRole('button', {
        name: /samedi 26 septembre, 12 créneaux libres/i,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(days).getByRole('button', { name: /lundi 21 septembre : passé/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /16 h 40/ }));
    expect(
      screen.getByRole('heading', { name: /samedi 26 septembre, 16 h 40/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Confirmer le rendez-vous' }),
    );

    await vi.waitFor(() =>
      expect(f7State.bookingBodies).toEqual([{ slot_id: 104 }]),
    );
    const mine = await screen.findByRole('list', {
      name: 'Mes rendez-vous à venir',
    });
    expect(
      within(mine).getByText('Confession · Abbé Augustin Ndiaye'),
    ).toBeInTheDocument();
  });

  it('filtre les créneaux par prêtre', async () => {
    const user = userEvent.setup();
    renderBooking();

    await user.click(
      await screen.findByRole('radio', { name: 'Père Emmanuel Tine' }),
    );

    const grid = screen.getByRole('group', {
      name: /créneaux du samedi 26 septembre/i,
    });
    expect(within(grid).getAllByRole('button')).toHaveLength(6);
    expect(within(grid).queryByText('A. Ndiaye')).not.toBeInTheDocument();
  });

  it('explique qu’un créneau vient d’être pris (409)', async () => {
    server.use(
      http.post(apiUrl('/confessions/bookings/'), () =>
        HttpResponse.json(
          {
            error: {
              code: 'slot_taken',
              message: 'Ce créneau vient d’être pris.',
              details: {},
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderBooking();

    await user.click(await screen.findByRole('button', { name: /16 h 10/ }));
    await user.click(
      screen.getByRole('button', { name: 'Confirmer le rendez-vous' }),
    );

    expect(
      await screen.findByText('Ce créneau vient d’être pris'),
    ).toBeInTheDocument();
  });

  it('annule un rendez-vous à venir après confirmation', async () => {
    const user = userEvent.setup();
    renderBooking();
    await user.click(await screen.findByRole('button', { name: /17 h 20/ }));
    await user.click(
      screen.getByRole('button', { name: 'Confirmer le rendez-vous' }),
    );

    await user.click(
      await screen.findByRole('button', {
        name: /annuler le rendez-vous du samedi 26 septembre/i,
      }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Annuler le rendez-vous' }),
    );

    await vi.waitFor(() => expect(f7State.cancelledBookings).toEqual([900]));
    expect(
      await screen.findByText('Aucun rendez-vous à venir.'),
    ).toBeInTheDocument();
  });

  it('demande de choisir une paroisse quand aucune n’est suivie', () => {
    renderApp(<ConfessionBooking nodeId={null} />);
    expect(
      screen.getByText('Choisissez d’abord votre paroisse'),
    ).toBeInTheDocument();
  });
});
