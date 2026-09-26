import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { SegmentedControl } from '../segmented-control';

const VIEWS = [
  ['mois', 'Mois'],
  ['semaine', 'Semaine'],
  ['liste', 'Liste'],
] as const;

const Agenda = () => {
  const [view, setView] = React.useState<(typeof VIEWS)[number][0]>('mois');
  return <SegmentedControl label="Affichage" value={view} options={VIEWS} onChange={setView} />;
};

describe('SegmentedControl (motif APG radio group, A11Y-11)', () => {
  it('ne compte qu’un arrêt de tabulation et change de choix aux flèches', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Agenda />
        <button type="button">Après</button>
      </>,
    );
    await user.tab();
    const mois = screen.getByRole('radio', { name: 'Mois' });
    expect(mois).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    const semaine = screen.getByRole('radio', { name: 'Semaine' });
    expect(semaine).toHaveFocus();
    expect(semaine).toHaveAttribute('aria-checked', 'true');
    expect(mois).toHaveAttribute('aria-checked', 'false');

    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: 'Liste' })).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{ArrowRight}');
    expect(mois).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Liste' })).toHaveFocus();

    // Un seul arrêt : Tab sort du groupe.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Après' })).toHaveFocus();
  });
});
