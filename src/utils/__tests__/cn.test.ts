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

describe('cn — échelle « Ciel produit »', () => {
  it('reconnaît les tailles en px de la maquette comme des tailles, pas des couleurs', () => {
    expect(cn('text-on-primary', 'text-15')).toBe('text-on-primary text-15');
    expect(cn('text-13', 'text-ink-3')).toBe('text-13 text-ink-3');
    expect(cn('text-14', 'text-32')).toBe('text-32');
  });

  it('fusionne les rayons numériques avec le rayon par défaut', () => {
    expect(cn('rounded', 'rounded-12')).toBe('rounded-12');
    expect(cn('rounded-16', 'rounded-full')).toBe('rounded-full');
  });

  it('fusionne les ombres de la charte', () => {
    expect(cn('shadow-card', 'shadow-menu')).toBe('shadow-menu');
  });
});
