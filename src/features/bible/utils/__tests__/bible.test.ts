import { bookGroups, chapterShortName, chapterTitle, filterBooks, findBook, neighbours, parseReference, resolveBook } from '@/features/bible/utils/bible';
import { testaments } from '@/testing/mocks/db-parole';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...paroleHandlers));

describe('utilitaires de la Bible', () => {
  it('trouve un livre par slug ou par nom, sans tenir compte des accents', () => {
    expect(findBook(testaments, 'ecclesiaste')?.id).toBe(21);
    expect(findBook(testaments, 'Ecclésiaste')?.id).toBe(21);
    expect(findBook(testaments, 'GENESE')?.id).toBe(1);
    expect(findBook(testaments, 'Tobie')).toBeUndefined();
  });

  it('ne propose rien avant le premier chapitre ni après le dernier', () => {
    const genese = findBook(testaments, 'genese')!;
    expect(neighbours(testaments, genese, 1).prev).toBeNull();
    const jean = findBook(testaments, 'jean')!;
    expect(neighbours(testaments, jean, 21).next).toBeNull();
    expect(neighbours(testaments, jean, 1).prev).toMatchObject({ book: { slug: 'luc' }, chapter: 24 });
  });

  it('regroupe les livres du Nouveau Testament et filtre par nom', () => {
    const nouveau = testaments[1].books;
    const actes = { ...nouveau[0], id: 44, name: 'Actes des Apôtres', slug: 'actes', order: 44 };
    const groups = bookGroups([...nouveau, actes]);
    expect(groups.map((g) => [g.label, g.books.map((b) => b.slug)])).toEqual([
      ['Évangiles', ['luc', 'jean']],
      ['Actes et lettres', ['actes']],
    ]);
    expect(bookGroups([{ ...nouveau[0], slug: 'psaumes', name: 'Psaumes' }])[0].label).toBeNull();
    expect(filterBooks(testaments[0].books, 'eccle').map((b) => b.slug)).toEqual(['ecclesiaste']);
    expect(filterBooks(testaments[0].books, '  ')).toHaveLength(3);
  });

  it('titre un chapitre à la manière des lectures', () => {
    const luc = findBook(testaments, 'luc')!;
    const ecc = findBook(testaments, 'ecclesiaste')!;
    expect(chapterTitle(luc, 9)).toBe('Évangile selon saint Luc, chapitre 9');
    expect(chapterTitle(ecc, 1)).toBe('Ecclésiaste, chapitre 1');
    expect(chapterTitle({ ...ecc, slug: 'psaumes', name: 'Psaumes' }, 23)).toBe('Psaume 23');
    expect(chapterShortName(luc, 8)).toBe('Luc 8');
  });

  it('analyse une référence : livre + chapitre + verset, abréviations comprises (JB-WEB-023)', () => {
    const books = testaments.flatMap((t) => t.books);

    expect(parseReference('Jean 3, 16', books)).toMatchObject({ book: { slug: 'jean' }, chapter: 3, verse: 16 });
    expect(parseReference('Jean 3,16', books)).toMatchObject({ book: { slug: 'jean' }, chapter: 3, verse: 16 });
    expect(parseReference('Jn 3, 16', books)).toMatchObject({ book: { slug: 'jean' }, chapter: 3, verse: 16 });
    expect(parseReference('Jean 3', books)).toMatchObject({ book: { slug: 'jean' }, chapter: 3 });
    expect(parseReference('Jean 3', books)?.verse).toBeUndefined();
    expect(parseReference('Lc 9 7', books)).toMatchObject({ book: { slug: 'luc' }, chapter: 9, verse: 7 });

    // Un nom seul n'est pas une référence (reste traité par la recherche de livre).
    expect(parseReference('Jean', books)).toBeUndefined();
    // Un livre inconnu dans ce corpus ne produit pas de référence.
    expect(parseReference('Maccabées 3', books)).toBeUndefined();
  });

  it('résout nom et abréviation d’un livre', () => {
    const books = testaments.flatMap((t) => t.books);
    expect(resolveBook(books, 'Jn')?.slug).toBe('jean');
    expect(resolveBook(books, 'Jean')?.slug).toBe('jean');
    expect(resolveBook(books, 'Lc')?.slug).toBe('luc');
    expect(resolveBook(books, 'eccl')?.slug).toBe('ecclesiaste');
  });
});
