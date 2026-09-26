import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { AnnouncementView } from '@/features/paroisse/components/announcement-view';
import { announcementDetails, f5bIds, f5bState, resetF5bState } from '@/testing/mocks/db-f5b';
import { apiUrl } from '@/testing/mocks/api-url';
import { renderApp } from '@/testing/test-utils';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));

beforeEach(() => {
  resetF5bState();
  delete (window as { __pwned?: boolean }).__pwned;
});

describe('Annonce (/app/paroisse/annonces/[id])', () => {
  it('affiche une annonce HTML, la marque comme lue et propose les annonces liées', async () => {
    renderApp(<AnnouncementView id={f5bIds.annonceRentree} />);

    expect(await screen.findByRole('heading', { level: 1, name: /messe d.action de grâce/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /un accueil pour les nouveaux bacheliers/i })).toBeInTheDocument();
    expect(screen.getByText('Abbé Augustin Ndiaye')).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: /à lire aussi/i })).toBeInTheDocument();
    await vi.waitFor(() => expect(f5bState.readArticles).toEqual([f5bIds.annonceRentree]));
  });

  it('affiche la bannière avec son texte alternatif', async () => {
    server.use(
      http.get(apiUrl(`/news/${f5bIds.annonceRentree}/`), () =>
        HttpResponse.json({
          ...announcementDetails[f5bIds.annonceRentree],
          cover_image_url: 'https://minio.test/covers/parvis.jpg',
          cover_image_alt: 'Étudiants à la sortie de la messe de 9 h 30',
          cover_image_decorative: false,
        }),
      ),
    );
    renderApp(<AnnouncementView id={f5bIds.annonceRentree} />);

    expect(await screen.findByRole('img', { name: 'Étudiants à la sortie de la messe de 9 h 30' })).toHaveAttribute(
      'src',
      'https://minio.test/covers/parvis.jpg',
    );
  });

  it('ignore une bannière décorative pour les lecteurs d’écran', async () => {
    server.use(
      http.get(apiUrl(`/news/${f5bIds.annonceRentree}/`), () =>
        HttpResponse.json({
          ...announcementDetails[f5bIds.annonceRentree],
          cover_image_url: 'https://minio.test/covers/ornement.png',
          cover_image_alt: '',
          cover_image_decorative: true,
        }),
      ),
    );
    const { container } = renderApp(<AnnouncementView id={f5bIds.annonceRentree} />);

    await screen.findByRole('heading', { level: 1, name: /messe d.action de grâce/i });
    const img = container.querySelector('img[src="https://minio.test/covers/ornement.png"]');
    expect(img).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img', { name: /./ })).not.toBeInTheDocument();
  });

  it('neutralise un contenu HTML malveillant', async () => {
    renderApp(<AnnouncementView id={f5bIds.annonceMalveillante} />);

    const body = await screen.findByTestId('corps-annonce');
    expect(body).toHaveTextContent('Texte légitime');
    expect(body.querySelector('script, img, iframe, [onclick], [onerror]')).toBeNull();
    expect(screen.getByText('Lien piégé')).not.toHaveAttribute('href');
    expect(screen.getByRole('link', { name: 'Aide' })).toHaveAttribute('rel', 'noopener noreferrer');
    expect((window as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('affiche un texte brut en paragraphes, échappé', async () => {
    renderApp(<AnnouncementView id={f5bIds.annonceQuete} />);

    expect(await screen.findByText(/merci de votre générosité/i)).toBeInTheDocument();
    expect(screen.getByTestId('corps-annonce').querySelectorAll('p')).toHaveLength(2);
  });

  it('explique qu’une annonce retirée n’existe plus', async () => {
    renderApp(<AnnouncementView id="00000000-0000-4000-8000-000000000000" />);

    expect(await screen.findByText('Cette annonce n’existe plus.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /retour · ma paroisse/i })).toHaveAttribute('href', '/app/paroisse#annonces');
  });
});
