import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CountUp } from '../count-up';
import { Equalizer } from '../equalizer';
import { Reveal, Stagger, StaggerItem } from '../reveal';

// Chaque store zustand repart de son état initial après chaque test (__mocks__/zustand.ts).
vi.mock('zustand');

describe('langage de mouvement', () => {
  it('Reveal et Stagger ne masquent jamais le contenu au premier rendu', () => {
    render(
      <>
        <Reveal>Bloc révélé</Reveal>
        <Stagger>
          <StaggerItem>Carte 1</StaggerItem>
        </Stagger>
      </>,
    );
    expect(screen.getByText('Bloc révélé')).toBeVisible();
    expect(
      screen.getByText('Bloc révélé').getAttribute('style') ?? '',
    ).not.toMatch(/opacity:\s*0/);
    expect(screen.getByText('Carte 1')).toBeVisible();
  });

  it('CountUp affiche la valeur finale formatée (rendu serveur / sans animation)', () => {
    render(<CountUp to={2400} format={(v) => `${(v / 1000).toFixed(1)}k+`} />);
    expect(screen.getByText('2.4k+')).toBeInTheDocument();
  });

  it("Equalizer rend 4 barres décoratives cachées aux lecteurs d'écran", () => {
    const { container } = render(<Equalizer playing />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-hidden');
    expect(root.children).toHaveLength(4);
  });
});
