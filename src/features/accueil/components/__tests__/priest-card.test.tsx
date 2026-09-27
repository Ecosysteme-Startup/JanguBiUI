import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { PriestCard } from '@/features/accueil/components/priest-card';
import { RosaryCard } from '@/features/accueil/components/rosary-card';
import { apiUrl } from '@/testing/mocks/api-url';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));
beforeEach(() => resetF5bState());

describe('Accueil fidèle', () => {
  it('reprend la dernière conversation non lue, avec l’autre participant et la mention de confidentialité', async () => {
    renderApp(<PriestCard />);

    const card = screen.getByRole('region', { name: /parler à un prêtre/i });
    const link = await within(card).findByRole('link', { name: /emmanuel tine/i });
    expect(link).toHaveAttribute('href', expect.stringMatching(/^\/app\/pretres\/conversations\//));
    expect(within(link).getByText(/pouvez-vous passer me voir/i)).toBeInTheDocument();
    expect(within(link).getByText('1 message non lu')).toBeInTheDocument();
    expect(within(link).getByText(/aucun administrateur n.y a accès/i)).toBeInTheDocument();
    expect(within(card).queryByText(/bout en bout/i)).not.toBeInTheDocument();
  });

  it('sans conversation, présente un prêtre de la paroisse suivie avec son office', async () => {
    server.use(http.get(apiUrl('/messaging/conversations/'), () => HttpResponse.json([])));
    renderApp(<PriestCard />);

    const card = screen.getByRole('region', { name: /parler à un prêtre/i });
    expect(await within(card).findByText('Emmanuel Tine')).toBeInTheDocument();
    expect(within(card).getByText('Vicaire · Saint-Dominique')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Écrire' })).toHaveAttribute('href', '/app/pretres');
  });

  it('annonce les mystères du jour', async () => {
    renderApp(<RosaryCard />);

    expect(await screen.findByText('Mystères lumineux')).toBeInTheDocument();
  });
});
