import { render, screen } from '@testing-library/react';

import { LiturgicalBanner } from '../liturgical-banner';

describe('LiturgicalBanner', () => {
  it('affiche la date, le temps, la couleur et un lien vers la Parole', () => {
    render(
      <LiturgicalBanner
        href="/parole"
        data={{ date: '2026-09-24', celebration: 'Jeudi de la 25e semaine du temps ordinaire', color: 'vert', references: ['Ec 1, 2-11', 'Lc 9, 7-9'] }}
      />,
    );
    expect(screen.getByText('Jeudi 24 septembre 2026')).toBeInTheDocument();
    expect(screen.getByText('Jour 267')).toBeInTheDocument();
    expect(screen.getByTitle('Couleur liturgique du jour : vert')).toHaveTextContent('Vert');
    expect(screen.getByRole('link', { name: 'Ec 1, 2-11 · Lc 9, 7-9' })).toHaveAttribute('href', '/parole');
  });
});
