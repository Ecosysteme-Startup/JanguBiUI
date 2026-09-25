import { screen, within } from '@testing-library/react';

import { PublicShell } from '@/components/layouts/public-shell';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

describe('PublicShell', () => {
  it('présente la navigation publique et l’accès au compte', () => {
    navigation.pathname = '/paroisses';
    renderApp(<PublicShell>contenu</PublicShell>);

    const nav = within(screen.getByRole('navigation', { name: /navigation principale/i }));
    expect(nav.getByRole('link', { name: 'Trouver une paroisse' })).toHaveAttribute('aria-current', 'page');
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: /créer mon compte/i })).toHaveAttribute('href', '/inscription');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Jàmm ak jàmm');
  });
});
