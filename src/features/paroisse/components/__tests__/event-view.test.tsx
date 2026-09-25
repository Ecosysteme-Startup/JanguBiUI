import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EventView } from '@/features/paroisse/components/event-view';
import { f5bIds, f5bState, resetF5bState } from '@/testing/mocks/db-f5b';
import { renderApp } from '@/testing/test-utils';

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

    await user.click(screen.getByRole('button', { name: /me désinscrire/i }));
    expect(await screen.findByRole('button', { name: 'M’inscrire' })).toBeInTheDocument();
  });

  it('refuse l’inscription à un événement complet', async () => {
    f5bState.events[f5bIds.evenementRecollection] = { ...f5bState.events[f5bIds.evenementRecollection], is_full: true, registrations_count: 120 };
    renderApp(<EventView id={String(f5bIds.evenementRecollection)} />);

    expect(await screen.findByRole('button', { name: 'Complet' })).toBeDisabled();
    expect(screen.getByRole('img', { name: '120 places réservées sur 120' })).toBeInTheDocument();
  });

  it('prévient qu’un événement a été annulé', async () => {
    f5bState.events[f5bIds.evenementChorale] = { ...f5bState.events[f5bIds.evenementChorale], is_cancelled: true };
    renderApp(<EventView id={String(f5bIds.evenementChorale)} />);

    expect(await screen.findByText('Événement annulé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'M’inscrire' })).not.toBeInTheDocument();
  });
});
