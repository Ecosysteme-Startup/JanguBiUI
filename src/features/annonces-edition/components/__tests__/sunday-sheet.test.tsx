import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import FeuilleAnnoncesPage from '@/app/espace/[nodeId]/annonces/feuille/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsChancelier, grantsSecretaire, ids } from '@/testing/mocks/db';
import { f8aState, resetF8a } from '@/testing/mocks/db-f8a';
import { f8aHandlers, v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

const nodeId = ids.saintDominique;
const renderSheet = async (date = '2026-09-27', capacites = grantsSecretaire) =>
  renderApp(await FeuilleAnnoncesPage({ params: Promise.resolve({ nodeId }), searchParams: Promise.resolve({ date }) }), { capacites });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-24T10:00:00'));
  resetF8a();
  navigation.replace.mockClear();
  f8aState.articles = f8aState.articles.map((a, i) =>
    i === 0 ? { ...a, status: 'scheduled', content: '<p>La quête est reversée au séminaire.</p><script>alert(1)</script>' } : a,
  );
  f8aState.dioceseSheetItems = [
    {
      id: 'd1',
      title: 'Lettre de l’archevêque',
      excerpt: '',
      content: 'Chers diocésains,\n\nprions pour les vocations.',
      content_format: 'text',
      scope: { node_id: ids.dakar, node_name: 'Archidiocèse de Dakar', place_id: null, place_name: null },
      status: 'published',
    },
  ];
});

afterEach(() => vi.useRealTimers());

describe('Feuille d’annonces du dimanche', () => {
  it('liste les annonces de la paroisse puis celles du diocèse, prêtes à imprimer', async () => {
    const print = vi.fn();
    window.print = print;
    const user = userEvent.setup();
    await renderSheet();

    expect(await screen.findByRole('heading', { level: 1, name: /annonces du dimanche 27 septembre 2026/i })).toBeInTheDocument();
    const sheet = screen.getByRole('region', { name: /annonces du dimanche/i });
    expect(within(sheet).getByRole('heading', { name: /quête impérée/i })).toBeInTheDocument();
    expect(within(sheet).getByText('La quête est reversée au séminaire.')).toBeInTheDocument();
    expect(sheet.querySelector('script')).toBeNull();
    expect(within(sheet).getByText(/programmée, pas encore publiée/)).toBeInTheDocument();
    expect(within(sheet).getByRole('heading', { name: 'De la part de : Archidiocèse de Dakar' })).toBeInTheDocument();
    expect(within(sheet).getByText('prions pour les vocations.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Imprimer' }));
    expect(print).toHaveBeenCalledOnce();
  });

  it('change de dimanche par l’adresse de la page', async () => {
    const user = userEvent.setup();
    await renderSheet();

    await user.selectOptions(await screen.findByLabelText('Dimanche'), 'Dimanche 4 octobre 2026');

    expect(navigation.replace).toHaveBeenCalledWith(`/espace/${nodeId}/annonces/feuille?date=2026-10-04`);
  });

  it('dit quand aucune annonce n’est prévue', async () => {
    f8aState.dioceseSheetItems = [];
    await renderSheet('2026-10-04');
    expect(await screen.findByText('Aucune annonce pour ce dimanche')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimer' })).toBeDisabled();
  });

  it('affiche le refus du serveur', async () => {
    server.use(http.get(apiUrl('/staff/news/sunday-sheet/'), () => v1Error(403, 'publish_forbidden', 'Vous ne pouvez pas éditer la feuille d’annonces de ce nœud.')));
    await renderSheet();
    expect(await screen.findByText('Vous ne pouvez pas éditer la feuille d’annonces de ce nœud.')).toBeInTheDocument();
  });

  it('refuse la page sans la capacité annonces.publier', async () => {
    await renderSheet('2026-09-27', grantsChancelier);
    expect(await screen.findByText('Annonces : accès réservé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Imprimer' })).not.toBeInTheDocument();
  });
});
