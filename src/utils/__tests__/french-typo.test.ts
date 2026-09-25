import { frenchTypo } from '../french-typo';

describe('frenchTypo', () => {
  it('insère une espace fine insécable avant ; ! ?', () => {
    expect(frenchTypo('Vraiment ? Oui !')).toBe('Vraiment ? Oui !');
  });
  it('insère une espace insécable avant les deux-points, sauf dans une URL', () => {
    expect(frenchTypo('Motif : mariage')).toBe('Motif : mariage');
    expect(frenchTypo('voir https://jangubi.sn')).toBe('voir https://jangubi.sn');
  });
  it('remplace les guillemets droits par des guillemets français', () => {
    expect(frenchTypo('Il dit "Paix"')).toBe('Il dit « Paix »');
  });
  it('est idempotent', () => {
    const once = frenchTypo('Question : "Pourquoi ?"');
    expect(frenchTypo(once)).toBe(once);
  });
});
