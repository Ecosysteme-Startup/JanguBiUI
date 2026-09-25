import { screen } from '@testing-library/react';

import { DirectoryExcerpt } from '@/features/public-annuaire/components/directory-excerpt';
import { DirectoryStats } from '@/features/public-annuaire/components/directory-stats';
import { directoryHandler } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => server.use(directoryHandler));

describe('Extrait d’annuaire de l’accueil', () => {
  it('donne le volume de l’annuaire, les paroisses ouvertes, et six fiches actives d’abord', async () => {
    renderApp(<DirectoryExcerpt />);

    expect(await screen.findByRole('heading', { name: /paroisses dans l.annuaire, dont 1 ouverte sur jàngu bi/i })).toBeInTheDocument();
    const links = screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/paroisses/'));
    expect(links).toHaveLength(6);
    expect(links[0]).toHaveTextContent('Paroisse Saint-Dominique');
    expect(screen.getByRole('link', { name: /tout l.annuaire/i })).toHaveAttribute('href', '/paroisses');
  });

  it('compte les diocèses et les paroisses', async () => {
    renderApp(<DirectoryStats />);

    expect(await screen.findByText('2 diocèses · 12 paroisses')).toBeInTheDocument();
  });
});
