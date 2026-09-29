import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetParoissesMocks } from '@/testing/mocks/handlers/paroisses';
import { renderApp } from '@/testing/test-utils';

import { OtherParishesAnnouncements } from '../other-parishes-announcements';

beforeEach(() => resetParoissesMocks());

describe('Autres paroisses (paroisses multiples)', () => {
  it('liste les annonces des paroisses secondaires, filtrables par paroisse', async () => {
    const user = userEvent.setup();
    renderApp(<OtherParishesAnnouncements />);
    const section = await screen.findByRole('region', {
      name: 'Autres paroisses',
    });
    expect(within(section).getByText(/sans notification/)).toBeInTheDocument();
    expect(
      await within(section).findByText('Ouverture du mois du Rosaire'),
    ).toBeInTheDocument();
    expect(
      within(section).getByText('Kermesse paroissiale'),
    ).toBeInTheDocument();
    await user.click(
      within(section).getByRole('radio', { name: 'Saint-Pierre des Baobabs' }),
    );
    await vi.waitFor(() =>
      expect(
        within(section).queryByText('Ouverture du mois du Rosaire'),
      ).toBeNull(),
    );
    expect(
      within(section).getByText('Kermesse paroissiale'),
    ).toBeInTheDocument();
  });
});
