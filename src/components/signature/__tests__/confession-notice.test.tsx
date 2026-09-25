import { render, screen } from '@testing-library/react';

import { ConfessionNotice } from '../confession-notice';
import { EncryptionBadge } from '../encryption-badge';

describe('Messagerie : bandeau et confidentialité', () => {
  it('rappelle que la confession ne se fait pas par message', () => {
    render(<ConfessionNotice bookingHref="/app/confession" />);
    expect(screen.getByRole('note')).toHaveTextContent('La confession ne se fait pas par message.');
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute('href', '/app/confession');
  });
  it('n’affirme pas un chiffrement de bout en bout (ADR-014)', () => {
    render(<EncryptionBadge correspondent="l'Abbé Ndiaye" />);
    expect(screen.queryByText(/bout en bout/i)).not.toBeInTheDocument();
    expect(screen.getByText(/aucun administrateur/)).toBeInTheDocument();
  });
});
