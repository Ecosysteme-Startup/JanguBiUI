import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createStaffUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, screen } from '@/testing/test-utils';

import { TachesDuJourSection } from '../taches-du-jour';

const moi = (capacites: string[], type = 'paroisse') =>
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(
        createStaffUser(capacites, {
          id: '5d000000-0000-4000-8000-00000000000d',
          name: 'Saint-Dominique',
          type,
        }),
      ),
    ),
  );

describe('Tâches du jour (/v1/staff/taches-du-jour/)', () => {
  test('liste les rubriques avec lien vers l’écran de traitement', async () => {
    moi(['intentions.gerer', 'actes.traiter']);
    renderApp(<TachesDuJourSection />);
    expect(
      await screen.findByRole('link', {
        name: /Intentions de messe à planifier/,
      }),
    ).toHaveAttribute('href', '/app/paroisse/intentions');
    expect(screen.getByText(/Quêtes à confirmer/)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Quêtes à confirmer/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1 sur 5 à jour')).toBeInTheDocument();
    expect(
      screen.getByText(/Église Saint-Dominique · Emmanuel Tine/),
    ).toBeInTheDocument();
  });

  test('sans nœud paroissial : rien', async () => {
    moi(['annonces.publier'], 'diocese');
    renderApp(<TachesDuJourSection />);
    await new Promise((r) => setTimeout(r, 50));
    expect(
      screen.queryByText('Reste à faire aujourd’hui'),
    ).not.toBeInTheDocument();
  });
});
