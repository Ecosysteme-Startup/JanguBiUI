import { render, screen } from '@testing-library/react';

import { HomeFaq } from '@/features/public-home/components/home-faq';
import { HomeHero } from '@/features/public-home/components/home-hero';
import { HomeTrust } from '@/features/public-home/components/home-trust';
import { HomeUses } from '@/features/public-home/components/home-uses';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

describe('Accueil public', () => {
  it('propose l’inscription et l’annuaire', () => {
    render(<HomeHero stats={<span>2 diocèses · 12 paroisses</span>} />);

    expect(screen.getByRole('heading', { level: 1, name: /chaque jour la parole/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /s.inscrire/i })).toHaveAttribute('href', '/inscription');
    expect(screen.getByRole('link', { name: /trouver ma paroisse/i })).toHaveAttribute('href', '/paroisses');
    expect(screen.getByText('2 diocèses · 12 paroisses')).toBeInTheDocument();
  });

  it('rappelle les règles de l’Église : pas de confession par message, pas d’acte en PDF', () => {
    render(
      <>
        <HomeUses />
        <HomeTrust />
      </>,
    );

    expect(screen.getAllByText(/la confession ne se fait/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/aucun acte n.est délivré en pdf/i)).toBeInTheDocument();
  });

  it('ne promet jamais un chiffrement de bout en bout (ADR-014)', () => {
    const { container } = render(
      <>
        <HomeUses />
        <HomeTrust />
        <HomeFaq />
      </>,
    );

    expect(container.textContent).not.toMatch(/bout en bout/i);
    expect(screen.getAllByText(/aucun administrateur/i).length).toBeGreaterThan(0);
  });
});
