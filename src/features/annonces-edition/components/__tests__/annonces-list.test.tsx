import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import AnnoncesPage from '@/app/espace/[nodeId]/annonces/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsChancelier, grantsSecretaire, ids } from '@/testing/mocks/db';
import { f8aState, resetF8a } from '@/testing/mocks/db-f8a';
import { v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

const renderPage = async (capacites = grantsSecretaire) =>
  renderApp(await AnnoncesPage({ params: Promise.resolve({ nodeId: ids.saintDominique }) }), { capacites });

beforeEach(() => resetF8a());

describe('Annonces (PAR-Annonces)', () => {
  it('ouvre sur les annonces publiées, avec les compteurs par onglet', async () => {
    await renderPage();

    expect(await screen.findByRole('tab', { name: /publiées 1/i })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('tab', { name: /brouillons 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /toutes 3/i })).toBeInTheDocument();
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('link', { name: /^répétition de la chorale/i })).toBeInTheDocument();
    expect(within(table).getByText('345')).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /publiée le/i })).toBeInTheDocument();
    expect(within(table).queryByRole('link', { name: /^quête impérée/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nouvelle annonce/i })).toHaveAttribute('href', `/espace/${ids.saintDominique}/annonces/nouvelle`);
  });

  it('liste tous les contenus avec leur état dans l’onglet « Toutes »', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('tab', { name: /toutes/i }));

    const table = await screen.findByRole('table');
    await within(table).findByRole('link', { name: /^quête impérée/i });
    expect(within(table).getByRole('link', { name: /^quête impérée/i })).toHaveAttribute(
      'href',
      `/espace/${ids.saintDominique}/annonces/a0000000-0000-4000-8000-000000000001`,
    );
    expect(within(table).getByText('Brouillon')).toBeInTheDocument();
    expect(within(table).getByText('Programmée')).toBeInTheDocument();
    expect(within(table).getByText('Publiée')).toBeInTheDocument();
    expect(within(table).getByText('Annonce du dimanche · 27.09')).toBeInTheDocument();
  });

  it('propose les actions d’une annonce publiée dans son menu', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /actions pour « répétition/i }));

    expect(await screen.findByRole('menuitem', { name: /voir côté fidèle/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /modifier/i })).toBeInTheDocument();
  });

  it('met en avant le brouillon à reprendre avant dimanche', async () => {
    const user = userEvent.setup();
    await renderPage();

    const panel = await screen.findByRole('region', { name: /à terminer avant dimanche/i });
    expect(await within(panel).findByRole('link', { name: /reprendre le brouillon : quête impérée/i })).toHaveAttribute(
      'href',
      `/espace/${ids.saintDominique}/annonces/a0000000-0000-4000-8000-000000000001`,
    );
    await user.click(within(panel).getByRole('button', { name: /voir les brouillons/i }));
    expect(screen.getByRole('tab', { name: /brouillons/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('filtre par état', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('tab', { name: /programmées/i }));

    expect(await screen.findByRole('link', { name: /^messe d.action de grâce/i })).toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByRole('link', { name: /^quête impérée/i })).not.toBeInTheDocument();
  });

  it('cherche dans les annonces et filtre par lieu de culte', async () => {
    const user = userEvent.setup();
    f8aState.articles = f8aState.articles.map((a, i) =>
      i === 2 ? { ...a, scope: { ...(a.scope as object), place_id: 12, place_name: 'Chapelle de la Cité universitaire' } } : a,
    );
    await renderPage();

    await user.click(await screen.findByRole('tab', { name: /toutes/i }));
    await user.type(await screen.findByLabelText('Rechercher dans les annonces'), 'chorale');
    expect(await screen.findByRole('link', { name: /^répétition de la chorale/i })).toBeInTheDocument();
    await vi.waitFor(() => expect(within(screen.getByRole('table')).queryByRole('link', { name: /^quête impérée/i })).not.toBeInTheDocument());
    expect(f8aState.lastNewsQuery).toMatchObject({ q: 'chorale' });

    await user.clear(screen.getByLabelText('Rechercher dans les annonces'));
    await user.selectOptions(await screen.findByLabelText('Lieu'), 'Chapelle de la Cité universitaire');
    await vi.waitFor(() => expect(f8aState.lastNewsQuery).toMatchObject({ place: '12' }));
    expect(await screen.findByRole('link', { name: /^répétition de la chorale/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^messe d.action de grâce/i })).not.toBeInTheDocument();
  });

  it('mène à la feuille d’annonces du dimanche à venir', async () => {
    await renderPage();
    const link = await screen.findByRole('link', { name: /feuille d’annonces du/i });
    expect(link.getAttribute('href')).toMatch(new RegExp(`^/espace/${ids.saintDominique}/annonces/feuille\\?date=\\d{4}-\\d{2}-\\d{2}$`));
  });

  it('affiche un état vide explicite', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.selectOptions(await screen.findByLabelText('Type de contenu'), 'article');

    expect(await screen.findByText('Aucune annonce ne correspond à ces filtres')).toBeInTheDocument();
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
