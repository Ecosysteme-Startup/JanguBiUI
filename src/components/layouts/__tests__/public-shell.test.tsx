import { screen, within } from '@testing-library/react';

import { PublicShell } from '@/components/layouts/public-shell';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

describe('PublicShell', () => {
  it('présente la navigation publique et l’accès au compte', () => {
    navigation.pathname = '/paroisses';
    renderApp(<PublicShell>contenu</PublicShell>);

    const nav = within(screen.getByRole('navigation', { name: /navigation principale/i }));
    expect(nav.getAllByRole('link').map((l) => l.textContent)).toEqual(['La Parole du jour', 'Paroisses', 'Pour les paroisses', 'Aide']);
    expect(nav.getByRole('link', { name: 'Paroisses' })).toHaveAttribute('aria-current', 'page');
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: /créer un compte/i })).toHaveAttribute('href', '/inscription');
    expect(header.getByRole('link', { name: /se connecter/i })).toHaveAttribute('href', '/connexion');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('loi n° 2008-12');
  });

  it('signe l’en-tête et le pied de page du logo officiel, lien vers l’accueil', () => {
    renderApp(<PublicShell>contenu</PublicShell>);
    for (const region of [screen.getByRole('banner'), screen.getByRole('contentinfo')]) {
      const brand = within(region).getByRole('link', { name: 'Jàngu Bi, accueil' });
      expect(brand).toHaveAttribute('href', '/');
      expect(brand).toHaveTextContent('Jàngu Bi');
      expect(brand.querySelector('svg[viewBox="86 71 203 233"]')).toHaveClass('fill-brand');
    }
  });

  it('laisse le <main> pleine largeur, sans padding : chaque page pose son conteneur', () => {
    renderApp(<PublicShell>contenu</PublicShell>);
    expect(screen.getByRole('main')).toHaveClass('flex-1');
    expect(screen.getByRole('main').className).not.toMatch(/\b(px|pt|pb|max-w)-/);
  });
});
