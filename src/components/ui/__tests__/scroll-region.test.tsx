import { render, screen } from '@testing-library/react';

import { Table, Td, Th, Tr } from '../table';

const overflowing = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
};

const Offices = () => (
  <Table label="Offices actifs, défilement horizontal">
    <thead>
      <tr>
        <Th>Office</Th>
        <Th>Titulaire</Th>
      </tr>
    </thead>
    <tbody>
      <Tr>
        <Td>Curé</Td>
        <Td>Joseph Sarr</Td>
      </Tr>
    </tbody>
  </Table>
);

describe('Table en petite largeur (A11Y-08, A11Y-12)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('devient une région nommée et focalisable quand elle déborde', () => {
    overflowing(720, 343);
    render(<Offices />);
    const region = screen.getByRole('region', { name: 'Offices actifs, défilement horizontal' });
    expect(region).toHaveAttribute('tabindex', '0');
    // relative : le texte sr-only d'un en-tête ne s'échappe plus de la zone et n'élargit plus la page.
    expect(region).toHaveClass('relative', 'overflow-x-auto');
    expect(region).toContainElement(screen.getByRole('table'));
  });

  it('reste un simple bloc, sans arrêt de tabulation, quand tout tient', () => {
    overflowing(600, 600);
    render(<Offices />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByRole('table').parentElement).not.toHaveAttribute('tabindex');
  });
});
