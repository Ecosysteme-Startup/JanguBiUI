import type { Book, Testament } from '@/features/bible/api/get-testaments';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Livres dans l'ordre du canon (testament puis livre). */
export const orderedBooks = (testaments: Testament[]): Book[] =>
  [...testaments].sort((a, b) => a.order - b.order).flatMap((t) => [...t.books].sort((a, b) => a.order - b.order));

/** Le segment `[livre]` de l'URL : slug du livre, ou son nom (liens venus des lectures du jour). */
export const findBook = (testaments: Testament[], livre: string): Book | undefined => {
  const wanted = normalize(livre);
  const books = orderedBooks(testaments);
  return books.find((b) => b.slug === livre) ?? books.find((b) => normalize(b.slug) === wanted || normalize(b.name) === wanted);
};

export type ChapterRef = { book: Book; chapter: number };

/** Chapitres voisins, en passant d'un livre à l'autre (Proverbes 31 ← Ecclésiaste 1 → Ecclésiaste 2). */
export const neighbours = (testaments: Testament[], book: Book, chapter: number): { prev: ChapterRef | null; next: ChapterRef | null } => {
  const books = orderedBooks(testaments).filter((b) => b.chapter_count > 0);
  const i = books.findIndex((b) => b.id === book.id);
  const before = books[i - 1];
  const after = books[i + 1];
  const prev = chapter > 1 ? { book, chapter: chapter - 1 } : before ? { book: before, chapter: before.chapter_count } : null;
  const next = chapter < book.chapter_count ? { book, chapter: chapter + 1 } : after ? { book: after, chapter: 1 } : null;
  return { prev, next };
};

export const testamentOf = (testaments: Testament[], book: Book) => testaments.find((t) => t.slug === book.testament);

/** Groupes du canon (repères de lecture dans la liste des livres), par slug. */
const GROUPS: { label: string; slugs: string[] }[] = [
  { label: 'Pentateuque', slugs: ['genese', 'exode', 'levitique', 'nombres', 'deuteronome'] },
  {
    label: 'Livres historiques',
    slugs: ['josue', 'juges', 'ruth', '1-samuel', '2-samuel', '1-rois', '2-rois', '1-chroniques', '2-chroniques', 'esdras', 'nehemie', 'tobie', 'judith', 'esther', '1-maccabees', '2-maccabees'],
  },
  { label: 'Livres sapientiaux', slugs: ['job', 'psaumes', 'proverbes', 'ecclesiaste', 'cantique-des-cantiques', 'sagesse', 'siracide'] },
  {
    label: 'Prophètes',
    slugs: ['isaie', 'jeremie', 'lamentations', 'baruch', 'ezechiel', 'daniel', 'osee', 'joel', 'amos', 'abdias', 'jonas', 'michee', 'nahum', 'habacuc', 'sophonie', 'aggee', 'zacharie', 'malachie'],
  },
  { label: 'Évangiles', slugs: ['matthieu', 'marc', 'luc', 'jean'] },
  { label: 'Actes et lettres', slugs: ['actes', 'romains', '1-corinthiens', '2-corinthiens', 'galates', 'ephesiens', 'philippiens', 'colossiens', '1-thessaloniciens', '2-thessaloniciens', '1-timothee', '2-timothee', 'tite', 'philemon', 'hebreux', 'jacques', '1-pierre', '2-pierre', '1-jean', '2-jean', '3-jean', 'jude'] },
  { label: 'Apocalypse', slugs: ['apocalypse'] },
];

export type BookGroup = { label: string | null; books: Book[] };

/**
 * Livres d'un testament regroupés (Évangiles, Actes et lettres…), dans l'ordre du canon. Un
 * testament d'un seul livre (Psaumes) n'a pas d'intertitre ; un livre inconnu rejoint un groupe sans titre.
 */
export const bookGroups = (books: Book[]): BookGroup[] => {
  const groups: BookGroup[] = [];
  for (const book of [...books].sort((a, b) => a.order - b.order)) {
    const label = GROUPS.find((g) => g.slugs.includes(book.slug))?.label ?? null;
    const last = groups.at(-1);
    if (last && last.label === label) last.books.push(book);
    else groups.push({ label, books: [book] });
  }
  // Un livre seul (le testament des Psaumes) n'a pas besoin d'intertitre.
  return groups.length === 1 && groups[0].books.length === 1 ? [{ label: null, books: groups[0].books }] : groups;
};

/** Livres dont le nom contient la saisie (sans accents ni casse). */
export const filterBooks = (books: Book[], query: string): Book[] => {
  const wanted = normalize(query);
  return wanted ? books.filter((b) => normalize(b.name).includes(wanted)) : books;
};

