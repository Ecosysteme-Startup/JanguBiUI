import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { publicParish } from '@/testing/mocks/db-dons';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { MaParoisse } from '../ma-paroisse';

beforeEach(() => {
  server.use(...f5bHandlers);
  resetF5bState();
});

describe('Ma paroisse : bloc « Soutenir la paroisse »', () => {
  it('ferme la colonne de droite, sous le contact et l’extrait d’acte, et mène au don', async () => {
    renderApp(<MaParoisse />);

    const aside = await screen.findByRole('complementary', { name: 'Informations pratiques' });
    const bloc = await within(aside).findByRole('region', { name: 'Soutenir la paroisse' });
    expect(within(bloc).getByRole('link', { name: 'Faire un don' })).toHaveAttribute('href', '/app/dons');
    expect(bloc).toHaveTextContent(/réf\. ARCH-DAK-2026-041/);
    expect(aside.lastElementChild).toBe(bloc);
  });

  it('est absent quand la collecte n’est pas ouverte', async () => {
    let served = false;
    server.use(
      http.get(apiUrl('/public/dons/paroisses/:nodeId/'), () => {
        served = true;
        return HttpResponse.json({ ...publicParish(), enabled: false });
      }),
    );
    renderApp(<MaParoisse />);

    await screen.findByRole('complementary', { name: 'Informations pratiques' });
    await vi.waitFor(() => expect(served).toBe(true));
    expect(screen.queryByRole('region', { name: 'Soutenir la paroisse' })).not.toBeInTheDocument();
  });
});
