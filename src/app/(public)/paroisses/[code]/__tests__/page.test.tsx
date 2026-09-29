import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { publicParish } from '@/testing/mocks/db-dons';
import { directoryHandler, f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import FicheParoissePage from '../page';

beforeEach(() => server.use(...f4PublicHandlers, directoryHandler));

const renderPage = async () => renderApp(await FicheParoissePage({ params: Promise.resolve({ code: 'DAK-SAINT-DOMINIQUE' }) }));

describe('Fiche paroisse : bloc « Soutenir la paroisse »', () => {
  it('suit les démarches et mène au don public de la paroisse', async () => {
    await renderPage();

    const aside = await screen.findByRole('complementary', { name: /prochaine messe, contact, clergé et démarches/i });
    const bloc = await within(aside).findByRole('region', { name: 'Soutenir la paroisse' });
    expect(within(bloc).getByRole('link', { name: 'Faire un don' })).toHaveAttribute('href', '/paroisses/DAK-SAINT-DOMINIQUE/don');
    expect(bloc).toHaveTextContent(/décision du 1er juin 2026/);
  });

  it('est absent quand la collecte n’est pas ouverte', async () => {
    server.use(http.get(apiUrl('/public/dons/paroisses/:nodeId/'), () => HttpResponse.json({ ...publicParish(), enabled: false })));
    await renderPage();

    await screen.findByRole('heading', { level: 1, name: 'Paroisse Saint-Dominique' });
    expect(screen.queryByRole('region', { name: 'Soutenir la paroisse' })).not.toBeInTheDocument();
  });
});
