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
    // Colonnes 1-3 et même rangée que le texte (colonnes 5-12) : aucune colonne partagée.
    expect(nav).toHaveClass('lg:sticky', 'lg:col-start-1', 'lg:col-span-3', 'lg:row-start-2', 'bg-paper');
    const body = screen.getByRole('region', { name: /01\s*Objet|Objet/ }).parentElement!;
    expect(body).toHaveClass('lg:col-start-5', 'lg:row-start-2');
    expect(screen.getByRole('link', { name: /Compte/ })).toHaveAttribute('href', '#compte');
  });
});
