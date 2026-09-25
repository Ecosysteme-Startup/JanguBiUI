import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfessionsPlanning } from '@/features/confessions-planning/components/confessions-planning';
import type { Grant } from '@/lib/capacites';
import { grantsSecretaire, ids } from '@/testing/mocks/db';
import { f7State, resetF7State } from '@/testing/mocks/db-f7-pretre';
import { renderApp } from '@/testing/test-utils';

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

    const bookings = await screen.findByRole('list', {
      name: /rendez-vous du samedi 26 septembre/i,
    });
    expect(within(bookings).getByText('R. D.')).toBeInTheDocument();
    expect(within(bookings).getByText('A. K.')).toBeInTheDocument();
    expect(screen.queryByText('Aminata Kane')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /créneaux récurrents/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /annuler le rendez-vous/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/aucun motif demandé/i)).toBeInTheDocument();
  });

  it('prêtre : annule un de ses rendez-vous en prévenant la personne', async () => {
    const user = userEvent.setup();
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsPretre,
    });

    await user.click(
      await screen.findByRole('button', {
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
      await screen.findByRole('button', { name: 'Créneaux récurrents' }),
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

  it('prêtre : refuse une plage dont la fin précède le début', async () => {
    const user = userEvent.setup();
    renderApp(<ConfessionsPlanning nodeId={ids.saintDominique} />, {
      capacites: grantsPretre,
    });

    await user.click(
      await screen.findByRole('button', { name: 'Créneaux récurrents' }),
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
});
