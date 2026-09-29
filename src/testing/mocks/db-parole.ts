import { liturgyToday } from '@/testing/mocks/db';

/** Données démo du lot F5a (La Parole, Bible, chapelet), reprises des maquettes. */

const CRAMPON_NOTICE = 'Références du jour ; texte de la Bible Crampon (1923), domaine public.';

const verses = (book: string, chapter: number, list: [number, string][]) =>
  list.map(([number, text]) => ({ book, chapter, number, text }));

export const meditationId = '7d1e0000-0000-4000-8000-0000000000f1';

export const paroleDay = {
  ...liturgyToday,
  source: 'crampon_refs',
  edition: { code: 'crampon1923', label: 'Bible Crampon (1923)' },
  notice: CRAMPON_NOTICE,
  readings: [
    {
      type: 'lecture_1',
      citation: 'Ec 1, 2-11',
      text: null,
      verses: verses('Ecclésiaste', 1, [
        [2, 'Vanité des vanités, dit l’Ecclésiaste, vanité des vanités, tout est vanité.'],
        [4, 'Une génération s’en va, une autre vient, et la terre subsiste toujours.'],
      ]),
    },
    {
      type: 'psaume',
      citation: 'Ps 89 (90)',
      text: null,
      verses: verses('Psaumes', 90, [[12, 'Enseigne-nous à bien compter nos jours, afin que nous appliquions notre cœur à la sagesse.']]),
    },
    {
      type: 'evangile',
      citation: 'Lc 9, 7-9',
      text: null,
      verses: verses('Luc', 9, [
        [7, 'Hérode le tétrarque entendit parler de tout ce qui se passait, et il ne savait que penser.'],
        [9, 'Mais Hérode dit : J’ai fait décapiter Jean ; qui donc est celui-ci ? Et il cherchait à le voir.'],
      ]),
    },
  ],
  audio_url: 'https://media.example.sn/lectures/2026-09-24.mp3',
  meditation: {
    id: meditationId,
    title: 'Compter nos jours, chercher le Christ.',
    scope: 'Saint-Dominique',
    excerpt: 'Demandons aujourd’hui la grâce de chercher le Christ pour le suivre, et non pour le voir passer.',
    author_name: 'Augustin Ndiaye',
    published_at: '2026-09-24T06:00:00+00:00',
  },
};

/** Jour liturgique d'une date : lectures présentes pour la date démo, sinon indisponibles. */
export const liturgyDayFor = (date: string) =>
  date === paroleDay.date
    ? paroleDay
    : {
        ...paroleDay,
        date,
        calendar: { ...paroleDay.calendar, date, celebration: `Férie du ${date}` },
        readings_available: false,
        readings: [],
        audio_url: null,
        meditation: null,
      };

// --- Bible -------------------------------------------------------------------------------

const book = (id: number, name: string, slug: string, order: number, testament: string, chapter_count: number) => ({
  id,
  name,
  slug,
  order,
  testament,
  verse_count: chapter_count * 20,
  chapter_count,
});

export const testaments = [
  {
    slug: 'ancien',
    name: 'Ancien Testament',
    order: 1,
    books: [book(1, 'Genèse', 'genese', 1, 'ancien', 50), book(20, 'Proverbes', 'proverbes', 20, 'ancien', 31), book(21, 'Ecclésiaste', 'ecclesiaste', 21, 'ancien', 12)],
  },
  {
    slug: 'nouveau',
    name: 'Nouveau Testament',
    order: 2,
    books: [book(42, 'Luc', 'luc', 42, 'nouveau', 24), book(43, 'Jean', 'jean', 43, 'nouveau', 21)],
  },
];

export const chapterVerses: Record<string, { id: number; number: number; text: string }[]> = {
  '21-1': [
    { id: 2101, number: 1, text: 'Paroles de l’Ecclésiaste, fils de David, roi de Jérusalem.' },
    { id: 2102, number: 2, text: 'Vanité des vanités, dit l’Ecclésiaste, vanité des vanités, tout est vanité.' },
    { id: 2109, number: 9, text: 'Ce qui a été, c’est ce qui sera ; il n’y a rien de nouveau sous le soleil.' },
  ],
};

export const bibleSearchResults = [
  {
    book: { id: 21, name: 'Ecclésiaste', slug: 'ecclesiaste', order: 21, testament: 'ancien' },
    matches: [{ verse: { id: 2102, number: 2, chapter: { number: 1 }, text: 'Vanité des vanités, tout est vanité.' }, no_internal_source: false }],
  },
];

// --- Chapelet ----------------------------------------------------------------------------

// Libellés français servis par le backend (`Prayer.Type`).
const TYPE_DISPLAY: Record<string, string> = {
  OUR_FATHER: 'Notre Père',
  HAIL_MARY: 'Je vous salue Marie',
  GLORY_BE: 'Gloire au Père',
  CREED: 'Je crois en Dieu',
  HOLY_QUEEN: 'Salve Regina',
};
const prayer = (id: number, type: string, text: string) => ({ id, type, type_display: TYPE_DISPLAY[type] ?? 'Autre', language: 'fr', text, source: '' });

const OUR_FATHER = prayer(1, 'OUR_FATHER', 'Notre Père, qui es aux cieux, que ton nom soit sanctifié…');
const HAIL_MARY = prayer(2, 'HAIL_MARY', 'Je vous salue, Marie, pleine de grâce ; le Seigneur est avec vous…');
const GLORY_BE = prayer(3, 'GLORY_BE', 'Gloire au Père, au Fils et au Saint-Esprit…');

const decade = () => [OUR_FATHER, ...Array.from({ length: 10 }, () => HAIL_MARY), GLORY_BE].map((p, i) => ({ order: i + 1, prayer: p }));

const LUMINOUS_FRUITS = [
  'La fidélité aux promesses du baptême',
  'La confiance en Marie',
  'La conversion du cœur',
  'Le désir de la sainteté',
  'L’amour de l’Eucharistie',
];

const LUMINOUS = [
  'Le baptême de Jésus au Jourdain.',
  'Les noces de Cana.',
  'L’annonce du Royaume de Dieu.',
  'La Transfiguration.',
  'L’institution de l’Eucharistie.',
];

export const rosaryToday = {
  day: {
    id: 'd4',
    weekday: 3,
    weekday_display: 'Jeudi',
    group: {
      id: 'g-lumineux',
      name: 'Lumineux',
      slug: 'lumineux',
      audio_file: null,
      mysteries: LUMINOUS.map((title, i) => ({
        id: 100 + i,
        order: i + 1,
        title,
        meditation: i === 1 ? 'Marie voit ce qui manque et le confie à son Fils.' : null,
        meditation_source: i === 1 ? 'Jn 2, 1-12' : '',
        fruit: LUMINOUS_FRUITS[i],
        audio_file: null,
        audio_duration: null,
        prayers: decade(),
      })),
    },
  },
  standalone_prayers: [prayer(9, 'CREED', 'Je crois en Dieu, le Père tout-puissant…'), prayer(10, 'HOLY_QUEEN', 'Salut, ô Reine, Mère de miséricorde…')],
};
