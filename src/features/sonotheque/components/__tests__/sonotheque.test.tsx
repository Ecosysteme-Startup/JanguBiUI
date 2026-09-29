import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { buildNavItems } from '@/config/nav-config';
import { canPublishAudio } from '@/lib/authorization';
import { createUser } from '@/testing/data-generators';
import {
  ALBUMS,
  ALBUM_RESERVE_ID,
  PISTES_SAINT_JOSEPH,
  SOURCES,
} from '@/testing/mocks/handlers/sonotheque';
import { resetParoissesMocks } from '@/testing/mocks/handlers/paroisses';
import { usePlayerStore } from '@/lib/player/player-store';
import { server } from '@/testing/mocks/server';
import {
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

import {
  StorageUploadError,
  uploadToStorage,
  type StorageUploader,
  type UploadProgress,
} from '../../api/upload-to-storage';
import { AlbumVue } from '../album-vue';
import { EcouterAccueil } from '../ecouter-accueil';
import { RechercheVue } from '../recherche-vue';
import { AjouterEnregistrements } from '../staff/ajouter-enregistrements';
import { VisibiliteBadge } from '../visibilite-badge';

const A = `${env.API_URL}/v1/audio`;

const fichierAudio = (nom: string, taille = 1024 * 1024) =>
  new File([new Uint8Array(taille)], nom, { type: 'audio/mp4' });

/** Uploader pilotable : chaque appel attend qu'on le résolve ou le rejette. */
function uploaderPilote() {
  const appels: {
    onProgress: (p: UploadProgress) => void;
    resoudre: () => void;
    rejeter: (e: Error) => void;
  }[] = [];
  const uploader: StorageUploader = (_presign, _file, onProgress) =>
    new Promise<void>((resoudre, rejeter) => {
      appels.push({ onProgress, resoudre, rejeter });
    });
  return { uploader, appels };
}

async function preparerEnvoi(nom: string, uploader: StorageUploader) {
  const user = userEvent.setup();
  renderApp(<AjouterEnregistrements uploader={uploader} intervalleSuivi={5} />);
  // Sources du staff chargées (première source sélectionnée).
  await screen.findByRole('option', { name: /Chorale Sainte-Cécile/ });
  await user.upload(
    screen.getByLabelText('Choisir des fichiers audio'),
    fichierAudio(nom),
  );
  return user;
}

describe('Envoi d’enregistrements (staff)', () => {
  test('la case des droits est obligatoire avant l’envoi', async () => {
    const { uploader, appels } = uploaderPilote();
    const user = await preparerEnvoi('01-chant-entree.m4a', uploader);

    await user.click(
      screen.getByRole('button', { name: /^Envoyer 1\sfichier$/ }),
    );

    expect(
      await screen.findByText(/Cochez cette case pour envoyer/),
    ).toBeInTheDocument();
    expect(appels).toHaveLength(0);
  });

  test('progression de l’envoi, puis suivi de l’encodage jusqu’à « Prêt »', async () => {
    const { uploader, appels } = uploaderPilote();
    const user = await preparerEnvoi('09-priere-universelle.m4a', uploader);

    await user.click(
      screen.getByRole('checkbox', { name: /Je confirme disposer des droits/ }),
    );
    await user.click(
      screen.getByRole('button', { name: /^Envoyer 1\sfichier$/ }),
    );

    await waitFor(() => expect(appels).toHaveLength(1));
    appels[0].onProgress({ loaded: 400, total: 1000 });
    const barre = await screen.findByRole('progressbar', {
      name: /Envoi de 09-priere-universelle\.m4a/,
    });
    await waitFor(() => expect(barre).toHaveAttribute('aria-valuenow', '40'));
    expect(screen.getByText('Envoi · 40 %')).toBeInTheDocument();

    appels[0].resoudre();

    // « terminer/ » puis suivi : étapes affichées, puis prêt.
    expect(
      await screen.findByRole('list', { name: 'Étapes de l’encodage' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Normalisation du volume')).toBeInTheDocument();
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-fichier="09-priere-universelle.m4a"]'),
        ).toHaveAttribute('data-etape', 'pret'),
      { timeout: 3000 },
    );
    expect(
      screen.getByRole('button', { name: /^Publier 1\spiste prête$/ }),
    ).toBeEnabled();
  });

  test('erreur d’envoi lisible, puis « Réessayer » reprend sans recréer la piste', async () => {
    let creations = 0;
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url === `${A}/uploads/`) {
        creations += 1;
      }
    });
    const { uploader, appels } = uploaderPilote();
    const user = await preparerEnvoi('11-sanctus.m4a', uploader);
    await user.click(
      screen.getByRole('checkbox', { name: /Je confirme disposer des droits/ }),
    );
    await user.click(
      screen.getByRole('button', { name: /^Envoyer 1\sfichier$/ }),
    );
    await waitFor(() => expect(appels).toHaveLength(1));

    appels[0].rejeter(
      new StorageUploadError(
        'La connexion a été interrompue pendant l’envoi.',
        0,
      ),
    );

    const alerte = await screen.findByRole('alert');
    expect(
      within(alerte).getByText('L’envoi s’est interrompu.'),
    ).toBeInTheDocument();
    expect(
      within(alerte).getByText(
        'La connexion a été interrompue pendant l’envoi.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    await waitFor(() => expect(appels).toHaveLength(2));
    appels[1].resoudre();

    await waitFor(
      () =>
        expect(
          document.querySelector('[data-fichier="11-sanctus.m4a"]'),
        ).toHaveAttribute('data-etape', 'pret'),
      { timeout: 3000 },
    );
    // L'autorisation d'envoi était encore valable : pas de seconde piste.
    expect(creations).toBe(1);
    server.events.removeAllListeners();
  });

  test('échec d’encodage avec motif lisible, relancé par « Réessayer »', async () => {
    const uploader: StorageUploader = async (_p, f, onProgress) => {
      onProgress({ loaded: f.size, total: f.size });
    };
    const user = await preparerEnvoi('13-chant-envoi.m4a', uploader);
    await user.click(
      screen.getByRole('checkbox', { name: /Je confirme disposer des droits/ }),
    );
    await user.click(
      screen.getByRole('button', { name: /^Envoyer 1\sfichier$/ }),
    );

    const alerte = await screen.findByRole('alert', {}, { timeout: 3000 });
    expect(
      within(alerte).getByText('L’encodage a échoué.'),
    ).toBeInTheDocument();
    expect(
      within(alerte).getByText(/incomplet ou endommagé/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-fichier="13-chant-envoi.m4a"]'),
        ).toHaveAttribute('data-etape', 'pret'),
      { timeout: 3000 },
    );
  });

  test('un fichier trop gros ou d’un autre format est refusé avec un message clair', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderApp(<AjouterEnregistrements uploader={vi.fn()} />);
    await user.upload(screen.getByLabelText('Choisir des fichiers audio'), [
      new File(['x'], 'photo.jpg', { type: 'image/jpeg' }),
    ]);
    expect(
      await screen.findByText(/Ce format n’est pas accepté/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled();
  });
});

