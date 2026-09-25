import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import HorairesPage from '@/app/espace/[nodeId]/horaires/page';
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
  renderApp(await HorairesPage({ params: Promise.resolve({ nodeId: ids.saintDominique }) }), { capacites });

beforeEach(() => resetF8a());

describe('Horaires et lieux de culte (PAR-Horaires)', () => {
  it('présente chaque lieu avec sa semaine type et les exceptions à venir', async () => {
    await renderPage();

    expect(await screen.findByRole('heading', { name: 'Église Saint-Dominique' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chapelle de la Cité universitaire' })).toBeInTheDocument();
    const eglise = await screen.findByRole('group', { name: 'Horaires hebdomadaires, Église Saint-Dominique' });
    expect(within(eglise).getByText('7 h 00')).toBeInTheDocument();
    expect(within(eglise).getByText('16 h-18 h')).toBeInTheDocument();
    expect(within(eglise).getByText('Étudiants')).toBeInTheDocument();
    expect(screen.getByText(/2 lieux de culte · 2 messes par semaine/)).toBeInTheDocument();
    expect(await screen.findByText('Pas de messe de 7 h 00')).toBeInTheDocument();
  });

  it('ajoute un horaire sur plusieurs jours en conservant la semaine existante', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /ajouter un horaire/i }));
    const panel = screen.getByRole('complementary', { name: 'Nouvel horaire' });
    await user.click(within(panel).getByRole('button', { name: 'Mardi' }));
    await user.click(within(panel).getByRole('button', { name: 'Jeudi' }));
    expect(within(panel).getByText('Chaque mardi, jeudi, hors exceptions.')).toBeInTheDocument();
    await user.type(within(panel).getByLabelText(/début/i), '18:30');
    await user.click(within(panel).getByRole('button', { name: 'Ajouter l’horaire' }));

    await vi.waitFor(() => expect(screen.queryByRole('complementary', { name: 'Nouvel horaire' })).not.toBeInTheDocument());
    const body = f8aState.lastBody as { items: { weekday: number; start_time: string; kind: string }[] };
    expect(body.items).toHaveLength(5);
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ weekday: 1, start_time: '18:30', kind: 'messe' }),
        expect.objectContaining({ weekday: 3, start_time: '18:30', kind: 'messe' }),
        expect.objectContaining({ weekday: 0, start_time: '07:00:00' }),
      ]),
    );
    expect(body.items.every((item) => !('id' in item))).toBe(true);
  });

  it('valide le formulaire : jours, début et chevauchement', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.click(await screen.findByRole('button', { name: /ajouter un horaire/i }));
    const panel = screen.getByRole('complementary', { name: 'Nouvel horaire' });

    await user.click(within(panel).getByRole('button', { name: 'Ajouter l’horaire' }));
    expect(await within(panel).findByText('Choisissez au moins un jour.')).toBeInTheDocument();
    expect(within(panel).getByText('Indiquez l’heure de début.')).toBeInTheDocument();

    await user.selectOptions(within(panel).getByLabelText(/lieu de culte/i), 'Chapelle de la Cité universitaire');
    await user.click(within(panel).getByRole('button', { name: 'Mercredi' }));
    await user.type(within(panel).getByLabelText(/début/i), '19:15');
    await user.type(within(panel).getByLabelText(/^fin/i), '20:45');
    await user.click(within(panel).getByRole('button', { name: 'Ajouter l’horaire' }));

    expect(
      await within(panel).findByText('Chevauche l’adoration de 20 h 30 à 21 h 30 le mercredi. Terminez au plus tard à 20 h 30.'),
    ).toBeInTheDocument();
    expect(f8aState.lastBody).toBeNull();
  });

  it('supprime un horaire de la semaine type', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Supprimer : messe du lundi à 7 h 00' }));

    await vi.waitFor(() => expect(f8aState.lastBody).not.toBeNull());
    const body = f8aState.lastBody as { items: { weekday: number }[] };
    expect(body.items.map((i) => i.weekday)).toEqual([5, 6]);
  });

  it('ajoute une exception et exige une heure pour un horaire supplémentaire', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /ajouter une exception/i }));
    const panel = screen.getByRole('complementary', { name: 'Nouvelle exception' });
    await user.type(within(panel).getByLabelText(/^date/i), '2099-10-04');
    await user.click(within(panel).getByRole('radio', { name: 'Horaire supplémentaire' }));
    await user.click(within(panel).getByRole('button', { name: 'Ajouter l’exception' }));
    expect(await within(panel).findByText('Un horaire supplémentaire doit avoir une heure de début.')).toBeInTheDocument();

    await user.type(within(panel).getByLabelText(/^début/i), '09:30');
    await user.type(within(panel).getByLabelText(/motif/i), 'Rentrée universitaire');
    await user.click(within(panel).getByRole('button', { name: 'Ajouter l’exception' }));

    await vi.waitFor(() => expect(f8aState.lastBody).toEqual({ date: '2099-10-04', kind: 'messe', cancelled: false, start_time: '09:30', end_time: null, note: 'Rentrée universitaire' }));
    expect(await screen.findByText(/rentrée universitaire/i)).toBeInTheDocument();
  });

  it('affiche proprement un refus du serveur à l’enregistrement', async () => {
    server.use(http.put(apiUrl('/hierarchy/places/:placeId/schedule/'), () => v1Error(403, 'permission_denied', 'Vous n’avez pas la capacité requise sur ce nœud.')));
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Supprimer : messe du lundi à 7 h 00' }));

    expect(await screen.findByText('Vous n’avez pas la capacité requise sur ce nœud.')).toBeInTheDocument();
  });

  it('refuse l’écran sans la capacité horaires.gerer', async () => {
    await renderPage(grantsChancelier);

    expect(await screen.findByText('Horaires et lieux de culte : accès réservé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ajouter un horaire/i })).not.toBeInTheDocument();
  });
});
