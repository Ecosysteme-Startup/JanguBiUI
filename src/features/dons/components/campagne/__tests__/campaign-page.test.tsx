import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { CampaignPage } from '@/features/dons/components/campagne/campaign-page';
import { parseFundUsage } from '@/features/dons/components/campagne/fund-usage';
import { apiUrl } from '@/testing/mocks/api-url';
import { campaignDetail, donsIds, publicParish } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

const serveFund = (patch: Record<string, unknown>) =>
  server.use(http.get(apiUrl('/public/dons/fonds/:fundId/'), () => HttpResponse.json({ ...campaignDetail(), ...patch })));

describe('Campagne (WEB-FID-Campagne)', () => {
  it('présente le projet, son avancement et ses nouvelles, et mène au don', async () => {
    renderApp(<CampaignPage fundId={donsIds.toiture} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Toiture de la chapelle de la Cité universitaire' })).toBeInTheDocument();
    expect(screen.getByText('Campagne')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).nextElementSibling).toHaveTextContent('Paroisse Saint-Dominique · du 1er juin au 31 décembre 2026');

    expect(screen.getByText('1 186 400 FCFA')).toBeInTheDocument();
    expect(screen.getByText(/réunis sur 4 500 000 FCFA/)).toBeInTheDocument();
    expect(screen.getByText('26 %')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Avancement de la collecte' })).toHaveAttribute('aria-valuenow', '26');

    const usage = screen.getByRole('region', { name: 'Usage des fonds' });
    expect(usage).toHaveTextContent(/charpente, tôles, gouttières et main-d’œuvre/);

    const news = screen.getByRole('region', { name: 'Nouvelles de la campagne' });
    const articles = within(news).getAllByRole('article');
    expect(articles).toHaveLength(2);
    expect(articles[0]).toHaveTextContent(/Abbé Augustin Ndiaye\s*dimanche 20 septembre 2026/);
    expect(articles[0]).toHaveTextContent(/Les tôles sont commandées/);
    expect(articles[1]).toHaveTextContent(/dimanche 12 juillet 2026/);

    const soutien = screen.getByRole('region', { name: 'Soutenir ce projet' });
    expect(soutien).toHaveTextContent('Les dons sont affectés à ce seul projet. La collecte se ferme dès que l’objectif est atteint.');
    expect(within(soutien).getByRole('link', { name: 'Donner à cette campagne' })).toHaveAttribute('href', `/app/dons?fonds=${donsIds.toiture}`);
    expect(await within(soutien).findByText(/réf\. ARCH-DAK-2026-041/)).toBeInTheDocument();

    const bref = screen.getByRole('region', { name: 'En bref' });
    expect(bref).toHaveTextContent('Saint-Dominique, Dakar');
    expect(bref).toHaveTextContent(/Jusqu’au 31 décembre 2026/);
    // Aucun nom de donateur, aucun classement.
    expect(screen.queryByText(/donateur/i)).not.toBeInTheDocument();
  });

  it('rend le budget ligne à ligne quand l’usage des fonds en contient un', async () => {
    serveFund({
      description:
        'Refaire la toiture avant la saison des pluies.\nCharpente — Reprise des fermes : 1 650 000 FCFA\nTôles : 1 420 000 FCFA\nGouttières : 530 000 FCFA\nMain-d’œuvre : 900 000 FCFA',
    });
    renderApp(<CampaignPage fundId={donsIds.toiture} />);

    const projet = await screen.findByRole('region', { name: 'Le projet' });
    expect(projet).toHaveTextContent('Refaire la toiture avant la saison des pluies.');
    const usage = screen.getByRole('region', { name: 'Usage des fonds' });
    const lines = within(usage).getAllByRole('listitem');
    expect(lines).toHaveLength(5);
    expect(lines[0]).toHaveTextContent(/Charpente\s*Reprise des fermes\s*1 650 000 FCFA/);
    expect(lines[4]).toHaveTextContent(/Total\s*4 500 000 FCFA/);
  });

  it('état clos : plus de bouton de don', async () => {
    serveFund({ status: 'clos' });
    renderApp(<CampaignPage fundId={donsIds.toiture} />);

    const soutien = await screen.findByRole('region', { name: 'Soutenir ce projet' });
    expect(within(soutien).getByText('Cette collecte est close.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Donner à cette campagne' })).not.toBeInTheDocument();
  });

  it('objectif atteint : la collecte est close', async () => {
    serveFund({ raised: 4_500_000 });
    renderApp(<CampaignPage fundId={donsIds.toiture} />);

    expect(await screen.findByText('Objectif atteint : la collecte est close.')).toBeInTheDocument();
    expect(screen.getByText('100 %')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Donner à cette campagne' })).not.toBeInTheDocument();
  });

  it('collecte de la paroisse fermée : pas de bouton', async () => {
    server.use(http.get(apiUrl('/public/dons/paroisses/:nodeId/'), () => HttpResponse.json({ ...publicParish(), enabled: false })));
    renderApp(<CampaignPage fundId={donsIds.toiture} />);

    expect(await screen.findByText('La collecte en ligne n’est pas ouverte pour cette paroisse.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Donner à cette campagne' })).not.toBeInTheDocument();
  });

  it('campagne introuvable', async () => {
    renderApp(<CampaignPage fundId="d0000000-0000-4000-8000-00000000ffff" />);

    expect(await screen.findByText('Campagne introuvable.')).toBeInTheDocument();
  });
});

describe('parseFundUsage', () => {
  it('garde un texte simple en paragraphes', () => {
    expect(parseFundUsage('Refaire la toiture.\n\nAvant les pluies.')).toEqual({ prose: ['Refaire la toiture.', 'Avant les pluies.'], budget: [], total: null });
  });

  it('ne prend pas une ligne isolée « x : nombre » pour un budget', () => {
    expect(parseFundUsage('Objectif : 2026').budget).toEqual([]);
  });

  it('lit un total explicite', () => {
    const usage = parseFundUsage('- Charpente : 1 000 FCFA\n- Tôles : 2 000\nTotal : 3 500 FCFA');
    expect(usage.budget).toEqual([
      { label: 'Charpente', detail: null, amount: 1000 },
      { label: 'Tôles', detail: null, amount: 2000 },
    ]);
    expect(usage.total).toBe(3500);
  });
});