describe('uploadToStorage (POST présigné en XHR)', () => {
  class FauxXHR {
    static dernier: FauxXHR;
    upload: { onprogress: ((e: ProgressEvent) => void) | null } = {
      onprogress: null,
    };
    status = 0;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    corps: FormData | null = null;
    entetes: Record<string, string> = {};
    open = vi.fn();
    abort = vi.fn();
    setRequestHeader = (k: string, v: string) => {
      this.entetes[k] = v;
    };
    send = (corps: FormData) => {
      this.corps = corps;
    };
    constructor() {
      FauxXHR.dernier = this;
    }
  }

  beforeEach(() => vi.stubGlobal('XMLHttpRequest', FauxXHR));
  afterEach(() => vi.unstubAllGlobals());

  test('envoie les champs puis le fichier en dernier, et remonte la progression', async () => {
    const progres: UploadProgress[] = [];
    const fichier = fichierAudio('homelie.m4a', 10);
    const promesse = uploadToStorage(
      {
        method: 'POST',
        url: 'https://stockage.jangubi.sn/jangubi-media',
        fields: { key: 'audio-raw/x.m4a', policy: 'p' },
      },
      fichier,
      (p) => progres.push(p),
    );
    const xhr = FauxXHR.dernier;
    expect([...xhr.corps!.keys()]).toEqual(['key', 'policy', 'file']);
    xhr.upload.onprogress!({
      lengthComputable: true,
      loaded: 5,
      total: 10,
    } as ProgressEvent);
    xhr.status = 204;
    xhr.onload!();
    await promesse;
    expect(progres[0]).toEqual({ loaded: 5, total: 10 });
    expect(progres.at(-1)).toEqual({ loaded: 10, total: 10 });
  });

  test('autorisation expirée : message lisible', async () => {
    const promesse = uploadToStorage(
      { method: 'POST', url: 'https://s3', fields: { key: 'k' } },
      fichierAudio('a.mp3', 4),
      () => undefined,
    );
    FauxXHR.dernier.status = 403;
    FauxXHR.dernier.onload!();
    await expect(promesse).rejects.toThrow(/L’autorisation d’envoi a expiré/);
  });
});

