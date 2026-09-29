import { render, screen } from '@testing-library/react';

import { Stepper } from '../stepper';

describe('Stepper', () => {
  it('coupe les libellés longs dans leur colonne au lieu de déborder à 320 px (A11Y-15)', () => {
    render(<Stepper label="Étapes" steps={['Votre compte', 'Votre paroisse', 'Récapitulatif et consentements']} current={1} />);
    expect(screen.getByRole('list', { name: 'Étapes' }).children[1]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Récapitulatif et consentements')).toHaveClass('break-words', 'hyphens-auto');
  });
});
