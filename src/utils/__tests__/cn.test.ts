import { cn } from '@/utils/cn';

describe('cn', () => {
  it('garde la couleur quand une taille de la charte suit (bouton primaire lg)', () => {
    expect(cn('text-on-primary', 'text-body')).toBe('text-on-primary text-body');
    expect(cn('text-ink-3 text-meta')).toBe('text-ink-3 text-meta');
  });

  it('fusionne toujours deux tailles ou deux couleurs', () => {
    expect(cn('text-meta', 'text-lead')).toBe('text-lead');
    expect(cn('text-ink', 'text-primary')).toBe('text-primary');
  });
});
