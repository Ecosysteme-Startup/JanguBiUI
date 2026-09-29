import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Switch } from '../switch';

describe('Switch', () => {
  it('est un interrupteur nommé qui bascule au clavier', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} label="Rappels SMS" />);
    const control = screen.getByRole('switch', { name: 'Rappels SMS' });
    expect(control).toHaveAttribute('aria-checked', 'false');
    control.focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
