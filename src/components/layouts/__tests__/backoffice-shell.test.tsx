import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BackofficeShell } from '@/components/layouts/backoffice-shell';
import { grantsChancelier, grantsPlateforme, grantsSecretaire, ids } from '@/testing/mocks/db';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

const navOf = async (name: RegExp) => within(await screen.findByRole('navigation', { name }));

describe('BackofficeShell', () => {
  it('ne montre à la secrétaire que les rubriques de ses capacités', async () => {
    navigation.pathname = `/espace/${ids.saintDominique}/demandes`;
    renderApp(<BackofficeShell nodeId={ids.saintDominique}>contenu</BackofficeShell>, { capacites: grantsSecretaire });

    const nav = await navOf(/^espace paroisse$/i);
    expect(nav.getByRole('link', { name: /demandes d.actes/i })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: /annonces/i })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: /confessions/i })).toBeInTheDocument();
    // Pas de messagerie : la secrétaire n'est pas joignable par les fidèles.
    expect(nav.queryByRole('link', { name: /messagerie/i })).not.toBeInTheDocument();
  });

  it('affiche le contexte, son parent, l’office et le fil d’Ariane', async () => {
    navigation.pathname = `/espace/${ids.saintDominique}/demandes`;
    renderApp(<BackofficeShell nodeId={ids.saintDominique}>contenu</BackofficeShell>, { capacites: grantsSecretaire });

    expect(await screen.findByRole('button', { name: /changer de contexte : saint-dominique/i })).toBeInTheDocument();
    expect(await screen.findByText('Archidiocèse de Dakar')).toBeInTheDocument();
    expect(await screen.findByText('Secrétaire paroissiale')).toBeInTheDocument();
    const crumbs = within(screen.getByRole('navigation', { name: /fil d.ariane/i }));
    expect(crumbs.getByText(/demandes d.actes/i)).toHaveAttribute('aria-current', 'page');
  });

  it('propose les autres contextes, groupés par niveau', async () => {
    navigation.pathname = `/espace/${ids.saintDominique}`;
    renderApp(<BackofficeShell nodeId={ids.saintDominique}>contenu</BackofficeShell>, {
      capacites: [...grantsSecretaire, ...grantsChancelier],
    });

    expect(await screen.findByRole('navigation', { name: /contextes disponibles/i })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: /changer de contexte/i }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Diocèses et doyennés')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /archidiocèse de dakar/i })).toHaveAttribute('href', `/espace/${ids.dakar}`);
  });

  it('donne au diocèse la navigation de gouvernance', async () => {
    navigation.pathname = `/espace/${ids.dakar}`;
    renderApp(<BackofficeShell nodeId={ids.dakar}>contenu</BackofficeShell>, { capacites: grantsChancelier });

    const nav = await navOf(/^espace diocèse$/i);
    expect(nav.getByRole('link', { name: /structure/i })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: /annuaire du clergé/i })).toBeInTheDocument();
    expect(nav.queryByRole('link', { name: /annonces/i })).not.toBeInTheDocument();
  });

  it('refuse un nœud où l’on n’a aucune capacité', async () => {
    renderApp(<BackofficeShell nodeId={ids.dakar}>contenu secret</BackofficeShell>, { capacites: grantsSecretaire });

    expect(await screen.findByText(/cet espace ne vous est pas ouvert/i)).toBeInTheDocument();
    expect(screen.queryByText('contenu secret')).not.toBeInTheDocument();
  });

  it('laisse la plateforme ouvrir un diocèse qu’elle ne détient pas en propre', async () => {
    navigation.pathname = `/espace/${ids.thies}`;
    renderApp(<BackofficeShell nodeId={ids.thies}>contenu</BackofficeShell>, { capacites: grantsPlateforme });

    expect(await screen.findByRole('button', { name: /changer de contexte : diocèse de thiès/i })).toBeInTheDocument();
    expect(screen.getByText('contenu')).toBeInTheDocument();
  });
});
