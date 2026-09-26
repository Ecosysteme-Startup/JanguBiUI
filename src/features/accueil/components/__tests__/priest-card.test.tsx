import { screen, within } from '@testing-library/react';

import { PriestCard } from '@/features/accueil/components/priest-card';
import { RosaryCard } from '@/features/accueil/components/rosary-card';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { renderApp } from '@/testing/test-utils';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));
beforeEach(() => resetF5bState());

describe('Accueil fidèle', () => {
  it('présente un prêtre de la paroisse suivie avec son office', async () => {
    renderApp(<PriestCard number="04" />);

    const card = screen.getByRole('region', { name: /parler à un prêtre/i });
    expect(await within(card).findByText('Emmanuel Tine')).toBeInTheDocument();
    expect(within(card).getByText('Vicaire, Saint-Dominique')).toBeInTheDocument();
  });

  it('annonce les mystères du jour', async () => {
    renderApp(<RosaryCard number="05" />);

    expect(await screen.findByText('Mystères lumineux')).toBeInTheDocument();
  });
});
