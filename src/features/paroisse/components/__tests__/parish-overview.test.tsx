import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ParishOverview } from '@/features/paroisse/components/parish-overview';
import { apiUrl } from '@/testing/mocks/api-url';
import { me } from '@/testing/mocks/db';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));

beforeEach(() => resetF5bState());

describe('Ma paroisse (/app/paroisse)', () => {
  it('présente la paroisse suivie et ses sections ancrées : annonces, horaires, agenda', async () => {
    const { container } = renderApp(<ParishOverview />);

    expect(await screen.findByRole('heading', { level: 1, name: /saint-dominique/i })).toBeInTheDocument();
    expect(await screen.findByText(/point e, dakar · archidiocèse de dakar/i)).toBeInTheDocument();
    ['annonces', 'horaires', 'agenda'].forEach((id) => expect(container.querySelector(`#${id}`)).not.toBeNull());

    const annonces = screen.getByRole('region', { name: /annonces/i });
    expect(await within(annonces).findByRole('link', { name: /quête impérée/i })).toBeInTheDocument();
    expect(within(annonces).getAllByRole('listitem')).toHaveLength(3);

    const horaires = screen.getByRole('region', { name: /horaires de la semaine/i });
    expect(await within(horaires).findByRole('heading', { name: 'Église Saint-Dominique' })).toBeInTheDocument();
    expect(within(horaires).getByText(/16 h-18 h/)).toBeInTheDocument();
    expect(within(horaires).getByText(/adoration du jeudi/i)).toBeInTheDocument();

    const agenda = screen.getByRole('region', { name: /agenda/i });
    expect(await within(agenda).findByRole('link', { name: /journée de récollection des ceb/i })).toHaveAttribute('href', '/app/paroisse/evenements/42');

    const clerge = screen.getByRole('region', { name: /clergé et secrétariat/i });
    expect(await within(clerge).findByRole('link', { name: /écrire à emmanuel tine/i })).toBeInTheDocument();
  });

  it('filtre les annonces du dimanche', async () => {
    const user = userEvent.setup();
    renderApp(<ParishOverview />);

    const annonces = await screen.findByRole('region', { name: /annonces/i });
    await user.click(await within(annonces).findByRole('button', { name: /annonces du dimanche/i }));

    expect(within(annonces).getAllByRole('listitem')).toHaveLength(1);
    expect(within(annonces).getByRole('link', { name: /quête impérée/i })).toBeInTheDocument();
  });

  it('invite à choisir une paroisse quand aucune n’est suivie', async () => {
    server.use(http.get(apiUrl('/me/'), () => HttpResponse.json({ ...me, paroisse_suivie: null })));
    renderApp(<ParishOverview />);

    expect(await screen.findByText('Vous ne suivez encore aucune paroisse.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /choisir ma paroisse/i })).toHaveAttribute('href', '/app/profil');
  });

  it('accepte la réponse réelle de /me/ (paroisse sans code ni type)', async () => {
    server.use(
      http.get(apiUrl('/me/'), () => HttpResponse.json({ ...me, paroisse_suivie: { id: me.paroisse_suivie.id, name: 'Saint-Dominique' } })),
    );
    renderApp(<ParishOverview />);

    expect(await screen.findByRole('heading', { level: 1, name: /saint-dominique/i })).toBeInTheDocument();
  });

  it('signale une erreur de chargement des annonces', async () => {
    server.use(http.get(apiUrl('/news/'), () => HttpResponse.json({}, { status: 500 })));
    renderApp(<ParishOverview />);

    expect(await screen.findByText('Les annonces n’ont pas pu être chargées.')).toBeInTheDocument();
  });
});
