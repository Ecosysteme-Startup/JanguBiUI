import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import CampagnePage from '@/app/espace/[nodeId]/dons/campagnes/[fundId]/page';
import NouvelleCampagnePage from '@/app/espace/[nodeId]/dons/campagnes/nouvelle/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { donsIds, grantsEconome, grantsSecretaireDons, staffFunds } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

const nodeId = ids.saintDominique;
const newId = 'd0000000-0000-4000-8000-000000000099';

type Calls = { created: Record<string, unknown>[]; updated: Record<string, unknown>[]; published: string[] };
let calls: Calls;

beforeEach(() => {
  calls = { created: [], updated: [], published: [] };
  navigation.push.mockClear();
  navigation.replace.mockClear();
  server.use(
    http.post(apiUrl('/staff/dons/fonds/'), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      calls.created.push(body);
      return HttpResponse.json({ ...staffFunds()[2], ...body, id: newId, status: 'brouillon', raised: 0, donations_count: 0, published_at: null }, { status: 201 });
    }),
    http.patch(apiUrl('/staff/dons/fonds/:fundId/'), async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      calls.updated.push(body);
      return HttpResponse.json({ ...staffFunds().find((f) => f.id === params.fundId)!, ...body });
    }),
    http.post(apiUrl('/staff/dons/fonds/:fundId/publier/'), ({ params }) => {
      calls.published.push(String(params.fundId));
      return HttpResponse.json({ ...staffFunds()[2], id: params.fundId, status: 'ouvert' });
    }),
    http.post(apiUrl('/files/upload/standard/'), () => HttpResponse.json({ id: 555 }, { status: 201 })),
  );
});

const renderNew = async (capacites = grantsEconome) =>
  renderApp(await NouvelleCampagnePage({ params: Promise.resolve({ nodeId }) }), { capacites });

const fill = async (user: ReturnType<typeof userEvent.setup>, { start = '2026-10-01', end = '2026-12-31' } = {}) => {
  await user.type(await screen.findByLabelText(/^Titre/), 'Nouveaux bancs pour la chapelle de la Cité universitaire');
  await user.type(screen.getByLabelText(/^Usage des fonds/), 'Remplacer les 40 bancs de la chapelle, abîmés par l’humidité.');
  await user.type(screen.getByLabelText(/^Objectif/), '2 400 000');
  fireEvent.change(screen.getByLabelText(/^Début/), { target: { value: start } });
  fireEvent.change(screen.getByLabelText(/^Fin/), { target: { value: end } });
  await user.type(screen.getByLabelText(/^Référence de l’autorisation/), 'ARCH-DAK-2026-041');
};

const expected = {
  node: nodeId,
  kind: 'campagne',
  title: 'Nouveaux bancs pour la chapelle de la Cité universitaire',
  description: 'Remplacer les 40 bancs de la chapelle, abîmés par l’humidité.',
  goal_amount: 2_400_000,
  starts_on: '2026-10-01',
  ends_on: '2026-12-31',
  authorization_ref: 'ARCH-DAK-2026-041',
};

describe('Éditeur de campagne (WEB-PAR-Campagne-Editeur)', () => {
  it('enregistre un brouillon et ouvre sa page', async () => {
    const user = userEvent.setup();
    await renderNew();
    await fill(user);

    const apercu = screen.getByRole('complementary', { name: 'Aperçu pour les fidèles' });
    expect(within(apercu).getAllByText('Nouveaux bancs pour la chapelle de la Cité universitaire')).toHaveLength(2);
    expect(within(apercu).getByText(/1er oct\. au 31 déc\./)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enregistrer en brouillon' }));

    await vi.waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(`/espace/${nodeId}/dons/campagnes/${newId}`));
    expect(calls.created).toEqual([{ ...expected, image_id: null }]);
    expect(calls.published).toEqual([]);
  });

  it('crée puis publie, avec le visuel déposé', async () => {
    const user = userEvent.setup();
    await renderNew();
    await fill(user);

    await user.upload(screen.getByLabelText('Visuel de la campagne'), new File(['x'], 'chapelle-bancs.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByText('chapelle-bancs.jpg')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publier maintenant' }));

    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith(`/espace/${nodeId}/dons`));
    expect(calls.created).toEqual([{ ...expected, image_id: 555 }]);
    expect(calls.published).toEqual([newId]);
  });

  it('refuse une fin avant le début, côté client', async () => {
    const user = userEvent.setup();
    await renderNew();
    await fill(user, { start: '2026-10-01', end: '2026-09-30' });

    await user.click(screen.getByRole('button', { name: 'Publier maintenant' }));

    expect(await screen.findByText('La fin doit suivre le début.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Fin/)).toHaveAttribute('aria-invalid', 'true');
    expect(calls.created).toEqual([]);
  });

  it('affiche sous le champ l’erreur de dates renvoyée par le serveur', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(apiUrl('/staff/dons/fonds/'), () =>
        HttpResponse.json(
          { error: { code: 'validation_error', message: 'La fin doit suivre le début.', details: { ends_on: ['La fin doit suivre le début.'] } } },
          { status: 400 },
        ),
      ),
    );
    await renderNew();
    await fill(user);

    await user.click(screen.getByRole('button', { name: 'Enregistrer en brouillon' }));

    expect(await screen.findByText('La fin doit suivre le début.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Fin/)).toHaveAttribute('aria-invalid', 'true');
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('modifie une campagne ouverte sans renvoyer le visuel', async () => {
    const user = userEvent.setup();
    await renderApp(await CampagnePage({ params: Promise.resolve({ nodeId, fundId: donsIds.toiture }) }), { capacites: grantsEconome });

    const titre = await screen.findByLabelText(/^Titre/);
    expect(titre).toHaveValue('Toiture de la chapelle de la Cité universitaire');
    expect(screen.getAllByText('Ouverte')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Publier maintenant' })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^Objectif/));
    await user.type(screen.getByLabelText(/^Objectif/), '5000000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await vi.waitFor(() => expect(calls.updated).toHaveLength(1));
    expect(calls.updated[0]).toMatchObject({ goal_amount: 5_000_000, starts_on: '2026-06-01', ends_on: '2026-12-31' });
    expect(calls.updated[0]).not.toHaveProperty('image_id');
  });

  it('annule vers la page des dons', async () => {
    await renderNew();

    expect(await screen.findByRole('link', { name: 'Annuler' })).toHaveAttribute('href', `/espace/${nodeId}/dons`);
  });

  it('est réservé à dons.gerer_fonds', async () => {
    await renderNew(grantsSecretaireDons);

    expect(await screen.findByText('Campagnes : accès réservé')).toBeInTheDocument();
  });
});
