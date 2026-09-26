import { screen, within } from '@testing-library/react';

import PretresPage from '@/app/app/pretres/page';
import { f7Ids, resetF7State } from '@/testing/mocks/db-f7-pretre';
import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f7PretreHandlers));

beforeEach(() => {
  resetF7State();
  navigation.search = '';
});

describe('/app/pretres (FID-Pretres)', () => {
  it('compose bandeau confession, cartes des prêtres, reprise des échanges et confidentialité honnête', async () => {
    renderApp(<PretresPage />);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Prêtres joignables');
    const notice = screen.getByRole('note');
    expect(notice).toHaveTextContent('La confession ne se fait pas par message.');
    expect(within(notice).getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute('href', '/app/confession');

    const list = await screen.findByRole('list', { name: 'Prêtres joignables · Saint-Dominique' });
    expect(
      await within(list).findByRole('link', { name: 'Reprendre la conversation avec Père Emmanuel Tine' }),
    ).toHaveAttribute('href', `/app/pretres/conversations/${f7Ids.convTine}`);
    expect(within(list).getByRole('button', { name: 'Écrire à Abbé Robert Sagna' })).toBeInTheDocument();

    const tabs = screen.getByRole('navigation', { name: 'Affichage' });
    expect(within(tabs).getByRole('link', { name: 'Conversations' })).toHaveAttribute('href', '/app/pretres?vue=conversations');
    expect(within(tabs).getByRole('link', { name: 'Prêtres joignables' })).toHaveAttribute('aria-current', 'page');

    expect(screen.getByText(/aucun administrateur n.y a accès/i)).toBeInTheDocument();
    expect(screen.queryByText(/bout en bout/i)).not.toBeInTheDocument();
  });

  it('vue « Conversations » : la liste des échanges, le bandeau et le choix d’une conversation', async () => {
    navigation.search = 'vue=conversations';
    renderApp(<PretresPage />);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Parler à un prêtre');
    const conversations = await screen.findByRole('list', { name: 'Mes conversations' });
    expect(within(conversations).getByRole('link', { name: /emmanuel tine/i })).toHaveAttribute(
      'href',
      `/app/pretres/conversations/${f7Ids.convTine}`,
    );
    expect(within(conversations).getByText('1 message non lu')).toBeInTheDocument();
    expect(screen.getByText('Choisissez une conversation')).toBeInTheDocument();
    expect(screen.queryByText(/bout en bout/i)).not.toBeInTheDocument();
  });
});
