import { actionLabel } from '../labels';

describe('actionLabel (JB-WEB-039)', () => {
  it('traduit les actions connues', () => {
    expect(actionLabel('office.nomination')).toBe('Nomination créée');
    expect(actionLabel('dons.quete_validation')).toBe('Quête validée');
  });

  it('rend lisible un code inconnu au lieu d’afficher le code brut', () => {
    expect(actionLabel('dons.quete_reversement')).toBe('Dons et quêtes : quete reversement');
    expect(actionLabel('bidule.action_inconnue')).toBe('bidule : action inconnue');
  });
});
