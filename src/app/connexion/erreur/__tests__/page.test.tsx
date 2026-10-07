import { render, screen } from '@testing-library/react';

import ConnexionErreurPage from '@/app/connexion/erreur/page';

const renderPage = async (params: Record<string, string>) => render(await ConnexionErreurPage({ searchParams: Promise.resolve(params) }));

describe('Page d’erreur de connexion (/connexion/erreur)', () => {
  it('explique en français qu’une connexion restée ouverte a expiré et propose de recommencer', async () => {
    await renderPage({ error: 'Configuration', redirectTo: '/app/demandes' });

    expect(screen.getByRole('heading', { level: 1, name: /votre connexion a expiré/i })).toBeInTheDocument();
    // JB-WEB-007 : le cas « e-mail confirmé dans un autre onglet » est explicité.
    expect(screen.getByText(/confirmer votre adresse e-mail dans un autre onglet/i)).toBeInTheDocument();
    expect(screen.queryByText(/server error/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recommencer la connexion' })).toHaveAttribute(
      'href',
      '/connexion?redirectTo=%2Fapp%2Fdemandes',
    );
    expect(screen.getByRole('link', { name: /revenir à l.accueil/i })).toHaveAttribute('href', '/');
  });

  it('adapte le message à un accès refusé et à un lien expiré', async () => {
    const { unmount } = await renderPage({ error: 'AccessDenied' });
    expect(screen.getByRole('heading', { level: 1, name: /la connexion a été refusée/i })).toBeInTheDocument();
    unmount();

    await renderPage({ error: 'Verification' });
    expect(screen.getByRole('heading', { level: 1, name: /ce lien n.est plus valable/i })).toBeInTheDocument();
  });

  it('affiche un message générique pour un code inconnu et ne relaie jamais une redirection externe', async () => {
    await renderPage({ error: 'OAuthCallbackError', redirectTo: 'https://exemple-piege.test' });

    expect(screen.getByRole('heading', { level: 1, name: /la connexion n.a pas abouti/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recommencer la connexion' })).toHaveAttribute('href', '/connexion?redirectTo=%2Fapp');
  });
});