describe('Visibilité', () => {
  test('album réservé aux paroissiens : mention explicite', async () => {
    const messe = ALBUMS.find((a) => a.kind === 'messe')!;
    renderApp(<AlbumVue albumId={messe.id} />);
    expect(
      await screen.findByRole('heading', { name: messe.title }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Réservé aux paroissiens de Saint-Dominique'),
    ).toBeInTheDocument();
  });

  test('album réservé, non-membre (décision 4) : pistes verrouillées, « Ajouter cette paroisse »', async () => {
    resetParoissesMocks();
    let lecture = 0;
    server.use(
      http.post(`${A}/pistes/:id/lecture/`, () => {
        lecture += 1;
        return undefined;
      }),
    );
    const saintJoseph = ALBUMS.find(
      (a) => a.title === 'Messe de la Saint-Joseph 2026',
    )!;
    const user = userEvent.setup();
    renderApp(<AlbumVue albumId={saintJoseph.id} />);
    expect(
      await screen.findByRole('heading', {
        name: 'Réservé aux paroissiens de Saint-Joseph de Médina',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Vous voyez la liste des pistes/),
    ).toBeInTheDocument();
    // Pochette, titre, source ET liste des titres avec durées.
    const table = screen.getByRole('table', {
      name: 'Pistes de Messe de la Saint-Joseph 2026',
    });
    const lignes = within(table).getAllByRole('row').slice(1);
    expect(lignes).toHaveLength(PISTES_SAINT_JOSEPH.length);
    expect(lignes[0]).toHaveTextContent('Hymne à saint Joseph');
    expect(lignes[0]).toHaveTextContent('Piste 1 · lecture réservée');
    expect(lignes[0]).toHaveTextContent('3:54');
    expect(
      within(lignes[0]).getByLabelText('Réservé aux paroissiens'),
    ).toBeInTheDocument();
    // Lecture impossible : ni « Lire », ni bouton par piste.
    expect(screen.queryByRole('button', { name: 'Lire' })).toBeNull();
    expect(within(table).queryByRole('button', { name: /Lire/ })).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Ajouter cette paroisse' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Ajouter Saint-Joseph de Médina',
    });
    expect(
      await within(dialog).findByText(
        'Saint-Dominique reste votre paroisse principale.',
      ),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: 'Ajouter à mes paroisses' }),
    );
    // Membre : l'album s'ouvre et se lit.
    const lire = await screen.findByRole('button', { name: 'Lire' });
    expect(
      screen.queryByRole('heading', {
        name: 'Réservé aux paroissiens de Saint-Joseph de Médina',
      }),
    ).toBeNull();
    await user.click(lire);
    await waitFor(() => expect(lecture).toBe(1));
    await waitFor(() =>
      expect(usePlayerStore.getState().current?.title).toBe(
        'Hymne à saint Joseph',
      ),
    );
    usePlayerStore.getState().stop();
  });

  test('album non visible (404) : message sobre, sans dire s’il existe', async () => {
    renderApp(<AlbumVue albumId={ALBUM_RESERVE_ID} />);
    expect(
      await screen.findByText('Cet album n’est pas accessible'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/réservé aux paroissiens d’une autre paroisse/),
    ).toBeInTheDocument();
  });

  test('pastilles : Public, Paroissiens, Privé', () => {
    renderApp(
      <>
        <VisibiliteBadge visibilite="public" />
        <VisibiliteBadge visibilite="paroisse" />
        <VisibiliteBadge visibilite="prive" />
      </>,
    );
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Paroissiens')).toBeInTheDocument();
    expect(screen.getByText('Privé')).toBeInTheDocument();
  });
});

