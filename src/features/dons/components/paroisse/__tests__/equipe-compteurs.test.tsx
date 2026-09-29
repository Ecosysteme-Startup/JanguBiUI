import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ids } from '@/testing/mocks/db';
import { reinitialiserV1Complements } from '@/testing/mocks/handlers/v1-complements';
import { renderApp } from '@/testing/test-utils';

import { EquipeCompteurs } from '../equipe-compteurs';

beforeEach(() => reinitialiserV1Complements());

describe('Équipe des compteurs (compléments V1)', () => {
  it('liste les compteurs habilités, en ajoute un et en retire un', async () => {
    const user = userEvent.setup();
    renderApp(<EquipeCompteurs nodeId={ids.saintDominique} />);
    const liste = await screen.findByRole('list', {
      name: 'Compteurs habilités',
    });
    expect(await within(liste).findByText('Jean Diouf')).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: 'Ajouter un compteur' }),
      'Marie Sarr',
    );
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(await within(liste).findByText('Marie Sarr')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Retirer Jean Diouf' }),
    );
    await vi.waitFor(() =>
      expect(within(liste).queryByText('Jean Diouf')).toBeNull(),
    );
  });
});
