import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import AnnoncesPage from '@/app/espace/[nodeId]/annonces/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsChancelier, grantsSecretaire, ids } from '@/testing/mocks/db';
import { resetF8a } from '@/testing/mocks/db-f8a';
import { v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

const renderPage = async (capacites = grantsSecretaire) =>
  renderApp(await AnnoncesPage({ params: Promise.resolve({ nodeId: ids.saintDominique }) }), { capacites });

beforeEach(() => resetF8a());

describe('Annonces (PAR-Annonces)', () => {
  it('liste les contenus du nœud avec leur état et les compteurs par onglet', async () => {
    await renderPage();

    const table = await screen.findByRole('table');
    expect(within(table).getByRole('link', { name: /^quête impérée/i })).toHaveAttribute(
      'href',
      `/espace/${ids.saintDominique}/annonces/a0000000-0000-4000-8000-000000000001`,
    );
    expect(within(table).getByText('Brouillon')).toBeInTheDocument();
    expect(within(table).getByText('Programmée')).toBeInTheDocument();
    expect(within(table).getByText('Publiée')).toBeInTheDocument();
    expect(within(table).getByText('Annonce du dimanche · 27.09')).toBeInTheDocument();
    expect(within(table).getByText('345')).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /toutes 3/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /brouillons 1/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nouvelle annonce/i })).toHaveAttribute('href', `/espace/${ids.saintDominique}/annonces/nouvelle`);
    expect(within(table).getByRole('link', { name: /voir côté fidèle : répétition/i })).toBeInTheDocument();
  });

  it('filtre par état', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('tab', { name: /programmées/i }));

    expect(await screen.findByRole('link', { name: /^messe d.action de grâce/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^quête impérée/i })).not.toBeInTheDocument();
  });

  it('affiche un état vide explicite', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.selectOptions(await screen.findByLabelText('Type de contenu'), 'article');

    expect(await screen.findByText('Aucune annonce pour l’instant')).toBeInTheDocument();
  });

  it('refuse proprement l’écran sans la capacité annonces.publier', async () => {
    await renderPage(grantsChancelier);

    expect(await screen.findByText('Annonces : accès réservé')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /nouvelle annonce/i })).not.toBeInTheDocument();
  });

  it('affiche le refus du serveur (403) sans planter', async () => {
    server.use(http.get(apiUrl('/staff/news/'), () => v1Error(403, 'mfa_required', 'Authentification à deux facteurs requise.')));
    await renderPage();

    expect(await screen.findByText('Accès refusé')).toBeInTheDocument();
    expect(screen.getByText('Authentification à deux facteurs requise.')).toBeInTheDocument();
  });
});