/** Abréviations usuelles → slug du livre (AELF/usage francophone). */
const BOOK_ABBREV: Record<string, string> = {
  gn: 'genese', ex: 'exode', lv: 'levitique', nb: 'nombres', dt: 'deuteronome',
  jos: 'josue', jg: 'juges', rt: 'ruth', esd: 'esdras', ne: 'nehemie', tb: 'tobie', jdt: 'judith', est: 'esther',
  jb: 'job', ps: 'psaumes', pr: 'proverbes', qo: 'ecclesiaste', ct: 'cantique-des-cantiques', sg: 'sagesse', si: 'siracide',
  is: 'isaie', jr: 'jeremie', lm: 'lamentations', ba: 'baruch', ez: 'ezechiel', dn: 'daniel',
  os: 'osee', jl: 'joel', am: 'amos', ab: 'abdias', jon: 'jonas', mi: 'michee', na: 'nahum', ha: 'habacuc', so: 'sophonie', ag: 'aggee', za: 'zacharie', ml: 'malachie',
  mt: 'matthieu', mc: 'marc', mk: 'marc', lc: 'luc', jn: 'jean', ac: 'actes',
  rm: 'romains', ga: 'galates', ep: 'ephesiens', ph: 'philippiens', col: 'colossiens', tt: 'tite', phm: 'philemon', he: 'hebreux', jc: 'jacques', jude: 'jude', ap: 'apocalypse',
  '1 co': '1-corinthiens', '2 co': '2-corinthiens', '1 th': '1-thessaloniciens', '2 th': '2-thessaloniciens',
  '1 tm': '1-timothee', '2 tm': '2-timothee', '1 p': '1-pierre', '2 p': '2-pierre', '1 jn': '1-jean', '2 jn': '2-jean', '3 jn': '3-jean',
  '1 r': '1-rois', '2 r': '2-rois', '1 s': '1-samuel', '2 s': '2-samuel', '1 ch': '1-chroniques', '2 ch': '2-chroniques', '1 m': '1-maccabees', '2 m': '2-maccabees',
};

/** Résout un nom ou une abréviation de livre (« Jn », « Jean », « 1 Co », « matth »). */
export const resolveBook = (books: Book[], name: string): Book | undefined => {
  const wanted = normalize(name);
  if (!wanted) return undefined;
  const slug = BOOK_ABBREV[wanted];
  if (slug) {
    const bySlug = books.find((b) => b.slug === slug);
    if (bySlug) return bySlug;
  }
  return (
    books.find((b) => b.slug === name || normalize(b.slug) === wanted || normalize(b.name) === wanted) ??
    books.find((b) => normalize(b.name).startsWith(wanted))
  );
};

export type Reference = { book: Book; chapter: number; verse?: number };

/**
 * Analyse une référence (« Jn 3, 16 », « Jean 3, 16 », « Jean 3 », « 1 Co 13 ») : livre + chapitre
 * (+ verset). `undefined` si la saisie n'est pas une référence avec chapitre (un nom seul reste
 * traité par la recherche de livre).
 */
export const parseReference = (query: string, books: Book[]): Reference | undefined => {
  const m = /^\s*(\d*\s*\p{L}[\p{L}\s.'’-]*?)\s*(\d+)(?:\s*[.,:]\s*(\d+)|\s+(\d+))?\s*$/u.exec(query);
  if (!m) return undefined;
  const book = resolveBook(books, m[1]!);
  if (!book) return undefined;
  const chapter = Number(m[2]);
  if (!Number.isFinite(chapter) || chapter < 1) return undefined;
  const verseStr = m[3] ?? m[4];
  const verse = verseStr ? Number(verseStr) : undefined;
  return { book, chapter, verse: verse && verse >= 1 ? verse : undefined };
};

const EVANGELISTS = ['matthieu', 'marc', 'luc', 'jean'];

/** « Évangile selon saint Luc, chapitre 9 », « Psaume 23 », « Ecclésiaste, chapitre 1 ». */
export const chapterTitle = (book: Book, chapter: number): string => {
  if (EVANGELISTS.includes(book.slug)) return `Évangile selon saint ${book.name}, chapitre ${chapter}`;
  if (book.slug === 'psaumes') return `Psaume ${chapter}`;
  return `${book.name}, chapitre ${chapter}`;
};

/** « Luc 9 », « Psaume 23 » (boutons des chapitres voisins). */
export const chapterShortName = (book: Book, chapter: number): string =>
  book.slug === 'psaumes' ? `Psaume ${chapter}` : `${book.name} ${chapter}`;
