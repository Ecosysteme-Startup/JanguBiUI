import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EventView } from '@/features/paroisse/components/event-view';
import { f5bIds, f5bState, resetF5bState } from '@/testing/mocks/db-f5b';
import { renderApp } from '@/testing/test-utils';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));

beforeEach(() => resetF5bState());

describe('Événement (/app/paroisse/evenements/[id])', () => {
  it('affiche l’événement et permet de s’inscrire puis de se désinscrire', async () => {
    const user = userEvent.setup();
    renderApp(<EventView id={String(f5bIds.evenementRecollection)} />);

    expect(await screen.findByRole('heading', { level: 1, name: /journée de récollection des ceb/i })).toBeInTheDocument();
    expect(screen.getByText('Dans 16 jours')).toBeInTheDocument();
    expect(screen.getByText('Abbaye de Keur Moussa')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '84 places réservées sur 120' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'M’inscrire' }));

    expect(await screen.findByText('Inscription enregistrée')).toBeInTheDocument();
    expect(f5bState.events[f5bIds.evenementRecollection].is_registered).toBe(true);
    expect(f5bState.lastRegistration).toEqual({ seats: 1, note: '' });

    await user.click(screen.getByRole('button', { name: /me désinscrire/i }));
    expect(await screen.findByRole('button', { name: 'M’inscrire' })).toBeInTheDocument();
  });

  it('refuse l’inscription à un événement complet', async () => {
    f5bState.events[f5bIds.evenementRecollection] = {
      ...f5bState.events[f5bIds.evenementRecollection],
      is_full: true,
      registrations_count: 90,
      seats_taken: 120,
      seats_remaining: 0,
    };
    renderApp(<EventView id={String(f5bIds.evenementRecollection)} />);

    expect(await screen.findByRole('button', { name: 'Complet' })).toBeDisabled();
    expect(screen.getByRole('img', { name: '120 places réservées sur 120' })).toBeInTheDocument();
  });

  it('inscrit plusieurs personnes avec une remarque, puis met à jour l’inscription', async () => {
    const user = userEvent.setup();
    renderApp(<EventView id={String(f5bIds.evenementRecollection)} />);

    const seats = await screen.findByLabelText(/personnes/i);
    await user.clear(seats);
    await user.type(seats, '2');
    await user.type(screen.getByLabelText(/remarque/i), 'Ma tante marche avec une canne.');
    await user.click(screen.getByRole('button', { name: 'M’inscrire' }));

    expect(await screen.findByText(/2 personnes\. Un rappel/)).toBeInTheDocument();
    expect(f5bState.lastRegistration).toEqual({ seats: 2, note: 'Ma tante marche avec une canne.' });
    expect(screen.getByRole('img', { name: '86 places réservées sur 120' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Modifier mon inscription' }));
    const again = screen.getByLabelText(/personnes/i);
    expect(again).toHaveValue(2);
    await user.clear(again);
    await user.type(again, '3');
    await user.click(screen.getByRole('button', { name: 'Mettre à jour' }));

    expect(await screen.findByText(/3 personnes\. Un rappel/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '87 places réservées sur 120' })).toBeInTheDocument();
  });

  it('borne le nombre de personnes aux places restantes', async () => {
    f5bState.events[f5bIds.evenementRecollection] = { ...f5bState.events[f5bIds.evenementRecollection], seats_taken: 118, seats_remaining: 2 };
    const user = userEvent.setup();
    renderApp(<EventView id={String(f5bIds.evenementRecollection)} />);

    const seats = await screen.findByLabelText(/personnes/i);
    await user.clear(seats);
    await user.type(seats, '3');
    await user.click(screen.getByRole('button', { name: 'M’inscrire' }));

    expect(await screen.findByText('2 personnes au plus.')).toBeInTheDocument();
    expect(f5bState.lastRegistration).toBeNull();
  });

  it('affiche la clôture et refuse l’inscription une fois close', async () => {
    f5bState.events[f5bIds.evenementRecollection] = {
      ...f5bState.events[f5bIds.evenementRecollection],
      registration_closes_at: '2026-10-05T18:00:00',
      registrations_open: false,
    };
    renderApp(<EventView id={String(f5bIds.evenementRecollection)} />);

    expect(await screen.findByText('Clôture le 5 octobre à 18 h')).toBeInTheDocument();
    expect(screen.getByText('Les inscriptions sont closes.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'M’inscrire' })).not.toBeInTheDocument();
  });

  it('prévient qu’un événement a été annulé', async () => {
    f5bState.events[f5bIds.evenementChorale] = { ...f5bState.events[f5bIds.evenementChorale], is_cancelled: true };
    renderApp(<EventView id={String(f5bIds.evenementChorale)} />);

    expect(await screen.findByText('Événement annulé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'M’inscrire' })).not.toBeInTheDocument();
  });
});
