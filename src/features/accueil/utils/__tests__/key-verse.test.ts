import { keyVerse } from '../key-verse';

const verse = (book: string, chapter: number, number: number, text: string) => ({ book, chapter, number, text });

describe('keyVerse', () => {
  it('met en exergue le premier verset de l’Évangile, avec sa référence', () => {
    const readings = [
      { type: 'lecture_1', citation: 'Ec 1, 2-11', verses: [verse('Ecclésiaste', 1, 2, 'Vanité des vanités.')] },
      { type: 'evangile', citation: 'Lc 9, 7-9', verses: [verse('Luc', 9, 7, 'Hérode apprit tout ce qui se passait.')] },
    ];
    expect(keyVerse(readings)).toEqual({ text: 'Hérode apprit tout ce qui se passait.', reference: 'Luc 9, 7' });
  });

  it('prend la première lecture quand l’Évangile n’a pas de texte', () => {
    const readings = [
      { type: 'lecture_1', citation: 'Ec 1, 2-11', verses: [verse('Ecclésiaste', 1, 2, 'Vanité des vanités.')] },
      { type: 'evangile', citation: 'Lc 9, 7-9', verses: [] },
    ];
    expect(keyVerse(readings)).toEqual({ text: 'Vanité des vanités.', reference: 'Ecclésiaste 1, 2' });
  });

  it('ne renvoie rien sans aucun verset (références seules)', () => {
    expect(keyVerse([{ type: 'evangile', citation: 'Lc 9, 7-9', verses: [] }])).toBeNull();
  });

  it('ignore un verset vide', () => {
    expect(keyVerse([{ type: 'evangile', citation: 'Lc 9, 7-9', verses: [verse('Luc', 9, 7, '  ')] }])).toBeNull();
  });
});