describe('Recherche', () => {
  test('aucun résultat : état vide explicite', async () => {
    renderApp(<RechercheVue qInitiale="introuvable" />);
    expect(
      await screen.findByText('Aucun résultat pour « introuvable »'),
    ).toBeInTheDocument();
  });

  test('moins de deux lettres : aide, sans appel à l’API', async () => {
    const appel = vi.fn();
    server.use(
      http.get(`${A}/recherche/`, () => {
        appel();
        return HttpResponse.json({ results: [], next_cursor: null });
      }),
    );
    renderApp(<RechercheVue qInitiale="k" />);
    expect(
      screen.getByText(/Saisissez au moins deux lettres/),
    ).toBeInTheDocument();
    expect(appel).not.toHaveBeenCalled();
  });

  test('résultats sans accents (careme → Carême)', async () => {
    renderApp(<RechercheVue qInitiale="careme" />);
    expect(
      await screen.findByRole('button', {
        name: /^Lire « Le jeûne qui plaît à Dieu »/,
      }),
    ).toBeInTheDocument();
  });
});

describe('Aucun classement entre sources', () => {
  test('les sources sont listées par ordre alphabétique, quel que soit l’ordre reçu', async () => {
    server.use(
      http.get(`${A}/sources/`, () =>
        HttpResponse.json([...SOURCES].reverse()),
      ),
    );
    renderApp(<EcouterAccueil />);
    const liste = await screen.findByRole('list', {
      name: 'Sources, par ordre alphabétique',
    });
    const noms = within(liste)
      .getAllByRole('link')
      .map((a) => a.querySelector('[data-nom]')?.textContent);
    expect(noms).toEqual([
      'Chorale Saint-Joseph de Médina',
      'Chorale Sainte-Cécile',
      'Mouvement des Scouts',
      'Paroisse Saint-Dominique',
    ]);
    expect(
      screen.getByText('Sources présentées par ordre alphabétique.'),
    ).toBeInTheDocument();
  });
});

describe('Navigation et droits', () => {
  test('le fidèle a l’entrée « Écouter », pas « Sonothèque »', () => {
    const labels = buildNavItems(createUser()).map((i) => i.label);
    expect(labels).toContain('Écouter');
    expect(labels).not.toContain('Sonothèque');
  });

  test('« Sonothèque » seulement avec la capacité audio.publier', () => {
    const avec = createUser({
      role: 'parish_admin',
      is_admin: true,
      capabilities: ['audio.publier'],
    });
    const sans = createUser({
      role: 'parish_admin',
      is_admin: true,
      capabilities: ['dons.voir_fonds'],
    });
    expect(canPublishAudio(avec)).toBe(true);
    expect(canPublishAudio(sans)).toBe(false);
    expect(buildNavItems(avec).map((i) => i.label)).toContain('Sonothèque');
    expect(buildNavItems(sans).map((i) => i.label)).not.toContain('Sonothèque');
  });
});
