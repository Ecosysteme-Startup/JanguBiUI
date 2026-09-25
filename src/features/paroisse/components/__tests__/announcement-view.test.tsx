import { screen } from '@testing-library/react';

import { AnnouncementView } from '@/features/paroisse/components/announcement-view';
import { f5bIds, f5bState, resetF5bState } from '@/testing/mocks/db-f5b';
import { renderApp } from '@/testing/test-utils';

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
