import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import AnnoncePage from '@/app/espace/[nodeId]/annonces/[id]/page';
import NouvelleAnnoncePage from '@/app/espace/[nodeId]/annonces/nouvelle/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsChancelier, grantsSecretaire, ids } from '@/testing/mocks/db';
import { f8aState, resetF8a } from '@/testing/mocks/db-f8a';
import { v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { installProseMirrorPolyfill } from '@/testing/prosemirror-polyfill';
import { renderApp } from '@/testing/test-utils';

import { scheduledAt } from '../annonce-editor';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

const nodeId = ids.saintDominique;
const listHref = `/espace/${nodeId}/annonces`;

const renderNew = async (capacites = grantsSecretaire) =>
  renderApp(await NouvelleAnnoncePage({ params: Promise.resolve({ nodeId }) }), { capacites });
const renderExisting = async (id: string) =>
  renderApp(await AnnoncePage({ params: Promise.resolve({ nodeId, id }) }), { capacites: grantsSecretaire });

const fillRequired = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await screen.findByLabelText(/01 — titre/i), 'Quête pour le séminaire');
  await user.selectOptions(await screen.findByLabelText(/catégorie/i), 'Vie paroissiale');
  const body = await screen.findByRole('textbox', { name: 'Corps de l’annonce' });
  await user.click(body);
  await user.type(body, 'Chers frères et sœurs');
};

beforeAll(() => installProseMirrorPolyfill());
beforeEach(() => {
  resetF8a();
  navigation.push.mockClear();
  navigation.replace.mockClear();
});

describe('Éditeur d’annonce (PAR-Annonce-Editeur)', () => {
  it('explique ce qui manque avant d’enregistrer', async () => {
    const user = userEvent.setup();
    await renderNew();

    await user.click(await screen.findByRole('button', { name: 'Enregistrer le brouillon' }));

    expect(await screen.findByText('Le titre est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Choisissez une catégorie.')).toBeInTheDocument();
    expect(screen.getByText('Le corps de l’annonce est vide.')).toBeInTheDocument();
    expect(f8aState.lastBody).toBeNull();
  });

  it('crée un brouillon en HTML assaini puis ouvre sa page', async () => {
    const user = userEvent.setup();
    await renderNew();
    await fillRequired(user);

    await user.click(screen.getByRole('button', { name: 'Enregistrer le brouillon' }));

    await vi.waitFor(() => expect(navigation.replace).toHaveBeenCalled());
    expect(navigation.replace.mock.calls[0][0]).toMatch(new RegExp(`^${listHref}/a0000000`));
    expect(f8aState.lastBody).toMatchObject({
      node_id: nodeId,
      place_id: null,
      title: 'Quête pour le séminaire',
      content: '<p>Chers frères et sœurs</p>',
      content_format: 'html',
      category_id: 1,
      is_sunday_notice: false,
      sunday_date: null,
    });
  });

  it('publie tout de suite et revient à la liste', async () => {
    const user = userEvent.setup();
    await renderNew();
    await fillRequired(user);

    await user.click(screen.getByRole('button', { name: 'Publier maintenant' }));

    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith(listHref));
    expect(f8aState.articles[0]).toMatchObject({ title: 'Quête pour le séminaire', status: 'published' });
  });

  it('exige un dimanche pour une annonce du dimanche', async () => {
    const user = userEvent.setup();
    await renderNew();
    await fillRequired(user);

    await user.click(screen.getByRole('switch', { name: 'Annonce du dimanche' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer le brouillon' }));

    expect(await screen.findByText('Indiquez le dimanche concerné.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nouvelle annonce du dimanche');
  });

  it('programme la publication dans le futur', async () => {
    const user = userEvent.setup();
    await renderNew();
    await fillRequired(user);

    await user.click(screen.getByRole('radio', { name: 'Programmer' }));
    await user.type(screen.getByLabelText('Date'), '2099-09-26');
    await user.click(await screen.findByRole('button', { name: /^programmer · sam\. 26\.09/i }));

    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith(listHref));
    expect(f8aState.articles[0]).toMatchObject({ status: 'scheduled' });
    expect(String(f8aState.articles[0].publish_at)).toMatch(/^2099-09-26T/);
  });

  it('refuse une programmation dans le passé', () => {
    expect(scheduledAt({ publish_date: '2020-01-01', publish_time: '12:00' })).toEqual({
      error: 'La publication programmée doit être dans le futur.',
    });
    expect(scheduledAt({ publish_date: '', publish_time: '12:00' })).toEqual({ error: 'Indiquez la date et l’heure de publication.' });
  });

  it('reporte les erreurs de champ renvoyées par le serveur', async () => {
    server.use(
      http.post(apiUrl('/staff/news/'), () =>
        v1Error(400, 'validation_error', 'Les données envoyées sont invalides.', { title: ['Ce titre est déjà utilisé.'] }),
      ),
    );
    const user = userEvent.setup();
    await renderNew();
    await fillRequired(user);

    await user.click(screen.getByRole('button', { name: 'Enregistrer le brouillon' }));

    expect(await screen.findByText('Ce titre est déjà utilisé.')).toBeInTheDocument();
    expect(screen.getByText('Corrigez les champs signalés.')).toBeInTheDocument();
  });

  it('modifie un brouillon existant et propose de le supprimer', async () => {
    const user = userEvent.setup();
    await renderExisting('a0000000-0000-4000-8000-000000000001');

    const title = await screen.findByLabelText(/01 — titre/i);
    expect(title).toHaveValue('Quête impérée pour le Grand Séminaire de Brin');
    expect(screen.getByLabelText('Portée')).toBeDisabled();
    await user.clear(title);
    await user.type(title, 'Quête impérée du 27 septembre');
    await user.click(screen.getByRole('button', { name: 'Enregistrer le brouillon' }));

    expect(await screen.findByText(/enregistré à/)).toBeInTheDocument();
    expect(f8aState.lastBody).toMatchObject({ title: 'Quête impérée du 27 septembre', is_sunday_notice: true, sunday_date: '2026-09-27' });
    expect(f8aState.lastBody).not.toHaveProperty('node_id');

    await user.click(screen.getByRole('button', { name: 'Supprimer le brouillon' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Supprimer' }));
    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith(listHref));
    expect(f8aState.articles.some((a) => a.id === 'a0000000-0000-4000-8000-000000000001')).toBe(false);
  });

  it('retire une annonce publiée', async () => {
    const user = userEvent.setup();
    await renderExisting('a0000000-0000-4000-8000-000000000003');

    await user.click(await screen.findByRole('button', { name: 'Retirer' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/motif/i), 'Répétition reportée');
    await user.click(within(dialog).getByRole('button', { name: 'Retirer l’annonce' }));

    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith(listHref));
    expect(f8aState.lastBody).toEqual({ reason: 'Répétition reportée' });
  });

  it('montre un aperçu complet assaini', async () => {
    const user = userEvent.setup();
    await renderExisting('a0000000-0000-4000-8000-000000000001');

    await user.click(await screen.findByRole('button', { name: 'Aperçu complet' }));

    expect(within(await screen.findByRole('dialog')).getByText('Chers frères et sœurs.')).toBeInTheDocument();
  });

  it('dit clairement qu’une annonce est introuvable', async () => {
    await renderExisting('a0000000-0000-4000-8000-00000000dead');

    expect(await screen.findByText('Annonce introuvable')).toBeInTheDocument();
  });

  it('masque l’éditeur sans la capacité', async () => {
    await renderNew(grantsChancelier);

    expect(await screen.findByText('Annonces : accès réservé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publier/i })).not.toBeInTheDocument();
  });
});
