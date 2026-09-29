import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { page } from '@/lib/pagination';
import {
  createLiturgyDay,
  createRosaryDay,
  createRosaryGroup,
} from '@/testing/data-generators';

// Jour liturgique V1 (source AELF) : dimanche 27 septembre 2026.
const mockLiturgyDay = createLiturgyDay({
  readings: [
    {
      type: 'lecture_1',
      citation: 'Ez 18, 25-28',
      text: '<p>Si le méchant se détourne de sa méchanceté pour pratiquer le droit et la justice, il sauvera sa vie.</p>',
      verses: [],
    },
    {
      type: 'psaume',
      citation: 'Ps 24',
      text: '<p>Rappelle-toi, Seigneur, ta tendresse.</p>',
      verses: [],
    },
    {
      type: 'lecture_2',
      citation: 'Ph 2, 1-11',
      text: '<p>Ayez entre vous les dispositions que l’on doit avoir dans le Christ Jésus.</p>',
      verses: [],
    },
    {
      type: 'evangile',
      citation: 'Mt 21, 28-32',
      text: '<p>Un homme avait deux fils. Il vint trouver le premier et lui dit : « Mon enfant, va travailler aujourd’hui à la vigne. »</p>',
      verses: [],
    },
  ],
});

const mockRosaryGroups = [
  createRosaryGroup({ id: 1, name: 'Joyeux' }),
  createRosaryGroup({ id: 2, name: 'Lumineux' }),
  createRosaryGroup({ id: 3, name: 'Douloureux' }),
  createRosaryGroup({ id: 4, name: 'Glorieux' }),
];

const mockRosaryToday = createRosaryDay({
  day: {
    id: 1,
    weekday_display: 'Lundi',
    group: mockRosaryGroups[0],
  },
});

// « Pour vous aujourd'hui » : exemple du contrat (API-PAROLE-POUR-VOUS §5.2),
// Marie-Thérèse Diouf, dimanche 27 septembre 2026.
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

const LIVRES_NT = [
  {
    id: 47,
    name: 'Matthieu',
    slug: 'matthieu',
    order: 47,
    testament: 'nouveau',
    chapter_count: 28,
  },
  {
    id: 49,
    name: 'Luc',
    slug: 'luc',
    order: 49,
    testament: 'nouveau',
    chapter_count: 24,
  },
  {
    id: 51,
    name: 'Actes',
    slug: 'actes',
    order: 51,
    testament: 'nouveau',
    chapter_count: 28,
  },
];

// Luc 9, 7-10 (Segond 1910), données des maquettes.
const LUC_9 = [
  [
    7,
    'Hérode le tétrarque entendit parler de tout ce qui se passait, et il ne savait que penser.',
  ],
  [
    8,
    "Car les uns disaient que Jean était ressuscité des morts ; d'autres, qu'Élie était apparu ; et d'autres, qu'un des anciens prophètes était ressuscité.",
  ],
  [
    9,
    "Mais Hérode dit : J'ai fait décapiter Jean ; qui donc est celui-ci, dont j'entends dire de telles choses ? Et il cherchait à le voir.",
  ],
  [
    10,
    "Les apôtres, étant de retour, racontèrent à Jésus tout ce qu'ils avaient fait. Il les prit avec lui, et se retira à l'écart, du côté d'une ville appelée Bethsaïda.",
  ],
] as const;

export const bibleHandlers = [
  http.get(`${env.API_URL}/v1/bible/pour-vous/`, () => {
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

  http.get(`${env.API_URL}/v1/bible/reglages/`, () =>
    HttpResponse.json({ personnalisation_parole: personnalisationParole }),
  ),

  http.put(`${env.API_URL}/v1/bible/reglages/`, async ({ request }) => {
    const body = (await request.json()) as { personnalisation_parole: boolean };
    personnalisationParole = body.personnalisation_parole;
    return HttpResponse.json({
      personnalisation_parole: personnalisationParole,
    });
  }),

  http.post(`${env.API_URL}/v1/bible/evenements/`, async ({ request }) => {
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

  http.delete(`${env.API_URL}/v1/bible/evenements/`, () => {
    historiqueEfface = true;
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${env.API_URL}/v1/bible/signets/`, async ({ request }) => {
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

  http.get(
    `${env.API_URL}/v1/bible/books/:id/chapters/:chapitre/verses/`,
    ({ params }) => {
      // Page V1 (limit 200 = un chapitre entier).
      if (params.id !== '49' || params.chapitre !== '9')
        return HttpResponse.json(page([], { limit: 200 }));
      return HttpResponse.json(
        page(
          LUC_9.map(([numero, texte]) => ({
            id: 25870 + numero,
            number: numero,
            text: texte,
          })),
          { limit: 200 },
        ),
      );
    },
  ),

  http.get(`${env.API_URL}/v1/audio/reglages/`, () =>
    HttpResponse.json({ recommendations_enabled: true }),
  ),

  http.put(`${env.API_URL}/v1/audio/reglages/`, async ({ request }) =>
    HttpResponse.json(await request.json()),
  ),

  http.get(`${env.API_URL}/v1/liturgy/today/`, () => {
    return HttpResponse.json(mockLiturgyDay);
  }),

  // GET /v1/liturgy/<AAAA-MM-JJ>/ (même format, autre date).
  http.get(`${env.API_URL}/v1/liturgy/:day/`, ({ params }) => {
    const day = String(params.day);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    return HttpResponse.json(
      createLiturgyDay({
        ...mockLiturgyDay,
        date: day,
        calendar: { ...mockLiturgyDay.calendar, date: day },
      }),
    );
  }),

  http.get(`${env.API_URL}/v1/rosary/today/`, () => {
    return HttpResponse.json(mockRosaryToday);
  }),

  http.get(`${env.API_URL}/v1/rosary/groups/`, () => {
    // Liste nue (GroupSerializer many=True).
    return HttpResponse.json(mockRosaryGroups);
  }),

  http.get(`${env.API_URL}/v1/bible/books/`, ({ request }) => {
    const testament = new URL(request.url).searchParams.get('testament');
    const ancien = [
      {
        id: 1,
        name: 'Genèse',
        slug: 'genese',
        order: 1,
        testament: 'ancien',
        verse_count: 1533,
        chapter_count: 50,
      },
      {
        id: 2,
        name: 'Exode',
        slug: 'exode',
        order: 2,
        testament: 'ancien',
        verse_count: 1213,
        chapter_count: 40,
      },
    ];
    const results =
      testament === 'nouveau'
        ? LIVRES_NT
        : testament
          ? ancien
          : [...ancien, ...LIVRES_NT];
    return HttpResponse.json(page(results, { limit: 50 }));
  }),

  // Liste NUE (pas de pagination) : TestamentWithBooksOutput.
  http.get(`${env.API_URL}/v1/bible/testaments/`, () => {
    return HttpResponse.json([
      { slug: 'ancien', name: 'Ancien Testament', order: 1, books: [] },
      { slug: 'nouveau', name: 'Nouveau Testament', order: 2, books: [] },
    ]);
  }),

  // Liste NUE de groupes par livre : SearchBookGroupOutput.
  http.get(`${env.API_URL}/v1/bible/search/`, () => {
    return HttpResponse.json([]);
  }),
];
