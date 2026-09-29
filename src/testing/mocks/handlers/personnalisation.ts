import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

// Personnalisation (repris de main) : « Pour vous aujourd'hui » et signaux de lecture
// (API-PAROLE-POUR-VOUS), réglages d'écoute, présence dans la messagerie (TEMPS-REEL §2).

export const pourVousMarieTherese = {
  date: '2026-09-27',
  personnalise: true,
  personnalisation_parole: true,
  verset: {
    id: 23412,
    reference: 'Matthieu 7, 21',
    livre: { id: 47, nom: 'Matthieu', slug: 'matthieu' },
    chapitre: 7,
    numero: 21,
    texte:
      'Ce ne sont pas ceux qui me disent : Seigneur, Seigneur ! qui entreront dans le royaume des cieux ; mais celui qui fait la volonté de mon Père qui est dans les cieux, celui-là entrera dans le royaume des cieux.',
    raisons: ["En lien avec l'évangile du jour", 'Parce que vous lisez Luc'],
  },
  autres_versets: [
    {
      id: 30118,
      reference: 'Jacques 1, 22',
      livre: { id: 66, nom: 'Jacques', slug: 'jacques' },
      chapitre: 1,
      numero: 22,
      texte:
        "Mettez la parole en pratique, et ne vous contentez pas de l'écouter, en vous trompant vous-mêmes.",
      raisons: ["En lien avec l'évangile du jour", 'Parce que vous lisez Luc'],
    },
    {
      id: 29164,
      reference: 'Philippiens 2, 5',
      livre: { id: 58, nom: 'Philippiens', slug: 'philippiens' },
      chapitre: 2,
      numero: 5,
      texte:
        'Ayez en vous les mêmes sentiments dont était animé le Christ Jésus.',
      raisons: [
        'En lien avec les lectures du jour',
        'Parce que vous lisez Luc',
      ],
    },
  ],
  lecture_a_continuer: {
    reference: 'Luc 9',
    livre: { id: 49, nom: 'Luc', slug: 'luc' },
    chapitre: 9,
    reprendre_au_verset: 27,
  },
  livre_suggere: {
    id: 51,
    nom: 'Actes',
    slug: 'actes',
    raison: 'Parce que vous lisez Luc',
  },
  plan_suggere: null,
  raisons: ["En lien avec l'évangile du jour", 'Parce que vous lisez Luc'],
};

/** Repli (§5.3) : verset des lectures du jour. */
export const pourVousRepli = {
  date: '2026-09-27',
  personnalise: false,
  personnalisation_parole: true,
  verset: {
    id: 24110,
    reference: 'Matthieu 21, 28',
    livre: { id: 47, nom: 'Matthieu', slug: 'matthieu' },
    chapitre: 21,
    numero: 28,
    texte:
      "Mais que vous en semble ? Un homme avait deux fils ; s'adressant au premier, il lui dit : Mon fils, va aujourd'hui travailler à ma vigne.",
    raisons: ["Tiré de l'évangile du jour"],
  },
  autres_versets: [],
  lecture_a_continuer: null,
  livre_suggere: null,
  plan_suggere: null,
  raisons: ["Tiré de l'évangile du jour"],
};

let personnalisationParole = true;
let historiqueEfface = false;
let prochainSignet = 318;

const aujourdhuiA = (h: number, m: number) => {
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
};

const PRESENCES: Record<
  string,
  { online: boolean; last_seen_at: string | null }
> = {
  'user-priest': { online: true, last_seen_at: null },
  'user-sister': { online: false, last_seen_at: aujourdhuiA(8, 2) },
  'pere-emmanuel-tine': { online: true, last_seen_at: null },
  'abbe-augustin-ndiaye': { online: false, last_seen_at: aujourdhuiA(8, 2) },
  'anna-sarr': { online: true, last_seen_at: null },
  'cecile-coly': { online: false, last_seen_at: aujourdhuiA(9, 24) },
  // Abbé Robert Sagna, Marie-Thérèse Diouf, Paul Diatta, Joseph Mendy :
  // présence masquée, absents de la réponse.
};

// Réglage « montrer ma présence » : défaut fidèle (désactivé).
let reglagePresence: { montrer_presence: boolean | null; defaut: boolean } = {
  montrer_presence: null,
  defaut: false,
};
const reglagePresenceJson = () => ({
  montrer_presence: reglagePresence.montrer_presence,
  effective: reglagePresence.montrer_presence ?? reglagePresence.defaut,
  default: reglagePresence.defaut,
});

