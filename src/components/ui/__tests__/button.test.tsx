import { render, screen } from '@testing-library/react';

import { Button } from '../button';

describe('Button', () => {
  it('suit le texte agrandi : hauteur minimale, largeur plafonnée au conteneur (A11Y-14)', () => {
    render(<Button size="lg">Demander une présentation</Button>);
    const button = screen.getByRole('button', { name: 'Demander une présentation' });
    expect(button).toHaveClass('min-h-13', 'max-w-full', 'shrink-0');
    expect(button).not.toHaveClass('h-13');
    expect(button).not.toHaveClass('whitespace-nowrap');
  });

  it('garde une cible de 44 px en variante tertiaire', () => {
    render(<Button variant="tertiary">Réinitialiser</Button>);
    expect(screen.getByRole('button', { name: 'Réinitialiser' })).toHaveClass('min-h-11');
  });
});
