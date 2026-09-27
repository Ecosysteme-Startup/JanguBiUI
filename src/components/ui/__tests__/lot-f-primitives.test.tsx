import { render, screen } from '@testing-library/react';

import { CapabilityChips } from '@/components/signature/capability-chips';

import { Button } from '../button';
import { Modal, ModalFooter } from '../modal';
import { Switch } from '../switch';

describe('Primitives demandées par le lot F', () => {
  it('Modal « form » : pied en bande avec aide et actions', async () => {
    render(
      <Modal open onOpenChange={() => {}} title="Ajouter un horaire" size="form">
        <form>
          <ModalFooter hint="Chaque mercredi.">
            <Button type="submit">Ajouter l’horaire</Button>
          </ModalFooter>
        </form>
      </Modal>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Ajouter un horaire' });
    expect(dialog).toHaveClass('max-w-[600px]');
    expect(screen.getByText('Chaque mercredi.')).toBeInTheDocument();
  });

  it('Switch « lg » : 44 × 26', () => {
    render(<Switch size="lg" checked onCheckedChange={() => {}} label="Notifier les fidèles" />);
    expect(screen.getByRole('switch', { name: 'Notifier les fidèles' })).toHaveClass('w-11', 'h-[26px]');
  });

  it('CapabilityChips : n étiquettes puis « +n » explicité', () => {
    render(<CapabilityChips capabilities={['annonces.publier', 'horaires.gerer', 'actes.traiter']} max={2} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/: Actes/)).toHaveClass('sr-only');
  });
});
