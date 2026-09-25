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
