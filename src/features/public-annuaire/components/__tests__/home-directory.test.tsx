import { screen, within } from '@testing-library/react';

import { HomeDirectory } from '@/features/public-annuaire/components/home-directory';
import { directoryHandler, f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers, directoryHandler));

describe('« Trouver votre paroisse » de l’accueil', () => {
  it('montre trois fiches, les paroisses ouvertes d’abord, et le volume de l’annuaire', async () => {
    renderApp(<HomeDirectory />);

    const list = await screen.findByRole('list');
    const cards = within(list).getAllByRole('link');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent('Saint-Dominique');
    expect(cards[0]).toHaveTextContent('Sur Jàngu Bi');
    expect(cards[1]).toHaveTextContent('Pas encore sur Jàngu Bi');
    // Le nombre est un compteur animé (<CountUp>) : on lit la phrase entière du paragraphe.
    expect(
      await screen.findByText((_, el) => el?.tagName === 'P' && /12 paroisses figurent dans l.annuaire/i.test(el.textContent ?? '')),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voir l.annuaire complet/i })).toHaveAttribute('href', '/paroisses');
  });

  it('cherche dans l’annuaire par nom et par diocèse', async () => {
    renderApp(<HomeDirectory />);

    const form = screen.getByRole('search', { name: /rechercher une paroisse/i });
    expect(form).toHaveAttribute('action', '/paroisses');
    expect(within(form).getByRole('searchbox', { name: /nom de la paroisse/i })).toHaveAttribute('name', 'q');
    expect(await within(form).findByRole('option', { name: /archidiocèse de dakar/i })).toBeInTheDocument();
  });
});
