import { findBook, neighbours } from '@/features/bible/utils/bible';
import { testaments } from '@/testing/mocks/db-parole';

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
});
