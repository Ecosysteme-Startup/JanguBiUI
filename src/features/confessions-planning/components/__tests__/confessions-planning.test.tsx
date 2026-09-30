import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfessionsPlanning } from '@/features/confessions-planning/components/confessions-planning';
import type { Grant } from '@/lib/capacites';
import { grantsSecretaire, ids } from '@/testing/mocks/db';
import { f7State, resetF7State } from '@/testing/mocks/db-f7-pretre';
import { renderApp } from '@/testing/test-utils';
import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f7PretreHandlers));

const grantsPretre: Grant[] = [
  'confessions.gerer',
  'messagerie.recevoir_fideles',
].map((capacite) => ({
  capacite,
  node_id: ids.saintDominique,
  node_name: 'Saint-Dominique',
  node_type: 'paroisse',
  herite: false,
  office: 'vicaire',
  office_label: 'Vicaire paroissial',
}));

beforeEach(() => {
  resetF7State();
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-24T10:00:00') });
});
afterEach(() => vi.useRealTimers());

describe('ConfessionsPlanning (PAR-Confessions)', () => {
  it('secrétariat : planning en lecture, initiales seulement, aucune action', async () => {
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsSecretaire,
    });

    const grid = await screen.findByRole('grid', {
      name: /créneaux du samedi 26 septembre par confesseur/i,
    });
    expect(within(grid).getByText('R. D.')).toBeInTheDocument();
    expect(within(grid).getByText('A. K.')).toBeInTheDocument();
    expect(screen.queryByText('Aminata Kane')).not.toBeInTheDocument();
    expect(
      screen.getByText('2 réservés', { selector: 'strong' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /ouvrir des créneaux/i }),
    ).not.toBeInTheDocument();

    await userEvent.setup().click(
      within(grid).getByRole('button', { name: /17 h, pris par A\. K\./i }),
    );
    expect(
      screen.queryByRole('button', { name: /annuler le rendez-vous/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/aucun motif n’est demandé/i)).toBeInTheDocument();
  });

  it('prêtre : annule un de ses rendez-vous en prévenant la personne', async () => {
    const user = userEvent.setup();
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsPretre,
    });

    await user.click(
      await screen.findByRole('button', {
        name: /17 h, pris par aminata kane/i,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: /annuler le rendez-vous de 17 h \(aminata kane\)/i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Annuler et prévenir' }),
    );
    expect(
      await screen.findByText('Écrivez un mot pour prévenir la personne.'),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/message d.annulation à aminata kane/i),
      'Je ne pourrai pas vous recevoir.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Annuler et prévenir' }),
    );

    await vi.waitFor(() =>
      expect(f7State.cancelledSlots).toEqual([
        { slotId: 200, body: { message: 'Je ne pourrai pas vous recevoir.' } },
      ]),
    );
  });

  it('prêtre : crée des créneaux récurrents pour lui-même', async () => {
    const user = userEvent.setup();
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsPretre,
    });

    await user.click(
      await screen.findByRole('button', { name: 'Ouvrir des créneaux' }),
    );
    const panel = await screen.findByRole('region', {
      name: 'Nouveaux créneaux récurrents',
    });
    await user.selectOptions(
      await within(panel).findByLabelText(/^lieu/i),
      'Chapelle du Saint-Sacrement',
    );
    expect(
      within(panel).getByText(/12 créneaux par semaine/),
    ).toBeInTheDocument();
    await user.click(
      within(panel).getByRole('button', { name: 'Créer les créneaux' }),
    );

    await vi.waitFor(() =>
      expect(f7State.ruleBodies).toEqual([
        {
          place_id: 12,
          weekday: 5,
          start_time: '16:00',
          end_time: '18:00',
          slot_minutes: 10,
          valid_from: null,
          valid_to: null,
        },
      ]),
    );
  });

  it('résume les jours suivants et les paramètres déduits du planning', async () => {
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsPretre,
    });

    const settings = await screen.findByRole('region', { name: 'Paramètres' });
    expect(within(settings).getByText('10 min')).toBeInTheDocument();
    expect(within(settings).getByText(/^Samedi, 16:00 – /)).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Jours suivants' }),
    ).toHaveTextContent('Aucun créneau ouvert dans les semaines suivantes.');
  });

  it('prêtre : refuse une plage dont la fin précède le début', async () => {
    const user = userEvent.setup();
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsPretre,
    });

    await user.click(
      await screen.findByRole('button', { name: 'Ouvrir des créneaux' }),
    );
    const end = await screen.findByLabelText(/^à/i);
    await user.clear(end);
    await user.type(end, '15:00');

    expect(
      screen.getByText('Aucun créneau avec ces horaires.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Créer les créneaux' }),
    ).toBeDisabled();
    expect(f7State.ruleBodies).toHaveLength(0);
  });

  describe('présence à un rendez-vous passé', () => {
    // Samedi 26 septembre, 19 h : les rendez-vous de 16 h et 17 h sont passés.
    beforeEach(() => vi.setSystemTime(new Date('2026-09-26T19:00:00')));

    it('prêtre : note « Venu » sur SON rendez-vous passé et affiche l’état enregistré', async () => {
      const user = userEvent.setup();
      renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
        capacites: grantsPretre,
      });

      await user.click(
        await screen.findByRole('button', {
          name: /17 h, pris par aminata kane/i,
        }),
      );
      // Passé : plus d’annulation, seulement la présence ; aucun champ de contenu.
      expect(
        screen.queryByRole('button', { name: /annuler le rendez-vous/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      await user.click(
        screen.getByRole('button', {
          name: /venu au rendez-vous de 17 h \(aminata kane\)/i,
        }),
      );

      await vi.waitFor(() =>
        expect(f7State.attendance).toEqual([
          { bookingId: 2, body: { attended: true } },
        ]),
      );
      await vi.waitFor(() =>
        expect(
          screen.queryByRole('button', { name: /venu au rendez-vous/i }),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByText('Venu')).toBeInTheDocument();
    });

    it('prêtre : note « Absent »', async () => {
      const user = userEvent.setup();
      renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
        capacites: grantsPretre,
      });

      await user.click(
        await screen.findByRole('button', {
          name: /17 h, pris par aminata kane/i,
        }),
      );
      await user.click(
        screen.getByRole('button', { name: /absent au rendez-vous de 17 h/i }),
      );

      await vi.waitFor(() =>
        expect(f7State.attendance).toEqual([
          { bookingId: 2, body: { attended: false } },
        ]),
      );
      await vi.waitFor(() =>
        expect(
          screen.queryByRole('button', { name: /absent au rendez-vous/i }),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByText('Absent')).toBeInTheDocument();
    });

    it('ni sur le rendez-vous d’un autre prêtre, ni pour le secrétariat', async () => {
      const user = userEvent.setup();
      const { unmount } = renderApp(
        <ConfessionsPlanning nodeId={ids.saintDominique} />,
        { capacites: grantsPretre },
      );
      await user.click(
        await screen.findByRole('button', { name: /16 h, pris par r\. d\./i }),
      );
      expect(
        screen.queryByRole('button', { name: /^venu/i }),
      ).not.toBeInTheDocument();
      unmount();

      renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
        capacites: grantsSecretaire,
      });
      await user.click(
        await screen.findByRole('button', { name: /17 h, pris par A\. K\./i }),
      );
      expect(
        screen.queryByRole('button', { name: /^venu/i }),
      ).not.toBeInTheDocument();
      expect(f7State.attendance).toHaveLength(0);
    });
  });

  it('prêtre : pas de présence à noter sur un rendez-vous à venir', async () => {
    const user = userEvent.setup();
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsPretre,
    });

    await user.click(
      await screen.findByRole('button', { name: /17 h, pris par aminata kane/i }),
    );
    expect(
      screen.getByRole('button', { name: /annuler le rendez-vous de 17 h/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^venu/i })).not.toBeInTheDocument();
  });
});
