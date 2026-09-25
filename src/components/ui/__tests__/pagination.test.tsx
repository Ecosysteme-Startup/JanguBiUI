import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Pagination } from '../pagination';

describe('Pagination', () => {
  it('affiche la plage et change de page', async () => {
    const onChange = vi.fn();
    render(<Pagination offset={0} limit={10} total={17} onChange={onChange} />);
    expect(screen.getByText('1–10 sur 17')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(onChange).toHaveBeenCalledWith(10);
  });
  it('disparaît quand tout tient sur une page', () => {
    const { container } = render(<Pagination offset={0} limit={10} total={4} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
