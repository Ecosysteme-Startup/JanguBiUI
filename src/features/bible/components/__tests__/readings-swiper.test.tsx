import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReadingsSwiper } from '../readings-swiper';

const mockReadings = [
  {
    id: 1,
    type: 'lecture1',
    citation: 'Is 55, 10-11',
    text: '<p>Contenu première lecture</p>',
    raw_metadata: {
      titre: '« Comme la pluie et la neige descendent des cieux »',
      intro_lue: 'Lecture du livre du prophète Isaïe',
      refrain_psalmique: null,
      verset_evangile: null,
    },
    matched_verses: [],
  },
  {
    id: 2,
    type: 'psaume',
    citation: 'Ps 33',
    text: '<p>Contenu du psaume</p>',
    raw_metadata: {
      titre: null,
      intro_lue: null,
      refrain_psalmique: '<p><strong>Mon refrain HTML</strong></p>',
      verset_evangile: null,
    },
    matched_verses: [],
  },
  {
    id: 3,
    type: 'gospel',
    citation: 'Lc 6, 36-38',
    text: "<p>Contenu de l'évangile</p>",
    raw_metadata: {
      titre: '« Soyez miséricordieux »',
      intro_lue: 'Évangile de Jésus Christ selon saint Luc',
      refrain_psalmique: null,
      verset_evangile:
        '<p><strong>Alléluia.</strong> Soyez miséricordieux.</p>',
    },
    matched_verses: [],
  },
];

describe('ReadingsSwiper', () => {
  test('renders a tab button for each reading with normalized label', () => {
    render(<ReadingsSwiper readings={mockReadings} fontSize={16} />);

    expect(
      screen.getByRole('tab', { name: 'Première Lecture' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Psaume' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Évangile' })).toBeInTheDocument();
  });

  test('shows titre when raw_metadata has titre', () => {
    render(<ReadingsSwiper readings={mockReadings} fontSize={16} />);

    expect(
      screen.getByText('« Comme la pluie et la neige descendent des cieux »'),
    ).toBeInTheDocument();
    expect(screen.getByText('« Soyez miséricordieux »')).toBeInTheDocument();
  });

  test('shows intro_lue when raw_metadata has intro_lue', () => {
    render(<ReadingsSwiper readings={mockReadings} fontSize={16} />);

    expect(
      screen.getByText('Lecture du livre du prophète Isaïe'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Évangile de Jésus Christ selon saint Luc'),
    ).toBeInTheDocument();
  });

  test('renders refrain psalmique as HTML (not raw tags)', () => {
    render(<ReadingsSwiper readings={mockReadings} fontSize={16} />);

    // Text inside the <strong> tag should be visible
    expect(screen.getByText('Mon refrain HTML')).toBeInTheDocument();
    // Literal HTML tags must not appear as text
    expect(
      screen.queryByText('<strong>Mon refrain HTML</strong>'),
    ).not.toBeInTheDocument();
    // The "Refrain" label should be present
    expect(screen.getByText('Refrain')).toBeInTheDocument();
  });

  test('does not show refrain block when raw_metadata has no refrain', () => {
    render(<ReadingsSwiper readings={[mockReadings[0]]} fontSize={16} />);

    expect(screen.queryByText('Refrain')).not.toBeInTheDocument();
  });

  test('shows verset_evangile HTML for gospel reading', () => {
    render(<ReadingsSwiper readings={mockReadings} fontSize={16} />);

    // The verset_evangile renders as HTML — multiple elements can contain the same text
    // (the <strong> and its parent <p> both contain "Alléluia.")
    expect(screen.getAllByText(/alléluia/i).length).toBeGreaterThan(0);
    expect(document.body.innerHTML).toContain('Soyez miséricordieux');
  });

  test('shows empty state message when readings array is empty', () => {
    render(<ReadingsSwiper readings={[]} fontSize={16} />);

    expect(screen.getByText(/aucune lecture/i)).toBeInTheDocument();
  });

  test('first tab is active by default', () => {
    render(<ReadingsSwiper readings={mockReadings} fontSize={16} />);

    const firstTab = screen.getByRole('tab', { name: 'Première Lecture' });
    expect(firstTab.className).toContain('text-primary');
  });

  test('clicking a tab does not throw', async () => {
    render(<ReadingsSwiper readings={mockReadings} fontSize={16} />);

    const psalmeTab = screen.getByRole('tab', { name: 'Psaume' });
    await userEvent.click(psalmeTab);
    // scrollTo is not natively supported in jsdom, but the click must not throw
    expect(psalmeTab).toBeInTheDocument();
  });
});
