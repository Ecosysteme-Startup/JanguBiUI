import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FideleShell } from '@/components/layouts/fidele-shell';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

describe('FideleShell', () => {
  it('propose cinq entrées mobiles et marque la rubrique courante', () => {
    navigation.pathname = '/app/demandes/12';
    renderApp(<FideleShell>contenu</FideleShell>);

    const tabs = within(screen.getByRole('navigation', { name: /navigation principale/i }));
    expect(tabs.getAllByRole('link').map((l) => l.textContent)).toEqual(['Accueil', 'Parole', 'Paroisse', 'Demandes', 'Prêtre']);
    expect(tabs.getByRole('link', { name: 'Demandes' })).toHaveAttribute('aria-current', 'page');
    expect(tabs.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current');
  });

  it('présente les rubriques de la barre latérale (« Dons » en dernier), Bible et Chapelet rattachées à « La Parole »', () => {
    navigation.pathname = '/app/chapelet';
    renderApp(<FideleShell>contenu</FideleShell>);

    const nav = within(screen.getByRole('navigation', { name: 'Espace fidèle' }));
    expect(nav.getAllByRole('link').map((l) => l.textContent)).toEqual(['Accueil', 'La Parole', 'Écouter', 'Ma paroisse', 'Mes demandes', 'Intentions de messe', 'Parler à un prêtre', 'Dons']);
    expect(nav.getByRole('link', { name: 'La Parole' })).toHaveAttribute('aria-current', 'page');
  });

  it('montre la date du jour dans la barre supérieure et la cloche des notifications', () => {
    renderApp(<FideleShell>contenu</FideleShell>);

    expect(screen.getByRole('link', { name: /notifications/i })).toHaveAttribute('href', '/app/notifications');
    expect(screen.getByText(/\d{4}$/)).toBeInTheDocument();
  });

  it('montre la paroisse suivie et le menu du compte (déconnexion) dans la barre latérale', async () => {
    const user = userEvent.setup();
    renderApp(<FideleShell>contenu</FideleShell>);

    const sidebar = within(screen.getByRole('complementary'));
    expect(await sidebar.findByText('Saint-Dominique')).toBeInTheDocument();
    await user.click(sidebar.getByRole('button', { name: 'Réglages du compte' }));
    expect(await screen.findByRole('menuitem', { name: /se déconnecter/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /profil et réglages/i })).toHaveAttribute('href', '/app/profil');
  });

  it('ouvre la recherche rapide et filtre les rubriques', async () => {
    const user = userEvent.setup();
    renderApp(<FideleShell>contenu</FideleShell>);

    await user.click(within(screen.getByRole('complementary')).getByRole('button', { name: /rechercher/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Recherche rapide' });
    await user.type(within(dialog).getByRole('searchbox'), 'chapel');
    expect(within(dialog).getByRole('link', { name: /chapelet/i })).toHaveAttribute('href', '/app/chapelet');
    expect(within(dialog).queryByRole('link', { name: /mes demandes/i })).not.toBeInTheDocument();
  });

  it('sous 1024 px, ouvre la barre latérale dans un tiroir « Menu »', async () => {
    const user = userEvent.setup();
    renderApp(<FideleShell>contenu</FideleShell>);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    expect(within(drawer).getByRole('link', { name: 'Mes demandes' })).toHaveAttribute('href', '/app/demandes');
  });
});
