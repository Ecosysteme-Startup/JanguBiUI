import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CountUp } from '../count-up';
import { Equalizer } from '../equalizer';
import { Reveal, Stagger, StaggerItem } from '../reveal';

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

  it("Tabs : l'indicateur à ressort suit l'onglet actif", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Aujourd&apos;hui</TabsTrigger>
          <TabsTrigger value="b">Bible</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Contenu A</TabsContent>
        <TabsContent value="b">Contenu B</TabsContent>
      </Tabs>,
    );
    const a = screen.getByRole('tab', { name: "Aujourd'hui" });
    const b = screen.getByRole('tab', { name: 'Bible' });
    expect(a.querySelector('[aria-hidden]')).not.toBeNull();
    expect(b.querySelector('[aria-hidden]')).toBeNull();

    await user.click(b);
    expect(screen.getByText('Contenu B')).toBeVisible();
    expect(b.querySelector('[aria-hidden]')).not.toBeNull();
    expect(a.querySelector('[aria-hidden]')).toBeNull();
  });
});
