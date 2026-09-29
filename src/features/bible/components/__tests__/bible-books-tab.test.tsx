import { renderApp, screen, waitFor } from '@/testing/test-utils';

import {
  reinitialiserSignaux,
  signauxEnAttente,
} from '../../utils/signaux-lecture';
import { BibleBooksTab } from '../bible-books-tab';

describe('BibleBooksTab', () => {
  beforeEach(() => reinitialiserSignaux());
  afterEach(() => reinitialiserSignaux());

  test('lien profond « Reprendre » : ouvre Luc 9 et signale la lecture', async () => {
    renderApp(
      <BibleBooksTab cible={{ livreId: 49, chapitre: 9, verset: 9 }} />,
    );
    expect(await screen.findByText('Luc - Chapitre 9')).toBeInTheDocument();
    expect(
      await screen.findByText(/J'ai fait décapiter Jean/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(signauxEnAttente()).toEqual([
        expect.objectContaining({
          type: 'lu',
          livre_id: 49,
          chapitre: 9,
          termine: false,
        }),
      ]),
    );
  });
});
