import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { LiturgyReading } from '../../api/get-liturgy-today';
import { ReadingsSwiper, readingHtml } from '../readings-swiper';

// Lectures au format V1 (apps/liturgy/selectors.py → _reading).
const aelf: LiturgyReading[] = [
  {
    type: 'lecture_1',
    citation: 'Is 55, 10-11',
    text: '<p>Contenu <strong>première</strong> lecture</p>',
    verses: [],
  },
  {
    type: 'psaume',
    citation: 'Ps 33',
    text: '<p>Contenu du psaume</p>',
    verses: [],
  },
  {
    type: 'evangile',
    citation: 'Lc 6, 36-38',
    text: "<p>Contenu de l'évangile</p>",
    verses: [],
  },
];

// Source `crampon_refs` : pas de texte AELF, versets de la Bible locale.
const crampon: LiturgyReading = {
  type: 'evangile',
  citation: 'Mt 7, 21',
  text: null,
  verses: [
    {
      book: 'Matthieu',
      chapter: 7,
      number: 21,
      text: 'Ce ne sont pas ceux qui me disent : Seigneur, Seigneur !',
    },
  ],
};

describe('ReadingsSwiper', () => {
  test('un onglet par lecture, libellé normalisé', () => {
    render(<ReadingsSwiper readings={aelf} fontSize={16} />);

    expect(
      screen.getByRole('tab', { name: 'Première Lecture' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Psaume' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Évangile' })).toBeInTheDocument();
  });

  test('le texte AELF est rendu en HTML (pas de balises visibles)', () => {
    render(<ReadingsSwiper readings={aelf} fontSize={16} />);

    expect(screen.getByText('première')).toBeInTheDocument();
    expect(screen.queryByText(/<strong>/)).not.toBeInTheDocument();
  });

  test('source crampon_refs : les versets locaux remplacent le texte', () => {
    render(<ReadingsSwiper readings={[crampon]} fontSize={16} />);

    expect(screen.getByText('Mt 7, 21')).toBeInTheDocument();
    expect(document.body.innerHTML).toContain('Seigneur, Seigneur !');
  });

  test('readingHtml échappe le texte des versets', () => {
    const html = readingHtml({
      ...crampon,
      verses: [{ book: 'Mt', chapter: 1, number: 1, text: '<b>x</b>' }],
    });
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  test('état vide sans lecture', () => {
    render(<ReadingsSwiper readings={[]} fontSize={16} />);

    expect(screen.getByText(/aucune lecture/i)).toBeInTheDocument();
  });

  test('le premier onglet est actif par défaut', () => {
    render(<ReadingsSwiper readings={aelf} fontSize={16} />);

    const firstTab = screen.getByRole('tab', { name: 'Première Lecture' });
    expect(firstTab.className).toContain('text-primary');
  });

  test('cliquer un onglet ne lève pas d’erreur', async () => {
    render(<ReadingsSwiper readings={aelf} fontSize={16} />);

    const psalmeTab = screen.getByRole('tab', { name: 'Psaume' });
    await userEvent.click(psalmeTab);
    expect(psalmeTab).toBeInTheDocument();
  });
});
