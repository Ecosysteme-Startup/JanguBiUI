import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { LatestAnnouncementCover } from '@/features/public-annuaire/components/latest-announcement-cover';
import { apiUrl } from '@/testing/mocks/api-url';
import { publicAnnouncements } from '@/testing/mocks/db-f4';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

const withCover = (cover: Record<string, unknown>) =>
  server.use(
    http.get(apiUrl('/news/'), () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [{ ...publicAnnouncements[0], ...cover }] }),
    ),
  );

describe('Bannière de la dernière annonce (accueil public)', () => {
  it('affiche la bannière de la dernière annonce avec son texte alternatif', async () => {
    withCover({ cover_image_url: 'https://minio.test/covers/parvis.jpg', cover_image_alt: 'Parvis de Saint-Dominique', cover_image_decorative: false });
    renderApp(<LatestAnnouncementCover fallback={<p>Emplacement</p>} />);

    expect(await screen.findByRole('img', { name: 'Parvis de Saint-Dominique' })).toHaveAttribute('src', 'https://minio.test/covers/parvis.jpg');
    expect(screen.queryByText('Emplacement')).not.toBeInTheDocument();
  });

  it('garde l’emplacement photo quand l’annonce n’a pas de bannière', async () => {
    renderApp(<LatestAnnouncementCover fallback={<p>Emplacement</p>} />);

    expect(await screen.findByText('Emplacement')).toBeInTheDocument();
  });

  it('rend une bannière décorative muette pour les lecteurs d’écran', async () => {
    withCover({ cover_image_url: 'https://minio.test/covers/ornement.png', cover_image_alt: '', cover_image_decorative: true });
    const { container } = renderApp(<LatestAnnouncementCover fallback={<p>Emplacement</p>} />);

    await vi.waitFor(() => expect(container.querySelector('img')).toHaveAttribute('alt', ''));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
