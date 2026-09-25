import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { PriestList } from '@/features/pretres/components/priest-list';
import { apiUrl } from '@/testing/mocks/api-url';
import {
  f7Ids,
  f7State,
  MINOR_MESSAGE,
  resetF7State,
} from '@/testing/mocks/db-f7-pretre';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => {
  resetF7State();
  navigation.push.mockClear();
});

describe('PriestList (FID-Pretres)', () => {
  it('liste les prêtres joignables avec leur disponibilité, paroisse puis aumônerie', async () => {
    renderApp(<PriestList parishName="Saint-Dominique" />);

    const parish = await screen.findByRole('list', {
      name: 'Prêtres joignables · Saint-Dominique',
    });
    expect(
      within(parish).getByText('Abbé Augustin Ndiaye'),
    ).toBeInTheDocument();
    expect(
      within(parish).getByText(/répond mar\. 15 h-18 h/),
    ).toBeInTheDocument();
    expect(
      within(parish).getByText('Absent jusqu’au 28.09'),
    ).toBeInTheDocument();
    expect(
      within(parish).getByRole('button', {
        name: /rendez-vous indisponible : abbé robert sagna est absent/i,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole('list', { name: /aumônerie de la cité universitaire/i }),
    ).toHaveTextContent('Abbé Pascal Manga');
    expect(screen.getByText('4 prêtres')).toBeInTheDocument();
  });

  it('ouvre la conversation avec le prêtre choisi', async () => {
    const user = userEvent.setup();
    renderApp(<PriestList parishName="Saint-Dominique" />);

    await user.click(
      await screen.findByRole('button', {
        name: 'Écrire à Père Emmanuel Tine',
      }),
    );

    await vi.waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        `/app/pretres/conversations/new-${f7Ids.tine}`,
      ),
    );
    expect(f7State.created).toEqual([f7Ids.tine]);
  });

  it('explique le refus de la messagerie à un mineur', async () => {
    server.use(
      http.post(apiUrl('/messaging/conversations/create/'), () =>
        HttpResponse.json(
          { detail: MINOR_MESSAGE, code: 'minor' },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<PriestList parishName="Saint-Dominique" />);

    await user.click(
      await screen.findByRole('button', {
        name: 'Écrire à Abbé Augustin Ndiaye',
      }),
    );

    expect(
      await screen.findByText(
        'La messagerie est réservée aux personnes majeures',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/parle à un prêtre de ta paroisse avec tes parents/i),
    ).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('invite à compléter le profil quand la date de naissance manque', async () => {
    server.use(
      http.post(apiUrl('/messaging/conversations/create/'), () =>
        HttpResponse.json(
          {
            detail:
              'Renseignez votre date de naissance dans votre profil pour écrire à un prêtre.',
            code: 'birth_date_required',
          },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<PriestList parishName="Saint-Dominique" />);

    await user.click(
      await screen.findByRole('button', {
        name: 'Écrire à Abbé Augustin Ndiaye',
      }),
    );

    expect(
      await screen.findByRole('link', { name: 'Compléter mon profil' }),
    ).toHaveAttribute('href', '/app/profil');
  });

  it('affiche un état vide quand aucun prêtre n’est joignable', async () => {
    server.use(
      http.get(apiUrl('/messaging/priests/'), () => HttpResponse.json([])),
    );
    renderApp(<PriestList parishName="Saint-Dominique" />);
    expect(
      await screen.findByText('Aucun prêtre joignable pour l’instant'),
    ).toBeInTheDocument();
  });
});
