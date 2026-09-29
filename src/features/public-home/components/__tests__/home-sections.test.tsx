import { render, screen } from '@testing-library/react';

import { HomeHero } from '@/features/public-home/components/home-hero';
import { HomeOffer } from '@/features/public-home/components/home-offer';
import { HomeServices } from '@/features/public-home/components/home-services';

describe('Accueil public', () => {
  it('propose la création de compte et la Parole du jour sans compte', () => {
    render(<HomeHero parole={(className) => <div className={className}>Parole</div>} masses={(className) => <div className={className}>Messes</div>} />);

    expect(screen.getByRole('heading', { level: 1, name: /la parole et votre paroisse, au même endroit/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /créer un compte gratuit/i })).toHaveAttribute('href', '/inscription');
    expect(screen.getByRole('link', { name: /lire la parole du jour/i })).toHaveAttribute('href', '/parole');
    expect(screen.getByText('Parole')).toBeInTheDocument();
    expect(screen.getByText('Messes')).toBeInTheDocument();
  });

  it('présente les quatre services et rappelle les règles de l’Église', () => {
    render(<HomeServices paroleVisual={null} parishVisual={null} />);

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(screen.getAllByText(/la confession ne se fait pas par message/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/original papier/i).length).toBeGreaterThan(0);
  });

  it('ne promet jamais un chiffrement de bout en bout (ADR-014)', () => {
    const { container } = render(
      <>
        <HomeServices paroleVisual={null} parishVisual={null} />
        <HomeOffer />
      </>,
    );

    expect(container.textContent).not.toMatch(/bout en bout/i);
    expect(screen.getAllByText(/aucun administrateur/i).length).toBeGreaterThan(0);
  });

  it('mène les paroisses vers l’offre et le formulaire de contact', () => {
    render(<HomeOffer />);

    expect(screen.getByRole('link', { name: /présenter jàngu bi à ma paroisse/i })).toHaveAttribute('href', '/pour-les-paroisses');
    expect(screen.getByRole('link', { name: /nous écrire/i })).toHaveAttribute('href', '/pour-les-paroisses#contact');
  });
});
