import { screen, waitFor, within } from '@testing-library/react';
import { delay, http } from 'msw';

import DemandesPage from '@/app/app/demandes/page';
import FideleHomePage from '@/app/app/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

/**
 * Recette perf (04, MAJEUR 1) : CLS 0,41 sur /app et 0,28 sur /app/demandes. Pendant le
 * chargement, chaque bloc affiche un squelette au gabarit du contenu chargé (mêmes marges,
 * mêmes hauteurs de ligne, même nombre de lignes) au lieu de trois barres génériques.
 */
const pending = (...paths: string[]) => server.use(...paths.map((p) => http.get(apiUrl(p), () => delay('infinite'))));

describe('Squelettes de chargement à hauteur stable', () => {
  beforeEach(() => resetF5bState());

  it('accueil fidèle : chaque bloc réserve la place de son contenu', async () => {
    pending('/me/', '/liturgy/today/', '/documents/requests/', '/messaging/priests/', '/messaging/conversations/', '/rosary/today/');
    renderApp(<FideleHomePage />);

    const parole = await screen.findByTestId('parole-squelette');
    expect(within(parole).getByText('Chargement des lectures du jour…')).toBeInTheDocument();
    // Trois lectures factices, comme la grille chargée.
    expect(within(parole).getAllByRole('listitem', { hidden: true })).toHaveLength(3);

    expect(within(screen.getByTestId('demande-squelette')).getByText('Chargement de votre demande…')).toBeInTheDocument();
    expect(within(screen.getByTestId('pretre-squelette')).getByText('Chargement des prêtres…')).toBeInTheDocument();
    expect(within(screen.getByTestId('messes-squelette')).getByText('Chargement des horaires…')).toBeInTheDocument();
    expect(within(screen.getByTestId('annonces-squelette')).getByText('Chargement des annonces…')).toBeInTheDocument();
  });

  it('mes demandes : le tableau (en-tête et lignes) et la phrase d’en-tête sont réservés', async () => {
    pending('/documents/requests/');
    renderApp(<DemandesPage />);

    const skeleton = await screen.findByTestId('demandes-squelette');
    expect(within(skeleton).getByText('Chargement de vos demandes…')).toBeInTheDocument();
    const table = within(skeleton).getByRole('table', { hidden: true });
    expect(within(table).getAllByRole('row', { hidden: true })).toHaveLength(4); // en-tête + 3 lignes
    expect(screen.getByRole('link', { name: /nouvelle demande/i })).toBeInTheDocument();
  });
});
