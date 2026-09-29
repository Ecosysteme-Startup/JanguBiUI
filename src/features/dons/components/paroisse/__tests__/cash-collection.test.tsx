import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import QuetesPage from '@/app/espace/[nodeId]/dons/quetes/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { donsIds, donsState, grantsEconome, grantsSecretaireDons } from '@/testing/mocks/db-dons';
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
  server.use(
    http.get(apiUrl('/hierarchy/nodes/:nodeId/places/'), () => HttpResponse.json(places)),
    http.get(apiUrl('/hierarchy/places/:placeId/schedule/'), ({ params }) => HttpResponse.json(Number(params.placeId) === 21 ? schedule : [])),
  );
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

    const alert = await within(hist).findByRole('alert');
    expect(alert).toHaveTextContent('Vous ne pouvez pas valider une saisie que vous avez faite ou comptée.');
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
});
