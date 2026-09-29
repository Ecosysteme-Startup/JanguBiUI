import { render, screen } from '@testing-library/react';

import { LegalArticle } from '../legal-article';

describe('LegalArticle', () => {
  it('place le sommaire collant dans sa propre colonne, jamais sur le texte (A11Y-09)', () => {
    render(
      <LegalArticle
        kicker="Conditions"
        title="Conditions d’utilisation"
        intro={<p>Introduction.</p>}
        updated="26 septembre 2026"
        sections={[
          { id: 'objet', title: 'Objet', body: <p>Texte.</p> },
          { id: 'compte', title: 'Compte', body: <p>Texte.</p> },
        ]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Sommaire' });
    // Sommaire collant dans la 1re colonne de la grille, le texte dans la 2de : aucun chevauchement.
    expect(nav).toHaveClass('lg:sticky');
    const grid = nav.parentElement!;
    expect(grid).toHaveClass('lg:grid-cols-[280px_minmax(0,680px)]');
    expect(screen.getByRole('region', { name: 'Objet' }).parentElement!.parentElement).toBe(grid);
    expect(screen.getByRole('link', { name: /Compte/ })).toHaveAttribute('href', '#compte');
  });
});
