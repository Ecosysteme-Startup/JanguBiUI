import { render, screen } from '@testing-library/react';

import type { DocumentStatus } from '../../types';
import { DocumentStatusBadge } from '../document-status-badge';

describe('DocumentStatusBadge (statuts réels apps/documents)', () => {
  const statuses: { status: DocumentStatus; expectedLabel: string }[] = [
    { status: 'submitted', expectedLabel: 'Soumise' },
    { status: 'under_verification', expectedLabel: 'En vérification' },
    { status: 'info_requested', expectedLabel: 'Complément demandé' },
    { status: 'ready_for_pickup', expectedLabel: 'Prêt à retirer' },
    { status: 'collected', expectedLabel: 'Retiré' },
    { status: 'rejected', expectedLabel: 'Refusée' },
    { status: 'cancelled', expectedLabel: 'Annulée' },
  ];

  statuses.forEach(({ status, expectedLabel }) => {
    test(`libellé du statut « ${status} »`, () => {
      render(<DocumentStatusBadge status={status} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  });

  test('tons : soumise = info, prête = succès, refusée = danger', () => {
    render(
      <>
        <DocumentStatusBadge status="submitted" />
        <DocumentStatusBadge status="ready_for_pickup" />
        <DocumentStatusBadge status="rejected" />
      </>,
    );
    expect(screen.getByText('Soumise')).toHaveClass('text-info');
    expect(screen.getByText('Prêt à retirer')).toHaveClass('text-success');
    expect(screen.getByText('Refusée')).toHaveClass('text-destructive');
  });

  // La couleur n'est jamais le seul signal de statut (WCAG 1.4.1).
  test('une icône accompagne le libellé', () => {
    render(<DocumentStatusBadge status="ready_for_pickup" />);
    expect(
      screen.getByText('Prêt à retirer').querySelector('svg'),
    ).toBeInTheDocument();
  });
});
