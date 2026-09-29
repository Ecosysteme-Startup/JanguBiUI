import { atParish, ofParish, parishLabel } from '@/utils/parish-name';

describe('libellés de paroisse', () => {
  it('ne double pas le type quand le nom le contient déjà', () => {
    expect(parishLabel('Paroisse Saint-Dominique')).toBe('Paroisse Saint-Dominique');
    expect(parishLabel('Sainte-Thérèse de Grand-Dakar')).toBe('Paroisse Sainte-Thérèse de Grand-Dakar');
  });

  it('construit « de » et « à » correctement', () => {
    expect(ofParish('Paroisse Saint-Dominique')).toBe('de la paroisse Saint-Dominique');
    expect(ofParish('Sainte-Thérèse de Grand-Dakar')).toBe('de Sainte-Thérèse de Grand-Dakar');
    expect(atParish('Paroisse Saint-Dominique')).toBe('à la paroisse Saint-Dominique');
    expect(atParish('Cathédrale du Souvenir africain')).toBe('à la cathédrale du Souvenir africain');
  });
});
