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

  it('affiche le bandeau liturgique du jour', async () => {
    renderApp(<FideleShell>contenu</FideleShell>);

    expect((await screen.findAllByText(/25/)).length).toBeGreaterThan(0);
    expect(await screen.findByRole('link', { name: 'Ec 1, 2-11 · Ps 89 (90) · Lc 9, 7-9' })).toHaveAttribute('href', '/app/parole');
  });

  it('montre la paroisse suivie dans la sidebar', async () => {
    renderApp(<FideleShell>contenu</FideleShell>);

    const sidebar = within(screen.getByRole('complementary'));
    expect(await sidebar.findByText('Saint-Dominique')).toBeInTheDocument();
    expect(sidebar.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it('ouvre le menu « Plus » avec les rubriques numérotées', async () => {
    renderApp(<FideleShell>contenu</FideleShell>);

    await userEvent.click(screen.getByRole('button', { name: /ouvrir le menu/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    expect(within(dialog).getByText('01 — La Parole')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /chapelet/i })).toHaveAttribute('href', '/app/chapelet');
  });
});
