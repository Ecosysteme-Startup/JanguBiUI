import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { ParoleDuJour } from '@/features/public-parole/components/parole-du-jour';
import { apiUrl } from '@/testing/mocks/api-url';
import { aelfSundayDay } from '@/testing/mocks/db-aelf';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => {
  server.use(...f4PublicHandlers);
  server.use(http.get(apiUrl('/liturgy/:day/'), () => HttpResponse.json(aelfSundayDay)));
});

describe('Parole du jour publique — source AELF telle quelle', () => {
  it('affiche titres, intro, refrain, acclamation de aelf, la deuxième lecture et un HTML assaini', async () => {
    const { container } = renderApp(<ParoleDuJour date="2026-09-27" />);

    expect(await screen.findByRole('heading', { level: 2, name: /première lecture : lecture du livre du prophète amos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /deuxième lecture : lecture de la première lettre/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /antienne x/i })).toBeInTheDocument();
    expect(screen.getByText('En ces jours-là (fixture),')).toBeInTheDocument();
    expect(screen.getByText('Refrain (Ps 145, 1)')).toBeInTheDocument();
    expect(screen.getByText('Acclamation (cf. 2 Co 8, 9)')).toBeInTheDocument();
    // Pas de titre AELF pour l'Évangile : le genre seul, rien de composé depuis le livre.
    expect(screen.getByRole('heading', { level: 2, name: 'Évangile : Lc 16, 19-31' })).toBeInTheDocument();
    expect(screen.queryByText(/selon saint luc/i)).toBeNull();
    expect(container.querySelector('#parole-textes script, #parole-textes [onclick]')).toBeNull();
    expect(screen.getAllByText('Textes liturgiques : AELF.').length).toBeGreaterThan(0);
  });
});
