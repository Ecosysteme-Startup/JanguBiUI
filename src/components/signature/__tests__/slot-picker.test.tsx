import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SlotPicker } from '../slot-picker';

const slots = [
  { id: 1, startsAt: '2026-09-26T16:00:00', priest: 'A. Ndiaye', available: true },
  { id: 2, startsAt: '2026-09-26T16:40:00', priest: 'A. Ndiaye', available: false },
];

describe('SlotPicker', () => {
  it('sélectionne un créneau libre et désactive un créneau complet', async () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={slots} selectedId={null} onSelect={onSelect} label="Créneaux du samedi" />);
    expect(screen.getByRole('button', { name: /16 h 40.*Complet/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /16 h.*A\. Ndiaye/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
