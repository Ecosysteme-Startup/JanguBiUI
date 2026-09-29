import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import {
  ALBUMS,
  ALBUM_BROUILLON_ID,
  PISTES_HOMELIES,
  PISTES_MESSE,
  resetSonothequeMocks,
  signalements,
} from '@/testing/mocks/handlers/sonotheque';
import { server } from '@/testing/mocks/server';
import {
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

import type { StorageUploader } from '../../api/upload-to-storage';
import type { StaffTrack } from '../../types/schemas';
import { AlbumVue } from '../album-vue';
import { EcouterAccueil, regrouperNouveautes } from '../ecouter-accueil';
import { AjouterEnregistrements } from '../staff/ajouter-enregistrements';
import { EtapesEncodage } from '../staff/etapes-encodage';
import { SonothequeStaff } from '../staff/sonotheque-staff';

const A = `${env.API_URL}/v1/audio`;

beforeEach(() => resetSonothequeMocks());

describe('Accueil « Écouter » (GET audio/accueil/)', () => {
  test('affiche les sections de la maquette en un seul appel', async () => {
    renderApp(<EcouterAccueil />);

    expect(
      await screen.findByRole('heading', { name: 'Reprendre l’écoute' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Le jeûne qui plaît à Dieu')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Reprendre 25e dimanche · Les ouvriers de la onzième heure',
      }),
    ).toBeInTheDocument();

    // Nouveautés : une carte par album, pas une par piste.
    expect(
      screen.getByRole('heading', { name: 'Nouveautés de ma paroisse' }),
    ).toBeInTheDocument();
    const messe = screen.getByRole('link', {
      name: /Messe du 27 septembre 2026/,
    });
    expect(messe).toHaveTextContent(/5\snouvelles/);

    expect(
      screen.getAllByText('Parce que vous avez écouté Magnificat').length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByRole('button', { name: 'Les désactiver' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Playlists de la paroisse' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Pour prier le matin/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Temps liturgique' }),
    ).toBeInTheDocument();
    const temps = screen.getByRole('list', {
      name: 'Pour le temps ordinaire',
    });
    expect(
      within(temps).getByRole('button', {
        name: `Lire « ${PISTES_HOMELIES[2].title} »`,
      }),
    ).toBeInTheDocument();
  });

  test('sans paroisse suivie : invitation sobre à en choisir une', async () => {
    server.use(
      http.get(`${A}/accueil/`, () =>
        HttpResponse.json({
          paroisse: null,
          reprendre: [],
          nouveautes_ma_paroisse: [],
          pour_vous: [],
          playlists_paroisse: [],
          temps_liturgique: null,
        }),
      ),
    );
    renderApp(<EcouterAccueil />);
    expect(
      await screen.findByText('Suivez votre paroisse'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Reprendre l’écoute' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Temps liturgique' }),
    ).not.toBeInTheDocument();
  });

  test('regroupe les nouveautés par album, dans l’ordre reçu', () => {
    const g = regrouperNouveautes([
      PISTES_MESSE[0],
      PISTES_HOMELIES[2],
      PISTES_MESSE[1],
      { ...PISTES_HOMELIES[0], album: null, id: 'hors-album' },
    ]);
    expect(g.map((x) => x.cle)).toEqual([
      `album:${PISTES_MESSE[0].album!.id}`,
      `album:${PISTES_HOMELIES[2].album!.id}`,
      'piste:hors-album',
    ]);
    expect(g[0].pistes).toHaveLength(2);
  });
});

