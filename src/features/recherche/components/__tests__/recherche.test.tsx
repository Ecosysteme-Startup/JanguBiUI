import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

import { Recherche } from '../recherche';

describe('Recherche transverse (/v1/search/)', () => {
  test('invite à saisir deux lettres, puis regroupe les résultats par type', async () => {
    const user = userEvent.setup();
    renderApp(<Recherche />);
    expect(screen.getByText('Rechercher dans Jàngu Bi')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'saint');
    expect(await screen.findByText(/pour « saint »/)).toBeInTheDocument();
    const paroisses = screen.getByRole('region', { name: /Paroisses/ });
    expect(within(paroisses).getByText('Saint-Dominique')).toBeInTheDocument();
    const pretres = screen.getByRole('region', { name: /Prêtres/ });
    expect(within(pretres).getByText('Emmanuel Tine')).toBeInTheDocument();
    const annonces = screen.getByRole('region', { name: /Annonces/ });
    expect(
      within(annonces).getByRole('link', { name: /Fête de saint Michel/ }),
    ).toHaveAttribute(
      'href',
      '/app/paroisse/annonces/c1000000-0000-4000-8000-000000000001',
    );
  });

  test('lit le terme dans l’URL et filtre sur un type', async () => {
    navigation.search = 'q=Tine';
    const user = userEvent.setup();
    renderApp(<Recherche />);
    expect(
      await screen.findByRole('region', { name: /Prêtres/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Écoute' }));
    expect(await screen.findByText('Aucun résultat')).toBeInTheDocument();
  });

  test('un verset ouvre le lecteur au bon livre et chapitre', async () => {
    const user = userEvent.setup();
    renderApp(<Recherche />);
    await user.type(screen.getByRole('searchbox'), 'merveilles');
    const bible = await screen.findByRole('region', { name: /Bible/ });
    expect(
      within(bible).getByRole('link', { name: /Luc 1, 49/ }),
    ).toHaveAttribute(
      'href',
      '/app/bible/luc/1#v49',
    );
  });

  test('aucun résultat : message sobre', async () => {
    const user = userEvent.setup();
    renderApp(<Recherche />);
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(await screen.findByText('Aucun résultat')).toBeInTheDocument();
  });
});