/** Remet le réglage de présence au défaut (tests). */
export function resetReglagePresenceMock() {
  reglagePresence = { montrer_presence: null, defaut: false };
}

export const personnalisationHandlers = [
  http.get(`${env.API_URL}/bible/pour-vous/`, () => {
    if (!personnalisationParole) {
      return HttpResponse.json({
        ...pourVousRepli,
        personnalisation_parole: false,
      });
    }
    return HttpResponse.json(
      historiqueEfface ? pourVousRepli : pourVousMarieTherese,
    );
  }),

  http.get(`${env.API_URL}/bible/reglages/`, () =>
    HttpResponse.json({ personnalisation_parole: personnalisationParole }),
  ),

  http.put(`${env.API_URL}/bible/reglages/`, async ({ request }) => {
    const body = (await request.json()) as { personnalisation_parole: boolean };
    personnalisationParole = body.personnalisation_parole;
    return HttpResponse.json({
      personnalisation_parole: personnalisationParole,
    });
  }),

  http.post(`${env.API_URL}/bible/evenements/`, async ({ request }) => {
    const body = (await request.json()) as { evenements: unknown[] };
    const n = body.evenements?.length ?? 0;
    if (n > 200) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Lot trop grand.',
            details: {},
          },
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      recus: n,
      enregistres: personnalisationParole ? n : 0,
      rejetes: [],
      personnalisation_parole: personnalisationParole,
    });
  }),

  http.delete(`${env.API_URL}/bible/evenements/`, () => {
    historiqueEfface = true;
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${env.API_URL}/bible/signets/`, async ({ request }) => {
    const body = (await request.json()) as {
      verset_id: number;
      couleur?: string;
      note?: string;
    };
    const maintenant = new Date().toISOString();
    prochainSignet += 1;
    return HttpResponse.json(
      {
        id: prochainSignet,
        verset_id: body.verset_id,
        reference: 'Matthieu 7, 21',
        livre_id: 47,
        chapitre: 7,
        numero: 21,
        texte: pourVousMarieTherese.verset.texte,
        type: body.couleur ? 'surligne' : 'signet',
        couleur: body.couleur ?? '',
        note: body.note ?? '',
        created_at: maintenant,
        updated_at: maintenant,
      },
      { status: 201 },
    );
  }),

  http.get(`${env.API_URL}/audio/reglages/`, () =>
    HttpResponse.json({ recommendations_enabled: true }),
  ),

  http.put(`${env.API_URL}/audio/reglages/`, async ({ request }) =>
    HttpResponse.json(await request.json()),
  ),

  http.get(`${env.API_URL}/messaging/presence/`, ({ request }) => {
    const users = (new URL(request.url).searchParams.get('users') ?? '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (!users.length || users.length > 50) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Liste invalide.',
            details: {},
          },
        },
        { status: 400 },
      );
    }
    // Réciprocité (TEMPS-REEL §2.1) : présence masquée explicitement →
    // lignes « inconnues » seulement.
    if (reglagePresence.montrer_presence === false) {
      return HttpResponse.json(
        users
          .filter((u) => u in PRESENCES)
          .map((u) => ({
            user_id: u,
            visible: false,
            online: null,
            last_seen_at: null,
          })),
      );
    }
    return HttpResponse.json(
      users
        .filter((u) => u in PRESENCES)
        .map((u) => ({ user_id: u, visible: true, ...PRESENCES[u] })),
    );
  }),

  http.get(`${env.API_URL}/me/presence/`, () =>
    HttpResponse.json(reglagePresenceJson()),
  ),

  http.put(`${env.API_URL}/me/presence/`, async ({ request }) => {
    const body = (await request.json()) as { montrer_presence: boolean | null };
    reglagePresence = {
      ...reglagePresence,
      montrer_presence: body.montrer_presence,
    };
    return HttpResponse.json(reglagePresenceJson());
  }),
];

/** Remet les réglages et l'historique simulés à l'état initial (appelé après chaque test). */
export const reinitialiserPersonnalisation = () => {
  personnalisationParole = true;
  historiqueEfface = false;
  prochainSignet = 318;
  resetReglagePresenceMock();
};
