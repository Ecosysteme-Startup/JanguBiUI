import { render, screen } from '@testing-library/react';

import { Button } from '../button';

describe('Button', () => {
  it('suit le texte agrandi : hauteur minimale, largeur plafonnée au conteneur (A11Y-14)', () => {
    render(<Button size="xl">Demander une présentation</Button>);
    const button = screen.getByRole('button', { name: 'Demander une présentation' });
    expect(button).toHaveClass('min-h-13', 'max-w-full', 'shrink-0');
    expect(button).not.toHaveClass('h-13');
    expect(button).not.toHaveClass('whitespace-nowrap');
  });

  it('garde une cible de 44 px sous 44 px de haut (md 40, sm 32)', () => {
    render(
      <>
        <Button variant="ghost">Réinitialiser</Button>
        <Button size="sm" variant="outline">
          Exporter
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Réinitialiser' })).toHaveClass('hit', 'min-h-10');
    expect(screen.getByRole('button', { name: 'Exporter' })).toHaveClass('hit', 'min-h-8', 'rounded-10');
  });

  it('annonce le chargement avec un libellé explicite et se désactive', () => {
    render(<Button loading>Envoi en cours</Button>);
    const button = screen.getByRole('button', { name: 'Envoi en cours' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('rend son enfant en asChild (lien stylé en bouton)', () => {
    render(
      <Button asChild variant="outline">
        <a href="/connexion">Se connecter</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Se connecter' });
    expect(link).toHaveClass('rounded-12', 'border-line');
  });
});
