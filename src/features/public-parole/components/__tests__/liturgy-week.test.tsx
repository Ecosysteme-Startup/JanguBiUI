import { screen, within } from '@testing-library/react';

import { LiturgyWeek } from '@/features/public-parole/components/liturgy-week';
import { renderApp } from '@/testing/test-utils';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

describe('Calendrier liturgique de la semaine', () => {
  it('présente les sept jours de la semaine, aujourd’hui marqué', async () => {
    renderApp(<LiturgyWeek />);

    const week = within(await screen.findByRole('list', { name: 'Jours de la semaine liturgique' }));
    const days = week.getAllByRole('listitem');
    expect(days).toHaveLength(7);
    expect(days[3]).toHaveAttribute('aria-current', 'date');
    expect(days[3]).toHaveTextContent('Jeu. 24 · auj.');
    expect(await within(days[6]).findByText(/dimanche \(A\)/)).toBeInTheDocument();
  });
});
