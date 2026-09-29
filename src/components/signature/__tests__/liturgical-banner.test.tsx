import { render, screen } from '@testing-library/react';

import { LiturgicalBanner } from '../liturgical-banner';

describe('LiturgicalBanner', () => {
  it('affiche la date, le temps, la couleur et un lien vers la Parole', () => {
    render(
      <LiturgicalBanner
        href="/parole"
        data={{ date: '2026-09-24', celebration: 'Jeudi de la 25e semaine du temps ordinaire', color: 'vert', references: ['Ec 1, 2-11', 'Lc 9, 7-9'] }}
      />,
    );
    expect(screen.getByText('Jeudi 24 septembre 2026')).toBeInTheDocument();
    expect(screen.getByText('Jour 267')).toBeInTheDocument();
    expect(screen.getByTitle('Couleur liturgique du jour : vert')).toHaveTextContent('Vert');
    expect(screen.getByRole('link', { name: 'Ec 1, 2-11 · Lc 9, 7-9' })).toHaveAttribute('href', '/parole');
  });
});

describe('LiturgicalBanner en petite largeur (A11Y-07, C1)', () => {
  const data = {
    date: '2026-09-26',
    celebration: 'Samedi de la 25e semaine du temps ordinaire',
    color: 'vert',
    references: ['Ec 11, 9 – 12, 8', 'Ps 89', 'Lc 9, 43b-45'],
  };

  it.each(['desktop', 'backoffice'] as const)('variante %s : hauteur minimale, sans retour à la ligne, références tronquables', (variant) => {
    const { container } = render(<LiturgicalBanner href="/parole" data={data} variant={variant} />);
    const banner = container.firstElementChild!;
    expect(banner.className).not.toMatch(/(^|\s)h-(9|10)(\s|$)/);
    expect(banner).toHaveClass('whitespace-nowrap');
    // Date abrégée sous md, longue au-delà.
    expect(screen.getByText('sam. 26 sept.')).toHaveClass('md:hidden');
    expect(screen.getByText('Samedi 26 septembre 2026')).toHaveClass('hidden', 'md:inline');
    // Le lien garde tout le texte dans son nom accessible, l'ellipse n'est que visuelle.
    const link = screen.getByRole('link', { name: 'Ec 11, 9 – 12, 8 · Ps 89 · Lc 9, 43b-45' });
    expect(link).toHaveClass('min-w-0');
    expect(link).toHaveAttribute('title', 'Ec 11, 9 – 12, 8 · Ps 89 · Lc 9, 43b-45');
    expect(link.firstElementChild).toHaveClass('truncate');
  });

  it('variante mobile : la ligne tronquée peut rétrécir à côté de la pastille', () => {
    const { container } = render(<LiturgicalBanner href="/parole" data={data} variant="mobile" />);
    expect(container.querySelector('.truncate')).toHaveClass('min-w-0');
    expect(container.firstElementChild).toHaveClass('min-h-9');
  });
});
