import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import QuetesPage from '@/app/espace/[nodeId]/dons/quetes/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { donsIds, donsState, grantsEconome, grantsSecretaireDons, staffFunds } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

const nodeId = ids.saintDominique;
const NBSP = ' ';

const places = [
  { id: 21, node_id: nodeId, name: 'Église Saint-Dominique', kind: 'eglise_paroissiale', is_main: true, address: '', city: 'Dakar', is_active: true },
  { id: 22, node_id: nodeId, name: 'Chapelle de la Cité universitaire', kind: 'chapelle', is_main: false, address: '', city: 'Dakar', is_active: true },
];
const mass = (id: number, weekday: number, start_time: string, note = '') => ({ id, kind: 'messe', weekday, start_time, end_time: null, language: '', note, valid_from: null, valid_to: null });
const schedule = [mass(1, 6, '07:30:00'), mass(2, 6, '09:30:00', 'étudiants'), mass(3, 6, '11:30:00'), mass(4, 6, '18:30:00'), mass(5, 5, '18:30:00', 'messe anticipée')];

beforeEach(() => {
  // Horloge figée à un dimanche : lastSunday() === 2026-09-27, stable quelle que soit la date réelle.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-27T12:00:00Z'));
  server.use(
    http.get(apiUrl('/hierarchy/nodes/:nodeId/places/'), () => HttpResponse.json(places)),
    http.get(apiUrl('/hierarchy/places/:placeId/schedule/'), ({ params }) => HttpResponse.json(Number(params.placeId) === 21 ? schedule : [])),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

const renderPage = async (capacites = grantsEconome) => renderApp(await QuetesPage({ params: Promise.resolve({ nodeId }) }), { capacites });

const fill = async (user: ReturnType<typeof userEvent.setup>, { one = 'Joseph Mendy', two = 'Cécile Coly' } = {}) => {
  fireEvent.change(await screen.findByLabelText(/Date de la messe/), { target: { value: '2026-09-27' } });
  await screen.findByRole('option', { name: `Messe de 11${NBSP}h${NBSP}30` });
  await user.selectOptions(screen.getByLabelText(/^Messe/), `Messe de 11${NBSP}h${NBSP}30`);
  await user.click(screen.getByRole('radio', { name: /Quête impérée pour le Grand Séminaire de Brin/ }));
  await user.type(screen.getByLabelText(/Montant compté/), '231900');
  await user.type(screen.getByLabelText(/Premier compteur/), one);
  await user.type(screen.getByLabelText(/Second compteur/), two);
};

describe('Saisie d’une quête en espèces (WEB-PAR-Quete-Saisie)', () => {
  it('propose les messes du lieu et enregistre la saisie', async () => {
    const user = userEvent.setup();
    await renderPage();

    await fill(user);
    await user.type(screen.getByLabelText(/Observation/), 'Bordereau n° 12');
    await user.click(screen.getByRole('button', { name: 'Enregistrer la saisie' }));

    await vi.waitFor(() => expect(donsState.cashCreated).toHaveLength(1));
    expect(donsState.cashCreated[0]).toEqual({
      node: nodeId,
      fund_id: donsIds.brin,
      place_id: 21,
      mass_date: '2026-09-27',
      mass_label: `Messe de 11${NBSP}h${NBSP}30`,
      amount: 231_900,
      counter_one: 'Joseph Mendy',
      counter_two: 'Cécile Coly',
      observation: 'Bordereau n° 12',
    });
    expect(screen.getByText('Une autre personne valide la saisie.')).toBeInTheDocument();
  });

  it('refuse deux compteurs identiques', async () => {
    const user = userEvent.setup();
    await renderPage();

    await fill(user, { one: 'Pierre Ndour', two: ' pierre ndour' });
    await user.click(screen.getByRole('button', { name: 'Enregistrer la saisie' }));

    expect(await screen.findByText('Deux personnes différentes doivent compter la quête.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Second compteur/)).toHaveAttribute('aria-invalid', 'true');
    expect(donsState.cashCreated).toHaveLength(0);
  });

  it('bascule sur un libellé libre quand le lieu n’a pas d’horaires', async () => {
    const user = userEvent.setup();
    await renderPage();

    fireEvent.change(await screen.findByLabelText(/Date de la messe/), { target: { value: '2026-09-27' } });
    await screen.findByRole('option', { name: `Messe de 11${NBSP}h${NBSP}30` });
    await user.selectOptions(screen.getByLabelText('Lieu'), '22');
    await vi.waitFor(() => expect(screen.queryByRole('option', { name: `Messe de 11${NBSP}h${NBSP}30` })).not.toBeInTheDocument());
    await user.type(screen.getByLabelText(/^Messe/), 'Messe de 19 h');
    await user.click(screen.getByRole('radio', { name: /Quête du dimanche 27 septembre/ }));
    await user.type(screen.getByLabelText(/Montant compté/), '12 500');
    await user.type(screen.getByLabelText(/Premier compteur/), 'Paul Diatta');
    await user.type(screen.getByLabelText(/Second compteur/), 'Anna Sarr');
    await user.click(screen.getByRole('button', { name: 'Enregistrer la saisie' }));

    await vi.waitFor(() => expect(donsState.cashCreated).toHaveLength(1));
    expect(donsState.cashCreated[0]).toMatchObject({ place_id: 22, mass_label: 'Messe de 19 h', amount: 12_500, fund_id: donsIds.quete });
  });

  it('liste les saisies et valide celle d’une autre personne', async () => {
    const user = userEvent.setup();
    await renderPage();

    const hist = await screen.findByRole('region', { name: 'Saisies récentes' });
    expect(await within(hist).findByText('Second compteur absent : recompter lundi.')).toBeInTheDocument();
    expect(within(hist).getAllByText('Validée')).toHaveLength(3);
    expect(within(hist).getByText('1 à valider')).toBeInTheDocument();

    await user.click(within(hist).getByRole('button', { name: /^Valider la saisie/ }));
    // JB-WEB-034 : une confirmation précède la validation.
    const dialog = await screen.findByRole('dialog', { name: /valider cette saisie/i });
    await user.click(within(dialog).getByRole('button', { name: 'Valider la saisie' }));

    await vi.waitFor(() => expect(donsState.validated).toEqual([5]));
  });

  it('affiche proprement le refus de valider sa propre saisie', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(apiUrl('/staff/dons/quetes/:id/valider/'), () =>
        HttpResponse.json(
          { error: { code: 'permission_denied', message: 'Vous ne pouvez pas valider une saisie que vous avez faite ou comptée.', details: {} } },
          { status: 403 },
        ),
      ),
    );
    await renderPage();

    const hist = await screen.findByRole('region', { name: 'Saisies récentes' });
    await user.click(await within(hist).findByRole('button', { name: /^Valider la saisie/ }));
    const dialog = await screen.findByRole('dialog', { name: /valider cette saisie/i });
    await user.click(within(dialog).getByRole('button', { name: 'Valider la saisie' }));

    const alert = await within(hist).findByRole('alert');
    expect(alert).toHaveTextContent('Vous ne pouvez pas valider une saisie que vous avez faite ou comptée.');
  });

  it('masque la validation pour l’auteur de la saisie (JB-WEB-034)', async () => {
    const user = userEvent.setup();
    await renderPage();
    const hist = await screen.findByRole('region', { name: 'Saisies récentes' });
    // La saisie en attente (id 5) a été faite par une autre personne : sa validation reste possible.
    expect(await within(hist).findByRole('button', { name: /^Valider la saisie/ })).toBeEnabled();
    expect(within(hist).getByText(/vous ne pouvez pas valider une saisie que vous avez faite/i)).toBeInTheDocument();
    // La confirmation peut être annulée sans valider.
    await user.click(within(hist).getByRole('button', { name: /^Valider la saisie/ }));
    const dialog = await screen.findByRole('dialog', { name: /valider cette saisie/i });
    await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(donsState.validated).toEqual([]);
  });

  it('rejette une saisie avec un motif obligatoire', async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      http.post(apiUrl('/staff/dons/quetes/:id/rejeter/'), async ({ params, request }) => {
        body = { id: Number(params.id), ...((await request.json()) as object) };
        return HttpResponse.json({ ...(await import('@/testing/mocks/db-dons')).cashCollections()[0], status: 'rejetee' });
      }),
    );
    await renderPage();

    const hist = await screen.findByRole('region', { name: 'Saisies récentes' });
    await user.click(await within(hist).findByRole('button', { name: /^Autres actions/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Rejeter la saisie' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rejeter la saisie' });
    await user.click(within(dialog).getByRole('button', { name: 'Rejeter' }));
    expect(await within(dialog).findByText('Indiquez le motif du rejet.')).toBeInTheDocument();
    expect(body).toBeNull();

    await user.type(within(dialog).getByLabelText(/Motif du rejet/), 'Montant différent du bordereau');
    await user.click(within(dialog).getByRole('button', { name: 'Rejeter' }));

    await vi.waitFor(() => expect(body).toEqual({ id: 5, reason: 'Montant différent du bordereau' }));
  });

  it('est ouverte à la secrétaire qui saisit les quêtes', async () => {
    await renderPage(grantsSecretaireDons);

    expect(await screen.findByRole('heading', { name: 'Saisir une quête', level: 1 })).toBeInTheDocument();
  });

  it('refuse l’écran sans dons.saisir_quete', async () => {
    await renderPage(grantsEconome.filter((g) => g.capacite !== 'dons.saisir_quete'));

    expect(await screen.findByText('Quêtes en espèces : accès réservé')).toBeInTheDocument();
  });

  describe('fonds proposés selon la date de la messe', () => {
    let asked: { node: string | null; date: string | null }[] = [];
    const fund = (id: string) => staffFunds().find((f) => f.id === id)!;

    beforeEach(() => {
      asked = [];
      server.use(
        http.get(apiUrl('/staff/dons/quetes/fonds-proposes/'), ({ request }) => {
          const params = new URL(request.url).searchParams;
          asked.push({ node: params.get('node'), date: params.get('date') });
          // Le 27 : quête impérée du jour en tête ; le 20 : aucune quête ouverte.
          const date = params.get('date');
          return HttpResponse.json(date === '2026-09-27' ? [fund(donsIds.brin), fund(donsIds.quete)] : date === '2026-10-04' ? [fund(donsIds.quete)] : []);
        }),
      );
    });

    it('demande les fonds de la date et présélectionne la quête impérée du jour', async () => {
      await renderPage();

      fireEvent.change(await screen.findByLabelText(/Date de la messe/), { target: { value: '2026-09-27' } });
      await vi.waitFor(() => expect(screen.getByRole('radio', { name: /Quête impérée pour le Grand Séminaire de Brin/ })).toBeChecked());
      expect(asked).toContainEqual({ node: nodeId, date: '2026-09-27' });

      fireEvent.change(screen.getByLabelText(/Date de la messe/), { target: { value: '2026-10-04' } });
      await vi.waitFor(() => expect(screen.queryByRole('radio', { name: /Quête impérée/ })).not.toBeInTheDocument());
      expect(screen.getByRole('radio', { name: /Quête du dimanche 27 septembre/ })).toBeChecked();

      fireEvent.change(screen.getByLabelText(/Date de la messe/), { target: { value: '2026-09-20' } });
      expect(await screen.findByText('Aucune quête pour cette date')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Enregistrer la saisie' })).toBeDisabled();
    });

    it('enregistre la saisie sur le fonds proposé', async () => {
      const user = userEvent.setup();
      await renderPage();

      fireEvent.change(await screen.findByLabelText(/Date de la messe/), { target: { value: '2026-09-27' } });
      await screen.findByRole('option', { name: `Messe de 11${NBSP}h${NBSP}30` });
      await user.selectOptions(screen.getByLabelText(/^Messe/), `Messe de 11${NBSP}h${NBSP}30`);
      await vi.waitFor(() => expect(screen.getByRole('radio', { name: /Quête impérée pour le Grand Séminaire de Brin/ })).toBeChecked());
      await user.type(screen.getByLabelText(/Montant compté/), '50000');
      await user.type(screen.getByLabelText(/Premier compteur/), 'Joseph Mendy');
      await user.type(screen.getByLabelText(/Second compteur/), 'Cécile Coly');
      await user.click(screen.getByRole('button', { name: 'Enregistrer la saisie' }));

      await vi.waitFor(() => expect(donsState.cashCreated).toHaveLength(1));
      expect(donsState.cashCreated[0]).toMatchObject({ fund_id: donsIds.brin, mass_date: '2026-09-27', amount: 50_000 });
    });

    it('garde les quêtes ouvertes du nœud en secours si l’appel échoue', async () => {
      server.use(
        http.get(apiUrl('/staff/dons/quetes/fonds-proposes/'), () =>
          HttpResponse.json({ error: { code: 'server_error', message: 'Indisponible.', details: {} } }, { status: 500 }),
        ),
      );
      await renderPage();

      fireEvent.change(await screen.findByLabelText(/Date de la messe/), { target: { value: '2026-09-20' } });
      expect(await screen.findByRole('radio', { name: /Quête impérée pour le Grand Séminaire de Brin/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Quête du dimanche 27 septembre/ })).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: /Toiture/ })).not.toBeInTheDocument();
      expect(screen.queryByText('Aucune quête pour cette date')).not.toBeInTheDocument();
    });

    it('n’appelle pas les fonds proposés sans dons.saisir_quete', async () => {
      await renderPage(grantsEconome.filter((g) => g.capacite !== 'dons.saisir_quete'));

      expect(await screen.findByText('Quêtes en espèces : accès réservé')).toBeInTheDocument();
      expect(asked).toHaveLength(0);
    });
  });
});
