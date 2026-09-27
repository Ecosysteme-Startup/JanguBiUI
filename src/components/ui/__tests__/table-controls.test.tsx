import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Breadcrumbs } from '../breadcrumbs';
import { Checkbox } from '../checkbox';
import { FilterPill } from '../filter-pill';
import { Pagination } from '../pagination';

describe('Primitives de table (lot E)', () => {
  it('Checkbox : case nue nommée, partielle quand demandé', () => {
    render(<Checkbox label="Tout sélectionner" indeterminate readOnly />);
    const box = screen.getByRole('checkbox', { name: 'Tout sélectionner' }) as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
  });

  it('Pagination : nom après la plage et chevrons seuls, toujours nommés', () => {
    render(<Pagination offset={0} limit={12} total={17} onChange={() => {}} noun="demandes" nounPosition="after" compact />);
    expect(screen.getByText('1 à 12 sur 17 demandes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page suivante' })).not.toHaveTextContent('Suivant');
  });

  it('Breadcrumbs : chevron de retour avant le premier élément', () => {
    const { container } = render(<Breadcrumbs back separator="slash" items={[{ label: 'Demandes d’actes', href: '/x' }, { label: 'JB-1' }]} />);
    expect(container.querySelectorAll('li:first-child svg')).toHaveLength(1);
    expect(screen.getByText('JB-1')).toHaveAttribute('aria-current', 'page');
  });

  it('FilterPill : retire le filtre actif par sa croix', async () => {
    const onClear = vi.fn();
    render(
      <FilterPill id="type" label="Type d’acte" allLabel="Type d’acte" value="bapteme" onChange={() => {}} onClear={onClear}>
        <option value="bapteme">Baptême</option>
      </FilterPill>,
    );
    await userEvent.click(screen.getByRole('button', { name: /retirer le filtre type d’acte/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