describe('Espace staff : albums', () => {
  test('liste les albums, brouillons compris, et publie un brouillon', async () => {
    const user = userEvent.setup();
    renderApp(<SonothequeStaff />);
    await user.click(await screen.findByRole('tab', { name: /^Albums/ }));

    const liste = await screen.findByRole('list', {
      name: 'Albums de la sonothèque',
    });
    const brouillon = liste.querySelector(
      `[data-album="${ALBUM_BROUILLON_ID}"]`,
    ) as HTMLElement;
    expect(
      within(brouillon).getByText('Veillée de prière de la rentrée'),
    ).toBeInTheDocument();
    expect(within(brouillon).getByText('Brouillon')).toBeInTheDocument();

    await user.click(
      within(brouillon).getByRole('button', {
        name: 'Publier Veillée de prière de la rentrée',
      }),
    );
    await waitFor(() =>
      expect(
        within(brouillon).queryByText('Brouillon'),
      ).not.toBeInTheDocument(),
    );
  });

  test('modifie le titre, le type et la visibilité d’un album', async () => {
    let patch: Record<string, unknown> | null = null;
    server.events.on('request:start', async ({ request }) => {
      if (request.method === 'PATCH' && request.url.includes('/staff/albums/'))
        patch = (await request.clone().json()) as Record<string, unknown>;
    });
    const user = userEvent.setup();
    renderApp(<SonothequeStaff />);
    await user.click(await screen.findByRole('tab', { name: /^Albums/ }));
    await user.click(
      await screen.findByRole('button', {
        name: 'Modifier Homélies du temps ordinaire',
      }),
    );
    const dialogue = await screen.findByRole('dialog');
    const titre = within(dialogue).getByLabelText('Titre de l’album');
    await user.clear(titre);
    await user.type(titre, 'Homélies du Père Emmanuel Tine');
    await user.selectOptions(
      within(dialogue).getByLabelText('Type'),
      'Homélies',
    );
    await user.click(within(dialogue).getByRole('radio', { name: /Privé/ }));
    await user.click(
      within(dialogue).getByRole('button', { name: 'Enregistrer' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(patch).toMatchObject({
      title: 'Homélies du Père Emmanuel Tine',
      kind: 'homelies',
      visibility: 'prive',
    });
    expect(
      await screen.findByText('Homélies du Père Emmanuel Tine'),
    ).toBeInTheDocument();
    server.events.removeAllListeners();
  });

  test('colonne « Écoutes 30 j » et encodage réel dans le tableau', async () => {
    renderApp(<SonothequeStaff />);
    const table = await screen.findByRole('table', {
      name: 'Pistes de la sonothèque',
    });
    const ligne = (titre: string) =>
      within(table).getByText(titre).closest('tr') as HTMLElement;
    await waitFor(() =>
      expect(within(table).getByText('Magnificat')).toBeInTheDocument(),
    );
    expect(within(ligne('Magnificat')).getByText('186')).toBeInTheDocument();
    const prière = ligne('Prière universelle');
    expect(within(prière).getByText('Encodage · 62 %')).toBeInTheDocument();
    expect(
      within(prière).getByText('Encodage en 3 qualités'),
    ).toBeInTheDocument();
    // Pas encore publié : pas d'écoutes.
    expect(within(ligne('Louange d’ouverture')).getAllByText('—').length).toBe(
      2,
    );
  });
});

describe('Envoi : albums et pochette', () => {
  const pochette = () =>
    new File([new Uint8Array(2048)], 'veillee.jpg', { type: 'image/jpeg' });

  test('le choix d’album inclut les brouillons', async () => {
    renderApp(<AjouterEnregistrements uploader={vi.fn()} />);
    await screen.findByRole('option', { name: /Chorale Sainte-Cécile/ });
    await userEvent
      .setup()
      .selectOptions(
        screen.getByRole('combobox', { name: 'Source' }),
        'Paroisse : Paroisse Saint-Dominique',
      );
    expect(
      await screen.findByRole('option', {
        name: 'Veillée de prière de la rentrée (brouillon)',
      }),
    ).toBeInTheDocument();
  });

  test('pochette envoyée pour de vrai : POST présigné puis terminer/', async () => {
    const envois: string[] = [];
    const uploader: StorageUploader = async (presign, file, onProgress) => {
      envois.push(presign.url);
      onProgress({ loaded: file.size, total: file.size });
    };
    const messe = ALBUMS[0];
    const user = userEvent.setup();
    renderApp(<AjouterEnregistrements uploader={uploader} />);
    await screen.findByRole('option', { name: /Chorale Sainte-Cécile/ });
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Source' }),
      'Paroisse : Paroisse Saint-Dominique',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Album' }),
      await screen.findByRole('option', { name: messe.title }),
    );
    await user.upload(
      screen.getByLabelText('Choisir une pochette'),
      pochette(),
    );

    expect(
      await screen.findByText('Pochette enregistrée.'),
    ).toBeInTheDocument();
    expect(envois).toHaveLength(1);
    expect(envois[0]).toContain(`/staff/albums/${messe.id}/pochette/`);
  });

  test('pochette refusée si ce n’est pas une image', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderApp(<AjouterEnregistrements uploader={vi.fn()} />);
    await screen.findByRole('option', { name: /Chorale Sainte-Cécile/ });
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Album' }),
      await screen.findByRole('option', { name: 'Chants de la Visitation' }),
    );
    await user.upload(
      screen.getByLabelText('Choisir une pochette'),
      new File(['x'], 'livret.pdf', { type: 'application/pdf' }),
    );
    expect(
      await screen.findByText('Choisissez une image JPG, PNG ou WebP.'),
    ).toBeInTheDocument();
  });

  test('« Nouvel album » : création avec pochette, puis album sélectionné', async () => {
    const envois: string[] = [];
    const uploader: StorageUploader = async (presign) => {
      envois.push(presign.url);
    };
    const user = userEvent.setup();
    renderApp(<AjouterEnregistrements uploader={uploader} />);
    await screen.findByRole('option', { name: /Chorale Sainte-Cécile/ });
    await user.click(screen.getByRole('button', { name: 'Nouvel album' }));

    const dialogue = await screen.findByRole('dialog');
    await user.type(
      within(dialogue).getByLabelText('Titre de l’album'),
      'Messe de la Saint-Michel',
    );
    await user.upload(
      within(dialogue).getByLabelText('Choisir une pochette'),
      pochette(),
    );
    await user.click(
      within(dialogue).getByRole('button', { name: 'Créer l’album' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatch(
      /\/staff\/albums\/[^/]+\/pochette\/\d+\/local\/$/,
    );
    const album = screen.getByRole('combobox', { name: 'Album' });
    await waitFor(() =>
      expect(album).toHaveDisplayValue('Messe de la Saint-Michel (brouillon)'),
    );
  });
});

describe('Étapes de l’encodage (encoding_step / encoding_percent)', () => {
  const piste = (extra: Partial<StaffTrack>): StaffTrack => ({
    ...PISTES_MESSE[0],
    own_visibility: 'paroisse',
    status: 'encodage',
    failure_reason: null,
    version: 1,
    encoded_version: null,
    encoded_at: null,
    hidden_at: null,
    created_at: null,
    encoding_step: '',
    encoding_percent: 0,
    plays_30d: null,
    ...extra,
  });
  const etats = () =>
    [...document.querySelectorAll('li[data-etape]')].map((li) =>
      li.getAttribute('data-etape'),
    );

  test('étape courante, qualités détaillées et pourcentage', () => {
    renderApp(
      <EtapesEncodage
        track={piste({ encoding_step: 'qualites', encoding_percent: 41 })}
      />,
    );
    expect(etats()).toEqual(['fait', 'fait', 'en_cours', 'a_venir']);
    expect(
      screen.getByRole('progressbar', { name: 'Avancement de l’encodage' }),
    ).toHaveAttribute('aria-valuenow', '41');
    expect(
      screen.getByText(
        'Bas 32 kb/s prêt · moyen 64 kb/s en cours · haut 128 kb/s',
      ),
    ).toBeInTheDocument();
  });

  test('échec : l’étape atteinte reste marquée', () => {
    renderApp(
      <EtapesEncodage
        track={piste({
          status: 'echec',
          encoding_step: 'normalisation',
          encoding_percent: 15,
        })}
      />,
    );
    expect(etats()).toEqual(['fait', 'echec', 'a_venir', 'a_venir']);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('en file : rien de commencé, barre à 0', () => {
    renderApp(<EtapesEncodage track={piste({ status: 'en_file' })} />);
    expect(etats()).toEqual(['a_venir', 'a_venir', 'a_venir', 'a_venir']);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});

describe('Signalement d’un album', () => {
  test('« Tout l’album » par défaut : POST albums/<id>/signaler/', async () => {
    const messe = ALBUMS[0];
    const user = userEvent.setup();
    renderApp(<AlbumVue albumId={messe.id} />);
    await user.click(
      await screen.findByRole('button', { name: 'Signaler un contenu' }),
    );
    const dialogue = await screen.findByRole('dialog');
    expect(
      within(dialogue).getByRole('combobox', { name: 'Contenu concerné' }),
    ).toHaveDisplayValue(`Tout l’album « ${messe.title} »`);
    await user.selectOptions(
      within(dialogue).getByRole('combobox', { name: 'Motif' }),
      'Contenu inapproprié',
    );
    await user.click(
      within(dialogue).getByRole('button', { name: 'Envoyer le signalement' }),
    );
    await waitFor(() => expect(signalements).toHaveLength(1));
    expect(signalements[0]).toMatchObject({
      cible: 'album',
      id: messe.id,
      motif: 'inapproprie',
    });
  });

  test('une piste choisie : POST pistes/<id>/signaler/', async () => {
    const urls: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url.includes('/signaler/'))
        urls.push(request.url);
    });
    const messe = ALBUMS[0];
    const user = userEvent.setup();
    renderApp(<AlbumVue albumId={messe.id} />);
    await user.click(
      await screen.findByRole('button', { name: 'Signaler un contenu' }),
    );
    const dialogue = await screen.findByRole('dialog');
    await user.selectOptions(
      within(dialogue).getByRole('combobox', { name: 'Contenu concerné' }),
      'Kyrie',
    );
    await user.click(
      within(dialogue).getByRole('button', { name: 'Envoyer le signalement' }),
    );
    await waitFor(() => expect(urls).toHaveLength(1));
    expect(urls[0]).toBe(`${A}/pistes/${PISTES_MESSE[1].id}/signaler/`);
    server.events.removeAllListeners();
  });
});
