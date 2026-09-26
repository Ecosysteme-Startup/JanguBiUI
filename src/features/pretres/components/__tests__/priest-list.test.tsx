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
import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f7PretreHandlers));

beforeEach(() => {
  resetF7State();
  navigation.push.mockClear();
});

describe('PriestList (FID-Pretres)', () => {
  it('liste les prêtres joignables en cartes, avec leur disponibilité, paroisse puis aumônerie', async () => {
    renderApp(<PriestList />);

    const parish = await screen.findByRole('list', {
      name: 'Prêtres joignables · Saint-Dominique',
    });
    expect(within(parish).getByText('Abbé Augustin Ndiaye')).toBeInTheDocument();
    expect(within(parish).getByText('Curé')).toBeInTheDocument();
    expect(within(parish).getByText('Joignable')).toBeInTheDocument();
    expect(within(parish).getByText('Répond mar. 15 h-18 h')).toBeInTheDocument();
    expect(within(parish).getByText('Absent jusqu’au 28 septembre')).toBeInTheDocument();
    // Absent : on peut lui écrire (lu à son retour), pas de rendez-vous de confession.
    expect(within(parish).getByRole('button', { name: 'Écrire à Abbé Robert Sagna' })).toBeEnabled();
    expect(
      within(parish).queryByRole('link', { name: 'Rendez-vous de confession avec Abbé Robert Sagna' }),
    ).not.toBeInTheDocument();
    expect(within(parish).getByText(/pas de confession avec lui avant le 28 septembre/i)).toBeInTheDocument();
    expect(
      within(parish).getByRole('link', { name: 'Rendez-vous de confession avec Abbé Augustin Ndiaye' }),
    ).toHaveAttribute('href', '/app/confession');
    expect(screen.getByRole('list', { name: /aumônerie de la cité universitaire/i })).toHaveTextContent('Abbé Pascal Manga');
  });

  it('propose de reprendre un échange déjà ouvert', async () => {
    renderApp(<PriestList conversationHrefOf={(id) => (id === f7Ids.tine ? '/app/pretres/conversations/c1' : undefined)} />);

    expect(
      await screen.findByRole('link', { name: 'Reprendre la conversation avec Père Emmanuel Tine' }),
    ).toHaveAttribute('href', '/app/pretres/conversations/c1');
    expect(screen.queryByRole('button', { name: 'Écrire à Père Emmanuel Tine' })).not.toBeInTheDocument();
  });

  it('ouvre la conversation avec le prêtre choisi', async () => {
    const user = userEvent.setup();
    renderApp(<PriestList />);

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
    renderApp(<PriestList />);

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
    renderApp(<PriestList />);

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
    renderApp(<PriestList />);
    expect(
      await screen.findByText('Aucun prêtre joignable pour l’instant'),
    ).toBeInTheDocument();
  });
});
