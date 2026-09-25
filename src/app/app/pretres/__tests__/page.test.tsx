import { screen, within } from '@testing-library/react';

import PretresPage from '@/app/app/pretres/page';
import { resetF7State } from '@/testing/mocks/db-f7-pretre';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => resetF7State());

describe('/app/pretres (FID-Pretres)', () => {
  it('compose bandeau confession, prêtres joignables, conversations et confidentialité honnête', async () => {
    renderApp(<PretresPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Parler à un prêtre',
    );
    const notice = screen.getByRole('note');
    expect(notice).toHaveTextContent(
      'La confession ne se fait pas par message.',
    );
    expect(
      within(notice).getByRole('link', { name: 'Prendre rendez-vous' }),
    ).toHaveAttribute('href', '/app/confession');

    expect(
      await screen.findByRole('list', {
        name: 'Prêtres joignables · Saint-Dominique',
      }),
    ).toBeInTheDocument();
    const conversations = await screen.findByRole('list', {
      name: 'Mes conversations',
    });
    expect(
      within(conversations).getByRole('link', { name: /emmanuel tine/i }),
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/app\/pretres\/conversations\//),
    );
    expect(screen.getByText('2 · dont 1 non lue')).toBeInTheDocument();
    expect(screen.queryByText(/bout en bout/i)).not.toBeInTheDocument();
  });
});
