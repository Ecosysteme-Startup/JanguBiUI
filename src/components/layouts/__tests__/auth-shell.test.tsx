import { screen, within } from '@testing-library/react';

import { ErrorScreen } from '@/components/errors/error-screen';
import { AuthShell } from '@/components/layouts/auth-shell';
import { renderApp } from '@/testing/test-utils';

const expectOfficialLogo = (link: HTMLElement) => {
  expect(link).toHaveAttribute('href', '/');
  expect(link).toHaveTextContent('Jàngu Bi');
  const logo = link.querySelector('svg[viewBox="86 71 203 233"]');
  expect(logo).toHaveClass('fill-brand');
  // Décoratif : le nom écrit suffit, pas de double annonce.
  expect(logo).toHaveAttribute('aria-hidden', 'true');
};

describe('Logotype des parcours hors espace', () => {
  it('coquille d’inscription, de bienvenue et d’invitation : logo officiel dans l’en-tête', () => {
    renderApp(<AuthShell>contenu</AuthShell>);
    expectOfficialLogo(within(screen.getByRole('banner')).getByRole('link', { name: 'Jàngu Bi, accueil' }));
  });

  it('écrans d’erreur et de connexion interrompue : logo officiel au-dessus de la carte', () => {
    renderApp(
      <ErrorScreen code="Erreur 500" title="Un incident" actions={null}>
        détail
      </ErrorScreen>,
    );
    const link = screen.getByRole('link', { name: 'Jàngu Bi, retour à l’accueil' });
    expectOfficialLogo(link);
    expect(link.querySelector('svg')).toHaveAttribute('height', '40');
  });
});
