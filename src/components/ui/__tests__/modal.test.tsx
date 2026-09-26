import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { Button } from '../button';
import { ConfirmDialog } from '../confirm-dialog';
import { Modal } from '../modal';

const ControlledModal = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Terminer la nomination de Joseph Sarr</Button>
      <Modal open={open} onOpenChange={setOpen} title="Terminer la nomination">
        <p>Cette action est définitive.</p>
      </Modal>
    </>
  );
};

describe('Modal contrôlée', () => {
  it('rend le focus au déclencheur après Échap (A11Y-05)', async () => {
    const user = userEvent.setup();
    render(<ControlledModal />);
    const trigger = screen.getByRole('button', { name: /Terminer la nomination de Joseph Sarr/ });

    trigger.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Terminer la nomination' });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('rend le focus au déclencheur après « Annuler » dans une confirmation', async () => {
    const user = userEvent.setup();
    const Confirm = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Retirer</Button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Retirer ?"
            confirmLabel="Retirer définitivement"
            onConfirm={() => setOpen(false)}
          />
        </>
      );
    };
    render(<Confirm />);
    const trigger = screen.getByRole('button', { name: 'Retirer' });

    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
