import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import FideleHomePage from '@/app/app/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => resetF5bState());

describe('Accueil fidèle (/app)', () => {
  it('salue la personne et compose Parole, demande, paroisse, prêtre et chapelet', async () => {
    renderApp(<FideleHomePage />);

    expect(await screen.findByRole('heading', { level: 1, name: /jàmm ak jàmm, marie-thérèse/i })).toBeInTheDocument();

    const parole = screen.getByRole('region', { name: /la parole du jour/i });
    expect(await within(parole).findByText('Évangile · Lc 9, 7-9')).toBeInTheDocument();
    expect(within(parole).getByRole('link', { name: /lire les lectures du jour/i })).toHaveAttribute('href', '/app/parole');

    const demande = screen.getByRole('region', { name: /ma demande en cours/i });
    expect(await within(demande).findByText('JB-2026-00412')).toBeInTheDocument();
    expect(within(demande).getByText('Sainte-Thérèse de Grand-Dakar')).toBeInTheDocument();
    expect(within(demande).getByText(/étape 2 \/ 4/i)).toBeInTheDocument();

    const paroisse = screen.getByRole('region', { name: /saint-dominique cette semaine/i });
    expect(await within(paroisse).findByRole('link', { name: /quête impérée/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/app\/paroisse\/annonces\//),
    );
    expect(await within(paroisse).findByText('Prochaine messe')).toBeInTheDocument();
    expect(await within(paroisse).findByRole('link', { name: /journée de récollection|répétition de la chorale/i })).toBeInTheDocument();

    const pretre = screen.getByRole('region', { name: /parler à un prêtre/i });
    expect(await within(pretre).findByText('Emmanuel Tine')).toBeInTheDocument();
    expect(within(pretre).getByRole('link', { name: /prendre rendez-vous/i })).toHaveAttribute('href', '/app/confession');

    expect(await screen.findByText('Mystères lumineux')).toBeInTheDocument();
  });

  it('propose de demander un acte quand aucune demande n’est en cours', async () => {
    server.use(
      http.get(apiUrl('/documents/requests/'), () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [] }),
      ),
    );
    renderApp(<FideleHomePage />);

    const demande = screen.getByRole('region', { name: /ma demande en cours/i });
    expect(await within(demande).findByText('Aucune demande en cours.')).toBeInTheDocument();
    expect(within(demande).getByRole('link', { name: /demander un extrait d.acte/i })).toHaveAttribute('href', '/app/demandes/nouvelle');
  });
});
